// Full plates as standalone SVG: /downloads/dayNN-<title>.svg and -color.svg
import days from '../../data/days.json';
import { plates } from '../../plates/index.js';
import { standalone } from '../../lib/export-svg.js';

export function getStaticPaths() {
  return days
    .filter((d) => d.status === 'published' && plates[d.day])
    .flatMap((d) => {
      const p = plates[d.day];
      return [
        { params: { file: p.file }, props: { p, mode: 'gray' } },
        { params: { file: `${p.file}-color` }, props: { p, mode: 'color' } },
      ];
    });
}

export function GET({ props }) {
  return new Response(standalone(props.p.render({ mode: props.mode })), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
}
