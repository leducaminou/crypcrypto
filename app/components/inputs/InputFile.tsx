import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  FieldError,
  Merge,
  FieldErrorsImpl,
  UseFormRegister,
  Path,
} from "react-hook-form";
import { PROFIL_PIC_PATH } from "@/app/lib/utils";

type InputFileProps<T extends Record<string, unknown>> = {
  label: string;
  name: Path<T>;
  register: UseFormRegister<any>; 
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined;
  required?: boolean;
  fileTypes?: string;
  currentImage?: string | null;
};

const InputFile = <T extends Record<string, unknown>>({
  label,
  name,
  register,
  error,
  required = false,
  fileTypes = ".jpg, .jpeg, .png, .webp, .pdf",
  currentImage,
}: InputFileProps<T>) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const maxFileSize = 3 * 1024 * 1024; // 3 Mo
  const validMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];



   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setClientError(null);
    setPreviewUrl(null);
    setFileName(null);

    if (files && files.length > 0) {
      const file = files[0];
      
      // Vérification plus robuste
      if (!(file instanceof File)) {
        setClientError("Le fichier n'est pas valide");
        return;
      }

      setFileName(file.name);

      // Validation
      if (!fileTypes.split(', ').some(ext => file.name.toLowerCase().endsWith(ext))) {
        setClientError(`Seuls les fichiers ${fileTypes} sont acceptés`);
        return;
      }

      if (file.size > maxFileSize) {
        setClientError("Le fichier ne doit pas dépasser 3 Mo");
        return;
      }

      // Prévisualisation seulement pour les images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };


  const errorMessage = 
    typeof error?.message === 'string' 
      ? error.message 
      : clientError || "Erreur avec le fichier";

  return (
    <div
      className="flex flex-col items-center gap-2 w-full"
    >
      <label
        htmlFor={name}
        className="flex items-center justify-between gap-3 border-2 border-gray-300 p-3 rounded-lg w-full cursor-pointer hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Image src="/upload.png" width={24} height={24} alt="Icône upload" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-300">
              {label} {required && <span className="text-red-500">*</span>}
            </span>
            <span className="text-xs text-gray-500">
              {fileName
                ? `Fichier : ${fileName}`
                : `Formats : ${fileTypes}, max 3 Mo${required ? "" : " (facultatif)"}`}
            </span>
          </div>
        </div>
        <span className="text-xs text-blue-500">Choisir un fichier</span>
      </label>

      <input
        type="file"
        id={name}
        accept={fileTypes}
        {...register(name, {
          onChange: handleFileChange,
        })}
        className="hidden"
      />




      {currentImage && !previewUrl && (
        <div className="mt-2">
          <Image
            src={PROFIL_PIC_PATH+"/"+currentImage}
            alt="Prévisualisation"
            width={100}
            height={100}
            className="object-cover rounded"
          />
        </div>
      )}

      {previewUrl && (
        <div className="mt-2">
          <Image
            src={previewUrl}
            alt="Prévisualisation"
            width={100}
            height={100}
            className="object-cover rounded"
            onLoad={() => URL.revokeObjectURL(previewUrl)}
          />
        </div>
      )}


      {(error || clientError) && (
        <p className="text-xs text-red-500 mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default InputFile;