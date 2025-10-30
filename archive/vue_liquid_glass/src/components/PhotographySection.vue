<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue';
import exifr from 'exifr';

// 配置：水印文本与强度
const watermarkText = '© CharmingZh';
const lightboxWatermarkOpacity = 0.18; // 大图覆盖

const sectionRef = ref(null);
const images = ref([]);
const loading = ref(true);
const error = ref('');

// Lightbox 状态
const showLightbox = ref(false);
const activeIndex = ref(0);
const exifData = ref(null);
const lightboxBusy = ref(false);
const imageTransitioning = ref(false);

// Canvas 渲染引用
const canvasRef = ref(null);

// 反下载与拷贝：统一阻止
const blockContextMenu = (e) => {
  e.preventDefault();
};

const handleDragStart = (e) => {
  e.preventDefault();
};

// 加载清单（来自 /Photography/manifest.json）
const fetchManifest = async () => {
  try {
    const res = await fetch('/Photography/manifest.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('无法加载图片清单');
    const list = await res.json();
    images.value = Array.isArray(list)
      ? list.map((item) => {
          if (typeof item === 'string') {
            return { src: item, thumb: item };
          }
          // 兼容对象型条目（包含 EXIF 元数据）
          const src = item.src || item.file || item;
          return {
            src,
            thumb: item.thumbnail || item.thumb || item.preview || src,
            meta: buildMeta(item),
          };
        })
      : [];
  } catch (err) {
    error.value = (err && err.message) || '加载图片列表失败';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (sectionRef.value instanceof HTMLElement) {
    sectionRef.value.classList.add('visible');
  }
  window.addEventListener('keydown', handleKeydown, { passive: false });
  fetchManifest();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const openLightbox = async (idx) => {
  activeIndex.value = idx;
  showLightbox.value = true;
  lightboxBusy.value = true;
  try {
    await nextTick();
    await renderActiveToCanvas();
  } finally {
    lightboxBusy.value = false;
  }
};

const closeLightbox = () => {
  showLightbox.value = false;
  exifData.value = null;
  lightboxBusy.value = false;
  imageTransitioning.value = false;
};

const prevImage = async () => {
  if (lightboxBusy.value) return;
  lightboxBusy.value = true;
  activeIndex.value = (activeIndex.value - 1 + images.value.length) % images.value.length;
  try {
    await renderActiveToCanvas();
  } finally {
    lightboxBusy.value = false;
  }
};

const nextImage = async () => {
  if (lightboxBusy.value) return;
  lightboxBusy.value = true;
  activeIndex.value = (activeIndex.value + 1) % images.value.length;
  try {
    await renderActiveToCanvas();
  } finally {
    lightboxBusy.value = false;
  }
};

// 将图片+水印绘制到 Canvas，并读取 EXIF
const renderActiveToCanvas = async () => {
  const item = images.value[activeIndex.value];
  if (!item || !canvasRef.value) {
    imageTransitioning.value = false;
    return;
  }

  imageTransitioning.value = true;
  await nextTick();

  // 获取原图 Blob 并解析 EXIF（若清单已含 meta 则优先使用）
  try {
    const resp = await fetch(item.src, { cache: 'no-cache' });
    const blob = await resp.blob();
    const [exif, dataURL] = await Promise.all([
      item.meta ? Promise.resolve(null) : exifr.parse(blob).catch(() => null),
      blobToDataURL(blob),
    ]);
    exifData.value = item.meta || formatExif(exif);

    const img = await loadImage(dataURL);
    drawWatermarkedImage(canvasRef.value, img, {
      text: watermarkText,
      opacity: lightboxWatermarkOpacity,
    });
  } catch {
    // 渲染失败则最小降级：仅显示图片
    try {
      const img = await loadImage(item.src);
      drawWatermarkedImage(canvasRef.value, img, {
        text: watermarkText,
        opacity: lightboxWatermarkOpacity,
      });
    } catch {
      error.value = '图片加载失败';
    }
  } finally {
    settleImageTransition();
  }
};

const settleImageTransition = () => {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      imageTransitioning.value = false;
    });
  } else {
    imageTransitioning.value = false;
  }
};

