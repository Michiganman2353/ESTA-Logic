import { forwardRef, type KeyboardEvent } from 'react';
import { guides } from './content';
import { WORLD, type Point } from './model';

export const WorldMap = forwardRef<
  HTMLDivElement,
  {
    position: Point;
    nearbyId?: string;
    onMove: (dx: number, dy: number) => void;
    onInteract: () => void;
  }
>(function WorldMap({ position, nearbyId, onMove, onInteract }, ref) {
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.target !== event.currentTarget ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const directions: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      w: [0, -1],
      ArrowDown: [0, 1],
      s: [0, 1],
      ArrowLeft: [-1, 0],
      a: [-1, 0],
      ArrowRight: [1, 0],
      d: [1, 0],
    };
    const direction =
      directions[event.key] ?? directions[event.key.toLowerCase()];
    if (direction) {
      event.preventDefault();
      onMove(direction[0] * WORLD.step, direction[1] * WORLD.step);
    }
    if (
      ['e', 'Enter'].includes(event.key.toLowerCase() === 'e' ? 'e' : event.key)
    ) {
      event.preventDefault();
      if (!event.repeat) onInteract();
    }
  }
  return (
    <div
      className="academy-map"
      ref={ref}
      tabIndex={0}
      role="region"
      aria-label="Academy exploration map"
      aria-describedby="academy-map-help"
      onKeyDown={keyboard}
    >
      <svg viewBox="0 0 960 600" aria-hidden="true" focusable="false">
        <defs>
          <pattern
            id="academy-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M32 0H0V32"
              fill="none"
              stroke="#8bb8b1"
              strokeWidth=".6"
              opacity=".14"
            />
          </pattern>
          <linearGradient id="academy-ground" x2="1" y2="1">
            <stop stopColor="#102c35" />
            <stop offset="1" stopColor="#173d41" />
          </linearGradient>
        </defs>
        <rect width="960" height="600" rx="24" fill="url(#academy-ground)" />
        <rect width="960" height="600" rx="24" fill="url(#academy-grid)" />
        <rect
          x="20"
          y="20"
          width="920"
          height="560"
          rx="16"
          fill="none"
          stroke="#85b7ae"
          strokeOpacity=".24"
        />
        <path
          d="M35 270H925M35 530H925M315 30V565M645 30V565"
          fill="none"
          stroke="#7fa9a1"
          strokeWidth="48"
          strokeOpacity=".12"
        />
        <path
          d="M35 270H925M35 530H925M315 30V565M645 30V565"
          fill="none"
          stroke="#a6c1b7"
          strokeWidth="1"
          strokeDasharray="5 9"
          strokeOpacity=".25"
        />
        {[
          { x: 42, y: 45 },
          { x: 918, y: 45 },
          { x: 42, y: 305 },
          { x: 918, y: 305 },
          { x: 42, y: 563 },
          { x: 918, y: 563 },
        ].map((tree) => (
          <g key={`${tree.x}-${tree.y}`}>
            <circle cx={tree.x} cy={tree.y} r="17" fill="#225b50" />
            <circle cx={tree.x - 4} cy={tree.y - 3} r="10" fill="#307264" />
          </g>
        ))}
        {guides.map((guide) => (
          <g key={guide.id}>
            <rect
              x={guide.building.x + 4}
              y={guide.building.y + 7}
              width={guide.building.width}
              height={guide.building.height}
              rx="12"
              fill="#051c25"
              opacity=".55"
            />
            <rect
              {...guide.building}
              rx="12"
              fill="#e3eae1"
              stroke="#90a9a1"
              strokeWidth="2"
            />
            <rect
              x={guide.building.x}
              y={guide.building.y}
              width={guide.building.width}
              height="9"
              rx="4"
              fill="#63b5a2"
            />
            <text
              x={guide.building.x + 17}
              y={guide.building.y + 37}
              fill="#507169"
              fontSize="13"
              fontWeight="700"
              letterSpacing="2"
            >
              DISTRICT {guide.mark}
            </text>
            <text
              x={guide.building.x + 17}
              y={guide.building.y + 65}
              fill="#173a3e"
              fontSize="16"
              fontWeight="700"
            >
              {guide.location === 'Compliance Inspector'
                ? 'Inspector’s Office'
                : guide.location}
            </text>
            <path
              d={`M${guide.x - 10} ${guide.building.y + guide.building.height}v-20h20v20`}
              fill="#8baba1"
            />
            {nearbyId === guide.id && (
              <circle
                cx={guide.x}
                cy={guide.y}
                r="31"
                stroke="#91ead2"
                strokeWidth="2"
                fill="#91ead2"
                fillOpacity=".1"
              />
            )}
            <circle
              cx={guide.x}
              cy={guide.y}
              r="18"
              fill="#14333b"
              stroke="#78cbb6"
              strokeWidth="2"
            />
            <text
              x={guide.x}
              y={guide.y + 5}
              textAnchor="middle"
              fill="#c3f1df"
              fontSize="13"
              fontWeight="700"
            >
              {guide.name[0]}
            </text>
            <text
              x={guide.x}
              y={guide.y + 39}
              textAnchor="middle"
              fill="#d0e4dc"
              fontSize="12"
            >
              {guide.name}
            </text>
          </g>
        ))}
        <g
          className="academy-player"
          transform={`translate(${position.x} ${position.y})`}
        >
          <circle r="20" fill="#e9bc72" fillOpacity=".2" />
          <circle r="11" fill="#f7d694" stroke="#fff6d6" strokeWidth="3" />
          <path d="M-4 1L0-5L4 1Z" fill="#755525" />
        </g>
        <text x="55" y="563" fill="#8db8ad" fontSize="11" letterSpacing="2">
          ESTA ACADEMY / EDUCATIONAL CAMPUS
        </text>
      </svg>
      <span className="academy-map-badge">
        Practice world <span>•</span> No live records
      </span>
    </div>
  );
});
