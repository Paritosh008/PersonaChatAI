import React from 'react';
import { Message, PersonaId, PERSONAS } from '../types';

interface MessageBubbleProps {
  message: Message;
  personaId: PersonaId;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Render code blocks inside message content
function renderContent(content: string): React.ReactNode {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const lines = part.slice(3, -3).split('\n');
      const lang = lines[0].trim();
      const code = lines.slice(1).join('\n');
      return (
        <pre
          key={i}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 my-2 text-xs font-mono overflow-x-auto text-green-300"
        >
          {lang && <div className="text-neutral-500 text-xs mb-1">{lang}</div>}
          <code>{code}</code>
        </pre>
      );
    }
    return (
      <span key={i} className="whitespace-pre-wrap">
        {part}
      </span>
    );
  });
}

export default function MessageBubble({ message, personaId }: MessageBubbleProps) {
  const persona = PERSONAS[personaId];
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 message-appear ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          isUser
            ? 'bg-neutral-700 text-white'
            : personaId === 'hitesh'
            ? 'bg-orange-500 text-white'
            : 'bg-blue-500 text-white'
        }`}
      >
        {isUser ? 'You' : persona.avatar}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-neutral-700 text-white rounded-tr-sm'
            : personaId === 'hitesh'
            ? 'bg-orange-950/40 border border-orange-900/50 text-neutral-100 rounded-tl-sm'
            : 'bg-blue-950/40 border border-blue-900/50 text-neutral-100 rounded-tl-sm'
        }`}
      >
        {!isUser && (
          <div
            className={`text-xs font-semibold mb-1 ${
              personaId === 'hitesh' ? 'text-orange-400' : 'text-blue-400'
            }`}
          >
            {persona.shortName}
          </div>
        )}
        <div>{renderContent(message.content)}</div>
        <div className="text-xs text-neutral-500 mt-1 text-right">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
