
import React from 'react';
import { Attachment } from '../types';
import { XIcon, FileIcon } from './icons';

interface AttachmentPreviewProps {
    attachments: Attachment[];
    onRemove: (index: number) => void;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachments, onRemove }) => {
    if (attachments.length === 0) return null;

    return (
        <div className="p-2 border-t border-slate-700">
            <div className="flex flex-wrap gap-2">
                {attachments.map((att, index) => (
                    <div key={index} className="relative w-20 h-20 bg-slate-700 rounded-lg overflow-hidden">
                         {att.type === 'image' && <img src={att.data} alt={att.name} className="w-full h-full object-cover" />}
                         {att.type === 'video' && <video src={att.data} className="w-full h-full object-cover" />}
                         {att.type === 'audio' && <div className="w-full h-full flex items-center justify-center"><FileIcon className="w-8 h-8 text-slate-400"/></div>}
                         {att.type === 'file' && <div className="w-full h-full flex items-center justify-center"><FileIcon className="w-8 h-8 text-slate-400"/></div>}
                        
                        <button onClick={() => onRemove(index)} className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white hover:bg-black/75 transition-colors">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AttachmentPreview;
