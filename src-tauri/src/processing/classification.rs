use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleDefinition {
    pub id: String,
    pub name: String,
    pub category_id: String,
    pub keywords: Vec<String>,
    pub regex_pattern: Option<String>,
    pub priority: i32,
    pub enabled: bool,
    pub case_sensitive: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassificationResult {
    pub category_id: String,
    pub category_name: String,
    pub confidence: f32,
    pub matched_rule: Option<String>,
    pub is_sensitive: bool,
}

pub struct NoteClassifier {
    rules: Vec<RuleDefinition>,
}

impl NoteClassifier {
    pub fn new(rules: Vec<RuleDefinition>) -> Self {
        let mut sorted_rules = rules;
        // Sort descending by priority so high-priority rules (like credentials) evaluate first
        sorted_rules.sort_by(|a, b| b.priority.cmp(&a.priority));
        Self { rules: sorted_rules }
    }

    pub fn classify(&self, title: &str, content: &str) -> ClassificationResult {
        let combined = format!("{}\n{}", title, content);
        let lower = combined.to_lowercase();

        // Check if sensitive credential keywords match first
        let credential_kws = ["pw", "pwd", "password", "passwd", "kata sandi", "sandi", "credential", "secret", "api_key", "token"];
        let has_credential = credential_kws.iter().any(|&kw| {
            // Word boundary match
            lower.split(|c: char| !c.is_alphanumeric() && c != '_').any(|w| w == kw)
                || lower.contains(&format!("{}:", kw))
                || lower.contains(&format!("{} =", kw))
                || lower.contains(&format!("{}=", kw))
        });

        for rule in &self.rules {
            if !rule.enabled {
                continue;
            }

            // If regex pattern present, evaluate regex
            if let Some(ref pattern) = rule.regex_pattern {
                if !pattern.trim().is_empty() {
                    let regex_res = if rule.case_sensitive {
                        Regex::new(pattern)
                    } else {
                        Regex::new(&format!("(?i){}", pattern))
                    };

                    if let Ok(re) = regex_res {
                        if re.is_match(&combined) {
                            return ClassificationResult {
                                category_id: rule.category_id.clone(),
                                category_name: rule.name.clone(),
                                confidence: 0.95,
                                matched_rule: Some(rule.name.clone()),
                                is_sensitive: rule.category_id == "cat_cred" || has_credential,
                            };
                        }
                    }
                }
            }

            // Keyword evaluation
            let text_to_check = if rule.case_sensitive { &combined } else { &lower };

            for kw in &rule.keywords {
                let kw_clean = kw.trim();
                if kw_clean.is_empty() {
                    continue;
                }
                let kw_to_check = if rule.case_sensitive { kw_clean.to_string() } else { kw_clean.to_lowercase() };

                // Word boundary or prefix matching
                let matched = text_to_check.split(|c: char| !c.is_alphanumeric() && c != '_' && c != '-').any(|token| token == kw_to_check)
                    || text_to_check.contains(&format!("{}:", kw_to_check))
                    || text_to_check.contains(&format!("{} =", kw_to_check));

                if matched {
                    let is_sensitive = rule.category_id == "cat_cred" || has_credential;
                    return ClassificationResult {
                        category_id: rule.category_id.clone(),
                        category_name: rule.name.clone(),
                        confidence: 0.90,
                        matched_rule: Some(rule.name.clone()),
                        is_sensitive,
                    };
                }
            }
        }

        // If credentials matched but no custom rule triggered
        if has_credential {
            return ClassificationResult {
                category_id: "cat_cred".to_string(),
                category_name: "Password / Credentials".to_string(),
                confidence: 0.90,
                matched_rule: Some("Deteksi Kredensial Otomatis".to_string()),
                is_sensitive: true,
            };
        }

        // Default unclassified
        ClassificationResult {
            category_id: "cat_unclass".to_string(),
            category_name: "Unclassified".to_string(),
            confidence: 0.10,
            matched_rule: None,
            is_sensitive: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_credential_classification_priority() {
        let rules = vec![
            RuleDefinition {
                id: "rule_proj".into(),
                name: "Project".into(),
                category_id: "cat_project".into(),
                keywords: vec!["project".into(), "github".into()],
                regex_pattern: None,
                priority: 50,
                enabled: true,
                case_sensitive: false,
            },
            RuleDefinition {
                id: "rule_cred".into(),
                name: "Credentials".into(),
                category_id: "cat_cred".into(),
                keywords: vec!["pw".into(), "password".into()],
                regex_pattern: None,
                priority: 100,
                enabled: true,
                case_sensitive: false,
            },
        ];

        let classifier = NoteClassifier::new(rules);
        // Note containing both project and password
        let res = classifier.classify("Github project", "pw github: my_secret_token_123");
        assert_eq!(res.category_id, "cat_cred");
        assert!(res.is_sensitive);
    }

    #[test]
    fn test_todo_classification() {
        let rules = vec![
            RuleDefinition {
                id: "rule_todo".into(),
                name: "TODO".into(),
                category_id: "cat_todo".into(),
                keywords: vec!["todo".into(), "deadline".into()],
                regex_pattern: None,
                priority: 70,
                enabled: true,
                case_sensitive: false,
            },
        ];

        let classifier = NoteClassifier::new(rules);
        let res = classifier.classify("Daftar belanja", "todo: beli susu dan roti");
        assert_eq!(res.category_id, "cat_todo");
        assert!(!res.is_sensitive);
    }
}
