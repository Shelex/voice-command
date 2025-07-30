import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useOpenRouter } from "@/hooks/useOpenRouter";

export const VoiceInput: React.FC = () => {
    const [inputValue, setInputValue] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const { speak, isSpeaking, stop: stopSpeaking } = useSpeechSynthesis();
    const { sendMessage, isStreaming, response } = useOpenRouter();

    const handleCommandComplete = useCallback(
        async (command: string) => {
            console.log(
                "VoiceInput: handleCommandComplete called with:",
                command
            );
            setInputValue(command);
            setIsProcessing(true);
            stopSpeaking();

            try {
                console.log("VoiceInput: sending message:", command);
                await sendMessage(command);
            } catch (error) {
                console.error("Error sending message:", error);
            } finally {
                console.log("VoiceInput: command complete");
                setIsProcessing(false);
            }
        },
        [sendMessage, stopSpeaking]
    );

    const { isListening, transcript, isAwaitingCommand, permissionStatus } =
        useSpeechRecognition("hello world", handleCommandComplete, isSpeaking);

    useEffect(() => {
        console.log("VoiceInput: transcript changed:", transcript);
        if (transcript && !isProcessing) {
            console.log("VoiceInput: updating inputValue to:", transcript);
            setInputValue(transcript);
        }
    }, [transcript, isProcessing]);

    useEffect(() => {
        if (response && !isStreaming) {
            console.log(
                "VoiceInput: starting speech synthesis, clearing input"
            );
            setInputValue("");
            speak(response);
        }
    }, [response, isStreaming, speak]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const getPlaceholderText = () => {
        if (permissionStatus === "denied") {
            return "Microphone access denied. Please enable microphone permissions and refresh.";
        }
        if (isAwaitingCommand) {
            return "Listening... speak your command now";
        }
        return "Say 'hello world' to activate voice input...";
    };

    const getStatusBadges = () => {
        const badges = [];

        if (permissionStatus === "denied") {
            badges.push(
                <Badge key="permission" variant="destructive">
                    Microphone Access Denied
                </Badge>
            );
        } else if (permissionStatus === "checking") {
            badges.push(
                <Badge key="checking" variant="outline">
                    Checking Permissions...
                </Badge>
            );
        } else if (isAwaitingCommand) {
            badges.push(
                <Badge key="awaiting" variant="default">
                    Awaiting Command...
                </Badge>
            );
        } else if (isSpeaking) {
            badges.push(
                <Badge key="speaking" variant="secondary">
                    Listening blocked...
                </Badge>
            );
        } else if (isListening) {
            badges.push(
                <Badge key="listening" variant="secondary">
                    Listening for "hello world"...
                </Badge>
            );
        } else {
            badges.push(
                <Badge key="ready" variant="outline">
                    Ready
                </Badge>
            );
        }

        if (isProcessing) {
            badges.push(
                <Badge key="processing" variant="outline">
                    Processing...
                </Badge>
            );
        }

        if (isSpeaking) {
            badges.push(
                <Badge key="speaking_badge" variant="outline">
                    Speaking...
                </Badge>
            );
        }

        return badges;
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-[31px] space-y-[21px]">
            <div className="flex items-center gap-[10px] mb-[21px] flex-wrap">
                {getStatusBadges()}
            </div>

            <div className="flex gap-[10px]">
                <Input
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={getPlaceholderText()}
                    className="flex-1"
                    disabled={isProcessing}
                />
            </div>

            {permissionStatus === "denied" && (
                <div className="mt-[10px] p-[16px] bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-[18px] text-destructive">
                        Microphone access is required for voice commands. Please
                        enable microphone permissions in your browser settings
                        and refresh the page.
                    </p>
                </div>
            )}

            {(isStreaming || isSpeaking) && response && (
                <div className="mt-[21px] p-[21px] bg-muted rounded-lg">
                    <p className="text-[18px] text-muted-foreground mb-[10px]">
                        Response:
                    </p>
                    <p>{response}</p>
                </div>
            )}
        </div>
    );
};
