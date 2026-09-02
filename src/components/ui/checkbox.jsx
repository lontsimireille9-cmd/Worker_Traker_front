import React, { forwardRef, useEffect, useRef } from "react";
import PropTypes from "prop-types";

const Checkbox = forwardRef(function Checkbox(props, ref) {
  const {
    id,
    name,
    value,
    checked,
    defaultChecked,
    onChange,
    indeterminate = false,
    disabled = false,
    label,
    className = "",
    required = false,
    ariaLabel,
    ...rest
  } = props;

  const internalRef = useRef(null);
  const inputRef = ref || internalRef;

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate, inputRef]);

  const isChecked = checked !== undefined ? checked : defaultChecked;

  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 select-none ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`}
    >
      <span
        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
          indeterminate || isChecked ? "bg-primary border-primary" : "bg-white border-line"
        }`}
      >
        <input
          id={id}
          ref={inputRef}
          type="checkbox"
          name={name}
          value={value}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel}
          className="absolute h-0 w-0 opacity-0"
          {...rest}
        />
        {indeterminate ? (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <rect x="1" y="4.2" width="8" height="1.6" fill="#fff" />
          </svg>
        ) : isChecked ? (
          <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M10.3 3.1L4.9 8.5 1.7 5.3" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
});

Checkbox.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.any,
  checked: PropTypes.bool,
  defaultChecked: PropTypes.bool,
  onChange: PropTypes.func,
  indeterminate: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.node,
  className: PropTypes.string,
  required: PropTypes.bool,
  ariaLabel: PropTypes.string,
};

export default Checkbox;
