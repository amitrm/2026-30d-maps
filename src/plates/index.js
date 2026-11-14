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
      `The wait grows toward the edges of the city. On the three Far sides, ${pct(Math.min(...d10Far))} to ${pct(Math.max(...d10Far))} of residents need more than 15 minutes. On the ${d10Lo.side}, near the centre, it is ${pct(d10Lo.over15)}.`,
    ], true],
    ['How the minutes are counted', [
      `The schedule is CTA’s for ${d10Day(day10Data.serviceDay)}, the challenge’s Day 10, with departures between 8:30 and 9:30 p.m. Every CTA bus route counts, and trains count only at accessible stations.`,
      'The walk follows the street and sidewalk network in OpenStreetMap with stairs taken out, from the centre of each block to the nearest stop of each route. It is timed at 3 feet a second, the speed the federal traffic manual uses to time a whole crossing at a signal. Its usual walking speed is 3.5 feet a second.',
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
      ['Walk', `Step-free (no stairs) on the OpenStreetMap walk network, Geofabrik extract of ${day10Data.osm}, from each block’s centre to each route’s nearest stop within four blocks (half a mile), at 3 feet a second. © OpenStreetMap contributors (ODbL).`, 'https://download.geofabrik.de/north-america/us/illinois.html'],
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
};
