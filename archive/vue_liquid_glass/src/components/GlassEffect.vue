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

// 注入全局状态
const glassMode = inject('glassMode');

const containerRef = ref(null);
const canvasWrapperRef = ref(null);
const canvasRef = ref(null);

let renderer, gl, camera, scene, mesh, program;
let resizeObserver;
let animationId; // 用于控制动画循环
let isVisible = true; // 可见性标志
let cleanupFunctions = []; // 清理函数数组

// ===================================================================
// macOS/iOS检测和兼容性处理
// ===================================================================
const isMacOS = () => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
  } catch (e) {
    return false;
  }
};

// 检查是否应该使用WebGL版本
const shouldUseWebGL = () => {
  // 如果是经典模式，强制使用CSS-only
  if (glassMode?.value === 'classic') {
    return false;
  }
  // 高级模式下，检查WebGL支持和平台兼容性
  return supportsWebGL() && !isMacOS() && !isIOS();
};

// ===================================================================
// 性能优化：节流函数
// ===================================================================
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

// ===================================================================
// 性能优化：防抖函数
// ===================================================================
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

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

  // 根据平台选择渲染方式
  if (shouldUseWebGL()) {
    // WebGL版本 - 为桌面浏览器使用
    initializeWebGL();
  } else {
    // CSS-only版本 - 为macOS/iOS优化
    initializeCSSOnly();
  }
});

// ===================================================================
// WebGL版本初始化 (桌面浏览器)
// ===================================================================
const initializeWebGL = () => {
  const container = containerRef.value;
  const canvas = canvasRef.value;

  try {
    renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
    gl = renderer.gl;

    camera = new Camera();
    camera.position.z = 1;
    scene = new Transform();

    const geometry = new Plane(gl);

    // 关键：创建 body 的一个副本作为背景纹理
    const backgroundTexture = new Promise((resolve) => {
      const canvas2d = document.createElement('canvas');
      const ctx = canvas2d.getContext('2d');
      const bodyStyle = window.getComputedStyle(document.body);
      canvas2d.width = window.innerWidth;
      canvas2d.height = window.innerHeight;

      // 绘制 body 的背景渐变
      ctx.fillStyle = bodyStyle.backgroundColor;
      ctx.fillRect(0, 0, canvas2d.width, canvas2d.height);

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

      // 监听鼠标移动 (节流优化)
      const throttledMouseMove = throttle(onMouseMove, 16); // ~60fps
      window.addEventListener('mousemove', throttledMouseMove);

      // 启动渲染循环
      update();

      // 存储清理函数的引用
      cleanupFunctions.push(() => {
        window.removeEventListener('mousemove', throttledMouseMove);
      });
    });
  } catch (error) {
    console.warn('WebGL initialization failed, falling back to CSS-only mode:', error);
    initializeCSSOnly();
  }

  // 使用 ResizeObserver 来处理尺寸变化 (防抖优化)
  const debouncedHandleResize = debounce(handleResize, 100);
  resizeObserver = new ResizeObserver(debouncedHandleResize);
  resizeObserver.observe(container);
  handleResize(); // 初始尺寸设置

  // 使用 IntersectionObserver 来检测可见性，优化性能
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
    });
  }, { threshold: 0.1 });

  visibilityObserver.observe(container);

  cleanupFunctions.push(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    visibilityObserver.disconnect();
  });
};

// ===================================================================
// CSS-only版本初始化 (macOS/iOS优化)
// ===================================================================
const initializeCSSOnly = () => {
  const container = containerRef.value;
  const canvasWrapper = canvasWrapperRef.value;

  // 隐藏canvas，使用纯CSS实现
  if (canvasWrapper) {
    canvasWrapper.style.display = 'none';
  }

  // 为容器添加macOS优化的玻璃效果样式
  container.classList.add('glass-effect-css-only');

  // 添加微妙的动画效果
  const addSubtleAnimation = () => {
    container.style.animation = 'glass-shimmer 8s ease-in-out infinite';
  };

  // 延迟添加动画，避免初始加载时的闪烁
  setTimeout(addSubtleAnimation, 100);

  // 清理函数
  cleanupFunctions.push(() => {
    container.classList.remove('glass-effect-css-only');
    container.style.animation = '';
  });
};

onUnmounted(() => {
  // 停止动画循环
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  // 执行所有清理函数
  cleanupFunctions.forEach(cleanup => cleanup());
  cleanupFunctions.length = 0;

  // 清理WebGL资源
  if (renderer) {
    renderer.destroy();
  }
  if (program) {
    program.destroy();
  }
  if (mesh) {
    mesh.destroy();
  }
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
  if (!isVisible) {
    // 如果不可见，减少更新频率到1fps
    animationId = setTimeout(() => update(performance.now()), 1000);
    return;
  }

  animationId = requestAnimationFrame(update);

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

/* ===================================================================
   macOS/iOS优化的CSS-only玻璃效果
   =================================================================== */
.glass-container.glass-effect-css-only {
  /* 使用现代CSS backdrop-filter创建高质量玻璃效果 */
  backdrop-filter: blur(20px) saturate(180%) contrast(120%);
  -webkit-backdrop-filter: blur(20px) saturate(180%) contrast(120%);

  /* 背景渐变 - 模拟液体玻璃的折射效果 */
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.02) 50%,
    rgba(255, 255, 255, 0.08) 75%,
    rgba(255, 255, 255, 0.12) 100%
  );

  /* 边框效果 */
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -1px 0 rgba(255, 255, 255, 0.1);

  /* 确保在macOS上正确渲染 */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  will-change: transform;
}

/* 微妙的闪烁动画 - 模拟液体流动效果 */
@keyframes glass-shimmer {
  0%, 100% {
    background-position: 0% 50%;
    filter: brightness(1) saturate(1);
  }
  25% {
    background-position: 100% 0%;
    filter: brightness(1.02) saturate(1.05);
  }
  50% {
    background-position: 100% 100%;
    filter: brightness(0.98) saturate(0.95);
  }
  75% {
    background-position: 0% 100%;
    filter: brightness(1.01) saturate(1.02);
  }
}

/* 针对不同macOS版本的优化 */
@supports (-webkit-backdrop-filter: blur(20px)) {
  .glass-container.glass-effect-css-only {
    /* Safari优化的backdrop-filter */
    backdrop-filter: blur(24px) saturate(200%) contrast(130%) brightness(1.1);
    -webkit-backdrop-filter: blur(24px) saturate(200%) contrast(130%) brightness(1.1);
  }
}

/* 深色模式优化 */
[data-theme="dark"] .glass-container.glass-effect-css-only {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.01) 50%,
    rgba(255, 255, 255, 0.05) 75%,
    rgba(255, 255, 255, 0.09) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* 浅色模式优化 */
[data-theme="light"] .glass-container.glass-effect-css-only {
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.05) 0%,
    rgba(0, 0, 0, 0.02) 25%,
    rgba(0, 0, 0, 0.01) 50%,
    rgba(0, 0, 0, 0.03) 75%,
    rgba(0, 0, 0, 0.06) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(16px) saturate(150%) contrast(110%);
  -webkit-backdrop-filter: blur(16px) saturate(150%) contrast(110%);
}
</style>
