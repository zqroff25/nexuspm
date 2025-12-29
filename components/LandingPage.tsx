import React from 'react';
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { GradientText } from "./ui/gradient-text";

interface LandingPageProps {
  onStart: () => void;
}

function FloatingPaths({ position }: { position: number }) {
    // Project Brand Colors: Blue, Orange, Pink, Purple, Emerald
    const colors = [
        "#1456b8", // Primary Blue
        "#f97316", // Orange
        "#ec4899", // Pink
        "#a855f7", // Purple
        "#10b981", // Emerald
        "#3b82f6"  // Light Blue
    ];

    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: colors[i % colors.length], // Cycle through project colors
        width: 0.5 + i * 0.03,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full text-slate-950 dark:text-white"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>NexusPM Background</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke={path.color}
                        strokeWidth={path.width}
                        strokeOpacity={0.4 + path.id * 0.02} // Increased opacity for colors to pop
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.6, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950 transition-colors duration-500">
            <div className="absolute inset-0 opacity-80 dark:opacity-40">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="mb-8">
                      <GradientText className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tighter">
                          NexusPM
                      </GradientText>
                    </div>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="text-xl md:text-2xl text-slate-600 dark:text-gray-300 font-light max-w-2xl mx-auto mb-12"
                    >
                        Yapay zeka destekli ürün yönetimi ile <br className="hidden md:block"/>
                        <span className="font-semibold text-slate-800 dark:text-white">fikirden gerçeğe</span> ışık hızında ulaşın.
                    </motion.p>

                    <div
                        className="inline-block group relative bg-gradient-to-b from-black/5 to-white/20 
                        dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg 
                        overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                    >
                        <Button
                            onClick={onStart}
                            variant="ghost"
                            className="rounded-[1.15rem] px-10 py-8 text-lg font-semibold backdrop-blur-md 
                            bg-white/80 hover:bg-white/100 dark:bg-black/80 dark:hover:bg-black/100 
                            text-black dark:text-white transition-all duration-300 
                            group-hover:-translate-y-0.5 border border-black/5 dark:border-white/10
                            hover:shadow-md dark:hover:shadow-neutral-800/50"
                        >
                            <span className="opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                Hadi Başla
                            </span>
                            <span
                                className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                                transition-all duration-300"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_forward</span>
                            </span>
                        </Button>
                    </div>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 1 }}
                        className="mt-16 text-xs text-slate-400 dark:text-gray-600 font-medium uppercase tracking-widest"
                    >
                        NexusPM
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}