interface AccrualData {
  accrued: number;
  used: number;
  remaining: number;
  maxAccrual?: number;
}

interface AccrualChartProps {
  data: AccrualData;
  size?: number;
  showLegend?: boolean;
}

export function AccrualChart({
  data,
  size = 200,
  showLegend = true,
}: AccrualChartProps) {
  const { accrued, used, remaining } = data;
  const total = accrued;

  // Calculate percentages
  const usedPercentage = total > 0 ? (used / total) * 100 : 0;
  const remainingPercentage = total > 0 ? (remaining / total) * 100 : 0;

  // SVG circle parameters
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dash arrays for segments
  const usedDashArray = (usedPercentage / 100) * circumference;
  const remainingDashArray = (remainingPercentage / 100) * circumference;

  // Rotation offsets
  const usedOffset = 0;
  const remainingOffset = -usedDashArray;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 transform">
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="16"
            className="text-gray-200 dark:text-gray-700"
          />

          {/* Used segment (red) */}
          {used > 0 && (
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="16"
              strokeDasharray={`${usedDashArray} ${circumference}`}
              strokeDashoffset={usedOffset}
              className="text-red-500 transition-all duration-500"
              strokeLinecap="round"
            />
          )}

          {/* Remaining segment (green) */}
          {remaining > 0 && (
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="16"
              strokeDasharray={`${remainingDashArray} ${circumference}`}
              strokeDashoffset={remainingOffset}
              className="text-green-500 transition-all duration-500"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {accrued}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Hours Accrued
          </div>
        </div>
      </div>

      {showLegend && (
        <div className="grid w-full max-w-xs grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded bg-green-500"></div>
            <div className="text-sm">
              <div className="font-semibold text-gray-900 dark:text-white">
                {remaining} hrs
              </div>
              <div className="text-gray-500 dark:text-gray-400">Remaining</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded bg-red-500"></div>
            <div className="text-sm">
              <div className="font-semibold text-gray-900 dark:text-white">
                {used} hrs
              </div>
              <div className="text-gray-500 dark:text-gray-400">Used</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AccrualProgressBarProps {
  data: AccrualData;
}

export function AccrualProgressBar({ data }: AccrualProgressBarProps) {
  const { accrued, used, remaining } = data;
  const total = accrued;

  const usedPercentage = total > 0 ? (used / total) * 100 : 0;
  const remainingPercentage = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
        <span>Sick Time Balance</span>
        <span>{accrued} hours total</span>
      </div>

      <div className="flex h-8 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="flex items-center justify-center bg-green-500 text-xs font-semibold text-white transition-all duration-500"
          style={{ width: `${remainingPercentage}%` }}
        >
          {remaining > 0 && <span>{remaining} left</span>}
        </div>
        <div
          className="flex items-center justify-center bg-red-500 text-xs font-semibold text-white transition-all duration-500"
          style={{ width: `${usedPercentage}%` }}
        >
          {used > 0 && <span>{used} used</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Available: </span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {remaining} hrs
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Used: </span>
          <span className="font-semibold text-red-600 dark:text-red-400">
            {used} hrs
          </span>
        </div>
      </div>
    </div>
  );
}
