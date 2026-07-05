import React, { useState, useRef, useEffect } from 'react';
import { PersonaId, PERSONAS, Message } from '../types';
import { streamChat } from '../services/api';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
  personaId: PersonaId;
}

export default function ChatWindow({ personaId }: ChatWindowProps) {
  const persona = PERSONAS[personaId];
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Reset when persona changes
  useEffect(() => {
    setMessages([]);
    setStreamingText('');
    setIsStreaming(false);
  }, [personaId]);

  function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');

    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let accumulated = '';

    const cancel = streamChat(
      personaId,
      apiMessages,
      (token) => {
        accumulated += token;
        setStreamingText(accumulated);
      },
      (fullText) => {
        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: fullText,
          timestamp: Date.now(),
          type: 'chat',
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingText('');
        setIsStreaming(false);
      },
      // CLI responses in chat mode — just show as assistant message
      (output) => {
        const assistantMsg: Message = {
          id: `a-cli-${Date.now()}`,
          role: 'assistant',
          content: output,
          timestamp: Date.now(),
          type: 'cli',
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingText('');
        setIsStreaming(false);
      },
      (errMsg) => {
        const errMsgObj: Message = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${errMsg}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsgObj]);
        setStreamingText('');
        setIsStreaming(false);
      }
    );

    cancelRef.current = cancel;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const accentClass = personaId === 'hitesh'
    ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
    : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30';

  const borderColor = personaId === 'hitesh' ? 'border-orange-900/40' : 'border-blue-900/40';

  return (
    <div className={`flex flex-col h-full rounded-xl border ${borderColor} overflow-hidden`}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
            <div className="text-5xl">{persona.avatar}</div>
            <div>
              <p className="text-neutral-300 font-semibold">{persona.name}</p>
              <p className="text-neutral-500 text-sm">{persona.tagline}</p>
            </div>
            <p className="text-neutral-600 text-xs max-w-xs">
              Ask anything — JavaScript, career advice, project ideas...
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} personaId={personaId} />
        ))}

        {/* Streaming bubble */}
        {isStreaming && streamingText && (
          <MessageBubble
            personaId={personaId}
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingText,
              timestamp: Date.now(),
            }}
          />
        )}

        {/* Typing indicator before first token */}
        {isStreaming && !streamingText && (
          <div className="flex gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                personaId === 'hitesh' ? 'bg-orange-500' : 'bg-blue-500'
              } text-white`}
            >
              {persona.avatar}
            </div>
            <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${
              personaId === 'hitesh'
                ? 'bg-orange-950/40 border border-orange-900/50'
                : 'bg-blue-950/40 border border-blue-900/50'
            }`}>
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className={`border-t ${borderColor} p-3 bg-neutral-900/50`}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={`Ask ${persona.shortName} anything... (Enter to send, Shift+Enter for new line)`}
            rows={1}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-neutral-600 resize-none disabled:opacity-50 leading-relaxed"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${accentClass} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isStreaming ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-neutral-600 mt-1.5 px-1">
          ⚠️ AI-generated simulation — not actual communications from the real individual.
        </p>
      </div>
    </div>
  );
}
