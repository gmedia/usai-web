/**
 * Code theme in the brand palette. Contrast of every token colour against
 * the #03110f frame background is ≥ 4.5:1 (WCAG AA for body text).
 */
import type { ThemeRegistration } from 'shiki';

export const usaiTheme: ThemeRegistration = {
  name: 'usai-dark',
  type: 'dark',
  colors: {
    'editor.background': '#03110f',
    'editor.foreground': '#dfe9e7',
  },
  tokenColors: [
    { settings: { foreground: '#dfe9e7' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7c9a94', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'keyword.control', 'keyword.operator.new'], settings: { foreground: '#5eead4' } },
    { scope: ['string', 'string.template', 'punctuation.definition.string'], settings: { foreground: '#a7f3d0' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: '#f2c572' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function'], settings: { foreground: '#e9fffb' } },
    { scope: ['variable.other.property', 'meta.object-literal.key', 'support.variable.property'], settings: { foreground: '#9fd8cf' } },
    { scope: ['entity.name.type', 'support.type', 'support.class', 'entity.name.class'], settings: { foreground: '#7de8d6' } },
    { scope: ['variable.parameter'], settings: { foreground: '#cfe3df' } },
    { scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: '#9db5b0' } },
  ],
};
