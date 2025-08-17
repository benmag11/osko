"use client";

import { useAnimate } from "motion/react";
import { useEffect } from "react";

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

    useEffect(() => {
        let isActive = true;

        const typeText = async () => {
            const titleElement =
                scope.current.querySelector("[data-typewriter]");
            if (!titleElement) return;

            while (isActive) {
                // Reset the text content
                await animate(scope.current, { opacity: 1 });
                titleElement.textContent = "";

                // Wait for initial delay on first run
                await new Promise((resolve) => setTimeout(resolve, startDelay));

                // Process each sequence
                for (const sequence of sequences) {
                    if (!isActive) break;

                    // Type out the sequence text
                    for (let i = 0; i < sequence.text.length; i++) {
                        if (!isActive) break;
                        titleElement.textContent = sequence.text.slice(
                            0,
                            i + 1
                        );
                        await new Promise((resolve) =>
                            setTimeout(resolve, typingSpeed)
                        );
                    }

                    // Pause after typing if specified
                    if (sequence.pauseAfter) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, sequence.pauseAfter)
                        );
                    }

                    // Delete the text if specified
                    if (sequence.deleteAfter) {
                        // Small pause before deleting
                        await new Promise((resolve) =>
                            setTimeout(resolve, 500)
                        );

                        for (let i = sequence.text.length; i > 0; i--) {
                            if (!isActive) break;
                            titleElement.textContent = sequence.text.slice(
                                0,
                                i
                            );
                            await new Promise((resolve) =>
                                setTimeout(resolve, typingSpeed / 2)
                            );
                        }
                    }
                }

                if (!autoLoop || !isActive) break;

                // Wait before starting next loop
                await new Promise((resolve) => setTimeout(resolve, loopDelay));
            }
        };

        typeText();

        // Cleanup function to stop the animation when component unmounts
        return () => {
            isActive = false;
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