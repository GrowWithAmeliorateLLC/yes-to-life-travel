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

const FLIGHT_JSON_SCHEMA = `
Return ONLY a valid JSON object with this exact structure (no markdown, no backticks, no text before or after):
{
  "summary": "1-2 sentences of key context about this route and timing",
  "deals": [
    {
      "rank": 1,
      "badge": "Best Value",
      "title": "Airline + key routing (e.g. United via Frankfurt)",
      "price_range": "$XXX–XXX per person",
      "route": "CLT → FRA → MXP",
      "timing": "Departs Dec 22, ~14h total",
      "why_best": "One punchy sentence on why this is the top pick",
      "unique_angle": "What specifically makes this deal different — codeshare trick, foreign booking market, award sweet spot, pricing anomaly, etc.",
      "booking_links": [
        { "label": "Search Google Flights", "url": "https://www.google.com/flights?hl=en#flt=CLT.MXP.2025-12-22*MXP.CLT.2025-12-29;c:USD;e:1;sd:1;t:f" },
        { "label": "Book on United", "url": "https://www.united.com" }
      ]
    }
  ],
  "pro_tip": "One specific actionable tip to save more money or get an upgrade"
}
Badge options: Best Value, Award Sweet Spot, Budget Pick, Miles Winner, Hidden Gem, Direct Route, Family Pick
Include 3-5 deals ranked by overall value. Build all Google Flights URLs using actual IATA codes and dates from the trip details.
`

const HOTEL_JSON_SCHEMA = `
Return ONLY a valid JSON object with this exact structure (no markdown, no backticks, no text before or after):
{
  "summary": "1-2 sentences of key context about this destination and timing",
  "deals": [
    {
      "rank": 1,
      "badge": "Best Deal",
      "title": "Hotel Name, specific area/neighborhood",
      "stars": 5,
      "price_range": "$XXX/night",
      "strategy": "How to get this price (e.g. Book direct, Hyatt points, Flash sale)",
      "why_best": "One punchy sentence on why this property tops the list",
      "unique_angle": "The specific angle — unpublished rate trick, points sweet spot, rate parity gap, seasonal timing, etc.",
      "booking_links": [
        { "label": "Book Direct", "url": "https://www.propertywebsite.com" },
        { "label": "Search on Booking.com", "url": "https://www.booking.com/searchresults.html?ss=DESTINATION" }
      ]
    }
  ],
  "pro_tip": "One specific actionable tip — what to say when calling direct, which dates are cheapest, which program to transfer to, etc."
}
Badge options: Best Deal, Points Sweet Spot, Call Direct, Flash Sale, Boutique Pick, Best Views, Family Pick, Adults Only
Include 3-5 properties ranked by overall value and deal quality.
`

