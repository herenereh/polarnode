import "chart.js/auto";
import { Line } from "react-chartjs-2";
import { getTemperatureColor } from "./temperatureToColor";


export type TempChartData = { time: number; temp: number }[];

function TempChart({ data }: { data: TempChartData }) {
    const chartData = {
        labels: data.map((item) => new Date(item.time).toLocaleTimeString(['en-US'], { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
        datasets: [
            {
                label: "Temperature (°C)",
                data: data.map((item) => item.temp),
            },
        ],
    };
    const chartOptions = {
        cubicInterpolationMode: 'monotone',
        responsive: true,
        backgroundColor: data.map((item) => getTemperatureColor(item.temp)),
        hoverBackgroundColor: data.map((item) => getTemperatureColor(item.temp)),
        borderColor: data.map((item) => getTemperatureColor(item.temp)),
        pointHoverRadius: 10,
        scales: {
            x: {
                display: false,
            },
        },
    };
    if (data.length === 0) return <div className="text-gray-400 text-sm">No data yet</div>; 
    return <div className="w-full h-full border border-gray-700 rounded-md p-2">
        <Line data={chartData} options={chartOptions} />
    </div>;
}

export default TempChart;