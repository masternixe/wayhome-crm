'use client';

import { motion } from 'framer-motion';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { 
  CheckCircleIcon, 
  LightBulbIcon, 
  UserGroupIcon, 
  TrophyIcon,
  HeartIcon,
  StarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  ChartBarIcon,
  GlobeAltIcon,
  UsersIcon,
  ClockIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  BanknotesIcon,
  KeyIcon,
  HomeIcon,
  PresentationChartLineIcon,
  BeakerIcon,
  CogIcon
} from '@heroicons/react/24/solid';

export default function RrethNeshPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-900 via-orange-800 to-red-900 text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 left-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-20 right-10 w-96 h-96 bg-red-500 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 container mx-auto px-6 lg:px-8 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-orange-500/20 rounded-full mb-8 backdrop-blur-sm border border-orange-300/30"
            >
              <HeartIcon className="w-10 h-10 text-orange-300" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight">
              Rreth{' '}
              <span className="bg-gradient-to-r from-orange-300 via-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Wayhome
              </span>
          </h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-orange-100 leading-relaxed max-w-4xl mx-auto"
            >
              Më shumë se 10 vjet përvojë në krijimin e ëndrrave dhe ndërtimin e së ardhmes për mijëra familje shqiptare
            </motion.p>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto"
            >
              {[
                { number: "10+", label: "Vjet Përvojë", icon: TrophyIcon },
                { number: "10,000+", label: "Pronarë të Kënaqur", icon: UserGroupIcon },
                { number: "100%", label: "Përkushtim", icon: HeartIcon }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
                >
                  <stat.icon className="w-8 h-8 text-orange-300 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-orange-200 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto mb-20"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
              <LightBulbIcon className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Misioni Ynë
          </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
            Ne besojmë se çdo person meriton një shtëpi të bukur dhe të sigurt. Misioni ynë është të bëjmë procesin 
              e blerjes, shitjes dhe qirasë së pronave sa më të lehtë, transparent dhe të besueshëm për çdo familje shqiptare.
            </p>
          </motion.div>

          {/* Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: CheckCircleIcon,
                title: 'Besimi',
                description: 'Ndërtojmë marrëdhënie afatgjata të bazuara në transparencë dhe besim të ndërsjellë',
                color: 'from-orange-500 to-red-500'
              },
              {
                icon: StarIcon,
                title: 'Cilësia',
                description: 'Ofrojmë shërbim të shkëlqyer dhe rezultate që tejkalojnë pritshmëritë e klientëve',
                color: 'from-yellow-500 to-orange-500'
              },
              {
                icon: UserGroupIcon,
                title: 'Profesionalizmi',
                description: 'Ekipi ynë i trajnuar mirë ju shoqëron në çdo hap të procesit',
                color: 'from-red-500 to-pink-500'
              },
              {
                icon: LightBulbIcon,
                title: 'Inovacioni',
                description: 'Përdorim teknologjinë më të re për të përmirësuar përvojën tuaj',
                color: 'from-orange-500 to-yellow-500'
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 relative overflow-hidden"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${value.color} rounded-xl mb-6 shadow-lg`}>
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-orange-600 transition-colors">
                  {value.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Historia Jonë
          </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Një rrugëtim i mbushur me pasion, përkushtim dhe sukses të vazhdueshëm
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {[
              { 
                year: '2014', 
                title: 'Themelimi i Wayhome', 
                description: 'Fillimi i rrugëtimit tonë në Tirana me një ekip të vogël por të pasionuar dhe vizion të qartë për të ndryshuar tregun e pasurive të patundshme',
                color: 'from-orange-500 to-red-500'
              },
              { 
                year: '2017', 
                title: 'Zgjerimi në Durrës', 
                description: 'Hapja e zyrës së dytë dhe zgjerimi i shërbimeve në bregdet, duke sjellë ekspertizën tonë në qytetet më të rëndësishme',
                color: 'from-red-500 to-pink-500'
              },
              { 
                year: '2020', 
                title: 'Platforma Dixhitale', 
                description: 'Lansimi i platformës online moderne për kërkimin dhe promovimin e pronave, duke revolucionuar mënyrën e bërjes biznes',
                color: 'from-orange-600 to-yellow-500'
              },
              { 
                year: '2024', 
                title: 'Lider i Tregut', 
                description: 'Kompania #1 e pasurive të patundshme në Shqipëri me mbi 10,000 klientë të kënaqur dhe standard të ri në industri',
                color: 'from-yellow-500 to-orange-500'
              }
            ].map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={`flex flex-col md:flex-row gap-6 mb-12 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="md:w-1/2">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${milestone.color} opacity-5`} />
                    
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${milestone.color} rounded-xl text-white font-bold text-lg mb-4 shadow-lg`}>
                  {milestone.year}
                </div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-gray-900">
                    {milestone.title}
                  </h3>
                    
                    <p className="text-gray-600 leading-relaxed">
                    {milestone.description}
                  </p>
                  </motion.div>
                </div>
                
                <div className="md:w-1/2 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className={`w-32 h-32 bg-gradient-to-br ${milestone.color} rounded-full opacity-20 blur-2xl`}
                  />
              </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Shërbimet Tona
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ofrojmë një gamë të plotë shërbimesh për të mbuluar të gjitha nevojat tuaja të pasurive të patundshme
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BuildingOfficeIcon,
                title: 'Shitje Pronash',
                description: 'Ndihmojmë pronarët të shesin pronat e tyre me çmimin më të mirë dhe në kohën më të shkurtër të mundshme.',
                features: ['Vlerësim profesional', 'Marketing i avancuar', 'Negocim ekspert', 'Proces i sigurt']
              },
              {
                icon: KeyIcon,
                title: 'Blerje Pronash',
                description: 'Udhëzojmë blerësit drejt pronës së përshtatshme duke u bazuar në buxhetin dhe preferencat e tyre.',
                features: ['Kërkim i personalizuar', 'Vizita të organizuara', 'Analiza e tregut', 'Këshillim juridik']
              },
              {
                icon: HomeIcon,
                title: 'Qira dhe Menaxhim',
                description: 'Menaxhojmë pronat tuaja me qira dhe sigurohemi për të ardhura të qëndrueshme.',
                features: ['Gjegje qiramarrësish', 'Menaxhim i mirëmbajtjes', 'Arkëtim qirash', 'Raporte mujore']
              },
              {
                icon: CurrencyDollarIcon,
                title: 'Vlerësim Pronash',
                description: 'Ofrojmë vlerësime të sakta dhe profesionale të pronave për qëllime të ndryshme.',
                features: ['Analiza e tregut', 'Krahasim me pronat', 'Raport i detajuar', 'Certifikim i vlefshëm']
              },
              {
                icon: DocumentTextIcon,
                title: 'Këshillim Juridik',
                description: 'Ofrojmë mbështetje juridike për të gjitha aspektet ligjore të transaksioneve.',
                features: ['Kontrata të sigurta', 'Verifikim dokumentesh', 'Regjistrim pronësie', 'Këshillim tatimor']
              },
              {
                icon: PresentationChartLineIcon,
                title: 'Investime në Prona',
                description: 'Këshillojmë investitorët për mundësi fitimprurëse në tregun e pasurive të patundshme.',
                features: ['Analiza investimesh', 'ROI kalkulimi', 'Strategji afatgjata', 'Portfolio menaxhimi']
              }
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl mb-6 shadow-lg">
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-orange-600 transition-colors">
                  {service.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-6">
                  {service.description}
                </p>

                <div className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-24 bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Arritjet Tona
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dhjetë vite të suksesshme kanë sjellë rezultate konkrete dhe njohje në industri
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              { icon: ChartBarIcon, number: '10,000+', label: 'Prona të Shitura', color: 'from-orange-500 to-red-500' },
              { icon: UsersIcon, number: '25,000+', label: 'Pronarë të Kënaqur', color: 'from-red-500 to-pink-500' },
              { icon: TrophyIcon, number: '50+', label: 'Çmime dhe Njohje', color: 'from-yellow-500 to-orange-500' },
              { icon: BuildingOfficeIcon, number: '5', label: 'Zyra në Të Gjithë Vendin', color: 'from-orange-600 to-red-600' }
            ].map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${achievement.color} rounded-xl mb-4 shadow-lg`}>
                  <achievement.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{achievement.number}</div>
                <div className="text-gray-600 font-medium">{achievement.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Awards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                year: '2024',
                title: 'Kompania e Vitit në Pasuritë e Patundshme',
                organization: 'Dhoma e Tregtisë dhe Industrisë',
                description: 'Njohje për kontributin e jashtëzakonshëm në zhvillimin e sektorit të pasurive të patundshme'
              },
              {
                year: '2023',
                title: 'Çmimi për Inovacionin Digital',
                organization: 'Albania PropTech Awards',
                description: 'Për platfomën më të avancuar online të kërkimit dhe promovimit të pronave'
              },
              {
                year: '2022',
                title: 'Agjencia Më e Besueshme',
                organization: 'Customer Choice Awards',
                description: 'Votuar nga mijëra klientë si agjencia më e besueshme për shërbime të pasurive të patundshme'
              }
            ].map((award, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <TrophyIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{award.year}</div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{award.title}</h3>
                <p className="text-orange-600 font-medium mb-2">{award.organization}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{award.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team section removed */}

      {/* Technology & Innovation Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Teknologjia & <span className="bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">Inovacioni</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Jemi liderë në përdorimin e teknologjisë së avancuar për të revolucionuar industrinë e pasurive të patundshme
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold mb-6 text-orange-300">Platforma Dixhitale e Avancuar</h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Platforma jonë online ofron një përvojë të shkëlqyer për përdoruesit, me teknologji të avancuara 
                që bëjnë kërkimin dhe promovimin e pronave më të lehtë se kurrë.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: GlobeAltIcon, title: 'Search Engine i Avancuar', desc: 'Algoritëm i sofistikuar për gjetjen e pronës perfekte' },
                  { icon: BeakerIcon, title: 'AI dhe Machine Learning', desc: 'Rekomandime të personalizuara bazuar në preferenca' },
                  { icon: CogIcon, title: 'Automatizim Procesesh', desc: 'Procese të automatizuara për efikasitet maksimal' },
                  { icon: ShieldCheckIcon, title: 'Siguria e të Dhënave', desc: 'Mbrojtje e avancuar e informacionit personal' }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start space-x-4"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">{feature.title}</h4>
                      <p className="text-gray-300 text-sm">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-8 backdrop-blur-sm border border-orange-300/30">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: ClockIcon, stat: '24/7', label: 'Disponueshmëri Online' },
                    { icon: PhoneIcon, stat: '< 5min', label: 'Kohë Përgjigje' },
                    { icon: ChartBarIcon, stat: '99.9%', label: 'Uptime i Platformës' },
                    { icon: GlobeAltIcon, stat: '50,000+', label: 'Vizitues Mujorë' }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      className="text-center bg-white/10 rounded-xl p-4 backdrop-blur-sm"
                    >
                      <stat.icon className="w-8 h-8 text-orange-300 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white mb-1">{stat.stat}</div>
                      <div className="text-orange-200 text-sm">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Community Impact Section */}
      <section className="py-24 bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Ndikimi në Komunitet
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ne besojmë se suksesi ynë duhet të kontribuojë në mirëqenien e komunitetit dhe zhvillimin e shoqërisë
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {[
              {
                title: 'Arsimimi dhe Trajnimi',
                description: 'Organizojmë seminare falas për edukimin e publikut në lidhje me tregun e pasurive të patundshme',
                achievements: ['200+ Seminare të organizuara', '5,000+ Pjesëmarrës', '50+ Ekspertë të ftuar'],
                icon: AcademicCapIcon,
                color: 'from-blue-500 to-indigo-500'
              },
              {
                title: 'Përkrahja e Komunitetit',
                description: 'Mbështesim iniciativa lokale dhe projekte që kontribuojnë në zhvillimin e komuniteteve',
                achievements: ['30+ Projekte të mbështetura', '€100,000+ Investime sociale', '15+ Partneritete aktive'],
                icon: HeartIcon,
                color: 'from-pink-500 to-red-500'
              }
            ].map((impact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${impact.color} rounded-xl mb-6 shadow-lg`}>
                  <impact.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{impact.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{impact.description}</p>
                
                <div className="space-y-3">
                  {impact.achievements.map((achievement, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{achievement}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Partnerships */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-8">Partnerët Tanë Strategjikë</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                'Banka e Shqipërisë',
                'Dhoma e Tregtisë',
                'Bashkia e Tiranës',
                'Union Bank Albania'
              ].map((partner, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex items-center justify-center"
                >
                  <span className="text-gray-700 font-semibold text-center">{partner}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Information Section */}
      {/* Offices section removed */}

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-orange-900 via-orange-800 to-red-900 text-white relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-20">
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1.3, 1, 1.3],
              rotate: [360, 0]
            }}
            transition={{ 
              duration: 35,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Gati për të filluar rrugëtimin tuaj?
          </h2>
            
            <p className="text-xl text-orange-100 mb-12 leading-relaxed">
              Bashkohuni me mijëra familje që kanë gjetur shtëpinë e ëndrrave me Wayhome. 
              Ekipi ynë profesional është këtu për t'ju ndihmuar në çdo hap.
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row justify-center gap-6"
            >
              <motion.a
                href="/pronat"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 inline-flex items-center justify-center gap-2"
              >
                <span>Shfleto Pronat</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </motion.a>
              
              <motion.a
              href="/agjentet"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-orange-600 transition-all duration-300 inline-flex items-center justify-center gap-2"
              >
                <UserGroupIcon className="w-5 h-5" />
                <span>Kontakto Agjentin</span>
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
