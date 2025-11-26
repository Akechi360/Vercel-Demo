'use server'

export async function sendAffiliationNotification(data: { nombre: string; cedula: string }) {
    const topic = 'urovital_afiliaciones'; // Cambia esto por tu tópico secreto de NTFY
    const message = `Nueva afiliacion completada:\nNombre: ${data.nombre}\nCedula: ${data.cedula}`;

    try {
        await fetch(`https://ntfy.sh/${topic}`, {
            method: 'POST',
            body: message,
            headers: {
                'Title': 'Nueva Afiliacion UroVital',
                'Priority': 'high',
                'Tags': 'tada,memo', // Emojis de notificación
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Error enviando notificación NTFY:', error);
        return { success: false };
    }
}
