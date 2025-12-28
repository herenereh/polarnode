
interface CommandProps {
    ws: WebSocket;
    fanState: number | null;
    heaterState: number | null;
}

function Command({ ws, fanState, heaterState }: CommandProps) {
    
   
    const calculateCheckSum = (header: number, command: number, payload: number): number => {
        return (header ^ command ^ payload) & 0xFF;
    }

    const sendCommand = (commandName: string) => {
        if (ws.readyState === WebSocket.OPEN) {
            const buffer = new ArrayBuffer(4);
            const view = new DataView(buffer);
            
            const header = 0xBA;
            let command: number;
            let payload: number;
            
            if (commandName === 'Fan') {
                command = 0x01;
                payload = (fanState === 1) ? 0 : 1;
            } else if (commandName === 'Heater') {
                command = 0x02;
                payload = (heaterState === 1) ? 0 : 1;
            } else {
                console.error('Unknown command');
                return;
            }
            
            view.setUint8(0, header);
            view.setUint8(1, command);
            view.setUint8(2, payload);
            
            const checkSum = calculateCheckSum(header, command, payload);
            view.setUint8(3, checkSum);
            
            ws.send(buffer);
        } else {
            console.error('WebSocket not open');
        }
    };

    
    
    return (
        <div className="flex flex-row items-center justify-center gap-4">
            <button 
                onClick={() => sendCommand('Fan')} 
                className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-200 hover:scale-105 active:scale-95 transition-all duration-200 font-medium shadow-md hover:shadow-lg">
                Fan
            </button>
            <button 
                onClick={() => sendCommand('Heater')} 
                className="bg-red-500 text-white p-2 rounded-md hover:bg-red-200 hover:scale-105 active:scale-95 transition-all duration-200 font-medium shadow-md hover:shadow-lg">
                Heater
            </button>
        </div>
    )
}
export default Command;

