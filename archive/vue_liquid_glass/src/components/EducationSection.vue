<template>
  <section id="education" class="content-section">
    <h2 class="section-title">Education</h2>
    <div class="education-timeline">
      <div class="timeline-line"></div>
      <div class="edu-item" v-for="(edu, index) in educationData" :key="index" :class="getDegreeClass(edu.degree)">
        <div class="edu-card glass-card" :class="getDegreeClass(edu.degree)" :style="getCardBackgroundStyle(edu.logo)">
          <div class="edu-degree-badge">{{ edu.degree }}</div>
          <div class="edu-content">
            <h3 class="edu-institution">{{ edu.institution }}</h3>
            <div class="edu-meta">
              <span class="edu-location">{{ edu.location }}</span>
              <span class="edu-duration">{{ edu.duration }}</span>
            </div>
            <div class="edu-details" v-if="edu.details && edu.details.length > 0">
              <div class="edu-detail" v-for="(detail, detailIndex) in edu.details" :key="detailIndex">
                <span class="detail-label">{{ detail.label }}:</span>
                <span class="detail-value" v-html="detail.value"></span>
              </div>
            </div>
            <div class="edu-achievement" v-if="edu.achievement">
              <span class="achievement-icon">★</span>
              {{ edu.achievement }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup>
import msuLogo from '../assets/education/msu-logo.svg'
import bjfuLogo from '../assets/education/bjfu-logo.svg'
import cumtbLogo from '../assets/education/cumtb-logo.svg'
import nenuLogo from '../assets/education/nenu-logo.png'

const educationData = [
  {
    degree: 'Ph.D.',
    year: '2024',
    duration: '2024 – Present',
    institution: 'Michigan State University',
    location: 'East Lansing, MI',
    logo: msuLogo,
    details: [
      { label: 'Advisor', value: '<a href="https://www.yuzhenlu.com/">Dr. Yuzhen Lu</a>' },
      { label: 'Committee Members', value: '<a href="https://www.egr.msu.edu/rival/">Dr. Zhaojian Li</a>, <a href="https://www.egr.msu.edu/~dmorris/">Dr. Morris Daniel</a>, <a href="https://www.canr.msu.edu/people/dr_randy_beaudry">Dr. Randy Beaudry</a>' },
      { label: 'Focus', value: 'AI-powered optical sensing and smart agriculture' }
    ]
  },
  {
    degree: 'M.S.',
    year: '2021',
    duration: '2021 – 2024',
    institution: 'Beijing Forestry University',
    location: 'Beijing, China',
    logo: bjfuLogo,
    details: [
      { label: 'Advisor', value: '<a href="https://gxy.bjfu.edu.cn/jiaozhiyuangong/jiaoshixilie/bssds/k/341310.html">Dr. Jiangming Kan</a>' },
      { label: 'Dissertation', value: '"Computer Vision-Based Automated System for DBH Measurement"' }
    ],
    achievement: 'GPA Rank: 1 / 127'
  },
  {
    degree: 'B.S.',
    year: '2016',
    duration: '2016 – 2020',
    institution: 'China University of Mining and Technology, Beijing',
    location: 'Beijing, China',
    logo: cumtbLogo,
    details: null,
    achievement: null
  },
  {
    degree: 'High School',
    year: '2010',
    duration: '2010 – 2016',
    institution: 'Northeast Normal University Affiliated High School',
    location: 'Changchun, Jilin',
    logo: nenuLogo,
    details: null,
    achievement: null
  }
]
const getDegreeClass = (degree) => {
  switch (degree.toLowerCase()) {
    case 'ph.d.':
      return 'edu-degree-phd'
    case 'm.s.':
      return 'edu-degree-master'
    case 'b.s.':
      return 'edu-degree-bachelor'
    case 'high school':
      return 'edu-degree-high-school'
    default:
      return ''
  }
}

const getCardBackgroundStyle = (logoPath) => {
  return {
    '--edu-logo-url': `url(${logoPath})`
  }
}
</script>
