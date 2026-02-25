import { FC } from "react";
import { FieldError } from "react-hook-form";

interface TextAreaFieldProps {
  full?: boolean;
  height?: 'sm' | 'xs';
  width?: string;
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  register: any;
  error?: FieldError;
}

const TextAreaField: FC<TextAreaFieldProps> = ({
  id,
  name,
  label,
  placeholder,
  required,
  register,
  error,
  height="xs",
  full,
  width,
}) => {
   const divClass = full
    ? "flex flex-col gap-2 w-full"
    : width
    ? `${width} flex flex-col gap-2`
    : "flex flex-col gap-2 w-full md:w-1/4";
    
  const heightClass = height ===  'xs'
    ? "px-3 py-2"
    : "px-4 py-3";
  const inputClass = `${heightClass} appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 bg-gray-700 text-white sm:text-sm`

  return (
    <div className={divClass}>
      <label className="block text-sm" htmlFor={id ? id : name}>
        <span className="font-medium text-gray-300">{label}</span>
        {required ? (
          <span className="text-red-500"> *</span>
        ) : (
          <span className="text-gray-300"> (optionnel)</span>
        )}
      </label>

      <div className="mt-1">
        <textarea
          id={id ? id : name}
          {...register(name)}
          placeholder={placeholder}
          required={required}
          className={inputClass}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
      </div>
    </div>
  );
};

export default TextAreaField;