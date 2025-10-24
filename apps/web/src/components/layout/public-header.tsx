'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, Disclosure, Popover, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { BuildingOfficeIcon, UserGroupIcon, HomeIcon, InformationCircleIcon, BriefcaseIcon } from '@heroicons/react/20/solid';
import { CurrencyToggle } from '@/components/ui/currency-toggle';
// import { LanguageSelector } from '@/components/ui/language-selector';

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Pronat', href: '/pronat', icon: BuildingOfficeIcon },
  { name: 'Agjentët', href: '/agjentet', icon: UserGroupIcon },
  { name: 'Rreth Nesh', href: '/rreth-nesh', icon: InformationCircleIcon },
];

const socialLinks = [
  { name: 'Facebook', href: 'https://www.facebook.com/wayhome.al/' },
  { name: 'Instagram', href: 'https://www.instagram.com/wayhome.al/' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <style jsx>{`
        @media (min-width: 1024px) {
          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>
      <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="container mx-auto px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-4">
          {/* Logo */}
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link href="/" className="flex items-center">
              <span className="sr-only">Wayhome</span>
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo.png" 
                  alt="Wayhome Logo" 
                  className="h-10 w-auto"
                />
              
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    pathname === item.href
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-orange-600 hover:border-b-2 hover:border-orange-600',
                    'inline-flex items-center space-x-1 px-1 pt-1 pb-2 text-sm font-medium transition-colors'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side items */}
          <div className="hidden lg:flex items-center justify-end space-x-4 lg:w-0 lg:flex-1">
            {/* Currency Toggle */}
            <CurrencyToggle />

            {/* Social Media Icons */}
            <div className="flex items-center space-x-3">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                  title={item.name}
                >
                  {item.name === 'Facebook' ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  )}
                </a>
              ))}
            </div>

            {/* List Property Button */}
            <Link
              href="/list-your-home"
              className="btn btn-primary"
            >
              List Property
            </Link>
          </div>

          {/* Mobile menu button - hidden on desktop */}
          <div 
            className="mobile-menu-button"
            style={{
              display: 'block'
            }}
          >
            <button
              type="button"
              className="flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <Transition show={mobileMenuOpen}>
          <Dialog onClose={setMobileMenuOpen} className="lg:hidden">
            {/* Background overlay */}
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 z-40 bg-black bg-opacity-50" />
            </Transition.Child>

            {/* Menu panel */}
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Panel className="fixed inset-0 z-50 flex items-start justify-center pt-4 px-4">
                <div className="w-full max-w-sm bg-white rounded-lg shadow-xl max-h-screen overflow-y-auto divide-y-2 divide-gray-50">
                  <div className="px-5 pb-6 pt-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">W</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">Wayhome</span>
                      </div>
                      <div className="-mr-2">
                        <button
                          type="button"
                          className="relative inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="sr-only">Close menu</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-6">
                      <nav className="grid gap-y-8">
                        {navigation.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="flex items-center space-x-3 rounded-md p-3 hover:bg-gray-50"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Icon
                                className="h-6 w-6 flex-shrink-0 text-orange-600"
                                aria-hidden="true"
                              />
                              <span className="text-base font-medium text-gray-900">
                                {item.name}
                              </span>
                            </Link>
                          );
                        })}
                      </nav>
                    </div>
                  </div>
                  <div className="space-y-6 px-5 py-6">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      {socialLinks.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-base font-medium text-gray-900 hover:text-gray-700"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name === 'Facebook' ? (
                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          )}
                          <span>{item.name}</span>
                        </a>
                      ))}
                    </div>
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <CurrencyToggle />
                        {/* <LanguageSelector /> */}
                      </div>
                      <Link
                        href="/list-your-home"
                        className="btn btn-primary w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        List Property
                      </Link>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </Dialog>
        </Transition>
      </nav>
    </header>
    </>
  );
}
