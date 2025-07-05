const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Count users
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true
      }
    });
    
    console.log('👥 Users:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
