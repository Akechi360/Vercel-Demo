/**
 * Script para probar la API de notificaciones
 */

const API_BASE = 'http://localhost:3000';
const USER_ID = 'cmguwxaj80000vo8g2j4gvuhq'; // ID del usuario admin creado

async function testNotificationsAPI() {
  console.log('🧪 Probando API de notificaciones...\n');

  try {
    // Test 1: Obtener notificaciones
    console.log('1️⃣ Probando GET /api/notifications');
    const response = await fetch(`${API_BASE}/api/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': USER_ID
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ GET /api/notifications exitoso');
      console.log(`   - Total notificaciones: ${data.totalCount}`);
      console.log(`   - No leídas: ${data.unreadCount}`);
      console.log(`   - Notificaciones: ${data.notifications.length}`);
      
      if (data.notifications.length > 0) {
        console.log('   - Primera notificación:', data.notifications[0].title);
      }
    } else {
      const error = await response.text();
      console.log('❌ GET /api/notifications falló:', response.status, error);
    }

    console.log('');

    // Test 2: Marcar una notificación como leída
    console.log('2️⃣ Probando PATCH /api/notifications/[id]/read');
    
    // Primero obtener las notificaciones para obtener un ID
    const notificationsResponse = await fetch(`${API_BASE}/api/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': USER_ID
      }
    });

    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      const unreadNotification = notificationsData.notifications.find((n: any) => !n.isRead);
      
      if (unreadNotification) {
        const markReadResponse = await fetch(`${API_BASE}/api/notifications/${unreadNotification.id}/read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': USER_ID
          }
        });

        if (markReadResponse.ok) {
          const updatedNotification = await markReadResponse.json();
          console.log('✅ PATCH /api/notifications/[id]/read exitoso');
          console.log(`   - Notificación marcada como leída: ${updatedNotification.data.title}`);
        } else {
          const error = await markReadResponse.text();
          console.log('❌ PATCH /api/notifications/[id]/read falló:', markReadResponse.status, error);
        }
      } else {
        console.log('⚠️ No hay notificaciones no leídas para marcar como leídas');
      }
    }

    console.log('');

    // Test 3: Marcar todas como leídas
    console.log('3️⃣ Probando PATCH /api/notifications/read-all');
    const markAllReadResponse = await fetch(`${API_BASE}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': USER_ID
      }
    });

    if (markAllReadResponse.ok) {
      const result = await markAllReadResponse.json();
      console.log('✅ PATCH /api/notifications/read-all exitoso');
      console.log(`   - Notificaciones actualizadas: ${result.updatedCount}`);
    } else {
      const error = await markAllReadResponse.text();
      console.log('❌ PATCH /api/notifications/read-all falló:', markAllReadResponse.status, error);
    }

    console.log('');

    // Test 4: Verificar estado final
    console.log('4️⃣ Verificando estado final');
    const finalResponse = await fetch(`${API_BASE}/api/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': USER_ID
      }
    });

    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      console.log('✅ Estado final verificado');
      console.log(`   - Total notificaciones: ${finalData.totalCount}`);
      console.log(`   - No leídas: ${finalData.unreadCount}`);
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar las pruebas
testNotificationsAPI();
