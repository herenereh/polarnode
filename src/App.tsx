import React from 'react'
import Command from './Command';
import { formatStatus } from './statusBits';
import { calculateCRC16CCITTFalse } from './crc16';
import {float16ToNumber} from './float16toNumber';
import { getStatusString } from './states';
import {getTemperatureColor} from './temperatureToColor';

const ws = new WebSocket('wss://polarnode.alsoft.nl.');
ws.binaryType = 'arraybuffer';

function App() {
  const [sensorData, setSensorData] = React.useState<{
    id: number | null;
    temp: number | null;
    fanState: number | null;
    heaterState: number | null;
    batteryLevel: number | null;
    status: number | null;
  }>
  ({
    id: null,
    temp: null,
    fanState: null,
    heaterState: null,
    batteryLevel: 100,
    status: null,
  });
  
  React.useEffect(
    () => {
      ws.onopen = () => {
        console.log('WebSocket Client Connected');
      };
       
      ws.onmessage = (message) => {
        const buffer = message.data as ArrayBuffer;
        const length = buffer.byteLength;
      
        if (length !== 10 && length !== 11) return;
      
        const view = new DataView(buffer);
        const bytes = new Uint8Array(buffer);
      
        const header = view.getUint8(0);
        if (header !== 0xAB) return;
      
        const hasBattery = length === 11;
        const crcOffset = length - 2;
      
        const dataBytes = bytes.slice(0, crcOffset);
        const receivedCRC = view.getUint16(crcOffset, false);
        const calculatedCRC = calculateCRC16CCITTFalse(dataBytes);
      
        if (receivedCRC !== calculatedCRC) {
          console.error("Wrong data received");
          return;
        }
      
        const id = view.getUint16(1, true);
        const temp = float16ToNumber(view.getUint16(3, true));
        const fanState = view.getUint8(5);
        const heaterState = view.getUint8(6);
        
        let batteryLevel: number | null = null;
        if (hasBattery) {
          batteryLevel = view.getUint8(7);
        }
        const status = view.getUint8(hasBattery ? 8 : 7);
        console.log('Battery Level:', batteryLevel);

        setSensorData((prev) => ({
          id, 
          temp,
          fanState,
          heaterState,
          status,
          batteryLevel:
            batteryLevel !== null ? batteryLevel : prev.batteryLevel,
        }));
        console.log('Received:', { header, id, temp, fanState, heaterState, batteryLevel, status, calculatedCRC });
      };
    }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <header className="App mb-8">
        <h1 className="text-3xl font-bold underline text-white hover:text-blue-500">Polar Node</h1>
      </header>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">ID:</span>
            <span className="text-white font-mono">{sensorData.id !== null ? sensorData.id : '--'}</span>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <div className="text-white font-mono">{sensorData.temp}°C</div>
          <div className="w-full h-70 rounded-md border border-gray-600"
          style={{backgroundColor: sensorData.temp !== null ? getTemperatureColor(sensorData.temp) : 'transparent',}}>      
          </div>
          
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-300">Fan:</span>
            <span className="text-white font-mono">{getStatusString(sensorData.fanState)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Heater:</span>
            <span className="text-white font-mono">{getStatusString(sensorData.heaterState)}</span>
          </div>

          <div className="space-y-1">
          {sensorData.batteryLevel !== null && (
            <div className="relative w-full h-10 bg-gray-700 rounded overflow-hidden">
              <div  className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, sensorData.batteryLevel))}%` }}/>
              <span className="absolute inset-0 flex items-center justify-center text-s font-mono text-white">
              {sensorData.batteryLevel}%
              </span>
            </div>
            )}
          </div>

          <div className="flex justify-center items-center">
            <span className="text-white font-mono">{formatStatus(sensorData.status)}</span>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-700">
          <Command ws={ws}  fanState={sensorData.fanState} heaterState={sensorData.heaterState} temp={sensorData.temp} />
        </div>
      </div>
    </div>
  );
}

export default App