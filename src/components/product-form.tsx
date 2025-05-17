"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ReactQuillEditor } from "@/components/react-quill-editor";

interface ProductFormProps {
  product?: {
    id?: number;
    name: string;
    description?: Record<string, string>;
    short_description?: Record<string, string>;
    price: number;
    in_stock: number;
    category: string;
  };
  onSubmit: (product: any) => void;
  onCancel: () => void;
}

export const ProductForm = ({
  product,
  onSubmit,
  onCancel,
}: ProductFormProps) => {
  const t = useTranslations("products.fields");
  const pt = useTranslations("product");
  const commonT = useTranslations("common");

  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price || 0);
  const [inStock, setInStock] = useState(product?.in_stock || 0);
  const [category, setCategory] = useState(product?.category || "");

  // Multilingual descriptions - default to empty objects if not provided
  const [descriptions, setDescriptions] = useState<Record<string, string>>(
    product?.description || { en: "", es: "" }
  );

  const [shortDescriptions, setShortDescriptions] = useState<
    Record<string, string>
  >(product?.short_description || { en: "", es: "" });

  const handleDescriptionChange = (locale: string, value: string) => {
    setDescriptions({ ...descriptions, [locale]: value });
  };

  const handleShortDescriptionChange = (locale: string, value: string) => {
    setShortDescriptions({ ...shortDescriptions, [locale]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      ...product,
      name,
      description: descriptions,
      short_description: shortDescriptions,
      price: parseFloat(price.toString()),
      in_stock: parseInt(inStock.toString()),
      category,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='space-y-4'>
        <div>
          <Label htmlFor='name'>{pt("name")}</Label>
          <Input
            id='name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Product name'
            required
          />
        </div>

        <div>
          <Label htmlFor='price'>{pt("price")}</Label>
          <Input
            id='price'
            type='number'
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            min='0'
            step='0.01'
            required
          />
        </div>

        <div>
          <Label htmlFor='inStock'>{pt("quantity")}</Label>
          <Input
            id='inStock'
            type='number'
            value={inStock}
            onChange={(e) => setInStock(parseInt(e.target.value))}
            min='0'
            required
          />
        </div>

        <div>
          <Label htmlFor='category'>{pt("category")}</Label>
          <Input
            id='category'
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder='Product category'
            required
          />
        </div>

        <div className='pt-4'>
          <Label>{t("translations")}</Label>

          <Tabs defaultValue='en' className='mt-2'>
            <TabsList className='mb-4'>
              <TabsTrigger value='en'>English</TabsTrigger>
              <TabsTrigger value='es'>Español</TabsTrigger>
            </TabsList>

            {/* English content */}
            <TabsContent value='en' className='space-y-4'>
              <div>
                <Label htmlFor='shortDescription-en'>
                  {t("shortDescription")}
                </Label>
                <Input
                  id='shortDescription-en'
                  value={shortDescriptions.en || ""}
                  onChange={(e) =>
                    handleShortDescriptionChange("en", e.target.value)
                  }
                  placeholder={t("shortDescriptionPlaceholder")}
                />
              </div>

              <div>
                <Label htmlFor='description-en'>{t("description")}</Label>
                <Card className='mt-2'>
                  <CardContent className='pt-4'>
                    <ReactQuillEditor
                      value={descriptions.en || ""}
                      setValue={(value) => handleDescriptionChange("en", value)}
                      placeholder={t("descriptionPlaceholder")}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Spanish content */}
            <TabsContent value='es' className='space-y-4'>
              <div>
                <Label htmlFor='shortDescription-es'>
                  {t("shortDescription")}
                </Label>
                <Input
                  id='shortDescription-es'
                  value={shortDescriptions.es || ""}
                  onChange={(e) =>
                    handleShortDescriptionChange("es", e.target.value)
                  }
                  placeholder={t("shortDescriptionPlaceholder")}
                />
              </div>

              <div>
                <Label htmlFor='description-es'>{t("description")}</Label>
                <Card className='mt-2'>
                  <CardContent className='pt-4'>
                    <ReactQuillEditor
                      value={descriptions.es || ""}
                      setValue={(value) => handleDescriptionChange("es", value)}
                      placeholder={t("descriptionPlaceholder")}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className='flex justify-end space-x-4'>
        <Button type='button' variant='outline' onClick={onCancel}>
          {commonT("cancel")}
        </Button>
        <Button type='submit'>
          {product?.id ? commonT("save") : commonT("create")}
        </Button>
      </div>
    </form>
  );
};
