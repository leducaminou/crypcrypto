// app/components/ui/ButtonLink.tsx
'use client'

import React from 'react'
import Link from 'next/link'

type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'link'
  | 'outline'

type ButtonSize =
  | 'sm'
  | 'md'
  | 'lg'

interface ButtonLinkProps {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children: React.ReactNode
  className?: string
  scroll?: boolean
  replace?: boolean
  prefetch?: boolean
}

const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      href,
      variant = 'default',
      size = 'md',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      className = '',
      scroll = true,
      replace = false,
      prefetch = true,
      ...props
    },
    ref
  ) => {
    // Base styles common to all buttons
    const baseClasses = 'inline-flex items-center justify-center font-bold rounded-lg py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed'

    // Styles by variant
    const variantClasses = {
      default: 'bg-gray-300 hover:bg-gray-400 text-gray-800',
      primary: 'bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-center text-white duration-300 px-5 py-4 rounded-lg',
      secondary: 'bg-transparent border border-primary text-primary px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow',
      ghost: 'hover:bg-gray-700 text-gray-200',
      link: 'text-cyan-400 hover:underline underline-offset-4',
      outline: 'bg-transparent border border-cyan-500 text-cyan-500 hover:bg-cyan-500/10'
    }

    // Styles by size
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base'
    }

    // Conditional styles
    const fullWidthClass = fullWidth ? 'w-full' : ''

    return (
      <Link
        href={href}
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidthClass} ${className}`}
        scroll={scroll}
        replace={replace}
        prefetch={prefetch}
        {...props}
      >
        {icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </Link>
    )
  }
)

ButtonLink.displayName = 'ButtonLink'

export default ButtonLink