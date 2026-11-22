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
//                              inset { title } (the page appends the inset's scale); without
//                              inset, the chart fills the middle column (Plate XIV)
// Story numbers are computed from each plate's data below, never typed, so the text cannot drift.
import cityBoundary from '../../reference/city-boundary.json';
import lineSequences from '../../reference/cta-line-sequences.json';
import day01Data from '../../days/day01-points/output/plate.json';
import { renderDay01 } from './day01.js';
import day02Data from '../../days/day02-lines/output/plate.json';
import { renderDay02, monthSpan, pct } from './day02.js';
import day03Data from '../../days/day03-polygons/output/plate.json';
import { renderDay03, CHART_NOTE as D3_CHART_NOTE, INSET_TITLE as D3_INSET } from './day03.js';
import day04Data from '../../days/day04-clusters/output/plate.json';
import { renderDay04, CHART_NOTE as D4_CHART_NOTE, INSET_TITLE as D4_INSET } from './day04.js';
import day05Data from '../../days/day05-sight/output/plate.json';
import { renderDay05, CHART_TITLE as D5_CHART_TITLE, CHART_NOTE as D5_CHART_NOTE, INSET_TITLE as D5_INSET } from './day05.js';
import day06Data from '../../days/day06-vintage/output/plate.json';
import { renderDay06, CHART_TITLE as D6_CHART_TITLE, CHART_NOTE as D6_CHART_NOTE, INSET_TITLE as D6_INSET } from './day06.js';
import day07Data from '../../days/day07-10min/output/plate.json';
import day08Data from '../../days/day08-utopia/output/plate.json';
import { renderDay08, CHART_NOTE as D8_CHART_NOTE, chartTitle as d8ChartTitle, insetTitle as d8InsetTitle } from './day08.js';
import day09Data from '../../days/day09-urban-rural/output/plate.json';
import { renderDay09, CHART_TITLE as D9_CHART_TITLE, CHART_NOTE as D9_CHART_NOTE, INSET_TITLE as D9_INSET, dayLong as d9Day } from './day09.js';
import day10Data from '../../days/day10-prompting/output/plate.json';
import { renderDay10, CHART_TITLE as D10_CHART_TITLE, CHART_NOTE as D10_CHART_NOTE, COLOR_NOTE as D10_COLOR_NOTE, dayLong as d10Day } from './day10.js';
import day11Data from '../../days/day11-sound/output/plate.json';
import { renderDay11, CHART_TITLE as D11_CHART_TITLE, CHART_NOTE as D11_CHART_NOTE, INSET_TITLE as D11_INSET } from './day11.js';
import day12Data from '../../days/day12-power/output/plate.json';
import { renderDay12, CHART_TITLE as D12_CHART_TITLE, CHART_NOTE as D12_CHART_NOTE, INSET_TITLE as D12_INSET } from './day12.js';
import day13Data from '../../days/day13-interactions/output/plate.json';
import { renderDay13, CHART_TITLE as D13_CHART_TITLE, INSET_TITLE as D13_INSET, hourName as d13Hour, hundreds as d13Hundreds, INSET_BANDS as D13_INSET_BANDS } from './day13.js';
import day14Data from '../../days/day14-borgesian/output/plate.json';
import { renderDay14, CHART_TITLE as D14_CHART_TITLE } from './day14.js';
import day15Data from '../../days/day15-inside-out/output/plate.json';
import { renderDay15, CHART_TITLE as D15_CHART_TITLE, CHART_NOTE as D15_CHART_NOTE, dayLong as d15Day } from './day15.js';
import day16Data from '../../days/day16-collaborative/output/plate.json';
import { renderDay16, CHART_TITLE as D16_CHART_TITLE, CHART_NOTE as D16_CHART_NOTE, blockPlace as d16Place, windowText as d16Window, reportClasses as d16Classes, MONTH_LONG as D16_MONTHS } from './day16.js';
import { renderDay07, CHART_NOTE as D7_CHART_NOTE, chartTitle as d7ChartTitle, insetTitle as d7InsetTitle, clock as d7Clock, dayLong as d7Day, hundreds as d7Hundreds, sortOutages as d7Sort } from './day07.js';

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

