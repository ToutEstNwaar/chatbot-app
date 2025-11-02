
import React from 'react';
import { ChatSession } from '../types';
import { XIcon } from './icons';

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, sessions, activeSessionId, onSelectSession }) => {
    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <div className={`fixed top-0 left-0 h-full w-72 bg-slate-800 shadow-xl z-50 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold">Chat History</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-2">
                    {sessions.length > 0 ? (
                        <ul>
                            {sessions.map(session => (
                                <li key={session.id}>
                                    <button 
                                        onClick={() => onSelectSession(session.id)}
                                        className={`w-full text-left p-2 rounded-md truncate transition-colors ${session.id === activeSessionId ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
                                    >
                                        {session.title}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-400 text-center p-4">No chats yet.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default HistoryPanel;
