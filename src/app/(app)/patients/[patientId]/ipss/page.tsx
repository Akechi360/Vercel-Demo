'use client';

import { IpssCalculator } from '@/components/patients/ipss-calculator';
import { saveIpssScore, getIpssScoresByUserId } from '@/lib/actions';
import { useAuth } from '@/components/layout/auth-provider';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, use } from 'react';
import type { IpssScore } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calculator } from 'lucide-react';

interface PageProps {
  params: Promise<{
    patientId: string;
  }>;
}

export default function IpssPage({ params }: PageProps) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [historicalScores, setHistoricalScores] = useState<IpssScore[]>([]);
  const [loading, setLoading] = useState(true);
  const { patientId } = use(params);

  useEffect(() => {
    const loadHistoricalScores = async () => {
      try {
        const scores = await getIpssScoresByUserId(patientId);
        setHistoricalScores(scores);
      } catch (error) {
        console.error('Error loading historical scores:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los puntajes históricos',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalScores();
  }, [patientId, toast]);

  const handleComplete = async (answers: Record<string, number>, totalScore: number, category: string) => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'Debes estar autenticado para guardar el puntaje',
        variant: 'destructive'
      });
      return;
    }

    try {
      await saveIpssScore({
        userId: patientId,
        puntaje: totalScore,
        categoria: category,
        respuestas: answers,
        createdBy: currentUser.userId
      });

      toast({
        title: 'Puntaje IPSS guardado',
        description: `Puntaje: ${totalScore} - Categoría: ${category}`,
      });

      // Redirect to patient summary
      router.push(`/patients/${patientId}/summary`);
    } catch (error) {
      console.error('Error saving IPSS score:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el puntaje IPSS',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Cargando puntajes históricos...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/patients/${patientId}/summary`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Resumen
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            Test IPSS
          </h1>
          <p className="text-muted-foreground">
            Cuestionario Internacional de Síntomas Prostáticos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo Test IPSS</CardTitle>
          <CardDescription>
            Complete las 7 preguntas para evaluar los síntomas prostáticos del paciente.
            Cada pregunta se puntúa de 0 a 5 puntos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IpssCalculator
            userId={patientId}
            historicalScores={historicalScores}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
