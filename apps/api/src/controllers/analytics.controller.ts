import { Request, Response } from 'express';
import { PrismaClient } from '@wayhome/database';

export class AnalyticsController {
  constructor(private prisma: PrismaClient) {}

  async getAnalytics(req: Request, res: Response) {
    try {
      console.log('Analytics request received:', req.query);
      const { user } = req as any;
      const { startDate, endDate, office, agent } = req.query;

      // Build date filter - only apply if dates are provided, otherwise show all data
      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = new Date(startDate as string);
        if (endDate) dateFilter.createdAt.lte = new Date(endDate as string);
      }

      // Build office filter based on user role
      let officeFilter: any = {};
      if (user.role !== 'SUPER_ADMIN') {
        officeFilter.officeId = user.officeId;
      } else if (office && office !== 'all') {
        officeFilter.officeId = office as string;
      }

      // Build agent filter
      let agentFilter: any = {};
      if (agent && agent !== 'all') {
        agentFilter.agentOwnerId = agent as string;
      }

      // Combine filters - all filters now respect time range selection
      const propertyFilter = { ...dateFilter, ...officeFilter, ...agentFilter };
      const leadFilter = { ...dateFilter, ...officeFilter };
      const opportunityFilter = { ...dateFilter, ...officeFilter };
      const transactionFilter = { ...dateFilter, ...officeFilter };
      const clientFilter = { ...dateFilter, ...officeFilter };

      // Get overview data
      const [
        totalProperties,
        totalLeads,
        totalOpportunities,
        totalClients,
        totalTransactions,
        totalRevenue,
        totalCommission
      ] = await Promise.all([
        this.prisma.property.count({ where: propertyFilter }),
        this.prisma.lead.count({ where: leadFilter }),
        this.prisma.opportunity.count({ where: opportunityFilter }),
        this.prisma.client.count({ where: clientFilter }),
        this.prisma.transaction.count({ where: transactionFilter }),
        this.prisma.transaction.aggregate({
          where: transactionFilter,
          _sum: { grossAmount: true }
        }),
        this.prisma.transaction.aggregate({
          where: transactionFilter,
          _sum: { commissionAmount: true }
        })
      ]);

      // Get conversion rates
      const leadToOpportunityCount = await this.prisma.opportunity.count({
        where: { ...opportunityFilter, leadId: { not: null } }
      });
      const opportunityToSaleCount = await this.prisma.transaction.count({
        where: { ...transactionFilter, opportunityId: { not: null } }
      });

      const conversionRates = {
        leadToOpportunity: totalLeads > 0 ? (leadToOpportunityCount / totalLeads) * 100 : 0,
        opportunityToSale: totalOpportunities > 0 ? (opportunityToSaleCount / totalOpportunities) * 100 : 0,
        leadToSale: totalLeads > 0 ? (opportunityToSaleCount / totalLeads) * 100 : 0,
        avgConversionTime: await this.getAverageConversionTime(dateFilter)
      };

      // Get client retention data
      const clientRetention = await this.getClientRetentionData(dateFilter, officeFilter);

      // Get sales by office
      const salesByOffice = await this.getSalesByOffice(dateFilter, user.role === 'SUPER_ADMIN' ? undefined : user.officeId);

      // Get sales by agent
      const salesByAgent = await this.getSalesByAgent(dateFilter, officeFilter, agent as string);

      // Get revenue by month
      const revenueByMonth = await this.getRevenueByMonth(dateFilter, officeFilter);

      // Get conversion funnel
      const conversionFunnel = await this.getConversionFunnel(dateFilter, officeFilter);

      // Get client retention chart
      const clientRetentionChart = await this.getClientRetentionChart(dateFilter, officeFilter);

      // Get top performers
      const topPerformers = await this.getTopPerformers(dateFilter, officeFilter);

      // Calculate monthly growth (only if we have date filters)
      const currentRevenue = totalRevenue._sum.grossAmount || 0;
      let monthlyGrowth = 0;
      if (dateFilter.createdAt) {
        const previousMonthFilter = {
          createdAt: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        };
        const previousRevenue = await this.prisma.transaction.aggregate({
          where: { ...previousMonthFilter, ...officeFilter },
          _sum: { grossAmount: true }
        });
        const prevRevenue = previousRevenue._sum.grossAmount || 0;
        monthlyGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      }

      // Calculate average deal time
      const avgDealTime = await this.getAverageDealTime(dateFilter, officeFilter);

      res.json({
        success: true,
        data: {
          overview: {
            totalRevenue: currentRevenue,
            totalCommission: totalCommission._sum.commissionAmount || 0,
            totalProperties,
            totalLeads,
            totalOpportunities,
            totalClients,
            totalTransactions,
            avgDealTime,
            monthlyGrowth
          },
          conversionRates,
          clientRetention,
          salesByOffice,
          salesByAgent,
          revenueByMonth,
          conversionFunnel,
          clientRetentionChart,
          topPerformers
        }
      });
    } catch (error) {
      console.error('Analytics error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async getAverageConversionTime(dateFilter: any): Promise<number> {
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        ...dateFilter,
        leadId: { not: null },
        stage: 'WON'
      },
      include: { lead: true }
    });

    if (opportunities.length === 0) return 0;

    const totalDays = opportunities.reduce((sum, opp) => {
      if (opp.lead) {
        const diffTime = opp.updatedAt.getTime() - opp.lead.createdAt.getTime();
        return sum + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return sum;
    }, 0);

    return Math.round(totalDays / opportunities.length);
  }

  private async getClientRetentionData(dateFilter: any, officeFilter: any) {
    const clients = await this.prisma.client.findMany({
      where: { ...officeFilter },
      include: { transactions: true }
    });

    const newClients = await this.prisma.client.count({
      where: { ...dateFilter, ...officeFilter }
    });

    const returningClients = clients.filter(client => 
      client.transactions.length > 1
    ).length;

    const totalClients = clients.length;
    const retentionRate = totalClients > 0 ? (returningClients / totalClients) * 100 : 0;

    const avgClientValue = await this.prisma.transaction.aggregate({
      where: { ...officeFilter },
      _avg: { grossAmount: true }
    });

    const clientLifetimeValue = await this.prisma.transaction.aggregate({
      where: { ...officeFilter },
      _avg: { grossAmount: true }
    });

    return {
      newClients,
      returningClients,
      retentionRate,
      avgClientValue: avgClientValue._avg.grossAmount || 0,
      clientLifetimeValue: (clientLifetimeValue._avg.grossAmount || 0) * 1.5 // Estimate based on repeat transactions
    };
  }

  private async getSalesByOffice(dateFilter: any, userOfficeId?: string) {
    const offices = await this.prisma.office.findMany({
      where: userOfficeId ? { id: userOfficeId } : {},
      include: {
        transactions: {
          where: dateFilter
        },
        users: {
          where: { role: { in: ['AGENT', 'MANAGER'] } }
        }
      }
    });

    return offices.map(office => ({
      officeId: office.id,
      officeName: office.name,
      sales: office.transactions.length,
      revenue: office.transactions.reduce((sum, t) => sum + t.grossAmount, 0),
      deals: office.transactions.length,
      agents: office.users.length
    }));
  }

  private async getSalesByAgent(dateFilter: any, officeFilter: any, selectedAgent?: string) {
    const agents = await this.prisma.user.findMany({
      where: {
        ...officeFilter,
        role: { in: ['AGENT', 'MANAGER'] },
        ...(selectedAgent && selectedAgent !== 'all' ? { id: selectedAgent } : {})
      },
      include: {
        primaryTransactions: {
          where: dateFilter
        },
        assignedLeads: {
          where: dateFilter
        }
      }
    });

    return agents.map(agent => {
      const totalLeads = agent.assignedLeads.length;
      const totalSales = agent.primaryTransactions.length;
      const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

      return {
        agentId: agent.id,
        agentName: `${agent.firstName} ${agent.lastName}`,
        officeId: agent.officeId || '',
        sales: totalSales,
        revenue: agent.primaryTransactions.reduce((sum, t) => sum + t.grossAmount, 0),
        deals: totalSales,
        commission: agent.primaryTransactions.reduce((sum, t) => sum + (t.commissionAmount || 0), 0),
        conversionRate
      };
    })
    .sort((a, b) => {
      // Sort by revenue (descending), then by deals (descending), then by conversion rate (descending)
      if (b.revenue !== a.revenue) {
        return b.revenue - a.revenue;
      }
      if (b.deals !== a.deals) {
        return b.deals - a.deals;
      }
      return b.conversionRate - a.conversionRate;
    });
  }

  private async getRevenueByMonth(dateFilter: any, officeFilter: any) {
    // If no date filter, use last 12 months
    const startDate = dateFilter.createdAt?.gte || new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
    const endDate = dateFilter.createdAt?.lte || new Date();
    
    const transactions = await this.prisma.transaction.findMany({
      where: {
        ...dateFilter,
        ...officeFilter
      }
    });

    const leads = await this.prisma.lead.findMany({
      where: {
        ...dateFilter,
        ...officeFilter
      }
    });

    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        ...dateFilter,
        ...officeFilter
      }
    });

    // Group by month
    const monthlyData = new Map();
    
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      
      monthlyData.set(monthKey, {
        month: monthName,
        sales: 0,
        rentals: 0,
        commission: 0,
        leads: 0,
        opportunities: 0
      });
    }

    // Aggregate data by month
    transactions.forEach(transaction => {
      const monthKey = transaction.createdAt.toISOString().slice(0, 7);
      const data = monthlyData.get(monthKey);
      if (data) {
        if (transaction.type === 'SALE') {
          data.sales += transaction.grossAmount;
        } else {
          data.rentals += transaction.grossAmount;
        }
        data.commission += transaction.commissionAmount || 0;
      }
    });

    leads.forEach(lead => {
      const monthKey = lead.createdAt.toISOString().slice(0, 7);
      const data = monthlyData.get(monthKey);
      if (data) {
        data.leads += 1;
      }
    });

    opportunities.forEach(opportunity => {
      const monthKey = opportunity.createdAt.toISOString().slice(0, 7);
      const data = monthlyData.get(monthKey);
      if (data) {
        data.opportunities += 1;
      }
    });

    return Array.from(monthlyData.values());
  }

  private async getConversionFunnel(dateFilter: any, officeFilter: any) {
    const [
      leadsCount,
      opportunitiesCount,
      negotiationsCount,
      proposalsCount,
      closedWonCount
    ] = await Promise.all([
      this.prisma.lead.count({ where: { ...dateFilter, ...officeFilter } }),
      this.prisma.opportunity.count({ where: { ...dateFilter, ...officeFilter } }),
      this.prisma.opportunity.count({ where: { ...dateFilter, ...officeFilter, stage: 'NEGOTIATION' } }),
      this.prisma.opportunity.count({ where: { ...dateFilter, ...officeFilter, stage: 'OFFER' } }),
      this.prisma.opportunity.count({ where: { ...dateFilter, ...officeFilter, stage: 'WON' } })
    ]);

    return [
      { stage: 'Leads', count: leadsCount, percentage: 100 },
      { stage: 'Opportunities', count: opportunitiesCount, percentage: leadsCount > 0 ? (opportunitiesCount / leadsCount) * 100 : 0 },
      { stage: 'Negotiations', count: negotiationsCount, percentage: leadsCount > 0 ? (negotiationsCount / leadsCount) * 100 : 0 },
      { stage: 'Proposals', count: proposalsCount, percentage: leadsCount > 0 ? (proposalsCount / leadsCount) * 100 : 0 },
      { stage: 'Closed Won', count: closedWonCount, percentage: leadsCount > 0 ? (closedWonCount / leadsCount) * 100 : 0 }
    ];
  }

  private async getClientRetentionChart(dateFilter: any, officeFilter: any) {
    // If no date filter, use last 12 months
    const startDate = dateFilter.createdAt?.gte || new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
    const endDate = dateFilter.createdAt?.lte || new Date();
    
    const monthlyData: any[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      
      const newClients = await this.prisma.client.count({
        where: {
          ...officeFilter,
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      const allClients = await this.prisma.client.findMany({
        where: officeFilter,
        include: { transactions: true }
      });

      const returningClients = allClients.filter(client => 
        client.transactions.some(t => t.createdAt >= monthStart && t.createdAt <= monthEnd) &&
        client.transactions.some(t => t.createdAt < monthStart)
      ).length;

      const totalClients = allClients.length;
      const retentionRate = totalClients > 0 ? (returningClients / totalClients) * 100 : 0;

      monthlyData.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        newClients,
        returningClients,
        retentionRate
      });
    }

    return monthlyData;
  }

  private async getTopPerformers(dateFilter: any, officeFilter: any) {
    const topOffices = await this.prisma.office.findMany({
      include: {
        transactions: {
          where: dateFilter
        }
      },
      orderBy: {
        transactions: {
          _count: 'desc'
        }
      },
      take: 5
    });

    const topAgents = await this.prisma.user.findMany({
      where: {
        ...officeFilter,
        role: { in: ['AGENT', 'MANAGER'] }
      },
      include: {
        primaryTransactions: {
          where: dateFilter
        },
        office: true
      },
      orderBy: {
        primaryTransactions: {
          _count: 'desc'
        }
      },
      take: 5
    });

    return {
      topOffices: topOffices.map(office => ({
        id: office.id,
        name: office.name,
        revenue: office.transactions.reduce((sum, t) => sum + t.grossAmount, 0),
        deals: office.transactions.length,
        growth: 0 // Would need historical data to calculate
      })),
      topAgents: topAgents.map(agent => ({
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        office: agent.office?.name || '',
        revenue: agent.primaryTransactions.reduce((sum, t) => sum + t.grossAmount, 0),
        deals: agent.primaryTransactions.length,
        conversionRate: 0, // Would calculate from leads conversion
        points: agent.points
      }))
    };
  }

  private async getAverageDealTime(dateFilter: any, officeFilter: any): Promise<number> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        ...dateFilter,
        ...officeFilter
      },
      include: {
        opportunity: {
          include: {
            lead: true
          }
        }
      }
    });

    if (transactions.length === 0) return 0;

    const dealTimes = transactions
      .filter(t => t.opportunity?.lead)
      .map(t => {
        const leadCreated = t.opportunity!.lead!.createdAt;
        const dealClosed = t.createdAt;
        return Math.ceil((dealClosed.getTime() - leadCreated.getTime()) / (1000 * 60 * 60 * 24));
      });

    return dealTimes.length > 0 ? 
      Math.round(dealTimes.reduce((sum, time) => sum + time, 0) / dealTimes.length) : 
      0;
  }

  async getOffices(req: Request, res: Response) {
    try {
      const { user } = req as any;
      
      const offices = await this.prisma.office.findMany({
        where: user.role === 'SUPER_ADMIN' ? {} : { id: user.officeId },
        select: {
          id: true,
          name: true,
          city: true
        }
      });

      res.json({
        success: true,
        data: offices
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch offices'
      });
    }
  }
}
