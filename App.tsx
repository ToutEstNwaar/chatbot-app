import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MenuIcon, PlusIcon } from './components/icons';
import { ChatSession, Message, Attachment, GroundingChunk, UrlContextMetadata } from './types';
import { initializeChat, sendMessageToGemini } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import ChatInput from './components/ChatInput';
import HistoryPanel from './components/HistoryPanel';

const App: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const createNewSession = useCallback(() => {
        const newId = uuidv4();
        const newSession: ChatSession = {
            id: newId,
            title: `New Chat ${sessions.length + 1}`,
            messages: [],
            geminiChat: initializeChat()
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newId);
    }, [sessions.length]);

    useEffect(() => {
        if (sessions.length === 0) {
            createNewSession();
        } else if (!activeSessionId) {
            setActiveSessionId(sessions[0].id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [sessions, activeSessionId]);

    const activeSession = sessions.find(s => s.id === activeSessionId);

    const handleSendMessage = async (text: string, attachments: Attachment[]) => {
        if (!activeSession || !activeSession.geminiChat || isAwaitingResponse) return;

        const userMessage: Message = {
            id: uuidv4(),
            role: 'user',
            text: text,
            attachments: attachments,
            timestamp: new Date()
        };

        const loadingMessage: Message = {
            id: uuidv4(),
            role: 'model',
            timestamp: new Date(),
            isLoading: true
        };
        
        const isFirstMessage = activeSession.messages.length === 0;

        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                 const newTitle = isFirstMessage && text.trim() ? text.trim().substring(0, 30) : s.title;
                 return { ...s, title: newTitle, messages: [...s.messages, userMessage, loadingMessage] };
            }
            return s;
        }));
        
        setIsAwaitingResponse(true);

        try {
            const response = await sendMessageToGemini(activeSession.geminiChat, text, attachments);
            const candidate = response.candidates?.[0];

            let modelText = '';
            let thoughtSummary: string | undefined = undefined;

            if (candidate?.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (!part.text) {
                        continue;
                    }
                    // The 'thought' property is not in the official type definitions,
                    // so we access it via an 'any' cast as shown in documentation examples.
                    if ((part as any).thought) {
                        thoughtSummary = (thoughtSummary || '') + part.text;
                    } else {
                        modelText += part.text;
                    }
                }
            }

            // Fallback if parts processing yields no text but the top-level response.text exists
            if (!modelText && !thoughtSummary && response.text) {
                modelText = response.text;
            }

            const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
            const urlContextMetadata = candidate?.urlContextMetadata;

            const modelMessage: Message = {
                id: uuidv4(),
                role: 'model',
                text: modelText,
                timestamp: new Date(),
                groundingChunks: groundingChunks as GroundingChunk[] | undefined,
                urlContextMetadata: urlContextMetadata as UrlContextMetadata | undefined,
                finishReason: candidate?.finishReason,
                safetyRatings: candidate?.safetyRatings,
                tokenCount: candidate?.tokenCount,
                thoughtSummary: thoughtSummary,
            };

             setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return { ...s, messages: [...s.messages.filter(m => !m.isLoading), modelMessage] };
                }
                return s;
            }));

        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage: Message = {
                id: uuidv4(),
                role: 'model',
                text: "Sorry, I couldn't process that. Please try again.",
                timestamp: new Date()
            };
            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return { ...s, messages: [...s.messages.filter(m => !m.isLoading), errorMessage] };
                }
                return s;
            }));
        } finally {
            setIsAwaitingResponse(false);
        }
    };
    
    const handleSelectSession = (id: string) => {
        setActiveSessionId(id);
        setIsHistoryOpen(false);
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-900 overflow-hidden">
            <header className="flex-shrink-0 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 flex justify-between items-center p-4 text-white">
                <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-full hover:bg-slate-700">
                    <MenuIcon className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold truncate">{activeSession?.title || 'Chat'}</h1>
                <button onClick={createNewSession} className="p-2 rounded-full hover:bg-slate-700">
                    <PlusIcon className="w-6 h-6" />
                </button>
            </header>

            <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-4">
                    {activeSession?.messages.map(msg => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                </div>
            </main>
            
            <HistoryPanel 
                isOpen={isHistoryOpen} 
                onClose={() => setIsHistoryOpen(false)}
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
            />

            <footer className="flex-shrink-0">
                <ChatInput onSendMessage={handleSendMessage} disabled={isAwaitingResponse} />
            </footer>
        </div>
    );
};

export default App;