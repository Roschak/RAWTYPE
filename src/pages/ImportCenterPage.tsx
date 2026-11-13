import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Clipboard,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { api } from '../services/tauri';
import { NoteImportItem, ImportSummary, ClassificationResult, NoteCategory } from '../types';

interface DetectedNotePreview {
  index: number;
  title: string;
  content: string;
  categoryId: string;
  categoryName: string;
  isSensitive: boolean;
  isDuplicate: boolean;
}

export const ImportCenterPage: React.FC = () => {
  const [importSource, setImportSource] = useState<'text' | 'files'>('text');
  const [rawInput, setRawInput] = useState('');
  const [delimiter, setDelimiter] = useState('--- NOTE');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Analysis & Preview
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previews, setPreviews] = useState<DetectedNotePreview[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);

  // Completion summary
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  React.useEffect(() => {
    api.getNoteCategories().then(setCategories).catch(console.error);
  }, []);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRawInput(text);
    } catch {
      alert('Gagal mengakses clipboard. Silakan tempel (Ctrl+V) langsung ke kotak teks.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let combined = '';
    let readCount = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        combined += `\n\n--- NOTE: ${file.name} ---\n${text}\n`;
        readCount++;
        if (readCount === files.length) {
          setRawInput((prev) => (prev ? `${prev}\n${combined}` : combined));
        }
      };
      reader.readAsText(file);
    });
  };

  const analyzeNotes = async () => {
    if (!rawInput.trim()) return;
    setIsAnalyzing(true);
    setImportResult(null);

    try {
      // Split by delimiter or double newlines if no delimiter found
      let chunks: string[] = [];
      if (delimiter && rawInput.includes(delimiter)) {
        chunks = rawInput
          .split(new RegExp(`(?:^|\\n)${delimiter}[^\\n]*\\n`, 'g'))
          .map((c) => c.trim())
          .filter(Boolean);
      } else {
        // Fallback split by 3 newlines or preserve blocks
        chunks = rawInput
          .split(/\n\s*\n\s*\n/)
          .map((c) => c.trim())
          .filter(Boolean);
        if (chunks.length <= 1) {
          chunks = [rawInput.trim()];
        }
      }

      const analyzed: DetectedNotePreview[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
        const title = lines.length > 0 ? lines[0].replace(/^#+\s*/, '').slice(0, 80) : `Catatan ${i + 1}`;
        const content = chunk;

        // Run deterministic rule classifier
        const c = await api.classifyNoteContent(title, content);

        analyzed.push({
          index: i,
          title,
          content,
          categoryId: c.category_id,
          categoryName: c.category_name,
          isSensitive: c.is_sensitive,
          isDuplicate: false,
        });
      }

      setPreviews(analyzed);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (previews.length === 0) return;
    setIsImporting(true);
    try {
      const items: NoteImportItem[] = previews.map((p) => ({
        title: p.title,
        content: p.content,
        source: importSource === 'files' ? 'File Import' : 'Notepad Clipboard',
      }));

      const summary = await api.batchImportNotes(items, skipDuplicates);
      setImportResult(summary);
      setPreviews([]);
      setRawInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsImporting(false);
    }
  };

  const sensitiveDetectedCount = previews.filter((p) => p.isSensitive).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0f12]">
      {/* Header */}
      <div className="p-6 border-b border-[#222733] bg-[#12151b] shrink-0">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-400" />
          <span>Pusat Impor Catatan (Notepad Consolidator)</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Kumpulkan ratusan catatan Notepad, file TXT, dan Markdown yang berserakan menjadi satu brankas terorganisir.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Input Card */}
        <div className="p-5 rounded-xl bg-[#14171d] border border-[#222733] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222733] pb-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setImportSource('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  importSource === 'text'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-white bg-[#1b2029]'
                }`}
              >
                Tempel Teks / Clipboard
              </button>
              <button
                onClick={() => setImportSource('files')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  importSource === 'files'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-white bg-[#1b2029]'
                }`}
              >
                Unggah File TXT / MD
              </button>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <button
                onClick={handlePasteFromClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f2532] hover:bg-[#283042] text-zinc-200 border border-[#2e374a]"
              >
                <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tempel dari Clipboard</span>
              </button>

              {importSource === 'files' && (
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer font-medium">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih Banyak File</span>
                  <input
                    type="file"
                    multiple
                    accept=".txt,.md,.text"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Delimiter & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">
                Pemisah Catatan (Delimiter Opsional):
              </label>
              <input
                type="text"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                placeholder="Misal: --- NOTE"
                className="w-full px-3 py-1.5 rounded-lg bg-[#1a1e27] border border-[#2a303e] text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Jika teks memiliki format '--- NOTE 01 ---', sistem akan memisahkan tiap blok secara otomatis.
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded bg-[#181c24] border-[#2a303e] text-indigo-600 focus:ring-0"
                />
                <span>Abaikan duplikasi catatan yang sudah ada</span>
              </label>
              <span className="text-[10px] text-zinc-500">
                Mencegah catatan ganda masuk kembali ke dalam database.
              </span>
            </div>
          </div>

          {/* Text Area Input */}
          <div>
            <textarea
              rows={8}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Tempel catatan Notepad Anda di sini..."
              className="w-full p-4 rounded-lg bg-[#0f1115] border border-[#222733] text-zinc-200 placeholder-zinc-600 text-xs font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={analyzeNotes}
              disabled={isAnalyzing || !rawInput.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <span>{isAnalyzing ? 'Menganalisis Aturan...' : 'Analisis & Pratinjau Klasifikasi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Import Results Banner */}
        {importResult && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-sm text-white">Impor Berhasil!</span>
                <p className="text-[11px] text-emerald-400/90 mt-0.5">
                  Total item: {importResult.total} • Sukses diimpor: {importResult.imported} • Duplikat diabaikan: {importResult.duplicates} • Sensitif terlindungi: {importResult.sensitive_detected}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Classification Preview Area */}
        {previews.length > 0 && (
          <div className="p-5 rounded-xl bg-[#14171d] border border-[#222733] space-y-4">
            <div className="flex items-center justify-between border-b border-[#222733] pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Pratinjau Hasil Deteksi ({previews.length} Catatan)</span>
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Periksa klasifikasi otomatis sebelum disimpan ke database.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {sensitiveDetectedCount > 0 && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/50 text-rose-300 border border-rose-800/60 text-[11px] font-medium font-mono">
                    <Shield className="w-3.5 h-3.5" />
                    <span>{sensitiveDetectedCount} Kredensial Terdeteksi</span>
                  </span>
                )}

                <button
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/30"
                >
                  {isImporting ? 'Menyimpan Catatan...' : 'Konfirmasi & Simpan Catatan'}
                </button>
              </div>
            </div>

            {/* Previews List */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto p-1">
              {previews.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-4 ${
                    item.isSensitive
                      ? 'bg-rose-950/20 border-rose-900/50'
                      : 'bg-[#181c24] border-[#262c38]'
                  }`}
                >
                  <div className="truncate flex-1">
                    <div className="flex items-center gap-2 font-medium text-white mb-0.5 truncate">
                      {item.isSensitive && (
                        <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className="truncate">{item.title}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono truncate">
                      {item.isSensitive
                        ? '[Konten Terlindungi - Berisi Kredensial/Password]'
                        : item.content.slice(0, 100)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={item.categoryId}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setPreviews((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, categoryId: newCat } : p))
                        );
                      }}
                      className="px-2 py-1 rounded bg-[#101319] border border-[#2a303e] text-xs text-zinc-300"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() =>
                        setPreviews((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-zinc-500 hover:text-rose-400 p-1"
                      title="Batalkan item ini"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
