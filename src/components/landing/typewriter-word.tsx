"use client";

import { useAnimate } from "motion/react";
import { useEffect, useRef } from "react";

interface TypewriterSequence {
    text: string;
    deleteAfter?: boolean;
    pauseAfter?: number;
}

interface TypewriterWordProps {
    sequences?: TypewriterSequence[];
    typingSpeed?: number;
    startDelay?: number;
    autoLoop?: boolean;
    loopDelay?: number;
    className?: string;
}

export default function TypewriterWord({
    sequences = [
        { text: "keyword", deleteAfter: true },
        { text: "topic", deleteAfter: true },
        { text: "year", deleteAfter: true },
    ],
    typingSpeed = 80,
    startDelay = 500,
    autoLoop = true,
    loopDelay = 500,
    className = "",
}: TypewriterWordProps) {
    const [scope, animate] = useAnimate();
    const timeoutIds = useRef<Set<NodeJS.Timeout>>(new Set());

    useEffect(() => {
        let isActive = true;
        let isFirstRun = true;

        const createTimeout = (fn: () => void, delay: number): Promise<void> => {
            return new Promise((resolve) => {
                const timeoutId = setTimeout(() => {
                    timeoutIds.current.delete(timeoutId);
                    if (isActive) {
                        fn();
                        resolve();
                    } else {
                        resolve();
                    }
                }, delay);
                timeoutIds.current.add(timeoutId);
            });
        };

        const typeText = async () => {
            const titleElement =
                scope.current.querySelector("[data-typewriter]");
            if (!titleElement) return;

            while (isActive) {
                // Don't clear text on first run to avoid hydration mismatch
                if (!isFirstRun) {
                    await animate(scope.current, { opacity: 1 });
                    titleElement.textContent = "";
                }

                // Wait for initial delay
                await createTimeout(() => {}, startDelay);
                if (!isActive) break;

                // Process each sequence
                for (let sequenceIndex = 0; sequenceIndex < sequences.length; sequenceIndex++) {
                    if (!isActive) break;
                    const sequence = sequences[sequenceIndex];
                    
                    // On first run, first sequence is already displayed, so skip typing
                    if (!(isFirstRun && sequenceIndex === 0)) {
                        // Type out the sequence text
                        for (let i = 0; i < sequence.text.length; i++) {
                            if (!isActive) break;
                            titleElement.textContent = sequence.text.slice(
                                0,
                                i + 1
                            );
                            await createTimeout(() => {}, typingSpeed);
                            if (!isActive) break;
                        }
                    }
                    
                    if (isFirstRun && sequenceIndex === 0) {
                        isFirstRun = false;
                    }

                    // Pause after typing if specified
                    if (sequence.pauseAfter) {
                        await createTimeout(() => {}, sequence.pauseAfter);
                        if (!isActive) break;
                    }

                    // Delete the text if specified
                    if (sequence.deleteAfter) {
                        // Small pause before deleting
                        await createTimeout(() => {}, 500);
                        if (!isActive) break;

                        for (let i = sequence.text.length; i > 0; i--) {
                            if (!isActive) break;
                            titleElement.textContent = sequence.text.slice(
                                0,
                                i
                            );
                            await createTimeout(() => {}, typingSpeed / 2);
                            if (!isActive) break;
                        }
                    }
                }

                if (!autoLoop || !isActive) break;

                // Wait before starting next loop
                await createTimeout(() => {}, loopDelay);
            }
        };

        typeText();

        // Cleanup function to clear all timeouts when component unmounts
        return () => {
            isActive = false;
            // Copy the Set to avoid ref value changes during cleanup
            const timeouts = new Set(timeoutIds.current);
            // Clear all pending timeouts
            timeouts.forEach(timeoutId => {
                clearTimeout(timeoutId);
            });
            // eslint-disable-next-line react-hooks/exhaustive-deps
            timeoutIds.current.clear();
        };
    }, [
        sequences,
        typingSpeed,
        startDelay,
        autoLoop,
        loopDelay,
        animate,
        scope,
    ]);

    return (
        <span ref={scope} className={className}>
            <span
                data-typewriter
                className="inline-block border-r-2 border-gray-700 pr-1"
            >
                {sequences[0].text}
            </span>
        </span>
    );
}