import { useEffect} from "react";
import { calculateCRC16CCITTFalse } from "./crc16";

interface CommandProps {
  ws: WebSocket;
  fanState: number | null;
  heaterState: number | null;
  temp: number | null;
  csvLog: csvLog[];
  devModeEnabled: boolean;
  setDevModeEnabled: (enabled: boolean) => void;
}

type csvLog = {
  time: number;
  id: number;
  temp: number; 
  fanState: number;
  heaterState: number;
  batteryLevel: number | null; 
  status: number
};

//this guys basically does the precision controls
//target is the where we wanna keep the temp
//band is interval where do nothing and stage_gap is the gap between the low and high stages
//this way we avoid rapid switching and keep the temp stable around the target
//you can adjust these values to make it more or less aggressive in controlling the temp
const target = 5;
const band = 1;
const stage_gap = 2;


function downloadCsv(log: csvLog[]) {
  if (log.length === 0) return;
  const header = "time;id;temperature;fanState;heaterState;batteryLevel;statusbit\r\n";
  const rows = log.map((r) =>
    [new Date(r.time).toLocaleString(), r.id, Number(r.temp).toFixed(5).replace(".", ","), r.fanState, r.heaterState, r.batteryLevel ?? "", r.status].join(";")
  ).join("\r\n");
  const csv = "\uFEFF" + header + rows;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `polarnode-${new Date().toISOString().slice(0, 19).replace("T", "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Command({ ws, fanState, heaterState, temp, csvLog, devModeEnabled, setDevModeEnabled}: CommandProps) {
 

  const sendPacket = (command: number, payload: number) => {
    if (ws.readyState !== WebSocket.OPEN) return;

    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);

    view.setUint8(0, 0xBA);    
    view.setUint8(1, command);  
    view.setUint8(2, payload);   

    const crcData = new Uint8Array(buffer, 0, 3);
    const crc = calculateCRC16CCITTFalse(crcData);
    view.setUint16(3, crc, false); 

    ws.send(buffer);
  };

  useEffect(() => {
    if (!devModeEnabled) return;
    if (temp === null) return;
    if (fanState === null || heaterState === null) return;
    if (ws.readyState !== WebSocket.OPEN) return;

    let desiredFan = 0;
    let desiredHeater = 0;

   
    if (temp <= target - band - stage_gap) {
      desiredHeater = 2;
    } else if (temp <= target - band) {
      desiredHeater = 1;
    }

   
    else if (temp >= target + band + stage_gap) {
      desiredFan = 2;
    } else if (temp >= target + band) {
      desiredFan = 1;
    }
  
    if (desiredFan !== fanState) {
      sendPacket(0x01, desiredFan);
    }

    if (desiredHeater !== heaterState) {
      sendPacket(0x02, desiredHeater);
    }

  }, [temp, fanState, heaterState]);

  const sendCommand = (commandName: string) => {
    if (ws.readyState === WebSocket.OPEN) {
        const buffer = new ArrayBuffer(5);
        const view = new DataView(buffer);
        
        const header = 0xBA;
        let command: number;
        let payload = 0;
        
        if (commandName === 'Fan') {
            command = 0x01;
            payload = ((fanState ?? 0) + 1) %3; 
        } else if (commandName === 'Heater') {
            command = 0x02;
            payload = ((heaterState ?? 0) + 1) %3;
        } else {
            console.error('Unknown command');
            return;
        }
        
        view.setUint8(0, header);
        view.setUint8(1, command);
        view.setUint8(2, payload);
        
        const crcData = new Uint8Array(buffer, 0, 3);
        const crc = calculateCRC16CCITTFalse(crcData);
        view.setUint16(3, crc, false);
        
        ws.send(buffer);
    } else {
        console.error('WebSocket not open');
    }

    
};

  return (
    <div className="space-y-4">
      
      <div className="flex flex-col items-center justify-between gap-4">
        <span className="text-gray-300">Dev Mode</span>
        <div className="flex rounded-lg border border-gray-600 overflow-hidden">
          <button
            type="button"
            onClick={() => setDevModeEnabled(true)}
            className={`px-3 py-1.5 text-sm font-medium ${devModeEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          >
            Off
          </button>
          <button
            type="button"
            onClick={() => setDevModeEnabled(false)}
            className={`px-3 py-1.5 text-sm font-medium ${!devModeEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
          >
            On
          </button>
        </div>
      </div>

      {devModeEnabled ? (
        <p className="text-gray-400 text-sm"></p>
      ) : (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => sendCommand('Fan')}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Fan
          </button>
          <button
            type="button"
            onClick={() => sendCommand('Heater')}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700">
            Heater
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(csvLog)}
            disabled={csvLog.length === 0}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">
            Download CSV
            </button>
        </div>
      
      )}
    </div>
  );
}

export default Command;