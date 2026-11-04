// Registry of built plates. To publish a day: add its module + data here,
// then set "status": "published" in src/data/days.json.
//   render({ mode, variant })  'gray' | 'color'; 'plate' (print and download), or the day page's
//                              'map', 'chart' and 'inset' (with hover hooks; see the day page)
//   file, subtitle, finding    download name stem, page subtitle (also the landing page's problem
//                              statement), headline finding
//   story                      background, findings and plan paragraphs for the day page; or
//                              sections [heading, paragraphs, open?] in panel order (findings still
//                              needed: page description and the plate's findings column)
//   ledger                     [label, value, url?] rows for the Data and method section;
//                              value may be a list of [text, url] links
//   csv()                      the plotted data, offered as a download
//   page                       the day page's middle-column headings: chart { title, note, colorNote? },
//                              inset { title } (the page appends the inset's scale)
// Story numbers are computed from each plate's data below, never typed, so the text cannot drift.
import cityBoundary from '../../reference/city-boundary.json';
import lineSequences from '../../reference/cta-line-sequences.json';
import day01Data from '../../days/day01-points/output/plate.json';
import { renderDay01 } from './day01.js';
import day02Data from '../../days/day02-lines/output/plate.json';
import { renderDay02, monthSpan, pct } from './day02.js';
import day03Data from '../../days/day03-polygons/output/plate.json';
import { renderDay03, CHART_NOTE as D3_CHART_NOTE, INSET_TITLE as D3_INSET } from './day03.js';

const csv = (rows) =>
  rows.map((r) => r.map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(',')).join('\n') + '\n';

const d1 = day01Data.summary;
const purple = day01Data.byLine.find((l) => l.line === 'Purple');
const d1Finding = day01Data.finding; // generated in the notebook from the counts

// Every CTA statement below is from the CTA pages linked in the ledger (ASAP page; releases of
// 31 Jul 2024 and 7 Aug 2026). Station counts come from the plotted data.
const d1Story = {
  background: [
    'When the Americans with Disabilities Act passed in 1990, fewer than 10 of CTA’s rail stations, about 6%, complied. CTA met the law’s “key station” requirements in December 2009, with the completion of the Brown Line Capacity Expansion Project.',
    'The map is drawn in miles from State & Madison, one square per mile, with no basemap: only the city limits, shaded, and grid lines labeled with address numbers. Stations outside the shading are in Wilmette, Evanston, Skokie, Rosemont, Oak Park, Forest Park and Cicero. Hover a station for its name and lines, or a line to show only its stations.',
  ],
  findings: [
    `In the City’s open data, ${d1.total - d1.noStepFree} of ${d1.total} ‘L’ stations are flagged accessible and ${d1.noStepFree} are not. The flag lags CTA’s own count: it still marks the Green Line’s Austin station, which reopened fully accessible in August 2026, as non-accessible.`,
    `The gaps cluster on one line. The Blue Line holds ${d1.blueNoStepFree} of the ${d1.noStepFree}, more than half of its ${d1.blueTotal} stations: 8 of 12 on the Forest Park branch, 6 of 8 in the subway from Division to LaSalle, and 5 of 13 on the branch to O’Hare, where the five stations nearest the airport are all accessible.`,
    `The Purple Line follows with ${purple.noStepFree} of ${purple.total}: six in Evanston and three shared Loop stations. No other line has more than seven.`,
  ],
  plan: [
    'In July 2018 CTA unveiled its All Stations Accessibility Program (ASAP), to make 100% of its rail stations vertically accessible by 2038. The 2024 update counted 42 non-accessible stations, averaging 75 years old, and put the cost at $4.9 billion (up from $2.1 billion in 2018), including rehabilitating or replacing all 162 existing station elevators.',
    'In August 2026, after Austin reopened, CTA reported 110 of its 146 rail stations (75%) accessible. It calls funding the biggest impediment to a fully accessible system.',
    'Phase One, fully funded at $423.5 million and due by 2027, includes Montrose, California and Racine on the Blue Line and State/Lake in the Loop. Phase Two lists Irving Park, Belmont, Pulaski, Cicero and Austin on the Blue Line, Oak Park and Ridgeland on the Green Line, and North/Clybourn on the Red Line; CTA has funding for five of those eight.',
  ],
};

