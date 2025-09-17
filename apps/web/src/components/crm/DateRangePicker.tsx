'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const predefinedRanges = [
  {
    label: 'Sot',
    getValue: () => {
      const today = new Date().toISOString().split('T')[0];
      return { startDate: today, endDate: today };
    }
  },
  {
    label: '7 ditët e fundit',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { 
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      };
    }
  },
  {
    label: '30 ditët e fundit',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return { 
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      };
    }
  },
  {
    label: '3 muajt e fundit',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      return { 
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      };
    }
  },
  {
    label: 'Viti aktual',
    getValue: () => {
      const year = new Date().getFullYear();
      return { 
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`
      };
    }
  },
  {
    label: 'Viti i kaluar',
    getValue: () => {
      const year = new Date().getFullYear() - 1;
      return { 
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`
      };
    }
  }
];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.startDate);
  const [customEnd, setCustomEnd] = useState(value.endDate);

  const handlePredefinedRange = (range: typeof predefinedRanges[0]) => {
    const dates = range.getValue();
    onChange({
      ...dates,
      label: range.label
    });
    setIsOpen(false);
  };

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      onChange({
        startDate: customStart,
        endDate: customEnd,
        label: 'Periudhë e personalizuar'
      });
      setIsOpen(false);
    }
  };

  const formatDateRange = () => {
    if (value.label && value.label !== 'Periudhë e personalizuar') {
      return value.label;
    }
    
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    
    if (value.startDate === value.endDate) {
      return start.toLocaleDateString('sq-AL');
    }
    
    return `${start.toLocaleDateString('sq-AL')} - ${end.toLocaleDateString('sq-AL')}`;
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          color: '#374151',
          cursor: 'pointer',
          minWidth: '200px'
        }}
      >
        <CalendarIcon style={{ width: '1rem', height: '1rem' }} />
        <span style={{ flex: 1, textAlign: 'left' }}>
          {formatDateRange()}
        </span>
        <ChevronDownIcon 
          style={{ 
            width: '1rem', 
            height: '1rem',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '0.25rem',
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              zIndex: 20,
              minWidth: '300px',
              padding: '1rem'
            }}
          >
            {/* Predefined Ranges */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>
                Periudha të shpejta
              </h4>
              <div style={{ display: 'grid', gap: '0.25rem' }}>
                {predefinedRanges.map((range, index) => (
                  <button
                    key={index}
                    onClick={() => handlePredefinedRange(range)}
                    style={{
                      padding: '0.5rem',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.75rem' }}>
                Periudhë e personalizuar
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Nga data
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Deri në datë
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
              
              <button
                onClick={handleCustomRange}
                disabled={!customStart || !customEnd || customStart > customEnd}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: (!customStart || !customEnd || customStart > customEnd) ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: (!customStart || !customEnd || customStart > customEnd) ? 'not-allowed' : 'pointer'
                }}
              >
                Apliko periudhën
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
