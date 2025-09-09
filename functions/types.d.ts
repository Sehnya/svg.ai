// Cloudflare Pages Functions types

interface Env {
  // Add any environment variables or bindings here
}

interface PagesFunction<Env = any> {
  (context: {
    request: Request;
    env: Env;
    params: Record<string, string>;
    waitUntil: (promise: Promise<any>) => void;
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    data: Record<string, any>;
  }): Response | Promise<Response>;
}
