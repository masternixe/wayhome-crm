import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Politika e Privatësisë
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <p className="text-gray-600 leading-relaxed mb-4">
                Në WayHome Real Estate, ne kemi angazhimin për të mbrojtur privatësinë tuaj. Kjo politikë 
                përshkruan se si ne mbledhim, përdorim dhe mbrojmë informacionin tuaj personal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Informacioni që Mbledhim</h2>
              <h3 className="text-xl font-medium text-gray-700 mb-3">Informacioni Personal</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ne mund të mbledhim informacionin e mëposhtëm personal:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Emri dhe mbiemri</li>
                <li>Adresa e emailit</li>
                <li>Numri i telefonit</li>
                <li>Adresa fizike</li>
                <li>Informacione financiare (kur është e nevojshme)</li>
                <li>Preferencat për prona</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-700 mb-3">Informacioni Teknik</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Gjithashtu mbledhim informacione teknike automatikisht:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Adresa IP</li>
                <li>Lloji i shfletuesit</li>
                <li>Sistemi operativ</li>
                <li>Faqet që vizitoni</li>
                <li>Koha e qëndrimit në faqe</li>
                <li>Cookies dhe teknologji të ngjashme</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">2. Si Përdorim Informacionin</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Informacionin tuaj personal e përdorim për:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Të ju ofrojmë shërbimet e kërkuara</li>
                <li>Të komunikojmë me ju rreth pronave dhe shërbimeve</li>
                <li>Të personalizojmë përvojën tuaj</li>
                <li>Të përmirësojmë shërbimet tona</li>
                <li>Të ju dërgojmë njoftimet dhe përditësimet</li>
                <li>Të përmbushim detyrimet ligjore</li>
                <li>Të analizojmë trendet e tregut</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">3. Ndarja e Informacionit</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ne nuk shisim, qirajmë ose ndajmë informacionin tuaj personal me palë të treta, përveç në rastet e mëposhtme:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Me pëlqimin tuaj të qartë</li>
                <li>Me partnerët tanë të besuar për të ofruar shërbime</li>
                <li>Kur kërkohet nga ligji</li>
                <li>Për të mbrojtur të drejtat tona ligjore</li>
                <li>Në rast emergjence për të mbrojtur sigurinë</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">4. Cookies dhe Teknologji të Ngjashme</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Faqja jonë përdor cookies për të përmirësuar përvojën tuaj. Cookies janë skedarë të vegjël 
                teksti që ruhen në kompjuterin tuaj. Ju mund të:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Pranoni të gjitha cookies</li>
                <li>Refuzoni cookies jo-thelbësore</li>
                <li>Konfiguroni preferencat e cookies në shfletues</li>
                <li>Fshini cookies në çdo kohë</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">5. Siguria e të Dhënave</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ne zbatojmë masa të forta sigurie për të mbrojtur informacionin tuaj:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Enkriptim SSL/TLS për të gjitha komunikimet</li>
                <li>Sisteme të sigurta të ruajtjes së të dhënave</li>
                <li>Qasje e kufizuar në informacionin personal</li>
                <li>Trajnim i rregullt i stafit për sigurinë</li>
                <li>Monitorim i vazhdueshëm për aktivitete të dyshimta</li>
                <li>Backup-e të rregullta të të dhënave</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">6. Të Drejtat Tuaja</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ju keni të drejtën të:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Kërkoni qasje në të dhënat tuaja personale</li>
                <li>Korrigjoni informacione të pasakta</li>
                <li>Kërkoni fshirjen e të dhënave tuaja</li>
                <li>Kufizoni përpunimin e të dhënave</li>
                <li>Transferoni të dhënat tuaja</li>
                <li>Kundërshtoni përpunimin për qëllime marketingu</li>
                <li>Tërhiqni pëlqimin në çdo kohë</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">7. Ruajtja e të Dhënave</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ne ruajmë informacionin tuaj personal vetëm për aq kohë sa është e nevojshme për:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Përmbushjen e shërbimeve të kërkuara</li>
                <li>Respektimin e detyrimeve ligjore</li>
                <li>Zgjidhjen e mosmarrëveshjeve</li>
                <li>Zbatimin e marrëveshjeve tona</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                Pas kësaj periudhe, të dhënat do të fshihen në mënyrë të sigurt.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">8. Transferimi Ndërkombëtar</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Informacioni juaj mund të transferohet dhe përpunohet në vende të tjera. Ne sigurojmë që 
                çdo transferim të bëhet në përputhje me standardet ndërkombëtare të mbrojtjes së të dhënave.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">9. Ndryshimet në Politikë</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ne mund të përditësojmë këtë politikë privatësie nga koha në kohë. Ndryshimet e rëndësishme 
                do t'ju njoftohen përmes emailit ose njoftimeve në faqen tonë.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">10. Kontakti për Privatësinë</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Për çdo pyetje rreth kësaj politike privatësie ose për të ushtruar të drejtat tuaja, 
                mund të na kontaktoni në:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email për Privatësinë:</strong> <a href="mailto:privacy@wayhome.al" className="text-orange-600 hover:text-orange-700">privacy@wayhome.al</a>
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Email i Përgjithshëm:</strong> <a href="mailto:info@wayhome.al" className="text-orange-600 hover:text-orange-700">info@wayhome.al</a>
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Telefon:</strong> <a href="tel:+35568504201" className="text-orange-600 hover:text-orange-700">+355 68 504 0201</a>
                </p>
                <p className="text-gray-700">
                  <strong>Adresa:</strong> Rruga, Kristo Luarasi, Lake View Kulla D, Tiranë, Shqipëri
                </p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
              <p>Kjo politikë privatësie është e vlefshme nga data e fundit të përditësimit dhe zëvendëson të gjitha politikat e mëparshme të privatësisë.</p>
              <p className="mt-2">Përditësuar për herë të fundit: {new Date().toLocaleDateString('sq-AL')}</p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
