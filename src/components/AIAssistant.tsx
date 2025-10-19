import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, Volume2, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import apiClient from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Listening...");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert audio to text using Web Speech API
      const recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        await sendMessage(transcript);
      };

      recognition.onerror = () => {
        toast.error("Could not recognize speech. Please try typing instead.");
        setIsProcessing(false);
      };

      // For demo purposes, we'll use the AI chat directly
      // In production, you'd want to implement proper speech-to-text
      const demoMessage = "Hello, I need information about medicines for fever";
      await sendMessage(demoMessage);

    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Error processing audio");
      setIsProcessing(false);
    }
  };

  const sendMessage = async (text: string) => {
    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // For now, we'll provide a simple health-focused response
      // In the future, you can integrate with OpenAI, Claude, or other AI services
      const response = await generateHealthResponse(text);

      const assistantMessage: Message = {
        role: "assistant",
        content: response
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response
      speakText(response);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateHealthResponse = async (userMessage: string): Promise<string> => {
    // Simple health-focused responses based on keywords
    const message = userMessage.toLowerCase();

    if (message.includes('fever') || message.includes('temperature')) {
      return "For fever, you can take Paracetamol 500-1000mg every 4-6 hours. Make sure to stay hydrated and rest. If fever persists for more than 3 days or is above 103°F, please consult a doctor.";
    }

    if (message.includes('headache') || message.includes('head pain')) {
      return "For headaches, you can try Paracetamol or Ibuprofen. Rest in a dark, quiet room and apply a cold compress to your forehead. If headaches are severe or frequent, please see a doctor.";
    }

    if (message.includes('cough') || message.includes('cold')) {
      return "For cough and cold symptoms, stay hydrated, use a humidifier, and try honey with warm water. Over-the-counter cough syrups may help. If symptoms worsen or persist, consult a healthcare provider.";
    }

    if (message.includes('pain') || message.includes('ache')) {
      return "For general pain, you can use Paracetamol or Ibuprofen as directed. Apply ice or heat as appropriate. If pain is severe or doesn't improve, please seek medical attention.";
    }

    if (message.includes('medicine') || message.includes('medication')) {
      return "I can help you find information about medicines. You can search for specific medicines in our database or ask about symptoms to get medicine recommendations. Always consult a doctor before taking new medications.";
    }

    if (message.includes('allergy') || message.includes('allergic')) {
      return "For allergies, you can try antihistamines like Cetirizine. Avoid known allergens and keep your environment clean. If you have severe allergic reactions, seek immediate medical help.";
    }

    // Default response
    return "I'm here to help with health and medicine questions. You can ask me about symptoms, medicines, or general health advice. For specific medical concerns, please consult a healthcare professional. Remember, I provide information only and cannot replace medical advice.";
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <Card className="flex flex-col h-[500px] max-w-2xl mx-auto">
      <div className="p-4 border-b bg-gradient-to-r from-primary to-secondary">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Swasthya Vaani AI Assistant
        </h3>
        <p className="text-sm text-white/90">Ask me anything about medicines and health</p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation by tapping the microphone</p>
              <p className="text-sm mt-2">or type your question</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                    }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex items-center gap-2">
        <Button
          size="icon"
          onClick={isRecording ? stopRecording : startRecording}
          className={`rounded-full ${isRecording ? "bg-destructive hover:bg-destructive/90" : "bg-primary"
            }`}
          disabled={isProcessing}
        >
          {isRecording ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>

        {isSpeaking && (
          <Button
            size="icon"
            variant="outline"
            onClick={stopSpeaking}
            className="rounded-full"
          >
            <Volume2 className="w-5 h-5" />
          </Button>
        )}

        <div className="flex-1 text-center text-sm text-muted-foreground">
          {isRecording ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
              Recording...
            </span>
          ) : isProcessing ? (
            "Processing..."
          ) : isSpeaking ? (
            "Speaking..."
          ) : (
            "Tap microphone to speak"
          )}
        </div>
      </div>
    </Card>
  );
};

export default AIAssistant;
