import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

const MiniChart = ({ data, color }) => {
  return (
    <div style={{ width: "100%", height: 60 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
          {/* Hidden YAxis to auto-scale the chart nicely */}
          <YAxis domain={['auto', 'auto']} hide />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniChart;