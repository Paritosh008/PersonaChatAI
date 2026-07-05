/**
 * CliResponder — handles built-in CLI commands for each persona terminal.
 * Pre-defined responses that don't require LLM calls.
 *
 * Commands:
 *   whoami            — persona identity
 *   about             — full bio (README.md)
 *   name              — just the name
 *   bio               — one-line bio from profile.json
 *   skills / expertise — list of expertise areas
 *   building          — what they're currently building (hitesh)
 *   links / socials   — all social links
 *   youtube           — YouTube channel info
 *   js playlist       — JavaScript playlist on Chai aur Code
 *   courses           — list of courses
 *   products          — products and offerings
 *   platforms         — teaching platforms
 *   ls                — list available files
 *   help              — all commands
 *   clear             — clear the terminal
 */

import * as fs from 'fs';
import * as path from 'path';
import { PersonaId } from '../types';

// Path: src/services → src → backend → ai-persona-chat → personas
const PERSONAS_DIR = path.join(__dirname, '..', '..', '..', 'personas');

const folderMap: Record<PersonaId, string> = {
  hitesh: 'hitesh-choudhary',
  piyush: 'piyush-garg',
};

// ─── helpers ────────────────────────────────────────────────────────────────

function readFile(personaId: PersonaId, ...fileParts: string[]): string {
  const filePath = path.join(PERSONAS_DIR, folderMap[personaId], ...fileParts);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return `[File not found: ${fileParts.join('/')}]`;
}

