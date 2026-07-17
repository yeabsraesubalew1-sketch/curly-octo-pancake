export function formatPeriodTime(p: number): string {
  const times = [
    '',
    '8:30 AM – 9:20 AM',
    '9:25 AM – 10:15 AM',
    '10:20 AM – 11:10 AM',
    '11:15 AM – 12:05 PM',
    '1:30 PM – 2:20 PM',
    '2:25 PM – 3:15 PM',
    '3:20 PM – 4:10 PM',
    '4:15 PM – 5:05 PM'
  ];
  return times[p] || '';
}

export function formatLunchBreakTime(): string {
  return '12:05 PM – 1:30 PM';
}
