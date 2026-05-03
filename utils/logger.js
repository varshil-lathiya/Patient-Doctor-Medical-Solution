const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const ACTIVE = LEVELS[process.env.LOG_LEVEL] ?? (process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug);

function log(level, context, message, meta = {}) {
  if (LEVELS[level] > ACTIVE) return;
  const entry = {
    ts: new Date().toISOString(),
    level: level.toUpperCase(),
    context,
    message,
    ...meta,
  };
  const out = JSON.stringify(entry);
  level === 'error' ? console.error(out) : console.log(out);
}

const logger = {
  info:  (ctx, msg, meta) => log('info',  ctx, msg, meta),
  warn:  (ctx, msg, meta) => log('warn',  ctx, msg, meta),
  error: (ctx, msg, meta) => log('error', ctx, msg, meta),
  debug: (ctx, msg, meta) => log('debug', ctx, msg, meta),
};

module.exports = logger;
