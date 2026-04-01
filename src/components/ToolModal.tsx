import React, { useState, useRef, useEffect } from 'react'
import { X, Loader2, ChevronRight, RotateCcw, Copy, Check } from 'lucide-react'
import type { Tool } from '../App'

interface Props {
  tool: Tool
  onClose: () => void
}

function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

export default function ToolModal({ tool, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  const allFilled = tool.fields.every(f => (values[f.key] || '').trim().length > 0)

  const handleSubmit = async () => {
    if (!allFilled || loading) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const prompt = tool.buildPrompt(values)
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error((err as any).message || `Request failed: ${response.status}`)
      }
      const data = await response.json()
      setResult(data.result)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleReset = () => { setResult(null); setError(null); setValues({}) }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(44,31,26,0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'popIn 0.22s ease both',
      }}
    >
      <div style={{
        background: 'var(--white)',
        borderRadius: 20,
        border: `2px solid ${tool.accentColor}44`,
        width: '100%',
        maxWidth: 680,
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 24px 64px rgba(44,31,26,0.18)',
      }}>

        {/* Colored top bar */}
        <div style={{
          height: 5,
          background: `linear-gradient(to right, ${tool.accentColor}, var(--peach))`,
          borderRadius: '20px 20px 0 0',
        }} />

        {/* Header */}
        <div style={{
          padding: '1.5rem 2rem 1.25rem',
          borderBottom: '1px solid var(--pink-soft)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'var(--blush)',
        }}>
          <div>
            <span style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: tool.accentColor,
              display: 'block',
              marginBottom: '0.2rem',
            }}>System {tool.number}</span>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.65rem',
              fontWeight: 900,
              color: 'var(--dark)',
              lineHeight: 1.1,
            }}>
              {tool.title}{' '}
              <em style={{ fontStyle: 'italic', color: tool.accentColor }}>{tool.subtitle}</em>
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--white)',
              border: '1.5px solid var(--pink-soft)',
              color: 'var(--dark-mid)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: 8,
              display: 'flex',
              transition: 'all 0.15s',
              flexShrink: 0,
              marginTop: '0.2rem',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = tool.accentColor; (e.currentTarget as HTMLElement).style.color = tool.accentColor }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pink-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--dark-mid)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '1.75rem 2rem' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--dark-mid)', lineHeight: 1.7, marginBottom: '1.75rem', fontWeight: 300 }}>
            {tool.description}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.5rem' }}>
            {tool.fields.map((field) => (
              <div key={field.key}>
                <label style={{
                  display: 'block',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--dark-mid)',
                  marginBottom: '0.45rem',
                }}>
                  {field.label}
                </label>
                {field.multiline ? (
                  <textarea
                    value={values[field.key] || ''}
                    onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                    style={{
                      width: '100%',
                      background: 'var(--cream)',
                      border: '1.5px solid var(--pink-soft)',
                      borderRadius: 10,
                      color: 'var(--dark)',
                      padding: '0.8rem 1rem',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.88rem',
                      lineHeight: 1.6,
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = tool.accentColor }}
                    onBlur={e => { e.target.style.borderColor = 'var(--pink-soft)' }}
                  />
                ) : (
                  <input
                    type="text"
                    value={values[field.key] || ''}
                    onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    onKeyDown={e => { if (e.key === 'Enter' && allFilled) handleSubmit() }}
                    style={{
                      width: '100%',
                      background: 'var(--cream)',
                      border: '1.5px solid var(--pink-soft)',
                      borderRadius: 10,
                      color: 'var(--dark)',
                      padding: '0.8rem 1rem',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = tool.accentColor }}
                    onBlur={e => { e.target.style.borderColor = 'var(--pink-soft)' }}
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!allFilled || loading}
            style={{
              width: '100%',
              padding: '0.95rem',
              background: allFilled && !loading ? tool.accentColor : 'var(--pink-soft)',
              border: 'none',
              borderRadius: 12,
              color: allFilled && !loading ? 'white' : 'var(--dark-mid)',
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: allFilled && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: allFilled && !loading ? `0 4px 16px ${tool.accentColor}44` : 'none',
            }}
            onMouseEnter={e => { if (allFilled && !loading) (e.currentTarget as HTMLElement).style.background = 'var(--coral-dark)' }}
            onMouseLeave={e => { if (allFilled && !loading) (e.currentTarget as HTMLElement).style.background = tool.accentColor }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing intelligence...
              </>
            ) : (
              <>
                Activate Intelligence System
                <ChevronRight size={16} />
              </>
            )}
          </button>

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.875rem 1rem',
              background: '#FFF0EE',
              border: '1.5px solid #F4A882',
              borderRadius: 10,
              color: 'var(--coral-dark)',
              fontSize: '0.85rem',
              lineHeight: 1.6,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div
            ref={resultRef}
            style={{
              borderTop: '1.5px solid var(--pink-soft)',
              padding: '1.75rem 2rem',
              background: 'var(--cream)',
              borderRadius: '0 0 20px 20px',
              animation: 'fadeUp 0.35s ease both',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}>
              <span style={{
                fontFamily: 'var(--font-hand)',
                fontSize: '1rem',
                fontWeight: 600,
                color: tool.accentColor,
              }}>Intelligence Report ✦</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleReset}
                  style={{
                    background: 'var(--white)',
                    border: '1.5px solid var(--pink-soft)',
                    borderRadius: 8,
                    color: 'var(--dark-mid)',
                    cursor: 'pointer',
                    padding: '0.35rem 0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--dark-mid)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pink-soft)' }}
                >
                  <RotateCcw size={11} /> New Query
                </button>
                <button
                  onClick={handleCopy}
                  style={{
                    background: copied ? tool.accentColor : 'var(--white)',
                    border: `1.5px solid ${copied ? tool.accentColor : 'var(--pink-soft)'}`,
                    borderRadius: 8,
                    color: copied ? 'white' : 'var(--dark-mid)',
                    cursor: 'pointer',
                    padding: '0.35rem 0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: `<p>${parseMarkdown(result)}</p>` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
