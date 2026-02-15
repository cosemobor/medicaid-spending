interface InfoTipProps {
  text: string;
}

export default function InfoTip({ text }: InfoTipProps) {
  return (
    <span className="group relative ml-1 inline-flex cursor-help align-middle">
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-500 group-hover:bg-gray-300 group-hover:text-gray-700">
        ?
      </span>
      <span className="pointer-events-none invisible absolute bottom-full right-0 z-50 mb-1.5 w-52 rounded-md bg-gray-900 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white shadow-lg group-hover:visible">
        {text}
        <span className="absolute right-1.5 top-full border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  );
}
