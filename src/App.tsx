import React, { useState } from 'react'
import {
  Plane, Calendar, MapPin, Globe, Award,
  Search, Route, Hotel, ArrowRight
} from 'lucide-react'
import ToolModal from './components/ToolModal'

export interface Tool {
  id: string
  number: string
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
  fields: Field[]
  buildPrompt: (values: Record<string, string>) => string
  accentColor: string
}

export interface Field {
  key: string
  label: string
  placeholder: string
  multiline?: boolean
}

const tools: Tool[] = [
  {
    id: 'carrier',
    number: '01',
    icon: <Plane size={20} />,
    title: 'Carrier Intelligence',
    subtitle: 'Extractor',
    description: 'Uncover every operator on your route — regional carriers, charter services, wet leases, and codeshare combinations that never appear on comparison platforms.',
    accentColor: '#E8523A',
    fields: [
      { key: 'origin', label: 'Origin Airport / City', placeholder: 'e.g. New York (JFK/LGA/EWR)' },
      { key: 'destination', label: 'Destination Airport / City', placeholder: 'e.g. London (LHR/LGW/STN)' },
    ],
    buildPrompt: (v) => `Act as an aviation market analyst who has mapped every airline operating every route globally including carriers that have never appeared on a single comparison platform. Extract every carrier option for the route from ${v.origin} to ${v.destination}, including the regional operators, the charter services, the wet lease arrangements, and the codeshare combinations that produce a seat on the same plane for a fraction of the price the primary carrier displays.\n\nRoute: ${v.origin} to ${v.destination}\n\nProvide a comprehensive breakdown organized by: Major carriers, Regional/subsidiary operators, Charter options, Wet lease arrangements, Codeshare combinations that provide cheaper access, and any seasonal or hidden operators. For each, note approximate price differential vs. main carrier and how to access/book.`
  },
  {
    id: 'calendar',
    number: '02',
    icon: <Calendar size={20} />,
    title: 'Calendar Vulnerability',
    subtitle: 'Scanner',
    description: 'Identify dates where airline pricing models produce outputs below intended levels due to demand forecasting errors and inventory management decisions.',
    accentColor: '#8B9ED9',
    fields: [
      { key: 'route', label: 'Route', placeholder: 'e.g. JFK to LHR or New York to London' },
      { key: 'window', label: 'Travel Window', placeholder: 'e.g. June 1 to August 31, 2025' },
    ],
    buildPrompt: (v) => `Act as a fare calendar specialist who has identified the specific dates where airline pricing models produce their lowest outputs due to demand forecasting errors, schedule changes, and inventory management decisions. Scan the complete fare calendar for the route ${v.route} across the travel window ${v.window} and identify every date combination where the pricing model is producing results below what the airline intended to sell this seat for.\n\nRoute: ${v.route}\nTravel window: ${v.window}\n\nProvide: specific optimal departure date ranges, return date combinations, day-of-week patterns that consistently produce lower fares, any schedule change windows to watch, historical pricing pattern analysis, and the specific booking timing (days in advance) that correlates with lowest prices on this route.`
  },
  {
    id: 'ground',
    number: '03',
    icon: <MapPin size={20} />,
    title: 'Ground Cost',
    subtitle: 'Eliminator',
    description: 'Calculate the true door-to-door cost of every airport combination, exposing ground transport costs that transform apparent deals into expensive journeys.',
    accentColor: '#8A8A3C',
    fields: [
      { key: 'originCity', label: 'Origin City', placeholder: 'e.g. Los Angeles, CA' },
      { key: 'destCity', label: 'Destination City', placeholder: 'e.g. Paris, France' },
      { key: 'radius', label: 'Search Radius (miles)', placeholder: 'e.g. 75' },
    ],
    buildPrompt: (v) => `Act as a total journey cost specialist who calculates the real price of every trip by including every dollar spent between the front door and the destination. Calculate the complete ground cost comparison for every airport combination within ${v.radius} miles of both ${v.originCity} and ${v.destCity} and identify the specific combination producing the lowest door-to-door journey cost.\n\nOrigin city: ${v.originCity}\nDestination city: ${v.destCity}\nDistance radius: ${v.radius} miles\n\nFor each airport combination provide: ground transport options and costs on both ends, parking costs if driving, transit time comparisons, hidden fees (fuel surcharges, tolls, tips), total added cost vs. headline ticket price, and identify the single best combination by total journey cost.`
  },
  {
    id: 'foreign',
    number: '04',
    icon: <Globe size={20} />,
    title: 'Foreign Market',
    subtitle: 'Price Hunter',
    description: 'Exploit pricing arbitrage across national markets — identical seats on identical flights sold at dramatically lower prices through foreign booking portals.',
    accentColor: '#F4A882',
    fields: [
      { key: 'airline', label: 'Airline', placeholder: 'e.g. British Airways, Emirates' },
      { key: 'route', label: 'Route', placeholder: 'e.g. JFK to LHR' },
      { key: 'dates', label: 'Travel Dates', placeholder: 'e.g. July 15-29, 2025' },
    ],
    buildPrompt: (v) => `Act as an international pricing arbitrage specialist who has purchased airline tickets through foreign market websites and saved thousands by exploiting differential national markets for identical seats on identical flights. Identify every foreign market where ${v.airline} sells tickets for ${v.route} at a lower price than domestic platforms and give me the exact purchasing process for accessing each one.\n\nAirline: ${v.airline}\nRoute: ${v.route}\nTravel dates: ${v.dates}\n\nProvide: specific country markets to check, the exact booking websites for each market, currency conversion considerations, credit card foreign transaction fee impact, payment method requirements, VPN considerations, any geographic restrictions, step-by-step purchasing process for the top 3 markets, and realistic savings potential.`
  },
  {
    id: 'award',
    number: '05',
    icon: <Award size={20} />,
    title: 'Award Space',
    subtitle: 'Intelligence System',
    description: 'Access business and first class seats through frequent flyer programs on routes most travelers assume are impossible — including partner redemptions and transfer windows.',
    accentColor: '#E8523A',
    fields: [
      { key: 'route', label: 'Route', placeholder: 'e.g. New York to Tokyo' },
      { key: 'programs', label: 'My Loyalty Programs', placeholder: 'e.g. Chase Ultimate Rewards, Amex MR, United MileagePlus' },
    ],
    buildPrompt: (v) => `Act as an award availability specialist who has accessed business and first class seats through frequent flyer programs on routes most travelers assume are impossible with miles. Build my complete award intelligence system for ${v.route} using my programs: ${v.programs}. Identify every partner redemption opportunity, every transfer pathway, and specific calendar windows where premium award space consistently opens up before it disappears.\n\nMy route: ${v.route}\nMy programs: ${v.programs}\n\nProvide: direct program award options with rates, partner airline redemption opportunities, transfer partner pathways with ratios, sweet spot redemption rates, best cabin class value options, specific booking windows (days before departure when space opens), search tools to use, and a priority action list ranked by value.`
  },
  {
    id: 'forensics',
    number: '06',
    icon: <Search size={20} />,
    title: 'True Cost',
    subtitle: 'Forensics Report',
    description: 'Surface every hidden charge that transforms a cheap fare into an expensive journey — from booking through landing, nothing stays hidden.',
    accentColor: '#8B9ED9',
    fields: [
      { key: 'itinerary', label: 'Itinerary', placeholder: 'e.g. Spirit Airlines JFK to LAX, July 15, Basic Economy, 1 checked bag, return July 22', multiline: true },
    ],
    buildPrompt: (v) => `Act as a travel forensics specialist who has calculated the real all-in price of journeys that appeared cheap until every hidden charge surfaced between booking and landing. Produce a complete forensics report on this itinerary: ${v.itinerary}\n\nSurface every charge the booking screen does not show, every charge that appears only after commitment, and every cost that accumulates between departure and arrival that transforms a cheap fare into an expensive journey.\n\nStructure as: (1) Base fare analysis, (2) Pre-booking hidden fees, (3) At-booking mandatory add-ons, (4) Post-booking charges, (5) Airport/day-of fees, (6) In-flight costs, (7) Arrival costs, (8) TOTAL TRUE COST vs. advertised price, (9) Comparison of what a seemingly more expensive competitor would actually cost all-in.`
  },
  {
    id: 'sequencer',
    number: '07',
    icon: <Route size={20} />,
    title: 'Optimal Decision',
    subtitle: 'Sequencer',
    description: 'The precise order of booking actions that consistently produces the lowest total trip cost — what to monitor daily and the exact signal that the window is closing.',
    accentColor: '#8A8A3C',
    fields: [
      { key: 'trip', label: 'Upcoming Trip Details', placeholder: 'e.g. Family trip to Paris, 2 adults 1 child, business class preferred, flexible on dates', multiline: true },
      { key: 'dates', label: 'Target Travel Dates', placeholder: 'e.g. Targeting late September 2025, 10-day trip' },
    ],
    buildPrompt: (v) => `Act as a travel decision architect who has identified the precise sequence of booking actions that consistently produces the lowest total trip cost by understanding which decisions affect which prices and in what order. Design my complete decision sequence for this trip.\n\nMy upcoming trip: ${v.trip}\nMy travel dates: ${v.dates}\n\nProvide: (1) The optimal booking sequence — what to book first, second, third and why, (2) What to monitor daily and which specific tools/alerts to use, (3) The price signal that tells me the window for the lowest available price is closing permanently, (4) Decision dependencies — how booking X affects the price of Y, (5) A week-by-week countdown action plan, (6) The single most important action to take in the next 48 hours.`
  },
  {
    id: 'hotels',
    number: '08',
    icon: <Hotel size={20} />,
    title: 'Luxury Deal',
    subtitle: 'Hunter',
    description: 'Uncover deal and sale prices on 4 and 5-star resorts and hotels — flash sales, unpublished rates, points redemptions, and negotiated rates most travelers never see.',
    accentColor: '#F4A882',
    fields: [
      { key: 'destination', label: 'Destination', placeholder: 'e.g. Maldives, Bali, Paris' },
      { key: 'dates', label: 'Stay Dates', placeholder: 'e.g. August 10-20, 2025' },
      { key: 'preferences', label: 'Preferences', placeholder: 'e.g. Overwater bungalow, adults-only, beach access, flexible on exact location', multiline: true },
    ],
    buildPrompt: (v) => `Act as a luxury hotel deal specialist who has accessed 4 and 5-star resort deals, unpublished rates, and flash sales that most travelers never discover. Find every deal and sale price on premium accommodations in ${v.destination} for ${v.dates} with preferences: ${v.preferences}.\n\nDestination: ${v.destination}\nDates: ${v.dates}\nPreferences: ${v.preferences}\n\nProvide: (1) Current or upcoming flash sales at 4-5 star properties, (2) Best points redemption opportunities, (3) Unpublished rate strategies — calling direct, corporate rates, AAA, AARP, (4) Rate parity violations — booking direct vs. OTA price differences, (5) Best value properties that punch above their price point, (6) Package deals that bundle flights and hotel for better combined value, (7) Shoulder season windows where luxury becomes affordable, (8) Top 5 specific property recommendations with current best rate strategy for each.`
  }
]

