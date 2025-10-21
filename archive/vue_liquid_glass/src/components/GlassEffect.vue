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
// const glassMode = inject('glassMode');

const containerRef = ref(null);
const canvasWrapperRef = ref(null);
const canvasRef = ref(null);

let renderer, gl, camera, scene, mesh, program;
let resizeObserver;
let animationId; // 用于控制动画循环
let isVisible = true; // 可见性标志
let cleanupFunctions = []; // 清理函数数组

// ===================================================================
// macOS/iOS检测和兼容性处理 (暂时注释掉)
// ===================================================================
// const isMacOS = () => {
//   return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
// };

// const isIOS = () => {
//   return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// };

// const supportsWebGL = () => {
//   try {
//     const canvas = document.createElement('canvas');
//     return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
//   } catch {
//     return false;
//   }
// };

// 检查是否应该使用WebGL版本
const shouldUseWebGL = () => {
  return true; // 强制使用 WebGL
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

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;

    // 创建液态波浪效果 - 多个波浪叠加
    float wave1 = sin(uv.x * 6.28 * 2.0 + uTime * 0.5) * 0.05;
    float wave2 = cos(uv.y * 6.28 * 3.0 + uTime * 0.3) * 0.05;
    float wave3 = sin((uv.x + uv.y) * 6.28 * 1.5 + uTime * 0.2) * 0.03;

    vec2 distortedUv = uv + vec2(wave1 + wave3, wave2 + wave3) * uDistortion;

    vec4 background = texture2D(tBackground, distortedUv);

    // 添加鼠标交互高光
    float distToMouse = distance(uv, uMouse);
    float highlight = 0.3 * pow(1.0 - clamp(distToMouse, 0.0, 1.0), 4.0);

    // 边缘光晕
    float edgeFactor = smoothstep(0.0, 0.1, vUv.x) * (1.0 - smoothstep(0.9, 1.0, vUv.x)) *
                     smoothstep(0.0, 0.1, vUv.y) * (1.0 - smoothstep(0.9, 1.0, vUv.y));
    float edgeHighlight = 0.2 * pow(1.0 - edgeFactor, 8.0);

    vec3 finalColor = background.rgb + highlight + edgeHighlight;

    gl_FragColor = vec4(finalColor, background.a * 0.9);
  }
`;

// --- WebGL 初始化和渲染循环 ---

onMounted(() => {
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
    const bgColor = bodyStyle.backgroundColor;
    const gradient = ctx.createLinearGradient(0, 0, canvas2d.width, canvas2d.height);
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    gradient.addColorStop(1, bgColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas2d.width, canvas2d.height);      const texture = new window.ogl.Texture(gl, { image: canvas2d });
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
  position: sticky;
  top: clamp(16px, 4vw, 36px);
  z-index: 120;
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
  /* 移除 backdrop-filter，使用纯渐变 */
  backdrop-filter: none;
  -webkit-backdrop-filter: none;

  /* 背景渐变 - 匹配原有导航栏样式 */
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 30%, rgba(255, 255, 255, 0.12) 70%, rgba(255, 255, 255, 0.18) 100%),
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
  background-size: 200% 200%, 100% 100%, 100% 100%;

  /* 边框效果 */
  border: 1px solid rgba(255, 255, 255, 0.3);

  /* 移除 box-shadow，使用导航栏的 */

  /* 确保在macOS上正确渲染 */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  will-change: transform;
}

.glass-container.glass-effect-css-only .content-wrapper .glass-nav {
  background-color: var(--nav-surface-color);
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
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 30%, rgba(255, 255, 255, 0.08) 70%, rgba(255, 255, 255, 0.15) 100%),
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.06) 0%, transparent 50%);
  background-size: 200% 200%, 100% 100%, 100% 100%;
  border: 1px solid rgba(255, 255, 255, 0.3);
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
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
</style>