const d2 = day02Data.summary;
const d2NotDrawn = day02Data.notScheduled;
const d2Top = day02Data.routes.slice(0, d2.halfRoutes);
const routeName = (r) => `${r.name} (${r.id})`;
const d2Above = d2Top.filter((r) => r.ridersBench && r.riders > r.ridersBench).map(routeName);
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

// CTA's Frequent Network as listed on its page (24 routes by the end of 2026, #8 Halsted from December).
const FREQUENT_NETWORK = ['4', '8', '9', '12', 'J14', '20', '34', '35', '47', '49', '53', '54', '55', '60', '63', '66', '72', '74', '77', '79', '81', '82', '85', '95'];
const d2Routes = new Map(day02Data.routes.map((r) => [r.id, r]));
const d2Fn = FREQUENT_NETWORK.map((id) => d2Routes.get(id));
const d2FnShare = d2Fn.reduce((s, r) => s + r.riders, 0) / d2.riders;
const d2FnAll = d2Fn.every((r) => r.tier === 'frequent');
const d2FnPlus = day02Data.routes.filter((r) => r.tier === 'frequent' && !FREQUENT_NETWORK.includes(r.id)).map(routeName);

// Every number below is computed from the plotted data (days/day02-lines/output/plate.json); every
// CTA statement in the plan is from the CTA pages linked in the ledger.
const d2Story = {
  background: [
    'Chicago’s street grid puts a major street every half mile, and CTA runs a bus along most of them. On paper that means no one in the city is more than a quarter mile from a bus. This plate asks which of those routes actually carry the riders, and how often each bus comes.',
    'The map is drawn in miles from State & Madison, one square per mile, with no basemap. Each route is drawn on its own streets, heavier and darker where the bus comes more often at midday; where routes share a street, the most frequent shows on top. The ’L’ lines are drawn for context. The chart ranks the routes by weekday riders. Hover a route for its riders and frequency, or a row of the chart to show only that route.',
  ],
  findings: [
    `On an average weekday from ${monthSpan(day02Data.window)}, CTA buses carried ${fmt(d2.riders)} riders on ${d2.routesInData} routes. The busiest ${d2.halfRoutes} routes carried half of them; the top ten alone, led by ${list(d2Top.slice(0, 3).map(routeName))}, carried ${pct(d2.top10Share)}.`,
    `${d2.tiers.frequent.routes} routes come every 10 minutes or better at midday, and they carry ${pct(d2.tiers.frequent.share)} of riders. ${d2.tiers.basic.routes} routes come less often than every 15 minutes; together they carry ${pct(d2.tiers.basic.share)}.`,
    `Measured in a straight line, ${pct(day02Data.coverage.anyShare)} of the city lies within a quarter mile of a bus route, but only ${pct(day02Data.coverage.frequentShare)} within a quarter mile of one that comes every 10 minutes.`,
    `Weekday riders are at ${pct(d2.recovery)} of ${day02Data.benchmarkYear}. Among the busiest routes, ${list(d2Above)} now carry more riders than in ${day02Data.benchmarkYear}.`,
  ],
  plan: [
    'In March 2025 CTA launched its Frequent Network: bus routes that come every 10 minutes or better from 6 a.m. to 9 p.m. on weekdays and 9 a.m. to 9 p.m. on weekends. It reached 20 routes in December 2025. The 31st/35th (35), Fullerton (74) and Central (85) routes joined on 23 August 2026, and Halsted (8) joins in December, for 24. CTA credits the added service to funding under the Northern Illinois Transit Authority (NITA) Act, and estimates that by the end of 2026, 75% of its service area will be within a half mile of a Frequent route.',
    `In the schedule mapped here, ${d2FnAll ? 'all 24 already come' : 'the 24 come'} every 10 minutes or better at midday, and they carry ${pct(d2FnShare)} of weekday riders. ${list(d2FnPlus)} also do at midday, but are not on the network, which holds that standard all day.`,
    'Frequency is half the promise; the other half is a bus that is not stuck in traffic. In November 2023 CTA and the Chicago Department of Transportation (CDOT) published Better Streets for Buses, the City’s first citywide framework for improving streets for buses. Its Bus Priority Corridor Study, funded by an Invest in Cook grant, covers Pulaski, Western, Cottage Grove, Fullerton and 55th Street, which carry nearly 74,000 riders on an average weekday across ten routes. Updated designs are expected for public comment in 2027.',
    'In September 2026 CDOT began installing a bus lane of nearly 1.5 miles on northbound Michigan Avenue, from Roosevelt Road to Wacker Drive. CTA counts 21 routes using at least part of it, and an estimated 22,000 bus riders through the segment every weekday.',
  ],
};

