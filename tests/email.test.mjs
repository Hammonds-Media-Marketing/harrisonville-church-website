import assert from 'node:assert/strict'
import test from 'node:test'
import { approvalFeedback, normalizeRecipientEmail, renderWelcomeEmail, sendWelcomeEmail, takeRateLimitSlot, welcomeEmailSubject } from '@/lib/portal/email'

test('recipient normalization accepts one clean address', () => {
  assert.equal(normalizeRecipientEmail('  Person@Example.com '), 'person@example.com')
  assert.equal(normalizeRecipientEmail('a@b.com, c@d.com'), null)
  assert.equal(normalizeRecipientEmail('a@b.com\nbcc: x@y.com'), null)
  assert.equal(normalizeRecipientEmail('not an email'), null)
})

test('welcome email renders escaped name and links, with a text alternative', () => {
  const { html, text } = renderWelcomeEmail({ full_name: '<Ada> & Co', email: 'a@b.com' })
  assert.match(html, /Welcome, &lt;Ada&gt; &amp; Co/)
  assert.match(html, /\/members\/getting-started/)
  assert.match(text, /Welcome, <Ada> & Co/)
  assert.match(welcomeEmailSubject(), /Welcome to the .* members area/)
})

test('unconfigured delivery makes no request; failures never throw', async () => {
  let calls = 0
  const fetchImpl = async () => {
    calls += 1
    return new Response(JSON.stringify({ id: 'msg_1' }), { status: 200 })
  }
  assert.deepEqual(await sendWelcomeEmail({ email: 'a@b.com' }, { fetchImpl, apiKey: '', from: '' }), { status: 'not_configured' })
  assert.equal(calls, 0)
  assert.equal((await sendWelcomeEmail({ email: 'bad' }, { fetchImpl, apiKey: 'k', from: 'f@x.com' })).status, 'invalid_recipient')
  assert.deepEqual(await sendWelcomeEmail({ email: 'a@b.com', full_name: 'Ada' }, { fetchImpl, apiKey: 'k', from: 'f@x.com' }), { status: 'sent', messageId: 'msg_1' })
  assert.equal((await sendWelcomeEmail({ email: 'a@b.com' }, { fetchImpl: async () => new Response('no', { status: 422 }), apiKey: 'k', from: 'f@x.com' })).status, 'rejected')
  assert.equal((await sendWelcomeEmail({ email: 'a@b.com' }, { fetchImpl: async () => { throw new Error('down') }, apiKey: 'k', from: 'f@x.com' })).status, 'network_error')
})

test('approval succeeds in every email outcome and the wording says so', () => {
  assert.match(approvalFeedback('sent'), /approved.*welcome email/i)
  assert.match(approvalFeedback('not_configured'), /approved.*not configured/i)
  assert.match(approvalFeedback('network_error'), /approved.*could not be sent/i)
})

test('test-send rate limit allows five per window', () => {
  const key = `k-${Date.now()}`
  for (let i = 0; i < 5; i++) assert.ok(takeRateLimitSlot(key, 5, 1000, 1000 + i))
  assert.ok(!takeRateLimitSlot(key, 5, 1000, 1010))
  assert.ok(takeRateLimitSlot(key, 5, 1000, 3000), 'window has passed')
})
