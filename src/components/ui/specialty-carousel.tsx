'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
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
  const [isDragging, setIsDragging] = useState(false);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const controls = useAnimation();

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
  const cardWidth = 100 / cardsPerView; // Percentage width per card

  // Transform for smooth dragging
  const dragX = useTransform(x, (latest) => {
    const maxDrag = -(maxIndex * cardWidth);
    return Math.max(maxDrag, Math.min(0, latest));
  });

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    
    // Snap to nearest card
    const currentX = x.get();
    const cardIndex = Math.round(-currentX / cardWidth);
    const newIndex = Math.max(0, Math.min(maxIndex, cardIndex));
    
    setCurrentIndex(newIndex);
    controls.start({ x: -newIndex * cardWidth });
  };

  const goToSlide = (index: number) => {
    const newIndex = Math.max(0, Math.min(maxIndex, index));
    setCurrentIndex(newIndex);
    controls.start({ x: -newIndex * cardWidth });
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

  // Auto-play (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging) {
        if (currentIndex >= maxIndex) {
          goToSlide(0);
        } else {
          nextSlide();
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, maxIndex, isDragging]);

  return (
    <div className="relative w-full">
      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        
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

        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          disabled={currentIndex >= maxIndex}
          className="flex items-center gap-2"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        <motion.div
          ref={carouselRef}
          className="flex gap-8"
          style={{ x: dragX }}
          drag="x"
          dragConstraints={{ left: -(maxIndex * cardWidth), right: 0 }}
          dragElastic={0.1}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          animate={controls}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                className="flex-shrink-0"
                style={{ width: `${cardWidth}%` }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
              >
                <Card className="text-center p-6 h-full border-b-4 border-transparent transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.2)] dark:hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] cursor-grab active:cursor-grabbing">
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