// Every number below is computed from the plotted data (days/day03-polygons/output/plate.json);
// CTA statements are from the ASAP page and the Austin release linked in the ledger.
const d3 = day03Data.summary;
const d3Sens = day03Data.sensitivity;
const d3Line = new Map(day03Data.byLine.map((l) => [l.line, l]));
const d3Blue = d3Line.get('Blue');
const d3Top = [...day03Data.stations].sort((a, b) => b.nearNonAccessible - a.nearNonAccessible).slice(0, 10);
const d3Name = (s) => `${s.short} (${s.lines.join('/')})`;
const hundreds = (n) => fmt(Math.round(n / 100) * 100);
const thousands = (n) => fmt(Math.round(n / 1000) * 1000);
const miles1 = (v) => v.toFixed(2).replace(/0$/, '');
// ASAP Phase One and Phase Two stations, as listed on CTA's ASAP page
const D3_PHASES = new Set(['Montrose (Blue)', 'California (Blue)', 'Racine (Blue)', 'State/Lake', 'Irving Park (Blue)', 'Belmont (Blue)', 'Pulaski (Blue)', 'Cicero (Blue)', 'Austin (Blue)', 'Oak Park (Green)', 'Ridgeland (Green)', 'North/Clybourn (Red)']);
const d3InPhase = (s) => D3_PHASES.has(d3Name(s)) || D3_PHASES.has(s.short);
const d3Unphased = d3Top.filter((s) => !d3InPhase(s));
const d3Phase2 = d3Top.filter((s) => d3InPhase(s) && !day03Data.phaseOne.includes(s.short));
const d3Net = day03Data.network;
const d3RedNorth = ['Morse', 'Jarvis', 'Sheridan'].reduce((n, k) => n + day03Data.stations.find((s) => s.short === k && s.lines.includes('Red')).nearNonAccessible, 0);
const d3Slow = d3Sens['ten minutes at 0.8 m/s'];
// Shares said in words where they are close to a simple fraction, else as a percentage.
const share = (v) => {
  const words = [[1 / 4, 'a quarter'], [1 / 3, 'one in three'], [1 / 2, 'half'], [2 / 3, 'two in three'], [3 / 4, 'three in four']];
  const [f, w] = words.find(([f]) => Math.abs(v - f) < 0.02) ?? [];
  if (!w) return pct(v);
  return Math.abs(v - f) < 0.007 ? w : v < f ? `nearly ${w}` : `just over ${w}`;
};
const walkMi = (v) => (Math.abs(v - 0.75) < 0.05 ? 'about three-quarters of a mile' : `${miles1(v)} mile`);
const d3Story = {
  background: [
    `The usual way to judge transit access is to count how many people live within a half mile of a station. By that measure, ${pct(d3.crowNearShare)} of Chicagoans live close to the ‘L’. But the count treats every station as equal, and they are not. At ${day01Data.summary.noStepFree} of ${day01Data.summary.total} ‘L’ stations, at least one platform can be reached only by stairs. For a wheelchair user, a parent with a stroller or an older rider who cannot manage stairs, such a station is not really an option. A vertically accessible station has an elevator or ramp from the street to every platform.`,
    `This map corrects the count in two ways. First, it walks the half mile instead of drawing a circle: distance runs along OpenStreetMap’s streets and paths, around blocks, and across the river, expressways and rail lines only where there is a way over or under. Circles would claim ${pct(d3.crowNearShare)} of residents; walking gives ${pct(d3.nearShare)}. Second, it walks the half mile again on a step-free copy of the network, to accessible stations only. The copy drops ${fmt(d3Net.stairs)} mapped stair segments and keeps the ${d3Net.elevators} mapped elevators and every ramp. That leaves ${pct(d3.nearAccessibleShare)}.`,
    'The map is drawn in miles from State & Madison, one square per mile, with no basemap. Solid tone is a step-free half-mile walk to an accessible station; hatching is a half-mile walk that reaches non-accessible stations only. Hover a station or its walkshed for the residents it serves, or a line in the chart to shade its stations’ walksheds.',
  ],
  findings: [
    `About ${thousands(d3.nearNonAccessible)} people live near the non-accessible ‘L’ stations. For half of them, the closest accessible station is ${walkMi(d3.nonAccessibleMedianWalkMi)} or more away. For ${share(d3.nonAccessibleBeyondMileShare)} of them, it is more than a mile.`,
    `${pct(d3Blue.nearNonAccessible / d3.nearNonAccessible)} of these people living near the non-accessible stations live along the Blue Line. The biggest group, ${thousands(day03Data.inset.residents)} people, lives along Milwaukee Avenue in West Town and Wicker Park, near the Division, Chicago and Damen stations. Another ${thousands(d3RedNorth)} live in Rogers Park and Uptown, near the Morse, Jarvis and Sheridan stations on the Red Line.`,
    'Counting everyone who lives near a station makes the ‘L’ look easier to reach than it is, most of all for people who need an elevator or a ramp.',
  ],
  gap: [
    `The American Community Survey counts about ${thousands(d3.ambulatory)} Chicagoans with serious difficulty walking or climbing stairs. About ${thousands(d3.ambulatoryNear)} live within a half-mile walk of the ‘L’, and about ${hundreds(d3.ambulatoryNonAccessible)} of them near non-accessible stations only, ${hundreds(d3.ambulatoryNonAccessibleOver65)} of those aged 65 or older. These are estimates: tract counts spread over blocks by population.`,
    `Half a mile is about ten minutes at an average walking pace. At 0.8 m/s, slower than the 3 feet per second (0.9 m/s) that U.S. signal timing allows for slower pedestrians, ten minutes covers 480 m: ${pct(d3Slow.nearShare)} of Chicagoans live that close to a station, and ${pct(d3Slow.nearAccessibleShare)} that close to an accessible one.`,
  ],
  limits: [
    'The map measures the gap; it does not close it.',
    `It cannot see broken elevators, missing curb ramps or bad sidewalks, so ${pct(d3.nearAccessibleShare)} is a best case: an accessible station is accessible only while its elevators run.`,
    'It covers the ‘L’ only, not buses.',
  ],
  plan: [
    `Where the gap is points to the stations that would help the most people. CTA’s All Stations Accessibility Program (ASAP) aims to make every rail station vertically accessible by 2038. Phase One, fully funded at $423.5 million and due by 2027, includes Montrose, California and Racine on the Blue Line and State/Lake in the Loop. On this network it would bring the residents near non-accessible stations only from ${thousands(d3.nearNonAccessible)} to ${thousands(d3Sens['ASAP Phase One done'].nearNonAccessible)}.`,
    `Of the ten non-accessible stations whose walksheds hold the most such residents, ${list(d3Phase2.map((s) => s.short))} are in Phase Two, which CTA reports as 45% funded and projected for 2028. ${list(d3Unphased.map((s) => s.short))} are in neither of the first two phases; CTA has no funding yet for Phases Three and Four.`,
    `The City’s data still flags Austin (Green), reopened fully accessible in August 2026, as non-accessible. Counted as accessible, it would put ${hundreds(d3.nearNonAccessible - d3Sens['Austin (Green) as accessible'].nearNonAccessible)} more residents within a step-free walk of an accessible station.`,
  ],
};
d3Story.sections = [['Background', d3Story.background], ['Findings', d3Story.findings, true], ['Who lives in the gap', d3Story.gap], ['What the map cannot see', d3Story.limits], ['The plan', d3Story.plan]];

