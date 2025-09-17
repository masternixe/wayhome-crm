import { PrismaClient, PointActionType, TransactionType, UserRole } from '@wayhome/database';

export interface PointsConfig {
  LEAD_CREATED: number;
  PROPERTY_LISTED: number;
  NEGOTIATION_DISCOUNT: number;
  COLLABORATION_SALE: number;
  SALE_CLOSED: number;
  RENT_CLOSED: number;
}

export interface PointsTransaction {
  agentId: string;
  actionType: PointActionType;
  points: number;
  meta?: any;
}

export interface AgentPoints {
  agentId: string;
  totalPoints: number;
  recentTransactions: Array<{
    actionType: PointActionType;
    points: number;
    createdAt: Date;
    meta?: any;
  }>;
  breakdown: {
    [key in PointActionType]?: number;
  };
}

export class PointsService {
  private static readonly DEFAULT_POINTS_CONFIG: PointsConfig = {
    LEAD_CREATED: 1,
    PROPERTY_LISTED: 5,
    NEGOTIATION_DISCOUNT: 30,
    COLLABORATION_SALE: 10,
    SALE_CLOSED: 20,
    RENT_CLOSED: 10,
  };

  constructor(
    private prisma: PrismaClient,
    private pointsConfig: PointsConfig = PointsService.DEFAULT_POINTS_CONFIG
  ) {}

