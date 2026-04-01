import React, { useState } from 'react'
import {
  Plane, Calendar, MapPin, Globe, Award,
  Search, Route, Hotel, ArrowRight, Sparkles
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
    icon: <Plane size={22} />,
    title: 'Carrier Intelligence',
    subtitle: 'Extractor',
    description: 'Uncover every operator on your route — regional carriers, charter services, wet leases, and codeshare combinations that never appear on comparison platforms.',
    accentColor: '#c9a84c',
    fields: [
      { key: 'origin', label: 'Origin Airport / City', placeholder: 'e.g. New York (JFK/LGA/EWR)' },
      { key: 'destination', label: 'Destination Airport / City', placeholder: 'e.g. London (LHR/LGW/STN)' },
    ],
    buildPrompt: (v) => `Act as an aviation market analyst who has mapped every airline operating every route globally including carriers that have never appeared on a single comparison platform. Extract every carrier option for the route from ${v.origin} to ${v.destination}, including the regional operators, the charter services, the wet lease arrangements, and the codeshare combinations that produce a seat on the same plane for a fraction of the price the primary carrier displays.\n\nRoute: ${v.origin} to ${v.destination}\n\nProvide a comprehensive breakdown organized by: Major carriers, Regional/subsidiary operators, Charter options, Wet lease arrangements, Codeshare combinations that provide cheaper access, and any seasonal or hidden operators. For each, note approximate price differential vs. main carrier and how to access/book.`
  },
  {
    id: 'calendar',
    number: '02',
    icon: <Calendar size={22} />,
    title: 'Calendar Vulnerability',
    subtitle: 'Scanner',
    description: 'Identify dates where airline pricing models produce outputs below intended levels due to demand forecasting errors and inventory management decisions.',
    accentColor: '#7eb5c8',
    fields: [
      { key: 'route', label: 'Route', placeholder: 'e.g. JFK to LHR or New York to London' },
      { key: 'window', label: 'Travel Window', placeholder: 'e.g. June 1 to August 31, 2025' },
    ],
    buildPrompt: (v) => `Act as a fare calendar specialist who has identified the specific dates where airline pricing models produce their lowest outputs due to demand forecasting errors, schedule changes, and inventory management decisions. Scan the complete fare calendar for the route ${v.route} across the travel window ${v.window} and identify every date combination where the pricing model is producing results below what the airline intended to sell this seat for.\n\nRoute: ${v.route}\nTravel window: ${v.window}\n\nProvide: specific optimal departure date ranges, return date combinations, day-of-week patterns that consistently produce lower fares, any schedule change windows to watch, historical pricing pattern analysis, and the specific booking timing (days in advance) that correlates with lowest prices on this route.`
  },
  {
    id: 'ground',
    number: '03',
    icon: <MapPin size={22} />,
    title: 'Ground Cost',
    subtitle: 'Eliminator',
    description: 'Calculate the true door-to-door cost of every airport combination, exposing ground transport costs that transform apparent deals into expensive journeys.',
    accentColor: '#8fba8f',
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
    icon: <Globe size={22} />,
    title: 'Foreign Market',
    subtitle: 'Price Hunter',
    description: 'Exploit pricing arbitrage across national markets — identical seats on identical flights sold at dramatically lower prices through foreign booking portals.',
    accentColor: '#c47eb5',
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
    icon: <Award size={22} />,
    title: 'Award Space',
    subtitle: 'Intelligence System',
    description: 'Access business and first class seats through frequent flyer programs on routes most travelers assume are impossible — including partner redemptions and transfer windows.',
    accentColor: '#c99a4c',
    fields: [
      { key: 'route', label: 'Route', placeholder: 'e.g. New York to Tokyo' },
      { key: 'programs', label: 'My Loyalty Programs', placeholder: 'e.g. Chase Ultimate Rewards, Amex MR, United MileagePlus, Delta SkyMiles' },
    ],
    buildPrompt: (v) => `Act as an award availability specialist who has accessed business and first class seats through frequent flyer programs on routes most travelers assume are impossible with miles. Build my complete award intelligence system for ${v.route} using my programs: ${v.programs}. Identify every partner redemption opportunity, every transfer pathway, and specific calendar windows where premium award space consistently opens up before it disappears.\n\nMy route: ${v.route}\nMy programs: ${v.programs}\n\nProvide: direct program award options with rates, partner airline redemption opportunities, transfer partner pathways with ratios, sweet spot redemption rates, best cabin class value options, specific booking windows (days before departure when space opens), search tools to use, and a priority action list ranked by value.`
  },
  {
    id: 'forensics',
    number: '06',
    icon: <Search size={22} />,
    title: 'True Cost',
    subtitle: 'Forensics Report',
    description: 'Surface every hidden charge that transforms a cheap fare into an expensive journey — from booking through landing, nothing stays hidden.',
    accentColor: '#c47a5a',
    fields: [
      { key: 'itinerary', label: 'Itinerary', placeholder: 'e.g. Spirit Airlines JFK to LAX, July 15, Basic Economy, 1 checked bag, return July 22', multiline: true },
    ],
    buildPrompt: (v) => `Act as a travel forensics specialist who has calculated the real all-in price of journeys that appeared cheap until every hidden charge surfaced between booking and landing. Produce a complete forensics report on this itinerary: ${v.itinerary}\n\nSurface every charge the booking screen does not show, every charge that appears only after commitment, and every cost that accumulates between departure and arrival that transforms a cheap fare into an expensive journey.\n\nStructure as: (1) Base fare analysis, (2) Pre-booking hidden fees, (3) At-booking mandatory add-ons, (4) Post-booking charges, (5) Airport/day-of fees, (6) In-flight costs, (7) Arrival costs, (8) TOTAL TRUE COST vs. advertised price, (9) Comparison of what a seemingly more expensive competitor would actually cost all-in.`
  },
  {
    id: 'sequencer',
    number: '07',
    icon: <Route size={22} />,
    title: 'Optimal Decision',
    subtitle: 'Sequencer',
    description: 'The precise order of booking actions that consistently produces the lowest total trip cost — what to monitor daily and the exact signal that the window is closing.',
    accentColor: '#7e9ec4',
    fields: [
      { key: 'trip', label: 'Upcoming Trip Details', placeholder: 'e.g. Family trip to Paris, 2 adults 1 child, business class preferred, flexible on dates', multiline: true },
      { key: 'dates', label: 'Target Travel Dates', placeholder: 'e.g. Targeting late September 2025, 10-day trip' },
    ],
    buildPrompt: (v) => `Act as a travel decision architect who has identified the precise sequence of booking actions that consistently produces the lowest total trip cost by understanding which decisions affect which prices and in what order. Design my complete decision sequence for this trip.\n\nMy upcoming trip: ${v.trip}\nMy travel dates: ${v.dates}\n\nProvide: (1) The optimal booking sequence — what to book first, second, third and why, (2) What to monitor daily and which specific tools/alerts to use, (3) The price signal that tells me the window for the lowest available price is closing permanently, (4) Decision dependencies — how booking X affects the price of Y, (5) A week-by-week countdown action plan, (6) The single most important action to take in the next 48 hours.`
  },
  {
    id: 'hotels',
    number: '08',
    icon: <Hotel size={22} />,
    title: 'Luxury Deal',
    subtitle: 'Hunter',
    description: 'Uncover deal and sale prices on 4 and 5-star resorts and hotels — flash sales, unpublished rates, points redemptions, and negotiated rates most travelers never see.',
    accentColor: '#9c8fc4',
    fields: [
      { key: 'destination', label: 'Destination', placeholder: 'e.g. Maldives, Bali, Paris' },
      { key: 'dates', label: 'Stay Dates', placeholder: 'e.g. August 10-20, 2025' },
      { key: 'preferences', label: 'Preferences', placeholder: 'e.g. Overwater bungalow, adults-only, beach access, flexible on exact location', multiline: true },
    ],
    buildPrompt: (v) => `Act as a luxury hotel deal specialist who has accessed 4 and 5-star resort deals, unpublished rates, and flash sales that most travelers never discover. Find every deal and sale price on premium accommodations in ${v.destination} for ${v.dates} with preferences: ${v.preferences}.\n\nDestination: ${v.destination}\nDates: ${v.dates}\nPreferences: ${v.preferences}\n\nProvide: (1) Current or upcoming flash sales at 4-5 star properties, (2) Best points redemption opportunities — which programs, which properties, redemption rates, (3) Unpublished rate strategies — calling direct, corporate rates, AAA, AARP, (4) Rate parity violations — booking direct vs. OTA price differences, (5) Best value properties that punch above their price point, (6) Package deals that bundle flights and hotel for better combined value, (7) Shoulder season windows where luxury becomes affordable, (8) Top 5 specific property recommendations with current best rate strategy for each.`
  }
]

