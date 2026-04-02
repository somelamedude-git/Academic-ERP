const log = {
  info: (msg, meta = {}) => console.log(JSON.stringify({ level: 'info', msg, ...meta, ts: new Date().toISOString() })),
  warn: (msg, meta = {}) => console.warn(JSON.stringify({ level: 'warn', msg, ...meta, ts: new Date().toISOString() })),
  error: (msg, err, meta = {}) => console.error(JSON.stringify({
    level: 'error',
    msg,
    error: err?.message,
    stack: err?.stack,
    ...meta,
    ts: new Date().toISOString()
  }))
};

module.exports = log;
