import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canDropInto,
  cloneElement,
  countElements,
  findElement,
  insertElement,
  newElement,
  parsePageElements,
  removeElement,
  videoEmbedUrl,
} from '@/lib/page-elements'

const heading = (id, text = 'Hello') => ({ id, type: 'heading', text, level: 2, align: 'left' })

test('parsing keeps valid elements and drops unsafe or malformed ones', () => {
  const map = parsePageElements({
    'after-hero': [
      heading('a'),
      { id: 'b', type: 'button', label: 'Go', href: 'javascript:alert(1)' },
      { id: 'c', type: 'button', label: 'Visit', href: '/contact', style: 'nope' },
      { id: 'd', type: 'image', src: 'http://insecure.example/x.jpg' },
      { id: 'e', type: 'video', url: 'https://example.com/video' },
      { id: 'f', type: 'mystery' },
    ],
    'Bad Zone!': [heading('g')],
    'empty-zone': [],
  })
  assert.deepEqual(Object.keys(map), ['after-hero'])
  assert.deepEqual(
    map['after-hero'].map((el) => el.id),
    ['a', 'c']
  )
  assert.equal(map['after-hero'][1].style, 'secondary', 'an unknown style falls back')
})

test('parsing accepts a JSON string and survives garbage', () => {
  assert.deepEqual(parsePageElements('not json'), {})
  assert.deepEqual(parsePageElements(null), {})
  assert.deepEqual(parsePageElements([1, 2]), {})
  assert.equal(parsePageElements(JSON.stringify({ z: [heading('a')] })).z.length, 1)
})

test('nesting rules: bands only at the top, boxes hold plain elements', () => {
  assert.equal(canDropInto('band', null), true)
  assert.equal(canDropInto('band', 'band'), false)
  assert.equal(canDropInto('box', 'band'), true)
  assert.equal(canDropInto('box', 'columns'), false)
  assert.equal(canDropInto('heading', 'box'), true)

  const map = parsePageElements({
    z: [
      {
        id: 'band1',
        type: 'band',
        tone: 'deep',
        children: [
          { id: 'inner-band', type: 'band', children: [] },
          { id: 'box1', type: 'box', children: [heading('h1'), { id: 'nested-box', type: 'box', children: [] }] },
        ],
      },
    ],
  })
  const band = map.z[0]
  assert.deepEqual(band.children.map((c) => c.id), ['box1'])
  assert.deepEqual(band.children[0].children.map((c) => c.id), ['h1'])
})

test('duplicate ids are renamed so selection stays unambiguous', () => {
  const map = parsePageElements({ z: [heading('same'), heading('same')] })
  assert.notEqual(map.z[0].id, map.z[1].id)
})

test('video links become embed addresses only for YouTube and Vimeo', () => {
  assert.equal(videoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  assert.equal(videoEmbedUrl('https://youtu.be/dQw4w9WgXcQ?t=3'), 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  assert.equal(videoEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  assert.equal(videoEmbedUrl('https://vimeo.com/123456789'), 'https://player.vimeo.com/video/123456789')
  assert.equal(videoEmbedUrl('https://evil.example/watch?v=dQw4w9WgXcQ'), null)
  assert.equal(videoEmbedUrl('not a url'), null)
})

test('insert adds new elements and moves existing ones', () => {
  let map = { z: [heading('a'), heading('b'), heading('c')] }
  map = insertElement(map, heading('n'), { zone: 'z', parentId: null, index: 1 })
  assert.deepEqual(map.z.map((e) => e.id), ['a', 'n', 'b', 'c'])

  // Moving "a" down past "b": the removal shifts the target index.
  map = insertElement(map, map.z[0], { zone: 'z', parentId: null, index: 3 })
  assert.deepEqual(map.z.map((e) => e.id), ['n', 'b', 'a', 'c'])

  // Moving into another zone empties nothing it should not.
  map = insertElement(map, map.z[0], { zone: 'other', parentId: null, index: 0 })
  assert.deepEqual(map.z.map((e) => e.id), ['b', 'a', 'c'])
  assert.deepEqual(map.other.map((e) => e.id), ['n'])
})

test('insert refuses drops the nesting rules forbid', () => {
  const box = { id: 'box', type: 'box', tone: 'card', children: [] }
  const band = { id: 'band', type: 'band', tone: 'light', children: [] }
  const map = { z: [box, band] }
  assert.equal(insertElement(map, newElement('band'), { zone: 'z', parentId: 'box', index: 0 }), map)
  assert.equal(insertElement(map, band, { zone: 'z', parentId: 'band', index: 0 }), map, 'not into itself')

  const next = insertElement(map, box, { zone: 'z', parentId: 'band', index: 0 })
  assert.deepEqual(next.z.map((e) => e.id), ['band'])
  assert.deepEqual(next.z[0].children.map((e) => e.id), ['box'])
})

test('find, remove, clone, and count walk containers', () => {
  const map = parsePageElements({
    z: [{ id: 'band', type: 'band', children: [{ id: 'cols', type: 'columns', children: [heading('x'), heading('y')] }] }],
  })
  assert.deepEqual(findElement(map, 'y').location, { zone: 'z', parentId: 'cols', index: 1 })
  assert.equal(countElements(map), 4)
  assert.equal(countElements(removeElement(map, 'cols')), 1)

  const copy = cloneElement(map.z[0])
  assert.notEqual(copy.id, 'band')
  assert.notEqual(copy.children[0].children[0].id, 'x')
  assert.equal(copy.children[0].children[0].text, 'Hello')

  // Removing the last element of a zone drops the zone.
  assert.deepEqual(removeElement({ z: [heading('only')] }, 'only'), {})
})
