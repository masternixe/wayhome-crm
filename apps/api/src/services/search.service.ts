import { PrismaClient, Prisma, UserRole, PropertyStatus, LeadStatus, TransactionType } from '@wayhome/database';

export interface SearchFilters {
  // Text search
  q?: string;
  
  // Property filters
  listingType?: TransactionType;
  type?: string;
  city?: string;
  zona?: string;
  priceMin?: number;
  priceMax?: number;
  siperfaqeMin?: number;
  siperfaqeMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  ashensor?: boolean;
  badges?: string[];
  featured?: boolean;
  status?: PropertyStatus;
  
  // General filters
  officeId?: string;
  agentId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  includeRelations?: boolean;
}

export interface GlobalSearchResult {
  type: 'client' | 'property' | 'lead' | 'opportunity' | 'transaction';
  id: string;
  title: string;
  description?: string;
  highlight?: string;
  meta?: any;
  score?: number;
}

export interface PropertySearchResult {
  id: string;
  title: string;
  description: string;
  type: string;
  city: string;
  zona: string;
  address: string;
  price: number;
  priceOnRequest: boolean;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  siperfaqeMin: number;
  siperfaqeMax: number;
  ashensor: boolean;
  balcony: boolean;
  garden: boolean;
  yearBuilt?: number;
  parkingSpaces?: number;
  virtualTourUrl?: string;
  badges: string[];
  featured: boolean;
  gallery: string[];
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
  agentOwner?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    email: string;
  };
  collaboratingAgent?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
  };
  office?: {
    id: string;
    name: string;
    city: string;
    address?: string;
    phone?: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
  };
}