const blobToDataURL = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.decoding = 'async';
  img.src = src;
});

// 将图片绘制到 Canvas，并覆盖斜向重复水印
function drawWatermarkedImage(canvas, img, options) {
  const ctx = canvas.getContext('2d');
  const maxW = Math.max(320, window.innerWidth * 0.96);
  const maxH = Math.max(240, window.innerHeight * 0.9);
  const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
  const targetW = Math.max(1, Math.round(img.width * ratio));
  const targetH = Math.max(1, Math.round(img.height * ratio));
  canvas.width = targetW;
  canvas.height = targetH;

  // draw image
  ctx.clearRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // watermark pattern
  const {
    text = '©',
    opacity = 0.15,
    font = '16px Inter, sans-serif',
    step = 160,
  } = options || {};

  // 生成离屏画布作为 pattern
  const pCanvas = document.createElement('canvas');
  pCanvas.width = step;
  pCanvas.height = step;
  const pctx = pCanvas.getContext('2d');
  pctx.clearRect(0, 0, step, step);
  pctx.save();
  pctx.translate(step / 2, step / 2);
  pctx.rotate((-30 * Math.PI) / 180);
  pctx.globalAlpha = opacity;
  pctx.fillStyle = '#ffffff';
  pctx.font = font;
  pctx.textAlign = 'center';
  pctx.textBaseline = 'middle';
  pctx.fillText(text, 0, 0);
  pctx.restore();

  const pattern = ctx.createPattern(pCanvas, 'repeat');
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 1;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.restore();
}

// EXIF 格式化
function formatExif(exif) {
  if (!exif) return null;
  const make = exif.Make || exif.make || '';
  const model = exif.Model || exif.model || '';
  const iso = exif.ISO || exif.Iso || exif.iso || '';
  const fnum = exif.FNumber || exif.FNum || exif.ApertureValue || '';
  const exposure = exif.ExposureTime || exif.Exposure || exif.ShutterSpeedValue || '';
  const focal = exif.FocalLength || exif.FocalLengthIn35mmFormat || '';

  const formatted = {
    camera: [make, model].filter(Boolean).join(' '),
    iso: iso ? `ISO ${iso}` : '',
    aperture: fnum ? `f/${typeof fnum === 'number' ? fnum.toFixed(1) : fnum}` : '',
    shutter: exposure ? formatExposure(exposure) : '',
    focal: focal ? formatFocal(focal) : '',
    dateISO: exif.DateTimeOriginal || exif.CreateDate || exif.date || '',
  };
  return formatted;
}

function formatExposure(exp) {
  if (typeof exp === 'number') {
    if (exp >= 1) return `${exp.toFixed(1)}s`;
    const denom = Math.round(1 / exp);
    return `1/${denom}s`;
  }
  return String(exp);
}

function formatFocal(f) {
  if (typeof f === 'number') return `${Math.round(f)}mm`;
  if (typeof f === 'object' && f?.numerator) {
    return `${Math.round(f.numerator / (f.denominator || 1))}mm`;
  }
  return String(f);
}

const activeCameraLabel = computed(() => exifData.value?.camera || '');
const activeDateLabel = computed(() => formatDate(exifData.value?.dateISO));
const activeTags = computed(() => {
  if (!exifData.value) return [];
  return [exifData.value.iso, exifData.value.aperture, exifData.value.shutter, exifData.value.focal]
    .filter(Boolean);
});

function buildMeta(item) {
  if (!item || typeof item !== 'object') return null;
  return {
    camera: item.camera || '',
    iso: item.iso || '',
    aperture: item.aperture || '',
    shutter: item.shutter || '',
    focal: item.focal || '',
    dateISO: item.dateISO || '',
  };
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(isoStr));
  } catch {
    return '';
  }
}

const handleKeydown = (event) => {
  if (!showLightbox.value) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeLightbox();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    nextImage();
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    prevImage();
  }
};
</script>

