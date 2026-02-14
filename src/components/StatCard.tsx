interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
  detailColor?: string;
  subValue?: string;
}

export default function StatCard({ label, value, detail, detailColor, subValue }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-sm sm:px-4 sm:py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
      {subValue && (
        <p className="mt-0.5 text-xs text-gray-500">{subValue}</p>
      )}
      {detail && (
        <p className={`mt-0.5 truncate text-xs ${detailColor ?? 'text-gray-500'}`}>
          {detail}
        </p>
      )}
    </div>
  );
}
