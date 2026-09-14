import { ENGLISH_NARRATIVE_TEMPLATES, NarrativeKey } from './en.keys';

export function t(key: string, params: Record<string, string> = {}): string {
  if (key in ENGLISH_NARRATIVE_TEMPLATES) {
    return ENGLISH_NARRATIVE_TEMPLATES[key as NarrativeKey](params);
  }
  // Generic fallback: replace {param} tokens
  return key.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
}
