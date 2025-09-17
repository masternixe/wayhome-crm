import Stripe from 'stripe';
import { PrismaClient, Currency, BiddingSlot } from '@wayhome/database';
import { addDays } from 'date-fns';

export interface PromotionCheckoutInput {
  userListingId: string;
  amount: number;
  currency: Currency;
  slotDuration: number; // days
  successUrl: string;
  cancelUrl: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export interface BiddingSlotInfo {
  id: string;
  userListingId: string;
  title: string;
  amountPaid: number;
  currency: Currency;
  slotPosition: number;
  activeUntil: Date;
  listing: {
    id: string;
    title: string;
    city: string;
    zona: string;
    price: number;
    gallery: string[];
  };
}

export class StripeService {
  private stripe: Stripe;
  private readonly PROMOTION_SLOT_DURATION_DAYS = 30;
  private readonly MAX_BIDDING_SLOTS = 10;

  constructor(
    private prisma: PrismaClient,
    stripeSecretKey: string,
    private webhookSecret: string
  ) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });
  }

  /**
   * Create Stripe Checkout Session for property promotion
   */
  async createPromotionCheckoutSession(input: PromotionCheckoutInput): Promise<{ sessionId: string; url: string }> {
    const { userListingId, amount, currency, slotDuration, successUrl, cancelUrl } = input;

    // Verify listing exists and belongs to authenticated user
    const listing = await this.prisma.userListing.findUnique({
      where: { id: userListingId },
      include: { publicUser: true, biddingSlot: true },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== 'APPROVED' && listing.status !== 'ACTIVE') {
      throw new Error('Only approved listings can be promoted');
    }

    if (listing.biddingSlot) {
      throw new Error('Listing already has an active promotion');
    }

    // Create Stripe checkout session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Promote Property: ${listing.title}`,
              description: `Featured placement for ${slotDuration} days`,
              images: listing.gallery.length > 0 ? [listing.gallery[0]] : [],
            },
            unit_amount: this.convertToStripeAmount(amount, currency),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userListingId,
        slotDuration: slotDuration.toString(),
        currency,
      },
      customer_email: listing.publicUser.email,
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Get active bidding slots (Top 10)
   */
  async getActiveBiddingSlots(): Promise<BiddingSlotInfo[]> {
    const slots = await this.prisma.biddingSlot.findMany({
      where: {
        activeUntil: { gt: new Date() },
      },
      include: {
        userListing: {
          select: {
            id: true,
            title: true,
            city: true,
            zona: true,
            price: true,
            gallery: true,
          },
        },
      },
      orderBy: [
        { amountPaid: 'desc' },
        { createdAt: 'asc' },
      ],
      take: this.MAX_BIDDING_SLOTS,
    });

    return slots.map((slot, index) => ({
      id: slot.id,
      userListingId: slot.userListingId,
      title: slot.userListing.title,
      amountPaid: slot.amountPaid,
      currency: slot.currency,
      slotPosition: index + 1,
      activeUntil: slot.activeUntil,
      listing: slot.userListing,
    }));
  }

  /**
   * Clean up expired bidding slots
   */
  async cleanupExpiredSlots(): Promise<number> {
    const result = await this.prisma.biddingSlot.deleteMany({
      where: {
        activeUntil: { lt: new Date() },
      },
    });

    return result.count;
  }

  /**
   * Get promotion analytics
   */
  async getPromotionAnalytics(startDate: Date, endDate: Date): Promise<{
    totalRevenue: { eur: number; all: number };
    totalPromotions: number;
    avgPromotionAmount: { eur: number; all: number };
    topPerformingCities: Array<{ city: string; revenue: number; count: number }>;
    revenueByMonth: Array<{ month: string; revenue: number }>;
  }> {
    const slots = await this.prisma.biddingSlot.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        userListing: {
          select: {
            city: true,
          },
        },
      },
    });

    let totalRevenueEur = 0;
    let totalRevenueAll = 0;
    const cityRevenue = new Map<string, { revenue: number; count: number }>();

    slots.forEach(slot => {
      if (slot.currency === Currency.EUR) {
        totalRevenueEur += slot.amountPaid;
      } else {
        totalRevenueAll += slot.amountPaid;
      }

      const city = slot.userListing.city;
      const current = cityRevenue.get(city) || { revenue: 0, count: 0 };
      cityRevenue.set(city, {
        revenue: current.revenue + slot.amountPaid,
        count: current.count + 1,
      });
    });

    // Group by month
    const monthlyRevenue = new Map<string, number>();
    slots.forEach(slot => {
      const month = slot.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const current = monthlyRevenue.get(month) || 0;
      monthlyRevenue.set(month, current + slot.amountPaid);
    });

    return {
      totalRevenue: { eur: totalRevenueEur, all: totalRevenueAll },
      totalPromotions: slots.length,
      avgPromotionAmount: {
        eur: slots.length > 0 ? totalRevenueEur / slots.filter(s => s.currency === Currency.EUR).length || 0 : 0,
        all: slots.length > 0 ? totalRevenueAll / slots.filter(s => s.currency === Currency.ALL).length || 0 : 0,
      },
      topPerformingCities: Array.from(cityRevenue.entries())
        .map(([city, data]) => ({ city, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      revenueByMonth: Array.from(monthlyRevenue.entries())
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  /**
   * Check if listing can be promoted
   */
  async canPromoteListing(userListingId: string): Promise<{ canPromote: boolean; reason?: string }> {
    const listing = await this.prisma.userListing.findUnique({
      where: { id: userListingId },
      include: { biddingSlot: true },
    });

    if (!listing) {
      return { canPromote: false, reason: 'Listing not found' };
    }

    if (listing.status !== 'APPROVED' && listing.status !== 'ACTIVE') {
      return { canPromote: false, reason: 'Listing must be approved first' };
    }

    if (listing.biddingSlot && listing.biddingSlot.activeUntil > new Date()) {
      return { canPromote: false, reason: 'Listing already has an active promotion' };
    }

    return { canPromote: true };
  }

  /**
   * Handle successful checkout completion
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const { userListingId, slotDuration, currency } = session.metadata!;

    if (!session.payment_intent) {
      throw new Error('No payment intent found in session');
    }

    // Calculate slot position and active until date
    const activeUntil = addDays(new Date(), parseInt(slotDuration));
    const amountPaid = this.convertFromStripeAmount(session.amount_total!, currency as Currency);

    // Create bidding slot
    const slot = await this.prisma.biddingSlot.create({
      data: {
        userListingId,
        amountPaid,
        currency: currency as Currency,
        stripePaymentId: session.payment_intent as string,
        stripeSessionId: session.id,
        slotPosition: 0, // Will be updated below
        activeUntil,
      },
    });

    // Update slot position based on current rankings
    await this.updateSlotPositions();

    // Update listing status to active
    await this.prisma.userListing.update({
      where: { id: userListingId },
      data: { status: 'ACTIVE' },
    });

    console.log(`Created bidding slot ${slot.id} for listing ${userListingId}`);
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`Payment succeeded: ${paymentIntent.id}`);
    // Additional payment success logic can be added here
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`Payment failed: ${paymentIntent.id}`);
    // Handle payment failure logic here
  }

  /**
   * Update slot positions based on amount paid
   */
  private async updateSlotPositions(): Promise<void> {
    const activeSlots = await this.prisma.biddingSlot.findMany({
      where: {
        activeUntil: { gt: new Date() },
      },
      orderBy: [
        { amountPaid: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    // Update positions
    const updates = activeSlots.map((slot, index) => 
      this.prisma.biddingSlot.update({
        where: { id: slot.id },
        data: { slotPosition: index + 1 },
      })
    );

    await Promise.all(updates);
  }

  /**
   * Convert amount to Stripe format (cents)
   */
  private convertToStripeAmount(amount: number, currency: Currency): number {
    // Most currencies use cents, but some don't have fractional units
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND']; // Add more if needed
    
    if (zeroDecimalCurrencies.includes(currency)) {
      return Math.round(amount);
    }
    
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from Stripe format
   */
  private convertFromStripeAmount(amount: number, currency: Currency): number {
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND'];
    
    if (zeroDecimalCurrencies.includes(currency)) {
      return amount;
    }
    
    return amount / 100;
  }
}
