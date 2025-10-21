<script setup>
import { ref, onMounted, onUnmounted, provide } from 'vue';
import HeroSection from './components/HeroSection.vue';
import AboutSection from './components/AboutSection.vue';
import EducationSection from './components/EducationSection.vue';
import WorkSection from './components/WorkSection.vue';
import ResearchSection from './components/ResearchSection.vue';
import PublicationsSection from './components/PublicationsSection.vue';
import GallerySection from './components/GallerySection.vue';
import Footer from './components/Footer.vue';
import GlassEffect from './components/GlassEffect.vue';

// ===================================================================
// 1. 全局配置 (导航栏布局模式)
// ===================================================================

// 导航栏布局模式：'flow' 表示随内容滚动，'fixed' 表示悬浮在顶部
/** @type {'flow' | 'fixed'} */
const NAV_LAYOUT_MODE = 'flow';

// ===================================================================
// 2. 移动端导航状态
// ===================================================================
const mobileNavOpen = ref(false);

const toggleMobileNav = () => {
  mobileNavOpen.value = !mobileNavOpen.value;
};

const closeMobileNav = () => {
  mobileNavOpen.value = false;
};

const navigateTo = (section) => {
  closeMobileNav();
  document.querySelector(`#${section}`)?.scrollIntoView({ behavior: 'smooth' });
};

// ===================================================================
// 2. 动态主题管理 - 核心逻辑
// ===================================================================
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
};

const currentTheme = ref(document.documentElement.getAttribute('data-theme') || 'dark');
const toggleTheme = () => {
  const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark';
  currentTheme.value = newTheme;
  applyTheme(newTheme);
};

// 使用 provide 将 theme-toggle 函数和 currentTheme 响应式变量暴露给所有子组件
provide('toggleTheme', toggleTheme);
provide('currentTheme', currentTheme);

const cleanupCallbacks = [];

onUnmounted(() => {
  cleanupCallbacks.forEach((cleanup) => cleanup());
  cleanupCallbacks.length = 0;
});


