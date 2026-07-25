import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const css = readFileSync(`${repoRoot}/index.css`, 'utf8');
const tailwindSource = readFileSync(`${repoRoot}/tailwind.config.js`, 'utf8').replace(
  /^export default/m,
  'module.exports ='
);
const tailwindModule: { exports: unknown } = { exports: {} };
runInNewContext(tailwindSource, {
  module: tailwindModule,
  exports: tailwindModule.exports,
  require: () => ({}),
});
const tailwindConfig = tailwindModule.exports as {
  theme: { extend: { colors: Record<string, string | Record<string, string>> } };
};
const tailwindColors = tailwindConfig.theme.extend.colors;

const expectedTokens = {
  ivory: '#FAF6EE',
  cream: '#FFFDF6',
  terracotta: '#943B2F',
  'sage-dark': '#5D6A42',
  'mustard-soft': '#F0DCA8',
  ink: '#1F1B14',
  'ink-soft': '#5A4F3F',
  'ink-muted': '#6F6250',
  'ink-faint': '#8B7F6C',
  'gold-readable': '#6F521F',
  line: '#E5DDD0',
  'line-strong': '#C7BDA8',
  'line-control': '#8B7F6C',
} as const;

function cssToken(name: string) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  return match?.[1]?.toUpperCase();
}

function tailwindToken(name: keyof typeof expectedTokens) {
  if (name === 'terracotta') return (tailwindColors.terracotta as Record<string, string>).DEFAULT;
  if (name === 'sage-dark') return (tailwindColors.sage as Record<string, string>).dark;
  if (name === 'mustard-soft') return (tailwindColors.mustard as Record<string, string>).soft;
  if (name === 'ink') return (tailwindColors.ink as Record<string, string>).DEFAULT;
  if (name === 'ink-soft') return (tailwindColors.ink as Record<string, string>).soft;
  if (name === 'ink-muted') return (tailwindColors.ink as Record<string, string>).muted;
  if (name === 'ink-faint') return (tailwindColors.ink as Record<string, string>).faint;
  if (name === 'line') return (tailwindColors.line as Record<string, string>).DEFAULT;
  if (name === 'line-strong') return (tailwindColors.line as Record<string, string>).strong;
  if (name === 'line-control') return (tailwindColors.line as Record<string, string>).control;
  return tailwindColors[name];
}

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((value) => parseInt(value, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function composite(foreground: string, background: string, alpha: number) {
  const foregroundChannels = foreground.slice(1).match(/.{2}/g)!.map((value) => parseInt(value, 16));
  const backgroundChannels = background.slice(1).match(/.{2}/g)!.map((value) => parseInt(value, 16));
  const channels = foregroundChannels.map((value, index) =>
    Math.round(value * alpha + backgroundChannels[index] * (1 - alpha))
  );
  return `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

describe('design token accessibility contract', () => {
  it('keeps CSS and Tailwind palette values synchronized', () => {
    for (const [name, value] of Object.entries(expectedTokens)) {
      expect(cssToken(name), `CSS token --${name}`).toBe(value.toUpperCase());
      expect(tailwindToken(name as keyof typeof expectedTokens), `Tailwind token ${name}`).toBe(value);
    }
  });

  it('maintains AA contrast for normal informational text', () => {
    expect(contrast(expectedTokens['ink-muted'], expectedTokens.ivory)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(expectedTokens['ink-muted'], expectedTokens.cream)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(expectedTokens['gold-readable'], expectedTokens.cream)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(expectedTokens.cream, expectedTokens.ink)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(expectedTokens.cream, expectedTokens['sage-dark'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(expectedTokens['mustard-soft'], expectedTokens.terracotta)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(composite(expectedTokens.cream, expectedTokens.ink, 0.55), expectedTokens.ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('maintains non-text contrast for control boundaries and focus', () => {
    expect(contrast(expectedTokens['line-control'], expectedTokens.cream)).toBeGreaterThanOrEqual(3);
    expect(contrast(expectedTokens.cream, expectedTokens.ink)).toBeGreaterThanOrEqual(3);
  });
});