<template>
  <section
    id="photography"
    ref="sectionRef"
    class="content-section"
    @contextmenu.prevent="blockContextMenu"
  >
    <h2 class="section-title">Photography</h2>
    <div v-if="loading" class="loading">加载中…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="photo-grid" aria-live="polite">
      <article
        v-for="(img, idx) in images"
        :key="img.src"
        class="photo-card glass-card"
        role="group"
        aria-label="photo"
      >
        <button
          class="photo-thumb no-save"
          type="button"
          @click="openLightbox(idx)"
          @contextmenu.prevent="blockContextMenu"
        >
          <img
            class="thumb-img"
            :src="img.thumb"
            :data-full="img.src"
            alt="photo"
            loading="lazy"
            decoding="async"
            fetchpriority="low"
            draggable="false"
            @dragstart="handleDragStart"
          />
          <div class="thumb-watermark" aria-hidden="true">{{ watermarkText }}</div>
        </button>
      </article>
    </div>

    <!-- Lightbox Modal -->
    <Teleport to="body">
      <Transition name="lb-backdrop" appear>
        <div
          v-if="showLightbox"
          class="lightbox-backdrop"
          @click.self="closeLightbox"
          @contextmenu.prevent
        >
          <Transition name="lb-panel" appear>
            <div
              v-if="showLightbox"
              class="lightbox glass-card"
              role="dialog"
              aria-modal="true"
              aria-label="photo viewer"
            >
              <header class="lightbox-header">
                <div class="lightbox-meta">
                  <span v-if="activeCameraLabel" class="lb-camera">{{ activeCameraLabel }}</span>
                  <span v-if="activeDateLabel" class="lb-date">{{ activeDateLabel }}</span>
                </div>
                <button class="lb-btn lb-close" @click="closeLightbox" aria-label="Close">
                  <span aria-hidden="true">×</span>
                </button>
              </header>
              <div class="lightbox-body no-save" @contextmenu.prevent>
                <div class="lb-stage" :aria-busy="lightboxBusy">
                  <canvas
                    ref="canvasRef"
                    class="lb-canvas"
                    :class="{ 'is-transitioning': imageTransitioning }"
                    aria-label="photo canvas"
                  ></canvas>
                  <Transition name="lb-spinner" appear>
                    <div v-if="lightboxBusy" class="lb-spinner" aria-hidden="true"></div>
                  </Transition>
                </div>
              </div>
              <footer class="lightbox-footer">
                <div class="lb-tags">
                  <span v-for="tag in activeTags" :key="tag" class="lb-tag">{{ tag }}</span>
                  <span v-if="!activeTags.length && !activeCameraLabel" class="lb-tag muted">Metadata unavailable</span>
                </div>
                <div class="lb-actions">
                  <button class="lb-nav" @click.stop="prevImage" aria-label="Previous" :disabled="lightboxBusy">
                    ‹
                  </button>
                  <button class="lb-nav" @click.stop="nextImage" aria-label="Next" :disabled="lightboxBusy">
                    ›
                  </button>
                </div>
              </footer>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.error { color: #ff6b6b; }

.loading {
  font-size: 1.1rem;
  color: var(--muted-text, rgba(255,255,255,0.7));
}

.photo-grid {
  column-width: 260px;
  column-gap: 24px;
  width: 100%;
}

.photo-card {
  display: block;
  padding: 16px;
  margin: 0 0 24px;
  break-inside: avoid;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.photo-card:hover {
  transform: translateY(-4px);
}

.photo-thumb {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  display: block;
  padding: 0;
  border: none;
  background: transparent;
  cursor: zoom-in;
}

.photo-thumb:focus-visible {
  outline: 2px solid var(--accent-color, #5ac8fa);
  outline-offset: 3px;
}

.thumb-img {
  width: 100%;
  height: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  transition: opacity 0.4s ease;
}

/* 覆盖型缩略图水印（斜向、轻薄）*/
.thumb-watermark {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    -26deg,
    rgba(255,255,255,0),
    rgba(255,255,255,0) 120px,
    rgba(255,255,255, var(--wm-opacity)) 120px,
    rgba(255,255,255, var(--wm-opacity)) 170px
  );
  --wm-opacity: 0.18;
  mix-blend-mode: overlay;
  opacity: 1;
  mask-image: radial-gradient(circle at 50% 50%, black 58%, transparent 100%);
}

/* 反保存交互：禁用选择、右键、拖拽 */
.no-save, .no-save * {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

/* Lightbox */
.lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(12,12,17,0.72);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 4vw, 48px);
}

.lightbox {
  width: min(98vw, 1600px);
  max-height: 94vh;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: rgba(18,18,23,0.6);
  border-radius: 22px;
  overflow: hidden;
}

.lightbox-header,
.lightbox-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  overflow: hidden;
}

