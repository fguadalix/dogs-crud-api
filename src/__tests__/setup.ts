import prisma from '../infrastructure/database/prisma';

// Skip database setup only for pure unit tests (middleware, utils, etc.)
const testPath = expect.getState().testPath || '';
const isPureUnitTest = testPath.includes('/unit/middleware/');

if (!isPureUnitTest) {
  beforeAll(async () => {
    // Ensure test database is clean
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.orderItem.deleteMany();
    await prisma.item.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    // Wait a bit to avoid rate limit interference between tests
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Disconnect from database
    await prisma.$disconnect();
  });
}
