'use client';

import React, { useState } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

interface DateFilterProps {
  onApplyFilter: (startDate: Date, endDate: Date) => void;
}

// Helper to format date as YYYY-MM-DD for input[type="date"]
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper to format date for display
const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export default function DateFilter({ onApplyFilter }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setError('');
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setError('');
  };

  const handleApplyClick = () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Add a day to end date to include the full end date in the filter
    // (since date inputs don't include time, and we want the full end date)
    end.setHours(23, 59, 59, 999);
    
    if (start > end) {
      setError('Start date cannot be after end date');
      return;
    }

    onApplyFilter(start, end);
    setIsOpen(false);
  };

  const formatDisplayDate = () => {
    if (!startDate && !endDate) return 'Select date range';
    
    if (startDate && !endDate) return `From: ${formatDateForDisplay(startDate)}`;
    
    return `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
  };

  // Use today as max date to prevent selecting future dates
  const today = formatDateForInput(new Date());

  return (
    <div className="date-filter">
      <button 
        className="date-filter-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <FaCalendarAlt className="calendar-icon" />
        <span>{formatDisplayDate()}</span>
      </button>
      
      {isOpen && (
        <div className="date-picker-dropdown">
          <h3 className="date-picker-title">Select Date Range</h3>
          
          <div className="date-inputs-container">
            <div className="date-input-group">
              <label htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                max={endDate || today}
                className="date-input"
              />
            </div>
            
            <div className="date-input-group">
              <label htmlFor="end-date">End Date</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate}
                max={today}
                className="date-input"
              />
            </div>
          </div>
          
          {error && <div className="date-filter-error">{error}</div>}
          
          <div className="selected-range-display">
            <div className="selected-date-item">
              <span className="date-label">Start:</span>
              <span className="date-value">
                {startDate ? formatDateForDisplay(startDate) : 'Not selected'}
              </span>
            </div>
            <div className="selected-date-item">
              <span className="date-label">End:</span>
              <span className="date-value">
                {endDate ? formatDateForDisplay(endDate) : 'Not selected'}
              </span>
            </div>
          </div>
          
          <div className="filter-actions">
            <button 
              className="apply-filter-button"
              onClick={handleApplyClick}
              disabled={!startDate || !endDate}
              type="button"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 