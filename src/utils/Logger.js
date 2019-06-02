export class Logger {
  log(...args) {
    const message = args[0];
    const tags = args.slice(1).map((tag) => `[${tag}]`);
    console.log(...tags, message);
  }
  
  logError(...args) {
    const tags = args.length > 1 
      ? args.slice(0, -1).map((tags) => `[${tags}]`) 
      : [];
    console.error('[Error]', ...tags, args[args.length - 1]);
  }
}