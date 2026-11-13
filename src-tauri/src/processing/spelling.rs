use std::collections::{HashMap, HashSet};

pub struct SpellingEngine {
    standard_map: HashMap<&'static str, &'static str>,
}

impl SpellingEngine {
    pub fn new() -> Self {
        let mut map = HashMap::new();
        // Common non-standard Indonesian words to KBBI standard forms
        let pairs = [
            ("aktifitas", "aktivitas"),
            ("aktip", "aktif"),
            ("analisa", "analisis"),
            ("antri", "antre"),
            ("antrian", "antrean"),
            ("apotik", "apotek"),
            ("atlit", "atlet"),
            ("bosen", "bosan"),
            ("cabe", "cabai"),
            ("capek", "capai"),
            ("cidera", "cedera"),
            ("cinderamata", "cenderamata"),
            ("duren", "durian"),
            ("efektip", "efektif"),
            ("faham", "paham"),
            ("fikir", "pikir"),
            ("fikiran", "pikiran"),
            ("fondasi", "fondasi"),
            ("pondasi", "fondasi"),
            ("frase", "frasa"),
            ("gladi", "geladi"),
            ("hakekat", "hakikat"),
            ("hapal", "hafal"),
            ("hembus", "embus"),
            ("hierarki", "hierarki"),
            ("hirarki", "hierarki"),
            ("hut", "HUT"),
            ("ijazah", "ijazah"),
            ("ijin", "izin"),
            ("isteri", "istri"),
            ("jadwal", "jadwal"),
            ("jaman", "zaman"),
            ("jenazah", "jenazah"),
            ("kanker", "kanker"),
            ("karir", "karier"),
            ("kharisma", "karisma"),
            ("kolektip", "kolektif"),
            ("komplit", "komplet"),
            ("konkrit", "konkret"),
            ("kreatifitas", "kreativitas"),
            ("kuitansi", "kuitansi"),
            ("kwitansi", "kuitansi"),
            ("kwalitas", "kualitas"),
            ("kuantitas", "kuantitas"),
            ("lobang", "lubang"),
            ("merubah", "mengubah"),
            ("milyar", "miliar"),
            ("nafas", "napas"),
            ("nasehat", "nasihat"),
            ("nomer", "nomor"),
            ("objek", "objek"),
            ("obyek", "objek"),
            ("otentik", "autentik"),
            ("pasphoto", "pasfoto"),
            ("praktek", "praktik"),
            ("propinsi", "provinsi"),
            ("rejeki", "rezeki"),
            ("resiko", "risiko"),
            ("sekedar", "sekadar"),
            ("silahkan", "silakan"),
            ("sosialisasi", "sosialisasi"),
            ("standarisasi", "standardisasi"),
            ("subjek", "subjek"),
            ("subyek", "subjek"),
            ("tehnik", "teknik"),
            ("telpon", "telepon"),
            ("terlanjur", "terlanjur"),
            ("terlantar", "telantar"),
            ("terpercaya", "tepercaya"),
            ("terperdaya", "teperdaya"),
            ("terimakasih", "terima kasih"),
            ("tanggungjawab", "tanggung jawab"),
            ("kerjasama", "kerja sama"),
            ("tandatangan", "tanda tangan"),
            ("ibukota", "ibu kota"),
            ("tatabahasa", "tata bahasa"),
        ];

        for (non_std, std) in pairs {
            map.insert(non_std, std);
        }

        Self { standard_map: map }
    }

    pub fn check_word(
        &self,
        word: &str,
        protected_words: &HashSet<String>,
        ignored_words: &HashSet<String>,
    ) -> Option<String> {
        let lower = word.to_lowercase();
        
        // If protected or ignored, do not modify
        if protected_words.contains(word)
            || protected_words.contains(&lower)
            || ignored_words.contains(word)
            || ignored_words.contains(&lower)
        {
            return None;
        }

        if let Some(&replacement) = self.standard_map.get(lower.as_str()) {
            if lower == replacement {
                return None; // Already standard
            }
            // Preserve leading capital if original had it
            if let Some(first_char) = word.chars().next() {
                if first_char.is_uppercase() {
                    let mut chars = replacement.chars();
                    if let Some(first) = chars.next() {
                        let capitalized = first.to_uppercase().collect::<String>() + chars.as_str();
                        return Some(capitalized);
                    }
                }
            }
            return Some(replacement.to_string());
        }

        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spelling_corrections() {
        let engine = SpellingEngine::new();
        let protected = HashSet::new();
        let ignored = HashSet::new();

        assert_eq!(engine.check_word("antri", &protected, &ignored), Some("antre".to_string()));
        assert_eq!(engine.check_word("Apotik", &protected, &ignored), Some("Apotek".to_string()));
        assert_eq!(engine.check_word("silahkan", &protected, &ignored), Some("silakan".to_string()));
        assert_eq!(engine.check_word("kualitas", &protected, &ignored), None);
    }

    #[test]
    fn test_protected_vocabulary() {
        let engine = SpellingEngine::new();
        let mut protected = HashSet::new();
        protected.insert("Apotik".to_string());
        let ignored = HashSet::new();

        // Should return None because it's protected
        assert_eq!(engine.check_word("Apotik", &protected, &ignored), None);
    }
}
