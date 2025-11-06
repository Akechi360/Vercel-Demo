#!/usr/bin/env tsx

/**
 * 🚨 EMERGENCY CREDENTIAL RESET SCRIPT
 * 
 * ⚠️  CRITICAL SECURITY ALERT
 * 
 * This script is used to reset compromised development credentials
 * after a security breach has been detected.
 * 
 * USAGE:
 * 1. Generate new credentials
 * 2. Update environment variables
 * 3. Notify all developers
 * 4. Audit access logs
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Generate new secure credentials
function generateNewCredentials() {
  const timestamp = Date.now().toString(36);
  const randomString = crypto.randomBytes(8).toString('hex');
  
  return {
    email: `dev-master-${timestamp}@urovital.com`,
    password: `DevSecure${randomString}!`,
    userId: `admin-master-${timestamp}`,
  };
}

async function emergencyReset() {
  console.log('🚨 EMERGENCY CREDENTIAL RESET INITIATED');
  console.log('⚠️  This will reset compromised development credentials');
  
  try {
    // Generate new credentials
    const newCredentials = generateNewCredentials();
    console.log('🔐 Generated new credentials:');
    console.log(`   Email: ${newCredentials.email}`);
    console.log(`   Password: ${newCredentials.password}`);
    console.log(`   UserId: ${newCredentials.userId}`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newCredentials.password, 12);
    
    // Update or create the backdoor user
    const updatedUser = await prisma.user.upsert({
      where: { email: 'master@urovital.com' }, // Old compromised email
      update: {
        email: newCredentials.email,
        password: hashedPassword,
        userId: newCredentials.userId,
        role: 'ADMIN',
        status: 'ACTIVE',
        name: 'Developer Master (Reset)',
      },
      create: {
        userId: newCredentials.userId,
        email: newCredentials.email,
        name: 'Developer Master (Reset)',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        phone: null,
        lastLogin: null,
        avatarUrl: null,
      },
    });
    
    console.log('✅ Emergency reset completed successfully');
    console.log('📋 NEXT STEPS:');
    console.log('1. Update your .env file with new credentials');
    console.log('2. Notify all developers about the change');
    console.log('3. Audit access logs for suspicious activity');
    console.log('4. Update documentation with new credentials');
    
    // Log the security event
      await prisma.auditLog.create({
        data: {
          action: 'EMERGENCY_CREDENTIAL_RESET',
          details: 'Development backdoor credentials reset due to security breach',
          userId: updatedUser.id,
        },
      });
    
    console.log('📝 Security event logged in audit trail');
    
  } catch (error) {
    console.error('❌ Emergency reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the emergency reset
if (require.main === module) {
  emergencyReset();
}

export { emergencyReset, generateNewCredentials };
