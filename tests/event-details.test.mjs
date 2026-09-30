import assert from 'node:assert/strict'
import test from 'node:test'
import {
  detailsFromForm,
  directionsUrl,
  eventPlace,
  mapEmbedUrl,
  parseAddress,
  parseFaqs,
  parseInfoSections,
  parseSessions,
  parseSpeakers,
  sessionSpan,
  shareLinks,
} from '@/lib/event-details'
import { eventSchemas } from '@/lib/event-schema'

/** Minimal FormData stand-in: repeated names map to arrays. */
function form(entries) {
  return {
    getAll: (name) => entries.filter(([k]) => k === name).map(([, v]) => v),
  }
}

test('sessions parse, drop invalid entries, ignore bad ends, and sort soonest first', () => {
  const sessions = parseSessions([
    { start: '2027-04-24T19:00:00-05:00', end: '2027-04-24T20:00:00-05:00' },
    { start: 'not a date' },
    { start: '2027-04-23T19:00:00-05:00', end: '2027-04-23T18:00:00-05:00' },
    'junk',
    null,
  ])
  assert.equal(sessions.length, 2)
  assert.equal(sessions[0].startDate, '2027-04-24T00:00:00.000Z')
  assert.equal(sessions[0].endDate, undefined, 'an end before the start is dropped')
  assert.equal(sessions[1].endDate, '2027-04-25T01:00:00.000Z')
  assert.deepEqual(parseSessions('nope'), [])
})

test('session span runs from the first start to the last end', () => {
  const span = sessionSpan([
    { startDate: '2027-04-23T00:00:00.000Z', endDate: '2027-04-23T01:00:00.000Z' },
    { startDate: '2027-04-25T15:00:00.000Z', endDate: '2027-04-25T16:00:00.000Z' },
  ])
  assert.deepEqual(span, { startDate: '2027-04-23T00:00:00.000Z', endDate: '2027-04-25T16:00:00.000Z' })
  assert.deepEqual(
    sessionSpan([{ startDate: 'a' }, { startDate: 'b' }]),
    { startDate: 'a', endDate: 'b' },
    'without a final end, the last start closes the span'
  )
  assert.equal(sessionSpan([]), null)
})

test('speakers, FAQs, and info sections keep only complete, safe entries', () => {
  const speakers = parseSpeakers([
    { name: ' Jane Doe ', role: 'Minister', image: 'javascript:alert(1)' },
    { name: 'John Roe', image: 'https://cdn.example.com/j.jpg' },
    { role: 'no name' },
  ])
  assert.equal(speakers.length, 2)
  assert.deepEqual(speakers[0], { name: 'Jane Doe', role: 'Minister' })
  assert.equal(speakers[1].imageAlt, 'John Roe')

  assert.deepEqual(parseFaqs([{ question: 'Q?', answer: 'A.' }, { question: 'Only a question' }]), [
    { question: 'Q?', answer: 'A.' },
  ])
  assert.deepEqual(parseInfoSections([{ heading: 'Meals', body: 'Lunch provided.' }, { heading: 'Empty' }]), [
    { heading: 'Meals', body: 'Lunch provided.' },
  ])
})

test('an address needs at least a street and city', () => {
  assert.equal(parseAddress({ street: '123 Main', city: '' }), undefined)
  assert.deepEqual(parseAddress({ street: '123 Main', city: 'Norman', region: 'OK', postalCode: '73071' }), {
    street: '123 Main',
    city: 'Norman',
    region: 'OK',
    postalCode: '73071',
  })
})

test('the admin form zips repeated fields into rows and skips blank ones', () => {
  const details = detailsFromForm(
    form([
      ['session_start', '2027-04-24T19:00'],
      ['session_end', '2027-04-24T20:00'],
      ['session_start', '2027-04-23T19:00'],
      ['session_end', ''],
      ['session_start', ''],
      ['session_end', ''],
      ['speaker_name', 'Jane Doe'],
      ['speaker_role', ''],
      ['speaker_bio', 'Preaches in Norman.'],
      ['speaker_image', '//evil.example.com/x.png'],
      ['speaker_image_alt', ''],
      ['faq_question', 'Is it free?'],
      ['faq_answer', 'Yes.'],
      ['faq_question', ''],
      ['faq_answer', ''],
      ['info_heading', 'Lodging'],
      ['info_body', 'Hotels nearby.'],
    ])
  )
  assert.equal(details.sessions.length, 2)
  // April 23, 7 p.m. CDT is midnight UTC on the 24th; stored soonest first.
  assert.deepEqual(details.sessions[0], { start: '2027-04-24T00:00:00.000Z', end: null })
  assert.deepEqual(details.sessions[1], { start: '2027-04-25T00:00:00.000Z', end: '2027-04-25T01:00:00.000Z' })
  assert.equal(details.speakers.length, 1)
  assert.equal(details.speakers[0].image, '', 'protocol-relative image links are dropped')
  assert.deepEqual(details.faqs, [{ question: 'Is it free?', answer: 'Yes.' }])
  assert.deepEqual(details.info_sections, [{ heading: 'Lodging', body: 'Hotels nearby.' }])
})

