import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Grid,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { it } from 'date-fns/locale/it';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  eventsCount?: Record<string, number>; // date string -> count
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  onDateSelect,
  eventsCount = {},
}) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  const weekDays = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const days = getDaysInMonth();

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getEventCount = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return eventsCount[dateStr] || 0;
  };

  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <IconButton size="small" onClick={handlePrevMonth}>
          <ChevronLeft fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" fontWeight={600}>
          {format(currentMonth, 'MMMM yyyy', { locale: it })}
        </Typography>
        <IconButton size="small" onClick={handleNextMonth}>
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>

      {/* Week days header */}
      <Grid container spacing={0}>
        {weekDays.map((day, index) => (
          <Grid item xs={12 / 7} key={index}>
            <Box
              sx={{
                textAlign: 'center',
                py: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.7rem',
                }}
              >
                {day}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Days grid */}
      <Grid container spacing={0}>
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const eventCount = getEventCount(day);

          return (
            <Grid item xs={12 / 7} key={index}>
              <Box
                onClick={() => onDateSelect(day)}
                sx={{
                  textAlign: 'center',
                  py: 0.5,
                  cursor: 'pointer',
                  position: 'relative',
                  borderRadius: 1,
                  backgroundColor: isSelected
                    ? 'primary.main'
                    : isTodayDate
                    ? 'primary.light'
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: isSelected
                      ? 'primary.main'
                      : 'action.hover',
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: isSelected
                      ? 'primary.contrastText'
                      : isTodayDate
                      ? 'primary.contrastText'
                      : isCurrentMonth
                      ? 'text.primary'
                      : 'text.disabled',
                    fontWeight: isSelected || isTodayDate ? 600 : 400,
                    fontSize: '0.75rem',
                  }}
                >
                  {format(day, 'd')}
                </Typography>
                {eventCount > 0 && isCurrentMonth && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 2,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: isSelected
                        ? 'primary.contrastText'
                        : 'primary.main',
                    }}
                  />
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default MiniCalendar;
