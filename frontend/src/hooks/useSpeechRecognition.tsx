import { useState, useEffect, useCallback, useRef } from "react";

interface SpeechRecognitionHook {
    isListening: boolean;
    transcript: string;
    confidence: number;
    isAwaitingCommand: boolean;
    permissionStatus: "granted" | "denied" | "prompt" | "checking";
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    onCommandComplete?: (command: string) => void;
}

declare global {
    interface Window {
        //@ts-expect-error SpeechRecognition is not defined in all browsers
        SpeechRecognition: typeof SpeechRecognition;
        //@ts-expect-error SpeechRecognition is not defined in all browsers
        webkitSpeechRecognition: typeof SpeechRecognition;
    }
}

export const useSpeechRecognition = (
    wakeWord: string = "hello world",
    onCommandComplete?: (command: string) => void,
    isSpeaking: boolean = false
): SpeechRecognitionHook => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [confidence, setConfidence] = useState(0);
    const [isAwaitingCommand, setIsAwaitingCommand] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<
        "granted" | "denied" | "prompt" | "checking"
    >("checking");
    //@ts-expect-error SpeechRecognition is not defined in all browsers
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(
        null
    );
    //@ts-expect-error Nodejs
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const commandTranscriptRef = useRef<string>("");
    const wakeWordDetectedRef = useRef<boolean>(false);
    const recognitionStateRef = useRef<
        "idle" | "starting" | "running" | "stopping"
    >("idle");

    useEffect(() => {
        const requestPermissions = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                setPermissionStatus("granted");
            } catch (error) {
                console.error("Microphone permission denied:", error);
                setPermissionStatus("denied");
            }
        };

        //@ts-expect-error
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            requestPermissions();
        } else {
            setPermissionStatus("denied");
        }
    }, []);

    const clearSilenceTimer = useCallback(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    const safeStartRecognition = useCallback(
        //@ts-expect-error
        (recognitionInstance: SpeechRecognition) => {
            if (
                recognitionStateRef.current === "idle" &&
                permissionStatus === "granted" &&
                !isSpeaking
            ) {
                try {
                    recognitionStateRef.current = "starting";
                    recognitionInstance.start();
                    console.log("Recognition start requested");
                } catch (e) {
                    console.error("Failed to start recognition:", e);
                    recognitionStateRef.current = "idle";
                }
            } else {
                console.log(
                    "Recognition not started - current state:",
                    recognitionStateRef.current,
                    "speaking:",
                    isSpeaking
                );
            }
        },
        [permissionStatus, isSpeaking]
    );

    const safeStopRecognition = useCallback(
        //@ts-expect-error
        (recognitionInstance: SpeechRecognition) => {
            if (recognitionStateRef.current === "running") {
                try {
                    recognitionStateRef.current = "stopping";
                    recognitionInstance.stop();
                    console.log("Recognition stop requested");
                } catch (e) {
                    console.error("Failed to stop recognition:", e);
                    recognitionStateRef.current = "idle";
                }
            }
        },
        []
    );

    const handleCommandComplete = useCallback(
        (command: string) => {
            console.log(
                "useSpeechRecognition: handleCommandComplete called with:",
                command
            );
            if (command.trim() && onCommandComplete) {
                console.log(
                    "useSpeechRecognition: calling onCommandComplete with:",
                    command.trim()
                );
                onCommandComplete(command.trim());
            }
            setIsAwaitingCommand(false);
            console.log(
                "useSpeechRecognition: clearing transcript and resetting state"
            );
            setTranscript("");
            commandTranscriptRef.current = "";
            wakeWordDetectedRef.current = false;
            clearSilenceTimer();
        },
        [onCommandComplete, clearSilenceTimer]
    );

    useEffect(() => {
        if (
            !isSpeaking &&
            recognition &&
            permissionStatus === "granted" &&
            recognitionStateRef.current === "idle"
        ) {
            console.log("Speaking finished, restarting recognition");
            setTimeout(() => {
                safeStartRecognition(recognition);
            }, 500);
        }
    }, [isSpeaking, recognition, permissionStatus, safeStartRecognition]);

    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error("Speech Recognition not supported");
            setPermissionStatus("denied");
            return;
        }

        if (permissionStatus !== "granted") {
            return;
        }

        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "en-US";

        //@ts-expect-error
        recognitionInstance.onresult = (event) => {
            console.log("Speech recognition result:", event.results);

            if (isSpeaking) {
                console.log("Ignoring speech recognition while speaking");
                return;
            }

            if (!isAwaitingCommand && !wakeWordDetectedRef.current) {
                let fullTranscript = "";
                for (let i = 0; i < event.results.length; i++) {
                    fullTranscript += event.results[i][0].transcript;
                }

                const lowerTranscript = fullTranscript.toLowerCase();
                const lowerWakeWord = wakeWord.toLowerCase();

                if (lowerTranscript.includes(lowerWakeWord)) {
                    console.log("Wake word detected in:", fullTranscript);
                    playWakeSound();

                    setIsAwaitingCommand(true);
                    wakeWordDetectedRef.current = true;

                    const wakeWordIndex =
                        lowerTranscript.lastIndexOf(lowerWakeWord);
                    const initialCommand = fullTranscript
                        .substring(wakeWordIndex + wakeWord.length)
                        .trim();

                    if (initialCommand) {
                        console.log("Initial command found:", initialCommand);
                        commandTranscriptRef.current = initialCommand;
                        console.log(
                            "useSpeechRecognition: setting transcript to initial command:",
                            initialCommand
                        );
                        setTranscript(initialCommand);

                        clearSilenceTimer();
                        silenceTimerRef.current = setTimeout(() => {
                            console.log(
                                "Silence timeout, sending command:",
                                commandTranscriptRef.current
                            );
                            handleCommandComplete(commandTranscriptRef.current);
                        }, 2000);
                    } else {
                        commandTranscriptRef.current = "";
                        setTranscript("");
                    }

                    setTimeout(() => {
                        safeStopRecognition(recognitionInstance);
                    }, 100);
                }
            } else if (isAwaitingCommand && wakeWordDetectedRef.current) {
                let commandText = "";

                for (let i = 0; i < event.results.length; i++) {
                    commandText += event.results[i][0].transcript;
                }

                commandText = commandText.trim();
                console.log("Command being captured:", commandText);

                if (commandText) {
                    commandTranscriptRef.current = commandText;
                    console.log(
                        "useSpeechRecognition: setting transcript to command:",
                        commandText
                    );
                    setTranscript(commandText);

                    clearSilenceTimer();
                    silenceTimerRef.current = setTimeout(() => {
                        console.log(
                            "Command timeout, sending:",
                            commandTranscriptRef.current
                        );
                        handleCommandComplete(commandTranscriptRef.current);
                    }, 2000);
                }
            }
        };

        //@ts-expect-error
        recognitionInstance.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            recognitionStateRef.current = "idle";

            if (event.error === "not-allowed") {
                setPermissionStatus("denied");
                setIsListening(false);
                return;
            }

            if (event.error === "aborted") {
                return;
            }

            if (!isSpeaking) {
                setTimeout(() => {
                    safeStartRecognition(recognitionInstance);
                }, 500);
            }
        };

        recognitionInstance.onstart = () => {
            console.log("Speech recognition started");
            recognitionStateRef.current = "running";
            setIsListening(true);
        };

        recognitionInstance.onend = () => {
            console.log("Speech recognition ended");
            recognitionStateRef.current = "idle";
            setIsListening(false);

            if (permissionStatus === "granted" && !isSpeaking) {
                setTimeout(() => {
                    safeStartRecognition(recognitionInstance);
                }, 100);
            }
        };

        setRecognition(recognitionInstance);

        setTimeout(() => {
            if (
                recognitionStateRef.current === "idle" &&
                permissionStatus === "granted" &&
                !isSpeaking
            ) {
                try {
                    recognitionStateRef.current = "starting";
                    recognitionInstance.start();
                    console.log("Initial recognition start requested");
                } catch (e) {
                    console.error("Failed to start initial recognition:", e);
                    recognitionStateRef.current = "idle";
                }
            }
        }, 100);

        return () => {
            clearSilenceTimer();
            recognitionStateRef.current = "idle";
            try {
                recognitionInstance.stop();
            } catch (e) {
                console.error("Failed to stop recognition in cleanup:", e);
            }
        };
    }, [
        wakeWord,
        permissionStatus,
        isAwaitingCommand,
        handleCommandComplete,
        clearSilenceTimer,
        isSpeaking,
    ]);

    const startListening = useCallback(() => {
        if (recognition && permissionStatus === "granted" && !isSpeaking) {
            safeStartRecognition(recognition);
        }
    }, [recognition, permissionStatus, isSpeaking, safeStartRecognition]);

    const stopListening = useCallback(() => {
        if (recognition) {
            safeStopRecognition(recognition);
        }
        clearSilenceTimer();
        setIsAwaitingCommand(false);
        wakeWordDetectedRef.current = false;
    }, [recognition, clearSilenceTimer, safeStopRecognition]);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setConfidence(0);
        setIsAwaitingCommand(false);
        commandTranscriptRef.current = "";
        wakeWordDetectedRef.current = false;
        clearSilenceTimer();
    }, [clearSilenceTimer]);

    const playWakeSound = useCallback(() => {
        try {
            const audio = new Audio("/wake-sound.mp3");

            audio.play();

            // const audioContext = new (window.AudioContext ||
            //     (window as any).webkitAudioContext)();
            // const oscillator = audioContext.createOscillator();
            // const gainNode = audioContext.createGain();

            // oscillator.connect(gainNode);
            // gainNode.connect(audioContext.destination);

            // oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            // gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            // gainNode.gain.exponentialRampToValueAtTime(
            //     0.01,
            //     audioContext.currentTime + 0.2
            // );

            // oscillator.start(audioContext.currentTime);
            // oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log("Could not play wake sound:", error);
        }
    }, []);

    return {
        isListening,
        transcript,
        confidence,
        isAwaitingCommand,
        permissionStatus,
        startListening,
        stopListening,
        resetTranscript,
    };
};