// Every number below is computed from the plotted data (days/day04-clusters/output/plate.json); CDOT
// statements are from its Chicago Traffic Crashes Annual Report (Fall 2025), linked in the ledger.
const CDOT_REPORT = day04Data.sources.report;
const d4 = day04Data.summary;
const d4Top = day04Data.clusters.slice(0, 10);
const d4Place = (c) => `${c.name} in ${c.community}`;
const d4Off = d4Top.filter((c) => !c.onHin).map(d4Place);
const d4First = day04Data.clusters[0];
const words = (n) => (n < 10 ? ['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][n] : String(n));
const titleCase = (str) => str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const d4Story = {
  background: [
    'Every bus or train trip starts and ends on foot. This map shows where that walk, or a ride on a bike, ended in a death or a serious injury on a Chicago street from 2021 to 2025, and where those places bunch together.',
    `The map is drawn in miles from State & Madison, one square per mile, with no basemap. Each dot is one person: large dots were killed, small dots seriously injured. The dark bands with a pencil edge are clusters: places where the dots are packed much closer together than around them, drawn along the streets that join them. A cluster is kept only if it still shows up when the analysis is rerun on random samples of the data. The pale bands are the City’s High Injury Network, about 100 miles of major streets. Hover a cluster, or a row of the chart, for its numbers.`,
  ],
  findings: [
    `Of the ${fmt(d4.killed)} people who died, ${d4.walkKilled} were walking and ${d4.bikeKilled} were on a bike.`,
    `The largest cluster, along ${titleCase(D4_INSET).replace(', ', ' in ')}, holds ${d4First.people} people; ${d4First.killed} of them were killed.`,
    `${words(d4.top10OnHin)} of the ten largest clusters lie on the City’s High Injury Network. ${list(d4Off)} do not.`,
    `${share(d4.walkNearStop).replace(/^./, (c) => c.toUpperCase())} of the people hurt while walking were within 100 feet of a CTA bus stop. Only ${pct(d4.streetNearStop)} of the city’s streets are that close to one.`,
  ],
  how: [
    `${share(d4.night).replace(/^./, (c) => c.toUpperCase())} were hurt after dark. For ${pct(d4.hitRun)}, the driver who hit them drove away.`,
    `Of the people hurt while walking, ${pct(d4.walk65)} were 65 or older. CDOT reports that Chicagoans over 70 are killed or seriously hurt while walking at the highest rate of any age group.`,
    'CDOT’s review of 2024 found that 38% of the people killed while walking were struck in a crosswalk, and 44% were hit less than a mile from home.',
  ],
  limits: [
    'The map counts people; it does not measure risk. The City has no street-by-street counts of people walking or biking, so a busy street can hold many dots and still be safer per trip than a quiet one.',
    'It shows only crashes reported to the Chicago Police on city streets, not on expressways.',
    `Police set the injury at the scene, and the record is not always updated. ${d4.deathsCodedSerious} of the deaths here are still recorded as serious injuries, so the map takes deaths from CDOT’s reviewed Vision Zero list instead.`,
  ],
  plan: [
    'In 2025 CDOT named a High Injury Network: the 100 miles of major streets with the highest crash scores from 2022 to 2024, with more weight on deaths, serious injuries and people walking or biking. CDOT will use it to guide which projects it chooses and how they are designed.',
    `The network is 10% of the city’s major street miles. Of the people on this map who were hurt on a major street, ${pct(d4.onHinOfMajor)} were on the network. CDOT notes that 44% of its miles are state roads, run by IDOT.`,
    'CDOT’s toolbox includes bus boarding islands, curb bump-outs, pedestrian refuge islands, raised crosswalks and left-turn traffic calming. In Austin, Garfield Park and North Lawndale, where CDOT has added safety improvements since its 2019 West Side Vision Zero plan, the number of people killed or seriously hurt fell 39% from 2021 to 2024, more than twice the citywide drop of 18.5%.',
  ],
};
d4Story.sections = [['Background', d4Story.background], ['Findings', d4Story.findings, true], ['When and how', d4Story.how], ['What the map cannot see', d4Story.limits], ['The plan', d4Story.plan]];

// Every number below is computed from the plotted data (days/day05-sight/output/plate.json). Court
// terms are from the Remedial Plan Order (Dkt. 365, 29 May 2025); counts of APS and of signalized
// intersections from CDOT's June 2026 Semi-Annual Report and ChicagoAPS.org; compliance from the
// court monitor's Plan Year 1 report. All are linked in the ledger.
const d5 = day05Data.summary;
const d5Src = day05Data.sources;
const d5Date = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const d5Thousands = (n) => fmt(Math.round(n / 1000) * 1000);
const d5Mile = (m) => {
  const mi = m / 1609.344;
  return Math.abs(mi - 1) < 0.05 ? 'about a mile' : Math.abs(mi - 0.5) < 0.05 ? 'about half a mile' : `${mi.toFixed(1)} miles`;
};
const d5Min = d5.order.minimums;
const d5Story = {
  background: [
    'A walk sign only helps if you can see it. An accessible pedestrian signal (APS) also tells you when to cross out loud, and with an arrow on the push button that vibrates. A person who is blind or has low vision can then cross with the walk sign, not by guessing.',
    'In 2023 a federal court ruled that Chicago’s lack of these signals breaks the Americans with Disabilities Act. In 2025 it ordered the City to add them across the city.',
    `The map is drawn in miles from State & Madison, one square per mile, with no basemap. Each small dot is a signalized crossing where you must see the walk sign; a large dot has an APS. The pale squares are ‘L’ stations, filled where the station is vertically accessible. One block is the court order’s 1/8 mile, walked. Hover a large dot or a station for its details, or a row of the chart to show only that line.`,
  ],
  findings: [
    `At ${fmt(d5.seenOnly)} of the ${fmt(d5.signals)} signalized crossings mapped here, you must see the signal to know when to walk. The City lists ${d5.listedNow} crossings with an APS, about ${pct(d5.listedNow / d5.cdot.signals)} of its ${fmt(d5.cdot.signals)}.`,
    `Of the ${d5.stations} ‘L’ stations in the city, ${d5.stationsAps} have a crossing with an APS within one block. ${d5.accessibleSeenOnly} of the ${d5.accessible} vertically accessible stations do not: the elevator reaches the platform, but at the corner you must see the signal.`,
    `About ${d5Thousands(d5.vision)} Chicagoans have a vision difficulty. ${pct(d5.visionFarShare)} of them live more than a block’s walk from a crossing with an APS. Half live ${d5Mile(d5.visionMedianM)} or more from one.`,
    `The court put crossings within one block of transit first. There are ${fmt(d5.priority)} of them here, and ${pct(d5.priorityAps / d5.priority)} have an APS. Elsewhere, ${pct(d5.otherAps / d5.other)} do.`,
  ],
  why: [
    'Without an APS, a person who cannot see the signal listens for the traffic beside them to start moving, and crosses with it. That works at a busy, simple corner. It fails where traffic is light, where the walk sign comes on a few seconds before the cars move, and where every car stops at once so people can cross in all directions.',
    'The court’s order names those places. The City must first add APS where all traffic stops for people on foot, at mid-block crossings, at T-shaped corners and where three or more streets meet.',
  ],
  limits: [
    `An APS that is installed is not always one that works as it should. The court’s monitor inspected ${d5.monitor.inspected} of them in the first year and found none in full compliance with the national standard for traffic signals; many had problems with where the button was, how it sounded or how it was kept up.`,
    `The City has no open list of its signals, so the map takes them from OpenStreetMap: ${fmt(d5.signals)}, against CDOT’s count of ${fmt(d5.cdot.signals)}.`,
    'The map does not show where the push button stands, whether the curb ramp lines up with the crosswalk, or how a station’s entrance meets the street. One block is measured from the station’s mapped point, so stations in an expressway median can show no crossing within a block.',
    'The number of people with a vision difficulty is a Census survey estimate, spread over blocks by population.',
  ],
  plan: [
    `The court’s order of ${d5Date(d5.order.entered)} requires APS at about ${pct(d5.order.phase1)} of signalized crossings with walk signals by the end of ${d5.order.phase1By}, and at all of them by the end of ${d5.order.allBy}. The yearly minimum rises from ${d5Min[0]} crossings in the first year to ${d5Min.at(-1)} in the last three.`,
    `In the first year the City added ${d5.cdot.year1}, ${d5.cdot.year1 - d5Min[0]} more than required. At that pace, reaching ${pct(d5.order.phase1)} would take about ${Math.round(d5.yearsAtYear1Pace)} years; the order requires the pace to reach about ${Math.round(d5Min.at(-1) / d5.cdot.year1)} times as many a year.`,
    'Anyone can ask for an APS at a crossing on ChicagoAPS.org. The City must answer within six months, and install it within a year where it can.',
  ],
};
d5Story.sections = [['Background', d5Story.background], ['Findings', d5Story.findings, true], ['Why it matters', d5Story.why], ['What the map cannot see', d5Story.limits], ['The plan', d5Story.plan]];

// Every number below is computed from the plotted data (days/day06-vintage/output/plate.json). CTA
// statements (accessible buses; the 1947 takeover and the last streetcar; the CSL's "a number of bus
// lines") are from the CTA pages linked in the ledger; the CSL's 1914 founding from WBEZ, also linked.
const d6 = day06Data.summary;
const d6Ring = (from) => day06Data.rings.find((r) => r.from === from);
const d6Far = day06Data.rings.filter((r) => r.from >= 10);
const d6FarShare = d6Far.reduce((n, r) => n + r.both, 0) / d6Far.reduce((n, r) => n + r.both + r.new, 0);
const d6Names = (rows, n) => list(rows.slice(0, n).map((r) => r.name));
const d6Qa = day06Data.qaRight;
const d6Story = {
  background: [
    'The Chicago Surface Lines (CSL) ran the city’s streetcars, and a number of bus lines, from 1914, when the street railways merged into one company, until 1 October 1947, when the new Chicago Transit Authority (CTA) took it over. The last streetcar ran on 21 June 1958.',
    'In 1929 the CSL printed a system map of its network, in red over the street grid. That map, now in the public domain, is the source here: 1929 is the date of the map, not of the network. This plate lays it over today’s CTA bus routes, street by street.',
    'The map is drawn in miles from State & Madison, one square per mile, with no basemap. The wide band is the CSL network as its 1929 map shows it; the thin line is a CTA bus today. Where the line runs in the band, the route stayed. A band alone is a CSL line with no CTA bus today; a line alone is a CTA bus on a street the map shows no CSL line on. Hover a street for its name, or a bar of the charts to show only that kind of street.',
  ],
  findings: [
    `${pct(d6.stillServed)} of the street-miles of the CSL network on its 1929 map still carry a CTA bus.`,
    `${pct(d6.onA1929Line)} of CTA bus street-miles today run on a CSL line. Most of the rest fill in between the CSL lines: only ${pct(d6.beyondShare)} lie more than half a mile from one.`,
    `The overlap is closest to the Loop and fades with distance: ${pct(d6Ring(2).onA1929Line)} of CTA bus miles between 2 and 4 miles from State & Madison run on a CSL line, and ${pct(d6FarShare)} beyond 10 miles.`,
    `The longest CTA bus streets with no CSL line include ${d6Names(day06Data.topNew, 5)}. The longest CSL lines with no CTA bus today include ${d6Names(day06Data.topOld, 3)}.`,
  ],
  ride: [
    'The CSL map shows where a rider could go; it says nothing about who could get on. CTA’s entire bus fleet has been accessible to people with disabilities since 2005, with a ramp at the front door of every bus.',
    'Where the route stayed, the same street now has a bus with a ramp.',
  ],
  limits: [
    `The 1929 map is the CSL’s own system map, drawn for riders, not an engineering plan, and it shows the network in that one year. It was read off the scan street by street; a check by eye of 80 random streets found ${d6Qa.only1929} of ${d6Qa.of} “CSL only” and ${d6Qa.todayOnly} of ${d6Qa.of} “CTA only” streets right. Where a line was drawn a little off its street, the next street can take it.`,
    `The plate counts streets, not service: a bus every 8 minutes and one every 30 count the same. ${Math.round(d6.offSheetMiles)} miles of city streets around O’Hare lie off the 1929 map and are left out.`,
  ],
};
d6Story.sections = [['Background', d6Story.background], ['Findings', d6Story.findings, true], ['The ride, then and now', d6Story.ride], ['What the map cannot see', d6Story.limits]];

// Day 07: every number and name below comes from the moment of the pull (plate.json), so the text
// holds for whatever the ten-minute run finds. CTA statements: ASAP page and the 2024 update (as Plate I).
const d7 = day07Data.summary;
const d7Run = day07Data.run;
const d7At = `${d7Clock(d7Run.pulledAt)} on ${d7Day(d7Run.pulledAt)}`;
const d7Out = d7Sort(day07Data.outages);
const d7Cut = d7Out.filter((o) => o.scope === 'station');
const d7Part = d7Out.filter((o) => o.scope === 'platform');
const d7Word = (n) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n);
const d7Oldest = [...day07Data.outages].sort((a, b) => b.ageHours - a.ageHours)[0];
const d7Today = day07Data.outages.filter((o) => o.start.slice(0, 10) === d7Run.pulledAt.slice(0, 10)).length;
const d7Story = {
  background: [
    'CTA counts a station as accessible when an elevator or ramp reaches every platform from the street (Plate I). That holds only while the elevators run. When one stops, CTA posts a customer alert that names the station and, in words, the elevator: the street elevator, or the platform it serves.',
    `This plate is the challenge’s ten-minute map. Everything that does not change by the minute was prepared beforehand: the map template, the platforms of every station, the step-free walk network and Plate III’s walksheds. The ten minutes held one pull of CTA’s alerts, at ${d7At}, the analysis and the map. It shows that moment only.`,
    'A full ring marks an accessible station with no working elevator to any train; a half ring, one with a platform out. Hover a station or a row for the elevator, how long it has been out and the residents it affects.',
  ],
  findings: [
    day07Data.finding,
    d7Cut.length
      ? `${d7Word(d7Cut.length)[0].toUpperCase() + d7Word(d7Cut.length).slice(1)} ${d7Cut.length === 1 ? 'station' : 'stations'} had no step-free way to any train: ${list(d7Cut.map((o) => o.short))}. Around them, about ${d7Hundreds(d7.lost)} residents lost the step-free half-mile walk to the ‘L’ that Plate III counts${d7Cut.filter((o) => o.inCity).length > 1 ? ` (${list(d7Cut.filter((o) => o.inCity).map((o) => `${o.short} about ${d7Hundreds(o.lost)}`))})` : ''}. About ${d7Hundreds(d7.lostAmbulatory)} of them have difficulty walking, by the Census estimate.`
      : 'No station had lost every step-free way to a train.',
    d7Part.length
      ? `At ${list(d7Part.map((o) => o.short))}, one platform was out, so a rider could go step-free in one direction only.${d7.oneDirection ? ` For about ${d7Hundreds(d7.oneDirection)} residents that station was the only accessible one within a step-free half mile.` : ''}`
      : '',
    `The oldest outage, at ${d7Oldest.short}, began on ${d7Day(d7Oldest.start)}, ${Math.round(d7Oldest.ageHours / 24)} days before the pull. ${d7Word(d7Today)[0].toUpperCase() + d7Word(d7Today).slice(1)} of the ${d7Word(d7.elevators)} elevators had gone out that same day.`,
  ].filter(Boolean),
  plan: [
    'ASAP, CTA’s All Stations Accessibility Program, aims to make every rail station vertically accessible by 2038. Its 2024 update includes rehabilitating or replacing all 162 existing station elevators.',
    ...(day07Data.outages.some((o) => o.estimatedReturn)
      ? [`CTA gave an estimated return for ${list(day07Data.outages.filter((o) => o.estimatedReturn).map((o) => `${o.short} (${d7Day(o.estimatedReturn + 'T12:00')}${o.reason ? `, ${o.reason}` : ''})`))}. For the others, its alerts said crews were assessing the repair time.`]
      : []),
  ],
};

// Day 08: every number below comes from days/day08-utopia/output/plate.json. CTA statements: the ASAP
// page, the 2024 Strategic Plan (Table 5), the Austin and Racine releases and the RLE FAQ (ledger).
const d8 = day08Data.summary;
const d8Step = new Map(day08Data.steps.map((s) => [s.key, s]));
const d8Dated = ['P1', 'P2f', 'RLE'].map((k) => d8Step.get(k));
const d8Undated = day08Data.stations.filter((s) => ['P2u', 'P3', 'P4', 'RPM'].includes(s.phase));
const d8Rle = day08Data.stations.filter((s) => s.phase === 'RLE');
const d8Top = [...day08Data.stations].filter((s) => s.phase !== 'today' && s.inCity).sort((a, b) => b.gain - a.gain).slice(0, 5);
const d8Name = (s) => `${s.short} (${s.lines.join('/')})`;
const d8Story = {
  background: [
    `In 2018 CTA set out to make every ‘L’ station vertically accessible by 2038: an elevator or ramp from the street to every platform. Today 110 of its 146 are, by CTA’s count of August 2026, and the Red Line is being extended four stations south to 130th Street, all of them accessible, to open in 2030. This plate draws the city that promise describes.`,
    `It starts from Plate III’s step-free half-mile walk to an accessible station and makes the remaining stations accessible in the order of CTA’s plan, rerunning the walk after each step. The walk becomes land: solid where it exists today, stippled where a step is funded and dated, hatched where it is promised without a date or without money. The rest of the city is sea, with a line for every eighth of a mile farther to walk.`,
    'The map is drawn in miles from State & Madison, one square per mile. Hover a station for its phase and the residents it adds, or a step in the chart to show its stations.',
  ],
  findings: [
    day08Data.finding,
    `The dated steps, Phase One in 2027, the funded half of Phase Two in 2028 and the Red Line Extension in 2030, add about ${thousands(d8.datedGain)} residents. The other ${thousands(d8.noDateGain)} depend on ${d8Undated.length} stations with no date or no money: three in Phase Two, all of Phases Three and Four, and ten Red and Purple stations on the far North Side and in Evanston.`,
    `The stations that would add the most residents are ${d8Top.slice(0, -1).map((s) => `${d8Name(s)}, about ${hundreds(s.gain)}`).join('; ')}; and ${d8Name(d8Top.at(-1))}, about ${hundreds(d8Top.at(-1).gain)}. The largest area with no date lies along the Blue Line subway, with about ${hundreds(day08Data.inset.residents)} residents.`,
    `The Red Line Extension adds about ${hundreds(d8.rleGain)} residents within a step-free half mile of its four stations. CTA plans bus connections and a park and ride at each of them.`,
    `Accessible doors do not shorten the walk. In 2038, ${pct(d8.beyondShare)} of Chicagoans would still live more than a half-mile step-free walk from a station, and ${pct(1 - d8.withinMileShare)} more than a mile.`,
  ],
  promise: [
    'CTA’s All Stations Accessibility Program (ASAP) counted 42 non-accessible stations in its 2024 update and put the cost at $4.9 billion. Its Table 5 assigns each to a phase. Since then Racine (Blue) reopened accessible in October 2025 and Austin (Green) in August 2026, leaving 36.',
    'Phase One is fully funded at $423.5 million and due by 2027: Montrose and California on the Blue Line, and State/Lake, closed since January 2026 for a rebuild led by the Chicago Department of Transportation and scheduled to reopen in 2029, so the plate dates it 2029. Phase Two is projected for 2028 and 45% funded: Irving Park, Belmont and Pulaski on the Blue Line and Oak Park and Ridgeland on the Green Line are funded; Cicero, Austin (Blue) and North/Clybourn are not.',
    'Phases Three and Four have no money and no date: the Blue Line subway from Division to LaSalle, the rest of the Forest Park branch, Damen on the O’Hare branch, Monroe and Harrison on the Red Line, and Adams/Wabash and LaSalle/Van Buren on the Loop. Ten Red and Purple stations wait for a future phase of the Red and Purple Modernization program. CTA calls funding the biggest impediment to a fully accessible system.',
  ],
  limits: [
    `The city of 2038 is drawn with the people of 2020 and today’s sidewalks. OpenStreetMap does not record every missing curb ramp or broken sidewalk, so the step-free walk is an upper bound. The new stations sit where the extension’s mapped alignment crosses their streets; the entrances may differ by a block.`,
    'The order of the undated steps is CTA’s table order. It changes how the gain is split between steps, not the total. Elevators break: Plate VII shows what one afternoon of outages takes away.',
  ],
};
d8Story.sections = [['Background', d8Story.background], ['Findings', d8Story.findings, true], ['The promise, dated', d8Story.promise], ['What the map cannot see', d8Story.limits]];

// Every number below is computed from the plotted data (days/day09-urban-rural/output/plate.json).
const d10 = day10Data.summary;
const d10Addr = (m) => (m >= 0 ? m * 800 : m >= -1 ? m * 1200 : -1200 + (m + 1) * 800);
const d10Walk = Math.round(day10Data.walkM / (day10Data.speedFtS * 0.3048) / 60);
const d10Side = (f) => day10Data.sides.reduce((a, b) => (f(b.over15, a.over15) ? b : a));
const d10Hi = d10Side((a, b) => a > b), d10Lo = d10Side((a, b) => a < b);
const d10Far = day10Data.sides.filter((s) => s.side.startsWith('Far')).map((s) => s.over15);
const d10Story = {
  sections: [
    ['Background', [
      'The theme for Day 10 asks for a map made from start to finish in a chat window or on the command line. This one was. The data, the analysis and the plate all came out of one command-line session with an AI assistant, and the prompts are published with the notebook.',
      'The look comes from the command line’s ancestor. In 1963, at a training session at Northwestern University in Evanston, Howard Fisher saw some of the first maps drawn by computer and set out to make better ones. With the programmer Betty Benson he built SYMAP, which printed maps on a line printer. Each character filled one cell, and darker places were struck two or four times, one character over another. Fisher took the work to Harvard, where he founded the Laboratory for Computer Graphics in 1965.',
      `Here each character is one city block, an eighth of a mile on Chicago’s address grid, so eight characters make a mile. Each block prints the minutes until a rider who cannot take the stairs is moving at 9 p.m. on a weekday. That is the step-free walk to the best bus, or to a train at an accessible station, within four blocks, plus the wait for it.`,
    ]],
    ['Findings', [
      day10Data.finding,
      `About ${thousands(d10.over15)} residents need more than 15 minutes, about ${thousands(d10.over15Amb)} of them with a difficulty walking. About ${thousands(d10.none)} have no bus or accessible train within four blocks at all.`,
      `At this hour the bus carries the city. A train at an accessible station is the quickest ride for only ${pct(d10.trainBest / d10.residents)} of residents. The pale lines on the map are the bus streets, most of them half a mile apart. The blocks between them print darker, because four blocks at 3 feet a second take about ${d10Walk} minutes.`,
      `The wait grows toward the edges of the city. On the three Far sides, ${pct(Math.min(...d10Far))} to ${pct(Math.max(...d10Far))} of residents need more than 15 minutes. On the ${d10Lo.side}, near the center, it is ${pct(d10Lo.over15)}.`,
    ], true],
    ['How the minutes are counted', [
      `The schedule is CTA’s for ${d10Day(day10Data.serviceDay)}, the challenge’s Day 10, with departures between 8:30 and 9:30 p.m. Every CTA bus route counts, and trains count only at accessible stations.`,
      'The walk follows the street and sidewalk network in OpenStreetMap with stairs taken out, from the center of each block to the nearest stop of each route. It is timed at 3 feet a second, the speed the federal traffic manual uses to time a whole crossing at a signal. Its usual walking speed is 3.5 feet a second.',
      'The wait is half the time between buses or trains at that stop, for a rider who arrives without checking the schedule. Each block keeps the route with the least walk plus wait.',
    ]],
    ['What the map cannot see', [
      'These are scheduled times, not real arrivals. A bus that never comes still counts.',
      'Every CTA bus is accessible, but the stop itself is not checked: a missing curb ramp, a snowbank or a broken sidewalk can still stop a rider.',
      'Three feet a second is a planning number. Many wheelchair users move faster, and many people with walkers or canes move slower.',
      'The wait counts one direction, at the nearest stop of each route. A rider headed the other way may wait longer.',
      'Where OpenStreetMap is missing a step-free link, a block near a stop can print as if nothing were within reach.',
    ]],
  ],
};
d10Story.findings = d10Story.sections[1][1];

// Day 11: every number below comes from days/day11-sound/output/plate.json. External facts: the BTS
// documentation (model), the CDA Midway report (monitors), EPA's 1974 levels document (70 dB), FAA
// Part 150 and HUD 24 CFR 51 (65 dB DNL), chicago-l.org (Orange Line on freight rights-of-way) and
// Phan & Jones 2017 (inside the train).
const d11 = day11Data.summary;
const d11St = day11Data.stations;
const d11Top = [...d11St].sort((a, b) => b.db - a.db);
const d11Find = (short, line) => d11St.find((s) => s.short === short && s.lines.includes(line));
const d11Mon = [...day11Data.monitors].filter((m) => m.measured != null).sort((a, b) => b.measured - a.measured)[0];
const d11Db = (v) => `${Math.round(v)} dB`;
const d11LoudNot = d11Top.filter((s) => s.db >= 65 && !s.ada);
const d11List = (a) => `${a.slice(0, -1).join(', ')} and ${a.at(-1)}`;
const d11Story = {
  sections: [
    ['Background', [
      'Every ‘L’ platform and bus stop sits somewhere in the noise the city’s own systems make: expressway traffic, the ‘L’, freight trains, aircraft. A rider waiting there cannot move away from it. Plate V counted the crossings with an audible signal for riders who cannot see the walk sign; this plate maps the noise such sounds have to be heard over.',
      'The noise is a model, not a recording. The Bureau of Transportation Statistics’ National Transportation Noise Map estimates the average sound over a whole day from traffic counts on roads, rail timetables (the ‘L’ included) and flights, on squares 30 meters wide. Sound is measured in decibels: every 10 more is ten times the sound energy.',
      'Each dot is one city block, an eighth of a mile, and its area grows with the decibels above 45. Each station gets a ring for every 5 dB above 50 at its loudest platform; a filled center means the station is accessible. Hover a station for its level and loudest source, or a line in the chart to show only its stations.',
    ]],
    ['Findings', [
      day11Data.finding,
      `The two loudest stations are ${d11Top[0].short} (${d11Db(d11Top[0].db)}) and ${d11Top[1].short} (${d11Db(d11Top[1].db)}) on the Orange Line, which runs mostly along freight railroad rights-of-way. Next come the South Side Green Line and the Red Line in the Dan Ryan. ${d11.stationsEpa} stations reach 70 dB or more.`,
      `${d11.stationsLoudAccessible} of the ${d11.stationsLoud} are accessible, about the same share as across the city (${d11.stationsAccessible} of ${d11.stations}). The ${d11LoudNot.length} that are not are all on the Blue Line, in expressway medians: ${d11List(d11LoudNot.map((s) => s.short))}.`,
      `Away from the ‘L’ the city is quieter. ${fmt(d11.busLoud)} of ${fmt(d11.bus)} CTA bus stops (${pct(d11.busLoudShare, 1)}) and about ${thousands(d11.residentsLoud)} residents (${pct(d11.residentsBands['65'], 1)}) sit at 65 dB or more. For most of those residents, trains are the loudest source.`,
    ], true],
    ['How loud is loud', [
      'Federal rules draw a line at 65 dB. The FAA treats homes as compatible with aircraft noise below 65 dB, and HUD calls sites above 65 dB “normally unacceptable” for new housing. Both use the day-night average, which adds 10 dB to sound at night; the plate’s 24-hour average does not, so 65 here is the gentler test.',
      `In 1974 the EPA named 70 dB, averaged over a day, as the level that protects hearing over a lifetime. ${d11.stationsEpa} stations reach it. That describes the place across a whole day, not a rider’s few minutes on the platform.`,
    ]],
    ['Checking the model', [
      `Around Midway the Chicago Department of Aviation measures aircraft noise at 13 monitors. Over the 12 months to December 2025 the model sat between ${Math.abs(d11.monitorDiffRange[0])} dB below and ${d11.monitorDiffRange[1]} dB above the measured levels at the 12 that reported. The measurement is a day-night average, which adds 10 dB at night, so the model should read a little lower.`,
      `The loudest monitor, ${d11Mon.address.replace(' 1/2', '')}, measured ${d11Mon.measured.toFixed(1)} dB from aircraft alone. The model gives ${d11Mon.modelled.toFixed(1)}.`,
    ]],
    ['What the map cannot hear', [
      `Underground. The model has no tunnels, so subway platforms read quiet: Logan Square ${d11Db(d11Find('Logan Square', 'Blue').db)}, Belmont on the Blue Line ${d11Db(d11Find('Belmont', 'Blue').db)}. Inside the train it is the reverse: a 2017 study from the University of Illinois Chicago found the Blue Line toward O’Hare the loudest branch, and its loudest stretch in the tunnel between Chicago and Grand, at 88.9 dB inside the car.`,
      'Walls and buildings. The model lets sound travel as if nothing stood in the way, so streets lined with buildings read louder than they are, and the far side of a wall reads too loud.',
      'Small streets and the bus itself. Roads without traffic counts are left out, as is anything below 45 dB. The bus a rider is waiting for, sirens and construction are not in the model; freight and commuter train horns are.',
      `An average day. Each station reads the median within ${day11Data.thresholds.radiusM} m of its loudest platform, because the model puts the listener on the track or the roadway itself. When a train pulls in, the platform is far louder than any average.`,
    ]],
  ],
};
d11Story.findings = d11Story.sections[1][1];

// Day 12: every number below comes from days/day12-power/output/plate.json. External facts: the
// Shared Cost Sidewalk Program overview for 2026 (CDOT, as posted by the 19th Ward), the Inspector
// General's 2017 audit of the menu program, and Disability Rights Advocates on Lane v. City of Chicago.
const d12 = day12Data.summary;
const d12W = new Map(day12Data.wards.map((w) => [w.ward, w]));
const d12List = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a.at(-1)}` : String(a[0]));
const d12M = (v) => `$${(v / 1e6).toFixed(v >= 1e8 ? 0 : 2).replace(/0$/, '')} million`;
const d12Ord = (n) => ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'][n - 1] ?? `${n}th`;
const d12Num = (n) => ['none', 'one', 'two', 'three', 'four', 'five'][n] ?? String(n);
const d12LowPop = d12.low.reduce((a, w) => a + d12W.get(w).pop, 0) / d12.residents;
const d12Pulled = new Date(`${day12Data.pulled311}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const d12Story = {
  sections: [
    ['Background', [
      `The CTA runs the trains and the buses. The block between a rider’s front door and the stop belongs to the city, and in Chicago much of what gets fixed on it is chosen ward by ward. Each of the 50 aldermen gets the same sum of “menu” money every year (${d12M(d12.alloc['2019'])} in 2019, ${d12M(d12.alloc['2021'])} from 2021) and picks which streets, alleys, lights and sidewalks in the ward it pays for.`,
      `This plate maps those choices from ${d12.years[0]} to ${d12.years[1]}, the last four full years on one ward map. Each ward is shaded by the share of its menu money that went to sidewalks and crossings.`,
      'Residents have two other ways to get a sidewalk fixed: a 311 request for an inspection, or an application to the Shared Cost Sidewalk Program, in which the owner pays part of the repair. The Complaint and Wallet chart plots the two against each other, each ward a dot. Wards and Choices shows the ten wards at each end; every ward is on the map, with its numbers in the tooltip. Hover a ward on the map, a row or a dot for its numbers; the same ward lights up in all three.',
    ]],
    ['Findings', [
      day12Data.finding,
      `Streets and alleys took ${pct(d12.byCat.streets / d12.menu)} of the ${d12M(d12.menu)} spent through the menu in those four years; sidewalks and crossings took ${pct(d12.walkShare)}. Wards ${d12List(d12.zeroWards)} put less than 1% into them.`,
      `Those ${d12Num(d12.low.length)} wards rank ${d12List(d12.lowRank.filed.map(d12Ord))} in 311 sidewalk requests per resident, and ${d12List(d12.lowRank.shared.map(d12Ord))} in shared-cost applications. With ${pct(d12LowPop)} of the city’s residents, they sent ${pct(d12.lowSharedShare)} of the applications.`,
      `Requests and applications rise and fall together (a rank correlation of ${d12.corr.filed_shared.toFixed(2)} across the wards). Both are highest on the Northwest Side and the far South and Southwest Sides, and lowest along the north lakefront, on the inner South Side and on the West Side.`,
      `The alderman’s choice follows neither. The share spent on sidewalks has almost no relation to how many residents have a difficulty walking (rank correlation ${d12.corr.share_amb.toFixed(2)}) or to how many file requests (${d12.corr.share_filed.toFixed(2)}).`,
      `On ${d12Pulled}, ${fmt(d12.open)} sidewalk requests were still open, ${fmt(d12.open3)} of them for three years or more. Of the requests filed from ${d12.years[0]} to ${d12.years[1]} that have been closed, half took ${fmt(d12.closeDays[0])} days or less in Ward ${d12.closeWards[0]}, and ${fmt(d12.closeDays[2])} days or more in Ward ${d12.closeWards[1]}.`,
    ], true],
    ['Three kinds of power', [
      'The alderman’s. Menu money is the same for every ward, whatever its size or the state of its streets. In 2017 the city’s Inspector General found that the sum is set without regard to what each ward needs, and that, with needs priced at 2015 costs, it left the city’s residential streets, alleys and sidewalks about $228.8 million a year short.',
      'The complaint. Anyone can ask 311 for a sidewalk inspection. In Lane v. City of Chicago, filed in September 2025, four residents with mobility disabilities argue that the city relies on such complaints instead of a plan, and count more than 20,000 sidewalk requests left open for a year or more. The city has moved to dismiss the case, arguing that the plaintiffs lack standing; when this plate was made the case was still open.',
      'The wallet. Through the Shared Cost Sidewalk Program an owner pays part of the repair, about $1,000 to $2,400 for an average mid-block lot, and owners who are seniors or have a disability and live in the home may qualify for half off. Applications open through 311 on one day each January and are taken first come, first served, as far as the year’s budget allows.',
    ]],
    ['What the map cannot see', [
      'Who asked. A 311 request records a place, not a person: it cannot say whether the caller owns the house, rents, or walks with difficulty. An application is not a repair.',
      'Other budgets. The city also repairs sidewalks and builds curb ramps through its own programs and street projects, which are not part of the menu and are not on this map.',
      `Plans, not invoices. Menu costs are as listed in the city’s menu reports, compiled by Ward Wise. ${d12.years[0] + 1} was a short year: half the wards listed less than ${d12M(d12.alloc['2020'])}.`,
      'Old wards. The map uses the wards of 2015–2023, in force for all four years; the city redrew them in 2023.',
    ]],
  ],
};
d12Story.findings = d12Story.sections[1][1];

