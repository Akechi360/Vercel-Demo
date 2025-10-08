'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpecialtyCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface SpecialtyCarouselProps {
  cards: SpecialtyCard[];
}

export function SpecialtyCarousel({ cards }: SpecialtyCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(1);

  // Responsive cards per view
  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth >= 1024) {
        setCardsPerView(4); // lg: 4 cards
      } else if (window.innerWidth >= 768) {
        setCardsPerView(3); // md: 3 cards
      } else if (window.innerWidth >= 640) {
        setCardsPerView(2); // sm: 2 cards
      } else {
        setCardsPerView(1); // mobile: 1 card
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  const maxIndex = Math.max(0, cards.length - cardsPerView);

  const goToSlide = (index: number) => {
    const newIndex = Math.max(0, Math.min(maxIndex, index));
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      goToSlide(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  };

  // Get current slide cards
  const getCurrentSlideCards = () => {
    return cards.slice(currentIndex, currentIndex + cardsPerView);
  };

  return (
    <div className="relative w-full">
      {/* Navigation Arrows */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className={cn(
            "p-2 rounded-full transition-all duration-300 hover:bg-primary/10",
            currentIndex === 0 
              ? "opacity-50 cursor-not-allowed" 
              : "hover:scale-110"
          )}
        >
          <ChevronLeft className="w-6 h-6 text-primary" />
        </button>
        
        <div className="flex gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "bg-primary w-8"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentIndex >= maxIndex}
          className={cn(
            "p-2 rounded-full transition-all duration-300 hover:bg-primary/10",
            currentIndex >= maxIndex 
              ? "opacity-50 cursor-not-allowed" 
              : "hover:scale-110"
          )}
        >
          <ChevronRight className="w-6 h-6 text-primary" />
        </button>
      </div>

      {/* Slides Container */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.5 
            }}
            className="grid gap-8"
            style={{
              gridTemplateColumns: `repeat(${cardsPerView}, 1fr)`
            }}
          >
            {getCurrentSlideCards().map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={`${currentIndex}-${card.title}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.1,
                    duration: 0.4
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                >
                  <Card className="text-center p-6 h-full border-b-4 border-transparent transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.2)] dark:hover:shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                    <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{card.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 w-full bg-muted-foreground/20 rounded-full h-1">
        <motion.div
          className="bg-primary h-1 rounded-full"
          initial={{ width: 0 }}
          animate={{ 
            width: `${((currentIndex + 1) / (maxIndex + 1)) * 100}%` 
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
