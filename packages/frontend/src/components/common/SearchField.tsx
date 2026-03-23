import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, useMediaQuery, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function sanitizeInput(input: string): string {
  return input.replace(/[%_'\\]/g, '');
}

export default function SearchField({
  value,
  onChange,
  placeholder = 'Cerca...',
}: SearchFieldProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const sanitized = sanitizeInput(localValue);
      if (sanitized !== value) {
        onChange(sanitized);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  return (
    <TextField
      size="small"
      fullWidth={isMobile}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      sx={{ minWidth: { sm: 280 } }}
    />
  );
}