const d9 = day09Data.summary;
const d9Place = new Map(day09Data.inset.places.map((p) => [p.name, p]));
const d9Ring = (r) => day09Data.rings.find((d) => d.ring === r);
const d9Num = (v) => (v >= 10 ? String(Math.round(v)) : v.toFixed(1).replace(/\.0$/, ''));
const d9List = (a) => `${a.slice(0, -1).join(', ')} and ${a.at(-1)}`;
const d9Round = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} million` : thousands(Math.round(n / 1000) * 1000));
const d9Hours = `${day09Data.window[0]} a.m. and ${day09Data.window[1] - 12} p.m.`;
const d9Dens = ['Cicero', 'Berwyn', 'Chicago'].map((n) => d9Place.get(n).density);
const d9Story = {
  background: [
    'Chicago’s main streets are laid out one mile apart, and this pattern does not stop at the city limit. The same mile grid continues through the suburbs and out into the farmland at the edge of the region. This map asks a simple question: does bus and train service continue along with it?',
    `To answer it, the map counts the buses and trains that stop near the home of each of the ${fmt(d9.residents)} people who live in the six counties of the Chicago region. The count is based on the CTA, Metra and Pace schedules for an ordinary weekday, ${d9Day(day09Data.serviceDay)}, between ${d9Hours} A home counts as near a bus stop if it is within a quarter mile, which is about a five-minute walk, and near a train station if it is within half a mile. Each bus or train is counted in one direction only, so the numbers show how often a rider can catch one going their way.`,
    'Each square on the map stands for one square mile, and its color shows two things at once: how many people live there and how often a bus or train comes. Red squares have many residents but little service, blue squares have good service but few residents, and purple squares have both. In the grayscale version, a darker square means more residents, and the black square inside it grows larger as service improves. You can hover over any square to see its numbers.',
  ],
  findings: [
    day09Data.finding,
    `The gap is sharpest at the city limit, not in the countryside. There are ${d9.thinSquares} square miles in the suburbs where at least 5,000 people live, yet each of them gets fewer than four buses and trains an hour. About ${d9Round(d9.thinResidents)} people live in these places, which are as crowded as parts of Chicago but have far less transit.`,
    `The near west side shows how sudden the change can be. Cicero and Berwyn are about as crowded as the Chicago neighborhoods next to them, with between ${hundreds(Math.min(...d9Dens))} and ${hundreds(Math.max(...d9Dens))} people per square mile in all three places. Even so, the Chicago side gets about ${d9Num(d9Place.get('Chicago').tph)} buses and trains an hour, Cicero gets ${d9Num(d9Place.get('Cicero').tph)}, and Berwyn gets only ${d9Num(d9Place.get('Berwyn').tph)}.`,
    `Service also drops much faster than population as you travel out from the Loop. About ${d9Ring(24).ring} miles out, a square mile has ${Math.round(d9.density25)}% as many residents as a square mile near the Loop, but ${d9.service25 < 1 ? 'less than 1%' : `${Math.round(d9.service25)}%`} as many buses and trains. From about ${Math.round(d9.halfChicagoMile - 1)} miles out, most residents live in the suburbs rather than in Chicago.`,
    `Across the whole region, about ${d9Round(d9.frequentResidents)} people have a bus or train at least every 15 minutes near their home. Only about ${d9Round(d9.frequentSuburbResidents)} of them live in the suburbs, even though ${d9Round(d9.suburbResidents)} people live there.`,
  ],
  edge: [
    'The black line on the map surrounds the places where a bus or train comes at least every 15 minutes, which means four or more an hour. Service this frequent lets people walk to a stop and expect a short wait without checking the schedule first.',
    `Inside Chicago, the line stays close to the city limit and includes ${pct(d9.frequentChicago)} of residents. In the suburbs, it reaches only into the towns that border the city, such as Cicero, Evanston and Oak Park, along with a few small areas in Elgin, Aurora, Waukegan and Joliet.`,
    `Outside the line, people have to plan their trips around the schedule, and many have no transit option nearby at all. For ${pct(d9.noneShare)} of the region’s residents, no bus or train stops near home between ${d9Hours}`,
  ],
  limits: [
    'Distances are measured in a straight line from each home to the nearest stop, so the actual walk along the streets is often longer than the map suggests.',
    'The count is based on published schedules for a single weekday, so it cannot show buses that run late or never arrive.',
    'Pace On Demand and Dial-a-Ride are not included, because riders must book those trips in advance instead of catching a scheduled bus.',
    'Small areas of frequent service, under half a square mile, are left off the black line to keep the map readable, but they are still included in every number.',
    'Population figures come from the 2020 Census. The map covers only the six Illinois counties of the region, so it does not include the South Shore Line in Indiana or the buses in Kenosha, Wisconsin.',
  ],
};
d9Story.sections = [['Background', d9Story.background], ['Findings', d9Story.findings, true], ['Every 15 minutes', d9Story.edge], ['What the map cannot see', d9Story.limits]];

// Day 13: every number below comes from days/day13-interactions/output/plate.json. External fact: the
// CTA fare ($2.50, transitchicago.com/fares, unchanged for 2026).
const d13 = day13Data.summary;
const d13H = day13Data.hours;
const d13PeakTrains = d13H.trains.indexOf(Math.max(...d13H.trains));
// the Blue Line's O'Hare branch from Logan Square into the Loop, to Jackson (the inset), in route order from the Loop
const d13BlueSeq = lineSequences.lines.Blue[0];
const d13BlueStairs = d13BlueSeq.slice(d13BlueSeq.indexOf(day13Data.stations.find((s) => s.short === 'Logan Square').id), d13BlueSeq.indexOf(day13Data.stations.find((s) => s.short === 'Jackson' && s.lines.includes('Blue')).id) + 1)
  .map((id) => day13Data.stations.find((s) => s.id === id)).filter((s) => !s.ada).reverse().map((s) => s.short);
const d13Words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const d13List = (a) => `${a.slice(0, -1).join(', ')} and ${a.at(-1)}`;
const d13Lines = Object.entries(d13.lineDay).sort((a, b) => b[1] - a[1]);
const d13Story = {
  sections: [
    ['Background', [
      'Every day the ‘L’ and the ride-hail car carry people between the same places. A ride-hail trip copies the ‘L’ when it starts and ends near stations on one line, so a single train ride, with no change, could have made it. Chicago publishes every ride-hail trip, most with the census tracts where it starts and ends, so the copies can be counted and drawn on the track the train would have run.',
      'Some of these trips are about comfort, luggage or a late night out. Some are about the train itself: it comes less often at night, and at some stations a rider who cannot take the stairs cannot board it at all.',
      'The map shows a whole day. Hover or tap an hour in the chart to see that hour on the map. Bands are measured per 1,000 ride-hail trips, so a quiet hour and a busy hour compare.',
    ]],
    ['Findings', [
      day13Data.finding,
      `In September 2026, ${fmt(d13.tripsDay)} ride-hail trips a day carried both census tracts. About ${thousands(d13.copyDay)} of them (${pct(d13.copyShare)}) copied a one-seat ‘L’ ride. They averaged ${d13.milesCopy.toFixed(1)} miles, ${Math.round(d13.minsCopy)} minutes and about $${Math.round(d13.fareCopy)} in fare: about $${thousands(d13.farePaid)} a day for rides the train would carry for about $${thousands(d13.fareTrain)}.`,
      `The Red Line carries ${share(d13.lineDay.Red / d13.copyDay)} of the copies, about ${thousands(d13.lineDay.Red)} a day. The ${d13Lines[1][0]} and ${d13Lines[2][0]} lines follow with about ${d13Hundreds(d13Lines[1][1])} and ${d13Hundreds(d13Lines[2][1])}.`,
      `At midday about one ride-hail trip in five copies the ‘L’ (${pct(d13.midShare)}). The share climbs through the evening. Between 1 and 3 a.m. it is ${share(d13.nightShare) === 'one in three' ? 'a third' : share(d13.nightShare)}, while ${Math.round(d13H.trains[1])} and then ${Math.round(d13H.trains[2])} trains an hour leave their first stop, against ${Math.round(d13H.trains[d13PeakTrains])} in the ${d13Hour(d13PeakTrains)} hour. The Red and Blue lines run all night, yet the car copies them most when they run least.`,
      `For ${pct(d13.stairsShare)} of the copies, the train ride needs stairs: no accessible station on the line is within half a mile of one end. The Blue Line holds ${share(d13.blueStairsOfAll)} of them; on that line, ${pct(d13.lineStairs.Blue)} of the copies need stairs. Between the Loop and Logan Square (the inset), ${d13Words[d13BlueStairs.length] ?? d13BlueStairs.length} stations are non-accessible: ${d13List(d13BlueStairs)}.`,
    ], true],
    ['What the map cannot see', [
      'Who rode. The data has no riders, so it cannot say whether a car trip was taken by someone who cannot use the stairs. It says only which train ride existed, and it does not record whether the car was wheelchair accessible.',
      `Missing tracts. ${pct(1 - d13.knownShare)} of the month’s ${fmt(d13.tripsAll)} trips have no census tract at one end, because it lies outside the city or is hidden for privacy. They are left out, and more of them are missing at night. A tract is larger than a station’s reach, so each trip counts by the share of its tracts’ residents within half a mile of the stations.`,
      `The half-mile edge. The test draws a straight half mile. Give accessible stations a little more, ${d13.stairsWide.reachMi} mile, and the copies that need stairs fall from ${pct(d13.stairsShare)} to ${pct(d13.stairsWide.share)}, and on the Blue Line from ${pct(d13.lineStairs.Blue)} to ${pct(d13.stairsWide.byLine.Blue)}. The Blue Line still holds most of them.`,
      `A train ride, not a faster one. A copy is a trip the train could have made: the test leaves out the walk to the station, the wait and the reasons people choose a car. Trips that need two lines are not counted. Counting only rides of two stops or more, ${pct(d13.twoStopsShare)} of trips copy the ‘L’.`,
    ]],
  ],
};
d13Story.findings = d13Story.sections[1][1];

// Day 14: every number below comes from days/day14-borgesian/output/plate.json.
const d14 = day14Data.summary;
const d14Areas = [...day14Data.areas].sort((a, b) => b.share - a.share);
const d14Top = d14Areas.filter((a) => a.share >= 0.9).map((a) => a.name);
const d14Low = d14Areas.filter((a) => a.share < 0.05).map((a) => a.name);
const d14List = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a.at(-1)}`);
const d14Mile = (t, sd) => d14.mile.counts[t]?.[sd] ?? 0;
const d14Both = (t) => d14Mile(t, 'W') + d14Mile(t, 'E');
const d14Full = [1, 2, 3].map((i) => d14.kmByYear[day14Data.asOf.slice(0, 4) - i] ?? 0);
const d14Pace3 = d14Full.reduce((a, b) => a + b, 0) / 3;
const d14Story = {
  sections: [
    ['Background', [
      'In a story one paragraph long, Jorge Luis Borges imagines an empire whose cartographers draw a map the size of the empire, matching it point for point. Later generations find the map useless and leave it to sun and winter. Tattered pieces of it still lie in the western deserts.',
      'A rider who uses a wheelchair needs a map close to that one. On Plate I, a filled dot says a station is accessible. The walk to it is a list of small things: a curb ramp or none, a pole in the middle of the sidewalk, a raised slab.',
      `Project Sidewalk, from the University of Washington, asks volunteers to walk streets in street-level imagery and label what they see. Other users then check each label. This map draws every street the volunteers have walked as a thin dark line. Each community area is shaded by the share of its street length mapped, darker where more is done. Hover an area for its numbers.`,
      'The chart reads one of those streets at the scale of the address grid: one mile of Cicero Avenue, from Madison at the bottom to Chicago Avenue at the top, 800 address numbers, every label at its number. Hover a mark for its label.',
    ]],
    ['Findings', [
      day14Data.finding,
      `The map is patchy. In ${d14.areasHalf} of the city’s ${d14.areas} community areas, more than half the street length is mapped. In ${d14.areasTenth}, less than a tenth is. ${d14List(d14Top)} are nearly complete; ${d14List(d14Low)} have under 5%.`,
      `One mile of Cicero Avenue, from Madison Street to Chicago Avenue, has ${fmt(d14.mile.confirmed)} confirmed labels. ${share(d14Mile('Obstacle', 'W') / d14Both('Obstacle')).replace(/^./, (c) => c.toUpperCase())} of its ${d14Both('Obstacle')} confirmed obstacles stand on the west sidewalk, and ${d14Mile('NoCurbRamp', 'E')} of its ${d14Both('NoCurbRamp')} missing curb ramps are on the east side.`,
    ], true],
    ['What the map cannot see', [
      `The picture, not the street. Volunteers label images, and half of those images were more than ${d14.imageAge.toFixed(0)} years old when the labels were placed. A ramp built since then, or a slab repaired, does not appear.`,
      `Checked, not certain. ${fmt(d14.unchecked)} labels have not yet been checked by another user; they are drawn faint. ${fmt(d14.rejected)} were rejected and are left out. Missing curb ramps are hard to see in an image: ${fmt(d14.noCurb.rejected)} of the ${fmt(d14.noCurb.rejected + d14.noCurb.confirmed)} such labels in the city were rejected. The findings count only confirmed labels.`,
      `Walked or not. A street counts as mapped once a volunteer finishes a virtual walk along it; a label placed on a side street while walking past does not count it. ${fmt(d14.noImageryKm)} km of streets have no imagery and are not counted. The pace is uncertain too: at the average of the three full years before the last, about ${fmt(d14Pace3)} km a year, the rest would take about ${Math.round(d14.yearsLeft3)} years instead of ${Math.round(d14.yearsLeft)}.`,
    ]],
  ],
};
d14Story.findings = d14Story.sections[1][1];

