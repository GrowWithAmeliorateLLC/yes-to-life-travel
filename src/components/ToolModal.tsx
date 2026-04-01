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
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
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

  const handleReset = () => {
    setResult(null)
    setError(null)
    setValues({})
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeUp 0.2s ease both',
      }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        width: '100%',
        maxWidth: 680,
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
      }}>
        <div style={{
          height: 3,
          background: `linear-gradient(to right, transparent, ${tool.accentColor}, transparent)`,
        }} />

        <div style={{
          padding: '1.75rem 2rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <div style={{
              fontSize: '0.65rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '0.35rem',
            }}>
              System {tool.number}
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.6rem',
              fontWeight: 400,
              color: 'var(--cream)',
              lineHeight: 1.1,
            }}>
              {tool.title}<br />
              <em style={{ color: tool.accentColor, fontStyle: 'italic' }}>{tool.subtitle}</em>
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              transition: 'all 0.2s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '1.75rem 2rem' }}>
          <p style={{ fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1.75rem' }}>
            {tool.description}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
            {tool.fields.map((field) => (
              <div key={field.key}>
                <label style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: '0.5rem',
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
                      background: 'var(--deep)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      padding: '0.75rem 1rem',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.875rem',
                      lineHeight: 1.6,
                      outline: 'none',
                      resize: 'vertical',
                    }}
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
                      background: 'var(--deep)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      padding: '0.75rem 1rem',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
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
              padding: '0.9rem',
              background: allFilled && !loading
                ? `linear-gradient(135deg, ${tool.accentColor}dd, ${tool.accentColor})`
                : 'var(--border)',
              border: 'none',
              color: allFilled && !loading ? '#0a0908' : 'var(--muted)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: allFilled && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.25s ease',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing intelligence...
              </>
            ) : (
              <>
                Activate Intelligence System
                <ChevronRight size={15} />
              </>
            )}
          </button>

          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.875rem 1rem',
              background: 'rgba(200, 80, 60, 0.1)',
              border: '1px solid rgba(200, 80, 60, 0.3)',
              color: '#e07060',
              fontSize: '0.83rem',
              lineHeight: 1.6,
            }}>
              {error}
            </div>
          )}
        </div>

        {result && (
          <div
            ref={resultRef}
            style={{
              borderTop: '1px solid var(--border)',
              padding: '1.75rem 2rem',
              animation: 'fadeUp 0.4s ease both',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
            }}>
              <div style={{
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: tool.accentColor,
              }}>
                Intelligence Report
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleReset}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    padding: '0.35rem 0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                  }}
                >
                  <RotateCcw size={11} />
                  New Query
                </button>
                <button
                  onClick={handleCopy}
                  style={{
                    background: 'none',
                    border: `1px solid ${copied ? tool.accentColor + '66' : 'var(--border)'}`,
                    color: copied ? tool.accentColor : 'var(--muted)',
                    cursor: 'pointer',
                    padding: '0.35rem 0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                  }}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div
              className="prose"
              dangerouslySetInnerHTML={{
                __html: `<p>${parseMarkdown(result)}</p>`
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
