'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function FAQPage() {
  const t = useTranslations('faq');
  const c = useTranslations('common');
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // FAQ categories and their questions
  const categories = [
    {
      id: 'general',
      title: t('categories.general'),
      questions: [
        { id: 'what-is-finopen', question: t('general.what.question'), answer: t('general.what.answer') },
        { id: 'create-account', question: t('general.account.question'), answer: t('general.account.answer') },
        { id: 'log-in', question: t('general.login.question'), answer: t('general.login.answer') },
        { id: 'reset-password', question: t('general.password.question'), answer: t('general.password.answer') },
      ],
    },
    {
      id: 'orders',
      title: t('categories.orders'),
      questions: [
        { id: 'track-order', question: t('orders.track.question'), answer: t('orders.track.answer') },
        { id: 'cancel-order', question: t('orders.cancel.question'), answer: t('orders.cancel.answer') },
        { id: 'modify-order', question: t('orders.modify.question'), answer: t('orders.modify.answer') },
        { id: 'payment-methods', question: t('orders.payment.question'), answer: t('orders.payment.answer') },
      ],
    },
    {
      id: 'shipping',
      title: t('categories.shipping'),
      questions: [
        { id: 'shipping-time', question: t('shipping.time.question'), answer: t('shipping.time.answer') },
        { id: 'shipping-cost', question: t('shipping.cost.question'), answer: t('shipping.cost.answer') },
        { id: 'shipping-international', question: t('shipping.international.question'), answer: t('shipping.international.answer') },
        { id: 'shipping-track', question: t('shipping.track.question'), answer: t('shipping.track.answer') },
      ],
    },
    {
      id: 'returns',
      title: t('categories.returns'),
      questions: [
        { id: 'return-policy', question: t('returns.policy.question'), answer: t('returns.policy.answer') },
        { id: 'start-return', question: t('returns.start.question'), answer: t('returns.start.answer') },
        { id: 'return-refund', question: t('returns.refund.question'), answer: t('returns.refund.answer') },
        { id: 'damaged-items', question: t('returns.damage.question'), answer: t('returns.damage.answer') },
      ],
    },
    {
      id: 'products',
      title: t('categories.products'),
      questions: [
        { id: 'product-warranty', question: t('products.warranty.question'), answer: t('products.warranty.answer') },
        { id: 'product-availability', question: t('products.availability.question'), answer: t('products.availability.answer') },
        { id: 'product-specs', question: t('products.specs.question'), answer: t('products.specs.answer') },
        { id: 'product-compatibility', question: t('products.compatibility.question'), answer: t('products.compatibility.answer') },
      ],
    },
  ];

  // Filter questions based on search query
  const filteredCategories = searchQuery.trim() === ''
    ? categories
    : categories.map(category => ({
        ...category,
        questions: category.questions.filter(q => 
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t('subtitle')}</p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder={t('searchPlaceholder')} 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline"
            onClick={() => setSearchQuery('')}
            className={searchQuery ? 'opacity-100' : 'opacity-0'}
          >
            {c('cancel')}
          </Button>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-3xl mx-auto space-y-10">
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => (
            <div key={category.id}>
              {category.questions.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold mb-6">{category.title}</h2>
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {category.questions.map(faq => (
                      <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-6">
                        <AccordionTrigger className="py-4 text-lg font-semibold">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-6">
                          <div className="text-muted-foreground">
                            {faq.answer}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </>
              )}
            </div>
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground mb-4">{t('noResults')}</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery('')}
              >
                {t('clearSearch')}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Contact section at the bottom */}
        <Card className="mt-10">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center p-4 space-y-4">
              <h2 className="text-xl font-bold">{t('stillNeedHelp')}</h2>
              <p className="text-muted-foreground max-w-lg">{t('contactDescription')}</p>
              <Button asChild>
                <a href="contact">{t('contactUsButton')}</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
