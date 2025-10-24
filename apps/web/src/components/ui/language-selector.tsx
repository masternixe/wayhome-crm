'use client';

import { useState } from 'react';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/20/solid';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'sq', name: 'Shqip', flag: '🇦🇱' },
];

export function LanguageSelector() {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    // In a real app, you'd trigger language change logic
    localStorage.setItem('preferred-language', languageCode);
  };

  const current = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <Menu as="div" className="relative">
      <div>
        <Menu.Button className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
          <GlobeAltIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{current.name}</span>
          <span className="sm:hidden">{current.flag}</span>
          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Panel className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {languages.map((language) => (
            <Menu.Item key={language.code}>
              {({ active }) => (
                <button
                  onClick={() => handleLanguageChange(language.code)}
                  className={classNames(
                    active ? 'bg-gray-100' : '',
                    currentLanguage === language.code ? 'text-primary-600 font-medium' : 'text-gray-900',
                    'flex w-full items-center space-x-3 px-4 py-2 text-left text-sm'
                  )}
                >
                  <span>{language.flag}</span>
                  <span>{language.name}</span>
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Panel>
      </Transition>
    </Menu>
  );
}