onMounted(() => {
  applyTheme(currentTheme.value);
  document.documentElement.setAttribute('data-glass-mode', 'classic');
  document.documentElement.setAttribute('data-nav-layout', NAV_LAYOUT_MODE);

  // --- 1. 3D 倾斜特效 (无光晕) ---
  const apply3DTiltEffect = (selector) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    if (reduceMotion.matches || coarsePointer.matches) {
      return;
    }

    const cards = Array.from(document.querySelectorAll(selector)).filter(
      (node) => node instanceof HTMLElement && node.dataset.tiltBound !== 'true',
    );
    if (!cards.length) return;

    const maxRotation = 6;

    cards.forEach((card) => {
      card.dataset.tiltBound = 'true';

      let frameId = 0;
      let rect = card.getBoundingClientRect();
      let currentX = 0;
      let currentY = 0;
      let targetX = 0;
      let targetY = 0;

      const updateRect = () => {
        rect = card.getBoundingClientRect();
      };

      const render = () => {
        const easing = 0.18;
        currentX += (targetX - currentX) * easing;
        currentY += (targetY - currentY) * easing;

        const intensity = Math.min(1, (Math.abs(currentX) + Math.abs(currentY)) / (maxRotation * 2));
        const scale = 1 + 0.02 * intensity;

        card.style.transform = `perspective(900px) rotateX(${currentX.toFixed(2)}deg) rotateY(${currentY.toFixed(2)}deg) scale3d(${scale.toFixed(3)}, ${scale.toFixed(3)}, ${scale.toFixed(3)})`;

        if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
          frameId = requestAnimationFrame(render);
        } else {
          frameId = 0;
          if (targetX === 0 && targetY === 0) {
            card.style.transform = '';
          }
        }
      };

      const scheduleRender = () => {
        if (!frameId) {
          frameId = requestAnimationFrame(render);
        }
      };

      const handlePointerEnter = () => {
        updateRect();
        scheduleRender();
      };

      const handlePointerMove = (event) => {
        const { left, top, width, height } = rect;
        if (!width || !height) return;
        const xRatio = (event.clientX - left) / width - 0.5;
        const yRatio = (event.clientY - top) / height - 0.5;
        targetY = maxRotation * xRatio * 2;
        targetX = -maxRotation * yRatio * 2;
        scheduleRender();
      };

      const resetTilt = () => {
        targetX = 0;
        targetY = 0;
        scheduleRender();
      };

      const handlePointerLeave = () => {
        resetTilt();
      };

      let resizeObserver = null;
      const resizeFallback = () => updateRect();
      if (typeof ResizeObserver === 'function') {
        resizeObserver = new ResizeObserver(updateRect);
        resizeObserver.observe(card);
      } else {
        window.addEventListener('resize', resizeFallback, { passive: true });
      }

      card.addEventListener('pointerenter', handlePointerEnter, { passive: true });
      card.addEventListener('pointermove', handlePointerMove, { passive: true });
      card.addEventListener('pointerleave', handlePointerLeave, { passive: true });
      card.addEventListener('pointercancel', handlePointerLeave, { passive: true });

      const cleanup = () => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        } else {
          window.removeEventListener('resize', resizeFallback);
        }
        card.removeEventListener('pointerenter', handlePointerEnter);
        card.removeEventListener('pointermove', handlePointerMove);
        card.removeEventListener('pointerleave', handlePointerLeave);
        card.removeEventListener('pointercancel', handlePointerLeave);
        if (frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
        delete card.dataset.tiltBound;
        card.style.transform = '';
      };

      cleanupCallbacks.push(cleanup);
    });
  };

  // 为所有卡片应用 3D 倾斜特效
  apply3DTiltEffect('.glass-card');
  apply3DTiltEffect('.research-card-scroll');


  // --- 2. 桌面液态玻璃导航栏 ---
  const navContainer = document.getElementById("glass-nav-container");
  if (navContainer) {
    const updateSlider = () => {
      const activeOption = navContainer.querySelector('input:checked')?.parentNode;
      if (activeOption instanceof HTMLElement) {
        navContainer.style.setProperty('--slider-width', `${activeOption.offsetWidth}px`);
        navContainer.style.setProperty('--slider-translate-x', `${activeOption.offsetLeft}px`);
      }
    };

    const handleNavChange = () => {
      updateSlider();
    };
    navContainer.addEventListener('change', handleNavChange);
    cleanupCallbacks.push(() => navContainer.removeEventListener('change', handleNavChange));

    // 液体玻璃切换器逻辑
    const trackPrevious = (el) => {
      const radios = el.querySelectorAll('input[type="radio"]');
      let previousValue = null;

      // 初始化时设置当前选中项
      const initiallyChecked = el.querySelector('input[type="radio"]:checked');
      if (initiallyChecked) {
        previousValue = initiallyChecked.getAttribute("c-option");
        el.setAttribute('c-previous', previousValue);
      }

      radios.forEach(radio => {
        radio.addEventListener('change', () => {
          if (radio.checked) {
            el.setAttribute('c-previous', previousValue ?? "");
            previousValue = radio.getAttribute("c-option");
          }
        });
      });
    };
    trackPrevious(navContainer);

    const navInputs = Array.from(navContainer.querySelectorAll('.glass-nav__input'));
    const navInputMap = new Map(navInputs.map((input) => [input.value, input]));

    const sectionTargets = Array.from(document.querySelectorAll('.content-section'))
      .filter((section) => section instanceof HTMLElement && navInputMap.has(section.id));
    const sectionOrder = sectionTargets.map((section) => section.id);

    let activeSectionId = '';

    const setActiveNav = (sectionId) => {
      if (!sectionId || activeSectionId === sectionId) return;
      const targetInput = navInputMap.get(sectionId);
      if (!targetInput) return;
      activeSectionId = sectionId;
      if (!targetInput.checked) {
        targetInput.checked = true;
        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        updateSlider();
      }
    };

    const updateActiveSection = () => {
      if (!sectionTargets.length) return;
      const navOffset = (navContainer.offsetHeight || 0) + 24;
      const viewportPivot = window.scrollY + Math.max(window.innerHeight * 0.3, navOffset);
      let currentSection = sectionTargets[0];
      for (const section of sectionTargets) {
        const sectionTop = section.getBoundingClientRect().top + window.scrollY;
        if (viewportPivot >= sectionTop - navOffset) {
          currentSection = section;
        } else {
          break;
        }
      }
      setActiveNav(currentSection.id);
    };

    const visibleSections = new Map();

    const pickMostVisibleSection = () => {
      if (!visibleSections.size) return false;
      const [bestSectionId] = Array.from(visibleSections.entries())
        .sort((a, b) => {
          if (b[1] !== a[1]) return b[1] - a[1];
          return sectionOrder.indexOf(a[0]) - sectionOrder.indexOf(b[0]);
        })[0] || [];
      if (bestSectionId) {
        setActiveNav(bestSectionId);
        return true;
      }
      return false;
    };

    let sectionObserver;
    if ('IntersectionObserver' in window && sectionTargets.length) {
      sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const { id } = entry.target;
          if (!id) return;
          if (entry.isIntersecting) {
            visibleSections.set(id, entry.intersectionRatio);
          } else {
            visibleSections.delete(id);
          }
        });
        if (!pickMostVisibleSection()) {
          updateActiveSection();
        }
      }, {
        root: null,
        rootMargin: '-45% 0px -45% 0px',
        threshold: [0.1, 0.25, 0.5, 0.75],
      });

      sectionTargets.forEach((section) => sectionObserver.observe(section));
      cleanupCallbacks.push(() => sectionObserver && sectionObserver.disconnect());
    }

    const applyActiveSection = () => {
      if (!pickMostVisibleSection()) {
        updateActiveSection();
      }
    };

    const runInitialNavSync = () => {
      updateSlider();
      applyActiveSection();
      requestAnimationFrame(() => {
        updateSlider();
        applyActiveSection();
        requestAnimationFrame(() => {
          updateSlider();
          applyActiveSection();
        });
      });
    };

    let scrollTicking = false;
    const handleScroll = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        applyActiveSection();
        scrollTicking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    cleanupCallbacks.push(() => window.removeEventListener('scroll', handleScroll));

    const handleResize = () => {
      updateSlider();
      applyActiveSection();
    };
    window.addEventListener('resize', handleResize);
    cleanupCallbacks.push(() => window.removeEventListener('resize', handleResize));

    const handleNavClick = (e) => {
      const label = e.target.closest('label');
      if (label) {
        const radio = document.getElementById(label.getAttribute('for'));
        const href = radio?.nextElementSibling?.getAttribute('href');
        if (href) document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    navContainer.addEventListener('click', handleNavClick);
    cleanupCallbacks.push(() => navContainer.removeEventListener('click', handleNavClick));

    runInitialNavSync();
    if (document.fonts && 'ready' in document.fonts) {
      document.fonts.ready.then(runInitialNavSync).catch(() => {});
    }
    window.addEventListener('load', runInitialNavSync);
    cleanupCallbacks.push(() => window.removeEventListener('load', runInitialNavSync));
  }

  // --- 3. 移动端导航栏开关 ---
  const navToggle = document.getElementById('mobile-nav-toggle');
  const navMenu = document.getElementById('mobile-nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpened = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isOpened);
      navMenu.classList.toggle('is-open');
      document.body.classList.toggle('no-scroll');
    });
    navMenu.addEventListener('click', (e) => {
      if (e.target.matches('.mobile-nav-link')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
      }
    });
  }

  // --- 4. 出版物年份筛选器 ---
  const pubNavContainer = document.querySelector('.pub-years');
  const pubListsContainer = document.querySelector('.pub-lists-container');
  if (pubNavContainer && pubListsContainer) {
    // 移除 setActiveListHeight 函数及其相关调用，让CSS处理高度变化
    let pubSliderState = { width: 0, left: 0 };
    let pubSliderAnimationTimer = 0;

    const triggerPubSliderBounce = () => {
      if (pubSliderAnimationTimer) {
        window.clearTimeout(pubSliderAnimationTimer);
        pubSliderAnimationTimer = 0;
      }
      pubNavContainer.classList.remove('is-animating');
      // 强制重绘以重新触发动画
      void pubNavContainer.offsetWidth;
      pubNavContainer.classList.add('is-animating');
      pubSliderAnimationTimer = window.setTimeout(() => {
        pubNavContainer.classList.remove('is-animating');
        pubSliderAnimationTimer = 0;
      }, 680);
    };

    const updatePubSlider = (shouldAnimate = false) => {
      const activeButton = pubNavContainer.querySelector('.pub-year-btn.active');
      if (!activeButton) return;

      const nextWidth = activeButton.offsetWidth;
      const nextLeft = activeButton.offsetLeft;
      const stateChanged = nextWidth !== pubSliderState.width || nextLeft !== pubSliderState.left;

      if (!stateChanged && pubSliderState.width !== 0) return;

      pubNavContainer.style.setProperty('--pub-slider-width', `${nextWidth}px`);
      pubNavContainer.style.setProperty('--pub-slider-translate-x', `${nextLeft}px`);

      if (shouldAnimate && pubSliderState.width !== 0) {
        triggerPubSliderBounce();
      }

      pubSliderState = { width: nextWidth, left: nextLeft };
    };
    const runInitialPubSync = () => {
      updatePubSlider(false);
      requestAnimationFrame(() => {
        updatePubSlider(false);
        requestAnimationFrame(() => updatePubSlider(false));
      });
    };
    runInitialPubSync();

    if (document.fonts && 'ready' in document.fonts) {
      document.fonts.ready.then(runInitialPubSync).catch(() => {});
    }
    window.addEventListener('load', runInitialPubSync);

    // 液体玻璃切换器逻辑
    const trackPubPrevious = (el) => {
      let previousValue = null;

      // 初始化时设置当前激活项
      const initiallyActive = el.querySelector('.pub-year-btn.active');
      if (initiallyActive) {
        previousValue = initiallyActive.getAttribute("c-option");
        el.setAttribute('c-previous', previousValue);
      }

      el.addEventListener('click', (e) => {
        const button = e.target.closest('.pub-year-btn');
        if (button) {
          const selectedYear = button.getAttribute("c-option");
          if (selectedYear !== previousValue) {
            el.setAttribute('c-previous', previousValue ?? "");
            previousValue = selectedYear;
          }
          pubNavContainer.querySelector('.active')?.classList.remove('active');
          button.classList.add('active');
          pubListsContainer.querySelectorAll('.pub-list').forEach(list => {
            list.classList.toggle('active', list.dataset.year === selectedYear);
          });
          setTimeout(() => updatePubSlider(true), 0);
        }
      });
    };
    trackPubPrevious(pubNavContainer);
    const handlePubResize = () => updatePubSlider();
    window.addEventListener('resize', handlePubResize);
    cleanupCallbacks.push(() => {
      if (pubSliderAnimationTimer) {
        window.clearTimeout(pubSliderAnimationTimer);
      }
      pubNavContainer.classList.remove('is-animating');
      window.removeEventListener('resize', handlePubResize);
      window.removeEventListener('load', runInitialPubSync);
    });
  }

  // --- 5. 作品集图片轮播 ---
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = carousel.querySelector('.carousel-button--right');
    const prevButton = carousel.querySelector('.carousel-button--left');
    const dotsNav = carousel.querySelector('.carousel-nav');
    const dots = Array.from(dotsNav.children);
    const moveToSlide = (targetSlide) => {
      const currentSlide = track.querySelector('.current-slide');
      if(!currentSlide) return;
      track.style.transform = `translateX(-${targetSlide.offsetLeft}px)`;
      currentSlide.classList.remove('current-slide');
      targetSlide.classList.add('current-slide');
    };
    const updateDots = (targetDot) => {
      const currentDot = dotsNav.querySelector('.current-slide');
      if(!currentDot) return;
      currentDot.classList.remove('current-slide');
      targetDot.classList.add('current-slide');
    };
    nextButton.addEventListener('click', () => {
      const currentSlide = track.querySelector('.current-slide');
      const nextSlide = currentSlide.nextElementSibling || slides[0];
      const nextDot = dotsNav.querySelector('.current-slide').nextElementSibling || dots[0];
      moveToSlide(nextSlide);
      updateDots(nextDot);
    });
    prevButton.addEventListener('click', () => {
      const currentSlide = track.querySelector('.current-slide');
      const prevSlide = currentSlide.previousElementSibling || slides[slides.length - 1];
      const prevDot = dotsNav.querySelector('.current-slide').previousElementSibling || dots[dots.length - 1];
      moveToSlide(prevSlide);
      updateDots(prevDot);
    });
    dotsNav.addEventListener('click', e => {
      const targetDot = e.target.closest('button.carousel-indicator');
      if (!targetDot) return;
      const targetIndex = dots.findIndex(dot => dot === targetDot);
      moveToSlide(slides[targetIndex]);
      updateDots(targetDot);
    });
  }

  // --- 6. 研究项目无限滚动 ---
  const scroller = document.querySelector(".scroller");
  if (scroller && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const scrollerContent = scroller.querySelector('.scroller-content');
    if (scrollerContent) {
      const items = Array.from(scrollerContent.children);
      items.forEach(item => {
        const duplicatedItem = item.cloneNode(true);
        duplicatedItem.setAttribute("aria-hidden", true);
        scrollerContent.appendChild(duplicatedItem);
      });
    }
  }

  // --- 7. 页面元素滚动淡入 ---
  const fadeInObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.content-section').forEach(section => fadeInObserver.observe(section));

});
</script>

