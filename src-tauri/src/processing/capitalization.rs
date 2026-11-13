use std::collections::HashSet;

pub fn capitalize_sentence_start(
    sentence: &str,
    protected_words: &HashSet<String>,
) -> Option<(String, String)> {
    let trimmed = sentence.trim_start();
    if trimmed.is_empty() {
        return None;
    }

    // Check if sentence starts with quotation mark
    let (prefix, rest) = if trimmed.starts_with('"') {
        ("\"", &trimmed[1..])
    } else if trimmed.starts_with('\'') {
        ("'", &trimmed[1..])
    } else {
        ("", trimmed)
    };

    let mut chars = rest.chars();
    let first = match chars.next() {
        Some(c) => c,
        None => return None,
    };

    if first.is_lowercase() {
        // Extract first word
        let first_word: String = rest.split_whitespace().next().unwrap_or("").to_string();
        if protected_words.contains(&first_word) || protected_words.contains(&first_word.to_lowercase()) {
            return None;
        }

        let capitalized_char = first.to_uppercase().to_string();
        let remainder: String = chars.collect();
        let new_text = format!("{}{}{}", prefix, capitalized_char, remainder);
        
        let leading_spaces = &sentence[..sentence.len() - trimmed.len()];
        let full_proposed = format!("{}{}", leading_spaces, new_text);

        return Some((sentence.to_string(), full_proposed));
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sentence_capitalization() {
        let protected = HashSet::new();
        let s = "ini kalimat pertama.";
        let res = capitalize_sentence_start(s, &protected);
        assert!(res.is_some());
        assert_eq!(res.unwrap().1, "Ini kalimat pertama.");
    }

    #[test]
    fn test_quote_sentence_capitalization() {
        let protected = HashSet::new();
        let s = "\"ini kutipan.\"";
        let res = capitalize_sentence_start(s, &protected);
        assert!(res.is_some());
        assert_eq!(res.unwrap().1, "\"Ini kutipan.\"");
    }
}
