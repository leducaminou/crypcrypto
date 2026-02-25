import React from "react";

const PageLoadingSpiner = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full h-screen bg-gray-800">
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
      <h6>Chargement en cours...</h6>
    </div>
  );
};

export default PageLoadingSpiner;
