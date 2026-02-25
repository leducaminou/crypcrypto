import { FC, useState } from 'react';
import { Eye, EyeClosed } from 'lucide-react';
import { FieldError, UseFormRegister } from 'react-hook-form';

interface InputPasswordProps {
  id: string;
  name: string;
  label: string;
  autoComplete?: string;
  required?: boolean;
  register: UseFormRegister<any>;
  error?: FieldError;
  disclaimer?: boolean;
  validate?: (value: string) => boolean | string;
}

const InputPassword: FC<InputPasswordProps> = ({
  id,
  name,
  label,
  autoComplete,
  required,
  disclaimer,
  register,
  error,
  validate,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div>
      <label className="block text-sm" htmlFor={id ? id : name}>
        <span className="font-medium text-gray-300">{label}</span>
        {required ? 
          <span className="text-red-500"> *</span> 
          : <span className="text-gray-300"> (optionnel)</span>} 
      </label>

      <div className="mt-1 relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          {...register(name, { validate })}
          className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white sm:text-sm"
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 focus:outline-none"
          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {
        disclaimer &&  <div className='w-full pl-6'>
          <ul className="mt-2 text-xs text-gray-500 list-disc ">
          <li>Entre 8 et 20 caractères</li>
          <li>Au moins une minuscule</li>
          <li>Au moins une Majuscule</li>
          <li>Un caractère et un caractère spécial @$!%*?&</li>
            
              </ul>
        </div>
      }
             
      {error && (
        <p className="mt-1 text-sm text-red-400">{error.message}</p>
      )}
    </div>
  );
};

export default InputPassword;