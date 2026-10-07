// Scalloped cloud strip from the calendar template. It repeats sideways,
// so it looks the same at any screen width without stretching.

const TILE = 300;
const CLOUDS: [number, number, number][] = [
  [10, 112, 46],
  [92, 100, 40],
  [165, 110, 44],
  [240, 96, 40],
];
const OFFSETS = [-TILE, 0, TILE];

export function CloudBanner() {
  return (
    <svg className="block h-[100px] w-full" aria-hidden="true">
      <defs>
        <pattern id="cloud-tile" width={TILE} height={100} patternUnits="userSpaceOnUse">
          {OFFSETS.flatMap((dx) =>
            CLOUDS.map(([cx, cy, r]) => (
              <circle key={`g${dx}-${cx}`} cx={cx + dx - 4} cy={cy - 6} r={r} fill="#D5DADD" />
            )),
          )}
          {OFFSETS.flatMap((dx) =>
            CLOUDS.map(([cx, cy, r]) => (
              <circle key={`w${dx}-${cx}`} cx={cx + dx} cy={cy} r={r} fill="#FFFFFF" />
            )),
          )}
          <rect x={0} y={84} width={TILE} height={16} fill="#FFFFFF" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#A9D8E3" />
      <rect width="100%" height="100%" fill="url(#cloud-tile)" />
    </svg>
  );
}