<template>
  <GlassEffect class="desktop-nav" borderRadius="99em" distortion="0.02" padding="0">
    <fieldset class="glass-nav" id="glass-nav-container">
      <legend class="glass-nav__legend">Main Navigation</legend>
      <label class="glass-nav__option" for="nav-1"><input class="glass-nav__input" type="radio" name="nav" value="about" c-option="1" id="nav-1" checked><a href="#about">About</a></label>
      <label class="glass-nav__option" for="nav-2"><input class="glass-nav__input" type="radio" name="nav" value="education" c-option="2" id="nav-2"><a href="#education">Education</a></label>
      <label class="glass-nav__option" for="nav-3"><input class="glass-nav__input" type="radio" name="nav" value="work" c-option="3" id="nav-3"><a href="#work">Work</a></label>
      <label class="glass-nav__option" for="nav-4"><input class="glass-nav__input" type="radio" name="nav" value="research" c-option="4" id="nav-4"><a href="#research">Research</a></label>
      <label class="glass-nav__option" for="nav-5"><input class="glass-nav__input" type="radio" name="nav" value="publications" c-option="5" id="nav-5"><a href="#publications">Publications</a></label>
      <label class="glass-nav__option" for="nav-6"><input class="glass-nav__input" type="radio" name="nav" value="gallery" c-option="6" id="nav-6"><a href="#gallery">Gallery</a></label>
    </fieldset>
  </GlassEffect>

  <!-- 移动端中央导航按钮 -->
  <GlassEffect class="mobile-nav-button" borderRadius="20px" distortion="0.02" padding="0">
    <button @click="toggleMobileNav" class="central-nav-btn" aria-label="Open navigation menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </GlassEffect>

  <!-- 移动端弹出导航窗口 -->
  <div v-if="mobileNavOpen" class="mobile-nav-popup" @click="closeMobileNav">
    <div class="popup-content apple-glass" @click.stop>
      <div class="popup-header">
        <div class="popup-title">Navigation</div>
        <div class="popup-decoration"></div>
      </div>
      <button @click="navigateTo('about')" class="popup-nav-btn">About</button>
      <button @click="navigateTo('education')" class="popup-nav-btn">Education</button>
      <button @click="navigateTo('work')" class="popup-nav-btn">Work</button>
      <button @click="navigateTo('research')" class="popup-nav-btn">Research</button>
      <button @click="navigateTo('publications')" class="popup-nav-btn">Publications</button>
      <button @click="navigateTo('gallery')" class="popup-nav-btn">Gallery</button>
    </div>
  </div>

  <div class="container">
    <HeroSection />
    <AboutSection />
    <EducationSection />
    <WorkSection />
    <ResearchSection />
    <PublicationsSection />
    <GallerySection />
    <Footer />
  </div>

  <button class="theme-switcher" id="theme-toggle" title="Switch Theme" @click="toggleTheme">
    <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.106a.75.75 0 010 1.06l-1.591 1.59a.75.75 0 11-1.06-1.06l1.59-1.59a.75.75 0 011.061 0zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5h2.25a.75.75 0 01.75.75zM17.836 17.894a.75.75 0 011.06 0l1.591 1.591a.75.75 0 11-1.06 1.06l-1.591-1.59a.75.75 0 010-1.06zM12 21.75a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75-.75zM5.106 17.836a.75.75 0 010-1.06l1.591-1.591a.75.75 0 111.06 1.06l-1.59 1.591a.75.75 0 01-1.061 0zM3 12a.75.75 0 01.75-.75h2.25a.75.75 0 010-1.5H3.75A.75.75 0 013 12zM6.106 5.106a.75.75 0 011.06 0l1.591 1.591a.75.75 0 01-1.06 1.06L6.106 6.167a.75.75 0 010-1.06z"></path></svg>
    <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 004.472-.528.75.75 0 01.818.162.75.75 0 01.162.819A10.5 10.5 0 119.528 1.718zM16.5 9a.75.75 0 01.75.75 1.5 1.5 0 001.5 1.5.75.75 0 010 1.5 1.5 1.5 0 00-1.5 1.5.75.75 0 01-1.5 0 1.5 1.5 0 00-1.5-1.5.75.75 0 010-1.5 1.5 1.5 0 001.5-1.5.75.75 0 01.75-.75z" clip-rule="evenodd"></path></svg>
  </button>
</template>

<style scoped>
/* App.vue is for layout, all styles are in main.css */
</style>
