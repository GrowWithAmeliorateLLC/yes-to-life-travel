import React, { useState } from 'react'
import { Plane, Hotel, ArrowRight, Shuffle } from 'lucide-react'
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
Return ONLY a valid JSON object — no markdown, no backticks, no text before or after:
{
  "summary": "1-2 sentences of key context about this route and timing",
  "deals": [
    {
      "rank": 1,
      "badge": "Best Value",
      "title": "Carrier + key routing",
      "price_range": "$XXX–XXX per person",
      "route": "CLT → FRA → MXP",
      "timing": "Departs Dec 22, ~14h total",
      "why_best": "One punchy sentence on why this tops the list",
      "unique_angle": "The specific trick — codeshare, foreign market, award angle, pricing anomaly, etc.",
      "booking_links": [
        { "label": "Search Google Flights", "url": "https://www.google.com/flights?hl=en#flt=CLT.MXP.2025-12-22*MXP.CLT.2025-12-29;c:USD;e:1;sd:1;t:f" },
        { "label": "Book on United", "url": "https://www.united.com" }
      ]
    }
  ],
  "pro_tip": "One specific actionable tip to save more or get an upgrade"
}
Badge options: Best Value, Award Sweet Spot, Budget Pick, Miles Winner, Hidden Gem, Direct Route, Family Pick
Include 3-5 deals. Build all Google Flights URLs using actual IATA codes and dates.
`

const HOTEL_JSON_SCHEMA = `
Return ONLY a valid JSON object — no markdown, no backticks, no text before or after:
{
  "summary": "1-2 sentences of key context about this destination and timing",
  "deals": [
    {
      "rank": 1,
      "badge": "Best Deal",
      "title": "Hotel Name, specific neighborhood",
      "stars": 5,
      "price_range": "$XXX/night",
      "strategy": "How to get this price",
      "why_best": "One punchy sentence on why this property tops the list",
      "unique_angle": "The specific angle — unpublished rate, points sweet spot, rate parity gap, timing trick, etc.",
      "booking_links": [
        { "label": "Book Direct", "url": "https://www.propertywebsite.com" },
        { "label": "Search Booking.com", "url": "https://www.booking.com/searchresults.html?ss=DESTINATION" }
      ]
    }
  ],
  "pro_tip": "One specific actionable tip"
}
Badge options: Best Deal, Points Sweet Spot, Call Direct, Flash Sale, Boutique Pick, Best Views, Family Pick, Adults Only
Include 3-5 properties ranked by overall value.
`

const RANDOMIZER_JSON_SCHEMA = `
Return ONLY a valid JSON object — no markdown, no backticks, no text before or after:
{
  "summary": "1-2 sentences on what destinations were considered and why they fit the budget",
  "trips": [
    {
      "rank": 1,
      "badge": "Best Overall Value",
      "destination": "Lisbon, Portugal",
      "country_emoji": "🇵🇹",
      "vibe": "sun-drenched city breaks, world-class food, walkable cobblestone hills",
      "total_per_person": "$1,850",
      "nights": 7,
      "flight": {
        "carrier": "TAP Air Portugal",
        "route": "CLT → LIS",
        "price_per_person": "$650 roundtrip",
        "booking_links": [
          { "label": "Search Google Flights", "url": "https://www.google.com/flights?hl=en#flt=CLT.LIS.2025-12-22*LIS.CLT.2025-12-29;c:USD;e:1;sd:1;t:f" },
          { "label": "Book on TAP", "url": "https://www.tapairportugal.com" }
        ]
      },
      "hotel": {
        "name": "Bairro Alto Hotel",
        "stars": 5,
        "area": "Chiado",
        "price_per_night": "$165",
        "total_hotel": "$1,155 for 7 nights",
        "booking_links": [
          { "label": "Book Direct", "url": "https://www.bairroaltohotel.com" },
          { "label": "Search Booking.com", "url": "https://www.booking.com/searchresults.html?ss=Lisbon" }
        ]
      },
      "why_fits": "One sentence on why this package fits the stated budget",
      "insider_tip": "One specific tip to make this trip even better or cheaper"
    }
  ],
  "pro_tip": "One overall money-saving insight for traveling during these dates"
}
Badge options: Best Overall Value, Biggest Surprise, Most Adventurous, Best Beach, Best City Break, Hidden Gem, Best Food Scene, Best Value Luxury, Family Favorite
Include 3-5 trips ranked by overall value. Use diverse destinations. Build Google Flights URLs with real IATA airport codes.
`

const tools: Tool[] = [
  {
    id: 'randomizer',
    icon: <Shuffle size={28} />,
    title: 'Surprise Me',
    subtitle: 'Tell me when and how much. I’ll find where.',
    tagline: 'budget · dates · full trip packages',
    description: 'Enter your travel dates, budget, and who’s going. We’ll return 3–5 complete trip packages — each with a specific destination, a flight deal, and a hotel deal — all within your budget, all with links to book.',
    accentColor: '#8A8A3C',
    bgColor: '#F4F4E6',
    fields: [
      { key: 'origin', label: 'Flying From', placeholder: 'e.g. Charlotte, NC (CLT) or New York area' },
      { key: 'dates', label: 'Travel Dates', placeholder: 'e.g. Dec 22–30, 2025 or flexible week in September' },
      { key: 'budget', label: 'Total Budget Per Person', placeholder: 'e.g. $2,500 total including flights and hotel' },
      { key: 'travelers', label: "Who's Going", placeholder: 'e.g. 2 adults, 1 child age 8 — economy is fine' },
      { key: 'vibe', label: 'Trip Vibe', placeholder: 'e.g. beach, city, adventure, food, mix it up — surprise me!', optional: true },
    ],
    buildPrompt: (v) => `Find 3-5 complete trip packages that fit within the budget below. Each package must include a specific destination, a real flight option, and a real hotel. All must be bookable today.