.lb-stage {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: clamp(200px, 45vh, 420px);
}

.lb-canvas {
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
  border-radius: 16px;
  background: rgba(0,0,0,0.25);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.lb-canvas.is-transitioning {
  opacity: 0;
  transform: scale(0.96);
}

.lb-spinner {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  background: rgba(12,12,18,0.28);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 18px;
}

.lb-spinner::after {
  content: '';
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.35);
  border-top-color: transparent;
  animation: lb-spin 0.8s linear infinite;
}

.lightbox-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lb-camera {
  font-weight: 600;
  color: #fff;
}

.lb-date {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.75);
}

.lightbox-body {
  padding: 0 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.lb-canvas {
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
  border-radius: 16px;
  background: rgba(0,0,0,0.25);
}

.lb-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.lb-tag {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.24);
  background: rgba(255,255,255,0.08);
  color: #fff;
  font-size: 0.82rem;
  letter-spacing: 0.015em;
}

.lb-tag.muted {
  opacity: 0.7;
}

.lb-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lb-nav {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.26);
  background: rgba(255,255,255,0.1);
  color: #fff;
  font-size: 1.4rem;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.lb-nav:disabled {
  cursor: progress;
  opacity: 0.6;
}

.lb-nav:not(:disabled):hover {
  transform: translateY(-1px);
  background: rgba(255,255,255,0.18);
}

.lb-btn {
  border: none;
  background: rgba(255,255,255,0.12);
  border-radius: 12px;
  width: 40px;
  height: 40px;
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 1.7rem;
  transition: background 0.2s ease;
}

.lb-btn:hover {
  background: rgba(255,255,255,0.22);
}

.lb-backdrop-enter-active,
.lb-backdrop-leave-active {
  transition: opacity 0.28s ease;
}

.lb-backdrop-enter-from,
.lb-backdrop-leave-to {
  opacity: 0;
}

.lb-panel-enter-active,
.lb-panel-leave-active {
  transition: opacity 0.32s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.lb-panel-enter-from,
.lb-panel-leave-to {
  opacity: 0;
  transform: translateY(22px) scale(0.95);
}

.lb-spinner-enter-active,
.lb-spinner-leave-active {
  transition: opacity 0.2s ease;
}

.lb-spinner-enter-from,
.lb-spinner-leave-to {
  opacity: 0;
}

@keyframes lb-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .photo-grid { column-width: 200px; column-gap: 18px; }
  .photo-card { padding: 14px; margin-bottom: 18px; }
  .lightbox {
    width: 100%;
    gap: 12px;
  }
  .lightbox-header {
    padding: 16px 18px 0;
  }
  .lightbox-footer {
    padding: 0 18px 18px;
    gap: 12px;
  }
  .lb-nav { width: 38px; height: 38px; }
  .lb-btn { width: 36px; height: 36px; font-size: 1.4rem; }
  .lb-canvas { max-height: 58vh; }
}

@media (prefers-reduced-motion: reduce) {
  .photo-card,
  .photo-card:hover,
  .lb-canvas,
  .lb-canvas.is-transitioning {
    transition: none !important;
    transform: none !important;
  }
  .lb-backdrop-enter-active,
  .lb-backdrop-leave-active,
  .lb-panel-enter-active,
  .lb-panel-leave-active {
    transition: none !important;
  }
}
</style>