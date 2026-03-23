import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { Typography, Card, CardContent, Box } from '@mui/material';
import { COLORI_STATO, LABELS_STATO } from '@planner-molino/shared';
import type { StoricoStato } from '@planner-molino/shared';
import { format, parseISO } from 'date-fns';

interface StoricoTimelineProps {
  storico: StoricoStato[];
}

function formatTimestamp(ts: string): string {
  try {
    return format(parseISO(ts), 'dd/MM/yyyy HH:mm');
  } catch {
    return ts;
  }
}

export default function StoricoTimeline({ storico }: StoricoTimelineProps) {
  // Reverse chronological
  const sorted = [...storico].sort(
    (a, b) =>
      new Date(b.timestamp_cambio).getTime() -
      new Date(a.timestamp_cambio).getTime()
  );

  if (sorted.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Storico Stati
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nessuna transizione registrata.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Storico Stati
        </Typography>
        <Timeline
          sx={{
            p: 0,
            m: 0,
            '& .MuiTimelineItem-root:before': { flex: 0, padding: 0 },
          }}
        >
          {sorted.map((entry, index) => {
            const color = COLORI_STATO[entry.stato_nuovo] || '#9E9E9E';
            return (
              <TimelineItem key={entry.id}>
                <TimelineSeparator>
                  <TimelineDot
                    sx={{
                      bgcolor: color,
                      boxShadow: 'none',
                    }}
                  />
                  {index < sorted.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent sx={{ pb: 2 }}>
                  <Typography variant="body1" fontWeight="bold">
                    {LABELS_STATO[entry.stato_nuovo] || entry.stato_nuovo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimestamp(entry.timestamp_cambio)}
                  </Typography>
                  {entry.note && (
                    <Typography
                      variant="body2"
                      sx={{ fontStyle: 'italic', mt: 0.5 }}
                    >
                      {entry.note}
                    </Typography>
                  )}
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </CardContent>
    </Card>
  );
}
