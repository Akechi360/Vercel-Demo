'use client';

import { useState, useEffect } from 'react';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  confirmPassword?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  className?: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'Al menos 8 caracteres', test: (pwd) => pwd.length >= 8 },
  { label: 'Una letra mayúscula', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'Una letra minúscula', test: (pwd) => /[a-z]/.test(pwd) },
  { label: 'Un número', test: (pwd) => /\d/.test(pwd) },
  { label: 'Un carácter especial', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
];

export function PasswordStrength({
  password,
  confirmPassword,
  showPassword,
  onTogglePassword,
  className
}: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState('');
  const [strengthColor, setStrengthColor] = useState('');

  useEffect(() => {
    const validRequirements = requirements.filter(req => req.test(password));
    const strengthPercentage = (validRequirements.length / requirements.length) * 100;

    setStrength(strengthPercentage);

    if (strengthPercentage < 40) {
      setStrengthLabel('Débil');
      setStrengthColor('bg-red-500');
    } else if (strengthPercentage < 80) {
      setStrengthLabel('Media');
      setStrengthColor('bg-yellow-500');
    } else {
      setStrengthLabel('Fuerte');
      setStrengthColor('bg-green-500');
    }
  }, [password]);

  const passwordsMatch = confirmPassword ? password === confirmPassword : true;
  const isPasswordValid = password.length > 0 && strength >= 80;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Password Strength Bar */}
      {password && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Fortaleza de contraseña
            </span>
            <Badge
              variant={strength >= 80 ? 'success' : strength >= 40 ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {strengthLabel}
            </Badge>
          </div>
          <Progress
            value={strength}
            className="h-2"
            indicatorClassName={strengthColor}
          />
        </div>
      )}

      {/* Password Requirements */}
      {password && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Requisitos de contraseña:
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {requirements.map((req, index) => {
              const isValid = req.test(password);
              return (
                <div key={index} className="flex items-center space-x-2">
                  <div className={cn(
                    'flex h-3 w-3 items-center justify-center rounded-full transition-colors',
                    isValid
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {isValid ? (
                      <Check className="h-2 w-2" />
                    ) : (
                      <X className="h-2 w-2" />
                    )}
                  </div>
                  <span className={cn(
                    'text-xs transition-colors',
                    isValid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                  )}>
                    {req.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Password Match Indicator */}
      {confirmPassword !== undefined && (
        <div className="flex items-center space-x-2">
          <div className={cn(
            'flex h-4 w-4 items-center justify-center rounded-full transition-colors',
            passwordsMatch && confirmPassword.length > 0
              ? 'bg-green-500 text-white'
              : confirmPassword.length > 0
                ? 'bg-red-500 text-white'
                : 'bg-muted text-muted-foreground'
          )}>
            {passwordsMatch && confirmPassword.length > 0 ? (
              <Check className="h-3 w-3" />
            ) : confirmPassword.length > 0 ? (
              <X className="h-3 w-3" />
            ) : null}
          </div>
          <span className={cn(
            'text-sm transition-colors',
            passwordsMatch && confirmPassword.length > 0
              ? 'text-green-600 dark:text-green-400'
              : confirmPassword.length > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-muted-foreground'
          )}>
            {passwordsMatch && confirmPassword.length > 0
              ? 'Las contraseñas coinciden'
              : confirmPassword.length > 0
                ? 'Las contraseñas no coinciden'
                : 'Confirma tu contraseña'
            }
          </span>
        </div>
      )}
    </div>
  );
}
