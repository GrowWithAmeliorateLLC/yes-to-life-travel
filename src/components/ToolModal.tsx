import React, { useState, useRef, useEffect } from 'react'
import { X, Loader2, RotateCcw, ExternalLink, Zap, Plane, Hotel } from 'lucide-react'
import type { Tool } from '../App'

interface Props { tool: Tool; onClose: () => void }
interface BookingLink { label: string; url: string }

interface Deal {
  rank: number; badge: string; title: string; price_range: string;
  route?: string; timing?: string; strategy?: string;
  why_best: string; unique_angle: string; booking_links: BookingLink[]
}
interface TripFlight { carrier: string; route: string; price_per_person: string; booking_links: BookingLink[] }
interface TripHotel { name: string; stars: number; area: string; price_per_night: string; total_hotel: string; booking_links: BookingLink[] }
interface Trip {
  rank: number; badge: string; destination: string; country_emoji?: string;
  vibe: string; total_per_person: string; nights: number;
  flight: TripFlight; hotel: TripHotel; why_fits: string; insider_tip: string;
}
interface DealResult { summary: string; deals: Deal[]; pro_tip: string }
interface TripResult { summary: string; trips: Trip[]; pro_tip: string }
type ParsedResult = DealResult | TripResult | null

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  'Best Value':         { bg: '#E8523A', text: '#fff' },
  'Award Sweet Spot':   { bg: '#8B9ED9', text: '#fff' },
  'Budget Pick':        { bg: '#8A8A3C', text: '#fff' },
  'Miles Winner':       { bg: '#8B9ED9', text: '#fff' },
  'Hidden Gem':         { bg: '#F4A882', text: '#2C1F1A' },
  'Direct Route':       { bg: '#E8523A', text: '#fff' },
  'Family Pick':        { bg: '#F4A882', text: '#2C1F1A' },
  'Best Deal':          { bg: '#E8523A', text: '#fff' },
  'Points Sweet Spot':  { bg: '#8B9ED9', text: '#fff' },
  'Call Direct':        { bg: '#8A8A3C', text: '#fff' },
  'Flash Sale':         { bg: '#C93F28', text: '#fff' },
  'Boutique Pick':      { bg: '#F4A882', text: '#2C1F1A' },
  'Best Views':         { bg: '#8B9ED9', text: '#fff' },
  'Adults Only':        { bg: '#4A3530', text: '#F4A882' },
  'Best Overall Value': { bg: '#8A8A3C', text: '#fff' },
  'Biggest Surprise':   { bg: '#E8523A', text: '#fff' },
  'Most Adventurous':   { bg: '#C93F28', text: '#fff' },
  'Best Beach':         { bg: '#8B9ED9', text: '#fff' },
  'Best City Break':    { bg: '#4A3530', text: '#F4A882' },
  'Best Food Scene':    { bg: '#F4A882', text: '#2C1F1A' },
  'Best Value Luxury':  { bg: '#8A8A3C', text: '#fff' },
  'Family Favorite':    { bg: '#8B9ED9', text: '#fff' },
}

// 3-strategy JSON extractor — handles Claude adding text before/after JSON
function parseResult(raw: string): ParsedResult {
  const strategies = [
    raw.trim(),
    raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim(),
    (() => { const s = raw.indexOf('{'); const e = raw.lastIndexOf('}'); return s !== -1 && e > s ? raw.substring(s, e + 1) : '' })()
  ]
  for (const attempt of strategies) {
    if (!attempt) continue
    try {
      const p = JSON.parse(attempt)
      if (p.trips && Array.isArray(p.trips) && p.trips.length > 0) return p as TripResult
      if (p.deals && Array.isArray(p.deals) && p.deals.length > 0) return p as DealResult
    } catch { /* try next strategy */ }
  }
  return null
}

function isTripResult(r: ParsedResult): r is TripResult { return r !== null && 'trips' in r }

const BookLink = ({ link, i, color }: { link: BookingLink; i: number; color: string }) => (
  <a href={link.url} target="_blank" rel="noopener noreferrer"
    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.42rem 0.85rem', borderRadius: 100, fontFamily: 'var(--font-body)', fontSize: '0.76rem', fontWeight: 500, textDecoration: 'none', transition: 'opacity 0.15s', background: i === 0 ? color : 'transparent', color: i === 0 ? 'white' : color, border: `1.5px solid ${color}`, whiteSpace: 'nowrap' }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
  ><ExternalLink size={10} />{link.label}</a>
)

