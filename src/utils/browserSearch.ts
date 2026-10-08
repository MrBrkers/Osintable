/**
 * Opens a Google web search for the given query in a new browser tab.
 */
export function openGoogleSearch(query: string): void {
  const clean = query.trim();
  if (!clean) return;
  const url = `https://www.google.com/search?q=${encodeURIComponent(clean)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
