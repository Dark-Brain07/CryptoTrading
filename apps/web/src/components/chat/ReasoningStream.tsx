'use client';

import React from 'react';
import { CheckCircle2, Loader2, Clock, AlertCircle } from 'lucide-react';
import { ExecutionStep } from '@baseindex/shared';

interface ReasoningStreamProps {
  steps: ExecutionStep[];
}

export function ReasoningStream({ steps }: ReasoningStreamProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-3 p-3.5 rounded-xl bg-obsidian-900/90 border border-obsidian-border text-xs space-y-2.5">
      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-obsidian-border/50">
        <span className="w-1.5 h-1.5 rounded-full bg-base-blue animate-ping" />
        Agent Execution Pipeline
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-2.5">
            <div className="mt-0.5">
              {step.status === 'completed' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-roi" />
              )}
              {step.status === 'in_progress' && (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              )}
              {step.status === 'pending' && (
                <Clock className="w-4 h-4 text-slate-600" />
              )}
              {step.status === 'failed' && (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
            </div>

            <div className="flex-1">
              <div className="text-slate-800 dark:text-slate-200 font-medium">{step.title}</div>
              {step.detail && (
                <div className="text-slate-500 dark:text-slate-400 text-[11px] font-mono mt-0.5">
                  {step.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
