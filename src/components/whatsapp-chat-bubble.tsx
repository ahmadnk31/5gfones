// components/WhatsAppButton.tsx
import React from 'react';
import {  } from 'lucide-react';
import { IconBrandWhatsapp } from '@tabler/icons-react';

export const WhatsAppButton = () => {
  const phoneNumber = '+32467871205'; // Replace with your number
  const message = 'Hello! I have a question.';
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 bg-green-500 text-white rounded-full p-4 shadow-lg z-50 hover:bg-green-600 transition-all"
    >
      <IconBrandWhatsapp size={24} />
    </a>
  );
};


