// Registry of built plates. To publish a day: add its module + data here,
// then set "status": "published" in src/data/days.json.
import day01Data from '../../days/day01-points/output/plate.json';
import { renderDay01 } from './day01.js';

export const plates = {
  1: {
    render: () => renderDay01(day01Data),
    notes: [
      'Chicago’s address grid promises that every mile is the same: 800 numbers, an arterial every half mile, a bus on every arterial. This atlas spends 30 days testing that promise for people who cannot take the stairs.',
      `Plate I starts with the doors. Of ${day01Data.summary.total} ‘L’ stations in the city’s open data, ${day01Data.summary.noStepFree} are flagged without step-free access. ${day01Data.summary.blueNoStepFree} of those sit on the Blue Line, including most of its Forest Park branch and the Dearborn subway under the Loop.`,
      'The map has no basemap. The only reference is the address grid itself, drawn one line per mile, which becomes the coordinate system for the whole series. Box A marks the future 130th Street terminal of the Red Line Extension; box B is a downtown hospital. Every plate follows that one trip.',
    ],
    sources: [
      { label: "CTA – System Information – List of 'L' Stops (8pix-ypme)", url: 'https://data.cityofchicago.org/d/8pix-ypme' },
      { label: 'CTA: Updated All Stations Accessibility Program (Jul 2024)', url: 'https://transitchicago.com/cta-releases-updated-all-stations-accessibility-program' },
    ],
  },
};