const d15 = day15Data.summary;
const d15Min = (v) => Math.round(v);
const d15Story = {
  background: [
    'Most maps of Chicago put the Loop at the center. The address grid counts out from State and Madison, and the ‘L’ lines run out from downtown. This map turns that view inside out. Its center is 130th Street on the far South Side, where the Red Line Extension will end.',
    'Distance here is time by bus and train, not miles. The main map shades every quarter mile by how long the trip from 130th Street takes. The middle column redraws the city around the start: each place keeps its direction, but its distance from the center is its travel time. The same drawing from the Loop sits below, at the same scale. Hover a block for its times.',
  ],
  findings: [
    day15Data.finding,
    `On the grid, the Loop is about ${Math.round(d15.startMiles)} miles from 130th Street. By bus and train it is ${d15Min(d15.startToLoop)} minutes away. A trip to Northwestern Memorial Hospital, just north of the Loop, takes ${d15Min(d15.startToHosp)} minutes from 130th Street and ${d15Min(d15.loopToHosp)} from the Loop.`,
    `Seen from 130th Street, the city is far away: half of Chicagoans live more than ${d15Min(d15.median.start)} minutes from it. Seen from the Loop, half live within ${d15Min(d15.median.loop)} minutes.`,
  ],
  plan: [
    'The Red Line Extension will carry the Red Line from 95th Street to 130th Street, with four new, fully accessible stations near 103rd Street, 111th Street, Michigan Avenue and 130th Street. CTA expects it to open in 2030.',
    'This map shows today’s buses and trains, before the extension opens.',
  ],
};