export default function App() {
  const [activeTool, setActiveTool] = useState<Tool | null>(null)

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '1.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10, 9, 8, 0.92)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400, color: '#0a0908' }}>Y</span>
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 400,
              letterSpacing: '0.15em',
              color: 'var(--cream)',
              lineHeight: 1,
            }}>Yes To Life Travel</div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--gold-dim)', textTransform: 'uppercase' }}>
              Elite Travel Intelligence
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
          <Sparkles size={12} color="var(--gold-dim)" />
          <span>Powered by Claude AI</span>
        </div>
      </header>

      <section style={{
        padding: '5rem 2rem 4rem',
        maxWidth: 900,
        margin: '0 auto',
        textAlign: 'center',
        animation: 'fadeUp 0.8s ease both',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.35rem 1rem',
          border: '1px solid var(--gold-dim)',
          borderRadius: 100,
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          marginBottom: '2rem',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
          8 Intelligence Systems
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 300,
          lineHeight: 1.1,
          color: 'var(--cream)',
          marginBottom: '1.5rem',
          letterSpacing: '0.02em',
        }}>
          Travel at the<br />
          <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>intelligence level</em>
          <br />of industry insiders
        </h1>
        <p style={{
          color: 'var(--muted)',
          maxWidth: 520,
          margin: '0 auto',
          fontSize: '0.95rem',
          lineHeight: 1.8,
        }}>
          Eight AI-powered systems that extract market intelligence, expose hidden costs, and sequence your booking decisions for maximum value.
        </p>
      </section>

      <div style={{
        maxWidth: 900,
        margin: '0 auto 3rem',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, var(--border2))' }} />
        <div style={{ width: 4, height: 4, background: 'var(--gold-dim)', borderRadius: '50%' }} />
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, var(--border2))' }} />
      </div>

      <main style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 2rem 6rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1px',
        background: 'var(--border)',
        border: '1px solid var(--border)',
      }}>
        {tools.map((tool, i) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            index={i}
            onClick={() => setActiveTool(tool)}
          />
        ))}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '0.75rem',
        letterSpacing: '0.1em',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-dim)', marginRight: '0.5rem' }}>Yes To Life Travel</span>
        Elite Travel Intelligence · Powered by Claude AI
      </footer>

      {activeTool && (
        <ToolModal tool={activeTool} onClose={() => setActiveTool(null)} />
      )}
    </div>
  )
}