TRIP DETAILS:
- Flying from: ${v.origin}
- Dates: ${v.dates}
- Budget: ${v.budget} per person (covering flights + hotel combined)
- Travelers: ${v.travelers}
${v.vibe ? `- Vibe: ${v.vibe}` : '- Open to any destination that fits the budget'}

Consider destinations across: Europe, Caribbean, Central America, Southeast Asia, South America, domestic US surprises. Prioritize destinations where the flight + hotel math actually works within the budget. Include a mix of well-known and less obvious destinations.

For each trip: use real carriers, real hotels (4-5 stars preferred if budget allows), and build actual Google Flights URLs with IATA codes for the origin and destination airports.

${RANDOMIZER_JSON_SCHEMA}`,
  },
  {
    id: 'flights',
    icon: <Plane size={28} />,
    title: 'Find My Flight',
    subtitle: 'Every angle. Every deal. One answer.',
    tagline: 'carriers · fare windows · awards · true cost',
    description: 'Tell us where you want to go and we find the 3–5 best bookable flight deals — every carrier, cheapest dates, miles redemptions, and foreign market prices — with links to book each one.',
    accentColor: '#E8523A',
    bgColor: '#FFF0EE',
    fields: [
      { key: 'origin', label: 'Flying From', placeholder: 'e.g. Charlotte, NC (CLT) or New York area (JFK/LGA/EWR)' },
      { key: 'destination', label: 'Flying To', placeholder: 'e.g. Northern Italy (Milan MXP, Venice VCE, Bologna BLQ)' },
      { key: 'dates', label: 'Travel Dates / Window', placeholder: 'e.g. Dec 22–30, 2025 — flexible by ±2 days' },
      { key: 'travelers', label: "Who's Traveling", placeholder: 'e.g. 2 adults, 2 children, economy or premium economy' },
      { key: 'programs', label: 'Loyalty Programs', placeholder: 'e.g. Chase UR, United MileagePlus, Delta SkyMiles', optional: true },
    ],
    buildPrompt: (v) => `Find the 3-5 best bookable flight deals for this trip. Focus on real options people can book today.

TRIP DETAILS:
- From: ${v.origin}
- To: ${v.destination}
- Dates: ${v.dates}
- Travelers: ${v.travelers}
${v.programs ? `- Loyalty programs: ${v.programs}` : '- No specific loyalty programs'}

Consider: best value economy, premium economy, codeshare tricks, foreign market bookings, award redemptions, optimal date combinations.
Build real Google Flights URLs using actual IATA codes and dates.

