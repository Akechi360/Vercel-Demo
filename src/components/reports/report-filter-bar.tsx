'use client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportFilterBarProps {
  search: string;
  type: string; // 'Todos' | ...
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
}

const TYPES = [
  'Todos',
  'Ecografía',
  'Tomografía',
  'Radiografía',
  'Resonancia',
  'Laboratorio',
  'Otro'
];

export function ReportFilterBar({ search, type, onSearchChange, onTypeChange }: ReportFilterBarProps) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="sm:col-span-2">
        <Input
          placeholder="Buscar por título o notas..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div>
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default ReportFilterBar;


