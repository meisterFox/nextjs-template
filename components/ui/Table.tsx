import { Button } from '@/components/ui/Button'

interface Column<T> {
  key: keyof T
  label: string
  render?: (item: T, index: number) => React.ReactNode
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  hasNextPage?: boolean
  isLoading?: boolean
  getRowKey: (item: T) => string | number
  loadMore?: () => void
}

export function Table<T>({
  data,
  columns,
  hasNextPage,
  isLoading,
  getRowKey,
  loadMore,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-hidden rounded-2xl glass-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-b border-white/10">
              {columns.map((col) => (
                <th
                  key={`thead_${col.key as string}`}
                  className="text-left p-5 font-bold text-violet-300 uppercase text-xs tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={`${getRowKey(item)}_${index}`}
                className="border-b border-white/5 hover:bg-white/5 transition-all duration-300 group"
              >
                {columns.map((col) => (
                  <td
                    key={`${getRowKey(item)}_${col.key as string}`}
                    className="p-5 text-slate-300 group-hover:text-white transition-colors"
                  >
                    {col.render
                      ? col.render(item, index)
                      : String(item[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {loadMore ? (
            <tfoot>
              <tr>
                <td className="p-6" colSpan={columns.length}>
                  <div className="flex items-center justify-center w-full">
                    <Button
                      variant="primary"
                      onClick={loadMore}
                      disabled={!hasNextPage || isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Loading...
                        </span>
                      ) : hasNextPage ? (
                        'Load More'
                      ) : (
                        '✓ All Data Loaded'
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="p-12 text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-slate-400">No data available</p>
        </div>
      )}
    </div>
  )
}
