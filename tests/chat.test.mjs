import assert from 'node:assert/strict'
import test from 'node:test'
import { CHAT_PAGE_SIZE, canDeleteMessage, canEditMessage, conversationPreview, formatUnreadCount, groupByDay, isValidCursor, mergeMessages, normalizeUnreadSummary, scrollTopAfterPrepend, tailMessageIds, validateChatImage } from '@/lib/portal/chat'

const msg = (id, senderId, createdAt, extra = {}) => ({ id, senderId, senderName: 'A', senderPhoto: null, senderPhotoPosition: '50% 50%', groupId: 'g', recipientId: null, body: 'hi', messageType: 'text', imageUrl: null, imageWidth: null, imageHeight: null, editedAt: null, deletedAt: null, createdAt, reactions: [], ...extra })

test('page size and cursor validation block filter injection', () => {
  assert.equal(CHAT_PAGE_SIZE, 50)
  assert.ok(isValidCursor({ id: '5f2b7f3e-1c4d-4a2b-9d1e-2f3a4b5c6d7e', createdAt: '2026-09-01T12:00:00.000Z' }))
  assert.ok(!isValidCursor({ id: '5f2b7f3e-1c4d-4a2b-9d1e-2f3a4b5c6d7e', createdAt: '2026-09-01T12:00:00Z),id.lt.5f2b7f3e-1c4d-4a2b-9d1e-2f3a4b5c6d7e' }))
  assert.ok(!isValidCursor({ id: 'nope', createdAt: '2026-09-01T12:00:00.000Z' }))
})

test('merging dedupes by id, keeps existing rows, and sorts chronologically', () => {
  const current = [msg('b', 'u1', '2026-09-01T12:00:01.000Z'), msg('c', 'u1', '2026-09-01T12:00:02.000Z')]
  const merged = mergeMessages(current, [msg('a', 'u2', '2026-09-01T12:00:00.000Z'), msg('b', 'u1', '2026-09-01T12:00:01.000Z', { body: 'stale' })])
  assert.deepEqual(merged.map((m) => m.id), ['a', 'b', 'c'])
  assert.equal(merged[1].body, 'hi')
  const replaced = mergeMessages(current, [msg('b', 'u1', '2026-09-01T12:00:01.000Z', { body: 'edited' })], { replace: true })
  assert.equal(replaced.find((m) => m.id === 'b').body, 'edited')
})

test('scroll position holds steady after older rows prepend', () => {
  assert.equal(scrollTopAfterPrepend(240, 1200, 1800), 840)
  assert.equal(scrollTopAfterPrepend(240, 1200, 1100), 240)
})

test('bubble tails go to the last message in a same-sender, same-day run', () => {
  const tails = tailMessageIds([
    msg('1', 'me', '2026-09-01T12:00:00.000Z'),
    msg('2', 'me', '2026-09-01T12:00:05.000Z'),
    msg('3', 'you', '2026-09-01T12:00:09.000Z'),
    msg('4', 'you', '2026-09-02T12:00:00.000Z'),
  ])
  assert.deepEqual([...tails], ['2', '3', '4'])
  const days = groupByDay([msg('1', 'me', '2026-09-03T00:30:00.000Z'), msg('2', 'me', '2026-09-03T12:00:00.000Z')])
  assert.deepEqual(days.map((d) => d.dateKey), ['2026-09-02', '2026-09-03'])
})

test('previews, counts, and unread summary shaping', () => {
  assert.equal(conversationPreview(null), 'No messages yet')
  assert.equal(conversationPreview({ body: '', messageType: 'image', deletedAt: null }), 'Photo')
  assert.equal(conversationPreview({ body: 'x', messageType: 'text', deletedAt: '2026-01-01' }), 'Message deleted')
  assert.equal(conversationPreview({ body: 'a'.repeat(80), messageType: 'text', deletedAt: null }).length, 56)
  assert.equal(formatUnreadCount(120), '99+')
  assert.deepEqual(normalizeUnreadSummary(null), { total: 0, groups: {}, direct: {} })
  assert.deepEqual(normalizeUnreadSummary({ total: 'x', groups: { g: 2, h: 0 }, direct: { u: '3' } }), { total: 5, groups: { g: 2 }, direct: { u: 3 } })
})

test('edit and delete permissions', () => {
  const now = Date.parse('2026-09-01T12:00:00.000Z')
  const mine = msg('1', 'me', '2026-09-01T11:00:00.000Z')
  assert.ok(canEditMessage(mine, 'me', now))
  assert.ok(!canEditMessage(mine, 'you', now))
  assert.ok(!canEditMessage({ ...mine, messageType: 'image' }, 'me', now))
  assert.ok(!canEditMessage({ ...mine, createdAt: '2026-08-30T11:00:00.000Z' }, 'me', now), 'edit window is one day')
  assert.ok(canDeleteMessage(mine, 'you', true), 'admins can remove')
  assert.ok(!canDeleteMessage({ ...mine, deletedAt: 'x' }, 'me', false))
})

test('chat photo validation rejects HEIC and oversize files', () => {
  assert.match(validateChatImage({ type: 'image/heic', size: 10, name: 'a.heic' }), /HEIC/)
  assert.match(validateChatImage({ type: 'image/gif', size: 10, name: 'a.gif' }), /JPG, PNG, or WebP/)
  assert.match(validateChatImage({ type: 'image/jpeg', size: 9 * 1024 * 1024, name: 'a.jpg' }), /8 MB/)
  assert.equal(validateChatImage({ type: 'image/jpeg', size: 10, name: 'a.jpg' }), null)
})
