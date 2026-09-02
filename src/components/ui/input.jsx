import React from "react";
import Label from "./label";

const Input = React.forwardRef(
  (
    {
      id,
      className = "",
      error,
      label,
      helperText,
      fullWidth = true,
      variant = "default", // "default", "outlined", "filled"
      size = "md",
      startIcon,
      endIcon,
      ...props
    },
    ref
  ) => {
    const sizes = {
      sm: "px-3 py-2 text-sm h-9",
      md: "px-4 py-3 text-base h-12",
      lg: "px-5 py-4 text-lg h-14",
    };

    const variants = {
      default: "border-line bg-transparent text-ink placeholder:text-muted hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20",
      outlined: "border-2 border-line bg-transparent text-ink placeholder:text-muted hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20",
      filled: "border-transparent bg-surface-2 text-ink placeholder:text-muted hover:bg-line/30 focus:bg-surface focus:border-2 focus:border-primary focus:ring-2 focus:ring-primary/20",
    };

    const errorClasses = error
      ? "border-red-500 bg-red-50 text-red-900 placeholder:text-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      : "";

    const inputClasses = `
      ${fullWidth ? "w-full" : ""}
      ${sizes[size]}
      ${error ? errorClasses : variants[variant]}
      rounded-lg border transition-all duration-200 outline-none
      disabled:opacity-50 disabled:cursor-not-allowed
      ${startIcon ? "pl-10" : ""}
      ${endIcon ? "pr-10" : ""}
      ${className}
    `;

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <Label htmlFor={id} className="mb-1.5" required={props.required}>
            {label}
          </Label>
        )}

        <div className="relative">
          {startIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{startIcon}</div>}

          <input id={id} ref={ref} className={inputClasses} aria-invalid={!!error} {...props} />

          {endIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{endIcon}</div>}
        </div>

        {helperText && !error && <p className="mt-1 text-xs text-muted">{helperText}</p>}
        {error && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
