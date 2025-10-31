export function formatPostTime(createdAt: string | Date): string {
  const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  if (!(d instanceof Date) || isNaN(d.getTime())) return '';
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));

  if (diffSec < 15) return 'recente';
  if (diffSec < 90) return 'há pouco tempo';

  const minutes = Math.floor(diffSec / 60);
  if (diffSec < 3600)
    return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;

  const hours = Math.floor(diffSec / 3600);
  if (diffSec < 7200) return 'há uma hora';
  if (diffSec < 86400) return `há ${hours} horas`;

  // Older: show absolute time
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `${hh}:${mm}`;

  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mo} ${hh}:${mm}`;
}
