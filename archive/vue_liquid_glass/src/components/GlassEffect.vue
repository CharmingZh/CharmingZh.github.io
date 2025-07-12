<template>
  <div class="glass-container" ref="containerRef">
    <div class="canvas-wrapper" ref="canvasWrapperRef">
      <canvas ref="canvasRef"></canvas>
    </div>
    <div class="content-wrapper">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Renderer, Camera, Transform, Mesh, Plane, Program } from 'ogl';

// 定义组件的 props，允许外部传入圆角和扭曲强度等参数
const props = defineProps({
  borderRadius: { type: String, default: '15px' },
  distortion: { type: Number, default: 0.05 }, // 扭曲强度
  padding: { type: String, default: '25px' }
});

const containerRef = ref(null);
const canvasWrapperRef = ref(null);
const canvasRef = ref(null);

let renderer, gl, camera, scene, mesh, program;
let resizeObserver;

// --- GLSL 着色器代码 ---
// 这是效果的核心，运行在 GPU 上

const vertexShader = /* glsl */ `
  attribute vec2 uv;
  attribute vec3 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D tBackground;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uDistortion;

  // 2D 随机/哈希函数
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  // 2D 噪声函数 (Value Noise)
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
  }

  void main() {
    // 将屏幕像素坐标转换为 [0, 1] 范围
    vec2 screenUv = gl_FragCoord.xy / uResolution.xy;

    // --- 非均匀散射 (核心) ---
    // 1. 创建一个动态的、流动的噪声场作为扭曲图
    vec2 noiseUv = screenUv * vec2(1.0, uResolution.y / uResolution.x) * 5.0;
    float noiseValue = noise(noiseUv + uTime * 0.1);

    // 2. 使用噪声来置换 (扭曲) 背景纹理的采样坐标
    vec2 distortedUv = screenUv + vec2(noiseValue - 0.5) * uDistortion;

    // 3. 采样被扭曲后的背景
    vec4 background = texture2D(tBackground, distortedUv);

    // --- 交互式高光 ---
    float distToMouse = distance(screenUv, uMouse);
    float highlight = 0.4 * pow(1.0 - clamp(distToMouse, 0.0, 1.0), 8.0);

    // --- 边缘光晕 ---
    float edgeFactor = smoothstep(0.0, 0.1, vUv.x) * (1.0 - smoothstep(0.9, 1.0, vUv.x)) *
                     smoothstep(0.0, 0.1, vUv.y) * (1.0 - smoothstep(0.9, 1.0, vUv.y));
    float edgeHighlight = 0.5 * pow(1.0 - edgeFactor, 10.0);

    // 最终颜色混合
    vec3 finalColor = background.rgb + highlight + edgeHighlight;

    gl_FragColor = vec4(finalColor, background.a * 0.95);
  }
`;

// --- WebGL 初始化和渲染循环 ---

onMounted(() => {
  const container = containerRef.value;
  const canvas = canvasRef.value;
  renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
  gl = renderer.gl;

  camera = new Camera();
  camera.position.z = 1;
  scene = new Transform();

  const geometry = new Plane(gl);

  // 关键：创建 body 的一个副本作为背景纹理
  // 注意：这是一种简化方法，它只捕捉 body 的背景，而非其后的 DOM 元素
  const backgroundTexture = new Promise((resolve) => {
    const canvas2d = document.createElement('canvas');
    const ctx = canvas2d.getContext('2d');
    const bodyStyle = window.getComputedStyle(document.body);
    canvas2d.width = window.innerWidth;
    canvas2d.height = window.innerHeight;

    // 绘制 body 的背景渐变
    // 此处需要手动模拟，或使用 html2canvas 等库
    // 为了简单，我们直接用 CSS 的背景
    // 这里我们先用一个占位符颜色，之后再想办法绘制真实背景
    ctx.fillStyle = bodyStyle.backgroundColor; // 这是一个近似值
    ctx.fillRect(0, 0, canvas2d.width, canvas2d.height);
    // 这里可以添加更复杂的绘制逻辑来模拟 body::before 的渐变

    const texture = new window.ogl.Texture(gl, { image: canvas2d });
    resolve(texture);
  });


  backgroundTexture.then(texture => {
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        tBackground: { value: texture },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
        uTime: { value: 0 },
        uMouse: { value: [0.5, 0.5] },
        uDistortion: { value: props.distortion },
      },
      transparent: true,
    });

    mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    // 监听鼠标移动
    window.addEventListener('mousemove', onMouseMove);

    // 启动渲染循环
    requestAnimationFrame(update);
  });

  // 使用 ResizeObserver 来处理尺寸变化
  resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);
  handleResize(); // 初始尺寸设置
});

onUnmounted(() => {
  // 清理资源
  window.removeEventListener('mousemove', onMouseMove);
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value);
  }
  // 在此处可以添加更多的 OGL 对象销毁逻辑
});

function handleResize() {
  if (!containerRef.value || !renderer) return;
  const rect = containerRef.value.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height);
  camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });

  if (program) {
    program.uniforms.uResolution.value = [rect.width, rect.height];
  }
}

const onMouseMove = (e) => {
  if (program && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    program.uniforms.uMouse.value = [x, y];
  }
}

function update(t) {
  requestAnimationFrame(update);
  if (!program) return;

  program.uniforms.uTime.value = t * 0.0001;
  renderer.render({ scene, camera });
}

// 监听 props 变化并更新 shader
watch(() => props.distortion, (newValue) => {
  if (program) {
    program.uniforms.uDistortion.value = newValue;
  }
});

</script>

<style scoped>
.glass-container {
  position: relative;
  overflow: hidden;
  border-radius: v-bind(borderRadius);
}

.canvas-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.content-wrapper {
  position: relative;
  z-index: 2;
  padding: v-bind(padding);
  /* 可以根据需要给内容添加一些样式，比如文字阴影让其更清晰 */
  color: var(--text-color);
}
</style>
