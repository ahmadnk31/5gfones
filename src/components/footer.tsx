"use client";
import { ThemeSwitcher } from "@/components/ui/kibo-ui/theme-switcher";
import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";
import { NewsletterForm } from "./newsletter-form";
import { ThemeToggle } from "./theme-toggle";
import { CreatedBy } from "./created-by";
import { GdprComplianceBadge } from "./gdpr-compliance-badge";

const Footer = () => {
  const t = useTranslations("footer");
  const locale = useLocale();
  return (
    <footer
      className='bg-gray-900 text-gray-300'
      aria-labelledby='footer-heading'
    >
      <h2 id='footer-heading' className='sr-only'>
        Footer
      </h2>
      <div className='container mx-auto px-4 py-12 max-w-6xl'>
        {" "}
        {/* Newsletter Subscription */}
        <div className='mb-12'>
          <div className='max-w-md mx-auto sm:mx-0'>
            <h3 className='text-lg font-semibold mb-4 text-white'>
              {t("subscribeToNewsletter") || "Subscribe to our newsletter"}
            </h3>
            <p className='text-sm text-gray-400 mb-4'>
              {t("newsletterDescription") ||
                "Stay updated with our latest products, services, and promotions."}
            </p>
            <NewsletterForm />
          </div>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8'>
          {/* Company Info */}
          <div className='mb-6 md:mb-0'>
            <h2 className='text-xl font-bold mb-4 text-white'>5GPhones</h2>
            <p className='mb-4 text-sm'>{t("description")}</p>{" "}
            <div className='flex space-x-4'>
              <a
                href='https://facebook.com'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors'
                aria-label='Facebook'
              >
                <Facebook size={20} />
                <span className='sr-only'>{t("followUs")} Facebook</span>
              </a>
              <a
                href='https://twitter.com'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors'
                aria-label='Twitter'
              >
                <Twitter size={20} />
                <span className='sr-only'>{t("followUs")} Twitter</span>
              </a>
              <a
                href='https://instagram.com'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors'
                aria-label='Instagram'
              >
                <Instagram size={20} />
                <span className='sr-only'>{t("followUs")} Instagram</span>
              </a>
              <a
                href='https://linkedin.com'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors'
                aria-label='LinkedIn'
              >
                <Linkedin size={20} />
                <span className='sr-only'>{t("followUs")} LinkedIn</span>
              </a>
              <a
                href='https://github.com'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors'
                aria-label='GitHub'
              >
                <Github size={20} />
                <span className='sr-only'>{t("followUs")} GitHub</span>
              </a>
            </div>
          </div>
          {/* Quick Links */}
          <div>
            <h3 className='text-lg font-semibold mb-4 text-white'>
              {t("quickLinks")}
            </h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href={`/${locale}/products`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("products")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/categories`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("categories")}
                </Link>
              </li>{" "}
              <li>
                <Link
                  href={`/${locale}/brands`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("brands")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/sustainability`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("sustainability")}
                </Link>
              </li>
            </ul>
          </div>{" "}
          {/* Customer Service */}
          <div>
            <h3 className='text-lg font-semibold mb-4 text-white'>
              {t("customerService")}
            </h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("contactUs")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/faq`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("faqs")}
                </Link>
              </li>{" "}
              <li>
                <Link
                  href={`/${locale}/shipping-policy`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("shippingPolicy")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/returns`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("returns")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/privacy-policy`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("termsOfService")}
                </Link>
              </li>
            </ul>
          </div>
          {/* Repair Services */}
          <div>
            <h3 className='text-lg font-semibold mb-4 text-white'>
              {t("repairs", { defaultValue: "Repair Services" })}
            </h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  href={`/${locale}/repair`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("deviceRepair", { defaultValue: "Device Repair" })}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/repair/schedule`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("scheduleRepair", { defaultValue: "Schedule Repair" })}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/repair/track`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("trackRepair", { defaultValue: "Track Repair" })}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/repair/parts`}
                  className='text-gray-400 hover:text-white text-sm'
                >
                  {t("repairParts", { defaultValue: "Repair Parts" })}
                </Link>
              </li>
            </ul>
          </div>
          {/* Contact Info */}
          <div>
            <h3 className='text-lg font-semibold mb-4 text-white'>
              {t("contact")}
            </h3>
            <ul className='space-y-2 text-sm'>
              <li className='flex items-start'>
                <span className='mr-2'>📍</span>
                <span>{t("address")}</span>
              </li>
              <li className='flex items-start'>
                <span className='mr-2'>📞</span>
                <span>{t("phone")}</span>
              </li>
              <li className='flex items-start'>
                <span className='mr-2'>✉️</span>
                <span>{t("email")}</span>
              </li>
              <li className='flex items-start'>
                <span className='mr-2'>⏰</span>
                <span>{t("hours")}</span>
              </li>
            </ul>
          </div>{" "}
        </div>
        <div className='border-t border-gray-800 mt-8 pt-6'>
          {" "}
          <div className='flex flex-col md:flex-row justify-between items-center'>
            {/* Language & Theme Selectors */}
            <div className='mb-4 md:mb-0 flex flex-col sm:flex-row gap-4 sm:items-center'>
              {/* Theme Toggle */}
              <div className='flex items-center gap-2 text-sm'>
                <span>{t("theme") || "Theme"}:</span>
              </div>

              {/* Language Selector */}
              <div className='flex items-center space-x-2 text-sm'>
                <span id='language-label'>{t("language") || "Language"}:</span>
                <div
                  className='flex space-x-3'
                  role='group'
                  aria-labelledby='language-label'
                >
                  <Link
                    href='/en'
                    className={`${
                      locale === "en"
                        ? "text-white font-medium"
                        : "text-gray-400"
                    } hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 px-2 py-1 rounded-sm`}
                    aria-current={locale === "en" ? "page" : undefined}
                  >
                    English
                  </Link>
                  <Link
                    href='/es'
                    className={`${
                      locale === "es"
                        ? "text-white font-medium"
                        : "text-gray-400"
                    } hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 px-2 py-1 rounded-sm`}
                    aria-current={locale === "es" ? "page" : undefined}
                  >
                    Español
                  </Link>
                  <Link
                    href='/fr'
                    className={`${
                      locale === "fr"
                        ? "text-white font-medium"
                        : "text-gray-400"
                    } hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 px-2 py-1 rounded-sm`}
                    aria-current={locale === "fr" ? "page" : undefined}
                  >
                    Français
                  </Link>
                  <Link
                    href='/de'
                    className={`${
                      locale === "de"
                        ? "text-white font-medium"
                        : "text-gray-400"
                    } hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 px-2 py-1 rounded-sm`}
                    aria-current={locale === "de" ? "page" : undefined}
                  >
                    Deutsch
                  </Link>
                </div>
              </div>
            </div>{" "}            {/* Copyright */}{" "}
            <div className='text-sm text-center text-gray-400'>
              <p>{t("copyright", { year: new Date().getFullYear() })}</p>
              <p className='mt-2'>{t("proudlyMadeBy")}</p>
              
              {/* GDPR Compliance Badge */}
              <div className="mt-4 flex justify-center">
                <GdprComplianceBadge />
              </div>
            </div>
          </div>
        </div>
      </div>
      <CreatedBy />
    </footer>
  );
};

export default Footer;
