pub const DIALOGUE_TAGS: &[&str] = &[
    "kata", "ujar", "ucap", "bisik", "sahut", "tukas", "jawab", "seru", "tanya", "gumam", "keluh"
];

pub fn check_dialogue_punctuation(text: &str) -> Vec<(String, String, &'static str)> {
    let mut corrections = Vec::new();

    for tag in DIALOGUE_TAGS {
        let pattern_no_punct = format!("\" {}", tag);
        let mut search_from = 0;

        while let Some(pos) = text[search_from..].find(&pattern_no_punct) {
            let abs_pos = search_from + pos;
            if abs_pos > 0 {
                let char_before = text[..abs_pos].chars().last().unwrap_or(' ');
                if char_before.is_alphanumeric() {
                    // Extract a small snippet around the dialogue quote
                    let start = abs_pos.saturating_sub(15);
                    let end = (abs_pos + pattern_no_punct.len() + 10).min(text.len());
                    let original = &text[start..end];
                    
                    let mut proposed = String::new();
                    proposed.push_str(&text[start..abs_pos]);
                    proposed.push_str(",\" ");
                    proposed.push_str(tag);
                    proposed.push_str(&text[abs_pos + pattern_no_punct.len()..end]);

                    corrections.push((original.to_string(), proposed, "Koma sebelum penutup dialog"));
                }
            }
            search_from = abs_pos + pattern_no_punct.len();
        }
    }

    corrections
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dialogue_comma() {
        let text = "Aku ingin pergi\" kata Budi.";
        let res = check_dialogue_punctuation(text);
        assert!(!res.is_empty());
        assert!(res[0].1.contains(",\" kata"));
    }
}
