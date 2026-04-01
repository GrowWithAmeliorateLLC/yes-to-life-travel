import React, { useState, useRef, useEffect } from 'react'
import { X, Loader2, RotateCcw, ExternalLink, Star, Zap } from 'lucide-react'
import type { Tool } from '../App'

interface Props {
  tool: Tool
  onClose: () => void
}

interface BookingLink {
  label: string
  url: string
}

interface Deal {
  rank: number
  badge: string
  title: string
  price_range: string
  route?: string
  timing?: string
  stars?: number
  strategy?: string
  why_best: string
  unique_angle: string
  booking_links: BookingLink[]
}

interface DealResult {
  summary: string
  deals: Deal[]
  pro_tip: string
}

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  'Best Value':       { bg: '#E8523A', text: '#fff' },
  'Award Sweet Spot': { bg: '#8B9ED9', text: '#fff' },
  'Budget Pick':      { bg: '#8A8A3C', text: '#fff' },
  'Miles Winner':     { bg: '#8B9ED9', text: '#fff' },
  'Hidden Gem':       { bg: '#F4A882', text: '#2C1F1A' },
  'Direct Route':     { bg: '#E8523A', text: '#fff' },
  'Family Pick':      { bg: '#F4A882', text: '#2C1F1A' },
  'Best Deal':        { bg: '#E8523A', text: '#fff' },
  'Points Sweet Spot':{ bg: '#8B9ED9', text: '#fff' },
  'Call Direct':      { bg: '#8A8A3C', text: '#fff' },
  'Flash Sale':       { bg: '#C93F28', text: '#fff' },
  'Boutique Pick':    { bg: '#F4A882', text: '#2C1F1A' },
  'Best Views':       { bg: '#8B9ED9', text: '#fff' },
  'Adults Only':      { bg: '#4A3530', text: '#F4A882' },
}

function parseDealResult(raw: string): DealResult | null {
  try {
    const clean = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(clean)
    if (parsed.deals && Array.isArray(parsed.deals)) return parsed as DealResult
    return null
  } catch {
    return null
  }
}

