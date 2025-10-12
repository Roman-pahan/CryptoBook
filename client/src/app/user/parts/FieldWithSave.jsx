// src/app/user/parts/FieldWithSave.jsx
"use client";
import { FormField, Input, Button } from "semantic-ui-react";

export default function FieldWithSave({
  label,
  placeholder,
  value,
  onChange,
  buttonText,
  method,
  name,
}) {
  return (
    <>
      <FormField
        control={Input}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        name={name}
      />
      <Button type="submit" data-method={method} data-name={name} primary>
        {buttonText}
      </Button>
    </>
  );
}
