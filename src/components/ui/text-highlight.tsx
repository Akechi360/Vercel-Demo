"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextHighlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.span
      initial={{
        backgroundSize: "0% 100%",
      }}
      whileInView={{
        backgroundSize: "100% 100%",
      }}
      viewport={{ once: true }}
      transition={{
        duration: 1.2,
        ease: "easeInOut",
        delay: 0.3,
      }}
      style={{
        backgroundImage: 'linear-gradient(to right, #0080FF, #0080FF)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left center',
        display: 'inline',
      }}
      className={cn(
        "relative inline-block px-3 py-1 rounded-md text-white",
        className
      )}
    >
      {children}
    </motion.span>
  );
};
