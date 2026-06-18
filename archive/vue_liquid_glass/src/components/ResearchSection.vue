<script setup>
const researchItems = [
  {
    tag: 'MSU Project',
    tagClass: 'tag-msu',
    image: '/Research/2025_Apple.png',
    alt: 'Robotic arm inspecting an apple',
    title: 'Multimodal Fusion for Apple Defect Detection',
    description:
      'Fusing 2D images and 3D point clouds with unsupervised learning to identify surface defects on apples.',
  },
  {
    tag: 'MSU Project',
    tagClass: 'tag-msu',
    image: '/Research/2025_laser.png',
    alt: '3D laser scanner analyzing chicken',
    title: 'Woody Breast Detection in Chicken',
    description:
      'Developed a dual-line laser scanning system for 3D reconstruction of chicken fillets to classify woody breast conditions.',
  },
  {
    tag: 'BFU Project',
    tagClass: 'tag-bfu',
    image: '/Research/2023_pruning.png',
    alt: 'Robotic arm in an apple orchard',
    title: 'AI-Assisted Robotic Pruning',
    description:
      'Used deep learning to segment branches and identify pruning points from RGB-D images for efficient robotic pruning.',
  },
  {
    tag: 'BFU Project',
    tagClass: 'tag-bfu',
    image: '/Research/2023_DBH.png',
    alt: 'LIDAR scanner in a forest',
    title: 'Automated Forest Inventory',
    description:
      'Designed a vision-based toolkit for reconstructing forests and automating tree DBH measurements.',
  },
  {
    tag: 'Personal Project',
    tagClass: 'tag-personal',
    image: '/Research/2021_gobi.png',
    alt: 'Diverse desert rocks and gravel',
    title: '3D Gravel Morphology Analysis',
    description:
      'Designed photogrammetric tools for detailed 3D analysis of gravel terrains in the Dunhuang Gobi.',
  },
]

const scrollerItems = researchItems
</script>

<template>
  <section id="research" class="content-section">
    <h2 class="section-title">Research Showcase</h2>
    <div class="scroller-container">
      <div class="scroller">
        <div class="scroller-content">
          <div
            v-for="(item, index) in scrollerItems"
            :key="`${item.title}-${index}`"
            class="research-card-scroll glass-card"
          >
            <div class="research-card-scroll-tag" :class="item.tagClass">{{ item.tag }}</div>
            <img :src="item.image" :alt="item.alt" class="research-card-scroll-img">
            <div class="research-card-scroll-content">
              <h3 class="research-card-scroll-title">{{ item.title }}</h3>
              <p class="research-card-scroll-desc">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