const marqueeItems = [
  '✈ Carrier Intelligence', '🗓 Calendar Scanning', '🗺 Ground Cost Analysis',
  '🌍 Foreign Market Arbitrage', '🏆 Award Space', '🔍 True Cost Forensics',
  '📋 Decision Sequencing', '🏨 Luxury Deal Hunting', '✈ Carrier Intelligence',
  '🗓 Calendar Scanning', '🗺 Ground Cost Analysis', '🌍 Foreign Market Arbitrage',
  '🏆 Award Space', '🔍 True Cost Forensics', '📋 Decision Sequencing', '🏨 Luxury Deal Hunting',
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
        background: 'rgba(250,245,238,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--pink-soft)',
      }}>
        <LogoWordmark />
        <div style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--coral)',
          letterSpacing: '0.02em',
        }}>
          8 intelligence systems
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '5rem 2rem 4rem',
        textAlign: 'center',
        background: 'var(--coral)',
      }}>
        {/* Blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        {/* Spinning badge */}
        <div style={{
          position: 'absolute',
          top: '2rem',
          right: '2.5rem',
          width: 90, height: 90,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg className="spinning-badge" viewBox="0 0 90 90" width="90" height="90">
            <defs>
              <path id="circle" d="M 45,45 m -32,0 a 32,32 0 1,1 64,0 a 32,32 0 1,1 -64,0" />
            </defs>
            <text style={{ fontSize: 11, fill: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-hand)', fontWeight: 600, letterSpacing: 3 }}>
              <textPath href="#circle">AI-POWERED · TRAVEL · INTELLIGENCE · </textPath>
            </text>
            <circle cx="45" cy="45" r="14" fill="rgba(255,255,255,0.15)" />
            <text x="45" y="49" textAnchor="middle" style={{ fontSize: 12, fill: 'white', fontFamily: 'var(--font-body)' }}>✈</text>
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1.15rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
            marginBottom: '1rem',
            letterSpacing: '0.03em',
          }}>
            stop overpaying. start traveling smarter.
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
            fontWeight: 900,
            lineHeight: 1.05,
            color: 'var(--white)',
            marginBottom: '1.5rem',
            letterSpacing: '-0.01em',
          }}>
            Travel at the level<br />
            <em style={{ fontStyle: 'italic', color: 'var(--peach)' }}>insiders don't share.</em>
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            maxWidth: 500,
            margin: '0 auto 2.5rem',
            fontSize: '1rem',
            lineHeight: 1.75,
            fontWeight: 300,
          }}>
            Eight AI-powered intelligence systems that expose hidden costs, find real deals, and sequence every booking decision for maximum value.
          </p>
          <button
            onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: 'var(--white)',
              color: 'var(--coral)',
              border: 'none',
              padding: '0.9rem 2.2rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              borderRadius: 100,
              letterSpacing: '0.01em',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            Start Exploring →
          </button>
        </div>
      </section>

      {/* Marquee strip */}
      <div style={{
        background: 'var(--dark)',
        color: 'var(--peach)',
        padding: '0.65rem 0',
        overflow: 'hidden',
        borderTop: '2px solid var(--coral)',
        borderBottom: '2px solid var(--coral)',
      }}>
        <div className="marquee-track">
          {marqueeItems.map((item, i) => (
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

      {/* Tools Grid */}
      <main id="tools" style={{ padding: '4rem 2rem 6rem', maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--coral)',
            display: 'block',
            marginBottom: '0.5rem',
          }}>choose your weapon</span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            color: 'var(--dark)',
            lineHeight: 1.15,
          }}>
            8 Intelligence Systems
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {tools.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} index={i} onClick={() => setActiveTool(tool)} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: 'var(--dark)',
        color: 'var(--pink-soft)',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        borderTop: '3px solid var(--coral)',
      }}>
        <LogoWordmarkLight />
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8rem',
          color: 'var(--dark-mid)',
          marginTop: '0.75rem',
          color: 'rgba(240,202,188,0.5)',
        }}>
          Powered by Claude AI · Elite Travel Intelligence
        </p>
      </footer>

      {activeTool && <ToolModal tool={activeTool} onClose={() => setActiveTool(null)} />}
    </div>
  )
}

function LogoWordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
          fontSize: '0.6rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--dark-mid)',
          display: 'block',
          marginTop: '1px',
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

function ToolCard({ tool, index, onClick }: { tool: Tool; index: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  const isCoralAccent = tool.accentColor === '#E8523A'
  const isPeach = tool.accentColor === '#F4A882'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--white)' : 'var(--blush)',
        border: `2px solid ${hovered ? tool.accentColor : 'var(--pink-soft)'}`,
        borderRadius: 16,
        cursor: 'pointer',
        padding: '1.75rem',
        textAlign: 'left',
        transition: 'all 0.22s ease',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        animation: `fadeUp 0.5s ${index * 0.06}s ease both`,
        boxShadow: hovered ? '0 8px 32px rgba(232,82,58,0.12)' : '0 2px 8px rgba(44,31,26,0.04)',
        transform: hovered ? 'translateY(-3px)' : 'none',
      }}
    >
      {/* Number watermark */}
      <span style={{
        position: 'absolute',
        top: '0.75rem',
        right: '1rem',
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        fontSize: '3.5rem',
        color: hovered ? tool.accentColor + '18' : 'var(--pink-soft)',
        lineHeight: 1,
        transition: 'color 0.22s',
        userSelect: 'none',
      }}>{tool.number}</span>

      {/* Icon */}
      <div style={{
        width: 46, height: 46,
        background: hovered ? tool.accentColor : 'var(--white)',
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hovered ? 'white' : tool.accentColor,
        marginBottom: '1.1rem',
        transition: 'all 0.22s ease',
        border: `1.5px solid ${hovered ? tool.accentColor : 'var(--pink-soft)'}`,
        boxShadow: hovered ? `0 4px 14px ${tool.accentColor}44` : 'none',
      }}>
        {tool.icon}
      </div>

      <div style={{ marginBottom: '0.6rem' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.15rem',
          fontWeight: 900,
          color: 'var(--dark)',
          lineHeight: 1.15,
        }}>
          {tool.title}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          fontWeight: 700,
          fontStyle: 'italic',
          color: hovered ? tool.accentColor : 'var(--dark-mid)',
          lineHeight: 1.15,
          transition: 'color 0.22s',
        }}>
          {tool.subtitle}
        </div>
      </div>

      <p style={{
        fontSize: '0.8rem',
        color: 'var(--dark-mid)',
        lineHeight: 1.65,
        marginBottom: '1.25rem',
        fontWeight: 300,
      }}>
        {tool.description}
      </p>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontFamily: 'var(--font-hand)',
        fontSize: '0.9rem',
        fontWeight: 600,
        color: hovered ? tool.accentColor : 'var(--dark-mid)',
        transition: 'color 0.22s',
      }}>
        Activate
        <ArrowRight size={14} style={{
          transform: hovered ? 'translateX(4px)' : 'none',
          transition: 'transform 0.2s',
        }} />
      </div>
    </button>
  )
}
