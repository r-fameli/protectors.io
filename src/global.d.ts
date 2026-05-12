declare module 'throttle-debounce' {
  export function debounce<T extends (...args: unknown[]) => unknown>(delay: number, callback: T): T;
}

declare module '*.css';
