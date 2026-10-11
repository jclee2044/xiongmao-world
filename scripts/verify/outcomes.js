export function failureDetail(log, root = process.cwd()) {
  log = log.replace(/\x1b\[[0-9;]*m/g, "");
  const starts = ["AssertionError [ERR_ASSERTION]", "locator.click:", "locator.fill:", "locator.waitFor:", "page.waitForFunction:"]
    .map((marker) => log.indexOf(marker)).filter((at) => at >= 0);
  return (starts.length ? log.slice(Math.min(...starts)) : log.slice(-6000))
    // Async scheduling adds/removes Node stack frames without changing an
    // assertion. Keep the complete error message and assertion properties.
    .replace(/^ {4}at [^\n]*(?:file:\/\/|node:internal\/)[^\n]*\n/gm, "")
    // Playwright polling count is scheduler-dependent; preserve timeout and observed state.
    .replace(/\b\d+ × locator resolved to /g, "<polls> × locator resolved to ")
    .replaceAll(root, "<checkout>")
    .replace(/(scripts\/[^\s:]+\.js):\d+:\d+/g, "$1:<line>:<column>")
    .replace(/127\.0\.0\.1:\d+/g, "127.0.0.1:<port>")
    .replace(/\(node:\d+\)/g, "(node:<pid>)");
}
