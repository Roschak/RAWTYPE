pub const INDONESIAN_CONJUNCTIONS: &[&str] = &[
    "dan", "tetapi", "karena", "sehingga", "kemudian", "lalu", "ketika", "meskipun", "walaupun",
    "namun", "sedangkan", "melainkan", "padahal", "jika", "kalau", "apabila", "supaya", "agar"
];

#[derive(Debug, Clone, PartialEq)]
pub struct SentenceSpan {
    pub text: String,
    pub start: usize,
    pub end: usize,
}

pub fn split_sentences(paragraph: &str) -> Vec<SentenceSpan> {
    let mut sentences = Vec::new();
    let mut start_idx = 0;
    let chars: Vec<(usize, char)> = paragraph.char_indices().collect();
    let len = chars.len();

    if len == 0 {
        return sentences;
    }

    let mut i = 0;
    let mut in_quote = false;

    while i < len {
        let (_byte_pos, ch) = chars[i];

        if ch == '"' {
            in_quote = !in_quote;
        }

        // Potential sentence boundary if not inside a quote
        if !in_quote && (ch == '.' || ch == '!' || ch == '?') {
            // Check for ellipsis ...
            let mut next_i = i + 1;
            while next_i < len && (chars[next_i].1 == '.' || chars[next_i].1 == '!' || chars[next_i].1 == '?') {
                next_i += 1;
            }

            // Check if followed by quote
            if next_i < len && chars[next_i].1 == '"' {
                next_i += 1;
            }

            // Check if at end or followed by space/newline
            if next_i == len || (next_i < len && (chars[next_i].1 == ' ' || chars[next_i].1 == '\n')) {
                let end_byte = if next_i < len {
                    chars[next_i].0
                } else {
                    paragraph.len()
                };

                let raw_sentence = &paragraph[start_idx..end_byte];
                let trimmed = raw_sentence.trim();
                if !trimmed.is_empty() {
                    sentences.push(SentenceSpan {
                        text: trimmed.to_string(),
                        start: start_idx,
                        end: end_byte,
                    });
                }

                // Advance past spaces
                while next_i < len && chars[next_i].1.is_whitespace() {
                    next_i += 1;
                }

                start_idx = if next_i < len { chars[next_i].0 } else { paragraph.len() };
                i = next_i;
                continue;
            }
        }

        i += 1;
    }

    // Remaining text if any
    if start_idx < paragraph.len() {
        let raw_sentence = &paragraph[start_idx..];
        let trimmed = raw_sentence.trim();
        if !trimmed.is_empty() {
            sentences.push(SentenceSpan {
                text: trimmed.to_string(),
                start: start_idx,
                end: paragraph.len(),
            });
        }
    }

    sentences
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sentence_split_basic() {
        let p = "Ini kalimat pertama. Ini kalimat kedua! Apakah ini ketiga?";
        let sentences = split_sentences(p);
        assert_eq!(sentences.len(), 3);
        assert_eq!(sentences[0].text, "Ini kalimat pertama.");
        assert_eq!(sentences[1].text, "Ini kalimat kedua!");
        assert_eq!(sentences[2].text, "Apakah ini ketiga?");
    }

    #[test]
    fn test_conjunction_no_split() {
        let p = "Dia ingin makan dan saya ingin minum karena hari sudah malam.";
        let sentences = split_sentences(p);
        assert_eq!(sentences.len(), 1);
        assert_eq!(sentences[0].text, p);
    }

    #[test]
    fn test_quotes_preservation() {
        let p = "\"Jangan pergi!\" teriaknya. Dia pun berhenti.";
        let sentences = split_sentences(p);
        assert_eq!(sentences.len(), 2);
        assert_eq!(sentences[0].text, "\"Jangan pergi!\" teriaknya.");
        assert_eq!(sentences[1].text, "Dia pun berhenti.");
    }
}