test('event place falls back to the church building and builds map links', () => {
  const home = eventPlace({})
  assert.equal(home.atBuilding, true)
  assert.match(home.line, /Outlook Drive, Harrisonville, MO 64701/)
  assert.match(mapEmbedUrl(home), /^https:\/\/maps\.google\.com\/maps\?q=Harrisonville%20Church%20of%20Christ.*output=embed$/)

  const away = eventPlace({
    locationName: 'Norman Church of Christ',
    address: { street: '1 Main St', city: 'Norman', region: 'OK', postalCode: '73071' },
  })
  assert.equal(away.atBuilding, false)
  assert.equal(away.line, '1 Main St, Norman, OK 73071')
  assert.equal(directionsUrl(away), 'https://www.google.com/maps/search/?api=1&query=1%20Main%20St%2C%20Norman%2C%20OK%2073071')
})

test('share links cover Facebook, email, and text message', () => {
  const links = shareLinks({ title: 'Gospel Meeting', summary: 'Lessons nightly.', slug: 'gospel-meeting', when: 'April 23' })
  assert.match(links.facebook, /^https:\/\/www\.facebook\.com\/sharer\/sharer\.php\?u=https%3A%2F%2F.+%2Fevents%2Fgospel-meeting$/)
  assert.match(links.email, /^mailto:\?subject=Gospel%20Meeting&body=/)
  assert.match(decodeURIComponent(links.email), /When: April 23/)
  assert.match(links.sms, /^sms:\?&body=/)
  assert.match(decodeURIComponent(links.sms), /\/events\/gospel-meeting$/)
})

const baseEvent = {
  slug: 'gospel-meeting',
  title: 'Gospel Meeting',
  summary: 'Lessons nightly.',
  description: '',
  category: 'Outreach',
  sample: false,
}

test('a multi-day event is one Event spanning its run, with each day as a subEvent', () => {
  const [schema, ...rest] = eventSchemas({
    ...baseEvent,
    startDate: '2027-04-24T00:00:00.000Z',
    endDate: '2027-04-26T16:00:00.000Z',
    sessions: [
      { startDate: '2027-04-24T00:00:00.000Z', endDate: '2027-04-24T01:00:00.000Z' },
      { startDate: '2027-04-26T15:00:00.000Z', endDate: '2027-04-26T16:00:00.000Z' },
    ],
    speakers: [{ name: 'Jane Doe', role: 'Minister' }],
    address: { street: '1 Main St', city: 'Norman', region: 'OK', postalCode: '73071' },
    locationName: 'Norman Church of Christ',
  })
  assert.equal(rest.length, 0)
  assert.equal(schema['@type'], 'Event')
  assert.equal(schema.startDate, '2027-04-24T00:00:00.000Z')
  assert.equal(schema.endDate, '2027-04-26T16:00:00.000Z')
  assert.equal(schema.subEvent.length, 2)
  assert.equal(schema.location.name, 'Norman Church of Christ')
  assert.equal(schema.location.address.addressLocality, 'Norman')
  assert.deepEqual(schema.performer, [{ '@type': 'Person', name: 'Jane Doe', jobTitle: 'Minister' }])
  assert.equal(schema.offers.price, 0)
  assert.equal(schema.eventStatus, 'https://schema.org/EventScheduled')
  assert.ok(Array.isArray(schema.image) && schema.image[0].startsWith('http'))
})

test('a repeating event is one Event per upcoming date', () => {
  const schemas = eventSchemas(
    { ...baseEvent, startDate: '2026-10-04T16:30:00.000Z', recurrenceRule: 'weekly', recurring: 'Every Sunday' },
    [{ startDate: '2026-10-04T16:30:00.000Z' }, { startDate: '2026-10-11T16:30:00.000Z' }]
  )
  assert.equal(schemas.length, 2)
  assert.notEqual(schemas[0]['@id'], schemas[1]['@id'])
  assert.equal(schemas[1].startDate, '2026-10-11T16:30:00.000Z')
})
