// app/components/ui/Button.tsx
import React, { ButtonHTMLAttributes } from 'react'

type ButtonVariant =
  | 'default' // Added default variant
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'link'
  | 'outline' // Added outline variant

type ButtonSize =
  | 'sm'
  | 'md'
  | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  loading?: boolean
  type?: 'button' | 'submit'
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type = 'button',
      variant = 'default', // Changed default to 'default'
      size = 'md',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      loading = false,
      children,
      className = '',
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    // Base styles common to all buttons
    const baseClasses = 'inline-flex items-center justify-center font-bold rounded-lg py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed'

    // Styles by variant
    const variantClasses = {
      default: 'bg-gray-300 hover:bg-gray-400 text-gray-800', // Default variant: simple gray button
      primary: 'bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-center text-white duration-300 px-5 py-4 rounded-lg',
      secondary: 'bg-transparent border border-primary text-primary px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow',
      ghost: 'hover:bg-gray-700 text-gray-200',
      link: 'text-cyan-400 hover:underline underline-offset-4',
      outline: 'bg-transparent border border-cyan-500 text-cyan-500 hover:bg-cyan-500/10' // Outline variant: transparent with colored border
    }

    // Styles by size
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base'
    }

    // Conditional styles
    const fullWidthClass = fullWidth ? 'w-full' : ''
    const loadingClass = loading ? 'opacity-70 cursor-wait' : ''

    return (
      <button
        type={type}
        onClick={onClick}
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidthClass} ${loadingClass} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {children}
          </span>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="mr-2">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="ml-2">{icon}</span>
            )}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button