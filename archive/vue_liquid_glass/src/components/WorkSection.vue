<template>
  <section id="work" class="content-section">
    <h2 class="section-title">Work Experience</h2>
    <div class="work-grid">
      <div class="work-card glass-card" v-for="(item, index) in workExperience" :key="index">
        <div class="work-logo">
          <img :src="item.logo" :alt="item.company">
        </div>
        <div class="work-content">
          <div class="work-header">
            <h3 class="work-title">{{ item.title }}</h3>
            <span class="work-year">{{ item.year }}</span>
          </div>
          <p class="work-company">{{ item.company }}</p>
          <p class="work-duration">{{ item.duration }}</p>
          <p class="work-location">{{ item.location }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup>
const workExperience = [
  {
    year: '2023',
    duration: '2023 – 2024',
    title: 'Computer Vision Engineer',
    company: 'Mech-Mind Technology',
    location: 'Beijing, China',
    logo: 'https://raw.githubusercontent.com/CharmingZh/CharmingZh.github.io/main/src/Work/logo_MechMind.png'
  },
  {
    year: '2022',
    duration: '2022',
    title: 'Research Intern',
    company: 'Bohr Intelligent Manufacturing',
    location: 'Shenzhen, China',
    logo: 'https://raw.githubusercontent.com/CharmingZh/CharmingZh.github.io/main/src/Work/logo_BohrIntelManu.png'
  },
  {
    year: '2020',
    duration: '2020 – 2021',
    title: 'System Software Engineer',
    company: 'ByteDance',
    location: 'Beijing, China',
    logo: 'https://raw.githubusercontent.com/CharmingZh/CharmingZh.github.io/main/src/Work/logo_ByteDance.png'
  },
  {
    year: '2018',
    duration: '2018 – 2020',
    title: 'Barista (Part Time)',
    company: 'Starbucks',
    location: 'Beijing, China',
    logo: 'https://raw.githubusercontent.com/CharmingZh/CharmingZh.github.io/main/src/Work/logo_starbucks.png'
  }
]
</script>
