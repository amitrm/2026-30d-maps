#!/usr/bin/env bash
# The timed run for Plate VII: pull CTA's elevator alerts now, analyze, render and export the plate.
# Everything else (stop list, walk network, base walksheds, renderer) is prepared beforehand.
# Usage, from the repository root:  days/day07-10min/run.sh            (live pull)
#                                   DAY07_LIVE=0 days/day07-10min/run.sh (rebuild from the saved pull)
set -euo pipefail
cd "$(dirname "$0")/../.."
export DAY07_LIVE="${DAY07_LIVE:-1}"
t0=$(date +%s)
lap() { printf '%-28s %4ds  (total %ds)\n' "$1" $(( $(date +%s) - t )) $(( $(date +%s) - t0 )); }
echo "Run started $(TZ=America/Chicago date '+%Y-%m-%d %H:%M:%S %Z')"
t=$(date +%s); (cd days/day07-10min && uv run jupyter nbconvert --execute --to notebook --inplace day07.ipynb >/dev/null 2>&1); lap 'notebook (pull + analysis)'
t=$(date +%s); npm run build >/dev/null 2>&1; lap 'site build'
t=$(date +%s); npm run export >/dev/null 2>&1; lap 'plate PNG export'
echo "Map complete $(TZ=America/Chicago date '+%H:%M:%S %Z'), $(( $(date +%s) - t0 ))s after the start (limit 600s)"
t=$(date +%s); npm run build >/dev/null 2>&1; lap 'build with PNGs (to ship)'
uv run python -c "import json; d=json.load(open('days/day07-10min/output/plate.json')); print('pulled', d['run']['pulledAt'], '| live', d['run']['live'], '|', d['finding'])"
