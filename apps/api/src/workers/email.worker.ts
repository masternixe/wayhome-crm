import { Worker, Job, Queue } from 'bullmq';
import { PrismaClient } from '@wayhome/database';
import nodemailer from 'nodemailer';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';
import Redis from 'ioredis';

export interface EmailJobData {
  type: 'task_reminder' | 'daily_digest' | 'welcome' | 'verification' | 'password_reset';
  recipient: string;
  data: any;
}

export interface TaskReminderData {
  taskId: string;
  agentId: string;
  agentEmail: string;
  agentName: string;
  taskTitle: string;
  dueDate: Date;
}

export interface DailyDigestData {
  agentId: string;
  agentEmail: string;
  agentName: string;
  officeId: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private emailQueue: Queue<EmailJobData>;
  private worker: Worker<EmailJobData>;

  constructor(
    private prisma: PrismaClient,
    private redisConnection: Redis,
    private emailConfig: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    }
  ) {
    // Initialize nodemailer
    this.transporter = nodemailer.createTransport({
      host: this.emailConfig.host,
      port: this.emailConfig.port,
      secure: this.emailConfig.secure,
      auth: this.emailConfig.auth,
    });

    // Initialize email queue
    this.emailQueue = new Queue<EmailJobData>('email-queue', {
      connection: this.redisConnection,
    });

    // Initialize worker
    this.worker = new Worker<EmailJobData>(
      'email-queue',
      this.processEmailJob.bind(this),
      { connection: this.redisConnection }
    );

    // Schedule daily digest job
    this.scheduleRecurringJobs();
  }

  /**
   * Send task reminder email
   */
  async sendTaskReminder(data: TaskReminderData): Promise<void> {
    await this.emailQueue.add('task_reminder', {
      type: 'task_reminder',
      recipient: data.agentEmail,
      data,
    });
  }

  /**
   * Schedule daily digest for all agents
   */
  async scheduleDailyDigest(): Promise<void> {
    const agents = await this.prisma.user.findMany({
      where: {
        role: { in: ['AGENT', 'MANAGER'] },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        officeId: true,
      },
    });

    for (const agent of agents) {
      if (agent.officeId) {
        await this.emailQueue.add('daily_digest', {
          type: 'daily_digest',
          recipient: agent.email,
          data: {
            agentId: agent.id,
            agentEmail: agent.email,
            agentName: `${agent.firstName} ${agent.lastName}`,
            officeId: agent.officeId,
          },
        });
      }
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, name: string, isPublicUser: boolean = false): Promise<void> {
    await this.emailQueue.add('welcome', {
      type: 'welcome',
      recipient: email,
      data: { name, isPublicUser },
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    await this.emailQueue.add('verification', {
      type: 'verification',
      recipient: email,
      data: { name, token },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
    await this.emailQueue.add('password_reset', {
      type: 'password_reset',
      recipient: email,
      data: { name, token },
    });
  }

  /**
   * Process email job
   */
  private async processEmailJob(job: Job<EmailJobData>): Promise<void> {
    const { type, recipient, data } = job.data;

    try {
      switch (type) {
        case 'task_reminder':
          await this.sendTaskReminderEmail(recipient, data);
          break;
        case 'daily_digest':
          await this.sendDailyDigestEmail(recipient, data);
          break;
        case 'welcome':
          await this.sendWelcomeEmailTemplate(recipient, data);
          break;
        case 'verification':
          await this.sendVerificationEmailTemplate(recipient, data);
          break;
        case 'password_reset':
          await this.sendPasswordResetEmailTemplate(recipient, data);
          break;
        default:
          throw new Error(`Unknown email type: ${type}`);
      }
      
      console.log(`Email sent successfully: ${type} to ${recipient}`);
    } catch (error) {
      console.error(`Failed to send email: ${type} to ${recipient}`, error);
      throw error;
    }
  }

  /**
   * Send task reminder email template
   */
  private async sendTaskReminderEmail(recipient: string, data: TaskReminderData): Promise<void> {
    const { agentName, taskTitle, dueDate } = data;
    const formattedDate = format(dueDate, 'PPP p'); // e.g., "January 1st, 2024 at 2:00 PM"

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Task Reminder</h2>
        <p>Hello ${agentName},</p>
        <p>This is a reminder that you have a task due soon:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${taskTitle}</h3>
          <p style="margin: 0; color: #6b7280;">Due: ${formattedDate}</p>
        </div>
        <p>Please log in to your CRM dashboard to view and complete this task.</p>
        <a href="${process.env.CRM_URL}/crm/tasks" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Tasks
        </a>
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
          Best regards,<br>
          Wayhome CRM Team
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@wayhome.com',
      to: recipient,
      subject: `Task Reminder: ${taskTitle}`,
      html,
    });
  }

  /**
   * Send daily digest email
   */
  private async sendDailyDigestEmail(recipient: string, data: DailyDigestData): Promise<void> {
    const { agentId, agentName, officeId } = data;
    const today = new Date();
    const tomorrow = addDays(today, 1);

    // Get today's tasks
    const todaysTasks = await this.prisma.task.findMany({
      where: {
        assignedToId: agentId,
        status: 'OPEN',
        dueDate: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
      take: 5,
    });

    // Get tomorrow's tasks
    const tomorrowsTasks = await this.prisma.task.findMany({
      where: {
        assignedToId: agentId,
        status: 'OPEN',
        dueDate: {
          gte: startOfDay(tomorrow),
          lte: endOfDay(tomorrow),
        },
      },
      take: 5,
    });

    // Get recent leads
    const recentLeads = await this.prisma.lead.findMany({
      where: {
        assignedToId: agentId,
        createdAt: {
          gte: startOfDay(addDays(today, -7)),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Get performance summary for the week
    const weekStart = startOfDay(addDays(today, -7));
    const [weeklyLeads, weeklyProperties] = await Promise.all([
      this.prisma.lead.count({
        where: {
          assignedToId: agentId,
          createdAt: { gte: weekStart },
        },
      }),
      this.prisma.property.count({
        where: {
          agentOwnerId: agentId,
          createdAt: { gte: weekStart },
        },
      }),
    ]);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Daily Digest - ${format(today, 'MMMM do, yyyy')}</h2>
        <p>Good morning ${agentName},</p>
        
        <h3 style="color: #1f2937;">📅 Today's Tasks (${todaysTasks.length})</h3>
        ${todaysTasks.length > 0 ? `
          <ul>
            ${todaysTasks.map(task => `
              <li style="margin: 8px 0;">
                <strong>${task.title}</strong>
                <span style="color: #6b7280; font-size: 14px;"> - Due ${format(task.dueDate, 'p')}</span>
              </li>
            `).join('')}
          </ul>
        ` : '<p style="color: #6b7280;">No tasks due today.</p>'}
        
        <h3 style="color: #1f2937;">📋 Tomorrow's Tasks (${tomorrowsTasks.length})</h3>
        ${tomorrowsTasks.length > 0 ? `
          <ul>
            ${tomorrowsTasks.map(task => `
              <li style="margin: 8px 0;">
                <strong>${task.title}</strong>
              </li>
            `).join('')}
          </ul>
        ` : '<p style="color: #6b7280;">No tasks due tomorrow.</p>'}
        
        <h3 style="color: #1f2937;">🎯 This Week's Performance</h3>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>New Leads:</strong> ${weeklyLeads}</p>
          <p style="margin: 5px 0;"><strong>Properties Listed:</strong> ${weeklyProperties}</p>
        </div>
        
        ${recentLeads.length > 0 ? `
          <h3 style="color: #1f2937;">🔥 Recent Leads</h3>
          <ul>
            ${recentLeads.map(lead => `
              <li style="margin: 8px 0;">
                <strong>${lead.firstName} ${lead.lastName}</strong>
                <span style="color: #6b7280; font-size: 14px;"> - ${lead.mobile}</span>
              </li>
            `).join('')}
          </ul>
        ` : ''}
        
        <a href="${process.env.CRM_URL}/crm/dashboard" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">
          Open CRM Dashboard
        </a>
        
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
          Have a great day!<br>
          Wayhome CRM Team
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@wayhome.com',
      to: recipient,
      subject: `Daily Digest - ${format(today, 'MMM do')}`,
      html,
    });
  }

  /**
   * Send welcome email template
   */
  private async sendWelcomeEmailTemplate(recipient: string, data: { name: string; isPublicUser: boolean }): Promise<void> {
    const { name, isPublicUser } = data;
    const dashboardUrl = isPublicUser ? `${process.env.WEB_URL}/dashboard` : `${process.env.CRM_URL}/crm/dashboard`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Wayhome!</h2>
        <p>Hello ${name},</p>
        <p>Welcome to the Wayhome platform! ${isPublicUser ? 'You can now list and promote your properties.' : 'Your CRM account has been created and you can start managing your real estate business.'}</p>
        
        <a href="${dashboardUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Get Started
        </a>
        
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          Wayhome Team
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@wayhome.com',
      to: recipient,
      subject: 'Welcome to Wayhome!',
      html,
    });
  }

  /**
   * Send verification email template
   */
  private async sendVerificationEmailTemplate(recipient: string, data: { name: string; token: string }): Promise<void> {
    const { name, token } = data;
    const verificationUrl = `${process.env.WEB_URL}/verify-email?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verify Your Email</h2>
        <p>Hello ${name},</p>
        <p>Please click the button below to verify your email address and activate your account.</p>
        
        <a href="${verificationUrl}" 
           style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Verify Email
        </a>
        
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          Wayhome Team
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@wayhome.com',
      to: recipient,
      subject: 'Verify Your Email Address',
      html,
    });
  }

  /**
   * Send password reset email template
   */
  private async sendPasswordResetEmailTemplate(recipient: string, data: { name: string; token: string }): Promise<void> {
    const { name, token } = data;
    const resetUrl = `${process.env.WEB_URL}/reset-password?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>Hello ${name},</p>
        <p>You requested to reset your password. Click the button below to create a new password.</p>
        
        <a href="${resetUrl}" 
           style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        
        <p>This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          Wayhome Team
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@wayhome.com',
      to: recipient,
      subject: 'Reset Your Password',
      html,
    });
  }

  /**
   * Schedule recurring jobs
   */
  private async scheduleRecurringJobs(): Promise<void> {
    // Schedule daily digest at 8:00 AM every day
    await this.emailQueue.add(
      'schedule_daily_digest',
      {
        type: 'daily_digest',
        recipient: 'system',
        data: {},
      },
      {
        repeat: {
          pattern: '0 8 * * *', // 8:00 AM every day
        },
        jobId: 'daily-digest-scheduler',
      }
    );

    // Schedule task reminder checks every 30 minutes
    await this.emailQueue.add(
      'check_task_reminders',
      {
        type: 'task_reminder',
        recipient: 'system',
        data: {},
      },
      {
        repeat: {
          pattern: '*/30 * * * *', // Every 30 minutes
        },
        jobId: 'task-reminder-scheduler',
      }
    );
  }

  /**
   * Check for tasks that need reminders
   */
  async checkTaskReminders(): Promise<void> {
    const reminderTime = addDays(new Date(), 1); // 24 hours from now
    
    const tasks = await this.prisma.task.findMany({
      where: {
        status: 'OPEN',
        reminder: true,
        reminderSentAt: null,
        dueDate: {
          lte: reminderTime,
        },
      },
      include: {
        assignedTo: true,
      },
    });

    for (const task of tasks) {
      await this.sendTaskReminder({
        taskId: task.id,
        agentId: task.assignedToId,
        agentEmail: task.assignedTo.email,
        agentName: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
        taskTitle: task.title,
        dueDate: task.dueDate,
      });

      // Mark reminder as sent
      await this.prisma.task.update({
        where: { id: task.id },
        data: { reminderSentAt: new Date() },
      });
    }
  }

  /**
   * Close connections gracefully
   */
  async close(): Promise<void> {
    await this.worker.close();
    await this.emailQueue.close();
    this.transporter.close();
  }
}
