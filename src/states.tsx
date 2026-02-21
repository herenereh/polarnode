export const Status = {
    Off: 0,
    Low: 1,
    High: 2,
  } as const;

  export type Status = (typeof Status)[keyof typeof Status];

  const statusLabels: Record<Status, string> = {
    [Status.Off]: 'Off',
    [Status.Low]: 'Low',
    [Status.High]: 'High',
  };
  
  export function getStatusString(value: number | null): string {
    if (value === null || value === undefined) return '--';
    return statusLabels[value as Status];
  }