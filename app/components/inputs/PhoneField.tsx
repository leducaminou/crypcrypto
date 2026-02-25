import React, { ChangeEvent } from 'react'
import { FieldError, UseFormRegister } from 'react-hook-form';

interface PhoneFieldProps {
  full?: boolean;
  height?: 'sm' | 'xs';
  width?: string;
  label?: string;
  countries: any[];
  defaultInputValue?: string;
  register: UseFormRegister<any>;
  autoComplete?: string;
  errors: any;
  defaultCodeValue?: string;
  description?: string;
  inputProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
  required?: boolean;
  disabled?: boolean;
  subtable?: string;
  step?: string;
  onSelectChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onInputChange?: React.ChangeEventHandler<HTMLInputElement>;
  onValueChange?: string;
  transform?: (value: string) => string;
}

const PhoneField = ({
  countries,
  defaultInputValue,
  step,
  register,
  defaultCodeValue,
  onValueChange,
  errors,
  disabled,
  autoComplete,
  height = "xs",
  full,
  width,
  required,
  label,
  onSelectChange,
  onInputChange,
  transform,
}: PhoneFieldProps) => {
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (transform) {
      e.target.value = transform(e.target.value);
    }
    if (onInputChange) {
      onInputChange(e);
    }
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (onSelectChange) {
      onSelectChange(e);
    }
  };

  const divClass = full
    ? "flex flex-col gap-2 w-full"
    : width
    ? `${width} flex flex-col gap-2`
    : "flex flex-col gap-2 w-full";
  
  const heightClass = height === 'xs'
    ? "px-3 py-2"
    : "px-4 py-3";
  
  const inputClass = `${heightClass} appearance-none block w-full px-3 py-2 border border-gray-600 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 bg-gray-700 text-white sm:text-sm`

  return (
    <div className={divClass}>
      <label className="block text-sm">
        <span className="font-medium text-gray-300">{label ? label : "Téléphone"}</span>
        {required ? (
          <span className="text-red-500"> *</span>
        ) : (
          <span className="text-gray-300"> (optionnel)</span>
        )}
      </label>
      
      <div className="flex gap-0 items-center">
        <div className='w-1/3'>
          <select
            {...register('country_id')}
            defaultValue={defaultCodeValue || ''}
            id='country_id'
            disabled={disabled}
            onChange={handleSelectChange}
            required={required}
            className={`${inputClass} rounded-l-md`}
          >
            <option value="">Sélectionnez</option>
            {countries.map((country: any) => (
              <option key={country.id} value={country.id}>
                {country.dial_code} {country.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className='w-2/3'>
          <input
            id='phonenumber'
            type='text'
            placeholder='Ex: 605742511'
            autoComplete={autoComplete}
            step={step}
            disabled={disabled}
            {...register("phonenumber", {
              onChange: handlePhoneChange,
            })}
            defaultValue={defaultInputValue || ''}
            required={required}
            className={`${inputClass} rounded-r-md`}
          />
        </div>
      </div>
      
      {errors?.phonenumber && (
        <p className="mt-1 text-sm text-red-400">{errors.phonenumber.message}</p>
      )}
      {errors?.country_id && (
        <p className="mt-1 text-sm text-red-400">{errors.country_id.message}</p>
      )}
    </div>
  )
}

export default PhoneField