${FLIGHT_JSON_SCHEMA}`,
  },
  {
    id: 'hotels',
    icon: <Hotel size={28} />,
    title: 'Find My Hotel',
    subtitle: 'Luxury at the price that says yes.',
    tagline: 'flash sales · points · unpublished rates · direct deals',
    description: 'Tell us where you’re staying and we surface the 3–5 best bookable deals at 4 and 5-star properties — flash sales, points sweet spots, call-direct rates — with links to book each one.',
    accentColor: '#8B9ED9',
    bgColor: '#EEF1FB',
    fields: [
      { key: 'destination', label: 'Destination', placeholder: 'e.g. Amalfi Coast, Italy or Tulum, Mexico' },
      { key: 'dates', label: 'Stay Dates', placeholder: 'e.g. August 10–20, 2025 (flexible by a few days)' },
      { key: 'preferences', label: "What You're Looking For", placeholder: 'e.g. Beachfront, adults-only, pool, open to boutique or big brand, max $400/night', multiline: true },
      { key: 'programs', label: 'Hotel Loyalty Programs', placeholder: 'e.g. World of Hyatt, Marriott Bonvoy, Hilton Honors', optional: true },
    ],
    buildPrompt: (v) => `Find the 3-5 best bookable hotel deals for this stay. Focus on real properties with real booking strategies.

STAY DETAILS:
- Destination: ${v.destination}
- Dates: ${v.dates}
- Preferences: ${v.preferences}
${v.programs ? `- Loyalty programs: ${v.programs}` : '- No specific loyalty programs'}

Consider: flash sales, points redemptions, call-direct unpublished rates, OTA vs direct gaps, shoulder season timing.

