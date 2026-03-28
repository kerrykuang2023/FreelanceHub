declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  const xss: RequestHandler;
  export default xss;
}

declare module 'hpp' {
  import { RequestHandler } from 'express';
  function hpp(options?: { whitelist?: string[] }): RequestHandler;
  export default hpp;
}
