export default function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-line bg-white px-4 py-2.5 text-ink placeholder:text-muted focus:border-brand focus:outline-none ${className}`}
    />
  );
}
