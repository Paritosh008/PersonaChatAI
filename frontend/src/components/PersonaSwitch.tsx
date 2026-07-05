import React from 'react';
import { PersonaId, PERSONAS } from '../types';

interface PersonaSwitchProps {
  current: PersonaId;
  onChange: (id: PersonaId) => void;
}

export default function PersonaSwitch({ current, onChange }: PersonaSwitchProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-neutral-900 rounded-xl border border-neutral-800">
      {(['hitesh', 'piyush'] as PersonaId[]).map((id) => {
        const p = PERSONAS[id];
        const active = current === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              active
                ? id === 'hitesh'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <span className="text-base">{p.avatar}</span>
            <span>{p.shortName}</span>
          </button>
        );
      })}
    </div>
  );
}
