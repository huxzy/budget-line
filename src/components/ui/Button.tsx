import Link from "next/link";
import { cn } from "@/lib/cn";

const VARIANTS = {
  clay: "bg-clay text-on-clay hover:bg-clay-deep shadow-rail",
  marigold: "bg-marigold text-clay hover:bg-marigold-deep hover:text-on-clay",
  pill: "bg-card text-ink border border-hairline hover:border-hairline-strong",
  ghost: "bg-transparent text-ink hover:bg-hairline",
} as const;

const SIZES = {
  md: "px-4 py-2 text-[14px]",
  lg: "px-6 py-3.5 text-[16px]",
} as const;

type Base = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = Base & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = Base & { href: string };

function classes({ variant = "pill", size = "md", className }: Omit<Base, "children">) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button(props: ButtonProps | LinkProps) {
  if ("href" in props && props.href) {
    const { href, children, variant, size, className } = props;
    return (
      <Link href={href} className={classes({ variant, size, className })}>
        {children}
      </Link>
    );
  }
  const { variant, size, className, children, ...rest } = props as ButtonProps;
  return (
    <button type="button" className={classes({ variant, size, className })} {...rest}>
      {children}
    </button>
  );
}
