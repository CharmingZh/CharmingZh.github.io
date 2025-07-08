/**
 * Personal Website Script
 *
 * This script handles the following functionalities:
 * 1. Liquid Glass Navigation: Controls the sliding effect and active state.
 * 2. Publication Year Filtering: Shows/hides publications based on the selected year and smoothly animates the container height.
 * 3. Gallery Carousel: Manages the image slider functionality.
 * 4. Infinite Scroller: Duplicates research cards for a seamless loop.
 * 5. Theme Switcher: Toggles between light and dark modes.
 * 6. Fade-in on Scroll: Animates content sections as they enter the viewport.
 * 7. Sliding Pill for Publication Tabs: Controls the sliding "pill" background for the year selector.
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


    // --- 2. PUBLICATION YEAR FILTERING (WITH DYNAMIC HEIGHT) ---
    const yearButtonsContainer = document.querySelector('.pub-years');
    const pubListsContainer = document.querySelector('.pub-lists-container'); // Get the container

    if (yearButtonsContainer && pubListsContainer) {
        const publicationLists = document.querySelectorAll('.pub-list');

        // Function to set the container's height based on the active list's content
        const setActiveListHeight = () => {
            const activeList = document.querySelector('.pub-list.active');
            if (activeList) {
                // Set the container's height to match the natural height of its content
                pubListsContainer.style.height = `${activeList.scrollHeight}px`;
            }
        };

        // Set the correct height when the page first loads
        setActiveListHeight();

        yearButtonsContainer.addEventListener('click', (e) => {
            if (e.target.matches('.pub-year-btn')) {
                const selectedYear = e.target.dataset.year;

                // Update button styles
                yearButtonsContainer.querySelector('.active')?.classList.remove('active');
                e.target.classList.add('active');

                // Toggle list visibility by toggling the 'active' class
                publicationLists.forEach(list => {
                    list.classList.toggle('active', list.dataset.year === selectedYear)
                });

                // Update the container's height to match the new active list
                setActiveListHeight();
            }
        });

        // Recalculate height on window resize to ensure it's always correct
        window.addEventListener('resize', setActiveListHeight);
    }


    // --- 3. GALLERY CAROUSEL LOGIC ---
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(track.children);
        const nextButton = carousel.querySelector('.carousel-button--right');
        const prevButton = carousel.querySelector('.carousel-button--left');
        const dotsNav = carousel.querySelector('.carousel-nav');
        const dots = Array.from(dotsNav.children);

        const moveToSlide = (track, currentSlide, targetSlide) => {
            const amountToMove = targetSlide.offsetLeft;
            track.style.transform = `translateX(-${amountToMove}px)`;
            currentSlide.classList.remove('current-slide');
            targetSlide.classList.add('current-slide');
        };

        const updateDots = (currentDot, targetDot) => {
            currentDot.classList.remove('current-slide');
            targetDot.classList.add('current-slide');
        };

        nextButton.addEventListener('click', () => {
            const currentSlide = track.querySelector('.current-slide');
            const nextSlide = currentSlide.nextElementSibling || slides[0];
            const currentDot = dotsNav.querySelector('.current-slide');
            const nextDot = currentDot.nextElementSibling || dots[0];

            moveToSlide(track, currentSlide, nextSlide);
            updateDots(currentDot, nextDot);
        });

        prevButton.addEventListener('click', () => {
            const currentSlide = track.querySelector('.current-slide');
            const prevSlide = currentSlide.previousElementSibling || slides[slides.length - 1];
            const currentDot = dotsNav.querySelector('.current-slide');
            const prevDot = currentDot.previousElementSibling || dots[dots.length - 1];

            moveToSlide(track, currentSlide, prevSlide);
            updateDots(currentDot, prevDot);
        });

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

    document.querySelectorAll('.content-section').forEach(section => {
        fadeInObserver.observe(section);
    });


    // --- 7. SLIDING PILL FOR PUBLICATION TABS ---
    const pubNavContainer = document.querySelector('.pub-years');
    if (pubNavContainer) {
        const updatePubSlider = () => {
            const activeButton = pubNavContainer.querySelector('.pub-year-btn.active');
            if (activeButton) {
                const width = activeButton.offsetWidth;
                const translateX = activeButton.offsetLeft;
                pubNavContainer.style.setProperty('--pub-slider-width', `${width}px`);
                pubNavContainer.style.setProperty('--pub-slider-translate-x', `${translateX}px`);
            }
        };

        // Initial setup for the slider
        updatePubSlider();

        pubNavContainer.addEventListener('click', (e) => {
            // The filtering logic above already handles the 'active' class change.
            // We just need to update the slider's position after the click.
            if (e.target.matches('.pub-year-btn')) {
                // Use a tiny delay to ensure the .active class has been updated before calculating position
                setTimeout(updatePubSlider, 0);
            }
        });

        // Update slider on window resize
        window.addEventListener('resize', updatePubSlider);
    }

});