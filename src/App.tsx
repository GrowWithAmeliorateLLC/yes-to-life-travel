import React, { useState } from 'react'
import { Plane, Hotel, ArrowRight } from 'lucide-react'
import ToolModal from './components/ToolModal'

export interface Tool {
  id: string
  icon: React.ReactNode
  title: string
  subtitle: string
  tagline: string
  description: string
  fields: Field[]
  buildPrompt: (values: Record<string, string>) => string
  accentColor: string
  bgColor: string
}

export interface Field {
  key: string
  label: string
  placeholder: string
  multiline?: boolean
  optional?: boolean
}

const tools: Tool[] = [
  {
    id: 'flights',
    icon: <Plane size={28} />,
    title: 'Find My Flight',
    subtitle: 'Every angle. Every deal. One answer.',
    tagline: 'carriers · fare windows · awards · true cost',
    description: 'Tell us where you want to go and we find every carrier, the exact dates fares drop, true door-to-door cost across all nearby airports, miles redemption paths, and the precise order to book it all — so the only thing left to do is say yes.',
    accentColor: '#E8523A',
    bgColor: '#FFF0EE',
    fields: [
      { key: 'origin', label: 'Flying From', placeholder: 'e.g. New York (open to JFK, LGA, EWR)' },
      { key: 'destination', label: 'Flying To', placeholder: 'e.g. London (open to all London airports)' },
      { key: 'dates', label: 'Travel Dates / Window', placeholder: 'e.g. Late September 2025, ~10 days, flexible by ±3 days' },
      { key: 'travelers', label: 'Who\'s Traveling', placeholder: 'e.g. 2 adults, prefer business class, economy is fine if the deal is good' },
      { key: 'programs', label: 'Loyalty Programs (optional)', placeholder: 'e.g. Chase UR, Amex MR, United MileagePlus, Delta SkyMiles', optional: true },
    ],
    buildPrompt: (v) => `You are an elite travel deal specialist. Your job is to make this trip happen for the best possible price. Produce a COMPREHENSIVE flight report for the trip below. Use clear ## section headers. Be specific, practical, direct — no filler, no caveats, just actionable intelligence.

**TRIP DETAILS**
- From: ${v.origin}
- To: ${v.destination}
- Dates: ${v.dates}
- Travelers: ${v.travelers}
${v.programs ? `- Loyalty programs: ${v.programs}` : ''}

---

## 1. Every Carrier On This Route
Map ALL operators: major airlines, regional subsidiaries, charter services, wet lease arrangements, and codeshare combinations that produce a cheaper seat on the same plane. For each, note the booking channel and realistic price range.

## 2. The Best Dates To Fly
Identify the specific date windows within ${v.dates} where pricing drops below normal due to demand forecasting gaps, schedule changes, or inventory quirks. Name exact days or ranges and explain why they’re cheaper.

## 3. True Door-to-Door Cost
For every realistic airport combination on both ends, calculate the complete ground cost (transport, parking, time value). Identify the single combination with the lowest total journey cost — not just the cheapest airfare.

## 4. Foreign Market Deals
Which country booking markets sell tickets for this route cheaper than domestic platforms? Name specific sites, currency/payment approach, realistic savings, and any access considerations.

## 5. Miles & Award Opportunities
${v.programs ? `Using ${v.programs}: identify` : 'Identify'} every award redemption path — direct options, partner airline sweet spots, transfer chains, and when premium award space typically opens. Include redemption rates and best-value cabin classes.

## 6. Hidden Costs To Know Before You Book
Surface every charge that doesn’t show in the headline fare: baggage, seat selection, change fees, credit card surcharges, airport charges — anything that appears only after commitment.

## 7. Book It: Your Action Plan
The exact order of steps to take right now for the lowest total cost. What to book first, what to wait on, the signal that tells you the window is closing, and the single most important thing to do in the next 48 hours.
`,
  },
  {
    id: 'hotels',
    icon: <Hotel size={28} />,
    title: 'Find My Hotel',
    subtitle: 'Luxury at the price that says yes.',
    tagline: 'flash sales · points · unpublished rates · direct deals',
    description: 'Tell us where you’re staying and we surface every flash sale, points sweet spot, rate that never makes it onto OTAs, and the exact properties that deliver genuine luxury at prices worth saying yes to.',
    accentColor: '#8B9ED9',
    bgColor: '#EEF1FB',
    fields: [
      { key: 'destination', label: 'Destination', placeholder: 'e.g. Bali, Maldives, Paris 8th arrondissement' },
      { key: 'dates', label: 'Stay Dates', placeholder: 'e.g. August 10–20, 2025 (flexible by a few days)' },
      { key: 'preferences', label: 'What You\'re Looking For', placeholder: 'e.g. Overwater bungalow or beachfront, adults-only preferred, pool essential, open to boutique or big brand', multiline: true },
      { key: 'programs', label: 'Hotel Loyalty Programs (optional)', placeholder: 'e.g. Marriott Bonvoy, World of Hyatt, Hilton Honors, Amex Fine Hotels', optional: true },
    ],
    buildPrompt: (v) => `You are an elite luxury hotel deal specialist. Your job is to find the best possible stay at the best possible price. Produce a COMPREHENSIVE hotel report for the trip below. Use clear ## section headers. Be specific — name actual properties, programs, and strategies. Make it easy to say yes.

**STAY DETAILS**
- Destination: ${v.destination}
- Dates: ${v.dates}
- Preferences: ${v.preferences}
${v.programs ? `- Loyalty programs: ${v.programs}` : ''}

---

## 1. Deals Available Right Now
Current or upcoming flash sales, limited-time promotions, or seasonal offers at 4–5 star properties in ${v.destination}. Which platforms to monitor and how far in advance these appear.

## 2. Points That Actually Pay Off
${v.programs ? `Using ${v.programs}: find` : 'Find'} the best points redemptions at premium properties here — which programs, which hotels, points-per-night rates, and whether points + cash improves the math. Flag any outsized sweet spots.

## 3. Rates You Won’t Find Online
How to access rates that never appear on OTAs: what to say when you call direct, corporate/AAA/AARP eligibility, travel agent rate access, soft-brand vs. flagship pricing, member-only portals.

## 4. Where Direct Booking Wins
For this destination, when does booking direct beat OTAs? Which platforms sometimes undercut the hotel’s own rate and why? Best sites to cross-reference for this specific market.

## 5. The Best Properties For This Trip
5 specific 4–5 star properties that match the preferences above. For each: name, why it fits, realistic rate range, best booking strategy, and any insider notes on real value vs. marketed price.

## 6. The Cheapest Time To Go (Near Your Dates)
When do rates at these properties drop significantly? Shoulder season windows near ${v.dates} where the same hotels cost materially less — and what, if anything, changes by going then.

## 7. Bundle & Save Opportunities
Flight + hotel combinations that genuinely cost less than booking separately. Specific operators, booking platforms, or airline programs offering real package value (not inflated packaging) for this destination.
`,
  },
]

