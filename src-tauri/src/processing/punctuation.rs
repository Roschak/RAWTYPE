pub const QUESTION_WORDS: &[&str] = &[
    "apa", "apakah", "siapa", "siapakah", "kapan", "kapankah",
    "di mana", "dimana", "ke mana", "kemana", "dari mana",
    "mengapa", "kenapa", "bagaimana", "bagaimanakah", "adakah", "bilamana"
];

pub fn check_terminal_punctuation(sentence: &str) -> Option<(String, String, &'static str)> {
    let trimmed = sentence.trim_end();
    if trimmed.is_empty() {
        return None;
    }

    let last_char = trimmed.chars().last().unwrap_or(' ');
    // If last char is quote, inspect char before quote
    let (effective_char, has_trailing_quote) = if last_char == '"' || last_char == '\'' {
        let without_quote = &trimmed[..trimmed.len() - last_char.len_utf8()];
        (without_quote.chars().last().unwrap_or(' '), true)
    } else {
        (last_char, false)
    };

    if effective_char == '.' || effective_char == '!' || effective_char == '?' || effective_char == ';' || effective_char == ':' {
        return None; // Already has terminal punctuation
    }

    // Check if interrogative sentence
    let lower = trimmed.to_lowercase();
    let is_question = QUESTION_WORDS.iter().any(|&qw| {
        lower.starts_with(qw) || lower.starts_with(&format!("\"{}", qw)) || lower.starts_with(&format!("'{}", qw))
    });

    let mark = if is_question { "?" } else { "." };
    let proposed = if has_trailing_quote {
        // e.g. "Halo" -> "Halo."
        let base = &trimmed[..trimmed.len() - last_char.len_utf8()];
        format!("{}{}{}", base, mark, last_char)
    } else {
        format!("{}{}", trimmed, mark)
    };

    Some((trimmed.to_string(), proposed, if is_question { "Tanda tanya pada kalimat tanya" } else { "Tanda titik di akhir kalimat" }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_missing_period() {
        let s = "Hari ini cuaca sangat cerah";
        let res = check_terminal_punctuation(s);
        assert!(res.is_some());
        assert_eq!(res.unwrap().1, "Hari ini cuaca sangat cerah.");
    }

    #[test]
    fn test_missing_question_mark() {
        let s = "Apakah kamu sudah makan siang";
        let res = check_terminal_punctuation(s);
        assert!(res.is_some());
        assert_eq!(res.unwrap().1, "Apakah kamu sudah makan siang?");
    }

    #[test]
    fn test_existing_punctuation() {
        let s = "Ini sudah bertitik.";
        assert!(check_terminal_punctuation(s).is_none());
    }
}
