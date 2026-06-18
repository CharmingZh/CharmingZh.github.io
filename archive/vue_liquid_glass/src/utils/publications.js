const ACTION_FIELDS = [
  { field: 'project_url', label: 'Project Homepage', icon: 'project' },
  { field: 'code_url', label: 'Code', icon: 'code' },
  { field: 'poster_url', label: 'Poster', icon: 'poster' },
  { field: 'dataset_url', label: 'Dataset', icon: 'code' },
  { field: 'slides_url', label: 'Slides', icon: 'poster' },
]

const ICON_PATHS = {
  project:
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  code:
    'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
  poster:
    'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z',
}

const normalizeKey = (key) => String(key || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

const cleanValue = (value) =>
  String(value || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')

const splitNames = (value) =>
  cleanValue(value)
    .split(/\s*(?:;|\band\b)\s*/i)
    .map((name) => name.trim())
    .filter(Boolean)

const getField = (fields, names) => {
  for (const name of names) {
    const value = fields[normalizeKey(name)]
    if (value) return value
  }
  return ''
}

function parseBalanced(input, startIndex, openChar, closeChar) {
  let depth = 0
  let value = ''

  for (let index = startIndex; index < input.length; index += 1) {
    const char = input[index]
    if (char === openChar) {
      depth += 1
      if (depth > 1) value += char
      continue
    }

    if (char === closeChar) {
      depth -= 1
      if (depth === 0) return { value, end: index + 1 }
      value += char
      continue
    }

    value += char
  }

  return { value, end: input.length }
}

function readBibValue(body, startIndex) {
  let index = startIndex
  while (/\s/.test(body[index])) index += 1

  if (body[index] === '{') {
    return parseBalanced(body, index, '{', '}')
  }

  if (body[index] === '"') {
    let value = ''
    index += 1
    for (; index < body.length; index += 1) {
      if (body[index] === '"' && body[index - 1] !== '\\') {
        return { value, end: index + 1 }
      }
      value += body[index]
    }
    return { value, end: index }
  }

  const commaIndex = body.indexOf(',', index)
  const end = commaIndex === -1 ? body.length : commaIndex
  return { value: body.slice(index, end), end }
}

function parseBibFields(body) {
  const firstComma = body.indexOf(',')
  const citeKey = firstComma === -1 ? body.trim() : body.slice(0, firstComma).trim()
  const fields = {}
  let index = firstComma + 1

  while (index > 0 && index < body.length) {
    while (/[\s,]/.test(body[index])) index += 1
    const keyStart = index
    while (index < body.length && /[A-Za-z0-9_-]/.test(body[index])) index += 1
    const key = normalizeKey(body.slice(keyStart, index))
    if (!key) break

    while (/\s/.test(body[index])) index += 1
    if (body[index] !== '=') break
    index += 1

    const parsed = readBibValue(body, index)
    fields[key] = cleanValue(parsed.value)
    index = parsed.end
  }

  return { citeKey, fields }
}

function normalizePublication({ citeKey, entryType, fields }) {
  const normalizedFields = {}
  Object.entries(fields).forEach(([key, value]) => {
    normalizedFields[normalizeKey(key)] = cleanValue(value)
  })

  const doi = getField(normalizedFields, ['doi'])
  const url =
    getField(normalizedFields, ['url', 'link']) ||
    (doi ? `https://doi.org/${doi.replace(/^https?:\/\/doi.org\//i, '')}` : '')
  const fallbackType = entryType === 'inproceedings' ? 'Conference' : 'Journal'

  return {
    id: citeKey,
    title: getField(normalizedFields, ['title']),
    year: getField(normalizedFields, ['year']),
    pubType: getField(normalizedFields, ['pubtype', 'type', 'category']) || fallbackType,
    status: getField(normalizedFields, ['status']),
    authors: splitNames(getField(normalizedFields, ['author', 'authors'])),
    correspondingAuthors: splitNames(
      getField(normalizedFields, ['corresponding', 'corresponding_author', 'corresponding_authors']),
    ),
    equalContributors: splitNames(
      getField(normalizedFields, ['equal_contributors', 'equal', 'cofirst']),
    ),
    secondaryEqualContributors: splitNames(
      getField(normalizedFields, ['equal_contributors_secondary', 'secondary_equal_contributors']),
    ),
    venue: getField(normalizedFields, ['venue', 'journal', 'booktitle', 'conference']),
    url,
    footnote: getField(normalizedFields, ['footnote', 'note']),
    actions: ACTION_FIELDS.map((action) => ({
      ...action,
      url: getField(normalizedFields, [action.field]),
    })).filter((action) => action.url),
  }
}

export function parseBibTex(input) {
  const publications = []
  let index = 0

  while (index < input.length) {
    const atIndex = input.indexOf('@', index)
    if (atIndex === -1) break

    const typeMatch = input.slice(atIndex).match(/^@([A-Za-z]+)\s*\{/)
    if (!typeMatch) {
      index = atIndex + 1
      continue
    }

    const bodyStart = atIndex + typeMatch[0].length - 1
    const body = parseBalanced(input, bodyStart, '{', '}')
    const { citeKey, fields } = parseBibFields(body.value)

    publications.push(
      normalizePublication({
        citeKey,
        entryType: typeMatch[1].toLowerCase(),
        fields,
      }),
    )

    index = body.end
  }

  return publications.filter((publication) => publication.title && publication.year)
}

export function parsePublicationsMarkdown(input) {
  const uncommentedInput = input.replace(/<!--[\s\S]*?-->/g, '')
  const publications = []
  let currentYear = ''
  let current = null

  const pushCurrent = () => {
    if (current) {
      publications.push(normalizePublication({ citeKey: current.id || '', entryType: '', fields: current }))
    }
    current = null
  }

  uncommentedInput.split(/\r?\n/).forEach((line) => {
    const yearMatch = line.match(/^##\s+(\d{4})\s*$/)
    if (yearMatch) {
      pushCurrent()
      currentYear = yearMatch[1]
      return
    }

    const titleMatch = line.match(/^###\s+(.+?)\s*$/)
    if (titleMatch) {
      pushCurrent()
      current = { title: cleanValue(titleMatch[1]), year: currentYear }
      return
    }

    const fieldMatch = line.match(/^-\s*([^:]+):\s*(.*)$/)
    if (fieldMatch && current) {
      current[normalizeKey(fieldMatch[1])] = cleanValue(fieldMatch[2])
    }
  })

  pushCurrent()
  return publications.filter((publication) => publication.title && publication.year)
}

export function groupPublicationsByYear(publications) {
  const years = Array.from(new Set(publications.map((publication) => publication.year))).sort(
    (a, b) => Number(b) - Number(a),
  )

  return years.map((year) => ({
    year,
    publications: publications.filter((publication) => publication.year === year),
  }))
}

export function tagClass(label) {
  const normalized = String(label || '').toLowerCase()
  if (normalized.includes('conference')) return 'tag-conference'
  if (normalized.includes('draft')) return 'tag-drafting'
  if (normalized.includes('revision')) return 'tag-revision'
  if (normalized.includes('review')) return 'tag-review'
  return 'tag-journal'
}

export function iconPath(icon) {
  return ICON_PATHS[icon] || ICON_PATHS.code
}
