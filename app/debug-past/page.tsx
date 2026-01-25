import { DebugPastPage } from '@/components/pages/DebugPast'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DebugPastPage />
    </Suspense>
  )
}
