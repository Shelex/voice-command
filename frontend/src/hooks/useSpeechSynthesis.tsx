import { useState, useCallback, useEffect } from "react";

interface SpeechSynthesisHook {
    isSpeaking: boolean;
    speak: (text: string) => void;
    stop: () => void;
    pause: () => void;
    resume: () => void;
    voices: SpeechSynthesisVoice[];
    selectedVoice: SpeechSynthesisVoice | null;
    setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
}

export const useSpeechSynthesis = (): SpeechSynthesisHook => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoiceState] =
        useState<SpeechSynthesisVoice | null>(null);

    useEffect(() => {
        const synth = window.speechSynthesis;

        const loadVoices = () => {
            const availableVoices = synth.getVoices();
            setVoices(availableVoices);

            const defaultVoice =
                availableVoices.find(
                    (voice) =>
                        voice.lang === "en-US" &&
                        voice.name === "Google US English"
                ) || availableVoices[0];
            setSelectedVoiceState(defaultVoice);
        };

        loadVoices();
        synth.onvoiceschanged = loadVoices;
    }, []);

    const speak = useCallback(
        (text: string) => {
            const synth = window.speechSynthesis;

            if (synth.speaking) synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            utterance.rate = 1.2;
            utterance.pitch = 1.2;
            utterance.volume = 1;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            synth.speak(utterance);
        },
        [selectedVoice]
    );

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    const pause = useCallback(() => {
        window.speechSynthesis.pause();
    }, []);

    const resume = useCallback(() => {
        window.speechSynthesis.resume();
    }, []);

    const setSelectedVoice = useCallback((voice: SpeechSynthesisVoice) => {
        setSelectedVoiceState(voice);
    }, []);

    return {
        isSpeaking,
        speak,
        stop,
        pause,
        resume,
        voices,
        selectedVoice,
        setSelectedVoice,
    };
};
