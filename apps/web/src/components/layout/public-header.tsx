'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, Disclosure, Popover, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { BuildingOfficeIcon, UserGroupIcon, HomeIcon, InformationCircleIcon, BriefcaseIcon } from '@heroicons/react/20/solid';
import { CurrencyToggle } from '@/components/ui/currency-toggle';
// import { LanguageSelector } from '@/components/ui/language-selector';

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Pronat', href: '/pronat', icon: BuildingOfficeIcon },
  { name: 'Agjentët', href: '/agjentet', icon: UserGroupIcon },
  { name: 'Rreth Nesh', href: '/rreth-nesh', icon: InformationCircleIcon },
];

const quickLinks = [
  { name: 'Facebook', href: 'https://facebook.com/wayhome', external: true },
  { name: 'Instagram', href: 'https://instagram.com/wayhome', external: true },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/wayhome', external: true },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="container mx-auto px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-4">
          {/* Logo */}
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link href="/" className="flex items-center">
              <span className="sr-only">Wayhome</span>
              <div className="flex items-center space-x-3">
                <img 
                  src="https://wayhome.al/static/media/logo-1.a9b4a808cdc18f6b966a.png" 
                  alt="Wayhome Logo" 
                  className="h-10 w-auto"
                />
                <span className="text-2xl font-bold text-gray-900">Wayhome</span>
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

            {/* Language Selector - temporarily disabled */}
            {/* <LanguageSelector /> */}

            {/* Quick Links Dropdown */}
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button
                    className={classNames(
                      open ? 'text-orange-600' : 'text-gray-600',
                      'group inline-flex items-center space-x-1 text-sm font-medium hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-lg px-3 py-2'
                    )}
                  >
                    <span>Quicklinks</span>
                    <ChevronDownIcon
                      className={classNames(
                        open ? 'rotate-180' : '',
                        'w-4 h-4 transition-transform'
                      )}
                      aria-hidden="true"
                    />
                  </Popover.Button>

                  <Transition
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute right-0 z-10 mt-3 w-48 transform px-2 sm:px-0">
                      <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                        <div className="relative grid gap-6 bg-white px-5 py-6 sm:gap-8 sm:p-8">
                          {quickLinks.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              target={item.external ? '_blank' : '_self'}
                              rel={item.external ? 'noopener noreferrer' : undefined}
                              className="flex items-start rounded-lg p-2 hover:bg-gray-50 transition-colors"
                            >
                              <div className="ml-4">
                                <p className="text-base font-medium text-gray-900">
                                  {item.name}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>

            {/* List Property Button */}
            <Link
              href="/list-your-home"
              className="btn btn-primary"
            >
              List Property
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
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
            <Transition.Child
              enter="duration-300 ease-out"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="duration-200 ease-in"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 z-20 bg-black bg-opacity-25" />
            </Transition.Child>

            <Transition.Child
              enter="duration-300 ease-out"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="absolute inset-x-0 top-0 z-30 origin-top-right transform p-2 transition">
                <div className="divide-y-2 divide-gray-50 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="px-5 pb-6 pt-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img 
                          src="https://wayhome.al/static/media/logo-1.a9b4a808cdc18f6b966a.png" 
                          alt="Wayhome Logo" 
                          className="h-8 w-auto"
                        />
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
                      {quickLinks.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          target={item.external ? '_blank' : '_self'}
                          rel={item.external ? 'noopener noreferrer' : undefined}
                          className="text-base font-medium text-gray-900 hover:text-gray-700"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
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
  );
}
