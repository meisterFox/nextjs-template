import { DebugPage } from '@/components/pages/Debug'
import { Suspense } from 'react'

export default function Debug() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DebugPage />
    </Suspense>
  )
}
