declare module 'throttle-debounce' {
  export function debounce<T extends (...args: unknown[]) => unknown>(delay: number, callback: T): T;
}

declare module 'shortid' {
  export default function shortid(): string;
}

declare module 'webpack-dev-middleware' {
  import { RequestHandler } from 'express';
  import { Compiler } from 'webpack';
  const middleware: (compiler: Compiler) => RequestHandler;
  export default middleware;
}

declare module '*.css';
