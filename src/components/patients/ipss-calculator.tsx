'use client';

import { useState, useMemo, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import type { IpssScore } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Calculator, Save } from 'lucide-react';

const ipssQuestions = [
  { id: 'incompleteEmptying', label: 'Sensación de vaciado incompleto' },
  { id: 'frequency', label: 'Frecuencia de micción (menos de 2 horas)' },
  { id: 'intermittency', label: 'Intermitencia (parar y empezar a orinar)' },
  { id: 'urgency', label: 'Urgencia (dificultad para posponer la micción)' },
  { id: 'weakStream', label: 'Chorro urinario débil' },
  { id: 'straining', label: 'Esfuerzo al orinar' },
  { id: 'nocturia', label: 'Nicturia (veces que se levanta en la noche)' },
];

const scoreOptions = [
  { value: 0, label: 'Nunca' },
  { value: 1, label: 'Menos de 1 de 5 veces' },
  { value: 2, label: 'Menos de la mitad' },
  { value: 3, label: 'La mitad de las veces' },
  { value: 4, label: 'Más de la mitad' },
  { value: 5, label: 'Casi siempre' },
];

interface IpssCalculatorProps {
  patientId: string;
  historicalScores: IpssScore[];
}

export function IpssCalculator({ patientId, historicalScores }: IpssCalculatorProps) {
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [showResult, setShowResult] = useState(false);
  const [localHistory, setLocalHistory] = useState(historicalScores);
  const { toast } = useToast();

  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((acc, score) => acc + (score || 0), 0);
  }, [scores]);

  const scoreCategory = useMemo(() => {
    if (totalScore <= 7) return { name: 'Leve', color: 'bg-green-500', className: 'text-green-500' };
    if (totalScore <= 19) return { name: 'Moderado', color: 'bg-yellow-500', className: 'text-yellow-500' };
    return { name: 'Severo', color: 'bg-red-500', className: 'text-red-500' };
  }, [totalScore]);

  const handleScoreChange = (questionId: string, value: string) => {
    setShowResult(false);
    setScores(prev => ({ ...prev, [questionId]: parseInt(value, 10) }));
  };

  const isComplete = Object.keys(scores).length === ipssQuestions.length;

  const handleCalculate = () => {
    if (isComplete) {
      setShowResult(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Formulario Incompleto',
        description: 'Por favor, responde todas las preguntas para calcular el puntaje.',
      });
    }
  };

  const handleSave = () => {
    const newScore: IpssScore = {
        id: `ipss-${Date.now()}`,
        patientId,
        date: new Date().toISOString(),
        score: totalScore,
        category: scoreCategory.name as 'Leve' | 'Moderado' | 'Severo',
    };

    setLocalHistory(prev => [newScore, ...prev]);
    toast({
        title: 'Puntaje IPSS Guardado',
        description: `Se guardó un puntaje de ${totalScore} (${scoreCategory.name}) para este paciente.`,
    });
    // Reset form
    setScores({});
    setShowResult(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all bg-card/50 lg:col-span-3">
        <CardHeader>
          <CardTitle>Calculadora IPSS</CardTitle>
          <CardDescription>Cuestionario Internacional de Síntomas Prostáticos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {ipssQuestions.map((q, index) => (
            <div key={q.id} className="space-y-3">
              <Label className="font-semibold">{index + 1}. {q.label}</Label>
              <RadioGroup
                onValueChange={(value) => handleScoreChange(q.id, value)}
                className="flex flex-wrap gap-x-6 gap-y-2"
                value={scores[q.id]?.toString()}
              >
                {scoreOptions.map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value.toString()} id={`${q.id}-${opt.value}`} />
                    <Label htmlFor={`${q.id}-${opt.value}`}>{opt.label} ({opt.value})</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
            <Button onClick={handleCalculate} disabled={!isComplete}>
                <Calculator className="mr-2 h-4 w-4" />
                Calcular Puntaje
            </Button>
            <AnimatePresence>
            {showResult && isComplete && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full p-4 border rounded-lg bg-muted/50 space-y-3"
                >
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-2xl">{totalScore}</h3>
                        <span className={cn("font-semibold text-lg", scoreCategory.className)}>{scoreCategory.name}</span>
                    </div>
                    <Progress value={(totalScore / 35) * 100} indicatorClassName={scoreCategory.color} />
                    <div className="flex justify-end">
                        <Button onClick={handleSave} size="sm">
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Resultado
                        </Button>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </CardFooter>
      </Card>

      <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all bg-card/50 lg:col-span-2">
        <CardHeader>
            <CardTitle>Historial de IPSS</CardTitle>
            <CardDescription>Puntajes registrados anteriormente para este paciente.</CardDescription>
        </CardHeader>
        <CardContent>
            {localHistory.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Puntaje</TableHead>
                            <TableHead>Categoría</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {localHistory.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{format(new Date(item.date), 'dd/MM/yy')}</TableCell>
                                <TableCell className="font-bold">{item.score}</TableCell>
                                <TableCell>
                                    <span className={cn(
                                        'font-semibold',
                                        item.category === 'Leve' && 'text-green-500',
                                        item.category === 'Moderado' && 'text-yellow-500',
                                        item.category === 'Severo' && 'text-red-500',
                                    )}>
                                        {item.category}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="text-center text-muted-foreground py-8">No hay puntajes registrados.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

// Add to ui/progress.tsx if not already there
// export interface ProgressProps
//   extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
//   indicatorClassName?: string;
// }
// const Progress = React.forwardRef<
//   React.ElementRef<typeof ProgressPrimitive.Root>,
//   ProgressProps
// >(({ className, value, indicatorClassName, ...props }, ref) => (
// ...
//     <ProgressPrimitive.Indicator
//       className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
// ...
// ))
