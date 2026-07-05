import { useState } from 'react';
import { PersonaId, ViewMode, PERSONAS } from './types';
import PersonaSwitch from './components/PersonaSwitch';
import Terminal from './components/Terminal';
import ChatWindow from './components/ChatWindow';

export default function App() {
  const [persona, setPersona] = useState<PersonaId>('hitesh');
  const [view, setView] = useState<ViewMode>('terminal');

  const p = PERSONAS[persona];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-800 bg-neutral-900 flex-shrink-0 gap-2">

        {/* Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-orange-400 text-lg leading-none">☕</span>
          <span className="text-blue-400 text-lg leading-none">⚡</span>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-white leading-tight">AI Persona Chat</h1>
            <p className="text-xs text-neutral-500">Hitesh & Piyush — AI simulations</p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-neutral-800 rounded-lg flex-shrink-0">
          {(['terminal', 'chat'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === v
                  ? 'bg-neutral-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {v === 'terminal' ? '> Terminal' : '💬 Chat'}
            </button>
          ))}
        </div>

        {/* Persona switch (only relevant in Chat mode) */}
        <PersonaSwitch current={persona} onChange={setPersona} />
      </header>

      {/* ── Persona info bar ─────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 border-b border-neutral-800 text-xs flex-shrink-0 ${
          persona === 'hitesh' ? 'bg-orange-950/20' : 'bg-blue-950/20'
        }`}
      >
        <span className="text-base">{p.avatar}</span>
        <span className={`font-semibold ${p.color}`}>{p.name}</span>
        <span className="text-neutral-500 hidden sm:inline">{p.title}</span>
        <a
          href={p.website}
          target="_blank"
          rel="noopener noreferrer"
          className={`ml-auto ${p.color} hover:underline truncate max-w-[180px]`}
          title={p.website}
        >
          {p.website} ↗
        </a>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 p-3 sm:p-4">
        {view === 'terminal' ? (
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4"
            style={{ height: 'calc(100vh - 110px)' }}
          >
            {(['hitesh', 'piyush'] as PersonaId[]).map((pid) => (
              <div key={pid} className="flex flex-col min-h-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={pid === 'hitesh' ? 'text-orange-400' : 'text-blue-400'}>
                    {PERSONAS[pid].avatar}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      pid === 'hitesh' ? 'text-orange-400' : 'text-blue-400'
                    }`}
                  >
                    {PERSONAS[pid].name}
                  </span>
                </div>
                <div className="flex-1 min-h-0">
                  <Terminal personaId={pid} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ height: 'calc(100vh - 110px)' }}>
            <ChatWindow personaId={persona} />
          </div>
        )}
      </main>
    </div>
  );
}
