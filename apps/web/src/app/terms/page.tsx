import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Kushtet e Shërbimit
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Pranueshmëria e Kushteve</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Duke përdorur shërbimet e WayHome Real Estate, ju pranoni të jeni të detyruar nga këto kushte shërbimi. 
                Nëse nuk pajtoheni me ndonjë pjesë të këtyre kushteve, ju lutemi mos përdorni shërbimet tona.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Përshkrimi i Shërbimeve</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                WayHome ofron shërbime të ndërmjetësimit në tregun e pasurive të paluajtshme, përfshirë:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Shitje dhe qera të pronave</li>
                <li>Konsulencë profesionale për blerje dhe shitje</li>
                <li>Vlerësim të pasurive të paluajtshme</li>
                <li>Asistencë ligjore dhe administrative</li>
                <li>Marketing dhe promovim të pronave</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Detyrimet e Përdoruesit</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Si përdorues i shërbimeve tona, ju zotoheni të:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Jepni informacione të sakta dhe të plota</li>
                <li>Respektoni ligjet dhe rregulloret në fuqi</li>
                <li>Mos përdorni shërbimet për qëllime të paligjshme</li>
                <li>Respektoni të drejtat e pronësisë intelektuale</li>
                <li>Mos ndërhyni në funksionimin normal të platformës</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Komisionet dhe Pagesat</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Komisionet për shërbimet tona përcaktohen si më poshtë:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Shitje pronash: 3% e vlerës së shitjes</li>
                <li>Qera pronash: 50% e qirasë mujore</li>
                <li>Shërbimet shtesë sipas marrëveshjes</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                Të gjitha pagesat duhet të kryhen në përputhje me kushtet e kontratës së nënshkruar.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Kufizimi i Përgjegjësisë</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                WayHome Real Estate nuk mban përgjegjësi për:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Dëme të tërthorta ose pasojore</li>
                <li>Humbje të të ardhurave ose fitimeve</li>
                <li>Informacione të pasakta të dhëna nga palët e treta</li>
                <li>Probleme teknike të përkohshme</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Mbrojtja e të Dhënave</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ne respektojmë privatësinë tuaj dhe trajtojmë të dhënat personale në përputhje me ligjin në fuqi 
                dhe politikën tonë të privatësisë. Për më shumë detaje, ju lutemi lexoni 
                <a href="/privacy" className="text-orange-600 hover:text-orange-700 font-medium"> Politikën e Privatësisë</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Ndryshimet në Kushte</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                WayHome rezervon të drejtën për të ndryshuar këto kushte në çdo kohë. Ndryshimet do të hyjnë 
                në fuqi menjëherë pas publikimit në faqen tonë. Përdorimi i vazhdueshëm i shërbimeve pas 
                ndryshimeve konsiderohet si pranim i kushteve të reja.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Zgjidhja e Mosmarrëveshjeve</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Çdo mosmarrëveshje që mund të lindte do të zgjidhet fillimisht përmes negociatave të mira. 
                Në rast se nuk arrihet marrëveshje, çështja do të kalojë në gjykatat kompetente të Republikës së Shqipërisë.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">9. Kontakti</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Për çdo pyetje rreth këtyre kushteve, mund të na kontaktoni në:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> <a href="mailto:info@wayhome.al" className="text-orange-600 hover:text-orange-700">info@wayhome.al</a>
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Telefon:</strong> <a href="tel:+35568504201" className="text-orange-600 hover:text-orange-700">+355 68 504 0201</a>
                </p>
                <p className="text-gray-700">
                  <strong>Adresa:</strong> Rruga, Kristo Luarasi, Lake View Kulla D, Tiranë
                </p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
              <p>Këto kushte janë të vlefshme nga data e fundit të përditësimit dhe zëvendësojnë të gjitha marrëveshjet e mëparshme.</p>
              <p className="mt-2">Përditësuar për herë të fundit: {new Date().toLocaleDateString('sq-AL')}</p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
