
import React from 'react';
import { ImageIcon, VideoIcon, CameraIcon, FileIcon } from './icons';

interface AttachmentMenuProps {
  onSelect: (type: 'image' | 'video' | 'file' | 'camera') => void;
}

const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ onSelect }) => {
  const menuItems = [
    { type: 'image', icon: ImageIcon, label: 'Image' },
    { type: 'video', icon: VideoIcon, label: 'Video' },
    { type: 'camera', icon: CameraIcon, label: 'Camera' },
    { type: 'file', icon: FileIcon, label: 'File' },
  ] as const;

  return (
    <div className="absolute bottom-full mb-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
      <ul className="divide-y divide-slate-700">
        {menuItems.map(({ type, icon: Icon, label }) => (
          <li key={type}>
            <button
              onClick={() => onSelect(type)}
              className="w-full flex items-center gap-3 p-3 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttachmentMenu;
