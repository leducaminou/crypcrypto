// app/components/ui/DropdownFilter.tsx
'use client'

import { ChevronsUpDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface DropdownOption {
  value: string
  label: string
}

interface DropdownFilterProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export default function DropdownFilter({
  options,
  value,
  onChange,
  className = '',
  placeholder = 'Filter...'
}: DropdownFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.value === value) || options[0]

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div 
      ref={dropdownRef}
      className={`relative ${className}`}
    >
      <button
        type="button"
        className="inline-flex justify-between items-center w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronsUpDown
  className={`-mr-1 ml-2 h-5 w-5 ${isOpen ? 'text-cyan-400' : 'text-gray-400'}`}
/>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-gray-800 border border-gray-700 z-10">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                className={`block w-full text-left px-4 py-2 text-sm ${value === option.value ? 'bg-gray-700 text-cyan-400' : 'text-gray-300 hover:bg-gray-700'}`}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}