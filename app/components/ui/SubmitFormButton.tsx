import React from "react";


interface SubmitFormButtonProps {
  submitting: boolean;
  disabled?: boolean;
  type: 'create' | 'update';
  title?: string;
}

const SubmitFormButton: React.FC<SubmitFormButtonProps> = ({ submitting, type, disabled, title }) => {
  return (
    <div className="flex items-center justify-center mt-6 w-full">
      <button
        type="submit"
        disabled={submitting || disabled} // Désactive si submitting ou disabled est true
        className={`w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg font-bold
          ${ submitting || disabled ? "opacity-50 cursor-not-allowed" : "" }`}
      >
        {submitting ? "En cours..." : (title ? title : type === "create" ? "Créer" : "Enregistrer")  }
      </button>
    </div>
  );
};

export default SubmitFormButton;