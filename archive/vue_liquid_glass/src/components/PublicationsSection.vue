<script setup>
import { computed } from 'vue'
import publicationsBib from '../data/publications.bib?raw'
import publicationsMarkdown from '../data/publications.md?raw'
import {
  groupPublicationsByYear,
  iconPath,
  parseBibTex,
  parsePublicationsMarkdown,
  tagClass,
} from '../utils/publications'

const publications = computed(() => {
  const markdownPublications = parsePublicationsMarkdown(publicationsMarkdown)
  return markdownPublications.length ? markdownPublications : parseBibTex(publicationsBib)
})

const publicationGroups = computed(() => groupPublicationsByYear(publications.value))
const activeYear = computed(() => publicationGroups.value[0]?.year || '')

const publicationTags = (publication) => [publication.pubType, publication.status].filter(Boolean)

const sameName = (left, right) => left.trim().toLowerCase() === right.trim().toLowerCase()

const isMe = (author) => sameName(author, 'Jiaming Zhang')

const hasAuthor = (authors, author) => authors.some((candidate) => sameName(candidate, author))

const authorClasses = (publication, author) => ({
  me: isMe(author),
  'corr-author': hasAuthor(publication.correspondingAuthors, author),
})

const equalMarker = (publication, author) => {
  if (hasAuthor(publication.equalContributors, author)) return '†'
  if (hasAuthor(publication.secondaryEqualContributors, author)) return '‡'
  return ''
}
</script>

<template>
  <section id="publications" class="content-section">
    <h2 class="section-title">Publications</h2>

    <div class="pub-years">
      <button
        v-for="group in publicationGroups"
        :key="group.year"
        class="pub-year-btn"
        :class="{ active: group.year === activeYear }"
        :data-year="group.year"
        :c-option="group.year"
      >
        {{ group.year }}
      </button>
    </div>

    <div class="pub-lists-container glass-card">
      <div
        v-for="group in publicationGroups"
        :id="`publications-list-${group.year}`"
        :key="group.year"
        class="pub-list"
        :class="{ active: group.year === activeYear }"
        :data-year="group.year"
      >
        <ul>
          <li v-for="publication in group.publications" :key="publication.id" class="pub-card">
            <div class="pub-meta">
              <span
                v-for="tag in publicationTags(publication)"
                :key="tag"
                class="pub-tag"
                :class="tagClass(tag)"
              >
                {{ tag }}
              </span>
            </div>

            <p class="pub-title">
              <a
                v-if="publication.url"
                :href="publication.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                "{{ publication.title }}"
              </a>
              <span v-else>"{{ publication.title }}"</span>
            </p>

            <p v-if="publication.authors.length" class="authors">
              <template v-for="(author, index) in publication.authors" :key="`${publication.id}-${author}`">
                <template v-if="index > 0">, </template>
                <span :class="authorClasses(publication, author)">
                  <b v-if="isMe(author)">{{ author }}</b>
                  <template v-else>{{ author }}</template>
                  <sup v-if="equalMarker(publication, author)" class="co-first-author-symbol">
                    {{ equalMarker(publication, author) }}
                  </sup>
                </span>
              </template>
            </p>

            <p v-if="publication.venue" class="pub-venue">{{ publication.venue }}</p>
            <p v-if="publication.footnote" class="pub-footnote">{{ publication.footnote }}</p>
            <p
              v-else-if="publication.equalContributors.length || publication.secondaryEqualContributors.length"
              class="pub-footnote"
            >
              <sup class="co-first-author-symbol">†</sup>: Equal contribution
            </p>

            <div v-if="publication.actions.length" class="pub-links">
              <a
                v-for="action in publication.actions"
                :key="`${publication.id}-${action.field}`"
                :href="action.url"
                class="pub-action-tag"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path :d="iconPath(action.icon)"></path>
                </svg>
                <span>{{ action.label }}</span>
              </a>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
