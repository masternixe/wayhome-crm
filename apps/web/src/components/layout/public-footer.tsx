import Link from 'next/link';
import { HomeIcon, MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const footerLinks = {
  company: [
    { name: 'Rreth Nesh', href: '/rreth-nesh' },
    { name: 'Agjentët', href: '/agjentet' },
    { name: 'Zyrat', href: '/zyrat' },
    { name: 'Karriera', href: '/karriera' },
  ],
  services: [
    { name: 'Blerje Prona', href: '/pronat?type=sale' },
    { name: 'Qira Prona', href: '/pronat?type=rent' },
    { name: 'Lista Pronën', href: '/list-your-home' },
    { name: 'Vlerësimi i Pronës', href: '/valuation' },
  ],
  support: [
    { name: 'Kontakt', href: '/kontakt' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Termat e Shërbimit', href: '/terms' },
    { name: 'Privatësia', href: '/privacy' },
  ],
};

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/wayhome.al/',
    icon: (props: any) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path
          fillRule="evenodd"
          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/wayhome.al/',
    icon: (props: any) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path
          fillRule="evenodd"
          d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.988 11.988 11.988s11.987-5.367 11.987-11.988C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.33-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.33c.882-.807 2.033-1.297 3.33-1.297s2.448.49 3.33 1.297c.807.882 1.297 2.033 1.297 3.33s-.49 2.448-1.297 3.33c-.882.807-2.033 1.297-3.33 1.297zm7.983-9.75a.796.796 0 01-.796-.796.796.796 0 01.796-.795.796.796 0 01.796.795.796.796 0 01-.796.796zM15.017 12.447c0 1.66-1.347 3.006-3.006 3.006s-3.006-1.347-3.006-3.006 1.347-3.006 3.006-3.006 3.006 1.347 3.006 3.006z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-fluid">
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                  <HomeIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">Wayhome</span>
              </div>
              <p className="text-gray-300 mb-6">
                Platforma më e besueshme e pasurive të patundshme në Shqipëri. 
                Ju ndihmojmë të gjeni shtëpinë e ëndrrave tuaja.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-orange-400 flex-shrink-0" />
                  <span className="text-gray-300">Rruga, Kristo Luarasi ,Lake View Kulla D</span>
                </div>
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-orange-400 flex-shrink-0" />
                  <a href="tel:+35568504201" className="text-gray-300 hover:text-orange-400 transition-colors">
                    +355 68 504 0201
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-orange-400 flex-shrink-0" />
                  <a href="mailto:info@wayhome.al" className="text-gray-300 hover:text-orange-400 transition-colors">
                    info@wayhome.al
                  </a>
                </div>
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Kompania</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Shërbimet</h3>
              <ul className="space-y-3">
                {footerLinks.services.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Mbështetje</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Wayhome. Të gjitha të drejtat e rezervuara.
            </div>
            
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
