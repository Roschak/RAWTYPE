import { RefinementOptions, RefinementResult, CorrectionRecord } from '../../types';

export const KBBI_TYPOS: Record<string, string> = {
  'aktifitas': 'aktivitas',
  'aktip': 'aktif',
  'analisa': 'analisis',
  'antri': 'antre',
  'antrian': 'antrean',
  'apotik': 'apotek',
  'atlit': 'atlet',
  'bosen': 'bosan',
  'cabe': 'cabai',
  'capek': 'capai',
  'cidera': 'cedera',
  'cinderamata': 'cenderamata',
  'duren': 'durian',
  'efektip': 'efektif',
  'faham': 'paham',
  'fikir': 'pikir',
  'fikiran': 'pikiran',
  'fondasi': 'fondasi',
  'pondasi': 'fondasi',
  'frase': 'frasa',
  'hakekat': 'hakikat',
  'hapal': 'hafal',
  'hierarki': 'hierarki',
  'hirarki': 'hierarki',
  'hut': 'HUT',
  'ijazah': 'ijazah',
  'ijin': 'izin',
  'isteri': 'istri',
  'jadwal': 'jadwal',
  'jaman': 'zaman',
  'karir': 'karier',
  'kharisma': 'karisma',
  'kolektip': 'kolektif',
  'komplit': 'komplet',
  'konkrit': 'konkret',
  'kreatifitas': 'kreativitas',
  'kuitansi': 'kuitansi',
  'kwitansi': 'kuitansi',
  'kwalitas': 'kualitas',
  'kuantitas': 'kuantitas',
  'lobang': 'lubang',
  'merubah': 'mengubah',
  'milyar': 'miliar',
  'nafas': 'napas',
  'nasehat': 'nasihat',
  'nomer': 'nomor',
  'objek': 'objek',
  'obyek': 'objek',
  'otentik': 'autentik',
  'praktek': 'praktik',
  'propinsi': 'provinsi',
  'rejeki': 'rezeki',
  'resiko': 'risiko',
  'sekedar': 'sekadar',
  'silahkan': 'silakan',
  'sosialisasi': 'sosialisasi',
  'standarisasi': 'standardisasi',
  'subjek': 'subjek',
  'subyek': 'subjek',
  'tehnik': 'teknik',
  'telpon': 'telepon',
  'terlanjur': 'terlanjur',
  'terlantar': 'telantar',
  'terpercaya': 'tepercaya',
  'terperdaya': 'teperdaya',
  'terimakasih': 'terima kasih',
  'tanggungjawab': 'tanggung jawab',
  'kerjasama': 'kerja sama',
  'tandatangan': 'tanda tangan',
  'ibukota': 'ibu kota',
  'tatabahasa': 'tata bahasa',
};

export const INDONESIAN_QUESTION_WORDS = [
  'apa', 'apakah', 'siapa', 'siapakah', 'kapan', 'kapankah',
  'di mana', 'dimana', 'ke mana', 'kemana', 'dari mana',
  'mengapa', 'kenapa', 'bagaimana', 'bagaimanakah', 'adakah', 'bilamana'
];

export const INDONESIAN_CONJUNCTIONS = [
  'dan', 'tetapi', 'karena', 'sehingga', 'kemudian', 'lalu', 'ketika', 'meskipun', 'walaupun',
  'namun', 'sedangkan', 'melainkan', 'padahal', 'jika', 'kalau', 'apabila', 'supaya', 'agar'
];

