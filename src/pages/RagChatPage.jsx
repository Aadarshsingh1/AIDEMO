import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Paperclip, Send, FileText, Trash2, CheckCircle2,
  Loader2, Bot, User, BookOpen, AlertCircle, X,
  Upload, MessageSquare, ArrowLeft,
} from 'lucide-react';
import { getConfig, CONFIG_KEYS } from '../services/configService';
import axios from 'axios';

// ─── localStorage key for persisting uploaded docs list ───────────────────────
const DOCS_STORAGE_KEY = 'treos_rag_documents';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadDocs() {
  try { return JSON.parse(localStorage.getItem(DOCS_STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveDocs(docs) {
  try { localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(docs)); } catch { }
}

async function callRagWebhook(webhookId, payload, isFile = false) {
  const base = getConfig(CONFIG_KEYS.N8N_BASE_URL);
  if (!base || !webhookId) return { success: false, error: 'Webhook not configured. Please add the webhook ID in Settings.' };

  let cleanId = webhookId.trim();
  if (cleanId.includes('/')) {
    cleanId = cleanId.replace(/.*?\/(form|form-test|webhook|webhook-test)\//, '').replace(/\/chat$/, '').replace(/\/$/, '');
  }

  const rawEndpoints = [
    `${base}/webhook/${cleanId}/chat`,
    `${base}/webhook-test/${cleanId}/chat`,
    `${base}/form/${cleanId}`,
    `${base}/form-test/${cleanId}`,
    `${base}/webhook/${cleanId}`,
    `${base}/webhook-test/${cleanId}`,
  ];

  let lastErr = null;
  for (const rawUrl of rawEndpoints) {
    // Route through /n8n-proxy (Vite proxy in DEV, Vercel rewrite in PROD) to bypass CORS
    const targetUrl = base && rawUrl.startsWith(base)
      ? rawUrl.replace(base, '/n8n-proxy')
      : rawUrl;

    try {
      const res = await axios.post(targetUrl, payload, {
        headers: isFile ? undefined : { 'Content-Type': 'application/json' },
        timeout: 300_000, // 5 minute timeout for OCR & vector embedding
      });
      return { success: true, data: res.data };
    } catch (e) {
      lastErr = e;
    }
  }
  const msg = lastErr?.response?.data?.message || lastErr?.message || 'Network Error';
  return { success: false, error: msg };
}

// ─── TypingDots — animated "AI is thinking" indicator ─────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#6366f1',
          animation: `ragBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes ragBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── ChatBubble ───────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.sender === 'user';
  const isSystem = msg.sender === 'system';

  if (isSystem) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: msg.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${msg.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 500,
          color: msg.type === 'error' ? '#dc2626' : '#15803d',
        }}>
          {msg.type === 'error' ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      alignItems: 'flex-start',
      gap: 10,
      margin: '8px 0',
    }}>
      {/* AI Avatar */}
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
        }}>
          <Bot size={16} color="#fff" />
        </div>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth: '75%',
        background: isUser ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#ffffff',
        color: isUser ? '#ffffff' : '#0f172a',
        border: isUser ? 'none' : '1px solid #e2e8f0',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: '12px 16px',
        fontSize: 14, lineHeight: 1.65,
        boxShadow: isUser ? '0 4px 14px rgba(79,70,229,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {/* Attachment badge */}
        {msg.fileName && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8,
            background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 10px',
            fontSize: 12, fontWeight: 600,
          }}>
            <FileText size={13} /> {msg.fileName}
          </div>
        )}
        {/* Typing animation */}
        {msg.typing ? <TypingDots /> : <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: '#e0e7ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={16} color="#4f46e5" />
        </div>
      )}
    </div>
  );
}

// ─── DocumentItem — left sidebar entry ────────────────────────────────────────
function DocumentItem({ doc, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 10,
      background: '#f8fafc', border: '1px solid #e2e8f0',
      marginBottom: 8, transition: 'all 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#a5b4fc'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
    >
      <FileText size={15} color="#6366f1" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {doc.name}
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
          {doc.status === 'indexing'
            ? <span style={{ color: '#f59e0b' }}>⏳ Indexing...</span>
            : doc.status === 'error'
              ? <span style={{ color: '#dc2626' }}>❌ Upload Failed</span>
              : <span style={{ color: '#16a34a' }}>✅ Indexed & Ready</span>}
        </div>
      </div>
      <button
        onClick={() => onDelete(doc.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 0, flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
        onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
        title="Remove from list"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Main RagChatPage ─────────────────────────────────────────────────────────
export default function RagChatPage({ onBack }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: "Hello! 👋 I'm your AI Knowledge Assistant. Upload documents using the 📎 button below or start asking questions about your knowledge base." }
  ]);
  const [docs, setDocs] = useState(loadDocs);
  const [input, setInput] = useState('');
  const [pendingFile, setPendingFile] = useState(null); // file chosen but not yet uploaded
  const [isUploading, setIsUploading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist docs to localStorage
  useEffect(() => { saveDocs(docs); }, [docs]);

  // ── Upload file ──────────────────────────────────────────────────────────────
  async function handleUploadFile(file) {
    if (!file) return;
    setPendingFile(null);

    const uploadId = getConfig(CONFIG_KEYS.WEBHOOK_RAG_UPLOAD);

    // Show user message with attachment badge
    const userMsgId = Date.now();
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: 'Uploading document...', fileName: file.name }]);

    // Add doc to left panel as "indexing"
    const docId = `doc_${Date.now()}`;
    setDocs(prev => [...prev, { id: docId, name: file.name, status: 'indexing', uploadedAt: new Date().toISOString() }]);

    setIsUploading(true);

    if (!uploadId) {
      // No webhook configured — show helpful message
      setMessages(prev => [...prev, {
        id: Date.now(), sender: 'system', type: 'error',
        text: 'RAG Upload Webhook not configured. Go to Settings → RAG Knowledge Base to add it.',
      }]);
      setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'error' } : d));
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('PDF', file);             // Matches user's n8n Form field name "PDF"
    formData.append('Select_Document', file); // Fallback for older triggers
    formData.append('file', file);
    formData.append('document', file);
    formData.append('data', file);
    formData.append('field-0', file);
    formData.append('field_0', file);
    const result = await callRagWebhook(uploadId, formData, true);

    setIsUploading(false);

    if (result.success) {
      setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'indexed' } : d));
      setMessages(prev => [...prev, {
        id: Date.now(), sender: 'system', type: 'success',
        text: `✅ "${file.name}" indexed successfully! You can now ask questions about it.`,
      }]);
    } else {
      setDocs(prev => prev.map(d => d.id === docId ? { ...d, status: 'error' } : d));
      setMessages(prev => [...prev, {
        id: Date.now(), sender: 'system', type: 'error',
        text: `Upload failed: ${result.error}`,
      }]);
    }
  }

  // ── Send chat message ────────────────────────────────────────────────────────
  async function handleSend() {
    const question = input.trim();
    if (!question || isThinking) return;
    setInput('');

    const userId = `user_${Date.now()}_${Math.random()}`;
    const thinkId = `ai_${Date.now()}_${Math.random()}`;

    setMessages(prev => [
      ...prev,
      { id: userId, sender: 'user', text: question },
      { id: thinkId, sender: 'ai', typing: true, text: '' },
    ]);
    setIsThinking(true);

    const chatId = getConfig(CONFIG_KEYS.WEBHOOK_RAG_CHAT);

    if (!chatId) {
      setMessages(prev => prev.map(m => m.id === thinkId
        ? { ...m, typing: false, sender: 'system', type: 'error', text: 'RAG Chat Webhook not configured. Go to Settings → RAG Knowledge Base to add it.' }
        : m
      ));
      setIsThinking(false);
      return;
    }

    const result = await callRagWebhook(chatId, {
      action: 'sendMessage',
      chatInput: question,
      input: question,
      message: question,
      sessionId: 'treos-rag',
    }, false);

    setIsThinking(false);
    setMessages(prev => prev.map(m => m.id === thinkId
      ? {
        ...m, typing: false,
        text: result.success
          ? (
            result.data?.output ||
            result.data?.text ||
            result.data?.message ||
            (Array.isArray(result.data) && result.data[0]?.json?.output) ||
            (Array.isArray(result.data) && result.data[0]?.json?.text) ||
            (typeof result.data === 'string' ? result.data : JSON.stringify(result.data))
          )
          : `Error: ${result.error}`,
      }
      : m
    ));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleDeleteDoc(id) {
    setDocs(prev => prev.filter(d => d.id !== id));
  }

  const indexedCount = docs.filter(d => d.status === 'indexed').length;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: '#f8fafc' }}>

      {/* ── LEFT PANEL: Knowledge Base ── */}
      <div style={{
        width: 260, flexShrink: 0,
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={14} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Knowledge Base</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>
                {indexedCount} document{indexedCount !== 1 ? 's' : ''} indexed
              </div>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div style={{ padding: '12px 12px 8px' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '9px 0', borderRadius: 10, border: '1.5px dashed #a5b4fc',
              background: '#f5f3ff', color: '#4f46e5', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.borderColor = '#6366f1'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#a5b4fc'; }}
          >
            {isUploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); e.target.value = ''; }}
          />
        </div>

        {/* Document List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 12px' }}>
          {docs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 12px', color: '#94a3b8' }}>
              <FileText size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>No documents yet.<br />Upload a PDF to get started.</div>
            </div>
          ) : (
            docs.map(doc => <DocumentItem key={doc.id} doc={doc} onDelete={handleDeleteDoc} />)
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Chat ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Chat Header */}
        <div style={{
          padding: '14px 24px', background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
                color: '#475569', background: '#f1f5f9', border: '1px solid #cbd5e1',
                borderRadius: 8, cursor: 'pointer', marginRight: 4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
            >
              <ArrowLeft size={15} /> Back
            </button>
          )}

          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MessageSquare size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>AI Knowledge Assistant</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Powered by RAG · {indexedCount} doc{indexedCount !== 1 ? 's' : ''} in context
            </div>
          </div>
          {isThinking && (
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: '#6366f1', fontWeight: 500,
            }}>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              Thinking...
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
          <div ref={chatEndRef} />
        </div>

        {/* ── Input Bar ── */}
        <div style={{
          padding: '12px 20px 16px',
          background: '#ffffff', borderTop: '1px solid #e2e8f0',
        }}>
          {/* Pending file preview */}
          {pendingFile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 8, padding: '6px 12px', fontSize: 12,
            }}>
              <FileText size={13} color="#2563eb" />
              <span style={{ color: '#1e40af', fontWeight: 600 }}>{pendingFile.name}</span>
              <button
                onClick={() => setPendingFile(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#93c5fd' }}
              ><X size={13} /></button>
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 10,
            background: '#f8fafc', border: '1.5px solid #e2e8f0',
            borderRadius: 16, padding: '8px 12px',
            transition: 'border-color 0.2s',
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = '#6366f1'}
            onBlurCapture={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            {/* Attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Attach document"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', padding: 4, borderRadius: 8,
                flexShrink: 0, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.background = '#e0e7ff'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
            >
              <Paperclip size={18} />
            </button>

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              rows={1}
              style={{
                flex: 1, resize: 'none', background: 'none', border: 'none', outline: 'none',
                fontSize: 14, color: '#0f172a', lineHeight: 1.5,
                fontFamily: 'inherit', paddingTop: 4, maxHeight: 120, overflowY: 'auto',
              }}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                background: input.trim() && !isThinking
                  ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                  : '#e2e8f0',
                color: input.trim() && !isThinking ? '#fff' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !isThinking ? 'pointer' : 'default',
                flexShrink: 0, transition: 'all 0.2s',
                boxShadow: input.trim() && !isThinking ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
              }}
            >
              {isThinking
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <Send size={16} />}
            </button>
          </div>
          <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 6 }}>
            Press Enter to send · Shift+Enter for new line · 📎 to attach PDF
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
