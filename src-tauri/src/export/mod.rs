use std::fs;
use std::path::Path;

pub struct DocumentExporter;

impl DocumentExporter {
    pub fn export_txt(title: &str, author: &str, content: &str, path: &Path) -> Result<(), String> {
        let mut full_doc = String::new();
        if !title.is_empty() {
            full_doc.push_str(title);
            full_doc.push('\n');
            if !author.is_empty() {
                full_doc.push_str(&format!("Oleh: {}\n", author));
            }
            full_doc.push_str(&"=".repeat(title.len().max(20)));
            full_doc.push_str("\n\n");
        }
        full_doc.push_str(content);

        fs::write(path, full_doc.as_bytes()).map_err(|e| e.to_string())
    }

    pub fn export_markdown(title: &str, author: &str, content: &str, path: &Path) -> Result<(), String> {
        let mut full_doc = String::new();
        if !title.is_empty() {
            full_doc.push_str(&format!("# {}\n\n", title));
            if !author.is_empty() {
                full_doc.push_str(&format!("*Penulis: {}*\n\n---\n\n", author));
            }
        }
        full_doc.push_str(content);

        fs::write(path, full_doc.as_bytes()).map_err(|e| e.to_string())
    }
}
