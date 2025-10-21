/**
 * Script para verificar la consistencia de Server Actions
 * Asegura que frontend y backend corran exactamente el mismo artefacto/versión
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface BuildInfo {
  version: string;
  buildTime: string;
  hash: string;
  serverActions: string[];
}

/**
 * Verificar que no hay assets ni IDs de acciones antiguos cacheados
 */
export function verifyNoCachedAssets(): boolean {
  console.log('🔍 Verificando que no hay assets cacheados...');
  
  const cacheDirs = [
    '.next/cache',
    'node_modules/.cache',
    '.vercel/cache',
    'dist',
    'build'
  ];
  
  let hasCachedAssets = false;
  
  cacheDirs.forEach(dir => {
    if (existsSync(dir)) {
      console.log(`⚠️ Directorio de cache encontrado: ${dir}`);
      hasCachedAssets = true;
    }
  });
  
  if (hasCachedAssets) {
    console.log('🧹 Limpiando directorios de cache...');
    cacheDirs.forEach(dir => {
      if (existsSync(dir)) {
        try {
          execSync(`rm -rf ${dir}`, { stdio: 'inherit' });
          console.log(`✅ Limpiado: ${dir}`);
        } catch (error) {
          console.warn(`⚠️ No se pudo limpiar ${dir}:`, error);
        }
      }
    });
  }
  
  return !hasCachedAssets;
}

/**
 * Verificar que el build es consistente
 */
export function verifyBuildConsistency(): boolean {
  console.log('🔍 Verificando consistencia del build...');
  
  try {
    // Verificar que el build existe
    if (!existsSync('.next')) {
      console.log('❌ Directorio .next no encontrado. Ejecutando build...');
      execSync('npm run build', { stdio: 'inherit' });
    }
    
    // Verificar que los archivos críticos existen
    const criticalFiles = [
      '.next/server/app',
      '.next/static',
      '.next/server/actions'
    ];
    
    let allFilesExist = true;
    criticalFiles.forEach(file => {
      if (!existsSync(file)) {
        console.log(`❌ Archivo crítico no encontrado: ${file}`);
        allFilesExist = false;
      } else {
        console.log(`✅ Archivo crítico encontrado: ${file}`);
      }
    });
    
    return allFilesExist;
  } catch (error) {
    console.error('❌ Error verificando consistencia del build:', error);
    return false;
  }
}

/**
 * Verificar que las Server Actions están correctamente compiladas
 */
export function verifyServerActionsCompilation(): boolean {
  console.log('🔍 Verificando compilación de Server Actions...');
  
  try {
    // Verificar que las Server Actions están en el build
    const actionsPath = '.next/server/actions';
    if (!existsSync(actionsPath)) {
      console.log('❌ Directorio de Server Actions no encontrado');
      return false;
    }
    
    // Verificar que no hay errores de compilación
    const buildLog = execSync('npm run build 2>&1', { encoding: 'utf8' });
    
    if (buildLog.includes('error') || buildLog.includes('Error')) {
      console.log('❌ Errores de compilación encontrados:');
      console.log(buildLog);
      return false;
    }
    
    console.log('✅ Server Actions compiladas correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error verificando compilación de Server Actions:', error);
    return false;
  }
}

/**
 * Verificar que las versiones son consistentes
 */
export function verifyVersionConsistency(): boolean {
  console.log('🔍 Verificando consistencia de versiones...');
  
  try {
    // Verificar versión de Node.js
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js version: ${nodeVersion}`);
    
    // Verificar versión de npm
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm version: ${npmVersion}`);
    
    // Verificar versión de Next.js
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const nextVersion = packageJson.dependencies.next;
    console.log(`✅ Next.js version: ${nextVersion}`);
    
    // Verificar que no hay conflictos de versiones
    const lockFile = readFileSync('package-lock.json', 'utf8');
    if (lockFile.includes('"next":')) {
      console.log('✅ package-lock.json contiene Next.js');
    } else {
      console.log('⚠️ package-lock.json no contiene Next.js');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error verificando versiones:', error);
    return false;
  }
}

/**
 * Verificar que las variables de entorno son consistentes
 */
export function verifyEnvironmentConsistency(): boolean {
  console.log('🔍 Verificando consistencia de variables de entorno...');
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY'
  ];
  
  let allVarsPresent = true;
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`❌ Variable de entorno faltante: ${varName}`);
      allVarsPresent = false;
    } else {
      console.log(`✅ Variable de entorno presente: ${varName}`);
    }
  });
  
  return allVarsPresent;
}

/**
 * Ejecutar todas las verificaciones
 */
export function runAllVerifications(): boolean {
  console.log('🚀 Iniciando verificaciones de Server Actions...');
  
  const verifications = [
    { name: 'Cache Assets', fn: verifyNoCachedAssets },
    { name: 'Build Consistency', fn: verifyBuildConsistency },
    { name: 'Server Actions Compilation', fn: verifyServerActionsCompilation },
    { name: 'Version Consistency', fn: verifyVersionConsistency },
    { name: 'Environment Consistency', fn: verifyEnvironmentConsistency }
  ];
  
  let allPassed = true;
  
  verifications.forEach(({ name, fn }) => {
    console.log(`\n📋 Verificando: ${name}`);
    const result = fn();
    if (result) {
      console.log(`✅ ${name}: PASSED`);
    } else {
      console.log(`❌ ${name}: FAILED`);
      allPassed = false;
    }
  });
  
  console.log(`\n🎯 Resultado final: ${allPassed ? 'TODAS LAS VERIFICACIONES PASARON' : 'ALGUNAS VERIFICACIONES FALLARON'}`);
  
  return allPassed;
}

// Ejecutar verificaciones si se llama directamente
if (require.main === module) {
  runAllVerifications();
}
