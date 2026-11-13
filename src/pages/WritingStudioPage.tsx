import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Save,
  Check,
  X,
  RotateCcw,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  Search,
  Download,
  BookOpen,
  Sliders,
  CheckCheck,
  FileCheck,
  Clock,
  Type,
} from 'lucide-react';
import { api } from '../services/tauri';
import { Manuscript, RefinementOptions, RefinementResult, CorrectionRecord } from '../types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import jsPDF from 'jspdf';

interface WritingStudioPageProps {
  initialManuscriptId?: string;
}

export const WritingStudioPage: React.FC<WritingStudioPageProps> = ({ initialManuscriptId }) => {
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [selectedManuscript, setSelectedManuscript] = useState<Manuscript | null>(null);

  // Editor states
  const [rawText, setRawText] = useState('');
  const [refinedText, setRefinedText] = useState('');
  const [title, setTitle] = useState('Naskah Tanpa Judul');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Novel');

  // History for undo/redo
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Refinement options & corrections
  const [options, setOptions] = useState<RefinementOptions>({
    mode: 'standard',
    fix_capitalization: true,
    fix_punctuation: true,
    fix_spelling: true,
    fix_dialogue: true,
    fix_whitespace: true,
  });
  const [corrections, setCorrections] = useState<CorrectionRecord[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  const [activeTab, setActiveTab] = useState<'split' | 'raw' | 'refined'>('split');
  const [distractionFree, setDistractionFree] = useState(false);

  // Typography settings
  const [fontSize, setFontSize] = useState<number>(16);
  const [lineHeight, setLineHeight] = useState<number>(1.8);
  const [editorWidth, setEditorWidth] = useState<'normal' | 'wide' | 'full'>('normal');

  // Search & Replace
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [crashRecoveryEntry, setCrashRecoveryEntry] = useState<{ content: string; timestamp: string } | null>(null);
  const autosaveTimeout = useRef<number | null>(null);

  // Load initial data
  useEffect(() => {
    loadManuscripts();
  }, [initialManuscriptId]);

  const loadManuscripts = async () => {
    try {
      const list = await api.getManuscripts();
      setManuscripts(list);
      if (initialManuscriptId) {
        const found = list.find((m) => m.id === initialManuscriptId);
        if (found) {
          selectManuscript(found);
          return;
        }
      }
      if (list.length > 0 && !selectedManuscript) {
        selectManuscript(list[0]);
      } else if (list.length === 0) {
        // Create initial default manuscript
        const newM = await api.createManuscript('Draf Cerita Baru', 'Penulis', 'Novel', '');
        setManuscripts([newM]);
        selectManuscript(newM);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectManuscript = async (m: Manuscript) => {
    setSelectedManuscript(m);
    setTitle(m.title);
    setAuthor(m.author);
    setCategory(m.category);
    setRawText(m.original_content);
    setRefinedText(m.refined_content);
    setCorrections([]);
    setUndoStack([]);
    setRedoStack([]);
    setSaveStatus('saved');

    // Check crash recovery journal
    try {
      const journal = await api.getRecoveryJournal();
      if (
        journal &&
        journal.doc_id === m.id &&
        journal.content &&
        journal.content !== m.original_content &&
        journal.content !== m.refined_content
      ) {
        setCrashRecoveryEntry({ content: journal.content, timestamp: journal.timestamp });
      } else {
        setCrashRecoveryEntry(null);
      }
    } catch {}
  };

  const applyCrashRecovery = () => {
    if (!crashRecoveryEntry) return;
    setRawText(crashRecoveryEntry.content);
    setRefinedText(crashRecoveryEntry.content);
    setCrashRecoveryEntry(null);
    setSaveStatus('dirty');
  };

  const dismissCrashRecovery = async () => {
    setCrashRecoveryEntry(null);
    await api.clearRecoveryJournal();
  };

  const handleRawChange = (val: string) => {
    setUndoStack((prev) => [...prev.slice(-20), rawText]);
    setRedoStack([]);
    setRawText(val);
    setSaveStatus('dirty');

    if (selectedManuscript) {
      api.writeRecoveryJournal({
        doc_id: selectedManuscript.id,
        doc_type: 'manuscript',
        title,
        content: val,
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    // Debounced autosave
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    autosaveTimeout.current = window.setTimeout(() => {
      saveManuscript(false);
    }, 2000);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, rawText]);
    setUndoStack((u) => u.slice(0, -1));
    setRawText(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, rawText]);
    setRedoStack((r) => r.slice(0, -1));
    setRawText(next);
  };

  const runRefine = async () => {
    if (!selectedManuscript) return;
    try {
      setIsRefining(true);
      const res = await api.refineManuscript(selectedManuscript.id, rawText, options);
      setRefinedText(res.refined_text);
      setCorrections(res.corrections);
      setActiveTab('split');
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefining(false);
    }
  };

  const acceptCorrection = (corrId: string) => {
    setCorrections((prev) =>
      prev.map((c) => (c.id === corrId ? { ...c, accepted: true } : c))
    );
  };

  const rejectCorrection = (corrId: string) => {
    const target = corrections.find((c) => c.id === corrId);
    if (!target) return;
    setCorrections((prev) =>
      prev.map((c) => (c.id === corrId ? { ...c, accepted: false } : c))
    );
    // Revert that piece in refinedText
    setRefinedText((prev) => prev.replace(target.proposed_text, target.original_text));
  };

  const acceptAllCorrections = () => {
    setCorrections((prev) => prev.map((c) => ({ ...c, accepted: true })));
  };

  const restoreOriginal = () => {
    setRefinedText(rawText);
    setCorrections([]);
  };

  const saveManuscript = async (createNewVersion = false) => {
    if (!selectedManuscript) return;
    try {
      setSaveStatus('saving');
      const updated = await api.updateManuscript(
        selectedManuscript.id,
        title,
        author,
        category,
        selectedManuscript.description,
        selectedManuscript.tags,
        refinedText,
        createNewVersion
      );
      setSelectedManuscript(updated);
      setSaveStatus('saved');
    } catch (e) {
      console.error(e);
      setSaveStatus('dirty');
    }
  };

  // Search & Replace
  const handleReplaceAll = () => {
    if (!searchTerm) return;
    const updated = rawText.replaceAll(searchTerm, replaceTerm);
    handleRawChange(updated);
  };

  // Export DOCX
  const exportDocx = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: title,
              heading: HeadingLevel.TITLE,
            }),
            new Paragraph({
              text: author ? `Oleh: ${author}` : '',
            }),
            new Paragraph({
              text: '—'.repeat(25),
            }),
            ...refinedText.split('\n\n').map(
              (p) =>
                new Paragraph({
                  children: [new TextRun(p.trim())],
                  spacing: { after: 200 },
                })
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const exportPdf = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(title, 40, 50);

    if (author) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(11);
      pdf.text(`Penulis: ${author}`, 40, 70);
    }

    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);

    const splitContent = pdf.splitTextToSize(refinedText, 515);
    pdf.text(splitContent, 40, author ? 100 : 80);
    pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  // Export Markdown / TXT
  const exportTxt = (type: 'md' | 'txt') => {
    const content =
      type === 'md'
        ? `# ${title}\n\n*Penulis: ${author}*\n\n---\n\n${refinedText}`
        : `${title}\nOleh: ${author}\n\n${refinedText}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculations
  const textForStats = activeTab === 'raw' ? rawText : refinedText;
  const wordCount = textForStats.trim() ? textForStats.trim().split(/\s+/).length : 0;
  const charCount = textForStats.length;
  const sentenceCount = textForStats.split(/[.!?]+/).filter(Boolean).length;
  const paragraphCount = textForStats.split(/\n\n+/).filter((p) => p.trim()).length;
  const readingTimeMin = Math.ceil(wordCount / 200);

  const widthClasses = {
    normal: 'max-w-3xl',
    wide: 'max-w-5xl',
    full: 'max-w-full',
  }[editorWidth];

  return (
    <div
      className={`flex flex-col h-full bg-[#0d0f12] text-[#e6edf3] ${
        distractionFree ? 'p-0' : ''
      }`}
    >
      {/* Top Toolbar */}
      {!distractionFree && (
        <header className="px-5 py-3 border-b border-[#222733] bg-[#14171d] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Document Title & Author */}
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaveStatus('dirty');
              }}
              className="bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-[#384252] focus:border-indigo-500 focus:outline-none px-1 py-0.5"
              placeholder="Judul Naskah..."
            />
            <span className="text-zinc-600">/</span>
            <input
              type="text"
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value);
                setSaveStatus('dirty');
              }}
              className="bg-transparent text-xs text-zinc-400 border-b border-transparent hover:border-[#384252] focus:border-indigo-500 focus:outline-none px-1 py-0.5 w-28"
              placeholder="Nama Penulis"
            />
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e2430] text-indigo-300 font-mono">
              v{selectedManuscript?.version_number ?? 1}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#1b2029] p-0.5 rounded-lg border border-[#2a3140] text-xs">
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  activeTab === 'raw'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                RAW
              </button>
              <button
                onClick={() => setActiveTab('split')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  activeTab === 'split'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Bandingkan
              </button>
              <button
                onClick={() => setActiveTab('refined')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  activeTab === 'refined'
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Hasil Refined
              </button>
            </div>

            {/* Refine Engine Button */}
            <button
              onClick={runRefine}
              disabled={isRefining || !rawText.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRefining ? 'Menganalisis...' : 'Refine Naskah'}</span>
            </button>

            {/* Save Button */}
            <button
              onClick={() => saveManuscript(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202633] hover:bg-[#2b3345] text-zinc-200 text-xs font-medium border border-[#30384a] transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simpan Versi</span>
            </button>

            {/* Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1.5 rounded-lg border text-zinc-400 hover:text-white transition-colors ${
                showSearch
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                  : 'bg-[#1b2029] border-[#2a3140]'
              }`}
              title="Cari & Ganti"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Distraction Free Toggle */}
            <button
              onClick={() => setDistractionFree(true)}
              className="p-1.5 rounded-lg bg-[#1b2029] border border-[#2a3140] text-zinc-400 hover:text-white transition-colors"
              title="Mode Fokus Penuh"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Floating Exit Button for Distraction Free */}
      {distractionFree && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setDistractionFree(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181c24]/80 backdrop-blur border border-[#2e3545] text-xs text-zinc-300 hover:text-white"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Keluar Mode Fokus</span>
          </button>
        </div>
      )}

      {/* Search & Replace Floating Bar */}
      {showSearch && !distractionFree && (
        <div className="px-5 py-2.5 bg-[#171b24] border-b border-[#282f3d] flex items-center gap-3 text-xs">
          <input
            type="text"
            placeholder="Cari teks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2.5 py-1 rounded bg-[#0f1115] border border-[#2a3140] text-white w-48 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            placeholder="Ganti dengan..."
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            className="px-2.5 py-1 rounded bg-[#0f1115] border border-[#2a3140] text-white w-48 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleReplaceAll}
            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            Ganti Semua
          </button>
          <button
            onClick={() => setShowSearch(false)}
            className="text-zinc-500 hover:text-zinc-300 ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Crash Recovery Notification Banner */}
      {crashRecoveryEntry && (
        <div className="px-5 py-2.5 bg-amber-950/40 border-b border-amber-800/60 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              <strong>Pemulihan Crash Tersedia:</strong> Draf kerja yang belum tersimpan dari sesi sebelumnya terdeteksi ({new Date(crashRecoveryEntry.timestamp).toLocaleTimeString('id-ID')}).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={applyCrashRecovery}
              className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
            >
              Pulihkan Draf
            </button>
            <button
              onClick={dismissCrashRecovery}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              Abaikan
            </button>
          </div>
        </div>
      )}

      {/* Editor Body Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Main Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* RAW Editor Panel */}
            {(activeTab === 'raw' || activeTab === 'split') && (
              <div
                className={`flex-1 flex flex-col h-full border-r border-[#222733] bg-[#0d0f12] overflow-hidden`}
              >
                <div className="px-4 py-2 border-b border-[#222733] bg-[#12151b] flex items-center justify-between text-xs text-zinc-400 shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-zinc-200">RAW Input</span>
                    <span className="text-[10px] text-zinc-500">
                      (Tulis bebas tanpa cemas tata bahasa)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                      className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30"
                      title="Undo"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30"
                      title="Redo"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex justify-center">
                  <textarea
                    value={rawText}
                    onChange={(e) => handleRawChange(e.target.value)}
                    placeholder="Mulai ketik draf mentah Anda di sini... Biarkan pikiran Anda mengalir."
                    style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                    className={`w-full ${widthClasses} bg-transparent text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none manuscript-editor leading-relaxed`}
                  />
                </div>
              </div>
            )}

            {/* Refined Output Panel */}
            {(activeTab === 'refined' || activeTab === 'split') && (
              <div className="flex-1 flex flex-col h-full bg-[#101319] overflow-hidden">
                <div className="px-4 py-2 border-b border-[#222733] bg-[#12151b] flex items-center justify-between text-xs text-zinc-400 shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-indigo-400">Refined Output</span>
                    <span className="text-[10px] text-zinc-500">
                      (Hasil transformasi deterministik)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={restoreOriginal}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Kembalikan RAW</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex justify-center">
                  <textarea
                    value={refinedText}
                    onChange={(e) => setRefinedText(e.target.value)}
                    placeholder="Hasil perbaikan tata bahasa, tanda baca, dan kapitalisasi akan tampil di sini setelah Anda memilih Refine."
                    style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                    className={`w-full ${widthClasses} bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none manuscript-editor leading-relaxed`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Corrections & Document Info */}
        {!distractionFree && (
          <aside className="w-80 border-l border-[#222733] bg-[#13161c] flex flex-col justify-between shrink-0 overflow-hidden">
            {/* Corrections Review Header */}
            <div className="p-4 border-b border-[#222733] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Koreksi Tata Bahasa
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {corrections.length} perbaikan terdeteksi
                </p>
              </div>
              {corrections.length > 0 && (
                <button
                  onClick={acceptAllCorrections}
                  className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-[11px] font-medium border border-indigo-500/30 flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Terima Semua</span>
                </button>
              )}
            </div>

            {/* Corrections List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {corrections.length > 0 ? (
                corrections.map((corr) => (
                  <div
                    key={corr.id}
                    className={`p-2.5 rounded-lg border text-xs transition-colors ${
                      corr.accepted
                        ? 'bg-[#18201a] border-emerald-900/40 text-emerald-300'
                        : 'bg-[#181c24] border-[#29303d] text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {corr.correction_type}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {corr.confidence}
                      </span>
                    </div>

                    <div className="space-y-1 mb-2 font-serif text-[13px]">
                      <div className="text-rose-400/80 line-through">
                        {corr.original_text}
                      </div>
                      <div className="text-emerald-400 font-medium">
                        {corr.proposed_text}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-zinc-800/60">
                      <button
                        onClick={() => rejectCorrection(corr.id)}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[11px] flex items-center gap-1"
                        title="Tolak koreksi"
                      >
                        <X className="w-3 h-3" />
                        <span>Tolak</span>
                      </button>
                      <button
                        onClick={() => acceptCorrection(corr.id)}
                        className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center gap-1"
                        title="Terima koreksi"
                      >
                        <Check className="w-3 h-3" />
                        <span>Terima</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-zinc-500">
                  <FileCheck className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                  Belum ada usulan koreksi. Klik tombol <strong>Refine Naskah</strong> untuk
                  memulai analisis aturan bahasa.
                </div>
              )}
            </div>

            {/* Document Statistics & Export Drawer */}
            <div className="p-4 border-t border-[#222733] bg-[#101318] space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-[#171b23] border border-[#232936]">
                  <div className="text-zinc-500">Jumlah Kata</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {wordCount.toLocaleString()}
                  </div>
                </div>
                <div className="p-2 rounded bg-[#171b23] border border-[#232936]">
                  <div className="text-zinc-500">Estimasi Baca</div>
                  <div className="text-sm font-bold text-indigo-400 font-mono">
                    ~{readingTimeMin} mnt
                  </div>
                </div>
                <div className="p-2 rounded bg-[#171b23] border border-[#232936]">
                  <div className="text-zinc-500">Karakter</div>
                  <div className="text-sm font-bold text-zinc-300 font-mono">
                    {charCount.toLocaleString()}
                  </div>
                </div>
                <div className="p-2 rounded bg-[#171b23] border border-[#232936]">
                  <div className="text-zinc-500">Kalimat / Paragraf</div>
                  <div className="text-sm font-bold text-zinc-300 font-mono">
                    {sentenceCount} / {paragraphCount}
                  </div>
                </div>
              </div>

              {/* Export Dropdown / Buttons */}
              <div className="pt-2 border-t border-[#222733] flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400">Ekspor Naskah:</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={exportDocx}
                    className="px-2 py-1 rounded bg-[#1c212c] hover:bg-[#252c3b] text-zinc-300 text-[11px] font-medium border border-[#2b3345]"
                    title="Ekspor ke Microsoft Word (.docx)"
                  >
                    DOCX
                  </button>
                  <button
                    onClick={exportPdf}
                    className="px-2 py-1 rounded bg-[#1c212c] hover:bg-[#252c3b] text-zinc-300 text-[11px] font-medium border border-[#2b3345]"
                    title="Ekspor ke PDF"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => exportTxt('md')}
                    className="px-2 py-1 rounded bg-[#1c212c] hover:bg-[#252c3b] text-zinc-300 text-[11px] font-medium border border-[#2b3345]"
                    title="Ekspor ke Markdown (.md)"
                  >
                    MD
                  </button>
                  <button
                    onClick={() => exportTxt('txt')}
                    className="px-2 py-1 rounded bg-[#1c212c] hover:bg-[#252c3b] text-zinc-300 text-[11px] font-medium border border-[#2b3345]"
                    title="Ekspor ke Plain Text (.txt)"
                  >
                    TXT
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Status & Typography Bar */}
      {!distractionFree && (
        <footer className="px-5 py-2 border-t border-[#222733] bg-[#12151b] flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  saveStatus === 'saved'
                    ? 'bg-emerald-500'
                    : saveStatus === 'saving'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-zinc-500'
                }`}
              />
              <span>
                {saveStatus === 'saved'
                  ? 'Tersimpan otomatis'
                  : saveStatus === 'saving'
                  ? 'Menyimpan...'
                  : 'Perubahan belum disimpan'}
              </span>
            </span>
            <span>•</span>
            <span className="font-mono">
              Mode Refinement: <strong className="text-zinc-400 capitalize">{options.mode}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Font size adjuster */}
            <div className="flex items-center space-x-1.5">
              <Type className="w-3.5 h-3.5 text-zinc-400" />
              <button
                onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                className="px-1.5 py-0.5 rounded hover:bg-zinc-800"
              >
                A-
              </button>
              <span className="font-mono text-[11px]">{fontSize}px</span>
              <button
                onClick={() => setFontSize((s) => Math.min(24, s + 1))}
                className="px-1.5 py-0.5 rounded hover:bg-zinc-800"
              >
                A+
              </button>
            </div>

            {/* Line Height */}
            <div className="flex items-center space-x-1">
              <span className="text-[11px]">Spasi:</span>
              {[1.5, 1.8, 2.0].map((lh) => (
                <button
                  key={lh}
                  onClick={() => setLineHeight(lh)}
                  className={`px-1.5 py-0.5 rounded text-[11px] ${
                    lineHeight === lh ? 'bg-indigo-600 text-white' : 'hover:bg-zinc-800'
                  }`}
                >
                  {lh}
                </button>
              ))}
            </div>

            {/* Width */}
            <div className="flex items-center space-x-1">
              <span className="text-[11px]">Lebar:</span>
              {(['normal', 'wide', 'full'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setEditorWidth(w)}
                  className={`px-1.5 py-0.5 rounded text-[11px] capitalize ${
                    editorWidth === w ? 'bg-indigo-600 text-white' : 'hover:bg-zinc-800'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
