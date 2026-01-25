import { Button } from '@/components/ui/Button'

interface CodeProps {
  data: unknown
}

export const Code = ({ data }: CodeProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    alert('Copied to clipboard')
  }

  return (
    <code className="w-full relative glass-card rounded-2xl overflow-hidden">
      <Button
        className="absolute top-4 right-4"
        onClick={handleCopy}
        variant="glass"
        size="sm"
      >
        📋 Copy
      </Button>
      <pre className="max-h-64 min-h-32 overflow-auto p-4 text-sm font-mono whitespace-pre-wrap text-slate-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    </code>
  )
}
