import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PersonaId, PERSONAS } from '../types';
import { streamChat } from '../services/api';

interface TerminalProps {
  personaId: PersonaId;
}

interface TerminalLine {
  id: string;
  type: 'prompt' | 'output' | 'error' | 'streaming';
  content: string;
}

const BOOT_MESSAGE: Record<PersonaId, string[]> = {
  hitesh: [
    'Chai aur Code OS v1.0.0',
    'Welcome, yaar! ☕ Type `help` to see commands.',
    'Ya seedha koi question pooch — main hoon na!',
    '',
  ],
  piyush: [
    'piyushgarg.dev Terminal v1.0.0',
    'Let\'s build this. ⚡ Type `help` to see commands.',
    'Or just ask anything — directly.',
    '',
  ],
};

export default function Terminal({ personaId }: TerminalProps) {
  const persona = PERSONAS[personaId];
  const [lines, setLines] = useState<TerminalLine[]>(() =>
    BOOT_MESSAGE[personaId].map((content, i) => ({
      id: `boot-${i}`,
      type: 'output' as const,
      content,
    }))
  );
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Focus input when clicking anywhere in terminal
  const focusInput = () => inputRef.current?.focus();

  function addLine(type: TerminalLine['type'], content: string) {
    setLines((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, type, content },
    ]);
  }

  function clearTerminal() {
    setLines(
      BOOT_MESSAGE[personaId].map((content, i) => ({
        id: `boot-clear-${i}-${Date.now()}`,
        type: 'output' as const,
        content,
      }))
    );
  }

  const handleSubmit = useCallback(
    async (cmd: string) => {
      if (!cmd.trim() || isStreaming) return;

      // Echo the command as a prompt line
      addLine('prompt', `${persona.promptPrefix} ${cmd}`);
      setHistory((prev) => [cmd, ...prev.slice(0, 49)]);
      setHistoryIndex(-1);

      const lower = cmd.trim().toLowerCase();

      // clear command handled client-side
      if (lower === 'clear' || lower === 'cls') {
        clearTerminal();
        return;
      }

      setIsStreaming(true);

      // Build messages for API
      const newChatHistory = [
        ...chatHistory,
        { role: 'user' as const, content: cmd },
      ];

      let streamingId = `streaming-${Date.now()}`;
      let accumulated = '';

      const cancel = streamChat(
        personaId,
        newChatHistory,
        // onToken — SSE streaming
        (token) => {
          accumulated += token;
          setLines((prev) => {
            const existing = prev.find((l) => l.id === streamingId);
            if (existing) {
              return prev.map((l) =>
                l.id === streamingId ? { ...l, content: accumulated } : l
              );
            }
            return [...prev, { id: streamingId, type: 'streaming', content: accumulated }];
          });
        },
        // onComplete
        (fullText) => {
          setLines((prev) =>
            prev.map((l) =>
              l.id === streamingId ? { ...l, type: 'output', content: fullText } : l
            )
          );
          setChatHistory([
            ...newChatHistory,
            { role: 'assistant', content: fullText },
          ]);
          setIsStreaming(false);
        },
        // onCliResponse (pre-defined command output)
        (output) => {
          if (output === '__CLEAR__') {
            clearTerminal();
          } else {
            addLine('output', output);
          }
          setIsStreaming(false);
        },
        // onError
        (errMsg) => {
          addLine('error', `Error: ${errMsg}`);
          setIsStreaming(false);
        }
      );

      cancelRef.current = cancel;
    },
    [personaId, isStreaming, chatHistory, persona.promptPrefix]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const cmd = input;
      setInput('');
      handleSubmit(cmd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      setInput(history[newIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      setInput(newIndex === -1 ? '' : history[newIndex]);
    } else if (e.key === 'c' && e.ctrlKey) {
      if (cancelRef.current) cancelRef.current();
      setIsStreaming(false);
      addLine('output', '^C');
    }
  }

  const accentColor = personaId === 'hitesh' ? 'text-orange-400' : 'text-blue-400';
  const borderColor = personaId === 'hitesh' ? 'border-orange-900/40' : 'border-blue-900/40';
  const bgTint = personaId === 'hitesh' ? 'bg-orange-950/10' : 'bg-blue-950/10';

  return (
    <div
      className={`flex flex-col h-full rounded-xl border ${borderColor} ${bgTint} overflow-hidden`}
      onClick={focusInput}
    >
      {/* Terminal header bar */}
      <div className={`flex items-center gap-2 px-4 py-2 bg-neutral-900 border-b ${borderColor}`}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className={`text-xs font-mono ml-2 ${accentColor}`}>
          {persona.promptPrefix.split(':')[0]}
        </span>
        <span className="text-xs text-neutral-500 ml-auto font-mono">
          {persona.tagline}
        </span>
      </div>

      {/* Terminal output area */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 min-h-0">
        {lines.map((line) => (
          <div key={line.id} className="leading-relaxed">
            {line.type === 'prompt' ? (
              <div>
                <span className={`${accentColor} font-semibold`}>
                  {line.content.split(' ')[0]}{' '}
                </span>
                <span className="text-neutral-300">
                  {line.content.split(' ').slice(1).join(' ')}
                </span>
              </div>
            ) : line.type === 'error' ? (
              <div className="text-red-400">{line.content}</div>
            ) : (
              <div className="text-neutral-300 whitespace-pre-wrap">
                {line.content}
                {line.type === 'streaming' && (
                  <span className={`${accentColor} cursor-blink`}>▋</span>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input line */}
      <div className={`flex items-center gap-2 px-4 py-3 border-t ${borderColor} bg-neutral-900/50`}>
        <span className={`font-mono text-sm ${accentColor} whitespace-nowrap`}>
          {persona.promptPrefix}
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder={isStreaming ? 'Generating...' : 'Type a command or question...'}
          className="flex-1 bg-transparent outline-none font-mono text-sm text-neutral-200 placeholder-neutral-600 disabled:opacity-50"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        {isStreaming && (
          <div className={`w-2 h-4 ${personaId === 'hitesh' ? 'bg-orange-400' : 'bg-blue-400'} cursor-blink rounded-sm`} />
        )}
      </div>
    </div>
  );
}
