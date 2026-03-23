import React from 'react';
import { Box, Typography, Tooltip, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { COLORI_STATO, LABELS_STATO } from '@planner-molino/shared';
import type { Prenotazione } from '@planner-molino/shared';

interface TimelineStripProps {
  prenotazioni: Prenotazione[];
}

const HOUR_START = 6;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
}

export default function TimelineStrip({ prenotazioni }: TimelineStripProps) {
  const navigate = useNavigate();

  // Filter to only those with start times, sort by time
  const sorted = prenotazioni
    .filter((p) => p.ora_inizio_prevista)
    .sort((a, b) => a.ora_inizio_prevista!.localeCompare(b.ora_inizio_prevista!));

  // Current time marker
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const nowPercent = ((currentHour - HOUR_START) / TOTAL_HOURS) * 100;
  const showNow = currentHour >= HOUR_START && currentHour <= HOUR_END;

  // Hour markers
  const hours = [];
  for (let h = HOUR_START; h <= HOUR_END; h += 2) {
    hours.push(h);
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
          <Typography variant="subtitle2">Timeline oggi</Typography>
          <Typography variant="caption" sx={{ color: '#A8A29E' }}>
            {sorted.length} prenotazioni
          </Typography>
        </Box>

        {sorted.length === 0 ? (
          <Box
            sx={{
              py: 3,
              textAlign: 'center',
              bgcolor: '#FAFAF9',
              borderRadius: 2,
              border: '1px dashed #E7E5E4',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Nessuna prenotazione oggi
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative' }}>
            {/* Hour grid */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              {hours.map((h) => (
                <Typography
                  key={h}
                  variant="caption"
                  sx={{
                    color: '#A8A29E',
                    fontSize: '0.625rem',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 500,
                    width: 0,
                    textAlign: 'center',
                    position: 'relative',
                    left: `${((h - HOUR_START) / TOTAL_HOURS) * 100}%`,
                  }}
                >
                  {String(h).padStart(2, '0')}
                </Typography>
              ))}
            </Box>

            {/* Track */}
            <Box
              sx={{
                position: 'relative',
                height: 40,
                bgcolor: '#FAFAF9',
                borderRadius: 2,
                border: '1px solid #F5F5F4',
                overflow: 'hidden',
              }}
            >
              {/* Grid lines */}
              {hours.map((h) => (
                <Box
                  key={h}
                  sx={{
                    position: 'absolute',
                    left: `${((h - HOUR_START) / TOTAL_HOURS) * 100}%`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    bgcolor: '#E7E5E4',
                    opacity: 0.5,
                  }}
                />
              ))}

              {/* Events */}
              {sorted.map((p) => {
                const startHour = parseTime(p.ora_inizio_prevista!);
                const endHour = p.ora_fine_prevista ? parseTime(p.ora_fine_prevista) : startHour + 1;
                const left = ((startHour - HOUR_START) / TOTAL_HOURS) * 100;
                const width = ((endHour - startHour) / TOTAL_HOURS) * 100;
                const color = COLORI_STATO[p.stato] || '#A8A29E';
                const clienteName = (p as Record<string, unknown>).cliente_ragione_sociale as string || '';

                return (
                  <Tooltip
                    key={p.id}
                    title={`${p.codice_prenotazione} - ${clienteName} (${LABELS_STATO[p.stato] || p.stato})`}
                    arrow
                  >
                    <Box
                      onClick={() => {
                        const base = p.tipologia === 'consegna' ? '/consegne' : '/produzione';
                        navigate(`${base}/prenotazioni/${p.id}`);
                      }}
                      sx={{
                        position: 'absolute',
                        left: `${Math.max(0, left)}%`,
                        width: `${Math.min(width, 100 - left)}%`,
                        minWidth: 6,
                        top: 4,
                        bottom: 4,
                        bgcolor: color,
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        px: 0.5,
                        overflow: 'hidden',
                        '&:hover': {
                          opacity: 0.85,
                          transform: 'scaleY(1.1)',
                          zIndex: 2,
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          color: '#fff',
                          fontSize: '0.5625rem',
                          fontWeight: 600,
                          fontFamily: '"JetBrains Mono", monospace',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1,
                        }}
                      >
                        {p.codice_prenotazione}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              })}

              {/* Now indicator */}
              {showNow && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${nowPercent}%`,
                    top: -2,
                    bottom: -2,
                    width: '2px',
                    bgcolor: '#DC2626',
                    zIndex: 3,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -1,
                      left: -3,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#DC2626',
                    },
                  }}
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
