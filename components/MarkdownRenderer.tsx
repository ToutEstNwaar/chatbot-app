

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({...props}) => <h1 className="text-xl font-bold my-4" {...props} />,
        h2: ({...props}) => <h2 className="text-lg font-bold my-4" {...props} />,
        h3: ({...props}) => <h3 className="text-base font-bold my-3" {...props} />,
        p: ({...props}) => <p className="mb-4 last:mb-0" {...props} />,
        ul: ({...props}) => <ul className="list-disc list-inside mb-4" {...props} />,
        ol: ({...props}) => <ol className="list-decimal list-inside mb-4" {...props} />,
        li: ({...props}) => <li className="mb-1" {...props} />,
        // FIX: The `inline` prop is deprecated in recent versions of react-markdown.
        // Differentiate between block and inline code by checking for a language class match.
        code: ({node, className, children, ...props}) => {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
                <div className="relative">
                     <pre className="bg-slate-800 p-3 rounded-md my-2 overflow-x-auto text-sm font-mono">
                        <code className={className} {...props}>
                            {children}
                        </code>
                    </pre>
                </div>
            ) : (
                <code className="bg-slate-800 px-1.5 py-1 rounded-md text-sm font-mono" {...props}>
                    {children}
                </code>
            );
        },
        a: ({...props}) => <a className="text-blue-300 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
        table: ({...props}) => <div className="overflow-x-auto"><table className="table-auto w-full my-2 border-collapse border border-slate-600" {...props} /></div>,
        thead: ({...props}) => <thead className="bg-slate-600" {...props} />,
        th: ({...props}) => <th className="border border-slate-500 px-3 py-1.5 text-left" {...props} />,
        td: ({...props}) => <td className="border border-slate-500 px-3 py-1.5" {...props} />,
        blockquote: ({...props}) => <blockquote className="border-l-4 border-slate-500 pl-4 my-4 italic text-slate-300" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;