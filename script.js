document.addEventListener('DOMContentLoaded', () => {

    // Theme switching logic
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    htmlElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Intersection Observer for scroll animations
    const sections = document.querySelectorAll('.content-section');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });
    sections.forEach(section => {
        observer.observe(section);
    });

    // ===== 更正后的 Gallery Carousel Logic =====
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(track.children);
        const nextButton = carousel.querySelector('.carousel-button--right');
        const prevButton = carousel.querySelector('.carousel-button--left');
        const dotsNav = carousel.querySelector('.carousel-nav');
        const dots = Array.from(dotsNav.children);

        let slideWidth = slides.length > 0 ? slides[0].getBoundingClientRect().width : 0;

        // 主要修正点：不再依赖 style.left，而是通过 slideWidth 和索引来计算位移
        const moveToSlide = (targetIndex) => {
            const amountToMove = slideWidth * targetIndex;
            track.style.transform = 'translateX(-' + amountToMove + 'px)';

            // 更新当前幻灯片和圆点的 class
            const currentSlide = track.querySelector('.current-slide');
            const currentDot = dotsNav.querySelector('.current-slide');
            currentSlide.classList.remove('current-slide');
            currentDot.classList.remove('current-slide');

            slides[targetIndex].classList.add('current-slide');
            dots[targetIndex].classList.add('current-slide');
        };

        const updateButtons = (targetIndex) => {
            prevButton.classList.remove('is-hidden');
            nextButton.classList.remove('is-hidden');
            if (targetIndex === 0) {
                prevButton.classList.add('is-hidden');
            } else if (targetIndex === slides.length - 1) {
                nextButton.classList.add('is-hidden');
            }
        };

        // 当窗口大小改变时，重新计算宽度
        window.addEventListener('resize', () => {
            if (slides.length > 0) {
                slideWidth = slides[0].getBoundingClientRect().width;
                const currentIndex = slides.findIndex(slide => slide.classList.contains('current-slide'));
                moveToSlide(currentIndex);
            }
        });

        // 点击右箭头
        nextButton.addEventListener('click', e => {
            const currentSlide = track.querySelector('.current-slide');
            const nextSlide = currentSlide.nextElementSibling;
            if (nextSlide) {
                const targetIndex = slides.findIndex(slide => slide === nextSlide);
                moveToSlide(targetIndex);
                updateButtons(targetIndex);
            }
        });

        // 点击左箭头
        prevButton.addEventListener('click', e => {
            const currentSlide = track.querySelector('.current-slide');
            const prevSlide = currentSlide.previousElementSibling;
            if (prevSlide) {
                const targetIndex = slides.findIndex(slide => slide === prevSlide);
                moveToSlide(targetIndex);
                updateButtons(targetIndex);
            }
        });

        // 点击导航圆点
        dotsNav.addEventListener('click', e => {
            const targetDot = e.target.closest('button.carousel-indicator');
            if (!targetDot) return;

            const targetIndex = dots.findIndex(dot => dot === targetDot);
            moveToSlide(targetIndex);
            updateButtons(targetIndex);
        });

        // 初始化按钮状态
        if (slides.length > 0) {
            updateButtons(0);
        }
    }
});