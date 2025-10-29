import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ExpenseChartProps {
  data: { category: string; total: number }[];
}

const COLORS = [
  'hsl(217, 83%, 56%)', // primary
  'hsl(160, 84%, 39%)', // success
  'hsl(0, 72%, 60%)',   // destructive
  'hsl(45, 93%, 47%)',  // yellow
  'hsl(280, 65%, 60%)', // purple
  'hsl(340, 75%, 55%)', // pink
  'hsl(200, 80%, 50%)', // cyan
  'hsl(30, 80%, 55%)',  // orange
];

const ExpenseChart = ({ data }: ExpenseChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Nenhum gasto registrado
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.category,
    value: item.total,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value as number)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpenseChart;
