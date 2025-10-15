/**
 * Tests Manuales para Server Actions Críticas
 * Verifica que todas las Server Actions funcionen correctamente después de cada build/deploy
 */

const { 
  addAppointment, 
  addConsultation, 
  addAffiliation, 
  addPatient,
  updatePatient,
  deletePatient,
  createCompany,
  createReceipt
} = require('../actions');
const { UserRole } = require('../types');

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
  timestamp: string;
}

interface ManualTestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
}

/**
 * Test Manual para Agendar Cita (Rol Secretaria)
 */
export async function testAddAppointment(): Promise<TestResult> {
  const startTime = Date.now();
  const testName = 'Agendar Cita (Rol Secretaria)';
  
  try {
    console.log('🧪 Ejecutando test: Agendar Cita');
    
    // Datos de prueba
    const appointmentData = {
      userId: 'U184171', // Usuario existente
      doctorId: 'U789012', // Doctor existente
      date: '2024-01-20',
      reason: 'Consulta de prueba',
      time: '10:00'
    };
    
    const userContext = {
      userId: 'U123456',
      name: 'Secretaria Test',
      email: 'secretaria@test.com',
      role: UserRole.SECRETARIA,
      currentTime: new Date(),
      timezone: 'America/Caracas'
    };
    
    // Ejecutar Server Action
    const result = await addAppointment(appointmentData, userContext);
    
    // Verificaciones
    if (!result) {
      throw new Error('addAppointment retornó null');
    }
    
    if (!result.id) {
      throw new Error('addAppointment no retornó ID');
    }
    
    if (result.patientUserId !== appointmentData.userId) {
      throw new Error('patientUserId no coincide');
    }
    
    console.log('✅ Test Agendar Cita: PASSED');
    
    return {
      testName,
      passed: true,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Test Agendar Cita: FAILED', error);
    
    return {
      testName,
      passed: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test Manual para Crear Consulta con Archivo JPG
 */
export async function testAddConsultation(): Promise<TestResult> {
  const startTime = Date.now();
  const testName = 'Crear Consulta con Archivo JPG';
  
  try {
    console.log('🧪 Ejecutando test: Crear Consulta');
    
    // Datos de prueba
    const consultationData = {
      userId: 'U184171', // Usuario existente
      date: '2024-01-20',
      doctor: 'Dr. Test',
      type: 'Inicial' as const,
      notes: 'Consulta de prueba con archivo JPG',
      prescriptions: [],
      reports: [{
        id: 'test-report-1',
        title: 'Reporte de Prueba',
        date: '2024-01-20',
        file: new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      }],
      labResults: []
    };
    
    const userContext = {
      userId: 'U123456',
      name: 'Doctor Test',
      email: 'doctor@test.com',
      role: UserRole.DOCTOR,
      currentTime: new Date(),
      timezone: 'America/Caracas'
    };
    
    // Ejecutar Server Action
    const result = await addConsultation(consultationData, userContext);
    
    // Verificaciones
    if (!result) {
      throw new Error('addConsultation retornó null');
    }
    
    if (!result.id) {
      throw new Error('addConsultation no retornó ID');
    }
    
    if (result.userId !== consultationData.userId) {
      throw new Error('userId no coincide');
    }
    
    console.log('✅ Test Crear Consulta: PASSED');
    
    return {
      testName,
      passed: true,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Test Crear Consulta: FAILED', error);
    
    return {
      testName,
      passed: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test Manual para Crear Afiliación
 */
export async function testAddAffiliation(): Promise<TestResult> {
  const startTime = Date.now();
  const testName = 'Crear Afiliación';
  
  try {
    console.log('🧪 Ejecutando test: Crear Afiliación');
    
    // Datos de prueba
    const affiliationData = {
      userId: 'U184171', // Usuario existente
      companyId: 'cmgqjjd8s0000l5043milu8ig', // Empresa existente
      planId: 'test-plan-2024',
      estado: 'ACTIVA' as const,
      fechaInicio: new Date().toISOString(),
      fechaFin: null,
      monto: 0,
      beneficiarios: null,
      tipoPago: null
    };
    
    const userContext = {
      userId: 'U123456',
      name: 'Admin Test',
      email: 'admin@test.com',
      role: UserRole.ADMIN,
      currentTime: new Date(),
      timezone: 'America/Caracas'
    };
    
    // Ejecutar Server Action
    const result = await addAffiliation(affiliationData, userContext);
    
    // Verificaciones
    if (!result) {
      throw new Error('addAffiliation retornó null');
    }
    
    if (!result.id) {
      throw new Error('addAffiliation no retornó ID');
    }
    
    if (result.userId !== affiliationData.userId) {
      throw new Error('userId no coincide');
    }
    
    console.log('✅ Test Crear Afiliación: PASSED');
    
    return {
      testName,
      passed: true,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Test Crear Afiliación: FAILED', error);
    
    return {
      testName,
      passed: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test Manual para Crear Paciente
 */
export async function testAddPatient(): Promise<TestResult> {
  const startTime = Date.now();
  const testName = 'Crear Paciente';
  
  try {
    console.log('🧪 Ejecutando test: Crear Paciente');
    
    // Datos de prueba
    const patientData = {
      name: 'Paciente Test',
      contact: {
        email: 'paciente.test@example.com',
        phone: '04121234567'
      },
      personalInfo: {
        cedula: 'V-12345678',
        fechaNacimiento: '1990-01-01',
        gender: 'Masculino' as const,
        bloodType: 'O+' as const
      },
      companyId: 'cmgqjjd8s0000l5043milu8ig' // Empresa existente
    };
    
    const userContext = {
      userId: 'U123456',
      name: 'Admin Test',
      email: 'admin@test.com',
      role: UserRole.ADMIN,
      currentTime: new Date(),
      timezone: 'America/Caracas'
    };
    
    // Ejecutar Server Action
    const result = await addPatient(patientData, userContext);
    
    // Verificaciones
    if (!result) {
      throw new Error('addPatient retornó null');
    }
    
    if (!result.id) {
      throw new Error('addPatient no retornó ID');
    }
    
    if (result.name !== patientData.name) {
      throw new Error('name no coincide');
    }
    
    console.log('✅ Test Crear Paciente: PASSED');
    
    return {
      testName,
      passed: true,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Test Crear Paciente: FAILED', error);
    
    return {
      testName,
      passed: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Ejecutar Suite Completa de Tests Manuales
 */
export async function runManualTestSuite(): Promise<ManualTestSuite> {
  const startTime = Date.now();
  const suiteName = 'Server Actions Manual Test Suite';
  
  console.log('🚀 Iniciando Suite de Tests Manuales para Server Actions');
  console.log('=' .repeat(60));
  
  const tests = [
    testAddAppointment,
    testAddConsultation,
    testAddAffiliation,
    testAddPatient
  ];
  
  const results: TestResult[] = [];
  
  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
    } catch (error) {
      results.push({
        testName: test.name,
        passed: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        duration: 0,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.filter(r => !r.passed).length;
  const totalTests = results.length;
  
  const suite: ManualTestSuite = {
    suiteName,
    results,
    totalTests,
    passedTests,
    failedTests,
    duration: Date.now() - startTime
  };
  
  // Mostrar resultados
  console.log('\n📊 RESULTADOS DE LA SUITE DE TESTS:');
  console.log('=' .repeat(60));
  console.log(`Suite: ${suite.suiteName}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Duration: ${suite.duration}ms`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  
  console.log('\n📋 DETALLES POR TEST:');
  console.log('=' .repeat(60));
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const duration = `${result.duration}ms`;
    const error = result.error ? ` - Error: ${result.error}` : '';
    
    console.log(`${status} ${result.testName} (${duration})${error}`);
  });
  
  if (failedTests > 0) {
    console.log('\n🚨 TESTS FALLIDOS:');
    console.log('=' .repeat(60));
    
    results
      .filter(r => !r.passed)
      .forEach(result => {
        console.log(`❌ ${result.testName}: ${result.error}`);
      });
  }
  
  console.log('\n🎯 CONCLUSIÓN:');
  console.log('=' .repeat(60));
  
  if (passedTests === totalTests) {
    console.log('🎉 TODOS LOS TESTS PASARON - Server Actions funcionando correctamente');
  } else {
    console.log('⚠️ ALGUNOS TESTS FALLARON - Revisar configuración de Server Actions');
  }
  
  return suite;
}

/**
 * Test de Verificación Rápida
 */
export async function quickServerActionsTest(): Promise<boolean> {
  console.log('🔍 Verificación Rápida de Server Actions');
  
  try {
    // Test más simple: crear paciente
    const result = await testAddPatient();
    
    if (result.passed) {
      console.log('✅ Server Actions funcionando correctamente');
      return true;
    } else {
      console.log('❌ Server Actions con problemas:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error en verificación rápida:', error);
    return false;
  }
}

// Exportar para uso manual
export {
  TestResult,
  ManualTestSuite
};
