import { PrismaClient, Currency } from '@wayhome/database';

const prisma = new PrismaClient();

/**
 * Migration script to convert all properties to EUR currency
 * This ensures consistent pricing in the database
 */
async function migrateCurrency() {
  console.log('🔄 Starting currency migration...');

  try {
    // Find all properties that are currently in ALL currency
    const allProperties = await prisma.property.findMany({
      where: {
        currency: Currency.ALL
      },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true
      }
    });

    console.log(`Found ${allProperties.length} properties in ALL currency to migrate`);

    if (allProperties.length === 0) {
      console.log('✅ No properties need migration - all are already in EUR');
      return;
    }

    // Convert ALL prices to EUR (divide by 97.3, real exchange rate: 1 EUR = 97.3 ALL)
    const migrations = allProperties.map(property => {
      const eurPrice = Math.round((property.price / 97.3) * 100) / 100; // Convert ALL to EUR and round to 2 decimals
      
      console.log(`  ${property.title}: ${property.price} ALL → €${eurPrice}`);
      
      return prisma.property.update({
        where: { id: property.id },
        data: {
          price: eurPrice,
          currency: Currency.EUR
        }
      });
    });

    // Execute all migrations
    await Promise.all(migrations);

    console.log(`✅ Successfully migrated ${allProperties.length} properties to EUR`);

    // Verify migration
    const remainingAllProperties = await prisma.property.count({
      where: {
        currency: Currency.ALL
      }
    });

    if (remainingAllProperties === 0) {
      console.log('✅ Migration verification passed - all properties are now in EUR');
    } else {
      console.error(`❌ Migration verification failed - ${remainingAllProperties} properties still in ALL currency`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Also migrate user listings to EUR
async function migrateUserListings() {
  console.log('🔄 Migrating user listings to EUR...');

  try {
    const allListings = await prisma.userListing.findMany({
      where: {
        currency: Currency.ALL
      },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true
      }
    });

    console.log(`Found ${allListings.length} user listings in ALL currency to migrate`);

    if (allListings.length === 0) {
      console.log('✅ No user listings need migration - all are already in EUR');
      return;
    }

    const migrations = allListings.map(listing => {
      const eurPrice = Math.round((listing.price / 97.3) * 100) / 100;
      
      console.log(`  ${listing.title}: ${listing.price} ALL → €${eurPrice}`);
      
      return prisma.userListing.update({
        where: { id: listing.id },
        data: {
          price: eurPrice,
          currency: Currency.EUR
        }
      });
    });

    await Promise.all(migrations);
    console.log(`✅ Successfully migrated ${allListings.length} user listings to EUR`);

  } catch (error) {
    console.error('❌ User listings migration failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await migrateCurrency();
    await migrateUserListings();
    
    console.log('\n🎉 Currency migration completed successfully!');
    console.log('📋 Summary:');
    console.log('  ✅ All properties are now stored in EUR');
    console.log('  ✅ All user listings are now stored in EUR');
    console.log('  ✅ Frontend will handle currency conversion to ALL when needed');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
