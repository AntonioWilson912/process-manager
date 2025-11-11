export interface SearchResult {
  matches: boolean;
  score: number;
}

export function fuzzySearch(query: string, text: string): SearchResult {
  if (!query) return { matches: true, score: 0 };

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact match - highest score
  if (textLower === queryLower) {
    return { matches: true, score: 100 };
  }

  // Starts with query - high score
  if (textLower.startsWith(queryLower)) {
    return { matches: true, score: 90 };
  }

  // Contains query as substring - medium-high score
  if (textLower.includes(queryLower)) {
    return { matches: true, score: 80 };
  }

  // Consecutive character matching
  let queryIndex = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;
  let lastMatchIndex = -2;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      if (i === lastMatchIndex + 1) {
        consecutiveMatches++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      } else {
        consecutiveMatches = 1;
      }
      lastMatchIndex = i;
      queryIndex++;
    }
  }

  if (queryIndex === queryLower.length) {
    // Calculate score based on consecutive matches
    const consecutiveScore = (maxConsecutive / queryLower.length) * 50;
    return { matches: true, score: 30 + consecutiveScore };
  }

  return { matches: false, score: 0 };
}

export function searchByPid(query: string, pid: number): boolean {
  if (!query) return true;
  return pid.toString().includes(query);
}
