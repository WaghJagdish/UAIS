"""
string_algorithms.py
Four string matching algorithms with step-by-step history.
"""


def naive_search(text: str, pattern: str) -> dict:
    """Naive string matching – O(nm) worst case."""
    steps = []
    matches = []
    comparisons = 0
    n, m = len(text), len(pattern)

    for i in range(n - m + 1):
        j = 0
        window_match = True
        while j < m:
            comparisons += 1
            match_char = text[i + j] == pattern[j]
            steps.append({
                "text": text,
                "pattern": pattern,
                "window_start": i,
                "char_pos": j,
                "match": match_char,
                "matches": matches[:],
                "description": (
                    f"Window at {i}: text[{i+j}]='{text[i+j]}' vs pattern[{j}]='{pattern[j]}' "
                    f"{'✅ match' if match_char else '❌ mismatch'}"
                ),
            })
            if not match_char:
                window_match = False
                break
            j += 1
        if window_match:
            matches.append(i)
            steps.append({
                "text": text, "pattern": pattern,
                "window_start": i, "char_pos": m,
                "match": True, "matches": matches[:],
                "description": f"🎉 Pattern found at index {i}!",
            })

    return {"matches": matches, "steps": steps, "comparisons": comparisons}


def kmp_search(text: str, pattern: str) -> dict:
    """KMP – O(n+m) time, O(m) space."""
    def compute_lps(pat):
        lps = [0] * len(pat)
        length, i = 0, 1
        while i < len(pat):
            if pat[i] == pat[length]:
                length += 1; lps[i] = length; i += 1
            else:
                if length: length = lps[length - 1]
                else: lps[i] = 0; i += 1
        return lps

    steps = []
    matches = []
    comparisons = 0
    n, m = len(text), len(pattern)
    lps = compute_lps(pattern)
    i = j = 0

    while i < n:
        comparisons += 1
        match_char = text[i] == pattern[j]
        steps.append({
            "text": text, "pattern": pattern,
            "window_start": i - j, "char_pos": j,
            "match": match_char, "matches": matches[:],
            "description": (
                f"i={i}, j={j}: text[{i}]='{text[i]}' vs pattern[{j}]='{pattern[j]}' "
                f"{'✅' if match_char else '❌ → skip using LPS'}"
            ),
        })
        if match_char:
            i += 1; j += 1
        else:
            if j: j = lps[j - 1]
            else: i += 1
        if j == m:
            matches.append(i - j)
            steps.append({
                "text": text, "pattern": pattern,
                "window_start": i - j, "char_pos": m,
                "match": True, "matches": matches[:],
                "description": f"🎉 Pattern found at index {i - j}!",
            })
            j = lps[j - 1]

    return {"matches": matches, "steps": steps, "comparisons": comparisons, "lps": lps}


def rabin_karp_search(text: str, pattern: str, base: int = 256, mod: int = 101) -> dict:
    """Rabin-Karp – rolling hash, O(nm) worst / O(n+m) average."""
    steps = []
    matches = []
    comparisons = 0
    n, m = len(text), len(pattern)
    if m > n:
        return {"matches": [], "steps": [], "comparisons": 0}

    h = pow(base, m - 1, mod)
    p_hash = t_hash = 0
    for k in range(m):
        p_hash = (base * p_hash + ord(pattern[k])) % mod
        t_hash = (base * t_hash + ord(text[k])) % mod

    for i in range(n - m + 1):
        comparisons += 1
        hash_match = (p_hash == t_hash)
        actual_match = hash_match and text[i:i + m] == pattern
        steps.append({
            "text": text, "pattern": pattern,
            "window_start": i, "char_pos": 0,
            "match": actual_match, "matches": matches[:],
            "description": (
                f"Window [{i}:{i+m}] ('{text[i:i+m]}'): Hash(Text)={t_hash}, Hash(Pattern)={p_hash} → "
                f"{'Match ✅' if hash_match else 'Miss ❌'}"
                + (f" → String confirm {'✅' if actual_match else '❌ (Collision)'}" if hash_match else "")
            ),
        })
        if actual_match:
            matches.append(i)

        if i < n - m:
            t_hash = (base * (t_hash - ord(text[i]) * h) + ord(text[i + m])) % mod
            if t_hash < 0:
                t_hash += mod

    return {"matches": matches, "steps": steps, "comparisons": comparisons}


def boyer_moore_search(text: str, pattern: str) -> dict:
    """Boyer-Moore (bad character heuristic) – O(nm) worst / O(n/m) best."""
    def bad_char_table(pat):
        table = {}
        for i, c in enumerate(pat):
            table[c] = i
        return table

    steps = []
    matches = []
    comparisons = 0
    n, m = len(text), len(pattern)
    if m > n:
        return {"matches": [], "steps": [], "comparisons": 0}

    bc = bad_char_table(pattern)
    s = 0

    while s <= n - m:
        j = m - 1
        while j >= 0 and pattern[j] == text[s + j]:
            comparisons += 1
            steps.append({
                "text": text, "pattern": pattern,
                "window_start": s, "char_pos": j,
                "match": True, "matches": matches[:],
                "description": f"Matching right-to-left: text[{s+j}]='{text[s+j]}' == pattern[{j}]='{pattern[j]}' ✅",
            })
            j -= 1
        if j < 0:
            matches.append(s)
            steps.append({
                "text": text, "pattern": pattern,
                "window_start": s, "char_pos": -1,
                "match": True, "matches": matches[:],
                "description": f"🎉 Pattern found at index {s}!",
            })
            s += (m - bc.get(text[s + m], -1)) if s + m < n else 1
        else:
            comparisons += 1
            skip = max(1, j - bc.get(text[s + j], -1))
            steps.append({
                "text": text, "pattern": pattern,
                "window_start": s, "char_pos": j,
                "match": False, "matches": matches[:],
                "description": (
                    f"Mismatch: text[{s+j}]='{text[s+j]}' vs pattern[{j}]='{pattern[j]}' "
                    f"❌ → skip {skip} using bad-char heuristic"
                ),
            })
            s += skip

    return {"matches": matches, "steps": steps, "comparisons": comparisons, "bad_char": bc}