const tools: Tool[] = [
  {
    id: 'flights',
    icon: <Plane size={28} />,
    title: 'Find My Flight',
    subtitle: 'Every angle. Every deal. One answer.',
    tagline: 'carriers \u00b7 fare windows \u00b7 awards \u00b7 true cost',
    description: 'Tell us where you want to go and we find the 3-5 best bookable deals \u2014 covering every carrier, the cheapest dates, miles opportunities, and foreign market prices \u2014 so the only thing left to do is click and book.',
    accentColor: '#E8523A',
    bgColor: '#FFF0EE',
    fields: [
      { key: 'origin', label: 'Flying From', placeholder: 'e.g. Charlotte, NC (CLT) or New York area (JFK/LGA/EWR)' },
      { key: 'destination', label: 'Flying To', placeholder: 'e.g. Northern Italy (Milan MXP, Venice VCE, Bologna BLQ)' },
      { key: 'dates', label: 'Travel Dates / Window', placeholder: 'e.g. Dec 22\u201330, 2025 \u2014 flexible by \u00b12 days' },
      { key: 'travelers', label: 'Who\'s Traveling', placeholder: 'e.g. 2 adults, 2 children ages 8 & 11, economy or premium economy' },
      { key: 'programs', label: 'Loyalty Programs', placeholder: 'e.g. Chase UR, United MileagePlus, Delta SkyMiles', optional: true },
    ],
    buildPrompt: (v) => `Find the 3-5 best bookable flight deals for this trip. Focus on real options people can actually book today.

TRIP DETAILS:
- From: ${v.origin}
- To: ${v.destination}
- Dates: ${v.dates}
- Travelers: ${v.travelers}
${v.programs ? `- Loyalty programs: ${v.programs}` : '- No specific loyalty programs'}

For each deal consider: best value economy, premium economy upgrade, codeshare tricks, foreign market bookings, award redemptions, optimal date combinations within the window.

Build real Google Flights search URLs using the actual IATA codes and dates. For specific airlines link to their direct booking pages.

${FLIGHT_JSON_SCHEMA}`,
  },
  {
    id: 'hotels',
    icon: <Hotel size={28} />,
    title: 'Find My Hotel',
    subtitle: 'Luxury at the price that says yes.',
    tagline: 'flash sales \u00b7 points \u00b7 unpublished rates \u00b7 direct deals',
    description: 'Tell us where you\u2019re staying and we surface the 3-5 best bookable deals at 4 and 5-star properties \u2014 flash sales, points sweet spots, call-direct rates, and OTA gaps \u2014 with links to book each one.',
    accentColor: '#8B9ED9',
    bgColor: '#EEF1FB',
    fields: [
      { key: 'destination', label: 'Destination', placeholder: 'e.g. Amalfi Coast, Italy or Tulum, Mexico' },
      { key: 'dates', label: 'Stay Dates', placeholder: 'e.g. August 10\u201320, 2025 (flexible by a few days)' },
      { key: 'preferences', label: 'What You\'re Looking For', placeholder: 'e.g. Beachfront, adults-only, pool, open to boutique or big brand, max $400/night', multiline: true },
      { key: 'programs', label: 'Hotel Loyalty Programs', placeholder: 'e.g. World of Hyatt, Marriott Bonvoy, Hilton Honors', optional: true },
    ],
    buildPrompt: (v) => `Find the 3-5 best bookable hotel deals for this trip. Focus on real properties with real strategies to get the best price today.

STAY DETAILS:
- Destination: ${v.destination}
- Dates: ${v.dates}
- Preferences: ${v.preferences}
${v.programs ? `- Loyalty programs: ${v.programs}` : '- No specific loyalty programs'}

For each property consider: flash sales, points redemption sweet spots, call-direct unpublished rates, OTA vs direct price gaps, shoulder season timing, package opportunities.

Include real booking URLs \u2014 the hotel's own website, Booking.com, Hyatt/Marriott/Hilton booking pages, or Google Hotels.

${HOTEL_JSON_SCHEMA}`,
  },
]

const marqueeItems = [
  '\u2708 Find the cheapest flight', '\ud83c\udfe8 Score the luxury deal', '\ud83c\udfc6 Unlock award redemptions',
  '\ud83d\uddfa True door-to-door cost', '\ud83c\udf0d Foreign market prices', '\ud83d\udd0d Hidden fees exposed',
  '\ud83d\udccb Book in the right order', '\u2728 Say yes to the trip', '\u2708 Find the cheapest flight',
  '\ud83c\udfe8 Score the luxury deal', '\ud83c\udfc6 Unlock award redemptions', '\ud83d\uddfa True door-to-door cost',
  '\ud83c\udf0d Foreign market prices', '\ud83d\udd0d Hidden fees exposed', '\ud83d\udccb Book in the right order', '\u2728 Say yes to the trip',
]

export default function App() {
  const [activeTool, setActiveTool] = useState<Tool | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
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
        <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', fontWeight: 600, color: 'var(--coral)' }}>
          your yes is closer than you think
        </div>
      </header>

      <section style={{ position: 'relative', overflow: 'hidden', padding: '5.5rem 2rem 5rem', textAlign: 'center', background: 'var(--coral)' }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div style={{ position: 'absolute', top: '2rem', right: '2.5rem', width: 90, height: 90 }}>
          <svg className="spinning-badge" viewBox="0 0 90 90" width="90" height="90">
            <defs><path id="circle" d="M 45,45 m -32,0 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0" /></defs>
            <text style={{ fontSize: 10.5, fill: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-hand)', fontWeight: 600, letterSpacing: 2.5 }}>
              <textPath href="#circle">SAY YES \u00b7 TO LIFE \u00b7 TO TRAVEL \u00b7 </textPath>
            </text>
            <circle cx="45" cy="45" r="14" fill="rgba(255,255,255,0.15)" />
            <text x="45" y="50" textAnchor="middle" style={{ fontSize: 16, fill: 'white', fontFamily: 'var(--font-body)' }}>\u2708</text>
          </svg>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '1rem' }}>
            the deal that makes it easy to say yes
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 900, lineHeight: 1.05, color: 'var(--white)', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>
            Your dream trip is<br />
            <em style={{ fontStyle: 'italic', color: 'var(--peach)' }}>closer than you think.</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.82)', maxWidth: 500, margin: '0 auto 2.5rem', fontSize: '1rem', lineHeight: 1.85, fontWeight: 300 }}>
            Tell us where you want to go. We\u2019ll find the 3\u20135 best deals you can actually book right now \u2014 flights, hotels, miles, hidden rates \u2014 with links to book each one.
          </p>
          <button
            onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'var(--white)', color: 'var(--coral)', border: 'none', padding: '0.95rem 2.4rem', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', borderRadius: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            Find My Deal \u2192
          </button>
        </div>
      </section>

      <div style={{ background: 'var(--dark)', color: 'var(--peach)', padding: '0.65rem 0', overflow: 'hidden', borderTop: '2px solid var(--coral)', borderBottom: '2px solid var(--coral)' }}>
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, fontSize: '0.95rem', marginRight: '2.5rem', whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>{item}</span>
          ))}
        </div>
      </div>

      <main id="tools" style={{ padding: '5rem 2rem 6rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--coral)', display: 'block', marginBottom: '0.5rem' }}>where are you dreaming of going?</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--dark)', lineHeight: 1.15 }}>
            Tell us your trip.<br />
            <em style={{ fontStyle: 'italic', color: 'var(--coral)', fontWeight: 700 }}>We\u2019ll find the way to make it happen.</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {tools.map((tool) => <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool)} />)}
        </div>
      </main>

      <footer style={{ background: 'var(--dark)', padding: '2.5rem 2rem', textAlign: 'center', borderTop: '3px solid var(--coral)' }}>
        <LogoWordmarkLight />
        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', fontWeight: 600, marginTop: '0.6rem', color: 'var(--peach)' }}>life is short. say yes to the trip.</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', marginTop: '0.5rem', color: 'rgba(240,202,188,0.4)' }}>Powered by Claude AI</p>
      </footer>

      {activeTool && <ToolModal tool={activeTool} onClose={() => setActiveTool(null)} />}
    </div>
  )
}

function LogoWordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{ width: 36, height: 36, background: 'var(--coral)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: 'white', fontSize: '1rem' }}>\u2708</span>
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.35rem', color: 'var(--dark)', letterSpacing: '-0.01em', lineHeight: 1 }}>
        Yes <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>To</em> Life
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--dark-mid)', display: 'block', marginTop: '2px' }}>Travel</span>
      </span>
    </div>
  )
}

function LogoWordmarkLight() {
  return (
    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', color: 'var(--white)', letterSpacing: '-0.01em' }}>
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
      style={{ background: hovered ? tool.bgColor : 'var(--white)', border: `2.5px solid ${hovered ? tool.accentColor : 'var(--pink-soft)'}`, borderRadius: 20, cursor: 'pointer', padding: '2.5rem', textAlign: 'left', width: '100%', position: 'relative', overflow: 'hidden', transition: 'all 0.25s ease', boxShadow: hovered ? `0 16px 48px ${tool.accentColor}22` : '0 2px 12px rgba(44,31,26,0.05)', transform: hovered ? 'translateY(-4px)' : 'none' }}
    >
      <div style={{ position: 'absolute', bottom: '-1rem', right: '-0.5rem', fontSize: '9rem', opacity: hovered ? 0.07 : 0.04, transition: 'opacity 0.25s', pointerEvents: 'none', lineHeight: 1, color: tool.accentColor, userSelect: 'none' }}>
        {tool.id === 'flights' ? '\u2708' : '\u2302'}
      </div>
      <div style={{ width: 60, height: 60, background: hovered ? tool.accentColor : 'var(--blush)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: hovered ? 'white' : tool.accentColor, marginBottom: '1.5rem', transition: 'all 0.25s ease', border: `2px solid ${hovered ? tool.accentColor : 'var(--pink-soft)'}`, boxShadow: hovered ? `0 6px 20px ${tool.accentColor}44` : 'none' }}>
        {tool.icon}
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.75rem', color: 'var(--dark)', lineHeight: 1.1, marginBottom: '0.3rem' }}>{tool.title}</h3>
      <p style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, fontSize: '1rem', color: hovered ? tool.accentColor : 'var(--dark-mid)', marginBottom: '0.6rem', transition: 'color 0.25s' }}>{tool.subtitle}</p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: tool.accentColor, marginBottom: '1.25rem', opacity: 0.8 }}>{tool.tagline}</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--dark-mid)', lineHeight: 1.75, fontWeight: 300, marginBottom: '2rem', maxWidth: 340 }}>{tool.description}</p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: hovered ? tool.accentColor : 'transparent', color: hovered ? 'white' : tool.accentColor, border: `2px solid ${tool.accentColor}`, borderRadius: 100, padding: '0.55rem 1.4rem', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.22s ease' }}>
        {tool.id === 'flights' ? 'Find My Flight Deal' : 'Find My Hotel Deal'}
        <ArrowRight size={15} style={{ transform: hovered ? 'translateX(3px)' : 'none', transition: 'transform 0.2s' }} />
      </div>
    </button>
  )
}
