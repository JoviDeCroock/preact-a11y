import { rmSync } from 'node:fs';
import { dts } from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

rmSync(new URL('./dist', import.meta.url), { force: true, recursive: true });

const input = {
  index: 'src/index.ts',
  components: 'src/components.ts',
};

const external = (id) => id === 'preact' || id.startsWith('preact/');

const runtime = {
  input,
  external,
  plugins: [esbuild({ target: 'es2022' })],
  output: [
    {
      dir: 'dist',
      format: 'es',
      entryFileNames: '[name].js',
      chunkFileNames: 'chunks/[name]-[hash].js',
      sourcemap: true,
    },
    {
      dir: 'dist',
      format: 'cjs',
      entryFileNames: '[name].cjs',
      chunkFileNames: 'chunks/[name]-[hash].cjs',
      exports: 'named',
      sourcemap: true,
    },
  ],
};

const declarations = {
  input,
  external,
  plugins: [dts()],
  output: {
    dir: 'dist',
    format: 'es',
    entryFileNames: '[name].d.ts',
  },
};

export default [runtime, declarations];
