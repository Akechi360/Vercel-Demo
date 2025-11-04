// Loads environment variables from .env
try { require('dotenv').config(); } catch (e) {}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const distinct = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT role FROM users WHERE LOWER(role) LIKE '%patient%';`
    );
    const countsRaw = await prisma.$queryRawUnsafe(
      `SELECT role, COUNT(*) as count FROM users WHERE LOWER(role) LIKE '%patient%' GROUP BY role;`
    );
    const counts = countsRaw.map(r => ({ role: r.role, count: Number(r.count) }));

    console.log('DISTINCT_ROLES_WITH_PATIENT:', JSON.stringify(distinct));
    console.log('COUNTS_BY_ROLE_WITH_PATIENT:', JSON.stringify(counts));
  } catch (err) {
    console.error('QUERY_ERROR:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();