const marqueeItems = [
  '✈ Find the cheapest flight', '🏨 Score the luxury deal', '🏆 Unlock award redemptions',
  '🗺 True door-to-door cost', '🌍 Foreign market prices', '🔍 Hidden fees exposed',
  '📋 Book in the right order', '✨ Say yes to the trip', '✈ Find the cheapest flight',
  '🏨 Score the luxury deal', '🏆 Unlock award redemptions', '🗺 True door-to-door cost',
  '🌍 Foreign market prices', '🔍 Hidden fees exposed', '📋 Book in the right order', '✨ Say yes to the trip',
]

export default function App() {
  const [activeTool, setActiveTool] = useState<Tool | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Header */}
      <header style={{
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(250,245,238,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--pink-soft)',
      }}>
        <LogoWordmark />
        <div style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--coral)',
        }}>your yes is closer than you think</div>
      </header>

      {/* Hero */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '5.5rem 2rem 5rem',
        textAlign: 'center',
        background: 'var(--coral)',
      }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        {/* Spinning badge */}
        <div style={{ position: 'absolute', top: '2rem', right: '2.5rem', width: 90, height: 90 }}>
          <svg className="spinning-badge" viewBox="0 0 90 90" width="90" height="90">
            <defs><path id="circle" d="M 45,45 m -32,0 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0" /></defs>
            <text style={{ fontSize: 10.5, fill: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-hand)', fontWeight: 600, letterSpacing: 2.5 }}>
              <textPath href="#circle">SAY YES · TO LIFE · TO TRAVEL · </textPath>
            </text>
            <circle cx="45" cy="45" r="14" fill="rgba(255,255,255,0.15)" />
            <text x="45" y="50" textAnchor="middle" style={{ fontSize: 16, fill: 'white', fontFamily: 'var(--font-body)' }}>✈</text>
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1.2rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
            marginBottom: '1rem',
          }}>the deal that makes it easy to say yes</p>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3rem, 7vw, 5.5rem)',
            fontWeight: 900,
            lineHeight: 1.05,
            color: 'var(--white)',
            marginBottom: '1.5rem',
            letterSpacing: '-0.01em',
          }}>
            Your dream trip is<br />
            <em style={{ fontStyle: 'italic', color: 'var(--peach)' }}>closer than you think.</em>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.82)',
            maxWidth: 500,
            margin: '0 auto 2.5rem',
            fontSize: '1rem',
            lineHeight: 1.85,
            fontWeight: 300,
          }}>
            Tell us where you want to go. We’ll do the work to get you there for less — finding every deal, every hidden rate, every mile redemption so the only thing left to do is book it.
          </p>

          <button
            onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: 'var(--white)',
              color: 'var(--coral)',
              border: 'none',
              padding: '0.95rem 2.4rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.05rem',
              cursor: 'pointer',
              borderRadius: 100,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            Find My Deal →
          </button>
        </div>
      </section>

      {/* Marquee */}
      <div style={{
        background: 'var(--dark)',
        color: 'var(--peach)',
        padding: '0.65rem 0',
        overflow: 'hidden',
        borderTop: '2px solid var(--coral)',
        borderBottom: '2px solid var(--coral)',
      }}>
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} style={{
              fontFamily: 'var(--font-hand)',
              fontWeight: 600,
              fontSize: '0.95rem',
              marginRight: '2.5rem',
              whiteSpace: 'nowrap',
              letterSpacing: '0.03em',
            }}>{item}</span>
          ))}
        </div>
      </div>

      {/* Two Tool Cards */}
      <main id="tools" style={{
        padding: '5rem 2rem 6rem',
        maxWidth: 1000,
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--coral)',
            display: 'block',
            marginBottom: '0.5rem',
          }}>where are you dreaming of going?</span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            color: 'var(--dark)',
            lineHeight: 1.15,
          }}>
            Tell us your trip.<br />
            <em style={{ fontStyle: 'italic', color: 'var(--coral)', fontWeight: 700 }}>We’ll find the way to make it happen.</em>
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}>
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool)} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: 'var(--dark)',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        borderTop: '3px solid var(--coral)',
      }}>
        <LogoWordmarkLight />
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '1rem',
          fontWeight: 600,
          marginTop: '0.6rem',
          color: 'var(--peach)',
        }}>life is short. say yes to the trip.</p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          marginTop: '0.5rem',
          color: 'rgba(240,202,188,0.4)',
        }}>Powered by Claude AI</p>
      </footer>

      {activeTool && <ToolModal tool={activeTool} onClose={() => setActiveTool(null)} />}
    </div>
  )
}

function LogoWordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{
        width: 36, height: 36,
        background: 'var(--coral)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color: 'white', fontSize: '1rem' }}>✈</span>
      </div>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        fontSize: '1.35rem',
        color: 'var(--dark)',
        letterSpacing: '-0.01em',
        lineHeight: 1,
      }}>
        Yes <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>To</em> Life
        <span style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 400,
          fontSize: '0.58rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--dark-mid)',
          display: 'block',
          marginTop: '2px',
        }}>Travel</span>
      </span>
    </div>
  )
}

function LogoWordmarkLight() {
  return (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      fontSize: '1.5rem',
      color: 'var(--white)',
      letterSpacing: '-0.01em',
    }}>
      Yes <em style={{ fontStyle: 'italic', color: 'var(--peach)' }}>To</em> Life Travel
    </span>
  )
}

function ToolCard({ tool, onClick }: { tool: Tool; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? tool.bgColor : 'var(--white)',
        border: `2.5px solid ${hovered ? tool.accentColor : 'var(--pink-soft)'}`,
        borderRadius: 20,
        cursor: 'pointer',
        padding: '2.5rem',
        textAlign: 'left',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        boxShadow: hovered ? `0 16px 48px ${tool.accentColor}22` : '0 2px 12px rgba(44,31,26,0.05)',
        transform: hovered ? 'translateY(-4px)' : 'none',
      }}
    >
      {/* Large background icon */}
      <div style={{
        position: 'absolute',
        bottom: '-1rem',
        right: '-0.5rem',
        fontSize: '9rem',
        opacity: hovered ? 0.07 : 0.04,
        transition: 'opacity 0.25s',
        pointerEvents: 'none',
        lineHeight: 1,
        color: tool.accentColor,
        userSelect: 'none',
      }}>
        {tool.id === 'flights' ? '✈' : '⌂'}
      </div>

      {/* Icon badge */}
      <div style={{
        width: 60, height: 60,
        background: hovered ? tool.accentColor : 'var(--blush)',
        borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hovered ? 'white' : tool.accentColor,
        marginBottom: '1.5rem',
        transition: 'all 0.25s ease',
        border: `2px solid ${hovered ? tool.accentColor : 'var(--pink-soft)'}`,
        boxShadow: hovered ? `0 6px 20px ${tool.accentColor}44` : 'none',
      }}>
        {tool.icon}
      </div>

      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        fontSize: '1.75rem',
        color: 'var(--dark)',
        lineHeight: 1.1,
        marginBottom: '0.3rem',
      }}>
        {tool.title}
      </h3>

      <p style={{
        fontFamily: 'var(--font-hand)',
        fontWeight: 600,
        fontSize: '1rem',
        color: hovered ? tool.accentColor : 'var(--dark-mid)',
        marginBottom: '0.6rem',
        transition: 'color 0.25s',
      }}>
        {tool.subtitle}
      </p>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.72rem',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: tool.accentColor,
        marginBottom: '1.25rem',
        opacity: 0.8,
      }}>
        {tool.tagline}
      </p>

      <p style={{
        fontSize: '0.875rem',
        color: 'var(--dark-mid)',
        lineHeight: 1.75,
        fontWeight: 300,
        marginBottom: '2rem',
        maxWidth: 340,
      }}>
        {tool.description}
      </p>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: hovered ? tool.accentColor : 'transparent',
        color: hovered ? 'white' : tool.accentColor,
        border: `2px solid ${tool.accentColor}`,
        borderRadius: 100,
        padding: '0.55rem 1.4rem',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '0.9rem',
        transition: 'all 0.22s ease',
      }}>
        {tool.id === 'flights' ? 'Find My Flight Deal' : 'Find My Hotel Deal'}
        <ArrowRight size={15} style={{
          transform: hovered ? 'translateX(3px)' : 'none',
          transition: 'transform 0.2s',
        }} />
      </div>
    </button>
  )
}
