const StatusBit = {
    POWER:      1 << 0,
    TOO_COLD:   1 << 1,  
    TOO_HOT: 1 << 2, 
    CONTROL_ERROR: 1 << 3, 
    MAINTENANCE: 1 << 4,   
    
  } as const;

  const statusLabels: Record<number, string> = {
    [StatusBit.POWER]: 'Device Has Power Issues',
    [StatusBit.TOO_COLD]: 'Too Cold',
    [StatusBit.TOO_HOT]: 'Too Hot',
    [StatusBit.CONTROL_ERROR]: 'Control error',
    [StatusBit.MAINTENANCE]: 'Requires maintenance',
  };

  export function getStatusFlags(status: number | null): string[] {
    if (status === null || status === undefined) return [];
    const flags: string[] = [];
    const bits = [
      StatusBit.POWER,
      StatusBit.TOO_COLD,
      StatusBit.TOO_HOT,
      StatusBit.CONTROL_ERROR,
      StatusBit.MAINTENANCE,
    ];
    for (const bit of bits) {
      if ((status & bit) !== 0) {
        flags.push(statusLabels[bit] ?? `0x${bit.toString(16)}`);
      }
    }
    return flags;
  }

  export function formatStatus(status: number | null): string {
    const flags = getStatusFlags(status);
    if (status === null) return '--';
    if (flags.length === 0) return 'Running smoothly';
    return flags.join(', ');
  }
