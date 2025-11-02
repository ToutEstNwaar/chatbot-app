import React, { useState, useRef, useEffect } from 'react';
import { PaperclipIcon, MicIcon, SendIcon, TrashIcon, PauseIcon, PlayIcon } from './icons';
import { useRecorder } from '../hooks/useRecorder';
import { fileToBase64, getAttachmentType } from '../utils/fileUtils';
import { Attachment } from '../types';
import AttachmentPreview from './AttachmentPreview';
import AttachmentMenu from './AttachmentMenu';
import Waveform from './Waveform';

interface ChatInputProps {
    onSendMessage: (text: string, attachments: Attachment[]) => void;
    disabled?: boolean;
}

// Helper to format time
const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString()}:${remainingSeconds.toString().padStart(2, '0')}`;
};


const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isRecordingMode, setIsRecordingMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleRecordingComplete = async (blob: Blob) => {
        const data = await fileToBase64(new File([blob], 'voice-note.webm', { type: 'audio/webm' }));
        onSendMessage('', [{
            type: 'audio',
            name: 'voice-note.webm',
            data: data,
            mimeType: 'audio/webm'
        }]);
    };
    
    const { 
        isRecording, 
        isPaused,
        recordingTime,
        audioData,
        startRecording, 
        stopRecording, 
        cancelRecording,
        togglePauseResume 
    } = useRecorder(handleRecordingComplete);

    // Effect to start recording when entering recording mode
    useEffect(() => {
        if (isRecordingMode && !isRecording) {
            startRecording();
        }
    }, [isRecordingMode, isRecording, startRecording]);
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const newAttachments = await Promise.all(
                // FIX: Explicitly type `file` as `File` to fix type inference issue where it was considered 'unknown'.
                files.map(async (file: File) => {
                    const data = await fileToBase64(file);
                    return {
                        data,
                        name: file.name,
                        mimeType: file.type,
                        type: getAttachmentType(file.type),
                    };
                })
            );
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };
    
    const handleRemoveAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = () => {
        if ((text.trim() || attachments.length > 0) && !disabled) {
            onSendMessage(text, attachments);
            setText('');
            setAttachments([]);
        }
    };

    const handleSendRecording = () => {
        stopRecording();
        setIsRecordingMode(false);
    };

    const handleCancelRecording = () => {
        cancelRecording();
        setIsRecordingMode(false);
    };

    const handleMenuSelect = (type: 'image' | 'video' | 'file' | 'camera') => {
        setIsMenuOpen(false);
        switch(type) {
            case 'image': imageInputRef.current?.click(); break;
            case 'video': videoInputRef.current?.click(); break;
            case 'file': fileInputRef.current?.click(); break;
            case 'camera': cameraInputRef.current?.click(); break;
        }
    }

    const hasContent = text.trim().length > 0 || attachments.length > 0;

    if (isRecordingMode) {
        return (
            <div className="bg-slate-800 border-t border-slate-700 p-4 flex items-center gap-4 transition-all">
                <button onClick={handleCancelRecording} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <TrashIcon className="w-6 h-6" />
                </button>
                
                <div className="flex-1 flex items-center gap-2 bg-slate-700 rounded-full px-4">
                    <button onClick={togglePauseResume} className="p-2">
                        {isPaused ? <PlayIcon className="w-6 h-6 text-slate-300" /> : <PauseIcon className="w-6 h-6 text-red-500" />}
                    </button>

                    <div className="w-full h-8 flex items-center">
                       <Waveform audioData={audioData} />
                    </div>

                    <span className="font-mono text-slate-300 min-w-[50px] text-right">{formatTime(recordingTime)}</span>
                </div>

                <button 
                    onClick={handleSendRecording} 
                    className="bg-green-500 p-3 rounded-full text-white hover:bg-green-400 transition-colors"
                >
                    <SendIcon className="w-6 h-6" />
                </button>
            </div>
        )
    }

    return (
        <div className="bg-slate-800 border-t border-slate-700">
            <AttachmentPreview attachments={attachments} onRemove={handleRemoveAttachment} />
            <div className={`p-4 flex items-center gap-2 ${disabled ? 'opacity-50' : ''}`}>
                <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(prev => !prev)} 
                        className="p-2 rounded-full hover:bg-slate-700 transition-colors disabled:cursor-not-allowed"
                        disabled={disabled}
                    >
                        <PaperclipIcon className="w-6 h-6 text-slate-400" />
                    </button>
                    {isMenuOpen && <AttachmentMenu onSelect={handleMenuSelect} />}
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple disabled={disabled} />
                <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" className="hidden" multiple disabled={disabled} />
                <input type="file" ref={videoInputRef} onChange={handleFileChange} accept="video/*" className="hidden" multiple disabled={disabled} />
                <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" disabled={disabled} />

                <div className="flex-1 bg-slate-700 rounded-full flex items-center px-4">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                        placeholder={disabled ? "Waiting for response..." : "Message..."}
                        className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none py-2 disabled:cursor-not-allowed"
                        disabled={disabled}
                    />
                </div>
                {hasContent ? (
                    <button 
                        onClick={handleSend} 
                        className="bg-blue-600 p-2 rounded-full text-white hover:bg-blue-500 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
                        disabled={disabled}
                    >
                        <SendIcon className="w-6 h-6" />
                    </button>
                ) : (
                    <button 
                        onClick={() => setIsRecordingMode(true)}
                        className={`p-2 rounded-full transition-colors bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed`}
                        disabled={disabled}
                    >
                        <MicIcon className="w-6 h-6 text-white" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatInput;