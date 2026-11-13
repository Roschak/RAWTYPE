pub mod capitalization;
pub mod classification;
pub mod dialogue;
pub mod normalization;
pub mod punctuation;
pub mod segmentation;
pub mod spelling;

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorrectionRecord {
    pub id: String,
    pub manuscript_id: String,
    pub rule_id: String,
    pub correction_type: String, // "capitalization", "punctuation", "spelling", "dialogue", "whitespace"
    pub original_text: String,
    pub proposed_text: String,
    pub confidence: String,      // "high", "medium", "low"
    pub accepted: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefinementOptions {
    pub mode: String, // "safe", "standard", "strict_review", "custom"
    pub fix_capitalization: bool,
    pub fix_punctuation: bool,
    pub fix_spelling: bool,
    pub fix_dialogue: bool,
    pub fix_whitespace: bool,
}

impl Default for RefinementOptions {
    fn default() -> Self {
        Self {
            mode: "standard".to_string(),
            fix_capitalization: true,
            fix_punctuation: true,
            fix_spelling: true,
            fix_dialogue: true,
            fix_whitespace: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefinementResult {
    pub original_text: String,
    pub refined_text: String,
    pub corrections: Vec<CorrectionRecord>,
}

pub struct RefinementEngine {
    spelling: spelling::SpellingEngine,
}

impl RefinementEngine {
    pub fn new() -> Self {
        Self {
            spelling: spelling::SpellingEngine::new(),
        }
    }

    pub fn refine(
        &self,
        manuscript_id: &str,
        raw_text: &str,
        options: &RefinementOptions,
        protected_words: &HashSet<String>,
        ignored_words: &HashSet<String>,
    ) -> RefinementResult {
        let now = chrono::Utc::now().to_rfc3339();
        let mut corrections = Vec::new();

        // 1. Unicode & Whitespace Normalization
        let mut normalized = normalization::normalize_quotes(raw_text);
        if options.fix_whitespace {
            let ws_cleaned = normalization::normalize_whitespace(&normalized);
            if ws_cleaned != normalized {
                corrections.push(CorrectionRecord {
                    id: Uuid::new_v4().to_string(),
                    manuscript_id: manuscript_id.to_string(),
                    rule_id: "RULE_WHITESPACE".to_string(),
                    correction_type: "whitespace".to_string(),
                    original_text: "[Spasi/Baris Berlebih]".to_string(),
                    proposed_text: "[Normalisasi Spasi]".to_string(),
                    confidence: "high".to_string(),
                    accepted: options.mode != "strict_review",
                    created_at: now.clone(),
                });
                normalized = ws_cleaned;
            }
        }

        // Split into paragraphs preserving blank lines
        let paragraphs: Vec<&str> = normalized.split("\n\n").collect();
        let mut refined_paragraphs = Vec::new();

        for para in paragraphs {
            let trimmed_para = para.trim();
            if trimmed_para.is_empty() {
                refined_paragraphs.push(String::new());
                continue;
            }

            // Split into sentences
            let sentence_spans = segmentation::split_sentences(trimmed_para);
            let mut refined_sentences = Vec::new();

            for span in sentence_spans {
                let mut sentence = span.text;

                // 2. Capitalization Processing
                if options.fix_capitalization {
                    if let Some((orig, proposed)) =
                        capitalization::capitalize_sentence_start(&sentence, protected_words)
                    {
                        corrections.push(CorrectionRecord {
                            id: Uuid::new_v4().to_string(),
                            manuscript_id: manuscript_id.to_string(),
                            rule_id: "RULE_CAPITALIZATION".to_string(),
                            correction_type: "capitalization".to_string(),
                            original_text: orig,
                            proposed_text: proposed.clone(),
                            confidence: "high".to_string(),
                            accepted: options.mode != "strict_review",
                            created_at: now.clone(),
                        });
                        sentence = proposed;
                    }
                }

                // 3. Punctuation Processing
                if options.fix_punctuation {
                    if let Some((orig, proposed, desc)) =
                        punctuation::check_terminal_punctuation(&sentence)
                    {
                        corrections.push(CorrectionRecord {
                            id: Uuid::new_v4().to_string(),
                            manuscript_id: manuscript_id.to_string(),
                            rule_id: format!("RULE_PUNCTUATION_{}", desc),
                            correction_type: "punctuation".to_string(),
                            original_text: orig,
                            proposed_text: proposed.clone(),
                            confidence: "high".to_string(),
                            accepted: options.mode != "strict_review",
                            created_at: now.clone(),
                        });
                        sentence = proposed;
                    }
                }

                // 4. Spelling Correction
                if options.fix_spelling {
                    let mut words_res = Vec::new();
                    // Tokenize words while preserving attached punctuation
                    let words: Vec<&str> = sentence.split(' ').collect();
                    for token in words {
                        // Extract alphanumeric core word
                        let clean_word: String = token.chars().filter(|c| c.is_alphabetic()).collect();
                        if !clean_word.is_empty() {
                            if let Some(replacement) = self.spelling.check_word(
                                &clean_word,
                                protected_words,
                                ignored_words,
                            ) {
                                let corrected_token = token.replace(&clean_word, &replacement);
                                corrections.push(CorrectionRecord {
                                    id: Uuid::new_v4().to_string(),
                                    manuscript_id: manuscript_id.to_string(),
                                    rule_id: "RULE_KBBI_SPELLING".to_string(),
                                    correction_type: "spelling".to_string(),
                                    original_text: token.to_string(),
                                    proposed_text: corrected_token.clone(),
                                    confidence: "high".to_string(),
                                    accepted: options.mode != "strict_review",
                                    created_at: now.clone(),
                                });
                                words_res.push(corrected_token);
                                continue;
                            }
                        }
                        words_res.push(token.to_string());
                    }
                    sentence = words_res.join(" ");
                }

                refined_sentences.push(sentence);
            }

            let mut refined_para = refined_sentences.join(" ");

            // 5. Dialogue Processing
            if options.fix_dialogue {
                let diag_corrections = dialogue::check_dialogue_punctuation(&refined_para);
                for (orig, proposed, desc) in diag_corrections {
                    corrections.push(CorrectionRecord {
                        id: Uuid::new_v4().to_string(),
                        manuscript_id: manuscript_id.to_string(),
                        rule_id: format!("RULE_DIALOGUE_{}", desc),
                        correction_type: "dialogue".to_string(),
                        original_text: orig.clone(),
                        proposed_text: proposed.clone(),
                        confidence: "medium".to_string(),
                        accepted: options.mode != "strict_review",
                        created_at: now.clone(),
                    });
                    refined_para = refined_para.replace(&orig, &proposed);
                }
            }

            refined_paragraphs.push(refined_para);
        }

        let refined_text = refined_paragraphs.join("\n\n");

        RefinementResult {
            original_text: raw_text.to_string(),
            refined_text,
            corrections,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_full_pipeline_refinement() {
        let engine = RefinementEngine::new();
        let opts = RefinementOptions::default();
        let protected = HashSet::new();
        let ignored = HashSet::new();

        let raw = "pagi itu cerah sekali  \n\napakah kamu mau pergi ke apotik";
        let res = engine.refine("doc-1", raw, &opts, &protected, &ignored);

        assert!(res.refined_text.contains("Pagi itu cerah sekali."));
        assert!(res.refined_text.contains("Apakah kamu mau pergi ke apotek?"));
        assert!(!res.corrections.is_empty());
    }

    #[test]
    fn test_strict_review_mode() {
        let engine = RefinementEngine::new();
        let mut opts = RefinementOptions::default();
        opts.mode = "strict_review".to_string();
        let protected = HashSet::new();
        let ignored = HashSet::new();

        let raw = "hari ini mendung";
        let res = engine.refine("doc-2", raw, &opts, &protected, &ignored);
        // In strict review mode, proposed corrections start as unaccepted
        for c in res.corrections {
            assert!(!c.accepted);
        }
    }
}
