const variants = {
  primary: "bg-brand text-white hover:bg-brand-dark disabled:bg-line disabled:text-muted",
  secondary: "bg-white text-ink border border-line hover:border-ink/40",
};

export default function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex shrink-0 whitespace-nowrap items-center justify-center rounded-lg px-5 py-2.5 font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