export default function ToolModal({ tool, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [deals, setDeals] = useState<DealResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    if (deals && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [deals])

  const allFilled = tool.fields.every(f => f.optional || (values[f.key] || '').trim().length > 0)

  const handleSubmit = async () => {
    if (!allFilled || loading) return
    setLoading(true)
    setDeals(null)
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
      const parsed = parseDealResult(data.result)
      if (parsed) {
        setDeals(parsed)
      } else {
        throw new Error('Could not parse deal results. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => { setDeals(null); setError(null); setValues({}) }
  const submitLabel = tool.id === 'flights' ? 'Find My Flight Deal' : 'Find My Hotel Deal'

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(44,31,26,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'popIn 0.22s ease both' }}
    >
      <div style={{ background: 'var(--white)', borderRadius: 20, border: `2px solid ${tool.accentColor}44`, width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto', position: 'relative', boxShadow: '0 24px 64px rgba(44,31,26,0.18)' }}>

        <div style={{ height: 5, background: `linear-gradient(to right, ${tool.accentColor}, var(--peach))`, borderRadius: '20px 20px 0 0' }} />

        {/* Header */}
        <div style={{ padding: '1.5rem 2rem 1.25rem', borderBottom: '1px solid var(--pink-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--blush)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 900, color: 'var(--dark)', lineHeight: 1.1 }}>{tool.title}</h2>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', fontWeight: 600, color: tool.accentColor, marginTop: '0.2rem' }}>{tool.subtitle}</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--white)', border: '1.5px solid var(--pink-soft)', color: 'var(--dark-mid)', cursor: 'pointer', padding: '0.4rem', borderRadius: 8, display: 'flex', transition: 'all 0.15s', flexShrink: 0, marginTop: '0.2rem' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = tool.accentColor; (e.currentTarget as HTMLElement).style.color = tool.accentColor }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pink-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--dark-mid)' }}
          ><X size={16} /></button>
        </div>

        {/* Form */}
        {!deals && (
          <div style={{ padding: '1.75rem 2rem' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--dark-mid)', lineHeight: 1.7, marginBottom: '1.75rem', fontWeight: 300 }}>{tool.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.5rem' }}>
              {tool.fields.map((field) => (
                <div key={field.key}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dark-mid)', marginBottom: '0.45rem' }}>
                    {field.label}
                    {field.optional && <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: 0, textTransform: 'none', color: 'var(--peach)' }}>— optional</span>}
                  </label>
                  {field.multiline ? (
                    <textarea value={values[field.key] || ''} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={3}
                      style={{ width: '100%', background: 'var(--cream)', border: '1.5px solid var(--pink-soft)', borderRadius: 10, color: 'var(--dark)', padding: '0.8rem 1rem', fontFamily: 'var(--font-body)', fontSize: '0.88rem', lineHeight: 1.6, outline: 'none', resize: 'vertical', transition: 'border-color 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = tool.accentColor }} onBlur={e => { e.target.style.borderColor = 'var(--pink-soft)' }} />
                  ) : (
                    <input type="text" value={values[field.key] || ''} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} placeholder={field.placeholder}
                      onKeyDown={e => { if (e.key === 'Enter' && allFilled) handleSubmit() }}
                      style={{ width: '100%', background: 'var(--cream)', border: '1.5px solid var(--pink-soft)', borderRadius: 10, color: 'var(--dark)', padding: '0.8rem 1rem', fontFamily: 'var(--font-body)', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = tool.accentColor }} onBlur={e => { e.target.style.borderColor = 'var(--pink-soft)' }} />
                  )}
                </div>
              ))}
            </div>
            <button onClick={handleSubmit} disabled={!allFilled || loading}
              style={{ width: '100%', padding: '0.95rem', background: allFilled && !loading ? tool.accentColor : 'var(--pink-soft)', border: 'none', borderRadius: 12, color: allFilled && !loading ? 'white' : 'var(--dark-mid)', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, cursor: allFilled && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s ease', boxShadow: allFilled && !loading ? `0 4px 16px ${tool.accentColor}44` : 'none' }}
              onMouseEnter={e => { if (allFilled && !loading) (e.currentTarget as HTMLElement).style.background = 'var(--coral-dark)' }}
              onMouseLeave={e => { if (allFilled && !loading) (e.currentTarget as HTMLElement).style.background = tool.accentColor }}
            >
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Finding your best deals...</> : <>{submitLabel} \u2192</>}
            </button>
            {error && (
              <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: '#FFF0EE', border: '1.5px solid #F4A882', borderRadius: 10, color: 'var(--coral-dark)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Deal Cards */}
        {deals && (
          <div ref={resultRef} style={{ padding: '1.75rem 2rem', animation: 'fadeUp 0.35s ease both' }}>

            {/* Summary */}
            <div style={{ background: 'var(--blush)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', borderLeft: `4px solid ${tool.accentColor}` }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--dark-mid)', lineHeight: 1.7, margin: 0 }}>{deals.summary}</p>
            </div>

            {/* Deals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              {deals.deals.map((deal) => {
                const badgeStyle = BADGE_COLORS[deal.badge] || { bg: tool.accentColor, text: '#fff' }
                return (
                  <div key={deal.rank} style={{ border: '1.5px solid var(--pink-soft)', borderRadius: 14, overflow: 'hidden', transition: 'box-shadow 0.2s', background: 'var(--white)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${tool.accentColor}18` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                  >
                    {/* Card header */}
                    <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid var(--pink-soft)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.1rem', color: 'var(--dark)', lineHeight: 1.2 }}>#{deal.rank} {deal.title}</span>
                        <span style={{ background: badgeStyle.bg, color: badgeStyle.text, fontFamily: 'var(--font-hand)', fontWeight: 600, fontSize: '0.78rem', padding: '0.2rem 0.65rem', borderRadius: 100, whiteSpace: 'nowrap' }}>{deal.badge}</span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.3rem', color: tool.accentColor, lineHeight: 1 }}>{deal.price_range}</div>
                        {(deal.route || deal.strategy) && (
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--dark-mid)', marginTop: '0.2rem' }}>{deal.route || deal.strategy}</div>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '0.85rem 1.25rem' }}>
                      {deal.timing && (
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--dark-mid)', marginBottom: '0.6rem', opacity: 0.8 }}>{deal.timing}</div>
                      )}
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--dark)', fontWeight: 500, lineHeight: 1.6, marginBottom: '0.4rem' }}>{deal.why_best}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--dark-mid)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '0.85rem' }}>{deal.unique_angle}</p>

                      {/* Booking links */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {deal.booking_links.map((link, i) => (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.9rem', borderRadius: 100, fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s', background: i === 0 ? tool.accentColor : 'transparent', color: i === 0 ? 'white' : tool.accentColor, border: `1.5px solid ${tool.accentColor}` }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.85'; el.style.transform = 'translateY(-1px)' }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; el.style.transform = 'none' }}
                          >
                            <ExternalLink size={11} />
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pro tip */}
            {deals.pro_tip && (
              <div style={{ background: 'var(--cream)', border: '1.5px solid var(--peach)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <Zap size={16} color={tool.accentColor} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <span style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, fontSize: '0.85rem', color: tool.accentColor, display: 'block', marginBottom: '0.2rem' }}>Pro tip</span>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--dark-mid)', lineHeight: 1.65, margin: 0 }}>{deals.pro_tip}</p>
                </div>
              </div>
            )}

            {/* New search button */}
            <button onClick={handleReset}
              style={{ marginTop: '1.25rem', width: '100%', padding: '0.75rem', background: 'transparent', border: '1.5px solid var(--pink-soft)', borderRadius: 12, color: 'var(--dark-mid)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = tool.accentColor; (e.currentTarget as HTMLElement).style.color = tool.accentColor }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pink-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--dark-mid)' }}
            >
              <RotateCcw size={13} /> Search again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
