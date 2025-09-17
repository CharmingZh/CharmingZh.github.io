<script setup>
import { ref, onMounted, computed, provide } from 'vue';
import HeroSection from './components/HeroSection.vue';
import AboutSection from './components/AboutSection.vue';
import EducationSection from './components/EducationSection.vue';
import WorkSection from './components/WorkSection.vue';
import ResearchSection from './components/ResearchSection.vue';
import PublicationsSection from './components/PublicationsSection.vue';
import GallerySection from './components/GallerySection.vue';
import Footer from './components/Footer.vue';

// ===================================================================
// 1. 全局玻璃效果配置 (方便统一管理)
// ===================================================================
const glassProps = {
  displacementScale: 200,
  blurAmount: 0.2,
  aberrationIntensity: 6,
  elasticity: 0.25,
  cornerRadius: 25,
  mode: 'standard', // <--- 确保这一行是 'standard'
};

// ===================================================================
// 2. 动态主题管理 - 核心逻辑
// ===================================================================
const currentTheme = ref('dark'); // 默认主题为暗色
const isLightTheme = computed(() => currentTheme.value === 'light');

const toggleTheme = () => {
  const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark';
  currentTheme.value = newTheme;
  // 更新 HTML 根元素的 data-theme 属性，以应用 CSS 变量
  document.documentElement.setAttribute('data-theme', newTheme);
};

// 使用 provide 将 theme-toggle 函数和 currentTheme 响应式变量暴露给所有子组件
provide('toggleTheme', toggleTheme);
provide('currentTheme', currentTheme);


onMounted(() => {
  // --- 1. 3D 倾斜特效 (无光晕) ---
  const apply3DTiltEffect = (selector) => {
    const cards = document.querySelectorAll(selector);
    const maxRotation = 6; // 倾斜角度

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const { left, top, width, height } = card.getBoundingClientRect();
        const mouseX = e.clientX - left;
        const mouseY = e.clientY - top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        const rotateY = maxRotation * xPct * 2;
        const rotateX = -maxRotation * yPct * 2;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
      });

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.1s ease';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      });
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
      if (activeOption) {
        navContainer.style.setProperty('--slider-width', `${activeOption.offsetWidth}px`);
        navContainer.style.setProperty('--slider-translate-x', `${activeOption.offsetLeft}px`);
      }
    };
    const trackPrevious = () => {
      let previousValue = navContainer.querySelector('input:checked')?.getAttribute("c-option");
      if (previousValue) navContainer.setAttribute("c-previous", previousValue);
      navContainer.addEventListener("change", () => {
        const currentChecked = navContainer.querySelector('input:checked');
        if (currentChecked) {
          const currentVal = currentChecked.getAttribute("c-option");
          if (currentVal !== previousValue) {
            navContainer.setAttribute("c-previous", previousValue ?? "");
            previousValue = currentVal;
          }
        }
      }, true);
    };
    updateSlider();
    trackPrevious();
    navContainer.addEventListener("change", updateSlider);
    window.addEventListener('resize', updateSlider);
    navContainer.addEventListener('click', (e) => {
      const label = e.target.closest('label');
      if (label) {
        const radio = document.getElementById(label.getAttribute('for'));
        const href = radio?.nextElementSibling?.getAttribute('href');
        if (href) document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }
    });
    const sections = document.querySelectorAll('.content-section');
    const scrollObserver = new IntersectionObserver(entries => {
      let bestMatch = null;
      let maxRatio = -1;
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          bestMatch = entry.target;
        }
      });
      if (bestMatch) {
        const correspondingRadio = navContainer.querySelector(`input[value="${bestMatch.id}"]`);
        if (correspondingRadio && !correspondingRadio.checked) {
          correspondingRadio.checked = true;
          correspondingRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }, { threshold: 0.1, rootMargin: "-100px 0px -50% 0px" });
    sections.forEach(section => scrollObserver.observe(section));
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
    const updatePubSlider = () => {
      const activeButton = pubNavContainer.querySelector('.pub-year-btn.active');
      if (activeButton) {
        pubNavContainer.style.setProperty('--pub-slider-width', `${activeButton.offsetWidth}px`);
        pubNavContainer.style.setProperty('--pub-slider-translate-x', `${activeButton.offsetLeft}px`);
      }
    };
    updatePubSlider();
    pubNavContainer.addEventListener('click', (e) => {
      const button = e.target.closest('.pub-year-btn');
      if (button) {
        const selectedYear = button.dataset.year;
        pubNavContainer.querySelector('.active')?.classList.remove('active');
        button.classList.add('active');
        pubListsContainer.querySelectorAll('.pub-list').forEach(list => {
          list.classList.toggle('active', list.dataset.year === selectedYear);
        });
        setTimeout(updatePubSlider, 0);
      }
    });
    window.addEventListener('resize', () => {
      updatePubSlider();
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
  <fieldset class="glass-nav" id="glass-nav-container">
    <legend class="glass-nav__legend">Main Navigation</legend>
    <label class="glass-nav__option" for="nav-1"><input class="glass-nav__input" type="radio" name="nav" value="about" c-option="1" id="nav-1" checked><a href="#about">About</a></label>
    <label class="glass-nav__option" for="nav-2"><input class="glass-nav__input" type="radio" name="nav" value="education" c-option="2" id="nav-2"><a href="#education">Education</a></label>
    <label class="glass-nav__option" for="nav-3"><input class="glass-nav__input" type="radio" name="nav" value="work" c-option="3" id="nav-3"><a href="#work">Work</a></label>
    <label class="glass-nav__option" for="nav-4"><input class="glass-nav__input" type="radio" name="nav" value="research" c-option="4" id="nav-4"><a href="#research">Research</a></label>
    <label class="glass-nav__option" for="nav-5"><input class="glass-nav__input" type="radio" name="nav" value="publications" c-option="5" id="nav-5"><a href="#publications">Publications</a></label>
    <label class="glass-nav__option" for="nav-6"><input class="glass-nav__input" type="radio" name="nav" value="gallery" c-option="6" id="nav-6"><a href="#gallery">Gallery</a></label>
  </fieldset>

  <button class="mobile-nav-toggle" id="mobile-nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
    <span class="hamburger-box"><span class="hamburger-inner"></span></span>
  </button>
  <div class="mobile-nav-menu" id="mobile-nav-menu">
    <nav>
      <a href="#about" class="mobile-nav-link">About</a>
      <a href="#education" class="mobile-nav-link">Education</a>
      <a href="#work" class="mobile-nav-link">Work</a>
      <a href="#research" class="mobile-nav-link">Research</a>
      <a href="#publications" class="mobile-nav-link">Publications</a>
      <a href="#gallery" class="mobile-nav-link">Gallery</a>
    </nav>
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
