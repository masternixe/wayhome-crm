import { PrismaClient, UserRole, UserStatus } from '@wayhome/database';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Creating super admin only...');
  
  // Create password hash
  const passwordHash = await bcrypt.hash('password123', 12);

  // Create Super Admin only
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

  console.log('✅ Super Admin created:', superAdmin.email);
  console.log('📧 Email: admin@wayhome.com');
  console.log('🔑 Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