export function refineTextShared(
  manuscriptId: string,
  rawText: string,
  options: RefinementOptions,
  protectedWords: Set<string> = new Set(),
  ignoredWords: Set<string> = new Set()
): RefinementResult {
  const corrections: CorrectionRecord[] = [];
  const now = new Date().toISOString();

  // Normalize quotes and whitespace
  let processed = rawText.replace(/[“”]/g, '"').replace(/[‘’`]/g, "'");

  if (options.fix_whitespace) {
    const lines = processed.split('\n');
    const cleanedLines = lines.map(line => line.trimEnd().replace(/\t/g, ' ').replace(/ {2,}/g, ' '));
    const wsResult = cleanedLines.join('\n');
    if (wsResult !== processed) {
      corrections.push({
        id: 'ws-' + Math.random().toString(36).slice(2, 9),
        manuscript_id: manuscriptId,
        rule_id: 'RULE_WHITESPACE',
        correction_type: 'whitespace',
        original_text: '[Spasi/Baris Berlebih]',
        proposed_text: '[Normalisasi Spasi]',
        confidence: 'high',
        accepted: options.mode !== 'strict_review',
        created_at: now,
      });
      processed = wsResult;
    }
  }

  const paragraphs = processed.split('\n\n');
  const refinedParagraphs = paragraphs.map(para => {
    let p = para.trim();
    if (!p) return '';

    // Split sentences respecting quotes and conjunctions (no splitting on conjunctions)
    const sentences = p.split(/(?<=[.!?])\s+/).filter(Boolean);

    const refinedSentences = sentences.map(sentence => {
      let s = sentence.trim();
      if (!s) return '';

      // 1. Capitalization
      if (options.fix_capitalization) {
        const startsWithQuote = s.startsWith('"') || s.startsWith("'");
        const prefix = startsWithQuote ? s.charAt(0) : '';
        const core = startsWithQuote ? s.slice(1) : s;

        if (core.length > 0) {
          const firstChar = core.charAt(0);
          if (firstChar === firstChar.toLowerCase() && firstChar !== firstChar.toUpperCase()) {
            const firstWord = core.split(/\s+/)[0];
            const cleanWord = firstWord.replace(/[^a-zA-Z0-9]/g, '');

            if (!protectedWords.has(cleanWord) && !protectedWords.has(cleanWord.toLowerCase())) {
              const capitalizedWord = firstChar.toUpperCase() + core.slice(1).split(/\s+/)[0].slice(1);
              const newCore = capitalizedWord + core.slice(firstWord.length);
              const proposed = prefix + newCore;

              corrections.push({
                id: 'cap-' + Math.random().toString(36).slice(2, 9),
                manuscript_id: manuscriptId,
                rule_id: 'RULE_CAPITALIZATION',
                correction_type: 'capitalization',
                original_text: s.split(' ')[0],
                proposed_text: proposed.split(' ')[0],
                confidence: 'high',
                accepted: options.mode !== 'strict_review',
                created_at: now,
              });
              s = proposed;
            }
          }
        }
      }

      // 2. Terminal Punctuation
      if (options.fix_punctuation) {
        const lastChar = s.slice(-1);
        const hasTerminal = lastChar === '.' || lastChar === '!' || lastChar === '?' || (lastChar === '"' && /[.!?]"$/.test(s));

        if (!hasTerminal) {
          const lowerS = s.toLowerCase();
          const isQuestion = INDONESIAN_QUESTION_WORDS.some(qw =>
            lowerS.startsWith(qw) || lowerS.startsWith(`"${qw}`) || lowerS.startsWith(`'${qw}`)
          );
          const mark = isQuestion ? '?' : '.';
          const proposed = s.endsWith('"') ? s.slice(0, -1) + mark + '"' : s + mark;

          corrections.push({
            id: 'punct-' + Math.random().toString(36).slice(2, 9),
            manuscript_id: manuscriptId,
            rule_id: isQuestion ? 'RULE_PUNCTUATION_QUESTION' : 'RULE_PUNCTUATION_PERIOD',
            correction_type: 'punctuation',
            original_text: s,
            proposed_text: proposed,
            confidence: 'high',
            accepted: options.mode !== 'strict_review',
            created_at: now,
          });
          s = proposed;
        }
      }

      // 3. Spelling Standardizations (KBBI)
      if (options.fix_spelling) {
        const tokens = s.split(' ');
        const correctedTokens = tokens.map(token => {
          const cleanCore = token.replace(/[^a-zA-Z]/g, '');
          const lowerCore = cleanCore.toLowerCase();

          if (!cleanCore) return token;
          if (protectedWords.has(cleanCore) || protectedWords.has(lowerCore) || ignoredWords.has(cleanCore) || ignoredWords.has(lowerCore)) {
            return token;
          }

          const replacement = KBBI_TYPOS[lowerCore];
          if (replacement && replacement !== lowerCore) {
            const isCapital = cleanCore.charAt(0) === cleanCore.charAt(0).toUpperCase();
            const finalReplacement = isCapital
              ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
              : replacement;
            const updatedToken = token.replace(cleanCore, finalReplacement);

            corrections.push({
              id: 'spelling-' + Math.random().toString(36).slice(2, 9),
              manuscript_id: manuscriptId,
              rule_id: 'RULE_KBBI_SPELLING',
              correction_type: 'spelling',
              original_text: token,
              proposed_text: updatedToken,
              confidence: 'high',
              accepted: options.mode !== 'strict_review',
              created_at: now,
            });
            return updatedToken;
          }

          return token;
        });
        s = correctedTokens.join(' ');
      }

      return s;
    });

    let refinedP = refinedSentences.join(' ');

    // 4. Dialogue Comma Handling
    if (options.fix_dialogue) {
      const dialogueTags = ['kata', 'ujar', 'ucap', 'bisik', 'sahut', 'tukas', 'jawab', 'seru', 'tanya', 'gumam'];
      for (const tag of dialogueTags) {
        const regex = new RegExp(`([^,!?\\s])"\\s+${tag}\\b`, 'gi');
        if (regex.test(refinedP)) {
          refinedP = refinedP.replace(regex, (match, char) => {
            corrections.push({
              id: 'diag-' + Math.random().toString(36).slice(2, 9),
              manuscript_id: manuscriptId,
              rule_id: 'RULE_DIALOGUE_COMMA',
              correction_type: 'dialogue',
              original_text: match,
              proposed_text: `${char}," ${tag}`,
              confidence: 'medium',
              accepted: options.mode !== 'strict_review',
              created_at: now,
            });
            return `${char}," ${tag}`;
          });
        }
      }
    }

    return refinedP;
  });

  return {
    original_text: rawText,
    refined_text: refinedParagraphs.join('\n\n'),
    corrections,
  };
}
