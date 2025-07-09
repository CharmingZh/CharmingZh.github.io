<script setup>
import { onMounted } from 'vue';
import HeroSection from './components/HeroSection.vue';
import AboutSection from './components/AboutSection.vue';
import EducationSection from './components/EducationSection.vue';
import WorkSection from './components/WorkSection.vue';
import ResearchSection from './components/ResearchSection.vue';
import PublicationsSection from './components/PublicationsSection.vue';
import GallerySection from './components/GallerySection.vue';
import Footer from './components/Footer.vue';

onMounted(() => {
  // All interactive JavaScript logic goes here to ensure DOM is ready.

  // --- 1. LIQUID GLASS NAVIGATION (DESKTOP) ---
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

  // --- 2. MOBILE NAVIGATION TOGGLE ---
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

  // --- 3. PUBLICATION YEAR FILTERING & SLIDER ---
  const pubNavContainer = document.querySelector('.pub-years');
  const pubListsContainer = document.querySelector('.pub-lists-container');
  if (pubNavContainer && pubListsContainer) {
    const setActiveListHeight = () => {
      const activeList = pubListsContainer.querySelector('.pub-list.active');
      if (activeList) pubListsContainer.style.height = `${activeList.scrollHeight}px`;
    };
    const updatePubSlider = () => {
      const activeButton = pubNavContainer.querySelector('.pub-year-btn.active');
      if (activeButton) {
        pubNavContainer.style.setProperty('--pub-slider-width', `${activeButton.offsetWidth}px`);
        pubNavContainer.style.setProperty('--pub-slider-translate-x', `${activeButton.offsetLeft}px`);
      }
    };
    setActiveListHeight();
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
        setActiveListHeight();
        setTimeout(updatePubSlider, 0);
      }
    });
    window.addEventListener('resize', () => {
      setActiveListHeight();
      updatePubSlider();
    });
  }

  // --- 4. GALLERY CAROUSEL ---
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = carousel.querySelector('.carousel-button--right');
    const prevButton = carousel.querySelector('.carousel-button--left');
    const dotsNav = carousel.querySelector('.carousel-nav');
    const dots = Array.from(dotsNav.children);
    const moveToSlide = (targetSlide) => {
      if(!track.querySelector('.current-slide')) return;
      track.style.transform = `translateX(-${targetSlide.offsetLeft}px)`;
      track.querySelector('.current-slide').classList.remove('current-slide');
      targetSlide.classList.add('current-slide');
    };
    const updateDots = (targetDot) => {
      if(!dotsNav.querySelector('.current-slide')) return;
      dotsNav.querySelector('.current-slide').classList.remove('current-slide');
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

  // --- 5. INFINITE RESEARCH SCROLLER ---
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

  // --- 6. THEME SWITCHER ---
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
    });
  }

  // --- 7. FADE-IN ON SCROLL ---
  const fadeInObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.content-section').forEach(section => fadeInObserver.observe(section));

  // --- 8. PARTICLE EFFECT on Profile Pic ---
  // This assumes particle-effect.js is loaded via index.html and creates a global function or object.
  // If that script exists and is correctly set up, it should work.
  const profilePic = document.querySelector('.profile-pic');
  if(profilePic && typeof ParticleEffect !== 'undefined') {
    profilePic.addEventListener('click', () => {
      new ParticleEffect(profilePic);
    });
  }
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
</template>

<style scoped>
/* App.vue is for layout, all styles are in main.css */
</style>
