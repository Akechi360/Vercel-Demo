'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';

type StaggerFrom = 'first' | 'last';

type RotatingTextProps = {
  texts: string[];
  rotationInterval?: number;
  initial?: HTMLMotionProps<'span'>['initial'];
  animate?: HTMLMotionProps<'span'>['animate'];
  exit?: HTMLMotionProps<'span'>['exit'];
  transition?: HTMLMotionProps<'span'>['transition'];
  staggerDuration?: number;
  mainClassName?: string;
  splitLevelClassName?: string;
  staggerFrom?: StaggerFrom;
};

export default function RotatingText({
  texts,
  rotationInterval = 2500,
  initial = { y: '100%' },
  animate = { y: 0 },
  exit = { y: '-120%' },
  transition = { type: 'spring', damping: 30, stiffness: 400 },
  staggerDuration = 0.025,
  mainClassName = '',
  splitLevelClassName = 'overflow-hidden',
  staggerFrom = 'last',
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, rotationInterval);
    return () => clearInterval(id);
  }, [rotationInterval, texts.length]);

  const current = texts[index] ?? '';
  const chars = useMemo(() => current.split(''), [current]);

  const sequence = useMemo(() => {
    const base = chars.map((_, i) => i);
    return staggerFrom === 'last' ? base.reverse() : base;
  }, [chars, staggerFrom]);

  return (
    <span className={mainClassName}>
      <span className="inline-flex items-center gap-px">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={index} className="inline-flex" aria-live="polite">
            {chars.map((char, i) => (
              <span key={`${index}-${i}`} className={splitLevelClassName}>
                <motion.span
                  initial={initial}
                  animate={animate}
                  exit={exit}
                  transition={{ ...transition, delay: sequence.indexOf(i) * (staggerDuration || 0) }}
                  className="inline-block"
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              </span>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}


