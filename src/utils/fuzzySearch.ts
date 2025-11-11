export function fuzzySearch(query: string, text: string): boolean {
  if (!query) return true;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  let queryIndex = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === queryLower.length;
}

export function fuzzySearchScore(query: string, text: string): number {
  if (!query) return 1;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  if (textLower.includes(queryLower)) {
    return 2;
  }

  let score = 0;
  let queryIndex = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 1 + consecutiveMatches * 0.5;
      consecutiveMatches++;
      queryIndex++;
    } else {
      consecutiveMatches = 0;
    }
  }

  return queryIndex === queryLower.length ? score / queryLower.length : 0;
}
