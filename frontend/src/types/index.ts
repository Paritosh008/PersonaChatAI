export type PersonaId = 'hitesh' | 'piyush';
export type ViewMode = 'terminal' | 'chat';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type?: 'cli' | 'chat';
}

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  shortName: string;
  title: string;
  website: string;
  color: string;           // Tailwind accent color class
  bgColor: string;         // Terminal background tint
  promptPrefix: string;    // e.g. "hitesh@chai-aur-code:~$"
  avatar: string;          // Emoji or initials
  tagline: string;
}

export const PERSONAS: Record<PersonaId, PersonaConfig> = {
  hitesh: {
    id: 'hitesh',
    name: 'Hitesh Choudhary',
    shortName: 'Hitesh',
    title: 'Tech Educator • Chai aur Code',
    website: 'https://hitesh.ai/',
    color: 'text-orange-400',
    bgColor: 'bg-orange-950/20',
    promptPrefix: 'hitesh@chai-aur-code:~$',
    avatar: '☕',
    tagline: 'Chai peete peete seekhte hain',
  },
  piyush: {
    id: 'piyush',
    name: 'Piyush Garg',
    shortName: 'Piyush',
    title: 'Tech Educator • piyushgarg.dev',
    website: 'https://www.piyushgarg.dev/',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/20',
    promptPrefix: 'piyush@piyushgarg.dev:~$',
    avatar: '⚡',
    tagline: "Let's build this",
  },
};
