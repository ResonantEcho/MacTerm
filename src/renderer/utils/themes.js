/**
 * themes.js — Theme engine
 *
 * Each theme defines CSS variable overrides and an xterm.js color palette.
 * Themes are applied by injecting a <style> tag into :root.
 * The active theme id is persisted in localStorage.
 */

export const THEMES = {
  dark: {
    id:    'dark',
    label: 'Dark (default)',
    vars: {
      '--bg-app':         '#1a1c20',
      '--bg-sidebar':     '#14161a',
      '--bg-tabbar':      '#111316',
      '--bg-terminal':    '#1a1c20',
      '--bg-surface':     '#22252b',
      '--bg-hover':       'rgba(255,255,255,0.045)',
      '--bg-active':      'rgba(46,204,138,0.14)',
      '--border':         'rgba(255,255,255,0.08)',
      '--border-accent':  'rgba(255,255,255,0.14)',
      '--text-primary':   '#e8e6e0',
      '--text-secondary': '#8a8880',
      '--text-muted':     '#555550',
      '--accent':         '#2ecc8a',
      '--accent-dim':     'rgba(46,204,138,0.18)',
      '--accent-blue':    '#4d9ef7',
      '--accent-amber':   '#f0a030',
      '--accent-red':     '#e05555',
      '--accent-purple':  '#a07ef0',
    },
    xterm: {
      background: '#1a1c20', foreground: '#e8e6e0', cursor: '#2ecc8a',
      black: '#1a1c20',  red: '#e05555',  green: '#2ecc8a',  yellow: '#f0a030',
      blue:  '#4d9ef7',  magenta: '#a07ef0', cyan: '#2ecccc', white: '#e8e6e0',
      brightBlack: '#555550', brightRed: '#ff6b6b', brightGreen: '#50e0a0',
      brightYellow: '#ffc060', brightBlue: '#6db4ff', brightMagenta: '#c09aff',
      brightCyan: '#50e0e0', brightWhite: '#ffffff',
    },
  },

  light: {
    id:    'light',
    label: 'Light',
    vars: {
      '--bg-app':         '#f5f5f2',
      '--bg-sidebar':     '#ebebе8',
      '--bg-tabbar':      '#e0e0dc',
      '--bg-terminal':    '#ffffff',
      '--bg-surface':     '#ffffff',
      '--bg-hover':       'rgba(0,0,0,0.05)',
      '--bg-active':      'rgba(16,130,70,0.12)',
      '--border':         'rgba(0,0,0,0.1)',
      '--border-accent':  'rgba(0,0,0,0.18)',
      '--text-primary':   '#1a1c1e',
      '--text-secondary': '#555560',
      '--text-muted':     '#999990',
      '--accent':         '#108246',
      '--accent-dim':     'rgba(16,130,70,0.14)',
      '--accent-blue':    '#1a6fd4',
      '--accent-amber':   '#c07000',
      '--accent-red':     '#c02020',
      '--accent-purple':  '#6040c0',
    },
    xterm: {
      background: '#ffffff', foreground: '#1a1c1e', cursor: '#108246',
      black: '#2a2c2e', red: '#c02020', green: '#108246', yellow: '#c07000',
      blue: '#1a6fd4', magenta: '#6040c0', cyan: '#107070', white: '#e0e0dc',
      brightBlack: '#888888', brightRed: '#e04040', brightGreen: '#20b060',
      brightYellow: '#e09020', brightBlue: '#3a8ef4', brightMagenta: '#8060e0',
      brightCyan: '#20a0a0', brightWhite: '#ffffff',
    },
  },

  dracula: {
    id:    'dracula',
    label: 'Dracula',
    vars: {
      '--bg-app':         '#282a36',
      '--bg-sidebar':     '#21222c',
      '--bg-tabbar':      '#191a21',
      '--bg-terminal':    '#282a36',
      '--bg-surface':     '#343746',
      '--bg-hover':       'rgba(255,255,255,0.05)',
      '--bg-active':      'rgba(80,250,123,0.14)',
      '--border':         'rgba(255,255,255,0.08)',
      '--border-accent':  'rgba(255,255,255,0.15)',
      '--text-primary':   '#f8f8f2',
      '--text-secondary': '#a0a0b0',
      '--text-muted':     '#606070',
      '--accent':         '#50fa7b',
      '--accent-dim':     'rgba(80,250,123,0.18)',
      '--accent-blue':    '#8be9fd',
      '--accent-amber':   '#ffb86c',
      '--accent-red':     '#ff5555',
      '--accent-purple':  '#bd93f9',
    },
    xterm: {
      background: '#282a36', foreground: '#f8f8f2', cursor: '#50fa7b',
      black: '#21222c', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
      blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2',
      brightBlack: '#6272a4', brightRed: '#ff6e6e', brightGreen: '#69ff94',
      brightYellow: '#ffffa5', brightBlue: '#d6acff', brightMagenta: '#ff92df',
      brightCyan: '#a4ffff', brightWhite: '#ffffff',
    },
  },

  solarized: {
    id:    'solarized',
    label: 'Solarized Dark',
    vars: {
      '--bg-app':         '#002b36',
      '--bg-sidebar':     '#073642',
      '--bg-tabbar':      '#00212b',
      '--bg-terminal':    '#002b36',
      '--bg-surface':     '#073642',
      '--bg-hover':       'rgba(255,255,255,0.05)',
      '--bg-active':      'rgba(42,161,152,0.18)',
      '--border':         'rgba(255,255,255,0.08)',
      '--border-accent':  'rgba(255,255,255,0.14)',
      '--text-primary':   '#839496',
      '--text-secondary': '#657b83',
      '--text-muted':     '#4a6068',
      '--accent':         '#2aa198',
      '--accent-dim':     'rgba(42,161,152,0.18)',
      '--accent-blue':    '#268bd2',
      '--accent-amber':   '#b58900',
      '--accent-red':     '#dc322f',
      '--accent-purple':  '#6c71c4',
    },
    xterm: {
      background: '#002b36', foreground: '#839496', cursor: '#2aa198',
      black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
      blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5',
      brightBlack: '#002b36', brightRed: '#cb4b16', brightGreen: '#586e75',
      brightYellow: '#657b83', brightBlue: '#839496', brightMagenta: '#6c71c4',
      brightCyan: '#93a1a1', brightWhite: '#fdf6e3',
    },
  },

  nord: {
    id:    'nord',
    label: 'Nord',
    vars: {
      '--bg-app':         '#2e3440',
      '--bg-sidebar':     '#272c36',
      '--bg-tabbar':      '#232830',
      '--bg-terminal':    '#2e3440',
      '--bg-surface':     '#3b4252',
      '--bg-hover':       'rgba(255,255,255,0.05)',
      '--bg-active':      'rgba(136,192,208,0.15)',
      '--border':         'rgba(255,255,255,0.07)',
      '--border-accent':  'rgba(255,255,255,0.13)',
      '--text-primary':   '#eceff4',
      '--text-secondary': '#9099a8',
      '--text-muted':     '#606878',
      '--accent':         '#88c0d0',
      '--accent-dim':     'rgba(136,192,208,0.18)',
      '--accent-blue':    '#81a1c1',
      '--accent-amber':   '#ebcb8b',
      '--accent-red':     '#bf616a',
      '--accent-purple':  '#b48ead',
    },
    xterm: {
      background: '#2e3440', foreground: '#eceff4', cursor: '#88c0d0',
      black: '#3b4252', red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b',
      blue: '#81a1c1', magenta: '#b48ead', cyan: '#88c0d0', white: '#e5e9f0',
      brightBlack: '#4c566a', brightRed: '#bf616a', brightGreen: '#a3be8c',
      brightYellow: '#ebcb8b', brightBlue: '#81a1c1', brightMagenta: '#b48ead',
      brightCyan: '#8fbcbb', brightWhite: '#eceff4',
    },
  },
};

const STORAGE_KEY = 'macterm-theme';
let _activeTheme = null;
let _listeners   = [];

/** Apply a theme by id, inject CSS variables into :root */
export function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES.dark;
  _activeTheme = theme;

  // Build CSS string
  const css = Object.entries(theme.vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');

  let style = document.getElementById('macterm-theme-vars');
  if (!style) {
    style = document.createElement('style');
    style.id = 'macterm-theme-vars';
    document.head.appendChild(style);
  }
  style.textContent = `:root {\n${css}\n}`;

  localStorage.setItem(STORAGE_KEY, themeId);
  _listeners.forEach(fn => fn(theme));
}

/** Get the currently active theme object */
export function getActiveTheme() {
  return _activeTheme || THEMES.dark;
}

/** Get the stored theme id, defaulting to 'dark' */
export function getSavedThemeId() {
  return localStorage.getItem(STORAGE_KEY) || 'dark';
}

/** Subscribe to theme changes. Returns unsubscribe fn. */
export function onThemeChange(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

/** Initialize theme on app start */
export function initTheme() {
  applyTheme(getSavedThemeId());
}
