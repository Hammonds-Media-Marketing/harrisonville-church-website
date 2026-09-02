'use client'

import { Button } from '@/components/primitives/Button'
import { PrinterIcon } from '@/components/ui/icons'

export function PrintButton() {
  return (
    <Button type="button" variant="primary" size="sm" onClick={() => window.print()}>
      <PrinterIcon className="h-4 w-4" /> Print
    </Button>
  )
}
