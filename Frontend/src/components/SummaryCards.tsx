import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { Summary } from '@/pages/Dashboard';

interface SummaryCardsProps {
  summary: Summary;
}

const SummaryCards = ({ summary }: SummaryCardsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="shadow-card transition-smooth hover:shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Renda Mensal</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(summary.income)}
          </div>
          <p className="text-xs text-muted-foreground">Total disponível</p>
        </CardContent>
      </Card>

      <Card className="shadow-card transition-smooth hover:shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(summary.totalExpenses)}
          </div>
          <p className="text-xs text-muted-foreground">Gastos do mês</p>
        </CardContent>
      </Card>

      <Card className="shadow-card transition-smooth hover:shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Restante</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(summary.balance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.balance >= 0 ? 'Economia positiva' : 'Atenção ao orçamento'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
