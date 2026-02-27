import React from "react";

const PageLoadingSpiner = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p>Chargement en cours...</p>
      </div>
    </div>
  );
};

export default PageLoadingSpiner;
