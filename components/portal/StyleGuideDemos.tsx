'use client'

import { useState } from 'react'
import { Button } from '@/components/primitives/Button'
import { Dialog } from '@/components/primitives/Dialog'
import { SegmentedControl } from '@/components/primitives/Controls'

/** Interactive samples for the style guide: the dialog and a button-driven segmented control. */
export function DialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Open a dialog
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete this message?"
        description="It will show as deleted for everyone in the conversation."
        size="sm"
        footer={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </>
        }
      >
        <p className="m-0 text-sm text-muted">A bottom sheet on phones, a centered card on larger screens. Escape, the backdrop, and the close button all dismiss it; focus returns to the trigger.</p>
      </Dialog>
    </>
  )
}

export function SegmentedDemo() {
  const [value, setValue] = useState<'month' | 'week' | 'day'>('month')
  return (
    <SegmentedControl
      label="Calendar view"
      value={value}
      onChange={setValue}
      segments={[
        { value: 'month', label: 'Month' },
        { value: 'week', label: 'Week' },
        { value: 'day', label: 'Day' },
      ]}
    />
  )
}
