-- Script seguro para actualizar solo el rol del usuario existente
-- NO toca la contraseña ni otros datos

UPDATE "User" 
SET role = 'ADMIN',
    status = 'ACTIVE'
WHERE email = 'dev-master-mguwx79b@urovital.com';

-- Verificar el cambio
SELECT id, email, name, role, status, "createdAt" 
FROM "User" 
WHERE email = 'dev-master-mguwx79b@urovital.com';

