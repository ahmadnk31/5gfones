"use client";

import React, { useState } from 'react';
import { MessageCircle, X, HelpCircle } from 'lucide-react';
import { IconBrandWhatsapp } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomerSupportChat } from './customer-support-chat';
import { useUser } from '@/hooks/use-user';

export const ChatSupportBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'whatsapp' | 'chat' | null>(null);
  const { user } = useUser();
  const phoneNumber = '+32467871205'; // Replace with your WhatsApp number
  const message = 'Hello! I have a question.';
  
  const handleOptionSelect = (option: 'whatsapp' | 'chat') => {
    setSelectedOption(option);
    
    if (option === 'whatsapp') {
      // Open WhatsApp in a new tab
      window.open(
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener,noreferrer'
      );
      // Close the menu after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setSelectedOption(null);
      }, 300);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedOption(null);
  };

  return (
    <>
      {/* Chat bubble button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-5 rounded-full shadow-lg z-50 p-4 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
        } text-white transition-all duration-300`}
        aria-label="Chat Support"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat options menu */}
      <AnimatePresence>
        {isOpen && !selectedOption && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="fixed bottom-20 right-5 bg-white rounded-lg shadow-xl p-4 z-50 w-64"
          >
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Choose a support option
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleOptionSelect('whatsapp')}
                className="flex items-center gap-3 w-full p-3 bg-green-50 hover:bg-green-100 rounded-md text-left transition-colors"
              >
                <IconBrandWhatsapp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                  <p className="text-xs text-gray-500">Chat with us on WhatsApp</p>
                </div>
              </button>
              
              <button
                onClick={() => handleOptionSelect('chat')}
                className="flex items-center gap-3 w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-md text-left transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Live Chat</p>
                  <p className="text-xs text-gray-500">Chat with our support team</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {selectedOption === 'chat' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-24 right-5 bg-white rounded-lg shadow-2xl z-50 w-[350px] h-[500px] overflow-hidden"
          >
            <CustomerSupportChat
              username={user?.email || 'Guest User'}
              onClose={handleClose}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
