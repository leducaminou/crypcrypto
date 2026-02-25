"use client"
import React, { useState } from 'react'
import ModalContainer from './ModalContainer';


interface LinkWithModalProps {
    title: string;
  content: React.JSX.Element;
  footer?: React.ReactNode;
  color?: string;

}

const LinkWithModal = ({ title, content, footer,color }: LinkWithModalProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

   const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    openModal()
  };


  const finalColor = color ? color : "text-primary hover:text-blue-600"

  const finalClassName =`${finalColor}text-sm underline`

  
  return (
   <div>
     <button 
    onClick={scrollToTop}
    className={finalClassName}>
      {title}
    </button>
    <ModalContainer isOpen={isModalOpen} onClose={closeModal} footer={footer}>
        {content}
      </ModalContainer>
   </div>
  );
};

export default LinkWithModal