export const plates = {
  1: {
    file: 'day01-the-doors',
    render: (o) => renderDay01({ ...day01Data, finding: d1Finding, findings: d1Story.findings, boundary: cityBoundary.rings, sequences: lineSequences.lines, feedDate: lineSequences.feed_date }, o),
    subtitle: 'Which ‘L’ stations can a rider who cannot take the stairs use?',
    finding: d1Finding,
    story: d1Story,
    ledger: [
      ['Source', `CTA – List of 'L' Stops, Chicago Data Portal · ${day01Data.ledger.dataset_id} · pulled ${day01Data.ledger.pulled}`, day01Data.ledger.url],
      ['Units', day01Data.ledger.units],
      ['Method', 'Stops merged to stations; a station is vertically accessible only if every platform is flagged accessible.'],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S), so the lines south of it read 1200 S, 2000 S, 2800 S and so on.'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
      ['Order', `CTA GTFS schedule, feed of ${lineSequences.feed_date}; State/Lake, not scheduled, placed by position.`, 'https://www.transitchicago.com/developers/gtfs/'],
      ['Caveat', 'The ADA flag lags CTA’s own count (110 of 146 accessible, Aug 2026) and still marks Austin (Green), reopened accessible, as non-accessible.'],
      ['CTA', [
        ['ASAP', 'https://www.transitchicago.com/accessibility/asap/'],
        ['update, 31 Jul 2024', 'https://www.transitchicago.com/cta-releases-updated-all-stations-accessibility-program'],
        ['Austin reopens, 7 Aug 2026', 'https://www.transitchicago.com/ctas-austin-green-line-station-reopened-and-fully-accessible/'],
      ]],
    ],
    page: {
      chart: { title: 'Non-accessible stations by line', note: 'Route order from the outer terminal · Gap indicates a branch · Interchange stations count once per line', colorNote: ', marked in black' },
      inset: { title: 'Inset · The Loop and River North' },
    },
    csv: () =>
      csv([
        ['station_id', 'name', 'lines', 'step_free', 'lat', 'lon', 'x_address', 'y_address'],
        ...day01Data.stations.map((s) => [s.id, s.name, s.lines.join(' '), s.ada, s.lat, s.lon, s.x, s.y]),
      ]),
  },
  2: {
    file: 'day02-the-half-mile-promise',
    render: (o) => renderDay02({ ...day02Data, findings: d2Story.findings, boundary: cityBoundary.rings }, o),
    subtitle: 'Which bus routes carry the city, and how often does the bus come?',
    finding: day02Data.finding,
    story: d2Story,
    ledger: [
      ['Source', `CTA – Ridership – Bus Routes – Daily Totals by Route, Chicago Data Portal · ${day02Data.ledger.dataset_id} · pulled ${day02Data.ledger.pulled}`, day02Data.ledger.url],
      ['Units', `Average weekday riders per route, ${monthSpan(day02Data.window)}: weekday rides divided by weekdays. A route that runs part of the year is averaged over the whole year.`],
      ['Service', `CTA GTFS schedule, feed of ${day02Data.gtfs.feedDate}, on Wednesday ${day02Data.gtfs.refDay}: trips, bus-hours (first to last stop) and the midday interval, 300 minutes divided by the trips each way starting 10:00–15:00. ’L’ lines from the same feed.`, day02Data.gtfs.url],
      ['Method', 'One shape per route: the longest pattern carrying at least a quarter of its direction’s trips, plus the other direction where it runs on another street (one-way pairs, end loops). Routes on a shared street overlap, most frequent on top.'],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
      ['Caveat', `Riders are boardings on the whole route, not the load on any one street. Ridership runs to ${day02Data.window[1]}; service is a later schedule. ${d2NotDrawn.length} event and seasonal routes (${d2NotDrawn.map((r) => r.id).join(', ')}) count in the totals but do not run on the reference day and are not drawn. Coverage is straight-line distance, not a walk.`],
      ['CTA', [
        ['Frequent Network', 'https://www.transitchicago.com/frequent/'],
        ['launch, 2 Mar 2025', 'https://www.transitchicago.com/cta-launches-new-frequent-network-for-buses/'],
        ['20 routes, 17 Dec 2025', 'https://www.transitchicago.com/cta-ready-to-close-out-2025-with-full-frequent-network-and-expanded-service-on-additional-bus-routes/'],
        ['24 routes, 18 Aug 2026', 'https://www.transitchicago.com/cta-bolsters-frequent-network-with-four-additional-routes-by-end-of-2026/'],
        ['Better Streets for Buses', 'https://www.transitchicago.com/betterstreetsforbuses/'],
        ['target corridors, 27 Jun 2024', 'https://www.transitchicago.com/cta-and-cdot-announce-better-streets-for-buses-target-design-corridors/'],
        ['Michigan Avenue bus lane, 30 Sep 2026', 'https://www.transitchicago.com/mayor-brandon-johnson-cdot-to-install-dedicated-bus-lane-on-michigan-avenue-bringing-more-reliable-cta-bus-service-to-the-loop/'],
      ]],
    ],
    page: {
      chart: { title: 'Average weekday riders by route', note: `Ridership for the ${d2.halfRoutes} busiest routes, which carry half the riders · Outline shows ${day02Data.benchmarkYear} ridership · Shade shows midday frequency` },
      inset: { title: 'Inset · The Loop and Michigan Avenue' },
    },
    csv: () =>
      csv([
        ['route', 'name', 'rank', 'weekday_riders', `weekday_riders_${day02Data.benchmarkYear}`, 'trips', 'bus_hours', 'riders_per_bus_hour', 'midday_interval_min', 'tier', 'length_mi'],
        ...day02Data.routes.map((r) => [r.id, r.name, r.rank, r.riders, r.ridersBench ?? '', r.trips, r.vehHours, r.perHour, r.interval ?? '', r.tier, r.lengthMi]),
      ]),
  },
  3: {
    file: 'day03-the-accessible-city',
    render: (o) => renderDay03({ ...day03Data, findings: d3Story.findings, boundary: cityBoundary.rings }, o),
    subtitle: 'How much of Chicago is a short walk from a vertically accessible ‘L’ station?',
    finding: day03Data.finding,
    story: d3Story,
    ledger: [
      ['Source', `CTA – List of 'L' Stops, Chicago Data Portal · ${day03Data.ledger.dataset_id} · pulled ${day03Data.ledger.pulled}`, day03Data.ledger.url],
      ['Walk', `OpenStreetMap walk network, Geofabrik extract of ${day03Data.osm.extract}, filtered with OSMnx’s walk rules. A half mile is ${Math.round(day03Data.walkM)} m along the network. Step-free: the same network without its ${fmt(day03Data.network.stairs)} mapped stair segments and ${day03Data.network.wheelchairNo} ways tagged wheelchair=no; its ${day03Data.network.elevators} mapped elevators and all ramps are kept. © OpenStreetMap contributors (ODbL).`, day03Data.osm.url],
      ['People', `2020 Census, Redistricting Data (P.L. 94-171): ${fmt(d3.residents)} residents in ${fmt(day03Data.census.blocks)} blocks, each placed by the walk from its internal point. Ambulatory difficulty: ACS 2020–2024 5-year, table B18105, by tract, spread over blocks by population.`, 'https://www.census.gov/programs-surveys/decennial-census/about/rdo/summary-files.html'],
      ['Method', `Each station joins the network at its nearest walkway, and the walk to it counts. A station is vertically accessible as on Plate I: every platform flagged accessible (an elevator or ramp from the street). Walksheds are the reached streets widened by 40 m (about one lot depth), clipped to the city limits. The network reaches a mile past the city limits; ${day03Data.leftOut.length - 1} suburban stations beyond it are left out, as is O’Hare, whose station inside the terminal is about 1 km from the nearest mapped walkway. No one in Chicago lives within a half mile of any of them.`],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
      ['Caveat', 'The step-free walk is an upper bound: OSM records stairs, not every missing curb ramp or elevator outage. The ADA flag lags CTA’s own count (110 of 146 accessible, Aug 2026) and still marks Austin (Green) non-accessible. Ambulatory-difficulty counts are estimates with wide margins.'],
      ['CTA', [
        ['ASAP', 'https://www.transitchicago.com/accessibility/asap/'],
        ['Austin reopens, 7 Aug 2026', 'https://www.transitchicago.com/ctas-austin-green-line-station-reopened-and-fully-accessible/'],
      ]],
    ],
    page: {
      chart: { title: 'Residents near each line', note: D3_CHART_NOTE },
      inset: { title: `Inset · ${D3_INSET.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(' And ', ' and ')}` },
    },
    csv: () =>
      csv([
        ['station_id', 'name', 'lines', 'step_free', 'residents_nearest_half_mile', 'near_non_accessible_only', 'x_address', 'y_address'],
        ...day03Data.stations.map((s) => [s.id, s.name, s.lines.join(' '), s.ada, s.residents, s.nearNonAccessible, s.x, s.y]),
      ]),
  },
};
