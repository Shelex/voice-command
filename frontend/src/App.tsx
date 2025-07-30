import { VoiceInput } from "@/components/VoiceInput";
import "./index.css";

function App() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto py-[42px]">
                <h1 className="text-[39px] font-bold text-center mb-[42px]">
                    Voice Assistant - Petro
                </h1>
                <VoiceInput />
            </div>
        </div>
    );
}

export default App;
