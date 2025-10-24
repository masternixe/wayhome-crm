import { PrismaClient, UserRole, UserStatus, PropertyType, PropertyStatus, Currency, LeadStatus, OpportunityStage, TransactionType, TransactionStatus } from '@wayhome/database';
import bcrypt from 'bcryptjs';
import { addDays, subDays, addMonths } from 'date-fns';

const prisma = new PrismaClient();

const ALBANIAN_NAMES = {
  MALE_FIRST: ['Arben', 'Besim', 'Driton', 'Edi', 'Fisnik', 'Gentian', 'Hasan', 'Ilir', 'Jetmir', 'Klevis', 'Lorenc', 'Marko', 'Nard', 'Olsi', 'Petrit', 'Qemal', 'Rinor', 'Saimir', 'Taulant', 'Ukë'],
  FEMALE_FIRST: ['Albana', 'Blerta', 'Denada', 'Elvira', 'Fatjona', 'Gresa', 'Henrieta', 'Iris', 'Jona', 'Klaudia', 'Luana', 'Mirela', 'Nora', 'Ornela', 'Pranvera', 'Qendresa', 'Rita', 'Shpresa', 'Teuta', 'Vera'],
  LAST: ['Ahmeti', 'Berisha', 'Cela', 'Dervishi', 'Elezi', 'Frashëri', 'Gashi', 'Hoxha', 'Isufi', 'Jani', 'Kastrati', 'Leka', 'Meta', 'Nushi', 'Osmani', 'Prifti', 'Qosja', 'Rama', 'Shehu', 'Tafa', 'Ukaj', 'Veliu', 'Xhafa', 'Ymeri', 'Zeqiri']
};

const CITIES = ['Tirana', 'Durrës', 'Vlorë', 'Shkodër', 'Korçë', 'Fier', 'Elbasan', 'Gjirokastër'];

const TIRANA_ZONES = ['Bllok', 'Kombinat', '21 Dhjetori', 'Lapraka', 'Kashar', 'Paskuqan', 'Dajt', 'Bathore', 'Kamëz', 'Kodër-Kamza', 'Qendër', 'Selitë', 'Fresku', 'Yzberisht'];
const DURRES_ZONES = ['Plazhi', 'Qendër', 'Shkëmbi i Kavajës', 'Currila', 'Porto Romano', 'Spitalle', 'Sukth', 'Katund i Ri'];

const PROPERTY_TITLES = [
  'Apartament 2+1 me pamje nga deti',
  'Vilë me kopsht në zonë të qetë',
  'Apartament i mobiluar në qendër',
  'Studio modern me parkim',
  'Penthouse me terrasa të mëdha',
  'Apartament familjar 3+1',
  'Vilë luksoze me pishinë',
  'Dyqan në rrugë kryesore',
  'Zyrë moderne në ndërtesë të re',
  'Apartament vintage i restauruar'
];

const PROPERTY_DESCRIPTIONS = [
  'Apartament i shkëlqyer me pamje panoramike të qytetit. I mobiluar plotësisht me pajisje moderne dhe balkon të madh.',
  'Pronë e mrekullueshme në zonë rezidenciale të qetë. Ideale për familje që kërkojnë hapësirë dhe privatësi.',
  'Lokacion perfekt në qendër të qytetit me qasje të lehtë në të gjitha shërbimet dhe transportin publik.',
  'Dizajn bashkëkohor me materiale të cilësisë së lartë. Gati për banim me të gjitha paisjet e nevojshme.',
  'Investim i shkëlqyer në një nga zonat më të kërkuara. Potencial i lartë për rritjen e vlerës.',
  'Hapësirë të bollshme dhe dritë natyrore. Ideale për familje të mëdha ose si investim për qira.',
  'Luksoz dhe konfort në çdo detaj. Kopsht i bukur dhe zonë relaksi jashtë.',
  'Pozicion strategjik për biznes. Trafik i lartë këmbësorësh dhe vizibilitet i shkëlqyer.'
];

