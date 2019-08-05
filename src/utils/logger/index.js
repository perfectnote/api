const log = (...args) => {
  const message = args[0];
  const tags = args.slice(1).map((tag) => `[${tag}]`);
  console.log(...tags, message);
}

export default log;