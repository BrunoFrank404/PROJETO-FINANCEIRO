import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SummaryCards from '@/components/SummaryCards';
import ExpenseChart from '@/components/ExpenseChart';
import ExpenseList from '@/components/ExpenseList';
import ExpenseModal from '@/components/ExpenseModal';
import MonthYearSelector from '@/components/MonthYearSelector';
import { LogOut, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  recurring: boolean;
}

export interface Summary {
  income: number;
  totalExpenses: number;
  balance: number;
  expensesByCategory: { category: string; total: number }[];
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({
    income: 0,
    totalExpenses: 0,
    balance: 0,
    expensesByCategory: [],
  });
  const [selectedDate, setSelectedDate] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, [selectedDate]);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/expenses', {
        params: {
          month: selectedDate.month,
          year: selectedDate.year,
        },
      });
      setExpenses(response.data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar gastos',
        description: error.response?.data?.message || 'Tente novamente',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/summary', {
        params: {
          month: selectedDate.month,
          year: selectedDate.year,
        },
      });
      setSummary(response.data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar resumo',
        description: error.response?.data?.message || 'Tente novamente',
      });
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Deseja realmente excluir este gasto?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`);
      toast({
        title: 'Gasto excluído',
        description: 'O gasto foi removido com sucesso',
      });
      fetchExpenses();
      fetchSummary();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir gasto',
        description: error.response?.data?.message || 'Tente novamente',
      });
    }
  };

  const handleSaveExpense = async (expense: Partial<Expense>) => {
    try {
      if (editingExpense) {
        await axios.put(`http://localhost:5000/api/expenses/${editingExpense.id}`, expense);
        toast({
          title: 'Gasto atualizado',
          description: 'As alterações foram salvas com sucesso',
        });
      } else {
        await axios.post('http://localhost:5000/api/expenses', expense);
        toast({
          title: 'Gasto adicionado',
          description: 'O novo gasto foi registrado com sucesso',
        });
      }
      setIsModalOpen(false);
      fetchExpenses();
      fetchSummary();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar gasto',
        description: error.response?.data?.message || 'Tente novamente',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Olá, {user?.name}!</h1>
            <MonthYearSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <SummaryCards summary={summary} />
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Distribuição de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseChart data={summary.expensesByCategory} />
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gastos Recentes</CardTitle>
              <Button size="sm" onClick={handleAddExpense}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent>
              <ExpenseList
                expenses={expenses.slice(0, 5)}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Todos os Gastos</CardTitle>
            <Button size="sm" onClick={handleAddExpense}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Gasto
            </Button>
          </CardHeader>
          <CardContent>
            <ExpenseList
              expenses={expenses}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              loading={loading}
            />
          </CardContent>
        </Card>
      </main>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExpense}
        expense={editingExpense}
      />
    </div>
  );
};

export default Dashboard;
