"use client";

import { useAnimate } from "motion/react";
import { useEffect, useCallback, useRef } from "react";
import { useSafeTimeout } from "@/lib/hooks/use-safe-timeout";

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
    const { setSafeTimeout, clearAllTimeouts } = useSafeTimeout();
    const isActiveRef = useRef(true);
    const isFirstRunRef = useRef(true);

    const typeCharacter = useCallback(
        (element: Element, text: string, index: number) => {
            element.textContent = text.slice(0, index + 1);
        },
        []
    );

    const deleteCharacter = useCallback(
        (element: Element, text: string, index: number) => {
            element.textContent = text.slice(0, index);
        },
        []
    );

    const runTypewriterAnimation = useCallback(async () => {
        const titleElement = scope.current?.querySelector("[data-typewriter]");
        if (!titleElement || !isActiveRef.current) return;

        // Animation loop
        while (isActiveRef.current) {
            // Don't clear text on first run to avoid hydration mismatch
            if (!isFirstRunRef.current) {
                await animate(scope.current, { opacity: 1 });
                titleElement.textContent = "";
            }

            // Wait for initial delay
            await new Promise<void>((resolve) => {
                setSafeTimeout(resolve, startDelay);
            });
            
            if (!isActiveRef.current) break;

            // Process each sequence
            for (let sequenceIndex = 0; sequenceIndex < sequences.length; sequenceIndex++) {
                if (!isActiveRef.current) break;
                const sequence = sequences[sequenceIndex];

                // Skip typing animation for first sequence on first run (SSR hydration)
                if (!(isFirstRunRef.current && sequenceIndex === 0)) {
                    // Type out the sequence text
                    for (let i = 0; i < sequence.text.length; i++) {
                        if (!isActiveRef.current) break;
                        
                        await new Promise<void>((resolve) => {
                            setSafeTimeout(() => {
                                if (isActiveRef.current) {
                                    typeCharacter(titleElement, sequence.text, i);
                                }
                                resolve();
                            }, typingSpeed);
                        });
                    }
                }

                if (isFirstRunRef.current && sequenceIndex === 0) {
                    isFirstRunRef.current = false;
                }

                // Pause after typing if specified
                if (sequence.pauseAfter && isActiveRef.current) {
                    await new Promise<void>((resolve) => {
                        setSafeTimeout(resolve, sequence.pauseAfter!);
                    });
                }

                // Delete the text if specified
                if (sequence.deleteAfter && isActiveRef.current) {
                    // Small pause before deleting
                    await new Promise<void>((resolve) => {
                        setSafeTimeout(resolve, 500);
                    });

                    if (!isActiveRef.current) break;

                    // Delete characters
                    for (let i = sequence.text.length; i > 0; i--) {
                        if (!isActiveRef.current) break;
                        
                        await new Promise<void>((resolve) => {
                            setSafeTimeout(() => {
                                if (isActiveRef.current) {
                                    deleteCharacter(titleElement, sequence.text, i);
                                }
                                resolve();
                            }, typingSpeed / 2);
                        });
                    }
                }
            }

            if (!autoLoop || !isActiveRef.current) break;

            // Wait before starting next loop
            await new Promise<void>((resolve) => {
                setSafeTimeout(resolve, loopDelay);
            });
        }
    }, [
        scope,
        animate,
        setSafeTimeout,
        sequences,
        typingSpeed,
        startDelay,
        autoLoop,
        loopDelay,
        typeCharacter,
        deleteCharacter,
    ]);

    useEffect(() => {
        isActiveRef.current = true;
        runTypewriterAnimation();

        return () => {
            isActiveRef.current = false;
            clearAllTimeouts();
        };
    }, [runTypewriterAnimation, clearAllTimeouts]);

    return (
        <span ref={scope} className={className}>
            <span
                data-typewriter
                className="inline-block border-r-2 border-salmon-500 pr-1 font-serif"
            >
                {sequences[0].text}
            </span>
        </span>
    );
}