const LEAD_SOURCES = ['Website', 'Facebook', 'Instagram', 'Google Ads', 'Referral', 'Walk-in', 'Phone Call', 'Email Campaign'];
const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'Construction', 'Retail', 'Hospitality', 'Real Estate'];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generatePhoneNumber(): string {
  const prefixes = ['069', '068', '067'];
  const prefix = randomChoice(prefixes);
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `${prefix}${number}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const domain = randomChoice(domains);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in correct order to handle foreign keys)
  console.log('🧹 Cleaning existing data...');
  await prisma.biddingSlot.deleteMany();
  await prisma.userListing.deleteMany();
  await prisma.publicUser.deleteMany();
  await prisma.vacancyApplication.deleteMany();
  await prisma.document.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.pointsLedger.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.propertyView.deleteMany();
  await prisma.propertyPriceHistory.deleteMany();
  await prisma.propertyDocument.deleteMany();
  await prisma.property.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.office.deleteMany();
  await prisma.brand.deleteMany();

  // Create Brand
  console.log('🏢 Creating brand and offices...');
  const brand = await prisma.brand.create({
    data: {
      name: 'Wayhome',
      logo: '/images/wayhome-logo.png',
    }
  });

  // Create Offices
  const offices = await Promise.all([
    prisma.office.create({
      data: {
        brandId: brand.id,
        name: 'Wayhome Tirana',
        city: 'Tirana',
        address: 'Rruga, Kristo Luarasi, Lake View Kulla D, Tiranë',
        phone: '+355 68 504 0201',
        email: 'tirana@wayhome.com',
      }
    }),
    prisma.office.create({
      data: {
        brandId: brand.id,
        name: 'Wayhome Durrës',
        city: 'Durrës',
        address: 'Rruga "Taulantia", Nr. 45, Durrës',
        phone: '+355 52 234567',
        email: 'durres@wayhome.com',
      }
    }),
  ]);

  // Create Users
  console.log('👥 Creating users...');
  const passwordHash = await bcrypt.hash('password123', 12);

  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@wayhome.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '0693070974',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      targetSales: 0,
      targetRentals: 0,
      points: 500,
    }
  });

  // Office Admins
  const officeAdmins = await Promise.all(offices.map((office, index) => 
    prisma.user.create({
      data: {
        email: `admin.${office.city.toLowerCase()}@wayhome.com`,
        passwordHash,
        firstName: randomChoice(ALBANIAN_NAMES.MALE_FIRST),
        lastName: randomChoice(ALBANIAN_NAMES.LAST),
        phone: generatePhoneNumber(),
        role: UserRole.OFFICE_ADMIN,
        status: UserStatus.ACTIVE,
        officeId: office.id,
        targetSales: 0,
        targetRentals: 0,
        points: 200 + index * 50,
      }
    })
  ));

  // Managers
  const managers = await Promise.all(offices.map((office, index) => 
    prisma.user.create({
      data: {
        email: `manager.${office.city.toLowerCase()}@wayhome.com`,
        passwordHash,
        firstName: randomChoice(ALBANIAN_NAMES.FEMALE_FIRST),
        lastName: randomChoice(ALBANIAN_NAMES.LAST),
        phone: generatePhoneNumber(),
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        officeId: office.id,
        targetSales: 10,
        targetRentals: 15,
        points: 150 + index * 25,
      }
    })
  ));

  // Agents
  const agents = [];
  for (let i = 0; i < 5; i++) {
    const office = offices[i % 2]; // Distribute agents across offices
    const isAgentOfMonth = i === 0; // First agent is agent of the month
    
    const agent = await prisma.user.create({
      data: {
        email: `agent${i + 1}@wayhome.com`,
        passwordHash,
        firstName: i % 2 === 0 ? randomChoice(ALBANIAN_NAMES.MALE_FIRST) : randomChoice(ALBANIAN_NAMES.FEMALE_FIRST),
        lastName: randomChoice(ALBANIAN_NAMES.LAST),
        phone: i === 0 ? '0693070974' : generatePhoneNumber(), // First agent has the specific number
        role: UserRole.AGENT,
        status: UserStatus.ACTIVE,
        officeId: office.id,
        targetSales: randomInt(5, 15),
        targetRentals: randomInt(8, 20),
        points: randomInt(50, 300),
        isAgentOfMonth,
        avatar: null,
      }
    });
    agents.push(agent);
  }

  // Create Clients
  console.log('👤 Creating clients...');
  const clients = [];
  for (let i = 0; i < 20; i++) {
    const office = randomChoice(offices);
    const agent = agents.find(a => a.officeId === office.id) || randomChoice(agents);
    
    const client = await prisma.client.create({
      data: {
        firstName: i % 2 === 0 ? randomChoice(ALBANIAN_NAMES.MALE_FIRST) : randomChoice(ALBANIAN_NAMES.FEMALE_FIRST),
        lastName: randomChoice(ALBANIAN_NAMES.LAST),
        mobile: generatePhoneNumber(),
        email: Math.random() > 0.3 ? generateEmail(randomChoice(ALBANIAN_NAMES.MALE_FIRST), randomChoice(ALBANIAN_NAMES.LAST)) : null,
        preferredCurrency: randomChoice([Currency.EUR, Currency.ALL]),
        notes: Math.random() > 0.5 ? 'Klient i interesuar për prona në qendër të qytetit' : null,
        ownerAgentId: agent.id,
        officeId: office.id,
      }
    });
    clients.push(client);
  }

  // Create Properties
  console.log('🏠 Creating properties...');
  const properties = [];
  for (let i = 0; i < 50; i++) {
    const office = randomChoice(offices);
    const agent = agents.find(a => a.officeId === office.id) || randomChoice(agents);
    const collaboratingAgent = Math.random() > 0.7 ? agents.find(a => a.officeId === office.id && a.id !== agent.id) : null;
    
    const city = office.city;
    const zona = city === 'Tirana' ? randomChoice(TIRANA_ZONES) : randomChoice(DURRES_ZONES);
    const propertyType = randomChoice(Object.values(PropertyType));
    const bedrooms = propertyType === PropertyType.COMMERCIAL || propertyType === PropertyType.OFFICE ? 0 : randomInt(1, 4);
    const bathrooms = propertyType === PropertyType.COMMERCIAL || propertyType === PropertyType.OFFICE ? randomInt(1, 3) : randomInt(1, bedrooms + 1);
    
    const siperfaqeMin = randomInt(40, 150);
    const siperfaqeMax = siperfaqeMin + randomInt(0, 50);
    
    // All properties are stored in EUR only
    const currency = Currency.EUR;
    const basePrice = randomInt(50000, 500000);
    
    const badges = [];
    if (Math.random() > 0.8) badges.push('Lux');
    if (Math.random() > 0.9) badges.push('Exclusive');
    if (Math.random() > 0.85) badges.push('New');
    
    const property = await prisma.property.create({
      data: {
        officeId: office.id,
        agentOwnerId: agent.id,
        collaboratingAgentId: collaboratingAgent?.id,
        title: randomChoice(PROPERTY_TITLES),
        description: randomChoice(PROPERTY_DESCRIPTIONS),
        type: propertyType,
        city,
        zona,
        address: `Rruga "${randomChoice(['Dëshmorët', 'Kavaja', 'Barrikadave', 'Pjetër Bogdani'])}", Nr. ${randomInt(1, 200)}`,
        bedrooms,
        bathrooms,
        siperfaqeMin,
        siperfaqeMax,
        price: basePrice,
        currency,
        ashensor: Math.random() > 0.6,
        status: randomChoice([PropertyStatus.LISTED, PropertyStatus.LISTED, PropertyStatus.LISTED, PropertyStatus.UNDER_OFFER, PropertyStatus.SOLD, PropertyStatus.RENTED]),
        badges,
        featured: Math.random() > 0.8,
        gallery: [],
        yearBuilt: Math.random() > 0.3 ? randomInt(1990, 2024) : null,
        parkingSpaces: Math.random() > 0.5 ? randomInt(1, 3) : null,
        balcony: Math.random() > 0.4,
        garden: propertyType === PropertyType.HOUSE || propertyType === PropertyType.VILLA ? Math.random() > 0.3 : false,
      }
    });
    properties.push(property);
  }

  // Create Leads
  console.log('📞 Creating leads...');
  const leads = [];
  for (let i = 0; i < 30; i++) {
    const office = randomChoice(offices);
    const agent = agents.find(a => a.officeId === office.id) || randomChoice(agents);
    
    const lead = await prisma.lead.create({
      data: {
        leadNumber: `L${String(i + 1).padStart(6, '0')}`,
        firstName: i % 2 === 0 ? randomChoice(ALBANIAN_NAMES.MALE_FIRST) : randomChoice(ALBANIAN_NAMES.FEMALE_FIRST),
        lastName: randomChoice(ALBANIAN_NAMES.LAST),
        mobile: generatePhoneNumber(),
        email: Math.random() > 0.4 ? generateEmail(randomChoice(ALBANIAN_NAMES.MALE_FIRST), randomChoice(ALBANIAN_NAMES.LAST)) : null,
        rikontakt: Math.random() > 0.5 ? addDays(new Date(), randomInt(1, 30)) : null,
        assignedToId: agent.id,
        officeId: office.id,
        industry: Math.random() > 0.5 ? randomChoice(INDUSTRIES) : null,
        leadSource: randomChoice(LEAD_SOURCES),
        description: Math.random() > 0.3 ? 'Klient i interesuar për blerje apartamenti në qendër të qytetit' : null,
        status: randomChoice(Object.values(LeadStatus)),
        createdAt: subDays(new Date(), randomInt(0, 90)),
      }
    });
    leads.push(lead);
  }

  // Create Opportunities
  console.log('💼 Creating opportunities...');
  const opportunities = [];
  for (let i = 0; i < 20; i++) {
    const client = randomChoice(clients);
    const property = properties.find(p => p.officeId === client.officeId) || randomChoice(properties);
    const lead = leads.find(l => l.officeId === client.officeId && l.status === LeadStatus.QUALIFIED) || null;
    
    const opportunity = await prisma.opportunity.create({
      data: {
        officeId: client.officeId,
        clientId: client.id,
        leadId: lead?.id,
        interestedPropertyId: Math.random() > 0.3 ? property.id : null,
        notes: Math.random() > 0.4 ? 'Klient serioz me mundësi të mira financiare' : null,
        stage: randomChoice(Object.values(OpportunityStage)),
        estimatedValue: Math.random() > 0.5 ? randomFloat(50000, 300000) : null,
        probability: randomInt(20, 90),
        expectedCloseDate: Math.random() > 0.3 ? addDays(new Date(), randomInt(10, 120)) : null,
        createdAt: subDays(new Date(), randomInt(0, 60)),
      }
    });
    opportunities.push(opportunity);
  }

  // Create Transactions
  console.log('💰 Creating transactions...');
  for (let i = 0; i < 15; i++) {
    const opportunity = opportunities[i % opportunities.length];
    const property = properties.find(p => p.id === opportunity.interestedPropertyId) || randomChoice(properties.filter(p => p.officeId === opportunity.officeId));
    const client = clients.find(c => c.id === opportunity.clientId)!;
    
    const transactionType = randomChoice([TransactionType.SALE, TransactionType.RENT]);
    const grossAmount = transactionType === TransactionType.SALE ? property.price : property.price * 0.01; // 1% of sale price as monthly rent
    const commissionRate = transactionType === TransactionType.SALE ? 0.03 : 0.5;
    const commissionAmount = grossAmount * commissionRate;
    const splitRatio = Math.random() > 0.7 && property.collaboratingAgentId ? randomFloat(0.4, 0.8) : 1;
    
    // Ensure most transactions are CLOSED with proper close dates for revenue calculation
    const status = i < 10 ? TransactionStatus.CLOSED : randomChoice([TransactionStatus.CLOSED, TransactionStatus.PENDING, TransactionStatus.OPEN]);
    const closeDate = status === TransactionStatus.CLOSED ? subDays(new Date(), randomInt(0, 30)) : null;
    
    // Calculate commission splits based on new structure
    // Office always gets 50% of commission as base
    let superAdminShare = commissionAmount * 0.5;
    const remainingCommission = commissionAmount * 0.5;
    
    let agentSharePrimary: number;
    let agentShareCollaborator: number;
    
    if (property.collaboratingAgentId) {
      // If there's a collaborating agent, split the remaining 50% equally (25% each)
      agentSharePrimary = remainingCommission * 0.5; // 25% of total
      agentShareCollaborator = remainingCommission * 0.5; // 25% of total
    } else {
      // If no collaborating agent, the remaining 50% is split:
      // - 50% to office (additional 25% of total)
      // - 50% to agent (25% of total)
      superAdminShare += remainingCommission * 0.5; // Office gets 75% total
      agentSharePrimary = remainingCommission * 0.5; // Agent gets 25% total
      agentShareCollaborator = 0;
    }
    
    await prisma.transaction.create({
      data: {
        officeId: opportunity.officeId,
        type: transactionType,
        status,
        propertyId: property.id,
        clientId: client.id,
        opportunityId: opportunity.id,
        primaryAgentId: property.agentOwnerId,
        collaboratingAgentId: property.collaboratingAgentId,
        splitRatio,
        closeDate,
        grossAmount,
        commissionAmount,
        superAdminShare,
        agentSharePrimary,
        agentShareCollaborator,
        currency: property.currency,
        contractNumber: status === TransactionStatus.CLOSED ? `CT${String(i + 1).padStart(6, '0')}` : null,
        notes: status === TransactionStatus.CLOSED ? 'Transaksion i kryer me sukses, klient i kënaqur' : null,
        createdAt: subDays(new Date(), randomInt(0, 45)),
      }
    });
  }

  // Skip Tasks creation for now due to polymorphic relation issues
  console.log('⏭️ Skipping tasks creation (polymorphic relation issue)...');

  // Create Points Ledger entries
  console.log('🏆 Creating points ledger entries...');
  for (const agent of agents) {
    // Lead created points
    for (let i = 0; i < randomInt(5, 15); i++) {
      await prisma.pointsLedger.create({
        data: {
          agentId: agent.id,
          actionType: 'LEAD_CREATED',
          points: 1,
          meta: { source: 'seed_data' },
          createdAt: subDays(new Date(), randomInt(0, 90)),
        }
      });
    }
    
    // Property listed points
    for (let i = 0; i < randomInt(2, 8); i++) {
      await prisma.pointsLedger.create({
        data: {
          agentId: agent.id,
          actionType: 'PROPERTY_LISTED',
          points: 5,
          meta: { source: 'seed_data' },
          createdAt: subDays(new Date(), randomInt(0, 60)),
        }
      });
    }
    
    // Sale closed points
    for (let i = 0; i < randomInt(1, 4); i++) {
      await prisma.pointsLedger.create({
        data: {
          agentId: agent.id,
          actionType: 'SALE_CLOSED',
          points: 20,
          meta: { source: 'seed_data' },
          createdAt: subDays(new Date(), randomInt(0, 30)),
        }
      });
    }
    
    // Collaboration points
    if (Math.random() > 0.5) {
      await prisma.pointsLedger.create({
        data: {
          agentId: agent.id,
          actionType: 'COLLABORATION_SALE',
          points: 10,
          meta: { source: 'seed_data' },
          createdAt: subDays(new Date(), randomInt(0, 20)),
        }
      });
    }
  }

  // Create Public Users
  console.log('👤 Creating public users...');
  const publicUsers = [];
  for (let i = 0; i < 10; i++) {
    const publicUser = await prisma.publicUser.create({
      data: {
        email: `public.user${i + 1}@example.com`,
        passwordHash,
        firstName: i % 2 === 0 ? randomChoice(ALBANIAN_NAMES.MALE_FIRST) : randomChoice(ALBANIAN_NAMES.FEMALE_FIRST),
        lastName: randomChoice(ALBANIAN_NAMES.LAST),
        phone: generatePhoneNumber(),
        verified: Math.random() > 0.2, // 80% verified
      }
    });
    publicUsers.push(publicUser);
  }

  // Create User Listings
  console.log('📝 Creating user listings...');
  const userListings = [];
  for (let i = 0; i < 15; i++) {
    const publicUser = randomChoice(publicUsers.filter(u => u.verified));
    const city = randomChoice(CITIES);
    const zona = city === 'Tirana' ? randomChoice(TIRANA_ZONES) : randomChoice(DURRES_ZONES);
    
    const userListing = await prisma.userListing.create({
      data: {
        publicUserId: publicUser.id,
        officeId: Math.random() > 0.7 ? randomChoice(offices).id : null,
        title: randomChoice(PROPERTY_TITLES),
        description: randomChoice(PROPERTY_DESCRIPTIONS),
        city,
        zona,
        address: `Rruga "${randomChoice(['Dëshmorët', 'Kavaja', 'Barrikadave'])}", Nr. ${randomInt(1, 100)}`,
        bedrooms: randomInt(1, 4),
        bathrooms: randomInt(1, 3),
        siperfaqe: randomInt(50, 200),
        price: randomInt(40000, 250000),
        currency: randomChoice([Currency.EUR, Currency.ALL]),
        status: randomChoice(['PENDING', 'APPROVED', 'ACTIVE', 'REJECTED']),
        gallery: [],
        approvedBy: Math.random() > 0.5 ? randomChoice(officeAdmins).id : null,
        approvedAt: Math.random() > 0.5 ? subDays(new Date(), randomInt(0, 10)) : null,
        createdAt: subDays(new Date(), randomInt(0, 30)),
      }
    });
    userListings.push(userListing);
  }

  // Create Bidding Slots
  console.log('💳 Creating bidding slots...');
  const activeBiddingSlots = userListings.filter(ul => ul.status === 'ACTIVE').slice(0, 10);
  for (let i = 0; i < activeBiddingSlots.length; i++) {
    const userListing = activeBiddingSlots[i];
    
    await prisma.biddingSlot.create({
      data: {
        userListingId: userListing.id,
        amountPaid: randomInt(20, 200),
        currency: Currency.EUR,
        stripePaymentId: `pi_test_${randomInt(100000, 999999)}`,
        slotPosition: i + 1,
        activeUntil: addDays(new Date(), randomInt(5, 30)),
        createdAt: subDays(new Date(), randomInt(0, 10)),
      }
    });
  }

  // Create Vacancy Applications
  console.log('📄 Creating vacancy applications...');
  for (let i = 0; i < 8; i++) {
    await prisma.vacancyApplication.create({
      data: {
        officeId: Math.random() > 0.5 ? randomChoice(offices).id : null,
        name: `${randomChoice(ALBANIAN_NAMES.MALE_FIRST)} ${randomChoice(ALBANIAN_NAMES.LAST)}`,
        email: generateEmail(randomChoice(ALBANIAN_NAMES.MALE_FIRST), randomChoice(ALBANIAN_NAMES.LAST)),
        phone: generatePhoneNumber(),
        message: 'Jam i interesuar për pozicionin e agjentit të shitjes. Kam përvojë në sektorin e pasurive të patundshme.',
        cvUrl: `/uploads/cv_${i + 1}.pdf`,
        position: randomChoice(['Real Estate Agent', 'Property Manager', 'Sales Associate', 'Marketing Specialist']),
        createdAt: subDays(new Date(), randomInt(0, 20)),
      }
    });
  }

  // Skip Comments creation for now due to polymorphic relation issues
  console.log('⏭️ Skipping comments creation (polymorphic relation issue)...');

  // Update user points based on ledger
  console.log('🔄 Updating user points...');
  for (const agent of agents) {
    const totalPoints = await prisma.pointsLedger.aggregate({
      where: { agentId: agent.id },
      _sum: { points: true },
    });
    
    await prisma.user.update({
      where: { id: agent.id },
      data: { points: totalPoints._sum.points || 0 },
    });
  }

  // Create System Settings (with correct exchange rates)
  console.log('⚙️ Creating/updating system settings...');
  
  const systemSettings = [
    {
      key: 'EUR_TO_ALL_RATE',
      value: 97.3,
      description: 'Exchange rate from EUR to ALL (real rate)',
    },
    {
      key: 'ALL_TO_EUR_RATE', 
      value: 1 / 97.3,
      description: 'Exchange rate from ALL to EUR (real rate)',
    },
    {
      key: 'COMMISSION_SALE_RATE',
      value: 0.03,
      description: 'Commission rate for property sales (3%)',
    },
    {
      key: 'COMMISSION_RENT_RATE',
      value: 0.5,
      description: 'Commission rate for property rentals (50% of monthly rent)',
    },
    {
      key: 'BIDDING_SLOT_DURATION_DAYS',
      value: 30,
      description: 'Default duration for promoted listing slots in days',
    },
    {
      key: 'MAX_BIDDING_SLOTS',
      value: 10,
      description: 'Maximum number of featured property slots',
    },
  ];

  // Use upsert to handle existing settings
  for (const setting of systemSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { 
        value: setting.value,
        description: setting.description
      },
      create: setting
    });
  }

  console.log('✅ Database seeded successfully!');
  
  // Print summary
  const summary = {
    brands: 1,
    offices: offices.length,
    users: agents.length + managers.length + officeAdmins.length + 1, // +1 for super admin
    agents: agents.length,
    clients: clients.length,
    properties: properties.length,
    leads: leads.length,
    opportunities: opportunities.length,
    transactions: 15,
    publicUsers: publicUsers.length,
    userListings: userListings.length,
    biddingSlots: activeBiddingSlots.length,
  };
  
  console.log('\n📊 Summary:');
  Object.entries(summary).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\n🔑 Login credentials:');
  console.log('  Super Admin: admin@wayhome.com / password123');
  console.log('  Office Admin Tirana: admin.tirana@wayhome.com / password123');
  console.log('  Office Admin Durrës: admin.durrës@wayhome.com / password123');
  console.log('  Agent 1: agent1@wayhome.com / password123');
  console.log('  Agent 2: agent2@wayhome.com / password123');
  console.log('  Public User: public.user1@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
