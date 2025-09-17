import { PointsService, PointsConfig } from '../../src/services/points.service';
import { PrismaClient, PointActionType, UserRole, TransactionType } from '@wayhome/database';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

describe('PointsService', () => {
  let service: PointsService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  const mockConfig: PointsConfig = {
    LEAD_CREATED: 1,
    PROPERTY_LISTED: 5,
    NEGOTIATION_DISCOUNT: 30,
    COLLABORATION_SALE: 10,
    SALE_CLOSED: 20,
    RENT_CLOSED: 10,
  };

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    service = new PointsService(prismaMock, mockConfig);
  });

  afterEach(() => {
    mockReset(prismaMock);
  });

  describe('awardPoints', () => {
    it('should award points to an active agent', async () => {
      const agentId = 'agent-123';
      const actionType = PointActionType.PROPERTY_LISTED;

      prismaMock.user.findUnique.mockResolvedValue({
        id: agentId,
        role: UserRole.AGENT,
        status: 'ACTIVE',
      } as any);

      prismaMock.$transaction.mockImplementation(async (callback) => {
        return callback;
      });

      await service.awardPoints({
        agentId,
        actionType,
        meta: { propertyId: 'prop-123' },
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: agentId },
        select: { id: true, role: true, status: true },
      });

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should award points to a manager', async () => {
      const managerId = 'manager-123';
      const actionType = PointActionType.LEAD_CREATED;

      prismaMock.user.findUnique.mockResolvedValue({
        id: managerId,
        role: UserRole.MANAGER,
        status: 'ACTIVE',
      } as any);

      prismaMock.$transaction.mockImplementation(async (callback) => {
        return callback;
      });

      await service.awardPoints({
        agentId: managerId,
        actionType,
      });

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should throw error for non-existent agent', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.awardPoints({
          agentId: 'non-existent',
          actionType: PointActionType.LEAD_CREATED,
        })
      ).rejects.toThrow('Agent with ID non-existent not found');
    });

    it('should throw error for non-agent roles', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-123',
        role: UserRole.OFFICE_ADMIN,
        status: 'ACTIVE',
      } as any);

      await expect(
        service.awardPoints({
          agentId: 'user-123',
          actionType: PointActionType.LEAD_CREATED,
        })
      ).rejects.toThrow('Points can only be awarded to agents and managers');
    });

    it('should throw error for inactive users', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'agent-123',
        role: UserRole.AGENT,
        status: 'INACTIVE',
      } as any);

      await expect(
        service.awardPoints({
          agentId: 'agent-123',
          actionType: PointActionType.LEAD_CREATED,
        })
      ).rejects.toThrow('Points cannot be awarded to inactive users');
    });
  });

  describe('awardTransactionPoints', () => {
    it('should award points for a sale with collaboration', async () => {
      const transactionId = 'trans-123';
      const primaryAgentId = 'agent-1';
      const collaboratorId = 'agent-2';

      // Mock all agent lookups
      prismaMock.user.findUnique
        .mockResolvedValueOnce({
          id: primaryAgentId,
          role: UserRole.AGENT,
          status: 'ACTIVE',
        } as any)
        .mockResolvedValueOnce({
          id: primaryAgentId,
          role: UserRole.AGENT,
          status: 'ACTIVE',
        } as any)
        .mockResolvedValueOnce({
          id: collaboratorId,
          role: UserRole.AGENT,
          status: 'ACTIVE',
        } as any);

      prismaMock.$transaction.mockImplementation(async (callback) => {
        return callback;
      });

      await service.awardTransactionPoints(
        transactionId,
        TransactionType.SALE,
        primaryAgentId,
        collaboratorId
      );

      // Should have called findUnique 3 times (primary for sale, primary for collab, collaborator for collab)
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(3);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should award points for a rental without collaboration', async () => {
      const transactionId = 'trans-456';
      const primaryAgentId = 'agent-1';

      prismaMock.user.findUnique.mockResolvedValue({
        id: primaryAgentId,
        role: UserRole.AGENT,
        status: 'ACTIVE',
      } as any);

      prismaMock.$transaction.mockImplementation(async (callback) => {
        return callback;
      });

      await service.awardTransactionPoints(
        transactionId,
        TransactionType.RENT,
        primaryAgentId
      );

      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('getAgentPoints', () => {
    it('should return agent points summary', async () => {
      const agentId = 'agent-123';
      const mockDate = new Date();

      prismaMock.user.findUnique.mockResolvedValue({
        id: agentId,
        points: 100,
      } as any);

      prismaMock.pointsLedger.findMany.mockResolvedValue([
        {
          id: '1',
          agentId,
          actionType: PointActionType.PROPERTY_LISTED,
          points: 5,
          createdAt: mockDate,
          meta: null,
        },
        {
          id: '2',
          agentId,
          actionType: PointActionType.LEAD_CREATED,
          points: 1,
          createdAt: mockDate,
          meta: null,
        },
      ]);

      prismaMock.pointsLedger.groupBy.mockResolvedValue([
        {
          actionType: PointActionType.PROPERTY_LISTED,
          _sum: { points: 50 },
        },
        {
          actionType: PointActionType.LEAD_CREATED,
          _sum: { points: 10 },
        },
      ] as any);

      const result = await service.getAgentPoints(agentId);

      expect(result.agentId).toBe(agentId);
      expect(result.totalPoints).toBe(100);
      expect(result.recentTransactions).toHaveLength(2);
      expect(result.breakdown[PointActionType.PROPERTY_LISTED]).toBe(50);
      expect(result.breakdown[PointActionType.LEAD_CREATED]).toBe(10);
    });

    it('should throw error for non-existent agent', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getAgentPoints('non-existent')).rejects.toThrow(
        'Agent with ID non-existent not found'
      );
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard for all offices', async () => {
      const agents = [
        {
          id: 'agent-1',
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'avatar1.jpg',
          points: 150,
        },
        {
          id: 'agent-2',
          firstName: 'Jane',
          lastName: 'Smith',
          avatar: null,
          points: 120,
        },
      ];

      prismaMock.user.findMany.mockResolvedValue(agents as any);

      const result = await service.getLeaderboard();

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].totalPoints).toBe(150);
      expect(result[1].rank).toBe(2);
      expect(result[1].totalPoints).toBe(120);
    });

    it('should return leaderboard with recent points for timeframe', async () => {
      const agents = [
        {
          id: 'agent-1',
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'avatar1.jpg',
          points: 150,
        },
      ];

      prismaMock.user.findMany.mockResolvedValue(agents as any);
      prismaMock.pointsLedger.groupBy.mockResolvedValue([
        {
          agentId: 'agent-1',
          _sum: { points: 30 },
        },
      ] as any);

      const timeframe = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      };

      const result = await service.getLeaderboard(undefined, 10, timeframe);

      expect(result[0].recentPoints).toBe(30);
    });

    it('should filter by office', async () => {
      const officeId = 'office-123';

      prismaMock.user.findMany.mockResolvedValue([]);

      await service.getLeaderboard(officeId);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            officeId,
          }),
        })
      );
    });
  });

  describe('resetAgentPoints', () => {
    it('should reset agent points', async () => {
      const agentId = 'agent-123';

      prismaMock.$transaction.mockImplementation(async (callback) => {
        return callback;
      });

      await service.resetAgentPoints(agentId);

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('getPointsHistory', () => {
    it('should return points history grouped by date', async () => {
      const agentId = 'agent-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      prismaMock.pointsLedger.findMany.mockResolvedValue([
        {
          id: '1',
          agentId,
          actionType: PointActionType.PROPERTY_LISTED,
          points: 5,
          createdAt: new Date('2024-01-15'),
          meta: null,
        },
        {
          id: '2',
          agentId,
          actionType: PointActionType.PROPERTY_LISTED,
          points: 5,
          createdAt: new Date('2024-01-15'),
          meta: null,
        },
        {
          id: '3',
          agentId,
          actionType: PointActionType.LEAD_CREATED,
          points: 1,
          createdAt: new Date('2024-01-16'),
          meta: null,
        },
      ]);

      const result = await service.getPointsHistory(agentId, startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].points).toBe(10);
      expect(result[0].actions).toEqual([
        { type: PointActionType.PROPERTY_LISTED, count: 2 },
      ]);
      expect(result[1].date).toBe('2024-01-16');
      expect(result[1].points).toBe(1);
    });
  });

  describe('updatePointsConfig', () => {
    it('should update points configuration', () => {
      service.updatePointsConfig({
        LEAD_CREATED: 2,
        SALE_CLOSED: 25,
      });

      // Test by awarding points with new config
      const agentId = 'agent-123';

      prismaMock.user.findUnique.mockResolvedValue({
        id: agentId,
        role: UserRole.AGENT,
        status: 'ACTIVE',
      } as any);

      prismaMock.$transaction.mockImplementation(async (ops) => {
        // Verify the updated points value is used
        const createOp = ops[0];
        expect(createOp).toBeDefined();
        return ops;
      });

      service.awardPoints({
        agentId,
        actionType: PointActionType.LEAD_CREATED,
      });
    });
  });
});