export default function ToolModal({ tool, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ParsedResult>(null)
  const [error, setError] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    if (result && resultRef.current) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [result])

  const allFilled = tool.fields.every(f => f.optional || (values[f.key] || '').trim().length > 0)

  const handleSubmit = async () => {
    if (!allFilled || loading) return
    setLoading(true); setResult(null); setError(null)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: tool.buildPrompt(values) }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error((err as any).message || `Request failed: ${response.status}`)
      }
      const data = await response.json()
      const parsed = parseResult(data.result)
      if (parsed) setResult(parsed)
      else throw new Error('Could not parse results — please try again.')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const handleReset = () => { setResult(null); setError(null); setValues({}) }
  const submitLabel = tool.id === 'randomizer' ? 'Surprise Me →'
    : tool.id === 'flights' ? 'Find My Flight Deal →' : 'Find My Hotel Deal →'

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(44,31,26,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'popIn 0.22s ease both' }}
    >
      {/* Modal — NO overflow:hidden on cards so text never gets clipped */}
      <div style={{ background: 'var(--white)', borderRadius: 20, border: `2px solid ${tool.accentColor}44`, width: '100%', maxWidth: 740, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(44,31,26,0.18)' }}>
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
        {!result && (
          <div style={{ padding: '1.75rem 2rem' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--dark-mid)', lineHeight: 1.7, marginBottom: '1.75rem', fontWeight: 300 }}>{tool.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.5rem' }}>
              {tool.fields.map((field) => (
                <div key={field.key}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--dark-mid)', marginBottom: '0.45rem' }}>
                    {field.label}
                    {field.optional && <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: 0, textTransform: 'none', color: 'var(--peach)' }}>— optional</span>}
                  </label>
                  {field.multiline
                    ? <textarea value={values[field.key] || ''} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={3}
                        style={{ width: '100%', background: 'var(--cream)', border: '1.5px solid var(--pink-soft)', borderRadius: 10, color: 'var(--dark)', padding: '0.8rem 1rem', fontFamily: 'var(--font-body)', fontSize: '0.88rem', lineHeight: 1.6, outline: 'none', resize: 'vertical', transition: 'border-color 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = tool.accentColor }} onBlur={e => { e.target.style.borderColor = 'var(--pink-soft)' }} />
                    : <input type="text" value={values[field.key] || ''} onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))} placeholder={field.placeholder}
                        onKeyDown={e => { if (e.key === 'Enter' && allFilled) handleSubmit() }}
                        style={{ width: '100%', background: 'var(--cream)', border: '1.5px solid var(--pink-soft)', borderRadius: 10, color: 'var(--dark)', padding: '0.8rem 1rem', fontFamily: 'var(--font-body)', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = tool.accentColor }} onBlur={e => { e.target.style.borderColor = 'var(--pink-soft)' }} />
                  }
                </div>
              ))}
            </div>
            <button onClick={handleSubmit} disabled={!allFilled || loading}
              style={{ width: '100%', padding: '0.95rem', background: allFilled && !loading ? tool.accentColor : 'var(--pink-soft)', border: 'none', borderRadius: 12, color: allFilled && !loading ? 'white' : 'var(--dark-mid)', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, cursor: allFilled && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s ease', boxShadow: allFilled && !loading ? `0 4px 16px ${tool.accentColor}44` : 'none' }}
            >
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {tool.id === 'randomizer' ? 'Finding your perfect trips...' : 'Finding your best deals...'}</> : submitLabel}
            </button>
            {error && <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: '#FFF0EE', border: '1.5px solid #F4A882', borderRadius: 10, color: 'var(--coral-dark)', fontSize: '0.85rem', lineHeight: 1.6 }}>{error}</div>}
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultRef} style={{ padding: '1.75rem 2rem', animation: 'fadeUp 0.35s ease both' }}>
            <div style={{ background: 'var(--blush)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', borderLeft: `4px solid ${tool.accentColor}` }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--dark-mid)', lineHeight: 1.7, margin: 0 }}>{result.summary}</p>
            </div>

            {/* DEAL CARDS — no overflow:hidden, price+title on separate rows to prevent cutoff */}
            {!isTripResult(result) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                {result.deals.map(deal => {
                  const bs = BADGE_COLORS[deal.badge] || { bg: tool.accentColor, text: '#fff' }
                  return (
                    <div key={deal.rank} style={{ border: '1.5px solid var(--pink-soft)', borderRadius: 14, background: 'var(--white)', transition: 'box-shadow 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${tool.accentColor}18` }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                    >
                      <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid var(--pink-soft)' }}>
                        {/* Row 1: title + badge */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.05rem', color: 'var(--dark)', wordBreak: 'break-word', flex: 1, minWidth: 0 }}>#{deal.rank} {deal.title}</span>
                          <span style={{ background: bs.bg, color: bs.text, fontFamily: 'var(--font-hand)', fontWeight: 600, fontSize: '0.78rem', padding: '0.2rem 0.65rem', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0 }}>{deal.badge}</span>
                        </div>
                        {/* Row 2: price */}
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem', color: tool.accentColor, lineHeight: 1, wordBreak: 'break-word' }}>{deal.price_range}</div>
                        {/* Row 3: route/strategy */}
                        {(deal.route || deal.strategy) && (
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--dark-mid)', marginTop: '0.25rem', opacity: 0.8 }}>{deal.route || deal.strategy}</div>
                        )}
                      </div>
                      <div style={{ padding: '0.85rem 1.25rem' }}>
                        {deal.timing && <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--dark-mid)', marginBottom: '0.5rem', opacity: 0.8 }}>{deal.timing}</div>}
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--dark)', fontWeight: 500, lineHeight: 1.6, marginBottom: '0.35rem' }}>{deal.why_best}</p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--dark-mid)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '0.85rem' }}>{deal.unique_angle}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {deal.booking_links.map((link, i) => <BookLink key={i} link={link} i={i} color={tool.accentColor} />)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* TRIP CARDS — no overflow:hidden */}
            {isTripResult(result) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {result.trips.map(trip => {
                  const bs = BADGE_COLORS[trip.badge] || { bg: '#8A8A3C', text: '#fff' }
                  return (
                    <div key={trip.rank} style={{ border: '1.5px solid var(--pink-soft)', borderRadius: 16, background: 'var(--white)', transition: 'box-shadow 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(138,138,60,0.15)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                    >
                      {/* Trip header */}
                      <div style={{ padding: '1.1rem 1.4rem 0.9rem', borderBottom: '1px solid var(--pink-soft)', background: 'var(--cream)', borderRadius: '15px 15px 0 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                            {trip.country_emoji && <span style={{ fontSize: '1.3rem', lineHeight: 1, flexShrink: 0 }}>{trip.country_emoji}</span>}
                            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem', color: 'var(--dark)', margin: 0, wordBreak: 'break-word' }}>#{trip.rank} {trip.destination}</h3>
                            <span style={{ background: bs.bg, color: bs.text, fontFamily: 'var(--font-hand)', fontWeight: 600, fontSize: '0.78rem', padding: '0.2rem 0.65rem', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0 }}>{trip.badge}</span>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.4rem', color: '#8A8A3C', lineHeight: 1 }}>{trip.total_per_person}</div>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--dark-mid)', marginTop: '0.15rem' }}>per person · {trip.nights} nights</div>
                          </div>
                        </div>
                        <p style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--dark-mid)', margin: 0, fontStyle: 'italic' }}>{trip.vibe}</p>
                      </div>

                      {/* Flight + Hotel */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                        <div style={{ padding: '1rem 1.25rem', borderRight: '1px solid var(--pink-soft)', borderBottom: '1px solid var(--pink-soft)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                            <Plane size={13} color="#E8523A" />
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E8523A' }}>Flight</span>
                          </div>
                          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--dark)', marginBottom: '0.2rem', wordBreak: 'break-word' }}>{trip.flight.carrier}</p>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--dark-mid)', marginBottom: '0.15rem' }}>{trip.flight.route}</p>
                          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1rem', color: '#E8523A', marginBottom: '0.7rem', wordBreak: 'break-word' }}>{trip.flight.price_per_person}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {trip.flight.booking_links.map((link, i) => <BookLink key={i} link={link} i={i} color="#E8523A" />)}
                          </div>
                        </div>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--pink-soft)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                            <Hotel size={13} color="#8B9ED9" />
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8B9ED9' }}>Hotel</span>
                          </div>
                          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--dark)', marginBottom: '0.15rem', wordBreak: 'break-word' }}>{trip.hotel.name}</p>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--dark-mid)', marginBottom: '0.15rem' }}>{trip.hotel.area} · {'★'.repeat(Math.min(trip.hotel.stars || 4, 5))}</p>
                          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1rem', color: '#8B9ED9', marginBottom: '0.1rem', wordBreak: 'break-word' }}>{trip.hotel.price_per_night}<span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--dark-mid)' }}>/night</span></p>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.74rem', color: 'var(--dark-mid)', marginBottom: '0.7rem' }}>{trip.hotel.total_hotel}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {trip.hotel.booking_links.map((link, i) => <BookLink key={i} link={link} i={i} color="#8B9ED9" />)}
                          </div>
                        </div>
                      </div>

                      <div style={{ padding: '0.9rem 1.4rem' }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--dark)', fontWeight: 500, lineHeight: 1.6, marginBottom: '0.3rem' }}>{trip.why_fits}</p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--dark-mid)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>💡 {trip.insider_tip}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {result.pro_tip && (
              <div style={{ background: 'var(--cream)', border: '1.5px solid var(--peach)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <Zap size={16} color={tool.accentColor} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <span style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, fontSize: '0.85rem', color: tool.accentColor, display: 'block', marginBottom: '0.2rem' }}>Pro tip</span>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--dark-mid)', lineHeight: 1.65, margin: 0 }}>{result.pro_tip}</p>
                </div>
              </div>
            )}

            <button onClick={handleReset}
              style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: '1.5px solid var(--pink-soft)', borderRadius: 12, color: 'var(--dark-mid)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = tool.accentColor; (e.currentTarget as HTMLElement).style.color = tool.accentColor }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pink-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--dark-mid)' }}
            ><RotateCcw size={13} /> Search again</button>
          </div>
        )}
      </div>
    </div>
  )
}
