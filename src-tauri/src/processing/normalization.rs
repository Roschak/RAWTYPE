pub fn normalize_whitespace(text: &str) -> String {
    let mut result = String::with_capacity(text.len());

    for line in text.lines() {
        let trimmed_line = line.trim_end();
        let mut line_res = String::with_capacity(trimmed_line.len());
        let mut in_spaces = false;

        for ch in trimmed_line.chars() {
            if ch == ' ' || ch == '\t' {
                if !in_spaces && !line_res.is_empty() {
                    line_res.push(' ');
                    in_spaces = true;
                }
            } else {
                line_res.push(ch);
                in_spaces = false;
            }
        }

        if !result.is_empty() {
            result.push('\n');
        }
        result.push_str(&line_res);
    }

    result
}

pub fn normalize_quotes(text: &str) -> String {
    text.replace(['“', '”'], "\"")
        .replace(['‘', '’'], "'")
        .replace("`", "'")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_whitespace() {
        let input = "Halo   dunia!  \nIni   tes   spasi.  ";
        let output = normalize_whitespace(input);
        assert_eq!(output, "Halo dunia!\nIni tes spasi.");
    }

    #[test]
    fn test_normalize_quotes() {
        let input = "“Halo” kata ‘Budi’";
        let output = normalize_quotes(input);
        assert_eq!(output, "\"Halo\" kata 'Budi'");
    }
}