function readJsonFile(
  personaId: PersonaId,
  ...fileParts: string[]
): Record<string, unknown> | null {
  const filePath = path.join(PERSONAS_DIR, folderMap[personaId], ...fileParts);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function loadProfile(personaId: PersonaId): Record<string, unknown> | null {
  return readJsonFile(personaId, 'about', 'profile.json');
}

function readSocials(personaId: PersonaId): string {
  const txtPath = path.join(PERSONAS_DIR, folderMap[personaId], 'connect', 'socials.txt');
  if (fs.existsSync(txtPath)) {
    return fs.readFileSync(txtPath, 'utf-8');
  }
  const data = readJsonFile(personaId, 'connect', 'socials.json');
  if (data && data.socials && typeof data.socials === 'object') {
    const lines = [`${data.educator as string} — Social Links`, '='.repeat(40)];
    for (const [key, val] of Object.entries(data.socials as Record<string, string>)) {
      if (val && !val.startsWith('ADD_')) {
        lines.push(`${key.padEnd(16)}: ${val}`);
      }
    }
    return lines.join('\n');
  }
  return '[No social links found]';
}

// ─── Persona-specific static data ───────────────────────────────────────────

const JS_PLAYLISTS: Record<PersonaId, string> = {
  hitesh: [
    'JavaScript Playlists — Chai aur Code',
    '======================================',
    '',
    '  ☕ JavaScript Chai aur Code (Hindi)',
    '     https://www.youtube.com/playlist?list=PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37',
    '',
    '  ☕ JavaScript in Hindi — Complete Course',
    '     https://www.youtube.com/@chaiaurcode/playlists',
    '',
    '  ☕ 30 Days of JavaScript Challenge',
    '     Search: "30 days javascript hitesh" on YouTube',
    '',
  
  ].join('\n'),

  piyush: [
    'JavaScript / Node.js Playlists — Piyush Garg',
    '==============================================',
    '',
    '  ⚡ JavaScript Complete Course',
    '     https://www.youtube.com/@piyushgargdev/playlists',
    '',
    '  ⚡ Node.js Complete Course',
    '     Search: "node.js complete course piyush garg" on YouTube',
    '',
    '  ⚡ React.js Crash Course',
    '     https://www.youtube.com/@piyushgargdev/playlists',
    '',
    '  Full channel → https://www.youtube.com/@piyushgargdev',
  ].join('\n'),
};

// ─── Main handler ────────────────────────────────────────────────────────────

export function handleCliCommand(personaId: PersonaId, input: string): string | null {
  const cmd = input.trim().toLowerCase();

  // ── whoami ──────────────────────────────────────────────────────────────
  if (cmd === 'whoami') {
    const p = loadProfile(personaId);
    if (p) {
      return [
        `${p.name as string}`,
        `${p.title as string}`,
        `${p.website as string}`,
        `Location: ${p.location as string}`,
      ].join('\n');
    }
    return personaId === 'hitesh' ? 'Hitesh Choudhary' : 'Piyush Garg';
  }

  // ── name — just the name ────────────────────────────────────────────────
  if (cmd === 'name') {
    const p = loadProfile(personaId);
    return p ? (p.name as string) : (personaId === 'hitesh' ? 'Hitesh Choudhary' : 'Piyush Garg');
  }

  // ── about / cat about.txt / cat readme.md ───────────────────────────────
  if (
    cmd === 'about' ||
    cmd === 'cat about.txt' ||
    cmd === 'cat readme.md' ||
    cmd === 'cat about'
  ) {
    return readFile(personaId, 'about', 'README.md');
  }

  // ── bio — one-liner from profile ────────────────────────────────────────
  if (cmd === 'bio' || cmd === 'cat bio') {
    const p = loadProfile(personaId);
    if (p) {
      const lines = [
        `Name   : ${p.name as string}`,
        `Title  : ${p.title as string}`,
        `Website: ${p.website as string}`,
        `Bio    : ${p.bio as string}`,
      ];
      if (p.youtubeSubs) {
        lines.push(`YouTube: ${(p.youtubeSubs as number).toLocaleString()}+ subscribers`);
      }
      if (p.totalVideos) {
        lines.push(`Videos : ${(p.totalVideos as number).toLocaleString()}+`);
      }
      return lines.join('\n');
    }
    return readFile(personaId, 'about', 'README.md');
  }

  // ── skills / expertise ──────────────────────────────────────────────────
  if (cmd === 'skills' || cmd === 'expertise' || cmd === 'stack') {
    const p = loadProfile(personaId);
    if (p && Array.isArray(p.expertise)) {
      const header = `${p.name as string} — Skills & Expertise`;
      const divider = '─'.repeat(header.length);
      const items = (p.expertise as string[]).map((s) => `  • ${s}`);
      return [header, divider, ...items].join('\n');
    }
    return '[No expertise data found]';
  }

  // ── building — what they're currently building ──────────────────────────
  if (cmd === 'building' || cmd === 'current' || cmd === 'projects') {
    const p = loadProfile(personaId);
    if (p) {
      if (Array.isArray(p.currentlyBuilding)) {
        const items = (p.currentlyBuilding as string[]).map((s) => `  → ${s}`);
        return [`Currently Building:`, ...items].join('\n');
      }
      if (p.bio) return p.bio as string;
    }
    return personaId === 'hitesh'
      ? 'Currently building: masterji.co, chaicode cohorts, new udemy series'
      : 'Currently building: courses on piyushgarg.dev';
  }

  // ── links / socials ─────────────────────────────────────────────────────
  if (cmd === 'links' || cmd === 'socials' || cmd === 'cat socials.txt') {
    return readSocials(personaId);
  }

  // ── youtube ─────────────────────────────────────────────────────────────
  if (cmd === 'youtube' || cmd === 'yt' || cmd === 'cat channels.yml') {
    return readFile(personaId, 'youtube', 'channels.yml');
  }

  // ── js playlist / javascript playlist ───────────────────────────────────
  if (
    cmd === 'js playlist' ||
    cmd === 'javascript playlist' ||
    cmd === 'playlist js' ||
    cmd === 'playlist javascript' ||
    cmd === 'jsplaylist' ||
    cmd === 'playlist'
  ) {
    return JS_PLAYLISTS[personaId];
  }

  // ── courses ─────────────────────────────────────────────────────────────
  if (cmd === 'courses' || cmd === 'cat courses.md') {
    return readFile(personaId, 'udemy', 'courses.md');
  }

  // ── products ────────────────────────────────────────────────────────────
  if (cmd === 'products' || cmd === 'cat products.json') {
    const data = readJsonFile(personaId, 'products', 'products.json');
    if (data && Array.isArray(data.products)) {
      const header = `${personaId === 'hitesh' ? 'Hitesh Choudhary' : 'Piyush Garg'} — Products`;
      const divider = '─'.repeat(header.length);
      const items = (data.products as Array<Record<string, unknown>>).map(
        (p) => `  • ${p.name}  [${p.type}]\n    ${p.url}`
      );
      return [header, divider, ...items].join('\n');
    }
    return readFile(personaId, 'products', 'products.json');
  }

  // ── platforms ───────────────────────────────────────────────────────────
  if (cmd === 'platforms' || cmd === 'cat platforms.json') {
    const data = readJsonFile(personaId, 'platform', 'platforms.json');
    if (data && Array.isArray(data.platforms)) {
      const header = 'Teaching Platforms';
      const divider = '─'.repeat(header.length);
      const items = (data.platforms as Array<Record<string, unknown>>).map(
        (p) => `  • ${p.name}\n    ${p.url}\n    ${p.description}`
      );
      return [header, divider, ...items].join('\n');
    }
    // hitesh has platforms.tsx not .json — fall back to hardcoded
    if (personaId === 'hitesh') {
      return [
        'Teaching Platforms — Hitesh Choudhary',
        '─────────────────────────────────────',
        '  • ChaiCode        https://chaicode.com',
        '  • Masterji.co     https://masterji.co',
        '  • Udemy           https://www.udemy.com/user/hitesh-choudhary/',
        '  • YouTube         https://www.youtube.com/@chaiaurcode',
      ].join('\n');
    }
    return '[No platform data found]';
  }

  // ── ls / dir ────────────────────────────────────────────────────────────
  if (cmd === 'ls' || cmd === 'ls -la' || cmd === 'dir') {
    return [
      'about/',
      '  README.md      — full bio',
      '  profile.json   — structured profile data',
      'youtube/',
      '  channels.yml   — YouTube channel info',
      'platform/',
      '  platforms.json — teaching platforms',
      'udemy/',
      '  courses.md     — course list',
      'products/',
      '  products.json  — products & offerings',
      'connect/',
      '  socials.txt    — social links',
      '  socials.json   — social links (structured)',
    ].join('\n');
  }

  // ── help ────────────────────────────────────────────────────────────────
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    const name = personaId === 'hitesh' ? 'Hitesh Choudhary' : 'Piyush Garg';
    return [
      `${name} Terminal — Available Commands`,
      '═'.repeat(42),
      '',
      '  whoami              — Persona identity (name, title, website)',
      '  name                — Just the name',
      '  about               — Full bio (README)',
      '  bio                 — One-line bio + stats',
      '  skills              — Expertise / tech stack',
      '  building            — What they\'re currently building',
      '',
      '  links               — All social & YouTube links',
      '  youtube             — YouTube channel details',
      '  js playlist         — JavaScript playlists',
      '  courses             — List of courses',
      '  products            — Products and offerings',
      '  platforms           — Teaching platforms',
      '',
      '  ls                  — List available data files',
      '  clear               — Clear the terminal',
      '  help                — Show this help',
      '',
      '  Or type any question → AI persona will answer!',
    ].join('\n');
  }

  // ── clear ───────────────────────────────────────────────────────────────
  if (cmd === 'clear' || cmd === 'cls') {
    return '__CLEAR__';
  }

  // ── not a CLI command — let LLM handle it ───────────────────────────────
  return null;
}