export class SearchService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Initialize database for full-text search
   * This should be run once during database setup
   */
  async initializeSearchIndexes(): Promise<void> {
    try {
      // Try to enable pg_trgm extension for trigram similarity search
      await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm;`;
      
      // Create trigram indexes for searchable text fields (with proper syntax)
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_property_title_trgm ON "Property" USING gin (title gin_trgm_ops);`;
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_property_description_trgm ON "Property" USING gin (description gin_trgm_ops);`;
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_property_address_trgm ON "Property" USING gin (address gin_trgm_ops);`;
      
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_client_name_trgm ON "Client" USING gin ((("firstName" || ' ' || "lastName")) gin_trgm_ops);`;
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_client_mobile_trgm ON "Client" USING gin (mobile gin_trgm_ops);`;
      
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_lead_name_trgm ON "Lead" USING gin ((("firstName" || ' ' || "lastName")) gin_trgm_ops);`;
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_lead_mobile_trgm ON "Lead" USING gin (mobile gin_trgm_ops);`;
      
      console.log('✅ Trigram indexes created successfully');
    } catch (error) {
      console.log('⚠️ Trigram indexes failed, using basic indexes instead');
      
      // Fallback to basic indexes if pg_trgm is not available
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_property_title_basic ON "Property" (title);`;
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_property_description_basic ON "Property" USING gin (to_tsvector('english', description));`;
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_client_name_basic ON "Client" ("firstName", "lastName");`;
    }
    
    // Create composite indexes for common filter combinations
    try {
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_property_filters ON "Property" (city, zona, type, status, featured);`;
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_property_price_range ON "Property" (price, currency);`;
      await this.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_property_size_range ON "Property" ("siperfaqeMin", "siperfaqeMax");`;
    } catch (error) {
      console.log('⚠️ Some composite indexes failed to create (this is OK for development)');
    }
  }

  /**
   * Global search across all entities
   */
  async globalSearch(
    query: string,
    userRole: UserRole,
    userOfficeId?: string,
    options: SearchOptions = {}
  ): Promise<GlobalSearchResult[]> {
    const { limit = 20, offset = 0 } = options;
    const searchTerm = `%${query}%`;
    const trigramThreshold = 0.3; // Similarity threshold

    // Build office filter based on user role
    let officeFilter = '';
    if (userRole !== UserRole.SUPER_ADMIN && userOfficeId) {
      officeFilter = `AND "officeId" = '${userOfficeId}'`;
    }

    const results: GlobalSearchResult[] = [];

    // Search properties
    const properties = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        title, 
        description, 
        address,
        city,
        zona,
        similarity(title, ${query}) as title_score,
        similarity(description, ${query}) as desc_score,
        similarity(address, ${query}) as addr_score
      FROM "Property"
      WHERE (
        title ILIKE ${searchTerm}
        OR description ILIKE ${searchTerm}
        OR address ILIKE ${searchTerm}
        OR city ILIKE ${searchTerm}
        OR zona ILIKE ${searchTerm}
        OR similarity(title, ${query}) > ${trigramThreshold}
        OR similarity(description, ${query}) > ${trigramThreshold}
        OR similarity(address, ${query}) > ${trigramThreshold}
      )
      ${officeFilter !== '' ? Prisma.sql`${Prisma.raw(officeFilter)}` : Prisma.sql``}
      ORDER BY 
        GREATEST(title_score, desc_score, addr_score) DESC,
        CASE 
          WHEN title ILIKE ${searchTerm} THEN 1
          WHEN description ILIKE ${searchTerm} THEN 2
          ELSE 3
        END
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    properties.forEach(prop => {
      results.push({
        type: 'property',
        id: prop.id,
        title: prop.title,
        description: prop.description,
        highlight: this.highlightMatch(prop.title + ' ' + prop.address, query),
        meta: { city: prop.city, zona: prop.zona },
        score: Math.max(prop.title_score || 0, prop.desc_score || 0, prop.addr_score || 0),
      });
    });

    // Search clients
    const clients = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        "firstName", 
        "lastName", 
        mobile, 
        email,
        similarity("firstName" || ' ' || "lastName", ${query}) as name_score,
        similarity(mobile, ${query}) as mobile_score
      FROM "Client"
      WHERE (
        "firstName" ILIKE ${searchTerm}
        OR "lastName" ILIKE ${searchTerm}
        OR mobile ILIKE ${searchTerm}
        OR email ILIKE ${searchTerm}
        OR similarity("firstName" || ' ' || "lastName", ${query}) > ${trigramThreshold}
      )
      ${officeFilter !== '' ? Prisma.sql`${Prisma.raw(officeFilter)}` : Prisma.sql``}
      ORDER BY 
        GREATEST(name_score, mobile_score) DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    clients.forEach(client => {
      const fullName = `${client.firstName} ${client.lastName}`;
      results.push({
        type: 'client',
        id: client.id,
        title: fullName,
        description: `${client.mobile}${client.email ? ' • ' + client.email : ''}`,
        highlight: this.highlightMatch(fullName + ' ' + client.mobile, query),
        score: Math.max(client.name_score || 0, client.mobile_score || 0),
      });
    });

    // Search leads
    const leads = await this.prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        "leadNumber",
        "firstName", 
        "lastName", 
        mobile,
        status,
        similarity("firstName" || ' ' || "lastName", ${query}) as name_score,
        similarity(mobile, ${query}) as mobile_score,
        similarity("leadNumber", ${query}) as number_score
      FROM "Lead"
      WHERE (
        "firstName" ILIKE ${searchTerm}
        OR "lastName" ILIKE ${searchTerm}
        OR mobile ILIKE ${searchTerm}
        OR "leadNumber" ILIKE ${searchTerm}
        OR similarity("firstName" || ' ' || "lastName", ${query}) > ${trigramThreshold}
      )
      ${officeFilter !== '' ? Prisma.sql`${Prisma.raw(officeFilter)}` : Prisma.sql``}
      ORDER BY 
        GREATEST(name_score, mobile_score, number_score) DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    leads.forEach(lead => {
      const fullName = `${lead.firstName} ${lead.lastName}`;
      results.push({
        type: 'lead',
        id: lead.id,
        title: `${fullName} (${lead.leadNumber})`,
        description: `${lead.mobile} • ${lead.status}`,
        highlight: this.highlightMatch(fullName + ' ' + lead.leadNumber, query),
        meta: { status: lead.status },
        score: Math.max(lead.name_score || 0, lead.mobile_score || 0, lead.number_score || 0),
      });
    });

    // Sort all results by score
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    return results.slice(0, limit);
  }

  /**
   * Search properties with filters
   */
  async searchProperties(
    filters: SearchFilters,
    options: SearchOptions = {}
  ): Promise<PropertySearchResult[]> {
    const { 
      limit = 20, 
      offset = 0, 
      orderBy = 'createdAt', 
      orderDirection = 'desc',
      includeRelations = true 
    } = options;

    const where: Prisma.PropertyWhereInput = {};
    
    // Handle status filter - can be single status or array
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status };
      } else {
        where.status = filters.status;
      }
    }
    // Don't filter by status if not specified - show all properties

    // Build AND conditions array
    const andConditions: Prisma.PropertyWhereInput[] = [];

    // Text search - search in title, description, city, zona, address
    if (filters.q) {
      andConditions.push({
        OR: [
          { title: { contains: filters.q, mode: 'insensitive' } },
          { description: { contains: filters.q, mode: 'insensitive' } },
          { city: { contains: filters.q, mode: 'insensitive' } },
          { zona: { contains: filters.q, mode: 'insensitive' } },
          { address: { contains: filters.q, mode: 'insensitive' } },
        ]
      });
    }

    // Apply filters
    if (filters.listingType) andConditions.push({ listingType: filters.listingType as any });
    if (filters.type) andConditions.push({ type: filters.type as any });
    if (filters.city) andConditions.push({ city: { contains: filters.city, mode: 'insensitive' } });
    if (filters.zona) andConditions.push({ zona: { contains: filters.zona, mode: 'insensitive' } });
    if (filters.featured !== undefined) andConditions.push({ featured: filters.featured });
    if (filters.ashensor !== undefined) andConditions.push({ ashensor: filters.ashensor });
    if (filters.officeId) andConditions.push({ officeId: filters.officeId });
    if (filters.agentId) {
      andConditions.push({
        OR: [
          { agentOwnerId: filters.agentId },
          { collaboratingAgentId: filters.agentId },
        ]
      });
    }

    // Price range filter with currency consideration
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const priceFilter: any = {};
      if (filters.priceMin !== undefined) priceFilter.gte = filters.priceMin;
      if (filters.priceMax !== undefined) priceFilter.lte = filters.priceMax;
      andConditions.push({ price: priceFilter });
    }

    // Size range filter
    if (filters.siperfaqeMin !== undefined) {
      andConditions.push({ siperfaqeMax: { gte: filters.siperfaqeMin } });
    }
    if (filters.siperfaqeMax !== undefined) {
      andConditions.push({ siperfaqeMin: { lte: filters.siperfaqeMax } });
    }

    // Room filters
    if (filters.bedrooms !== undefined) andConditions.push({ bedrooms: { gte: filters.bedrooms } });
    if (filters.bathrooms !== undefined) andConditions.push({ bathrooms: { gte: filters.bathrooms } });

    // Badges filter
    if (filters.badges && filters.badges.length > 0) {
      andConditions.push({ badges: { hasSome: filters.badges } });
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: any = {};
      if (filters.dateFrom) dateFilter.gte = filters.dateFrom;
      if (filters.dateTo) dateFilter.lte = filters.dateTo;
      andConditions.push({ createdAt: dateFilter });
    }

    // Apply all conditions
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const properties = await this.prisma.property.findMany({
      where,
      include: includeRelations ? {
        agentOwner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phone: true,
            email: true,
          },
        },
        collaboratingAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            phone: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mobile: true,
            email: true,
          },
        },
        office: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            phone: true,
          },
        },
      } : undefined,
      orderBy: { [orderBy]: orderDirection },
      take: limit,
      skip: offset,
    });

    // Debug: console.log('🔍 SearchService DATABASE RESULT:', properties[0]);

    return properties.map(prop => ({
      id: prop.id,
      title: prop.title,
      description: prop.description,
      listingType: (prop as any).listingType || 'SALE',
      type: prop.type,
      city: prop.city,
      zona: prop.zona,
      address: prop.address,
      price: prop.price,
      priceOnRequest: prop.priceOnRequest,
      currency: prop.currency,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      siperfaqeMin: prop.siperfaqeMin,
      siperfaqeMax: prop.siperfaqeMax,
      ashensor: prop.ashensor,
      balcony: prop.balcony,
      garden: prop.garden,
      yearBuilt: prop.yearBuilt || undefined,
      parkingSpaces: prop.parkingSpaces || undefined,
      virtualTourUrl: prop.virtualTourUrl || undefined,
      badges: prop.badges,
      featured: prop.featured,
      gallery: prop.gallery,
      status: prop.status,
      createdAt: prop.createdAt.toISOString(),
      updatedAt: prop.updatedAt.toISOString(),
      agentOwner: includeRelations && prop.agentOwner ? {
        id: prop.agentOwner.id,
        firstName: prop.agentOwner.firstName,
        lastName: prop.agentOwner.lastName,
        avatar: prop.agentOwner.avatar || undefined,
        phone: prop.agentOwner.phone || undefined,
        email: prop.agentOwner.email,
      } : undefined,
      collaboratingAgent: includeRelations && prop.collaboratingAgent ? {
        id: prop.collaboratingAgent.id,
        firstName: prop.collaboratingAgent.firstName,
        lastName: prop.collaboratingAgent.lastName,
        avatar: prop.collaboratingAgent.avatar || undefined,
        phone: prop.collaboratingAgent.phone || undefined,
      } : undefined,
      office: includeRelations && prop.office ? {
        id: prop.office.id,
        name: prop.office.name,
        city: prop.office.city,
        address: prop.office.address || undefined,
        phone: prop.office.phone || undefined,
      } : undefined,
      client: includeRelations && (prop as any).client ? {
        id: (prop as any).client.id,
        firstName: (prop as any).client.firstName,
        lastName: (prop as any).client.lastName,
        mobile: (prop as any).client.mobile,
        email: (prop as any).client.email || undefined,
      } : undefined,
    }));
  }

  /**
   * Get search suggestions/autocomplete
   */
  async getSearchSuggestions(
    query: string,
    type: 'city' | 'zona' | 'agent' | 'all',
    limit: number = 10
  ): Promise<string[]> {
    const searchTerm = `${query}%`;

    switch (type) {
      case 'city':
        const cities = await this.prisma.property.findMany({
          where: { city: { startsWith: query, mode: 'insensitive' } },
          select: { city: true },
          distinct: ['city'],
          take: limit,
        });
        return cities.map(c => c.city);

      case 'zona':
        const zones = await this.prisma.property.findMany({
          where: { zona: { startsWith: query, mode: 'insensitive' } },
          select: { zona: true },
          distinct: ['zona'],
          take: limit,
        });
        return zones.map(z => z.zona);

      case 'agent':
        const agents = await this.prisma.user.findMany({
          where: {
            OR: [
              { firstName: { startsWith: query, mode: 'insensitive' } },
              { lastName: { startsWith: query, mode: 'insensitive' } },
            ],
            role: { in: [UserRole.AGENT, UserRole.MANAGER] },
          },
          select: { firstName: true, lastName: true },
          take: limit,
        });
        return agents.map(a => `${a.firstName} ${a.lastName}`);

      case 'all':
        const suggestions: string[] = [];
        
        // Get cities
        const allCities = await this.prisma.property.findMany({
          where: { city: { startsWith: query, mode: 'insensitive' } },
          select: { city: true },
          distinct: ['city'],
          take: 5,
        });
        suggestions.push(...allCities.map(c => c.city));

        // Get zones
        const allZones = await this.prisma.property.findMany({
          where: { zona: { startsWith: query, mode: 'insensitive' } },
          select: { zona: true },
          distinct: ['zona'],
          take: 5,
        });
        suggestions.push(...allZones.map(z => z.zona));

        return suggestions.slice(0, limit);

      default:
        return [];
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(limit: number = 10): Promise<Array<{ term: string; count: number }>> {
    // In a real implementation, you'd track search queries
    // For now, return popular cities and zones
    const popularCities = await this.prisma.property.groupBy({
      by: ['city'],
      where: { status: PropertyStatus.LISTED },
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
      take: limit / 2,
    });

    const popularZones = await this.prisma.property.groupBy({
      by: ['zona'],
      where: { status: PropertyStatus.LISTED },
      _count: { zona: true },
      orderBy: { _count: { zona: 'desc' } },
      take: limit / 2,
    });

    const popular = [
      ...popularCities.map(c => ({ term: c.city, count: c._count.city })),
      ...popularZones.map(z => ({ term: z.zona, count: z._count.zona })),
    ];

    return popular.sort((a, b) => b.count - a.count).slice(0, limit);
  }

  /**
   * Track property view for analytics
   */
  async trackPropertyView(propertyId: string, viewedBy?: string, ipAddress?: string): Promise<void> {
    await this.prisma.propertyView.create({
      data: {
        propertyId,
        viewedBy,
        ipAddress,
      },
    });
  }

  /**
   * Get similar properties
   */
  async getSimilarProperties(
    propertyId: string,
    limit: number = 6
  ): Promise<PropertySearchResult[]> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return [];
    }

    // Find similar properties based on type, city, price range, and size
    const priceRange = property.price * 0.2; // 20% range
    const sizeRange = property.siperfaqeMax * 0.2; // 20% range

    return this.searchProperties({
      type: property.type,
      city: property.city,
      priceMin: property.price - priceRange,
      priceMax: property.price + priceRange,
      siperfaqeMin: property.siperfaqeMin - sizeRange,
      siperfaqeMax: property.siperfaqeMax + sizeRange,
      status: PropertyStatus.LISTED,
    }, {
      limit,
      orderBy: 'price',
      orderDirection: 'asc',
    });
  }

  /**
   * Highlight search matches in text
   */
  private highlightMatch(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}
