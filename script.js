/**
 * Personal Website Script
 *
 * This script handles the following functionalities:
 * 1. Liquid Glass Navigation: Controls the sliding effect and active state.
 * 2. Publication Year Filtering: Shows/hides publications based on the selected year.
 * 3. Gallery Carousel: Manages the image slider functionality.
 * 4. Infinite Scroller: Duplicates research cards for a seamless loop.
 * 5. Theme Switcher: Toggles between light and dark modes.
 * 6. Fade-in on Scroll: Animates content sections as they enter the viewport.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. LIQUID GLASS NAVIGATION LOGIC ---
    const navContainer = document.getElementById("glass-nav-container");
    if (navContainer) {
        // Function to update the slider's position and width
        const updateSlider = () => {
            const activeOption = navContainer.querySelector('input:checked')?.parentNode;
            if (activeOption) {
                const width = activeOption.offsetWidth;
                const translateX = activeOption.offsetLeft;
                navContainer.style.setProperty('--slider-width', `${width}px`);
                navContainer.style.setProperty('--slider-translate-x', `${translateX}px`);
            }
        };

        // Function to track previous vs. current selection for animation direction
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

        // Initial setup
        updateSlider();
        trackPrevious();

        // Event listeners for navigation
        navContainer.addEventListener("change", updateSlider);
        navContainer.addEventListener("click", (e) => {
            const label = e.target.closest('label');
            if (label) {
                const radioId = label.getAttribute('for');
                const radio = document.getElementById(radioId);
                const href = radio?.nextElementSibling?.getAttribute('href');
                if(href) {
                    const targetElement = document.querySelector(href);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        });

        // Update slider on window resize
        window.addEventListener('resize', updateSlider);

        // Intersection observer to update nav based on scroll position
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
                const sectionId = bestMatch.id;
                const correspondingRadio = navContainer.querySelector(`input[value="${sectionId}"]`);
                if (correspondingRadio && !correspondingRadio.checked) {
                    correspondingRadio.checked = true;
                    correspondingRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }, {
            threshold: Array.from({ length: 21 }, (_, i) => i * 0.05), // Finer thresholds for accuracy
            rootMargin: "-80px 0px -50% 0px"
        });
        sections.forEach(section => scrollObserver.observe(section));
    }


    // --- 2. PUBLICATION YEAR FILTERING ---
    const yearButtonsContainer = document.querySelector('.pub-years');
    if (yearButtonsContainer) {
        const publicationLists = document.querySelectorAll('.pub-list');
        yearButtonsContainer.addEventListener('click', (e) => {
            if (e.target.matches('.pub-year-btn')) {
                const selectedYear = e.target.dataset.year;
                // Update button styles
                yearButtonsContainer.querySelector('.active')?.classList.remove('active');
                e.target.classList.add('active');
                // Toggle list visibility
                publicationLists.forEach(list => list.classList.toggle('active', list.dataset.year === selectedYear));
            }
        });
    }


// --- 3. GALLERY CAROUSEL LOGIC (已修正) ---
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(track.children);
        const nextButton = carousel.querySelector('.carousel-button--right');
        const prevButton = carousel.querySelector('.carousel-button--left');
        const dotsNav = carousel.querySelector('.carousel-nav');
        const dots = Array.from(dotsNav.children);

        // 此函数计算正确的位置并移动轨道
        const moveToSlide = (track, currentSlide, targetSlide) => {
            // 获取目标幻灯片在flex容器中的自然偏移位置
            const amountToMove = targetSlide.offsetLeft;
            track.style.transform = `translateX(-${amountToMove}px)`;

            // 更新当前幻灯片的class
            currentSlide.classList.remove('current-slide');
            targetSlide.classList.add('current-slide');
        };

        // 此函数更新导航点的激活状态
        const updateDots = (currentDot, targetDot) => {
            currentDot.classList.remove('current-slide');
            targetDot.classList.add('current-slide');
        };

        // 为“下一个”按钮绑定点击事件
        nextButton.addEventListener('click', () => {
            const currentSlide = track.querySelector('.current-slide');
            const nextSlide = currentSlide.nextElementSibling || slides[0];
            const currentDot = dotsNav.querySelector('.current-slide');
            const nextDot = currentDot.nextElementSibling || dots[0];

            moveToSlide(track, currentSlide, nextSlide);
            updateDots(currentDot, nextDot);
        });

        // 为“上一个”按钮绑定点击事件
        prevButton.addEventListener('click', () => {
            const currentSlide = track.querySelector('.current-slide');
            const prevSlide = currentSlide.previousElementSibling || slides[slides.length - 1];
            const currentDot = dotsNav.querySelector('.current-slide');
            const prevDot = currentDot.previousElementSibling || dots[dots.length - 1];

            moveToSlide(track, currentSlide, prevSlide);
            updateDots(currentDot, prevDot);
        });

        // 为导航点绑定点击事件
        dotsNav.addEventListener('click', e => {
            const targetDot = e.target.closest('button.carousel-indicator');
            if (!targetDot) return;

            const currentSlide = track.querySelector('.current-slide');
            const currentDot = dotsNav.querySelector('.current-slide');
            const targetIndex = dots.findIndex(dot => dot === targetDot);
            const targetSlide = slides[targetIndex];

            moveToSlide(track, currentSlide, targetSlide);
            updateDots(currentDot, targetDot);
        });
    }


    // --- 4. INFINITE SCROLLER FOR RESEARCH SHOWCASE ---
    const scroller = document.querySelector(".scroller-content");
    if(scroller && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const scrollerContent = Array.from(scroller.children);
        scrollerContent.forEach(item => {
            const duplicatedItem = item.cloneNode(true);
            duplicatedItem.setAttribute("aria-hidden", true);
            scroller.appendChild(duplicatedItem);
        });
    }


    // --- 5. THEME SWITCHER LOGIC ---
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
        });
    }


    // --- 6. FADE-IN ON SCROLL OBSERVER ---
    const fadeInObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeInObserver.unobserve(entry.target); // Stop observing after it's visible
            }
        });
    }, { threshold: 0.1 });

    // Observe all elements with the .content-section class
    document.querySelectorAll('.content-section').forEach(section => {
        fadeInObserver.observe(section);
    });
});