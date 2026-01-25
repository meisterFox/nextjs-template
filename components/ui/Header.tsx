interface HeaderProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p'
  children: React.ReactNode
  gradient?: boolean
}

const headerStyles: Record<
  'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p',
  string
> = {
  h1: 'text-4xl font-black tracking-tight',
  h2: 'text-3xl font-bold tracking-tight',
  h3: 'text-2xl font-bold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-semibold',
  h6: 'text-base font-medium',
  p: 'text-base font-normal',
}

export const Header: React.FC<HeaderProps> = ({
  as = 'h1',
  children,
  className = '',
  gradient = false,
  ...props
}) => {
  const Tag = as
  const gradientClass = gradient ? 'text-gradient-purple' : 'text-white'
  return (
    <Tag className={`${headerStyles[as]} ${gradientClass} ${className}`} {...props}>
      {children}
    </Tag>
  )
}
