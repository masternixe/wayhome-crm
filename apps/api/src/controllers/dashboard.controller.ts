import { Request, Response } from 'express';
import { PrismaClient } from '@wayhome/database';

export class DashboardController {
  constructor(private prisma: PrismaClient) {}

  async getStats(req: Request, res: Response) {
    try {
      const { user } = req as any;

      // Build base filters based on user role
      const officeFilter = user.role !== 'SUPER_ADMIN' ? { officeId: user.officeId } : {};
      const agentFilter = user.role === 'AGENT' ? { ownerAgentId: user.userId } : {};

      // Get current month and last month dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get all the stats in parallel
      const [
        // Properties
        totalProperties,
        currentMonthProperties,
        
        // Leads
        totalLeads,
        newLeads,
        convertedLeads,
        
        // Opportunities
        totalOpportunities,
        activeOpportunities,
        wonOpportunities,
        
        // Clients
        totalClients,
        newClients,
        
        // Transactions
        totalTransactions,
        currentMonthTransactions,
        totalRevenue,
        currentMonthRevenue,
        
        // Tasks
        myTasks,
        overdueTasks,
        
        // Points (for agents)
        myPoints,
        
        // Recent activities
        recentProperties,
        recentLeads,
        recentOpportunities,
        
        // Performance metrics
        lastMonthRevenue,
        lastMonthTransactions,
      ] = await Promise.all([
        // Properties
        this.prisma.property.count({
          where: { ...officeFilter, ...agentFilter },
        }),
        this.prisma.property.count({
          where: {
            ...officeFilter,
            ...agentFilter,
            createdAt: { gte: currentMonthStart },
          },
        }),
        
        // Leads
        this.prisma.lead.count({
          where: { ...officeFilter, assignedToId: user.role === 'AGENT' ? user.userId : undefined },
        }),
        this.prisma.lead.count({
          where: {
            ...officeFilter,
            assignedToId: user.role === 'AGENT' ? user.userId : undefined,
            createdAt: { gte: currentMonthStart },
          },
        }),
        this.prisma.lead.count({
          where: {
            ...officeFilter,
            assignedToId: user.role === 'AGENT' ? user.userId : undefined,
            status: 'CONVERTED',
          },
        }),
        
        // Opportunities
        this.prisma.opportunity.count({
          where: officeFilter,
        }),
        this.prisma.opportunity.count({
          where: {
            ...officeFilter,
            stage: { in: ['PROSPECT', 'NEGOTIATION', 'OFFER'] },
          },
        }),
        this.prisma.opportunity.count({
          where: {
            ...officeFilter,
            stage: 'WON',
          },
        }),
        
        // Clients
        this.prisma.client.count({
          where: { ...officeFilter, ...agentFilter },
        }),
        this.prisma.client.count({
          where: {
            ...officeFilter,
            ...agentFilter,
            createdAt: { gte: currentMonthStart },
          },
        }),
        
        // Transactions
        this.prisma.transaction.count({
          where: {
            ...officeFilter,
            ...(user.role === 'AGENT' ? {
              OR: [
                { primaryAgentId: user.userId },
                { collaboratingAgentId: user.userId },
              ]
            } : {}),
          },
        }),
        this.prisma.transaction.count({
          where: {
            ...officeFilter,
            ...(user.role === 'AGENT' ? {
              OR: [
                { primaryAgentId: user.userId },
                { collaboratingAgentId: user.userId },
              ]
            } : {}),
            createdAt: { gte: currentMonthStart },
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            ...officeFilter,
            ...(user.role === 'AGENT' ? {
              OR: [
                { primaryAgentId: user.userId },
                { collaboratingAgentId: user.userId },
              ]
            } : {}),
            status: 'CLOSED',
          },
          _sum: { grossAmount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            ...officeFilter,
            ...(user.role === 'AGENT' ? {
              OR: [
                { primaryAgentId: user.userId },
                { collaboratingAgentId: user.userId },
              ]
            } : {}),
            status: 'CLOSED',
            closeDate: { gte: currentMonthStart },
          },
          _sum: { grossAmount: true },
        }),
        
        // Tasks (only for current user)
        this.prisma.task.count({
          where: {
            assignedToId: user.userId,
            status: { not: 'DONE' },
          },
        }),
        this.prisma.task.count({
          where: {
            assignedToId: user.userId,
            status: { not: 'DONE' },
            dueDate: { lt: now },
          },
        }),
        
        // Points (for agents only)
        user.role === 'AGENT' ? this.prisma.pointsLedger.aggregate({
          where: { agentId: user.userId },
          _sum: { points: true },
        }) : Promise.resolve({ _sum: { points: 0 } }),
        
        // Recent activities
        this.prisma.property.findMany({
          where: { ...officeFilter, ...agentFilter },
          select: {
            id: true,
            title: true,
            price: true,
            city: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.lead.findMany({
          where: { 
            ...officeFilter, 
            assignedToId: user.role === 'AGENT' ? user.userId : undefined 
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            leadNumber: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.opportunity.findMany({
          where: officeFilter,
          select: {
            id: true,
            stage: true,
            estimatedValue: true,
            createdAt: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        
        // Last month metrics for comparison
        this.prisma.transaction.aggregate({
          where: {
            ...officeFilter,
            ...(user.role === 'AGENT' ? {
              OR: [
                { primaryAgentId: user.userId },
                { collaboratingAgentId: user.userId },
              ]
            } : {}),
            status: 'CLOSED',
            closeDate: {
              gte: lastMonthStart,
              lte: lastMonthEnd,
            },
          },
          _sum: { grossAmount: true },
        }),
        this.prisma.transaction.count({
          where: {
            ...officeFilter,
            ...(user.role === 'AGENT' ? {
              OR: [
                { primaryAgentId: user.userId },
                { collaboratingAgentId: user.userId },
              ]
            } : {}),
            createdAt: {
              gte: lastMonthStart,
              lte: lastMonthEnd,
            },
          },
        }),
      ]);

      // Calculate performance metrics
      const currentRevenue = currentMonthRevenue._sum.grossAmount || 0;
      const lastRevenue = lastMonthRevenue._sum.grossAmount || 0;
      const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

      const transactionGrowth = lastMonthTransactions > 0 
        ? ((currentMonthTransactions - lastMonthTransactions) / lastMonthTransactions) * 100 
        : 0;

      // Calculate conversion rate
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Determine user's target based on role
      let targetSales = 0;
      let targetRentals = 0;
      if (user.role === 'AGENT') {
        const agentData = await this.prisma.user.findUnique({
          where: { id: user.userId },
          select: { targetSales: true, targetRentals: true },
        });
        targetSales = agentData?.targetSales || 0;
        targetRentals = agentData?.targetRentals || 0;
      }

      res.json({
        success: true,
        data: {
          overview: {
            totalProperties,
            totalLeads,
            totalOpportunities,
            totalClients,
            totalTransactions,
            totalRevenue: totalRevenue._sum.grossAmount || 0,
            currentMonthRevenue: currentRevenue,
            revenueGrowth: Math.round(revenueGrowth * 100) / 100,
            transactionGrowth: Math.round(transactionGrowth * 100) / 100,
            conversionRate: Math.round(conversionRate * 100) / 100,
          },
          thisMonth: {
            newProperties: currentMonthProperties,
            newLeads,
            newClients,
            newTransactions: currentMonthTransactions,
            revenue: currentRevenue,
          },
          opportunities: {
            total: totalOpportunities,
            active: activeOpportunities,
            won: wonOpportunities,
            winRate: totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 100) : 0,
          },
          tasks: {
            active: myTasks,
            overdue: overdueTasks,
          },
          performance: {
            myPoints: myPoints._sum.points || 0,
            targetSales,
            targetRentals,
            achievedSales: wonOpportunities, // Simplified - could be more sophisticated
          },
          recentActivity: {
            properties: recentProperties,
            leads: recentLeads,
            opportunities: recentOpportunities,
          },
        },
      });
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getQuickStats(req: Request, res: Response) {
    try {
      const { user } = req as any;

      // Get quick stats for widgets
      const [myActiveTasks, myOverdueTasks, myLeads, myOpportunities] = await Promise.all([
        this.prisma.task.count({
          where: {
            assignedToId: user.userId,
            status: 'OPEN',
          },
        }),
        this.prisma.task.count({
          where: {
            assignedToId: user.userId,
            status: { not: 'DONE' },
            dueDate: { lt: new Date() },
          },
        }),
        this.prisma.lead.count({
          where: {
            assignedToId: user.userId,
            status: { not: 'CONVERTED' },
          },
        }),
        this.prisma.opportunity.count({
          where: {
            office: user.role !== 'SUPER_ADMIN' ? { id: user.officeId } : undefined,
            stage: { in: ['PROSPECT', 'NEGOTIATION', 'OFFER'] },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          activeTasks: myActiveTasks,
          overdueTasks: myOverdueTasks,
          activeLeads: myLeads,
          activeOpportunities: myOpportunities,
        },
      });
    } catch (error) {
      console.error('Failed to get quick stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get quick stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getLeaderboard(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { period = 'month', limit = 10 } = req.query;

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      // Get office filter
      const officeFilter = user.role !== 'SUPER_ADMIN' ? { officeId: user.officeId } : {};

      // Get agents with their performance
      const agents = await this.prisma.user.findMany({
        where: {
          ...officeFilter,
          role: { in: ['AGENT', 'MANAGER'] },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          primaryTransactions: {
            where: {
              status: 'CLOSED',
              closeDate: { gte: startDate },
            },
            select: {
              grossAmount: true,
              commissionAmount: true,
            },
          },
          collaboratingTransactions: {
            where: {
              status: 'CLOSED',
              closeDate: { gte: startDate },
            },
            select: {
              grossAmount: true,
              commissionAmount: true,
            },
          },
          assignedLeads: {
            where: {
              status: 'CONVERTED',
              updatedAt: { gte: startDate },
            },
          },
        },
        take: Number(limit),
      });

      // Calculate stats for each agent
      const leaderboard = agents.map(agent => {
        const primaryRevenue = agent.primaryTransactions.reduce((sum, t) => sum + t.grossAmount, 0);
        const collaboratingRevenue = agent.collaboratingTransactions.reduce((sum, t) => sum + (t.grossAmount * 0.5), 0); // Assume 50% split
        const totalRevenue = primaryRevenue + collaboratingRevenue;
        
        const primaryCommission = agent.primaryTransactions.reduce((sum, t) => sum + t.commissionAmount, 0);
        const collaboratingCommission = agent.collaboratingTransactions.reduce((sum, t) => sum + (t.commissionAmount * 0.5), 0);
        const totalCommission = primaryCommission + collaboratingCommission;
        
        const totalDeals = agent.primaryTransactions.length + agent.collaboratingTransactions.length;
        const convertedLeads = agent.assignedLeads.length;

        return {
          id: agent.id,
          name: `${agent.firstName} ${agent.lastName}`,
          avatar: agent.avatar,
          role: agent.role,
          totalRevenue,
          totalCommission,
          totalDeals,
          convertedLeads,
          avgDealSize: totalDeals > 0 ? totalRevenue / totalDeals : 0,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((agent, index) => ({
        ...agent,
        rank: index + 1,
      }));

      res.json({
        success: true,
        data: {
          period,
          leaderboard,
        },
      });
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get leaderboard',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getRecentActivity(req: Request, res: Response) {
    try {
      const { user } = req as any;
      const { limit = 10 } = req.query;

      // Build filters based on user role
      const officeFilter = user.role !== 'SUPER_ADMIN' ? { officeId: user.officeId } : {};
      const agentFilter = user.role === 'AGENT' ? { assignedToId: user.userId } : {};

      // Get recent activities from different entities
      const [recentLeads, recentClients, recentProperties, recentTransactions] = await Promise.all([
        // Recent leads
        this.prisma.lead.findMany({
          where: {
            ...officeFilter,
            ...(user.role === 'AGENT' ? { assignedToId: user.userId } : {}),
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mobile: true,
            status: true,
            createdAt: true,
            assignedTo: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
        }),

        // Recent clients
        this.prisma.client.findMany({
          where: {
            ...officeFilter,
            ...(user.role === 'AGENT' ? { ownerAgentId: user.userId } : {}),
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mobile: true,
            createdAt: true,
            ownerAgent: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
        }),

        // Recent properties
        this.prisma.property.findMany({
          where: {
            ...officeFilter,
            ...(user.role === 'AGENT' ? { agentOwnerId: user.userId } : {}),
          },
          select: {
            id: true,
            title: true,
            city: true,
            zona: true,
            price: true,
            currency: true,
            type: true,
            createdAt: true,
            agentOwner: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
        }),

        // Recent transactions
        this.prisma.transaction.findMany({
          where: {
            ...officeFilter,
            ...(user.role === 'AGENT' ? { 
              OR: [
                { primaryAgentId: user.userId },
                { collaboratingAgentId: user.userId }
              ]
            } : {}),
          },
          select: {
            id: true,
            type: true,
            status: true,
            grossAmount: true,
            commissionAmount: true,
            closeDate: true,
            createdAt: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            property: {
              select: {
                title: true,
                city: true,
                zona: true,
              },
            },
            primaryAgent: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
        }),
      ]);

      // Combine and format activities
      const activities: Array<{
        id: string;
        type: 'lead' | 'client' | 'property' | 'transaction';
        message: string;
        createdAt: Date;
        entityId: string;
      }> = [];

      // Format leads
      recentLeads.forEach(lead => {
        const agentName = lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Pa përgjegjës';
        activities.push({
          id: `lead-${lead.id}`,
          type: 'lead',
          message: `Lead i ri: ${lead.firstName} ${lead.lastName} (${lead.mobile}) - ${agentName}`,
          createdAt: lead.createdAt,
          entityId: lead.id,
        });
      });

      // Format clients
      recentClients.forEach(client => {
        const agentName = client.ownerAgent ? `${client.ownerAgent.firstName} ${client.ownerAgent.lastName}` : 'Pa përgjegjës';
        activities.push({
          id: `client-${client.id}`,
          type: 'client',
          message: `Klient i ri u regjistrua: ${client.firstName} ${client.lastName} - ${agentName}`,
          createdAt: client.createdAt,
          entityId: client.id,
        });
      });

      // Format properties
      recentProperties.forEach(property => {
        const agentName = property.agentOwner ? `${property.agentOwner.firstName} ${property.agentOwner.lastName}` : 'Pa përgjegjës';
        const price = property.currency === 'EUR' ? `€${property.price.toLocaleString()}` : `${property.price.toLocaleString()} ALL`;
        activities.push({
          id: `property-${property.id}`,
          type: 'property',
          message: `Prona e re u shtua: "${property.title}" në ${property.city}, ${property.zona} - ${price} (${agentName})`,
          createdAt: property.createdAt,
          entityId: property.id,
        });
      });

      // Format transactions
      recentTransactions.forEach(transaction => {
        const clientName = transaction.client ? `${transaction.client.firstName} ${transaction.client.lastName}` : 'Pa klient';
        const propertyTitle = transaction.property?.title || 'Pa pronë';
        const propertyLocation = transaction.property ? `${transaction.property.city}, ${transaction.property.zona}` : '';
        const agentName = transaction.primaryAgent ? `${transaction.primaryAgent.firstName} ${transaction.primaryAgent.lastName}` : 'Pa përgjegjës';
        const statusText = transaction.status === 'CLOSED' ? 'u mbyll' : transaction.status === 'PENDING' ? 'është në proces' : 'u hap';
        const amount = `€${transaction.grossAmount.toLocaleString()}`;
        
        activities.push({
          id: `transaction-${transaction.id}`,
          type: 'transaction',
          message: `Transaksion ${statusText}: ${propertyTitle} ${propertyLocation ? `(${propertyLocation})` : ''} - ${amount} - ${clientName} (${agentName})`,
          createdAt: transaction.createdAt,
          entityId: transaction.id,
        });
      });

      // Sort all activities by creation date and limit results
      const sortedActivities = activities
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, Number(limit));

      res.json({
        success: true,
        data: sortedActivities,
      });
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recent activity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
