// logger.js

function getCurrentTimestamp() {
  const now = new Date();
  return now.toISOString();
}

function logInfo(message, method) {
  const timestamp = getCurrentTimestamp();
  const logEntry = {
    level: "ERROR",
    timestamp,
    method,
    message,
  };
  console.error(logEntry);
}

function withInfo(message, vcs, sha, method) {
  const timestamp = getCurrentTimestamp();
  const logEntry = {
    level: "INFO",
    timestamp,
    vcs,
    sha,
    method,
    message,
  };
  console.log(logEntry);
}

function withError(message, vcs, sha, method) {
  const timestamp = getCurrentTimestamp();
  const logEntry = {
    level: "ERROR",
    timestamp,
    vcs,
    sha,
    method,
    message,
  };
  console.error(logEntry);
}

function debug(message, vcs, sha, method) {
  const timestamp = getCurrentTimestamp();
  const logEntry = {
    level: "DEBUG",
    timestamp,
    vcs,
    sha,
    method,
    message,
  };
  console.debug(logEntry);
}

const logger = {
  withInfo,
  withError,
  debug,
  logInfo,
};

export default logger;
