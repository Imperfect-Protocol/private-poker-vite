import path from 'path';
import base from '../vite.config.js';

const mocks = path.resolve(import.meta.dirname, 'mocks.js');

export default {
  ...base,
  plugins: base.plugins.slice(0, 2),
  resolve: {
    alias: [
      { find: /^@\/hooks\/useAccounts$/, replacement: mocks },
      ...Object.entries(base.resolve.alias).map(([find, replacement]) => ({ find, replacement })),
    ],
  },
};
