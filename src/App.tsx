import React from 'react'
import Command from './Command';
import EyeTracker from './eyeTracker';
import TempChart, {type TempChartData} from './tempChart';
import { formatStatus } from './statusBits';
import { calculateCRC16CCITTFalse } from './crc16';
import {float16ToNumber} from './float16toNumber';
import { getStatusString } from './states';
import {getTemperatureColor} from './temperatureToColor';
import ExpressionChange from './expressionChange';


const ws = new WebSocket('wss://polarnode.alsoft.nl.');
ws.binaryType = 'arraybuffer';

function App() {

  const [csvLog, setCSVLog] = React.useState<{ 
    time: number;
    id: number;
    temp: number; 
    fanState: number;
    heaterState: number
    batteryLevel: number | null; 
    status: number
  }[]>
  ([]);

  const [tempChartData, setTempChartData] = React.useState<TempChartData>([]);

  const [devModeEnabled, setDevModeEnabled] = React.useState(true);

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

        setCSVLog((prev) => {
          const logs = {
            time: Date.now(),
            id,
            temp,
            fanState,
            heaterState,
            batteryLevel: batteryLevel ?? (prev.length > 0 ? prev[prev.length - 1].batteryLevel : 100),
            status,
          };
          return [...prev, logs].slice(-50);
        });

        setTempChartData((prev) => {
          const currentTime = Date.now();
          const cutoff = currentTime - 60_000;
          const next = [...prev.filter((p) => p.time >= cutoff), { time: currentTime, temp }];
          return next;
        });

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
      <header className="App">
      </header>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 w-full max-w-md">
        <div className="space-y-2">

          {!devModeEnabled ? ( 
            <div className="flex justify-between items-center">
            <span className="text-gray-300">ID:</span>
            <span className="text-white font-mono">{sensorData.id !== null ? sensorData.id : '--'}</span>
          </div>) : (<p className="text-gray-400 text-sm"></p>)}
          

          <div className="flex flex-col items-center space-y-4">

          <div className='border-10 border-gray-700'> 
            <div className="text-white font-mono text-2xl">{sensorData.temp}°C</div>
          </div>
         
          <div className="relative w-full h-70 rounded-md border border-gray-600"
          style={{backgroundColor: sensorData.temp !== null ? getTemperatureColor(sensorData.temp) : 'transparent',}}>      
          <div className="abolute inset-0 flex justify-center p-6"> <EyeTracker/>  </div>
          <ExpressionChange temp={sensorData.temp}/>
         
          </div>
          </div>


          <div className="flex flex-row justify-center gap-50 border-t border-gray-700 pt-3">
            <div className="flex flex-col items-center">
              <span className="text-gray-300 text-xl">Fan</span>
              <span className="text-white font-mono">{getStatusString(sensorData.fanState)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-300 text-xl">Heater</span>
              <span className="text-white font-mono">{getStatusString(sensorData.heaterState)}</span>
            </div>
          </div>

          <TempChart data={tempChartData} />

          <div className="space-y-2">
          {sensorData.batteryLevel !== null && (
            <div className="relative w-full h-10 bg-gray-700 rounded overflow-hidden">
              <div  className={`h-full bg-green-500 transition-all duration-500 ${sensorData.batteryLevel < 10 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, sensorData.batteryLevel))}%` }}/>
              <span className="absolute inset-0 flex items-center justify-center text-s font-mono text-white">
              {sensorData.batteryLevel === 0 ? 'No Battery' : `${sensorData.batteryLevel}%`}
              </span>
            </div>
            )}
          </div>

          

          <div className="flex justify-center items-center border-t border-gray-700 pt-4">
            <span className="text-white font-mono">{formatStatus(sensorData.status)}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-700">
          <Command ws={ws}  fanState={sensorData.fanState} heaterState={sensorData.heaterState} temp={sensorData.temp} csvLog={csvLog} devModeEnabled={devModeEnabled} setDevModeEnabled={setDevModeEnabled}  />
        </div>
        
      </div>
    </div>
  );
}

export default App