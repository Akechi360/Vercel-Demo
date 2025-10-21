#!/usr/bin/env node

/**
 * Script para configurar variables de entorno para desarrollo
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando variables de entorno para desarrollo...');

// Variables de entorno para desarrollo
const envContent = `# Database
DATABASE_URL="postgresql://postgres:JuGAokFoDmLZoiJoGKyEvFtFtNOLpdFU@trolley.proxy.rlwy.net:13611/railway"

# Next.js Server Actions Encryption Key
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="dGVzdC1lbmNyeXB0aW9uLWtleS1mb3ItZGV2ZWxvcG1lbnQtb25seQ=="

# Next.js Configuration
NEXTAUTH_SECRET="test-secret-for-development"
NEXTAUTH_URL="http://localhost:3000"

# Production URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`;

// Escribir archivo .env.local
const envPath = path.join(process.cwd(), '.env.local');
fs.writeFileSync(envPath, envContent);

console.log('✅ Archivo .env.local creado');
console.log('✅ Variables de entorno configuradas para desarrollo');
console.log('');
console.log('⚠️ IMPORTANTE: Para producción, configura estas variables en Vercel:');
console.log('   - NEXT_SERVER_ACTIONS_ENCRYPTION_KEY (generar con: openssl rand -base64 32)');
console.log('   - DATABASE_URL (tu URL de base de datos de producción)');
console.log('   - NEXTAUTH_SECRET (secreto seguro para producción)');
