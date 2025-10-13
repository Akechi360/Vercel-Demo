'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SpecialtyCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color?: string;
}

interface SpecialtyCarouselProps {
  cards: SpecialtyCard[];
}

export function SpecialtyCarousel({ cards }: SpecialtyCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className="relative">
      {/* Desktop Grid */}
      <div className="hidden lg:grid grid-cols-2 xl:grid-cols-4 gap-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <Card className="h-full text-center p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-urovital-blue-light/5 dark:from-card dark:to-urovital-blue/5 group-hover:scale-105">
                <div className={cn(
                  "inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6",
                  card.color || "bg-urovital-blue/10 text-urovital-blue",
                  "group-hover:scale-110 transition-transform duration-300"
                )}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl mb-4">{card.title}</h3>
                <p className="text-muted-foreground">{card.description}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile/Tablet Carousel */}
      <div className="lg:hidden">
        <div className="relative overflow-hidden rounded-2xl">
          <motion.div
            className="flex"
            animate={{ x: `-${currentIndex * 100}%` }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <Card className="h-full text-center p-6 border-0 bg-gradient-to-br from-white to-urovital-blue-light/5 dark:from-card dark:to-urovital-blue/5">
                    <div className={cn(
                      "inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6",
                      card.color || "bg-urovital-blue/10 text-urovital-blue"
                    )}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-xl mb-4">{card.title}</h3>
                    <p className="text-muted-foreground">{card.description}</p>
                  </Card>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            disabled={isAnimating}
            className="border-urovital-blue text-urovital-blue hover:bg-urovital-blue hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">Anterior</span>
          </Button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2">
            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200",
                  index === currentIndex
                    ? "bg-urovital-blue scale-125"
                    : "bg-muted hover:bg-urovital-blue/50"
                )}
                aria-label={`Ir a slide ${index + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            disabled={isAnimating}
            className="border-urovital-blue text-urovital-blue hover:bg-urovital-blue hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="sr-only">Siguiente</span>
          </Button>
        </div>
      </div>
    </div>
  );
}