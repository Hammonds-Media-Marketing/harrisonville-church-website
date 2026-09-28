import assert from 'node:assert/strict'
import test from 'node:test'
import { loadBuilderSections, parsePageSections, previewSection, PLACEHOLDER_IMAGE } from '@/lib/page-sections'
import { PAGE_TEMPLATES } from '@/lib/page-templates'
import { slugify } from '@/lib/format'

const heading = (id, text = 'Hello') => ({ id, type: 'heading', text, level: 2, align: 'left' })

test('a free layout section keeps its valid elements and drops unsafe ones', () => {
  const [section] = parsePageSections([
    {
      id: 'abc',
      type: 'elements',
      elements: [heading('el-1'), { id: 'el-2', type: 'button', label: 'Go', href: 'javascript:alert(1)', style: 'primary', align: 'left' }],
    },
  ])
  assert.equal(section.type, 'elements')
  assert.deepEqual(section.elements.map((e) => e.id), ['el-1'])
})

test('an empty free layout is not published', () => {
  assert.equal(parsePageSections([{ id: 'abc', type: 'elements', elements: [] }]).length, 0)
})

test('the builder reopens half-finished sections the public parser drops', () => {
  const raw = [
    { id: 'a', type: 'cardGrid', title: '', cards: [{ title: 'Only a title' }] },
    { id: 'b', type: 'imageText', title: 'No photo yet', body: '' },
    { id: 'c', type: 'mystery' },
    'junk',
  ]
  assert.equal(parsePageSections(raw).length, 0)
  const loaded = loadBuilderSections(raw)
  assert.deepEqual(loaded.map((s) => s.type), ['cardGrid', 'imageText'])
  assert.deepEqual(loaded[0].cards, [{ title: 'Only a title', body: '', linkLabel: '', linkHref: '' }])
  assert.equal(loaded[1].image, '')
})

test('the preview fills blanks with prompts instead of hiding the section', () => {
  const preview = previewSection({ id: 'x', type: 'imageText', tone: 'light', title: '', body: '', image: '', imageAlt: '', imageSide: 'right' })
  assert.equal(preview.title, 'Section heading')
  assert.equal(preview.image, PLACEHOLDER_IMAGE)
  const cta = previewSection({ id: 'y', type: 'cta', title: 'Visit', primaryLabel: '', primaryHref: '' })
  assert.equal(cta.title, 'Visit')
  assert.equal(cta.primaryLabel, 'Button label')
})

test('every template builds sections the builder can load', () => {
  for (const template of PAGE_TEMPLATES) {
    const sections = template.build().map((s, i) => ({ ...s, id: `t${i}` }))
    assert.equal(loadBuilderSections(sections).length, sections.length, template.id)
  }
})

test('slugify cleans hand-typed slugs', () => {
  assert.equal(slugify('/gospel-meeting-with-jimmy-cating-2026'), 'gospel-meeting-with-jimmy-cating-2026')
  assert.equal(slugify('  Gospel Meeting -- 2026 / Fall '), 'gospel-meeting-2026-fall')
  assert.equal(slugify('under_score'), 'under-score')
})
