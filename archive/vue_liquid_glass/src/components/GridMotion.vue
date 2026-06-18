<template>
  <div class="grid-motion-shell" ref="shellRef">
    <section class="grid-motion-stage" :style="stageStyle">
      <div class="grid-motion-container">
        <div
          v-for="(row, rowIndex) in rowItems"
          :key="rowIndex"
          class="grid-motion-row"
          :ref="(el) => setRowRef(el, rowIndex)"
        >
          <button
            v-for="(item, itemIndex) in row"
            :key="item.key"
            class="grid-motion-item"
            :class="{ 'grid-motion-item--image': item.kind === 'image' }"
            type="button"
            @click="handleItemClick(item)"
          >
            <div class="grid-motion-item__inner">
              <template v-if="item.kind === 'image'">
                <img class="grid-motion-item__image" :src="item.src" :alt="item.alt || 'photo'" draggable="false" />
                <div class="grid-motion-item__scrim" aria-hidden="true"></div>
                <div class="grid-motion-item__caption" v-if="item.caption">
                  <span>{{ item.caption }}</span>
                </div>
              </template>
              <template v-else>
                <div class="grid-motion-item__text">
                  <span class="grid-motion-item__eyebrow" v-if="item.eyebrow">{{ item.eyebrow }}</span>
                  <span class="grid-motion-item__label">{{ item.label }}</span>
                </div>
              </template>
            </div>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { gsap } from 'gsap';

const props = defineProps({
  items: { type: Array, default: () => [] },
  gradientColor: { type: String, default: 'rgba(0, 0, 0, 0.9)' },
  rows: { type: Number, default: 4 },
  columns: { type: Number, default: 0 },
});

const emit = defineEmits(['item-click']);

const shellRef = ref(null);
const rowRefs = ref([]);
const mouseXRef = ref(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);

const normalizedItems = computed(() => {
  if (!props.items.length) {
    const fallbackTotal = props.rows * (props.columns || 7);
    return Array.from({ length: fallbackTotal }, (_, index) => ({
      key: `placeholder-${index}`,
      kind: 'text',
      eyebrow: 'Photography',
      label: `Item ${index + 1}`,
      sourceIndex: index,
    }));
  }

  return props.items.map((raw, index) => {
    if (typeof raw === 'string') {
      if (raw.startsWith('http') || raw.startsWith('/')) {
        return {
          key: `image-${index}-${raw}`,
          kind: 'image',
          src: raw,
          alt: `Photography item ${index + 1}`,
          caption: `Frame ${index + 1}`,
          sourceIndex: index,
        };
      }

      return {
        key: `text-${index}-${raw}`,
        kind: 'text',
        eyebrow: 'Grid Motion',
        label: raw,
        sourceIndex: index,
      };
    }

    return {
      key: raw?.key || `item-${index}`,
      kind: raw?.kind || (raw?.src ? 'image' : 'text'),
      src: raw?.src || raw?.thumb || '',
      alt: raw?.alt || `Photography item ${index + 1}`,
      caption: raw?.caption || raw?.meta?.dateISO?.slice(0, 10) || `Frame ${index + 1}`,
      eyebrow: raw?.eyebrow || raw?.meta?.camera || 'Photography',
      label: raw?.label || raw?.title || raw?.meta?.camera || `Frame ${index + 1}`,
      sourceIndex: typeof raw?.sourceIndex === 'number' ? raw.sourceIndex : index,
    };
  });
});

const columnsCount = computed(() => {
  if (props.columns > 0) return props.columns;
  return Math.max(1, Math.ceil(normalizedItems.value.length / props.rows));
});

const rowItems = computed(() => {
  const rows = [];
  for (let rowIndex = 0; rowIndex < props.rows; rowIndex += 1) {
    rows.push(normalizedItems.value.slice(rowIndex * columnsCount.value, (rowIndex + 1) * columnsCount.value));
  }
  return rows;
});

const stageStyle = computed(() => ({
  background: `radial-gradient(circle at 50% 35%, ${props.gradientColor} 0%, transparent 70%)`,
}));

