#!/usr/bin/env ts-node

/**
 * Script ejecutable para tests manuales de Server Actions
 * Uso: npx ts-node scripts/run-manual-tests.ts
 */

const { runManualTestSuite, quickServerActionsTest } = require('../src/lib/__tests__/server-actions-manual.test');

async function main() {
  const args = process.argv.slice(2);
  const isQuickTest = args.includes('--quick') || args.includes('-q');
  
  console.log('🚀 Iniciando Tests Manuales de Server Actions');
  console.log('=' .repeat(60));
  
  if (isQuickTest) {
    console.log('🔍 Ejecutando verificación rápida...');
    const result = await quickServerActionsTest();
    
    if (result) {
      console.log('✅ Verificación rápida: PASSED');
      process.exit(0);
    } else {
      console.log('❌ Verificación rápida: FAILED');
      process.exit(1);
    }
  } else {
    console.log('🧪 Ejecutando suite completa de tests...');
    const suite = await runManualTestSuite();
    
    if (suite.failedTests === 0) {
      console.log('🎉 Todos los tests pasaron exitosamente');
      process.exit(0);
    } else {
      console.log('⚠️ Algunos tests fallaron');
      process.exit(1);
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error ejecutando tests manuales:', error);
    process.exit(1);
  });
}
