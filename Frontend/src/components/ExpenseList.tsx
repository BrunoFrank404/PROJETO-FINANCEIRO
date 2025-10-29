import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { Expense } from '@/pages/Dashboard';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

const ExpenseList = ({ expenses, onEdit, onDelete, loading }: ExpenseListProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Nenhum gasto registrado neste período
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm transition-smooth hover:shadow-card"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground">{expense.description}</h4>
              <Badge variant="secondary">{expense.category}</Badge>
              {expense.recurring && (
                <Badge variant="outline" className="text-xs">
                  Recorrente
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-destructive">
              {formatCurrency(expense.amount)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(expense)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(expense.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;
