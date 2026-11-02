// Registry of built plates. To publish a day: add its module + data here,
// then set "status": "published" in src/data/days.json.
//   render({ mode, variant })  'gray' | 'color'; 'plate' (print and download), or the day page's
//                              'map', 'chart' (stations by line) and 'inset' (the Loop)
//   file, subtitle, finding    download name stem, page subtitle, headline finding
//   story                      background, findings and plan paragraphs for the day page
//   ledger                     [label, value, url?] rows for the Data and method section;
//                              value may be a list of [text, url] links
//   csv()                      the plotted data, offered as a download
import cityBoundary from '../../reference/city-boundary.json';
import lineSequences from '../../reference/cta-line-sequences.json';
import day01Data from '../../days/day01-points/output/plate.json';
import { renderDay01 } from './day01.js';

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
    csv: () =>
      csv([
        ['station_id', 'name', 'lines', 'step_free', 'lat', 'lon', 'x_address', 'y_address'],
        ...day01Data.stations.map((s) => [s.id, s.name, s.lines.join(' '), s.ada, s.lat, s.lon, s.x, s.y]),
      ]),
  },
};
