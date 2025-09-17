'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PaperClipIcon, MapPinIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const jobOpenings = [
  {
    id: '1',
    title: 'Agjent Shitjesh - Tirana',
    location: 'Tirana',
    type: 'Full-time',
    salary: '€800-1,200',
    experience: '1-3 vjet',
    description: 'Kërkojmë agjent të ri për ekipin tonë në Tirana. Mundësi e shkëlqyer për rritje profesionale.',
    requirements: [
      'Diplomë universitare (preferueshëm)',
      'Aftësi komunikimi të shkëlqyera',
      'Motivim i lartë për punë në shitje',
      'Njohuri bazike të Microsoft Office',
      'Licencë drejtimi (e dobishme)'
    ],
    benefits: [
      'Paga bazë + komisione',
      'Trajnim i plotë i kompanisë',
      'Mundësi avancimi',
      'Sigurim shëndetësor',
      'Telefon kompanie'
    ]
  },
  {
    id: '2',
    title: 'Menaxher Zyre - Durrës',
    location: 'Durrës',
    type: 'Full-time',
    salary: '€1,200-1,800',
    experience: '3-5 vjet',
    description: 'Pozicion menaxherial për drejtimin e zyrës së Durrësit dhe koordinimin e ekipit të shitjeve.',
    requirements: [
      'Përvojë të paktën 3 vjet në real estate',
      'Aftësi udhëheqjeje',
      'Diplomë në Biznes ose të ngjashme',
      'Njohuri të mira të tregut vendor',
      'Anglisht në nivel të mirë'
    ],
    benefits: [
      'Paga konkurruese',
      'Bonus vjetor',
      'Makina kompanie',
      'Sigurim familjar',
      '21 ditë pushime'
    ]
  },
  {
    id: '3',
    title: 'Specialist Marketingu',
    location: 'Tirana',
    type: 'Full-time',
    salary: '€700-1,000',
    experience: '1-2 vjet',
    description: 'Përgjegjës për marketingun dixhital dhe promovimin e pronave në rrjetet sociale.',
    requirements: [
      'Diplomë në Marketing ose Komunikim',
      'Përvojë me social media marketing',
      'Njohuri të Photoshop/Canva',
      'Kreativitet i lartë',
      'Aftësi analitike'
    ],
    benefits: [
      'Ambient pune kreativ',
      'Fleksibilitet në orare',
      'Trajnime të specializuara',
      'Teknologji e re',
      'Team building aktivitete'
    ]
  }
];

