export function getSecUserAgent() {
  return process.env.SEC_USER_AGENT || "MySecWatcher/1.0 your_email@example.com";
}

export function createSecRequestHeaders(accept: string) {
  return {
    Accept: accept,
    "User-Agent": getSecUserAgent(),
  };
}
