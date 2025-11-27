# Guía de Uso del Sistema UroVital

Esta guía detalla cómo operar la plataforma UroVital, desde el acceso inicial hasta la gestión avanzada de pacientes y módulos administrativos.

## 1. Acceso y Registro

### Iniciar Sesión
1.  Dirígete a la página de inicio (`/landing`) y haz clic en "Acceder a la Plataforma" o ve directamente a `/login`.
2.  Ingresa tu correo electrónico y contraseña.
3.  Haz clic en "Iniciar Sesión".
    *   Si olvidaste tu contraseña, usa la opción "¿Olvidaste tu contraseña?" para restablecerla vía correo.

### Registro y Afiliación
Para nuevos usuarios (pacientes):
1.  Ve a la sección de **Afiliación** (`/afiliacion`).
2.  Selecciona un plan (ej. "Tarjeta Saludable" o "Fondo Espíritu Santo").
3.  Completa el formulario con tus datos personales, de contacto y médicos básicos.
4.  Realiza el pago correspondiente (si aplica).
5.  Una vez completado, recibirás tus credenciales de acceso.

## 2. Roles y Permisos

El sistema cuenta con diferentes niveles de acceso según el rol del usuario:

*   **ADMIN**: Acceso total al sistema. Puede gestionar usuarios, configuraciones globales, auditoría y ver todos los reportes.
*   **DOCTOR**:
    *   Gestión de sus pacientes asignados.
    *   Creación y edición de historias clínicas y reportes de consulta.
    *   Gestión de su agenda de citas.
    *   Visualización de resultados de laboratorio de sus pacientes.
*   **SECRETARIA**:
    *   Gestión de agenda (crear/cancelar citas).
    *   Registro básico de pacientes.
    *   Recepción de pagos y facturación básica.
*   **PROMOTORA**:
    *   Gestión de afiliaciones y seguimiento de prospectos.
*   **USER (Paciente)**:
    *   Ver su propio perfil e historial médico.
    *   Agendar citas.
    *   Ver sus resultados de laboratorio y recetas.
    *   Gestionar su afiliación y pagos.

## 3. Módulos y Funcionalidades

### Dashboard (Panel Principal)
Al ingresar, verás un resumen relevante según tu rol:
*   **Doctores**: Citas del día, pacientes recientes, alertas.
*   **Pacientes**: Próxima cita, estado de afiliación, accesos rápidos.

### Gestión de Pacientes (`/patients`)
*   **Cargar Paciente**:
    1.  Navega a "Pacientes" > "Nuevo Paciente".
    2.  Ingresa la cédula para verificar si ya existe.
    3.  Completa los datos demográficos (Nombre, Fecha Nacimiento, Género, etc.).
    4.  Guarda el registro.
*   **Expediente Médico**:
    *   Haz clic en un paciente para ver su perfil completo.
    *   Pestañas disponibles: Información General, Consultas, Recetas, Estudios, Pagos.

### Citas Médicas (`/appointments`)
*   **Agendar Cita**:
    1.  Selecciona "Nueva Cita".
    2.  Elige el paciente y el doctor.
    3.  Selecciona fecha y hora disponible.
    4.  Define el tipo de cita (Consulta, Control, etc.).
*   **Gestionar Cita**:
    *   Desde el calendario, haz clic en una cita para ver detalles, reprogramar o cancelar.
    *   Los doctores pueden iniciar la consulta directamente desde aquí.

### Consultas Médicas
Durante una consulta, el doctor puede:
1.  Registrar motivo, síntomas y diagnóstico.
2.  Generar recetas médicas (se guardan en el historial).
3.  Solicitar estudios de laboratorio.
4.  Finalizar la consulta para generar el reporte automático.

### Finanzas (`/finanzas`)
*   **Pagos**: Registro de pagos de consultas o afiliaciones.
*   **Facturas**: Generación de recibos para pacientes.
*   **Reportes**: Visualización de ingresos por periodo (solo Admin/Finanzas).

### Configuración (`/settings`)
*   **Perfil**: Actualiza tu foto, contraseña y datos de contacto.
*   **Notificaciones**: Configura tus preferencias de alertas (Email, SMS).
*   **Gestión de Usuarios** (Solo Admin): Desde aquí se gestiona la activación de nuevos usuarios registrados y la asignación de roles (Doctor, Secretaria, etc.).

## Soporte
Si encuentras problemas técnicos, contacta al administrador del sistema o usa el módulo de soporte en el dashboard.
