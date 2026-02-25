import React from 'react'
import { FieldError } from 'react-hook-form';

interface PhoneFieldProps {
  countries: string[];
  defaultInputValue?: string;
  register: any;
  options: any;
  autoComplete?: string;

  name: string;
  defaultCodeValue?: string;
  description?: string;
  inputProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
  required?: boolean;
  disabled?: boolean;
  subtable?: string;
  width?: string;
  step?: string;
  onSelectChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onInputChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onValueChange?: string;
}

const PhoneField = ({
  countries,
  defaultInputValue,
  step,
  register,
  defaultCodeValue,
  onValueChange,
  options,
  disabled,
  autoComplete,
  onSelectChange,
  onInputChange,
}: PhoneFieldProps) => {
  // Déterminer la valeur par défaut si elle n'est pas fournie

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center">
        <div className='w-1/4'>
          <select
            {...register('code')}
            defaultValue={defaultCodeValue}
            id='phone'
            disabled={disabled}
            onValueChange={onValueChange}
            onChange={onSelectChange}
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white sm:text-sm"
          >

            {
              options.map((i: any) => (
                <option key={i.id} value={i.id}>
                  {i.code}
                </option>
              ))
            }
          </select>
        </div>
        <div className='w-1/4'>
          <input
            id='phonenumber'
            type='text'
            autoComplete={autoComplete}
            step={step}
            disabled={disabled}
            {...register('phonenumber')}
            defaultValue={defaultInputValue}
            required
            onChange={onInputChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white sm:text-sm"
          />
        </div>

      </div>
    </div>
  )
}

export default PhoneField