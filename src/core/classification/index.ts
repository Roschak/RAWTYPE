import { ClassificationResult } from '../../types';

export interface ClassificationRule {
  id: string;
  name: string;
  categoryId: string;
  keywords: string[];
  regexPattern?: string;
  priority: number;
  enabled: boolean;
  caseSensitive: boolean;
}

export const DEFAULT_CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    id: 'rule_pwd',
    name: 'Password / Credentials',
    categoryId: 'cat_cred',
    keywords: ['pw', 'pwd', 'password', 'passwd', 'pass', 'kata sandi', 'sandi', 'credential', 'credentials', 'secret', 'api_key', 'token', 'auth_token', 'private_key'],
    priority: 100,
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule_fin',
    name: 'Financial Notes',
    categoryId: 'cat_financial',
    keywords: ['keuangan', 'invoice', 'pembayaran', 'budget', 'anggaran', 'biaya', 'rekening', 'transfer', 'tagihan', 'nominal'],
    priority: 80,
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule_meet',
    name: 'Meeting Notes',
    categoryId: 'cat_meeting',
    keywords: ['meeting', 'rapat', 'notulen', 'agenda', 'hadir', 'pembahasan', 'briefing', 'sync'],
    priority: 75,
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule_todo',
    name: 'Tasks / TODO',
    categoryId: 'cat_todo',
    keywords: ['todo', 'tugas', 'task', 'deadline', 'checklist', 'target', 'jadwal', 'pr'],
    priority: 70,
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule_tech',
    name: 'Technical Notes',
    categoryId: 'cat_tech',
    keywords: ['curl', 'http', 'docker', 'sql', 'git', 'api', 'ssh', 'port', 'database', 'linux', 'config', 'endpoint', 'server'],
    priority: 65,
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule_proj',
    name: 'Project Notes',
    categoryId: 'cat_project',
    keywords: ['project', 'proyek', 'development', 'repository', 'roadmap', 'milestone', 'sprint', 'feature'],
    priority: 60,
    enabled: true,
    caseSensitive: false,
  },
  {
    id: 'rule_personal',
    name: 'Personal Information',
    categoryId: 'cat_personal',
    keywords: ['nik', 'ktp', 'alamat', 'telepon', 'keluarga', 'tanggal lahir', 'identitas'],
    priority: 55,
    enabled: true,
    caseSensitive: false,
  },
];

export function classifyNoteShared(
  title: string,
  content: string,
  customRules?: ClassificationRule[]
): ClassificationResult {
  const rules = customRules || DEFAULT_CLASSIFICATION_RULES;
  // Sort descending by priority so sensitive rules evaluate first
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);

  const combined = `${title}\n${content}`;
  const lower = combined.toLowerCase();

  // First: Strict check for password/credentials to prevent downgrading
  const credKeywords = ['pw', 'pwd', 'password', 'passwd', 'kata sandi', 'sandi', 'credential', 'secret', 'api_key', 'token'];
  const hasCredential = credKeywords.some(kw => {
    const wordRegex = new RegExp(`(^|[^a-zA-Z0-9_-])${kw}(:|=|\\s|$)`, 'i');
    return wordRegex.test(lower);
  });

  for (const rule of sorted) {
    if (!rule.enabled) continue;

    // Regex matching
    if (rule.regexPattern && rule.regexPattern.trim()) {
      try {
        const re = new RegExp(rule.regexPattern, rule.caseSensitive ? '' : 'i');
        if (re.test(combined)) {
          return {
            category_id: rule.categoryId,
            category_name: rule.name,
            confidence: 0.95,
            matched_rule: rule.name,
            is_sensitive: rule.categoryId === 'cat_cred' || hasCredential,
          };
        }
      } catch {
        // ignore invalid regex
      }
    }

    // Keyword matching with word boundary
    const textToCheck = rule.caseSensitive ? combined : lower;
    for (const kw of rule.keywords) {
      const cleanKw = kw.trim();
      if (!cleanKw) continue;
      const kwToCheck = rule.caseSensitive ? cleanKw : cleanKw.toLowerCase();

      // Check word boundary or key-value pattern (kw: or kw =)
      const wordRegex = new RegExp(`(^|[^a-zA-Z0-9_-])${kwToCheck}(:|=|\\s|$)`, rule.caseSensitive ? '' : 'i');
      if (wordRegex.test(textToCheck)) {
        return {
          category_id: rule.categoryId,
          category_name: rule.name,
          confidence: 0.9,
          matched_rule: rule.name,
          is_sensitive: rule.categoryId === 'cat_cred' || hasCredential,
        };
      }
    }
  }

  if (hasCredential) {
    return {
      category_id: 'cat_cred',
      category_name: 'Password / Credentials',
      confidence: 0.9,
      matched_rule: 'Deteksi Kredensial Otomatis',
      is_sensitive: true,
    };
  }

  return {
    category_id: 'cat_unclass',
    category_name: 'Unclassified',
    confidence: 0.1,
    is_sensitive: false,
  };
}
