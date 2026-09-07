'use client';

import React from 'react';
import { Bot, User } from 'lucide-react';
import { AgentMessage } from '@baseindex/shared';
import { ReasoningStream } from './ReasoningStream';
import { ExecutionCard } from './ExecutionCard';

interface MessageBubbleProps {
  message: AgentMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 text-sm ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
          isUser
            ? 'bg-slate-700 text-white'
            : 'bg-base-blue text-white shadow-md shadow-base-blue/20'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Content */}
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-base-blue text-white rounded-tr-sm'
              : 'glass-panel text-slate-800 dark:text-slate-200 rounded-tl-sm border-obsidian-border'
          }`}
        >
          {/* Main text content */}
          <div className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>

          {/* Reasoning Steps if available */}
          {message.steps && message.steps.length > 0 && (
            <ReasoningStream steps={message.steps} />
          )}

          {/* Execution Card if trade confirmed */}
          {message.executionResult && (
            <ExecutionCard result={message.executionResult} />
          )}
        </div>

        <div className={`text-[10px] text-slate-500 mt-1 px-1 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
