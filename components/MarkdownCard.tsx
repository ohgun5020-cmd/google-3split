import React, { useState } from "react";

interface MarkdownCardProps {
  title: string;
  content: string;
  type?: "prompt" | "negative" | "json";
}

export const MarkdownCard: React.FC<MarkdownCardProps> = ({ title, content, type = "prompt" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNegative = type === "negative";
  
  // Design Logic
  const containerClass = isNegative 
    ? "bg-red-50/50 border-red-100" 
    : "bg-gray-50/50 border-gray-100";
    
  const titleClass = isNegative
    ? "text-red-900/70"
    : "text-gray-900/70";

  const contentClass = isNegative
    ? "text-red-900"
    : "text-gray-800";

  return (
    <div className={`border rounded-2xl p-6 relative group transition-colors hover:bg-white hover:shadow-sm ${containerClass}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xs font-bold uppercase tracking-widest ${titleClass}`}>{title}</h3>
        <button
          onClick={handleCopy}
          className={`
            text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5
            ${copied 
              ? "bg-green-500 text-white shadow-md shadow-green-200" 
              : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 hover:shadow-sm"}
          `}
        >
          <i className={`fas ${copied ? "fa-check" : "fa-copy"}`}></i>
          {copied ? "복사완료" : "복사하기"}
        </button>
      </div>
      <div className={`font-mono text-sm whitespace-pre-wrap break-words leading-relaxed ${contentClass}`}>
        {content}
      </div>
    </div>
  );
};