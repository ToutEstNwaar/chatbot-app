import React, { useState } from 'react';
import { Message, Attachment, GroundingChunk, UrlContextMetadata } from '../types';
import { FileIcon, LinkIcon, BrainCircuitIcon, CopyIcon, CheckIcon } from './icons';
import { SafetyRating, FinishReason } from '@google/genai';
import MarkdownRenderer from './MarkdownRenderer';

const AttachmentDisplay: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
    switch (attachment.type) {
        case 'image':
            return <img src={attachment.data} alt={attachment.name} className="max-w-xs rounded-lg mt-2" />;
        case 'video':
            return <video src={attachment.data} controls className="max-w-xs rounded-lg mt-2" />;
        case 'audio':
            return <audio src={attachment.data} controls className="w-full max-w-xs mt-2" />;
        case 'file':
            return (
                <a href={attachment.data} download={attachment.name} className="flex items-center gap-2 bg-slate-700 p-2 rounded-lg mt-2 hover:bg-slate-600 transition-colors">
                    <FileIcon className="w-6 h-6 text-slate-300" />
                    <span className="truncate text-sm">{attachment.name}</span>
                </a>
            );
        default:
            return null;
    }
};

const GroundingSources: React.FC<{ chunks: GroundingChunk[] }> = ({ chunks }) => {
    const webChunks = chunks.filter(chunk => chunk.web && chunk.web.uri);

    if (webChunks.length === 0) {
        return null;
    }

    return (
        <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Sources</h4>
            <ul className="space-y-1">
                {webChunks.map((chunk, index) => (
                    <li key={index}>
                        <a
                            href={chunk.web!.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 text-sm text-blue-300 hover:text-blue-200 hover:underline"
                        >
                            <LinkIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="truncate">{chunk.web!.title || new URL(chunk.web!.uri).hostname}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const UrlContextSources: React.FC<{ metadata: UrlContextMetadata }> = ({ metadata }) => {
    if (!metadata || !metadata.urlMetadata || metadata.urlMetadata.length === 0) {
        return null;
    }

    const formatStatus = (status: string) => {
        switch (status) {
            case 'URL_RETRIEVAL_STATUS_SUCCESS':
                return { text: 'Success', color: 'text-green-400' };
            case 'URL_RETRIEVAL_STATUS_UNSAFE':
                return { text: 'Unsafe', color: 'text-red-400' };
            default:
                const formattedText = status.replace('URL_RETRIEVAL_STATUS_', '').replace(/_/g, ' ');
                return { text: formattedText.charAt(0) + formattedText.slice(1).toLowerCase(), color: 'text-yellow-400' };
        }
    };

    return (
        <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2">URL Context</h4>
            <ul className="space-y-1">
                {metadata.urlMetadata.map((item, index) => {
                    const status = formatStatus(item.urlRetrievalStatus);
                    return (
                        <li key={index} className="flex items-start gap-2 text-sm">
                            <LinkIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
                            <div className="flex-1">
                                <a
                                    href={item.retrievedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-300 hover:text-blue-200 hover:underline break-all"
                                >
                                    {item.retrievedUrl}
                                </a>
                                <span className={`ml-2 text-xs font-medium ${status.color}`}>({status.text})</span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};


const ThinkingDetails: React.FC<{
    finishReason?: FinishReason;
    safetyRatings?: SafetyRating[];
    tokenCount?: number;
    thoughtSummary?: string;
}> = ({ finishReason, safetyRatings, tokenCount, thoughtSummary }) => {

    const formatFinishReason = (reason?: FinishReason) => {
        if (!reason) return 'Unknown';
        switch (reason) {
            case 'STOP': return 'Completed normally';
            case 'MAX_TOKENS': return 'Stopped: Output limit reached';
            case 'SAFETY': return 'Stopped: Safety concerns';
            case 'RECITATION': return 'Stopped: Recitation concerns';
            case 'OTHER': return 'Stopped: Other reason';
            default: return reason;
        }
    };

    const formatSafetyRatings = (ratings?: SafetyRating[]) => {
        if (!ratings || ratings.length === 0) return 'Not evaluated';
        const harmfulRatings = ratings.filter(r => r.probability !== 'NEGLIGIBLE');
        if (harmfulRatings.length === 0) {
            return 'All categories passed';
        }
        return harmfulRatings.map(r => `${r.category.replace('HARM_CATEGORY_', '')}: ${r.probability}`).join(', ');
    };

    return (
        <div className="text-xs text-slate-300 space-y-3">
            {thoughtSummary && (
                <div>
                    <h5 className="font-semibold mb-1.5">Thought Summary</h5>
                    <p className="text-slate-400 whitespace-pre-wrap">{thoughtSummary}</p>
                </div>
            )}
            <div>
                <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold col-span-1">Finish Reason:</span>
                    <span className="col-span-2 break-words">{formatFinishReason(finishReason)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold col-span-1">Safety:</span>
                    <span className="col-span-2 break-words">{formatSafetyRatings(safetyRatings)}</span>
                </div>
                {typeof tokenCount === 'number' && (
                    <div className="grid grid-cols-3 gap-2">
                        <span className="font-semibold col-span-1">Tokens Used:</span>
                        <span className="col-span-2 break-words">{tokenCount}</span>
                    </div>
                )}
            </div>
        </div>
    );
};


const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const [isThinkingVisible, setIsThinkingVisible] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const isUser = message.role === 'user';
    const hasThinkingDetails = !isUser && (message.finishReason || message.safetyRatings || typeof message.tokenCount === 'number' || message.thoughtSummary);
    const hasGrounding = !isUser && message.groundingChunks && message.groundingChunks.length > 0;
    const hasUrlContext = !isUser && message.urlContextMetadata && message.urlContextMetadata.urlMetadata && message.urlContextMetadata.urlMetadata.length > 0;
    const hasFooter = hasThinkingDetails || hasGrounding || hasUrlContext;

    const handleCopy = () => {
      if (message.text) {
        navigator.clipboard.writeText(message.text).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      }
    };

    if (message.isLoading) {
        return (
            <div className="flex justify-start">
                <div className="bg-slate-700 rounded-lg p-3 max-w-lg">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 rounded-full animate-pulse bg-slate-400"></div>
                        <div className="w-2 h-2 rounded-full animate-pulse bg-slate-400 [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 rounded-full animate-pulse bg-slate-400 [animation-delay:0.4s]"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`rounded-lg p-3 max-w-lg ${isUser ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100'}`}>
                {message.attachments?.map((att, index) => (
                    <AttachmentDisplay key={index} attachment={att} />
                ))}
                {message.text && (
                    isUser
                        ? <p className="whitespace-pre-wrap">{message.text}</p>
                        : <MarkdownRenderer content={message.text} />
                )}
                
                {hasFooter && (
                    <div className="mt-3 pt-3 border-t border-slate-600/50 space-y-3">
                        {hasThinkingDetails && (
                            <div>
                                <button
                                    onClick={() => setIsThinkingVisible(!isThinkingVisible)}
                                    className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors w-full"
                                    aria-expanded={isThinkingVisible}
                                    aria-controls={`thinking-details-${message.id}`}
                                >
                                    <BrainCircuitIcon className="w-5 h-5" />
                                    <span>Model Details</span>
                                    <svg className={`w-4 h-4 ml-auto transition-transform ${isThinkingVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {isThinkingVisible && (
                                    <div className="mt-2 pl-7">
                                        <ThinkingDetails 
                                            finishReason={message.finishReason}
                                            safetyRatings={message.safetyRatings}
                                            tokenCount={message.tokenCount}
                                            thoughtSummary={message.thoughtSummary}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        {hasGrounding && message.groundingChunks && (
                            <GroundingSources chunks={message.groundingChunks} />
                        )}
                        {hasUrlContext && message.urlContextMetadata && (
                            <UrlContextSources metadata={message.urlContextMetadata} />
                        )}
                    </div>
                )}
            </div>
            {!isUser && !message.isLoading && message.text && (
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                    aria-label={isCopied ? "Copied!" : "Copy response"}
                >
                    {isCopied ? <CheckIcon className="w-3.5 h-3.5 text-green-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied!" : "Copy"}</span>
                </button>
            )}
        </div>
    );
};

export default MessageBubble;