const setRowRef = (el, rowIndex) => {
  if (el) {
    rowRefs.value[rowIndex] = el;
  }
};


const updateMotion = () => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1;
  const maxMoveAmount = 300;
  const baseDuration = 0.8;
  const inertiaFactors = [0.6, 0.4, 0.3, 0.2];

  rowRefs.value.forEach((row, index) => {
    if (!row) return;
    const direction = index % 2 === 0 ? 1 : -1;
    const moveAmount = ((mouseXRef.value / width) * maxMoveAmount - maxMoveAmount / 2) * direction;

    gsap.to(row, {
      x: moveAmount,
      duration: baseDuration + inertiaFactors[index % inertiaFactors.length],
      ease: 'power3.out',
      overwrite: 'auto',
    });
  });
};

const handleMouseMove = (event) => {
  mouseXRef.value = event.clientX;
};

const handleItemClick = (item) => {
  emit('item-click', item);
};

onMounted(() => {
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add(updateMotion);
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
});

watch(
  () => props.items,
  () => {
    updateMotion();
  },
  { deep: true },
);

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  gsap.ticker.remove(updateMotion);
});
</script>

<style scoped>
.grid-motion-shell {
  width: 100%;
  min-height: 100vh;
}

.grid-motion-stage {
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 3vw, 2rem) 0 clamp(1.5rem, 4vw, 2.5rem);
}

.grid-motion-stage::before,
.grid-motion-stage::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: clamp(3rem, 6vw, 7rem);
  pointer-events: none;
  z-index: 3;
}

.grid-motion-stage::before {
  left: 0;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.96), rgba(0, 0, 0, 0));
}

.grid-motion-stage::after {
  right: 0;
  background: linear-gradient(270deg, rgba(0, 0, 0, 0.96), rgba(0, 0, 0, 0));
}

.grid-motion-container {
  gap: 0.85rem;
  flex: none;
  position: relative;
  width: 100%;
  height: 112vh;
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  grid-template-columns: 100%;
  transform: rotate(-8deg);
  transform-origin: center center;
  z-index: 2;
}

.grid-motion-row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(v-bind(columnsCount), 1fr);
  will-change: transform, filter;
}

.grid-motion-item {
  position: relative;
  appearance: none;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.grid-motion-item__inner {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 98px;
  overflow: hidden;
  border-radius: 15px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.12)),
    rgba(17, 17, 17, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: transform 0.28s ease, box-shadow 0.28s ease, filter 0.28s ease;
}

.grid-motion-item--image .grid-motion-item__inner {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 14px 30px rgba(0, 0, 0, 0.22);
}

.grid-motion-item:hover .grid-motion-item__inner {
  transform: translateY(-4px) scale(1.01);
}

.grid-motion-item--image:hover .grid-motion-item__inner {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.14),
    0 18px 38px rgba(0, 0, 0, 0.28);
}

.grid-motion-item__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
  user-select: none;
  -webkit-user-drag: none;
}

.grid-motion-item__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.48)),
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.14), transparent 42%);
}

.grid-motion-item__caption,
.grid-motion-item__text {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  width: 100%;
  height: 100%;
  padding: 1rem;
}

.grid-motion-item__caption {
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.88);
}

.grid-motion-item__eyebrow {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgba(0, 237, 255, 0.9);
  margin-bottom: 0.5rem;
}

.grid-motion-item__label {
  font-size: clamp(0.95rem, 1.4vw, 1.25rem);
  line-height: 1.15;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.96);
}

@media (max-width: 900px) {
  .grid-motion-container {
    width: 100%;
    height: 118vh;
    transform: rotate(-7deg);
  }

  .grid-motion-row {
    gap: 0.7rem;
  }

  .grid-motion-item__inner {
    min-height: 92px;
    border-radius: 14px;
  }
}

@media (max-width: 640px) {
  .grid-motion-container {
    width: 100%;
    height: 114vh;
    transform: rotate(-6deg);
  }

  .grid-motion-row {
    gap: 0.55rem;
  }

  .grid-motion-item__inner {
    min-height: 86px;
    border-radius: 13px;
  }
}
</style>