  /**
   * Award points to an agent for a specific action
   */
  async awardPoints(transaction: PointsTransaction): Promise<void> {
    const { agentId, actionType, meta } = transaction;
    
    // Validate agent exists and is eligible
    const agent = await this.prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, role: true, status: true },
    });

    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    if (agent.role !== UserRole.AGENT && agent.role !== UserRole.MANAGER) {
      throw new Error('Points can only be awarded to agents and managers');
    }

    if (agent.status !== 'ACTIVE') {
      throw new Error('Points cannot be awarded to inactive users');
    }

    // Get points for action
    const points = this.getPointsForAction(actionType);

    // Create points ledger entry and update agent's total
    await this.prisma.$transaction([
      this.prisma.pointsLedger.create({
        data: {
          agentId,
          actionType,
          points,
          meta,
        },
      }),
      this.prisma.user.update({
        where: { id: agentId },
        data: {
          points: {
            increment: points,
          },
        },
      }),
    ]);
  }

  /**
   * Award points to multiple agents (e.g., for collaborations)
   */
  async awardPointsBulk(transactions: PointsTransaction[]): Promise<void> {
    const operations = [];

    for (const transaction of transactions) {
      // Validate each agent
      const agent = await this.prisma.user.findUnique({
        where: { id: transaction.agentId },
        select: { id: true, role: true, status: true },
      });

      if (!agent || agent.status !== 'ACTIVE') {
        continue; // Skip inactive agents
      }

      if (agent.role !== UserRole.AGENT && agent.role !== UserRole.MANAGER) {
        continue; // Skip non-agents
      }

      const points = this.getPointsForAction(transaction.actionType);

      operations.push(
        this.prisma.pointsLedger.create({
          data: {
            agentId: transaction.agentId,
            actionType: transaction.actionType,
            points,
            meta: transaction.meta,
          },
        })
      );

      operations.push(
        this.prisma.user.update({
          where: { id: transaction.agentId },
          data: {
            points: {
              increment: points,
            },
          },
        })
      );
    }

    if (operations.length > 0) {
      await this.prisma.$transaction(operations);
    }
  }

  /**
   * Award points for a closed transaction
   */
  async awardTransactionPoints(
    transactionId: string,
    transactionType: TransactionType,
    primaryAgentId: string,
    collaboratingAgentId?: string
  ): Promise<void> {
    const pointsTransactions: PointsTransaction[] = [];

    // Determine the action type based on transaction type
    const actionType = transactionType === TransactionType.SALE 
      ? PointActionType.SALE_CLOSED 
      : PointActionType.RENT_CLOSED;

    // Award points to primary agent
    pointsTransactions.push({
      agentId: primaryAgentId,
      actionType,
      points: this.getPointsForAction(actionType),
      meta: { transactionId, role: 'primary' },
    });

    // Award collaboration points if there's a collaborating agent
    if (collaboratingAgentId) {
      pointsTransactions.push({
        agentId: primaryAgentId,
        actionType: PointActionType.COLLABORATION_SALE,
        points: this.getPointsForAction(PointActionType.COLLABORATION_SALE),
        meta: { transactionId, role: 'primary', collaboratorId: collaboratingAgentId },
      });

      pointsTransactions.push({
        agentId: collaboratingAgentId,
        actionType: PointActionType.COLLABORATION_SALE,
        points: this.getPointsForAction(PointActionType.COLLABORATION_SALE),
        meta: { transactionId, role: 'collaborator', primaryAgentId },
      });
    }

    await this.awardPointsBulk(pointsTransactions);
  }

  /**
   * Get agent's points summary
   */
  async getAgentPoints(agentId: string, daysBack: number = 30): Promise<AgentPoints> {
    const agent = await this.prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, points: true },
    });

    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const recentTransactions = await this.prisma.pointsLedger.findMany({
      where: {
        agentId,
        createdAt: {
          gte: cutoffDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate breakdown by action type
    const breakdown = await this.prisma.pointsLedger.groupBy({
      by: ['actionType'],
      where: { agentId },
      _sum: {
        points: true,
      },
    });

    const breakdownMap: AgentPoints['breakdown'] = {};
    breakdown.forEach(item => {
      breakdownMap[item.actionType] = item._sum.points || 0;
    });

    return {
      agentId,
      totalPoints: agent.points,
      recentTransactions: recentTransactions.map(t => ({
        actionType: t.actionType,
        points: t.points,
        createdAt: t.createdAt,
        meta: t.meta,
      })),
      breakdown: breakdownMap,
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    officeId?: string,
    limit: number = 10,
    timeframe?: { start: Date; end: Date }
  ): Promise<Array<{
    agentId: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    totalPoints: number;
    recentPoints: number;
    rank: number;
  }>> {
    const whereClause: any = {
      role: { in: [UserRole.AGENT, UserRole.MANAGER] },
      status: 'ACTIVE',
    };

    if (officeId) {
      whereClause.officeId = officeId;
    }

    // Get all eligible agents
    const agents = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        points: true,
      },
      orderBy: { points: 'desc' },
      take: limit,
    });

    // If timeframe is specified, get recent points
    const agentIds = agents.map(a => a.id);
    let recentPointsMap: Map<string, number> = new Map();

    if (timeframe) {
      const recentPoints = await this.prisma.pointsLedger.groupBy({
        by: ['agentId'],
        where: {
          agentId: { in: agentIds },
          createdAt: {
            gte: timeframe.start,
            lte: timeframe.end,
          },
        },
        _sum: {
          points: true,
        },
      });

      recentPoints.forEach(rp => {
        recentPointsMap.set(rp.agentId, rp._sum.points || 0);
      });
    }

    return agents.map((agent, index) => ({
      agentId: agent.id,
      firstName: agent.firstName,
      lastName: agent.lastName,
      avatar: agent.avatar || undefined,
      totalPoints: agent.points,
      recentPoints: recentPointsMap.get(agent.id) || 0,
      rank: index + 1,
    }));
  }

  /**
   * Get points for a specific action
   */
  private getPointsForAction(actionType: PointActionType): number {
    switch (actionType) {
      case PointActionType.LEAD_CREATED:
        return this.pointsConfig.LEAD_CREATED;
      case PointActionType.PROPERTY_LISTED:
        return this.pointsConfig.PROPERTY_LISTED;
      case PointActionType.NEGOTIATION_DISCOUNT:
        return this.pointsConfig.NEGOTIATION_DISCOUNT;
      case PointActionType.COLLABORATION_SALE:
        return this.pointsConfig.COLLABORATION_SALE;
      case PointActionType.SALE_CLOSED:
        return this.pointsConfig.SALE_CLOSED;
      case PointActionType.RENT_CLOSED:
        return this.pointsConfig.RENT_CLOSED;
      default:
        throw new Error(`Invalid action type: ${actionType}`);
    }
  }

  /**
   * Update points configuration
   */
  updatePointsConfig(config: Partial<PointsConfig>): void {
    this.pointsConfig = { ...this.pointsConfig, ...config };
  }

  /**
   * Reset agent points (admin only)
   */
  async resetAgentPoints(agentId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.pointsLedger.deleteMany({
        where: { agentId },
      }),
      this.prisma.user.update({
        where: { id: agentId },
        data: { points: 0 },
      }),
    ]);
  }

  /**
   * Get points history for analytics
   */
  async getPointsHistory(
    agentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    date: string;
    points: number;
    actions: Array<{ type: PointActionType; count: number }>;
  }>> {
    const transactions = await this.prisma.pointsLedger.findMany({
      where: {
        agentId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const groupedByDate = new Map<string, {
      points: number;
      actions: Map<PointActionType, number>;
    }>();

    transactions.forEach(transaction => {
      const dateKey = transaction.createdAt.toISOString().split('T')[0];
      
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, {
          points: 0,
          actions: new Map(),
        });
      }

      const dateData = groupedByDate.get(dateKey)!;
      dateData.points += transaction.points;
      
      const currentCount = dateData.actions.get(transaction.actionType) || 0;
      dateData.actions.set(transaction.actionType, currentCount + 1);
    });

    // Convert to array format
    return Array.from(groupedByDate.entries()).map(([date, data]) => ({
      date,
      points: data.points,
      actions: Array.from(data.actions.entries()).map(([type, count]) => ({
        type,
        count,
      })),
    }));
  }
}
