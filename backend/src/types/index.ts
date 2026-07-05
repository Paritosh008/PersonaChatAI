export type PersonaId = 'hitesh' | 'piyush';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  personaId: PersonaId;
  messages: Message[];
  sessionId?: string;
}

export interface PersonaProfile {
  personaId: string;
  name: string;
  title: string;
  website: string;
  bio: string;
  expertise: string[];
  persona: {
    languageStyle: string;
    tone: string;
    teachingApproach: string;
    signaturePhrases: string[];
    technicalDepth: string;
  };
  systemPrompt: string;
  fewShotExamples?: { user: string; assistant: string }[];
}

export interface CliCommand {
  command: string;
  output: string;
}