export default function KarrieraPage() {
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    message: '',
    cvFile: null as File | null
  });
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');

  const handleApplication = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would upload the CV and send the application
    alert('Faleminderit për aplikimin! Do të kontaktoheni brenda 3-5 ditëve punë.');
    
    setApplicationForm({
      name: '',
      email: '',
      phone: '',
      position: '',
      message: '',
      cvFile: null
    });
    setShowApplicationForm(false);
  };

  const handleApplyClick = (jobTitle: string) => {
    setSelectedJob(jobTitle);
    setApplicationForm(prev => ({ ...prev, position: jobTitle }));
    setShowApplicationForm(true);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0 }}>
      {/* Header */}
      <header style={{ background: '#2563eb', color: 'white', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white', textDecoration: 'none' }}>
              <div style={{ width: '2rem', height: '2rem', background: 'white', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🏠
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Wayhome</h1>
            </Link>
          </div>
          <nav style={{ display: 'flex', gap: '2rem' }}>
            <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
            <Link href="/pronat" style={{ color: 'white', textDecoration: 'none' }}>Pronat</Link>
            <Link href="/agjentet" style={{ color: 'white', textDecoration: 'none' }}>Agjentët</Link>
            <Link href="/zyrat" style={{ color: 'white', textDecoration: 'none' }}>Zyrat</Link>
            <Link href="/karriera" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Karriera</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)', color: 'white', padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
            Bashkohu me Ekipin Tonë
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.9, margin: 0 }}>
            Ndërto karrierën tënde në industrinë më dinamike të Shqipërisë
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem' }}>
        {/* Why Work With Us */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937' }}>
            Pse të Punosh me Ne?
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {[
              {
                icon: '📈',
                title: 'Rritje e Shpejtë',
                description: 'Karrierë e shpejtë në një industri në rritje'
              },
              {
                icon: '💰',
                title: 'Paga Konkurruese',
                description: 'Paga bazë + komisione + bonuse'
              },
              {
                icon: '🎓',
                title: 'Trajnim i Plotë',
                description: 'Programi ynë i trajnimit ju përgatit për sukses'
              },
              {
                icon: '👥',
                title: 'Ekip i Mirë',
                description: 'Ambiente pune pozitive dhe mbështetëse'
              }
            ].map((benefit, index) => (
              <div key={index} style={{ 
                background: 'white', 
                borderRadius: '1rem', 
                padding: '1.5rem', 
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                  {benefit.icon}
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
                  {benefit.title}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Job Openings */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1f2937', textAlign: 'center' }}>
            Pozicionet e Hapura
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {jobOpenings.map((job) => (
              <div key={job.id} style={{ 
                background: 'white', 
                borderRadius: '1rem', 
                padding: '2rem', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                      {job.title}
                    </h3>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPinIcon style={{ width: '1rem', height: '1rem' }} />
                        <span>{job.location}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ClockIcon style={{ width: '1rem', height: '1rem' }} />
                        <span>{job.type}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CurrencyDollarIcon style={{ width: '1rem', height: '1rem' }} />
                        <span>{job.salary}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleApplyClick(job.title)}
                    style={{ 
                      background: '#2563eb', 
                      color: 'white', 
                      padding: '0.75rem 1.5rem', 
                      border: 'none', 
                      borderRadius: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Apliko Tani
                  </button>
                </div>

                <p style={{ color: '#374151', marginBottom: '1.5rem', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>
                  {job.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#1f2937' }}>
                      Kërkesat
                    </h4>
                    <ul style={{ color: '#6b7280', fontSize: '0.875rem', paddingLeft: '1.25rem', margin: 0 }}>
                      {job.requirements.map((req, index) => (
                        <li key={index} style={{ marginBottom: '0.25rem' }}>{req}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#1f2937' }}>
                      Benefitet
                    </h4>
                    <ul style={{ color: '#6b7280', fontSize: '0.875rem', paddingLeft: '1.25rem', margin: 0 }}>
                      {job.benefits.map((benefit, index) => (
                        <li key={index} style={{ marginBottom: '0.25rem' }}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Application Form Modal */}
        {showApplicationForm && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            background: 'rgba(0,0,0,0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '1rem', 
              padding: '2rem', 
              maxWidth: '600px', 
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                  Apliko për: {selectedJob}
                </h3>
                <button
                  onClick={() => setShowApplicationForm(false)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    fontSize: '1.5rem', 
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0.25rem'
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleApplication} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Emri i Plotë *
                  </label>
                  <input
                    type="text"
                    value={applicationForm.name}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '0.5rem', 
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={applicationForm.email}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '0.5rem', 
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Telefoni *
                  </label>
                  <input
                    type="tel"
                    value={applicationForm.phone}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '0.5rem', 
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Pozicioni
                  </label>
                  <select
                    value={applicationForm.position}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, position: e.target.value }))}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '0.5rem', 
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">Zgjidhni pozicionin</option>
                    {jobOpenings.map(job => (
                      <option key={job.id} value={job.title}>{job.title}</option>
                    ))}
                    <option value="other">Pozicion tjetër</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    CV/Resume *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, cvFile: e.target.files?.[0] || null }))}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '0.5rem', 
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
                    Formatet e pranuara: PDF, DOC, DOCX (Max 5MB)
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                    Mesazhi (Opsional)
                  </label>
                  <textarea
                    value={applicationForm.message}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    placeholder="Shkruani diçka rreth jush dhe pse jeni i/e përshtatshëm për këtë pozicion..."
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '0.5rem', 
                      fontSize: '1rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    style={{ 
                      flex: 1,
                      background: '#f3f4f6', 
                      color: '#374151', 
                      padding: '0.75rem', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Anulo
                  </button>
                  <button
                    type="submit"
                    style={{ 
                      flex: 2,
                      background: '#2563eb', 
                      color: 'white', 
                      padding: '0.75rem', 
                      border: 'none', 
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Dërgo Aplikimin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* General Application Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', 
          borderRadius: '1.5rem', 
          padding: '3rem 2rem', 
          textAlign: 'center',
          marginTop: '3rem'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937', margin: '0 0 1rem 0' }}>
            Nuk e gjen pozicionin që kërkon?
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem', margin: '0 0 2rem 0' }}>
            Dërgo CV-në tënde dhe ne do të të kontaktojmë kur të hapet një pozicion i përshtatshëm
          </p>
          
          <button
            onClick={() => {
              setSelectedJob('Aplikim i Përgjithshëm');
              setApplicationForm(prev => ({ ...prev, position: 'Aplikim i Përgjithshëm' }));
              setShowApplicationForm(true);
            }}
            style={{ 
              background: '#2563eb', 
              color: 'white', 
              padding: '1rem 2rem', 
              border: 'none', 
              borderRadius: '0.75rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <PaperClipIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            Dërgo CV-në
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#1f2937', color: 'white', padding: '2rem 1rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ margin: 0 }}>© 2024 Wayhome. Të gjitha të drejtat e rezervuara.</p>
        </div>
      </footer>
    </div>
  );
}
