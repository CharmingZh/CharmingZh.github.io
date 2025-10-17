<template>
  <section id="gallery" class="content-section">
    <h2 class="section-title">Gallery</h2>
    <div class="carousel-container glass-card">
      <div class="carousel">
        <div class="carousel-track-container">
          <ul class="carousel-track">
            <li class="carousel-slide current-slide">
              <img
                class="carousel-image"
                src="/Gallery/photo_01.png"
                alt="1"
                loading="lazy"
                decoding="async"
              >
              <div class="carousel-caption"><h3>2024, School of Engineering</h3><p>Master's Graduation at Beijing Forestry University.</p></div>
            </li>
            <li class="carousel-slide">
              <img
                class="carousel-image"
                src="/Gallery/photo_02.png"
                alt="2"
                loading="lazy"
                decoding="async"
              >
              <div class="carousel-caption"><h3>Master's Thesis Defense</h3><p>Beijing Forestry University.</p></div>
            </li>
            <li class="carousel-slide">
              <img
                class="carousel-image"
                src="/Gallery/photo_03.png"
                alt="3"
                loading="lazy"
                decoding="async"
              >
              <div class="carousel-caption"><h3>Nanjing, 2018</h3><p>Nanjing, 2018</p></div>
            </li>
            <li class="carousel-slide">
              <img
                class="carousel-image"
                src="/Gallery/photo_04.png"
                alt="4"
                loading="lazy"
                decoding="async"
              >
              <div class="carousel-caption"><h3>Workspace in the U.S.</h3><p>Enjoying a beautiful day.</p></div>
            </li>
            <li class="carousel-slide">
              <img
                class="carousel-image"
                src="/Gallery/photo_05.png"
                alt="5"
                loading="lazy"
                decoding="async"
              >
              <div class="carousel-caption"><h3>Beidahu Ski Resort, Jilin</h3><p>Snowboarding is not only a beloved sport, but also a way to connect with nature and find clarity.</p></div>
            </li>
          </ul>
        </div>
        <button class="carousel-button carousel-button--left"><svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg></button>
        <button class="carousel-button carousel-button--right"><svg viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"></path></svg></button>
        <div class="carousel-nav">
          <button class="carousel-indicator current-slide"></button>
          <button class="carousel-indicator"></button>
          <button class="carousel-indicator"></button>
          <button class="carousel-indicator"></button>
          <button class="carousel-indicator"></button>
        </div>
      </div>
    </div>
  </section>
</template>
