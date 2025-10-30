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
    <span className="relative inline-block">
      <motion.span
        initial={{
          width: "0%",
        }}
        whileInView={{
          width: "100%",
        }}
        viewport={{ once: true }}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
          delay: 0.3,
        }}
        className={cn(
          "absolute inset-0 z-0 bg-urovital-blue rounded-md",
          className
        )}
        style={{
          transformOrigin: 'left center',
        }}
      />
      <span className="relative z-10 px-3 py-1 text-white">
        {children}
      </span>
    </span>
  );
};