function ToolCard({ tool, index, onClick }: { tool: Tool; index: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface)' : 'var(--deep)',
        border: 'none',
        cursor: 'pointer',
        padding: '2rem',
        textAlign: 'left',
        transition: 'background 0.25s ease',
        animation: `fadeUp 0.6s ${index * 0.07}s ease both`,
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 2,
        background: hovered
          ? `linear-gradient(to right, ${tool.accentColor}44, ${tool.accentColor}, ${tool.accentColor}44)`
          : 'transparent',
        transition: 'all 0.3s ease',
      }} />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.25rem',
      }}>
        <div style={{
          width: 44, height: 44,
          border: `1px solid ${hovered ? tool.accentColor + '66' : 'var(--border2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: hovered ? tool.accentColor : 'var(--muted)',
          transition: 'all 0.25s ease',
        }}>
          {tool.icon}
        </div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 300,
          color: hovered ? tool.accentColor + '44' : 'var(--border2)',
          transition: 'color 0.25s ease',
          lineHeight: 1,
        }}>{tool.number}</span>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 400,
          color: hovered ? 'var(--cream)' : 'var(--text)',
          lineHeight: 1.2,
          transition: 'color 0.25s ease',
        }}>
          {tool.title}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 300,
          fontStyle: 'italic',
          color: hovered ? tool.accentColor : 'var(--muted)',
          lineHeight: 1.2,
          transition: 'color 0.25s ease',
        }}>
          {tool.subtitle}
        </div>
      </div>

      <p style={{
        fontSize: '0.8rem',
        color: 'var(--muted)',
        lineHeight: 1.7,
        marginBottom: '1.5rem',
      }}>
        {tool.description}
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.7rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: hovered ? tool.accentColor : 'var(--border2)',
        transition: 'color 0.25s ease',
      }}>
        <span>Activate System</span>
        <ArrowRight size={12} style={{
          transform: hovered ? 'translateX(4px)' : 'none',
          transition: 'transform 0.2s ease',
        }} />
      </div>
    </button>
  )
}