const d16 = day16Data.summary;
const d16Win = d16Window(d16.window);
const d16Br = day16Data.reportBreaks;
const d16Y = (grp) => Object.entries(d16.yearTotals[grp]);
const d16SnowSorted = d16Y('snow').slice(0, -1).sort((a, b) => b[1] - a[1]); // complete years only
const d16Story = {
  sections: [
    ['Background', [
      'This map was made with Chicago residents. Each block’s color comes from the reports they sent to 311, the city’s service line, about something in the way on the sidewalk: a scooter or a Divvy bike parked across it, or snow nobody cleared. For a wheelchair user, a parent with a stroller or anyone who cannot step around it, either one can end the walk.',
      `From ${d16Win} they sent ${fmt(d16.reports)} such reports. The map cuts the city into half-mile blocks and shades each one twice: by how many reports it got, and by the share sent in December to February. In color, ochre blocks heard mostly about scooters and bikes, slate blocks mostly about snow, dark gray blocks about both; darker means more reports. In grayscale, darker means more reports and a larger ink square means more of them came in winter. The two tables in the middle give every month of every year, darker where there were more reports. Hover a block or a cell for its counts.`,
    ]],
    ['Findings', [
      day16Data.finding,
      `The sidewalk is blocked in every season, by different things. ${pct(d16.snowWinterShare)} of the snow reports came from December to February; ${pct(d16.wheelsAprNovShare)} of the scooter and bike reports came from April to November.`,
      `The busiest blocks split in two. Of the blocks with ${d16Br[1]} or more reports, ${d16.warm.blocks} heard mostly about scooters and bikes, most of them in ${list(d16.warm.areas.slice(0, 3))}. Another ${d16.cold.blocks} heard mostly about snow, most of them in ${list(d16.cold.areas.slice(0, 3))}.`,
      `Scooter and bike reports grow every year: ${list(d16Y('wheels').slice(0, -1).map(([y, v]) => `${fmt(v)} in ${y}`))}, and ${fmt(d16Y('wheels').at(-1)[1])} in the first ten months of ${d16Y('wheels').at(-1)[0]}. Snow reports follow the winter: ${fmt(d16SnowSorted[0][1])} in ${d16SnowSorted[0][0]}, ${fmt(d16SnowSorted.at(-1)[1])} in ${d16SnowSorted.at(-1)[0]}.`,
      `Reports gather where people send them. ${share(d16.topAreaShare).replace(/^./, (c) => c.toUpperCase())} of the scooter and bike reports came from ${d16.topArea}, and the ten busiest community areas sent ${pct(d16.top10Share)}. ${fmt(d16.quietBlocks)} of the ${fmt(d16.blocks)} blocks sent fewer than ${d16Br[0]} reports in almost five years.`,
      `The same residents asked the city ${fmt(d16.dibs)} times to remove the chairs that hold a shoveled parking space, and reported ${d16.sunk} Divvy bikes and scooters in the lake or the river.`,
    ], true],
    ['What the map cannot see', [
      'Reports, not obstacles. A block’s color shows where residents report as much as where things block the way. Some streets have neighbors who report every scooter; others have none, or have stopped reporting. A pale block is not proof of a clear sidewalk.',
      `Only what was reported, and only since it could be. 311 took its first scooter report in ${D16_MONTHS[Number(d16.scooterFirst.slice(5, 7)) - 1]} ${d16.scooterFirst.slice(0, 4)}. ${pct(d16.webApp)} of these reports came by website or phone app. The city flags repeat reports of the same problem as duplicates; ${fmt(d16.duplicates)} were left out. Broken sidewalks, missing curb ramps and cars on the sidewalk are other request types and are not counted.`,
    ]],
  ],
};
d16Story.findings = d16Story.sections[1][1];

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
  4: {
    file: 'day04-where-it-keeps-happening',
    render: (o) => renderDay04({ ...day04Data, findings: d4Story.findings, boundary: cityBoundary.rings }, o),
    subtitle: 'Which Chicago streets keep hurting the people who walk and bike on them?',
    finding: day04Data.finding,
    story: d4Story,
    ledger: [
      ['Source', `Traffic Crashes – People and Traffic Crashes – Crashes, Chicago Data Portal · ${day04Data.sources.people.id}, ${day04Data.sources.crashes.id} · pulled ${day04Data.asOf}`, day04Data.sources.people.url],
      ['People', `Everyone walking or biking whom police recorded as killed or seriously injured (fatal or incapacitating) from ${day04Data.window.join(' to ')}: ${fmt(d4.people)} people. ${day04Data.dropped.noCoordinates + day04Data.dropped.outsideCity} without a usable location are left out.`],
      ['Deaths', `CDOT’s Vision Zero fatality list (${day04Data.sources.visionZero.id}): a death within 30 days of the crash, expressways excluded. Each death on the list is matched to the police record by id, or by time and place; ${d4.deathsAdded} with no police KSI record are added at the list’s location. ${d4.deathsPoliceNotOnList} people police recorded as killed but CDOT does not list stay in the count as seriously injured.`, day04Data.sources.visionZero.url],
      ['Clusters', `HDBSCAN on each person’s position (minimum ${day04Data.params.minCluster} people, ${day04Data.params.minSamples} samples, leaf selection). ${d4.clusters} of the ${d4.clustersFound} clusters it finds hold in at least half of 200 refits on 80% of the data and are drawn. Each is drawn along the streets that join its people: the shortest paths along OpenStreetMap streets that link them all (a minimum spanning tree), ${fmt(d4.clusterMiles)} miles in all.`],
      ['Network', `CDOT High Injury Network, 2025: the 34 corridors listed in its annual report, drawn along OpenStreetMap streets (extract of ${day04Data.sources.osm.extract}) between their cross streets, ${d4.hinMiles.toFixed(1)} miles. A person is on it within 75 feet, CDOT’s own buffer; a cluster is on it when a quarter of its people are.`, CDOT_REPORT],
      ['Bus stops', `CTA GTFS, feed of ${day04Data.sources.gtfs.feedDate}: people walking within 30 m (about 100 ft) of a bus stop, against the share of OpenStreetMap street length that close to one.`, day04Data.sources.gtfs.url],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
      ['Caveat', 'Counts, not rates. Police-reported crashes on city streets only. Serious injuries as recorded at the scene. The network is drawn from CDOT’s list of corridors, not from CDOT’s own file.'],
      ['CDOT', [
        ['Chicago Traffic Crashes Annual Report, Fall 2025', CDOT_REPORT],
        ['Vision Zero fatalities', day04Data.sources.visionZero.url],
      ]],
    ],
    page: {
      chart: { title: 'The largest clusters', note: D4_CHART_NOTE },
      inset: { title: `Inset · ${titleCase(D4_INSET)}` },
    },
    csv: () =>
      csv([
        ['rank', 'name', 'community_area', 'people', 'walking', 'biking', 'killed', 'after_dark_share', 'hit_and_run_share', 'on_hin_share', 'on_hin', 'stability', 'street_miles'],
        ...day04Data.clusters.map((c) => [c.rank, c.name, c.community, c.people, c.walk, c.bike, c.killed, c.night, c.hitRun, c.hinShare, c.onHin, c.stability, c.miles]),
      ]),
  },  5: {
    file: 'day05-the-signal-you-must-see',
    render: (o) => renderDay05({ ...day05Data, findings: d5Story.findings.slice(1, 3), boundary: cityBoundary.rings, sequences: lineSequences.lines }, o), // the first finding repeats the headline
    subtitle: 'At how many of Chicago’s crossings must you see the signal to know when to walk?',
    finding: day05Data.finding,
    story: d5Story,
    ledger: [
      ['APS', `CDOT, Chicago APS Semi-Annual Report, June 2026: ${d5.cdot.aps} intersections with APS and their install dates (Appendix A), as of ${d5Date(d5.cdot.asOf)}; ChicagoAPS.org, list as of ${d5Date(d5.listedAsOf)}: ${d5.listedNow}. Each is placed by its street names, or its address on the grid, on the nearest signalized crossing; two could not be placed.`, d5Src.report],
      ['Signals', `OpenStreetMap, Geofabrik extract of ${day05Data.osmDate}: signal and signalized-crosswalk nodes within 80 m of each other form one crossing; it counts when a crosswalk there has a walk signal. ${fmt(d5.signals)} crossings, against CDOT’s ${fmt(d5.cdot.signals)}. © OpenStreetMap contributors (ODbL).`, 'https://download.geofabrik.de/north-america/us/illinois.html'],
      ['Block', 'The court order’s 1/8 mile, 201 m, walked on the OpenStreetMap walk network (as Plate III), from each station’s mapped point.'],
      ['Track', `‘L’ lines: CTA GTFS rail shapes, feed of ${lineSequences.feed_date}, every shape carrying at least a tenth of its line’s trips (as Plate II).`, 'https://www.transitchicago.com/developers/gtfs/'],
      ['Transit', 'The order’s transit priority: CTA ‘L’ stations, Metra stations (Metra GTFS), Pace Pulse stops (Pace GTFS), crossings of two CTA bus routes (CTA GTFS), and streets passing under the elevated ‘L’ (OpenStreetMap).'],
      ['People', 'Vision difficulty: ACS 2020–2024 5-year, table B18103, by tract, spread over 2020 Census blocks by population; each block is placed by the walk from its internal point.', 'https://www.census.gov/programs-surveys/acs/data/summary-file.html'],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
      ['Caveat', `Installed is not compliant: the court monitor found none of ${d5.monitor.inspected} inspected APS fully compliant. The signal count is OpenStreetMap’s, not the City’s.`],
      ['Court', [
        ['Remedial Plan Order, 29 May 2025', d5Src.order],
        ['Monitor report, Plan Year 1', d5Src.monitor],
        ['ChicagoAPS.org locations', d5Src.site],
      ]],
    ],
    page: {
      chart: { title: D5_CHART_TITLE, note: D5_CHART_NOTE },
      inset: { title: `Inset · ${titleCase(D5_INSET)}` },
    },
    csv: () =>
      csv([
        ['x_address', 'y_address', 'aps', 'name', 'year_installed', 'transit_priority', 'within_block_of_station', 'added_not_in_osm'],
        ...day05Data.signals.map((p) => [p.x, p.y, p.aps, p.name ?? '', p.year ?? '', p.priority, p.nearStation, p.added]),
      ]),
  },
  6: {
    file: 'day06-surface-lines-1929',
    render: (o) => renderDay06({ ...day06Data, findings: d6Story.findings.slice(1, 3), boundary: cityBoundary.rings, qaRight: `${day06Data.qaRight.only1929}/40 and ${day06Data.qaRight.todayOnly}/40 right` }, o),
    subtitle: 'How much of today’s CTA bus network still runs where the Chicago Surface Lines’ streetcars ran?',
    finding: day06Data.finding,
    story: d6Story,
    ledger: [
      ['CSL', 'Chicago Surface Lines (CSL): the city’s streetcar company from 1914, when the street railways merged, until the CTA took it over on 1 October 1947. The last streetcar ran on 21 June 1958.', 'https://www.transitchicago.com/facts/'],
      ['Map', `System of Chicago Surface Lines, the CSL’s system map of 1929, about 1:104,500; scan by the University of Minnesota Borchert Map Library, ${day06Data.scan.size.join(' × ')} px. Published 1929 with notice, so in the public domain in the US. The same map is at the Osher Map Library.`, day06Data.scan.record],
      ['Fit', 'Georeferenced to the address grid on the sheet’s own margin street numbers, then points along OpenStreetMap’s arterials snapped to the red lines across the street. The Loop is read from the map’s Central District inset.'],
      ['Streets', `OpenStreetMap, Geofabrik extract of ${day06Data.osmDate}, drivable named streets. A street is a CSL line where red ink runs along it on the 1929 map for at least half its length, over a quarter mile. © OpenStreetMap contributors (ODbL).`, 'https://download.geofabrik.de/north-america/us/illinois.html'],
      ['Today', `CTA bus routes as on Plate II, GTFS feed of ${day06Data.gtfs.feedDate}, on the street where a route runs along it.`, day06Data.gtfs.url],
      ['Miles', 'Street-miles inside today’s city, counted so both roadways of a divided street count once. Expressways and Lake Shore Drive are left out.'],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
      ['Caveat', `Checked by eye on 80 random streets: ${day06Data.qaRight.only1929}/40 “CSL only” and ${day06Data.qaRight.todayOnly}/40 “CTA only” right. The few dashed CSL bus lines can be missed. The map shows the CSL network in 1929 only. ${Math.round(d6.offSheetMiles)} miles of streets around O’Hare are off the map.`],
      ['Sources', [
        ['UMN scan', day06Data.scan.record],
        ['Osher Map Library', day06Data.scan.osher],
        ['CTA accessibility', day06Data.ctaAccessUrl],
        ['CTA facts and dates', 'https://www.transitchicago.com/facts/'],
        ['CTA at 75', 'https://www.transitchicago.com/75th/'],
        ['WBEZ, The great years of Chicago streetcars', 'https://www.wbez.org/culture/2012/10/03/the-great-years-of-chicago-streetcars'],
      ]],
    ],
    page: {
      chart: { title: D6_CHART_TITLE, note: D6_CHART_NOTE },
      inset: { title: `Inset · ${titleCase(D6_INSET).replace(' To ', ' to ')}` },
    },
    csv: () => {
      const len = (p) => p.slice(1).reduce((n, q, i) => n + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0) / 800;
      const by = new Map();
      for (const sg of day06Data.segments) by.set(`${sg.name}|${sg.kind}`, (by.get(`${sg.name}|${sg.kind}`) ?? 0) + len(sg.path));
      return csv([['street', 'kind', 'miles_approx'], ...[...by].map(([k, v]) => [...k.split('|'), v.toFixed(2)])]);
    },
  },
  7: {
    file: 'day07-the-doors-right-now',
    render: (o) => renderDay07({ ...day07Data, findings: d7Story.findings.slice(1, 3), boundary: cityBoundary.rings }, o), // the first finding repeats the headline
    subtitle: 'At one moment, which accessible ‘L’ stations could a rider who cannot take the stairs not use?',
    finding: day07Data.finding,
    story: d7Story,
    ledger: [
      ['Alerts', `CTA Customer Alerts API, active alerts at ${d7At} (Chicago time): ${d7.elevatorAlerts} with the impact “Elevator Status”, for ${d7.elevators} elevators at ${d7.stationsWithOutage} stations. No key needed.`, day07Data.source.url],
      ['Platforms', `CTA List of ‘L’ Stops · ${day07Data.stops.id} · pulled ${day07Data.stops.pulled}. Each stop is one platform direction, named by its terminals. An alert closes the stops its words name (a terminal, or a line without a direction); a street elevator, or an elevator with no platform named, closes every stop.`, day07Data.stops.url],
      ['Run', d7Run.live ? `Timed: from the pull to the plate data in ${d7Run.minutes.toFixed(1)} minutes, inside the challenge’s ten.` : `Rebuilt from the saved pull of ${d7At}; the timed run is recorded in the notebook.`],
      ['Walk', `As Plate III: a step-free half mile (${Math.round(day07Data.walkM)} m) on the OpenStreetMap walk network, Geofabrik extract of ${day07Data.osm.extract}, rerun without the stations that lost every platform. © OpenStreetMap contributors (ODbL).`, 'https://download.geofabrik.de/north-america/us/illinois.html'],
      ['Track', `‘L’ lines: CTA GTFS rail shapes, feed of ${day07Data.gtfs.feedDate}, every shape carrying at least a tenth of its line’s trips (as Plates II and V).`, 'https://www.transitchicago.com/developers/gtfs/'],
      ['People', '2020 Census blocks, placed by the walk from their internal point. Ambulatory difficulty: ACS 2020–2024 5-year, table B18105, by tract, spread over blocks by population.', 'https://www.census.gov/programs-surveys/acs/data/summary-file.html'],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
      ['Caveat', 'The alerts describe elevators in words; the match to platforms is a rule, checked by eye on each run. An outage counts from the alert’s start. Residents outside Chicago are not counted.'],
      ['Sources', [
        ['CTA alerts API', 'https://www.transitchicago.com/developers/alerts/'],
        ['CTA accessibility (ASAP)', 'https://www.transitchicago.com/accessibility/asap/'],
      ]],
    ],
    page: {
      chart: { title: d7ChartTitle(), note: D7_CHART_NOTE },
      inset: { title: `Inset · ${d7InsetTitle()}` },
    },
    csv: () =>
      csv([
        ['station_id', 'station', 'lines', 'scope', 'elevator', 'out_since', 'hours_out', 'estimated_return', 'residents_lose_step_free', 'residents_one_direction', 'alert_ids'],
        ...day07Data.outages.map((o) => [o.id, o.short, o.lines.join(' '), o.scope, o.description, o.start, o.ageHours, o.estimatedReturn ?? '', o.lost, o.oneDirection, o.alerts.join(' ')]),
      ]),
  },
  8: {
    file: 'day08-chicago-2038',
    render: (o) => renderDay08({ ...day08Data, findings: d8Story.findings.slice(1, 3), boundary: cityBoundary.rings }, o), // the first finding repeats the headline
    subtitle: 'If CTA keeps its promise of an accessible ‘L’ by 2038, who gains a step-free walk to a station, and how much of the promise has a date?',
    finding: day08Data.finding,
    story: d8Story,
    ledger: [
      ['Promise', 'CTA, All Stations Accessibility Program (ASAP) Strategic Plan, 2024 update, Table 5: each non-accessible station by phase. Phase dates and funding from CTA’s ASAP page; Racine (Blue) and Austin (Green) accessible per CTA’s releases of October 2025 and 7 August 2026.', day08Data.asap.plan],
      ['Extension', 'Red Line Extension: four stations at 103rd, 111th, Michigan Avenue and 130th (CTA RLE FAQ), placed where the extension’s alignment, as mapped in OpenStreetMap (railway=construction), crosses those streets. Opening 2030.', day08Data.asap.rleFaq],
      ['Stations', `CTA List of ‘L’ Stops · ${day08Data.source.id} · pulled ${day08Data.source.pulled}; accessible as on Plate I, an elevator or ramp to every platform.`, day08Data.source.url],
      ['Walk', `As Plate III: a step-free half mile (${Math.round(day08Data.walkM)} m) on the OpenStreetMap walk network, Geofabrik extract of ${day08Data.osm.extract}, rerun after each step. © OpenStreetMap contributors (ODbL).`, 'https://download.geofabrik.de/north-america/us/illinois.html'],
      ['Sea', 'The step-free walk to the nearest station once every station is accessible, on a 40 m grid, with a line every eighth of a mile from 5/8 to 4 miles and an ink line every half mile.'],
      ['Track', `CTA GTFS rail shapes, feed of ${day08Data.gtfs.feedDate}; the extension dashed.`, 'https://www.transitchicago.com/developers/gtfs/'],
      ['People', '2020 Census blocks, placed by the walk from their internal point.', 'https://www.census.gov/programs-surveys/decennial-census/about/rdo/summary-files.html'],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
      ['Sources', [
        ['CTA accessibility (ASAP)', day08Data.asap.page],
        ['ASAP Strategic Plan, 2024', day08Data.asap.plan],
        ['Red Line Extension FAQ', day08Data.asap.rleFaq],
        ['CTA release on State/Lake, Dec 2025', 'https://www.transitchicago.com/construction-to-begin-in-january-on-new-fully-accessible-statelake-cta-station/'],
        ['CTA release on Austin (Green), Aug 2026', 'https://www.transitchicago.com/ctas-austin-green-line-station-reopened-and-fully-accessible/'],
        ['CTA release on Racine (Blue), Oct 2025', 'https://www.transitchicago.com/-racine-blue-line-main-stationhouse-reopens-with-accessibility-improvements-and-vivid-public-artwork-/'],
      ]],
    ],
    page: {
      chart: { title: d8ChartTitle(), note: D8_CHART_NOTE },
      inset: { title: `Inset · ${d8InsetTitle()}` },
    },
    csv: () =>
      csv([
        ['station_id', 'station', 'lines', 'step', 'year', 'residents_gained', 'residents_2038'],
        ...day08Data.stations.map((s) => [s.id, s.short, s.lines.join(' '), s.phaseLabel, s.year ?? '', s.gain, s.residents]),
      ]),
  },
  9: {
    file: 'day09-where-the-grid-frays',
    render: (o) => renderDay09({ ...day09Data, findings: d9Story.findings.slice(1, 3), boundary: cityBoundary.rings }, o), // the first finding repeats the headline
    subtitle: 'Chicago’s grid runs on past the city limit, a road every mile. Does the bus run on with it?',
    finding: day09Data.finding,
    story: d9Story,
    ledger: [
      ['Service', `Bus and train schedules (GTFS) from CTA (${day09Data.feeds.cta.snapshot}), Metra (${day09Data.feeds.metra.snapshot}) and Pace (${day09Data.feeds.pace.snapshot}), for ${d9Day(day09Data.serviceDay)}, between ${d9Hours} For each route, the map uses the busiest stop within a quarter mile of a home, or half a mile for trains, and counts its departures per hour in one direction. The counts for all nearby routes are then added together.`, [['CTA', day09Data.feeds.cta.url], ['Metra', day09Data.feeds.metra.url], ['Pace', day09Data.feeds.pace.url]]],
      ['Black line', 'The line surrounds the places with four or more buses and trains an hour, checked at points spaced a tenth of a mile apart. Areas smaller than half a square mile are not drawn.'],
      ['People', `Population comes from the 2020 Census, which counts ${fmt(d9.residents)} residents in Cook, DuPage, Kane, Lake, McHenry and Will counties, block by block.`, 'https://www.census.gov/programs-surveys/decennial-census/about/rdo/summary-files.html'],
      ['Grid', 'Each square is one square mile, measured from State and Madison, where Chicago’s address numbers begin. The grid lines are eight miles apart and are labeled with the addresses they would carry.'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
    ],
    page: {
      chart: { title: D9_CHART_TITLE, note: D9_CHART_NOTE },
      inset: { title: `Inset · ${D9_INSET}` },
    },
    csv: () =>
      csv([
        ['x_mile', 'y_mile', 'place', 'in_chicago', 'residents', 'vehicles_per_hour', 'last_departure_h', 'frequent_share'],
        ...day09Data.cells.map((c) => [c.x, c.y, c.where, c.chicago, c.pop, c.tph, c.last ?? '', c.freq]),
      ]),
  },
  10: {
    file: 'day10-the-line-printer',
    render: (o) => renderDay10({ ...day10Data, findings: d10Story.findings.slice(1, 3), boundary: cityBoundary.rings }, o), // the first finding repeats the headline
    subtitle: 'At nine at night, how long until a rider who cannot take the stairs is moving? Chicago printed one character per block, as the first computer maps were.',
    finding: day10Data.finding,
    story: d10Story,
    ledger: [
      ['Service', `CTA bus and train schedule (GTFS), feed of ${day10Data.gtfs.snapshot}, for ${d10Day(day10Data.serviceDay)}, departures from 8:30 to 9:30 p.m.: ${day10Data.gtfs.routes} routes. Trains count only at accessible stations, as on Plate VIII (Racine and Austin included).`, day10Data.gtfs.url],
      ['Walk', `Step-free (no stairs) on the OpenStreetMap walk network, Geofabrik extract of ${day10Data.osm}, from each block’s center to each route’s nearest stop within four blocks (half a mile), at 3 feet a second. © OpenStreetMap contributors (ODbL).`, 'https://download.geofabrik.de/north-america/us/illinois.html'],
      ['Speed', 'Manual on Uniform Traffic Control Devices (2009), section 4E.06: a walking speed of 3 feet a second for the whole crossing time (paragraph 14); 3.5 feet a second for clearance, slower where people who walk slower or use wheelchairs routinely cross.', day10Data.sources.mutcd],
      ['Buses', 'CTA: all of its buses and railcars are accessible.', 'https://www.transitchicago.com/accessibility/'],
      ['Wait', 'Half the scheduled time between buses or trains at that stop, in one direction; each block keeps the route with the least walk plus wait.'],
      ['People', `2020 Census: ${fmt(d10.residents)} residents, placed by their block’s internal point; difficulty walking from ACS 2020–2024 (B18105), allocated to blocks by population (an estimate). Blocks with no walkway within 100 m print blank.`, 'https://www.census.gov/programs-surveys/decennial-census/about/rdo/summary-files.html'],
      ['Print', 'One character per block of an eighth of a mile, measured from State & Madison. Tone by overprinting, after SYMAP: Howard Fisher and Betty Benson, begun after a 1963 training session at Northwestern, released by the Harvard Laboratory for Computer Graphics in 1966.'],
      ['SYMAP', [['Harvard GSD on the Laboratory', 'https://www.gsd.harvard.edu/2024/11/a-new-way-of-seeing-the-laboratory-for-computer-graphics-and-spatial-analysis'], ['Esri ArcNews', 'https://www.esri.com/about/newsroom/arcnews/celebrating-the-advent-of-digital-mapping'], ['Map Happenings on line-printer maps', 'https://maphappenings.com/2023/11/02/computer-based-mapping/']]],
      ['Sides', 'Chicago’s 77 community areas in nine sides, as grouped on Wikipedia (an unofficial grouping; the traditional sides are three).', day10Data.sources.sides],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
      ['Made', 'From start to finish in one command-line session with an AI coding assistant: every prompt, verbatim.', 'https://github.com/amitrm/2026-30d-maps/blob/main/days/day10-prompting/prompts.md'],
    ],
    page: {
      chart: { title: D10_CHART_TITLE, note: D10_CHART_NOTE, colorNote: ` ${D10_COLOR_NOTE}` },
      inset: { title: `Inset · ${day10Data.inset.title}` },
    },
    csv: () =>
      csv([
        ['col', 'row', 'x_address', 'y_address', 'class', 'minutes_until_moving_at_9pm'],
        ...day10Data.rows.flatMap((r) => [...r.s].map((ch, i) => [r.col + i, r.row, ch]).filter(([, , ch]) => ch !== ' ').map(([c, row, ch]) => [c, row, (c + 0.5) * 100, Math.round(d10Addr((row + 0.5) / 8)), +ch, day10Data.classLabels[+ch]])),
      ]),
  },
  11: {
    file: 'day11-what-you-hear-while-you-wait',
    render: (o) => renderDay11({ ...day11Data, findings: d11Story.findings.slice(1, 3), boundary: cityBoundary.rings, sequences: lineSequences.lines }, o), // the first finding repeats the headline
    subtitle: 'Expressways, the ‘L’, freight trains and aircraft: how loud is it where Chicago waits for a train or a bus?',
    finding: day11Data.finding,
    story: d11Story,
    ledger: [
      ['Noise', 'Bureau of Transportation Statistics, National Transportation Noise Map, 2022 release: road noise from 2023 traffic counts, rail (freight, commuter and the ‘L’) and aviation from 2022. A model of the 24-hour average sound level (LAeq) on 30 m squares, nothing below 45 dB; the three combined by sound energy.', day11Data.sources.bts],
      ['Method', `Each point reads the median within ${day11Data.thresholds.radiusM} m (about half a block): the model puts the listener on the track or roadway, where one square reads 80–95 dB and the next about 60. Each map dot is one block of an eighth of a mile, the energy average of that surface over the block; the inset averages over half a block.`, day11Data.sources.btsDoc],
      ['Stations', `CTA GTFS platforms, feed of ${day11Data.gtfsDate}; each of the ${d11.stations} city stations reads its loudest platform (State/Lake, missing from the feed, its station point). Accessible as on Plate VIII.`, 'https://www.transitchicago.com/developers/gtfs/'],
      ['Check', 'Chicago Department of Aviation, Airport Noise Management System, Midway quarterly report, 4th quarter 2025: aircraft day-night average (DNL) at 13 monitors, 12 months to December 2025; monitors placed by their street addresses (Census geocoder).', day11Data.sources.midway],
      ['People', `2020 Census: ${fmt(d11.residents)} residents, read at each block’s internal point.`, 'https://www.census.gov/programs-surveys/decennial-census/about/rdo/summary-files.html'],
      ['Levels', [
        ['EPA, levels document (1974)', day11Data.sources.epa],
        ['FAA, 14 CFR Part 150, Appendix A', 'https://www.ecfr.gov/current/title-14/chapter-I/subchapter-I/part-150/appendix-Appendix%20A%20to%20Part%20150'],
        ['HUD, 24 CFR 51 Subpart B', 'https://www.ecfr.gov/current/title-24/subtitle-A/part-51/subpart-B'],
      ]],
      ['Sources', [
        ['Phan & Jones (2017), noise inside CTA trains', day11Data.sources.ctaStudy],
        ['Orange Line on freight rights-of-way (chicago-l.org)', 'https://www.chicago-l.org/operations/lines/midway.html'],
      ]],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
    ],
    page: {
      chart: { title: D11_CHART_TITLE, note: D11_CHART_NOTE },
      inset: { title: `Inset · ${D11_INSET}` },
    },
    csv: () =>
      csv([
        ['station_id', 'station', 'lines', 'accessible', 'db_24h_median_90m', 'db_24h_point', 'road_only_median_90m', 'rail_only_median_90m', 'aviation_only_median_90m', 'loudest_source'],
        ...day11Data.stations.map((s) => [s.id, s.short, s.lines.join(' '), s.ada, ...[s.db, s.point, s.road, s.rail, s.aviation].map((v) => (v < 45 ? '<45' : v)), s.source]),
      ]),
  },
  12: {
    file: 'day12-who-fixes-the-sidewalk',
    render: (o) => renderDay12({ ...day12Data, findings: d12Story.findings.slice(1, 3) }, o), // the first finding repeats the headline
    subtitle: 'Fifty aldermen get the same money each. How much of it went to the sidewalks, and who asks the city instead?',
    finding: day12Data.finding,
    story: d12Story,
    ledger: [
      ['Menu', `City of Chicago menu program reports, ${d12.years[0]}–${d12.years[1]}, compiled and categorized by Ward Wise, a Chi Hack Night group (MIT license). Costs as listed. Sidewalks: Ward Wise’s “Sidewalk Repair”; crossings: “Pedestrian Infrastructure” (bump-outs, refuge islands, crosswalk signs, countdown signals).`, day12Data.sources.wardwise],
      ['Reports', 'Office of Budget and Management, Capital Improvement Archive (menu reports).', day12Data.sources.obm],
      ['311', `Chicago Data Portal, 311 Service Requests: “Sidewalk Inspection Request” and “Shared Cost Sidewalk Program Request”, pulled ${day12Data.pulled311}; placed in wards by their location.`, day12Data.sources.sr311],
      ['Wards', 'The 2015–2023 wards, in force for all four years, built from Ward Precincts 2013–2022.', day12Data.sources.precincts],
      ['People', `2020 Census: ${fmt(d12.residents)} residents, placed by their block’s internal point; difficulty walking from ACS 2020–2024 (B18105), allocated to blocks by population (an estimate).`, 'https://www.census.gov/programs-surveys/decennial-census/about/rdo/summary-files.html'],
      ['Sources', [
        ['Inspector General, menu program audit (2017)', 'https://igchicago.org/2017/04/20/cdot-aldermanic-menu-program-audit-2/'],
        ['Inspector General, advisory on residential street infrastructure (2019)', 'https://igchicago.org/?p=20680'],
        ['Shared Cost Sidewalk Program, 2026 overview', 'https://www.19thwardmobile.com/wp-content/uploads/2026/01/2026-SCSP-Overview_2025.12.15.pdf'],
        ['Lane v. City of Chicago (Disability Rights Advocates)', 'https://dralegal.org/case/lane-v-city-of-chicago/'],
        ['WTTW on the motion to dismiss (June 2026)', 'https://news.wttw.com/2026/06/22/chicago-s-sidewalks-aren-t-accessible-people-mobility-challenges-lawsuit-argues-city'],
      ]],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Color', `Seven classes of the share spent on sidewalks and crossings: under 2%, 2–5, 5–7, 7–10, 10–15, 15–20 and 20% or more. In color mode they run from sand to teal in seven even steps of lightness, light for less, dark for more, and the chart’s sidewalk and crossing bars take the same teals. In grayscale the same classes step from light to dark. The city as a whole spent ${pct(d12.walkShare)}.`],
      ['Scatter', 'In color mode the nine cells of Complaint and Wallet (thirds of the wards on each axis) use Joshua Stevens’ purple–gold bivariate scheme: purple for more requests, gold for more applications, umber for both.', 'https://www.joshuastevens.net/cartography/make-a-bivariate-choropleth-map/'],
    ],
    page: {
      // the page chart shows the ten wards at each end (all fifty are on the plate, the map and in the
      // tooltips); one-line notes leave the scatter room
      chart: { title: D12_CHART_TITLE, note: 'Ten wards at each end · ● 311 requests, ○ shared-cost applications, per 1,000 residents.', colorNote: ' Rows shaded as in the scatter below.' },
      inset: { title: D12_INSET, note: `Each ward a dot, per 1,000 residents, ${d12.years[0]}–${String(d12.years[1]).slice(2)}; marked by thirds of the wards on each axis.`, frame: false }, // replaces the page's “Shown at ×N” note
    },
    csv: () =>
      csv([
        ['ward_2015_2023', 'residents', 'difficulty_walking_est', 'menu_total_2019_2022', 'sidewalks', 'crossings', 'streets_alleys', 'lights_signals', 'cameras', 'other', 'share_sidewalks_crossings', 'sr311_sidewalk_filed_2019_2022', 'sr311_open_now', 'sr311_open_3y_plus', 'median_days_to_close', 'shared_cost_applications_2019_2022'],
        ...day12Data.wards.map((w) => [w.ward, w.pop, w.amb, w.total, w.sidewalks, w.crossings, w.streets, w.lights, w.cameras, w.other, w.share, w.filed, w.open, w.open3, w.closeDays, w.shared]),
      ]),
  },
  13: {
    file: 'day13-car-or-train',
    render: (o) => renderDay13({ ...day13Data, findings: d13Story.findings.slice(3, 5), boundary: cityBoundary.rings }, o), // the headline is the plate's finding note
    subtitle: 'Where one ‘L’ ride could make the trip, how often does Chicago take a car instead, and when?',
    finding: day13Data.finding,
    story: d13Story,
    ledger: [
      ['Trips', `City of Chicago, Transportation Network Providers – Trips (2025–): every ride-hail trip in September 2026 that carries both census tracts, ${fmt(d13.tripsKnown)} of ${fmt(d13.tripsAll)}, grouped by pickup tract, drop-off tract and the hour it started. Fares rounded by the City to the nearest $2.50; tips and charges not included.`, day13Data.sources.tnp],
      ['Copy', `A trip copies the ‘L’ when both tracts have residents within ${d13.reachMi} mile (straight line) of stations on one line, the stations different. It counts by the share of the pickup tract’s residents near one station times the drop-off tract’s near the other (2020 Census blocks), for the best pair. It is drawn on the track between them (CTA’s GTFS rail shapes).`],
      ['Stairs', 'The same test with accessible stations only. The part of a copy it cannot match needs stairs. Accessible: the City’s flag, with Racine (Blue) and Austin (Green) counted accessible after their reopenings (as Plate VIII).', day13Data.sources.stops],
      ['Trains', `CTA GTFS, feed of ${day13Data.gtfsDate}: ‘L’ trains leaving their first stop in each hour, averaged over a week (five weekdays, Saturday, Sunday).`, day13Data.sources.gtfs],
      ['Fare', `CTA fares: $${d13.fare.toFixed(2)} for an ‘L’ ride (the O’Hare surcharge is left out).`, day13Data.sources.fares],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
    ],
    page: {
      chart: { title: D13_CHART_TITLE, note: 'Line: share of ride-hail trips that copy a one-seat ‘L’ ride · Bars: ‘L’ trains leaving their first stop.' },
      inset: { title: `Inset · ${D13_INSET}`, note: `Blue Line bands only, ×${D13_INSET_BANDS} their width on the map; the other lines as track.` },
    },
    csv: () =>
      csv([
        ['line', 'from_station', 'to_station', 'copies_per_day', 'needs_stairs_per_day', ...day13Data.hours.trips.map((_, h) => `copies_h${String(h).padStart(2, '0')}`)],
        ...day13Data.edges.map((e) => {
          const name = (id) => day13Data.stations.find((s) => s.id === id).short;
          const t = (a) => Math.round(a.reduce((x, v) => x + v, 0) * 10) / 10;
          return [e.line, name(e.a), name(e.b), t(e.h), t(e.s), ...e.h];
        }),
      ]),
  },
  14: {
    file: 'day14-the-tattered-map',
    render: (o) => renderDay14({ ...day14Data, findings: d14Story.findings.slice(1), boundary: cityBoundary.rings }, o), // the headline is the plate's finding note
    subtitle: 'A wheelchair user needs a map of every curb ramp and broken slab. How much of Chicago has one?',
    finding: day14Data.finding,
    story: d14Story,
    ledger: [
      ['Labels', `Project Sidewalk Chicago (University of Washington, Makeability Lab), pulled ${day14Data.asOf}: ${fmt(d14.labels)} labels inside the city by ${fmt(d14.volunteers)} volunteers since ${d14.firstYear}. ${fmt(d14.confirmed)} confirmed in validation by other users or Project Sidewalk’s AI validator, ${fmt(d14.unchecked)} not yet checked (drawn faint), ${fmt(d14.rejected)} rejected (left out). Crosswalks, signals and other labels are counted but not drawn; on the Cicero mile, the strip draws the four types in its table (its few no-sidewalk labels are all unchecked). Project Sidewalk data is public domain (CC0 1.0); Saha et al., CHI 2019.`, day14Data.sources.ps],
      ['Mapped', `Project Sidewalk’s street segments (OpenStreetMap ways) inside the city that have imagery: ${fmt(d14.openKm)} km. A segment is mapped once a volunteer has completed a virtual walk of it: ${fmt(d14.mappedKm)} km, drawn as thin lines. Pace: the length first labeled in the 12 months before the pull, ${fmt(d14.lastYearKm)} km.`, day14Data.sources.api],
      ['Mile', `Cicero Avenue from Madison Street to Chicago Avenue. The CTA bus stops at each end, both directions averaged, fix 0 and 800 N; each label’s distance between them is scaled to 800 numbers. Its side comes from a center line fitted through the bus stops at each crossing. CTA GTFS, feed of ${day14Data.gtfsDate}. Cross streets: every named street meeting the mile in OpenStreetMap (Geofabrik extract, ODbL); arterials darker, minor streets lighter.`, day14Data.sources.gtfs],
      ['Areas', 'City of Chicago, Boundaries – Community Areas; a street segment counts in the area that holds its midpoint.', day14Data.sources.areas],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
    ],
    page: {
      chart: { title: D14_CHART_TITLE, note: 'Cicero Avenue, Madison (bottom) to Chicago Avenue (top): 800 address numbers, every label at its number.' },
    },
    csv: () =>
      csv([
        ['community_area', 'street_km', 'mapped_km', 'share_mapped', 'labels', 'confirmed_curb_ramps', 'confirmed_obstacles', 'confirmed_surface_problems', 'confirmed_missing_curb_ramps', 'confirmed_no_sidewalk'],
        ...d14Areas.map((a) => [a.name, a.km, a.mappedKm, a.share, a.labels, a.ramps, a.obstacles, a.surfaces, a.noRamp, a.noSidewalk]),
      ]),
  },
  15: {
    file: 'day15-from-the-end-of-the-line',
    render: (o) => renderDay15({ ...day15Data, findings: d15Story.findings.slice(1), boundary: cityBoundary.rings }, o), // the headline is the plate's finding note
    subtitle: 'What does Chicago look like with 130th Street, not the Loop, at its center?',
    finding: day15Data.finding,
    story: d15Story,
    ledger: [
      ['Transit', `Bus and train schedules (GTFS) from CTA (${day15Data.feeds.cta.snapshot}), Metra (${day15Data.feeds.metra.snapshot}) and Pace (${day15Data.feeds.pace.snapshot}), for Tuesday ${d15Day(day15Data.serviceDay)}. Fares differ between the three and are not counted.`, [['CTA', day15Data.feeds.cta.url], ['Metra', day15Data.feeds.metra.url], ['Pace', day15Data.feeds.pace.url]]],
      ['Minutes', `Door to door, leaving every five minutes from ${day15Data.departs[0]} to ${day15Data.departs[1]} a.m.; the travel time is the median of the 12 trips, waiting included (earliest arrival by connection scan). Walking: a straight line × ${day15Data.method.detour} at ${day15Data.method.walkMps} m/s, up to ¾ mile to a stop and ¼ mile between stops, plus a minute to change.`],
      ['Start', 'The center is 130th Street where the Red Line Extension’s alignment, as mapped in OpenStreetMap (railway=construction), crosses it: the site of the extension’s last station. The Loop is State & Madison. The hospital is Northwestern Memorial Hospital, 251 E Huron St.', day15Data.sources.rleFaq],
      ['People', `2020 Census: ${fmt(d15.residents)} residents, each block at its internal point taking the minutes of the nearest quarter-mile point.`, day15Data.sources.census],
      ['Drawing', 'Main map: every quarter mile of the grid, its minutes lightly smoothed (0.2 mile). Inside out: each point keeps its true direction from the start and sits as far out as its minutes, smoothed over about 0.4 mile; the rings are minutes. Hover blocks (every half mile) show the unsmoothed minutes. Points with no stop within reach, on Lake Calumet, take the minutes of their neighbors.'],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
    ],
    page: {
      chart: { title: D15_CHART_TITLE, note: D15_CHART_NOTE },
    },
    csv: () =>
      csv([
        ['x_miles_east', 'y_miles_north', 'minutes_from_130th_st', 'minutes_from_state_madison', 'miles_from_130th_st'],
        ...day15Data.cells.map(([x, y, a, b]) => [x, y, a, b, Math.hypot(x - day15Data.points.start[0], y - day15Data.points.start[1]).toFixed(2)]),
      ]),
  },
  16: {
    file: 'day16-something-in-the-way',
    render: (o) => renderDay16({ ...day16Data, findings: d16Story.findings.slice(1, 5), boundary: cityBoundary.rings }, o), // the headline is the plate's finding note
    subtitle: 'What do Chicago residents tell the city is blocking the sidewalk, where, and when in the year?',
    finding: day16Data.finding,
    story: d16Story,
    ledger: [
      ['Reports', `City of Chicago, 311 Service Requests · ${day16Data.dataset} · pulled ${day16Data.ledger.pulled}: three request types, ${d16Win}. Scooters and bikes: E-Scooter Parking Complaint (${fmt(d16.scooter)}) and Divvy Bike Parking Complaint (${fmt(d16.divvy)}). Snow: Snow – Uncleared Sidewalk Complaint (${fmt(d16.snow)}). Reports the city flags as duplicates, and the few without a location, are left out.`, day16Data.sources.sr311],
      ['Blocks', `Half-mile squares of the mile grid; each report counts in the block that holds it. Reports per block: ${d16Classes(d16Br).join(', ').toLowerCase()}. Share sent in December–February: under a third, a third to two thirds, over two thirds.`],
      ['Tables', 'Reports a month, citywide: months down, calendar years across; each cell shaded on a square-root scale of its table’s largest month.'],
      ['Areas', 'City of Chicago, Boundaries – Community Areas, as recorded on each report.', day16Data.sources.areas],
      ['Notes', `Snow – Object/Dibs Removal Request (${fmt(d16.dibs)}) and Submerged Divvy or Lime Device in the Lake/River (${d16.sunk}), same window; counted, not drawn.`],
      ['Grid', 'Each square is one mile, measured from State & Madison, and grid lines carry address numbers. The first mile south of Madison runs to Roosevelt Road (1200 S).'],
      ['Limits', `City of Chicago, ${cityBoundary.source} · ${cityBoundary.dataset_id} · pulled ${cityBoundary.pulled}`, cityBoundary.url],
    ],
    page: {
      chart: { title: D16_CHART_TITLE, note: D16_CHART_NOTE },
    },
    csv: () =>
      csv([
        ['block_middle', 'x_miles_east', 'y_miles_north', 'community_area', 'scooters', 'divvy_bikes', 'uncleared_sidewalks', 'share_dec_feb', 'busiest_month', 'report_class', 'winter_class'],
        ...day16Data.blocks.map((b) => [d16Place(b[0], b[1], day16Data.step), b[0], b[1], day16Data.areas[b[7]], b[2], b[3], b[4], b[5], D16_MONTHS[b[6] - 1], b[8], b[9]]),
      ]),
  },
};
