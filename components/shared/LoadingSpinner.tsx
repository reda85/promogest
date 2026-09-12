export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c9773f] border-t-transparent" />
      {label && <p className="text-sm text-[#888888]">{label}</p>}
    </div>
  );
}
