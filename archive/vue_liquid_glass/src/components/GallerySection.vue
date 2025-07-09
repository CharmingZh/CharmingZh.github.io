<template>
  <section id="gallery" class="content-section">
    <h2 class="section-title">Gallery</h2>
    <div class="carousel-container glass-card">
      <div class="carousel">
        <div class="carousel-track-container">
          <ul class="carousel-track">
            <li class="carousel-slide current-slide">
              <img class="carousel-image" src="https://raw.githubusercontent.com/CharmingZh/CharmingZh.github.io/main/src/Gallery/photo_01.png" alt="My research setup with a 3D scanner">
              <div class="carousel-caption"><h3>My Research Setup</h3><p>Building a custom 3D scanner for plant analysis in the lab.</p></div>
            </li>
            <li class="carousel-slide">
              <img class="carousel-image" src="https://raw.githubusercontent.com/CharmingZh/CharmingZh.github.io/main/src/Gallery/photo_02.png" alt="Deploying sensors in a corn field">
              <div class="carousel-caption"><h3>Data Collection</h3><p>Deploying sensors in the field at the MSU research farm.</p></div>
            </li>
            <li class="carousel-slide">
              <img class="carousel-image" src="https://raw.githubusercontent.com/CharmingZh/CharmingZh.github.io/main/src/Gallery/photo_03.png" alt="Presenting a poster at a conference">
              <div class="carousel-caption"><h3>Conference Presentation</h3><p>Presenting my work at the ASABE Annual International Meeting.</p></div>
            </li>
            <li class="carousel-slide">
              <img class="carousel-image" src="https://raw.githubusercontent.com/CharmingZh/CharmingZh.github.io/main/src/Gallery/photo_04.png" alt="Group photo with lab members">
              <div class="carousel-caption"><h3>Lab Team</h3><p>A great team makes research enjoyable.</p></div>
            </li>
            <li class="carousel-slide">
              <img class="carousel-image" src="https://raw.githubusercontent.com/CharmingZh/CharmingZh.github.io/main/src/Gallery/photo_05.png" alt="View of Beaumont Tower on MSU campus">
              <div class="carousel-caption"><h3>Campus Life</h3><p>Enjoying a beautiful day on campus.</p></div>
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