${HOTEL_JSON_SCHEMA}`,
  },
]

const randomizer = tools[0]
const pairTools = tools.slice(1)

const marqueeItems = [
  '✈ Find the cheapest flight', '🏨 Score the luxury deal', '🏆 Unlock award redemptions',
  '🎲 Surprise trip packages', '🗺 True door-to-door cost', '🌍 Foreign market prices',
  '🔍 Hidden fees exposed', '📋 Book in the right order', '✨ Say yes to the trip',
  '✈ Find the cheapest flight', '🏨 Score the luxury deal', '🏆 Unlock award redemptions',
  '🎲 Surprise trip packages', '🗺 True door-to-door cost', '🌍 Foreign market prices',
  '🔍 Hidden fees exposed', '📋 Book in the right order', '✨ Say yes to the trip',
]

export default function App() {
  const [activeTool, setActiveTool] = useState<Tool | null>(null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <header style={{ padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250,245,238,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--pink-soft)' }}>
        <LogoWordmark />
        <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', fontWeight: 600, color: 'var(--coral)' }}>your yes is closer than you think</div>
      </header>

      <section style={{ position: 'relative', overflow: 'hidden', padding: '5.5rem 2rem 5rem', textAlign: 'center', background: 'var(--coral)' }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
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
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '1rem' }}>the deal that makes it easy to say yes</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 900, lineHeight: 1.05, color: 'var(--white)', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>
            Your dream trip is<br /><em style={{ fontStyle: 'italic', color: 'var(--peach)' }}>closer than you think.</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.82)', maxWidth: 500, margin: '0 auto 2.5rem', fontSize: '1rem', lineHeight: 1.85, fontWeight: 300 }}>
            Tell us where you want to go — or let us surprise you. We’ll find the best flight + hotel deals you can actually book right now.
          </p>
          <button onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'var(--white)', color: 'var(--coral)', border: 'none', padding: '0.95rem 2.4rem', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', borderRadius: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)' }}
          >Find My Deal →</button>
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
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--coral)', display: 'block', marginBottom: '0.5rem' }}>where are you dreaming of going?</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--dark)', lineHeight: 1.15 }}>
            Tell us your trip.<br />
            <em style={{ fontStyle: 'italic', color: 'var(--coral)', fontWeight: 700 }}>We’ll find the way to make it happen.</em>
          </h2>
        </div>

        {/* Surprise Me — Featured full-width card */}
        <RandomizerCard tool={randomizer} onClick={() => setActiveTool(randomizer)} />

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--pink-soft)' }} />
          <span style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--dark-mid)', whiteSpace: 'nowrap' }}>or search your own trip</span>
          <div style={{ flex: 1, height: 1, background: 'var(--pink-soft)' }} />
        </div>

        {/* Flights + Hotels grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {pairTools.map(tool => <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool)} />)}
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
        <span style={{ color: 'white', fontSize: '1rem' }}>✈</span>
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

function RandomizerCard({ tool, onClick }: { tool: Tool; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ width: '100%', background: hovered ? tool.bgColor : 'var(--white)', border: `2.5px solid ${hovered ? tool.accentColor : 'var(--pink-soft)'}`, borderRadius: 20, cursor: 'pointer', padding: '2.25rem 2.5rem', textAlign: 'left', position: 'relative', overflow: 'hidden', transition: 'all 0.25s ease', boxShadow: hovered ? `0 16px 48px ${tool.accentColor}22` : '0 2px 12px rgba(44,31,26,0.05)', transform: hovered ? 'translateY(-3px)' : 'none', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}
    >
      {/* Watermark emoji */}
      <div style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '7rem', opacity: hovered ? 0.08 : 0.04, transition: 'opacity 0.25s', pointerEvents: 'none', userSelect: 'none' }}>🎲</div>

      {/* Left: icon + heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
        <div style={{ width: 64, height: 64, background: hovered ? tool.accentColor : 'var(--blush)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: hovered ? 'white' : tool.accentColor, transition: 'all 0.25s', border: `2px solid ${hovered ? tool.accentColor : 'var(--pink-soft)'}`, boxShadow: hovered ? `0 6px 20px ${tool.accentColor}44` : 'none', flexShrink: 0 }}>
          {tool.icon}
        </div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem', color: 'var(--dark)', lineHeight: 1.05, marginBottom: '0.2rem' }}>{tool.title}</h3>
          <p style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, fontSize: '1rem', color: hovered ? tool.accentColor : 'var(--dark-mid)', transition: 'color 0.25s', margin: 0 }}>{tool.subtitle}</p>
        </div>
      </div>

      {/* Middle: description */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: tool.accentColor, marginBottom: '0.5rem', opacity: 0.85 }}>{tool.tagline}</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--dark-mid)', lineHeight: 1.7, fontWeight: 300, margin: 0 }}>{tool.description}</p>
      </div>

      {/* Right: CTA */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: hovered ? tool.accentColor : 'transparent', color: hovered ? 'white' : tool.accentColor, border: `2px solid ${tool.accentColor}`, borderRadius: 100, padding: '0.65rem 1.6rem', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', transition: 'all 0.22s', whiteSpace: 'nowrap' }}>
          Surprise Me
          <ArrowRight size={16} style={{ transform: hovered ? 'translateX(3px)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>
    </button>
  )
}

function ToolCard({ tool, onClick }: { tool: Tool; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? tool.bgColor : 'var(--white)', border: `2.5px solid ${hovered ? tool.accentColor : 'var(--pink-soft)'}`, borderRadius: 20, cursor: 'pointer', padding: '2.25rem', textAlign: 'left', width: '100%', position: 'relative', overflow: 'hidden', transition: 'all 0.25s ease', boxShadow: hovered ? `0 16px 48px ${tool.accentColor}22` : '0 2px 12px rgba(44,31,26,0.05)', transform: hovered ? 'translateY(-4px)' : 'none' }}
    >
      <div style={{ position: 'absolute', bottom: '-1rem', right: '-0.5rem', fontSize: '8rem', opacity: hovered ? 0.07 : 0.04, transition: 'opacity 0.25s', pointerEvents: 'none', lineHeight: 1, color: tool.accentColor, userSelect: 'none' }}>
        {tool.id === 'flights' ? '✈' : '⌂'}
      </div>
      <div style={{ width: 56, height: 56, background: hovered ? tool.accentColor : 'var(--blush)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: hovered ? 'white' : tool.accentColor, marginBottom: '1.25rem', transition: 'all 0.25s', border: `2px solid ${hovered ? tool.accentColor : 'var(--pink-soft)'}`, boxShadow: hovered ? `0 6px 20px ${tool.accentColor}44` : 'none' }}>{tool.icon}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.6rem', color: 'var(--dark)', lineHeight: 1.1, marginBottom: '0.25rem' }}>{tool.title}</h3>
      <p style={{ fontFamily: 'var(--font-hand)', fontWeight: 600, fontSize: '0.95rem', color: hovered ? tool.accentColor : 'var(--dark-mid)', marginBottom: '0.5rem', transition: 'color 0.25s' }}>{tool.subtitle}</p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: tool.accentColor, marginBottom: '1rem', opacity: 0.8 }}>{tool.tagline}</p>
      <p style={{ fontSize: '0.85rem', color: 'var(--dark-mid)', lineHeight: 1.75, fontWeight: 300, marginBottom: '1.75rem', maxWidth: 320 }}>{tool.description}</p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: hovered ? tool.accentColor : 'transparent', color: hovered ? 'white' : tool.accentColor, border: `2px solid ${tool.accentColor}`, borderRadius: 100, padding: '0.5rem 1.3rem', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.22s' }}>
        {tool.id === 'flights' ? 'Find My Flight Deal' : 'Find My Hotel Deal'}
        <ArrowRight size={14} style={{ transform: hovered ? 'translateX(3px)' : 'none', transition: 'transform 0.2s' }} />
      </div>
    </button>
  )
}
