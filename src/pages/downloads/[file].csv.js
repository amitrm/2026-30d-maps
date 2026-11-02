// The data each plate plots: /downloads/dayNN-<title>-data.csv
import days from '../../data/days.json';
import { plates } from '../../plates/index.js';

export function getStaticPaths() {
  return days
    .filter((d) => d.status === 'published' && plates[d.day]?.csv)
    .map((d) => ({ params: { file: `${plates[d.day].file}-data` }, props: { p: plates[d.day] } }));
}

export function GET({ props }) {
  return new Response(props.p.csv(), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
}
