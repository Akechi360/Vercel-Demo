'use client';

import type { SpringOptions } from 'framer-motion';
import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface TiltedCardProps {
	children: React.ReactNode;
	containerHeight?: React.CSSProperties['height'];
	containerWidth?: React.CSSProperties['width'];
	scaleOnHover?: number;
	rotateAmplitude?: number;
	showTooltip?: boolean;
	tooltipText?: string;
	className?: string;
}

const springValues: SpringOptions = {
	damping: 30,
	stiffness: 100,
	mass: 2
};

export default function TiltedCard({
	children,
	containerHeight = 'auto',
	containerWidth = '100%',
	scaleOnHover = 1.05,
	rotateAmplitude = 8,
	showTooltip = false,
	tooltipText = '',
	className = ''
}: TiltedCardProps) {
	const ref = useRef<HTMLDivElement>(null);
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const rotateX = useSpring(useMotionValue(0), springValues);
	const rotateY = useSpring(useMotionValue(0), springValues);
	const scale = useSpring(1, springValues);
	const opacity = useSpring(0);
	const rotateFigcaption = useSpring(0, {
		stiffness: 350,
		damping: 30,
		mass: 1
	});

	const [lastY, setLastY] = useState(0);

	function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
		if (!ref.current) return;

		const rect = ref.current.getBoundingClientRect();
		const offsetX = e.clientX - rect.left - rect.width / 2;
		const offsetY = e.clientY - rect.top - rect.height / 2;

		const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
		const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

		rotateX.set(rotationX);
		rotateY.set(rotationY);

		x.set(e.clientX - rect.left);
		y.set(e.clientY - rect.top);

		const velocityY = offsetY - lastY;
		rotateFigcaption.set(-velocityY * 0.6);
		setLastY(offsetY);
	}

	function handleMouseEnter() {
		scale.set(scaleOnHover);
		opacity.set(1);
	}

	function handleMouseLeave() {
		opacity.set(0);
		scale.set(1);
		rotateX.set(0);
		rotateY.set(0);
		rotateFigcaption.set(0);
	}

	return (
		<div
			ref={ref}
			className={`relative w-full h-full [perspective:800px] ${className}`}
			style={{
				height: containerHeight,
				width: containerWidth
			}}
			onMouseMove={handleMouse}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<motion.div
				className="relative [transform-style:preserve-3d] w-full h-full"
				style={{
					rotateX,
					rotateY,
					scale
				}}
			>
				{children}
			</motion.div>

			{showTooltip && tooltipText && (
				<motion.div
					className="pointer-events-none absolute left-0 top-0 rounded-lg bg-urovital-blue px-3 py-2 text-xs text-white opacity-0 z-50 hidden sm:block shadow-lg"
					style={{
						x,
						y,
						opacity,
						rotate: rotateFigcaption
					}}
				>
					{tooltipText}
				</motion.div>
			)}
		</div>
	);
}


