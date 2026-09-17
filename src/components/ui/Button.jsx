import React from "react";

const Button = React.forwardRef(
  (
    {
      children,
      disabled = false,
      loading = false,
      onClick,
      variant = "primary",
      size = "md",
      className = "",
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const variants = {
      primary: "bg-primary hover:bg-primary-alt text-white focus:ring-2 focus:ring-primary/30",
      secondary: "bg-secondary hover:bg-secondary/90 text-white focus:ring-2 focus:ring-secondary/30",
      outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/5",
      ghost: "bg-transparent text-primary hover:bg-primary/10",
      danger: "bg-red-600 hover:bg-red-700 text-white",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onClick={onClick}
        className={`inline-flex items-center justify-center rounded-lg font-medium shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {loading && (
          <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
