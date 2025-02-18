import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, TrendingUp, TrendingDown, Download, Calendar } from 'lucide-react';
import { storage } from '../utils/storage';
import type { FinancialRecord } from '../types';
import Modal from '../components/Modal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import { v4 as uuidv4 } from 'uuid';

function Financial() {
  
  const [records, setRecords] = useState<FinancialRecord[]>(storage.getFinancial());
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [newRecord, setNewRecord] = useState<Partial<FinancialRecord>>({
    date: new Date().toISOString().split('T')[0],
    type: 'income',
    amount: 0,
    description: ''
  });

  const filteredRecords = records.filter(record =>
    record.description.toLowerCase().includes(search.toLowerCase())
  );

  const monthlyRecords = filteredRecords.filter(record => {
    const recordDate = new Date(record.date);
    const [year, month] = selectedMonth.split('-');
    return recordDate.getFullYear() === parseInt(year) && 
           recordDate.getMonth() === parseInt(month) - 1;
  });

  const totalIncome = monthlyRecords
    .filter(record => record.type === 'income')
    .reduce((sum, record) => sum + record.amount, 0);

  const totalExpenses = monthlyRecords
    .filter(record => record.type === 'expense')
    .reduce((sum, record) => sum + record.amount, 0);

  const balance = totalIncome - totalExpenses;

  const chartData = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dayRecords = monthlyRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getDate() === day;
    });

    const dayIncome = dayRecords
      .filter(record => record.type === 'income')
      .reduce((sum, record) => sum + record.amount, 0);

    const dayExpenses = dayRecords
      .filter(record => record.type === 'expense')
      .reduce((sum, record) => sum + record.amount, 0);

    return {
      day: String(day).padStart(2, '0'),
      income: dayIncome,
      expenses: dayExpenses
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const newId = newRecord.id ?? uuidv4(); // ✅ Garante um ID único usando `uuid`
  
    const record: FinancialRecord = {
      id: newId,
      date: newRecord.date ?? new Date().toISOString().split('T')[0],
      type: newRecord.type ?? 'income',
      amount: newRecord.amount ?? 0,
      description: newRecord.description ?? ''
    };
  
    console.log("📤 Enviando para o backend:", record);
  
    await saveToDatabase(record); // ✅ Chamada única para evitar duplicação
  
    const updatedRecords = newRecord.id
      ? records.map(r => (r.id === newRecord.id ? record : r)) // Atualiza registro existente
      : [...records, record]; // Adiciona um novo registro
  
    setRecords(updatedRecords);
    storage.setFinancial(updatedRecords);
  
    setIsModalOpen(false);
    setNewRecord({
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      amount: 0,
      description: ''
    });
  };
  

  const saveToDatabase = async (record: FinancialRecord) => {
    try {
      console.log("📤 Enviando para o backend:", record);
  
      const response = await fetch('http://localhost:5000/financial', { // ⚠️ Confirme que a URL está correta!
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
  
      if (!response.ok) throw new Error("Erro ao salvar no banco");
  
      const data = await response.json();
      console.log("✅ Registro salvo com sucesso!", data);
    } catch (error) {
      console.error("🚨 Erro ao salvar no banco:", error);
    }
  };

const handleDelete = async (id: string) => {
  if (!window.confirm("Tem certeza que deseja excluir esta transação?")) {
    return;
  }

  try {
    console.log(`🗑️ Tentando deletar o registro com ID: ${id}`);

    const response = await fetch(`http://localhost:5000/financial/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error("Erro ao excluir o registro");
    }

    const data = await response.json();
    console.log("✅ Registro excluído com sucesso!", data);

    // Atualiza a lista removendo o item excluído
    setRecords(records.filter(record => record.id !== id));
    storage.setFinancial(records.filter(record => record.id !== id));
  } catch (error) {
    console.error("🚨 Erro ao excluir do banco:", error);
  }
};

  
const handleEdit = (record: FinancialRecord) => {
  setNewRecord(record); // Preenche o formulário com os dados existentes
  setIsModalOpen(true); // Abre o modal para edição
};


const handleEditSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!newRecord.id) {
    console.error("🚨 Erro: Nenhum ID fornecido para edição.");
    return;
  }

  try {
    console.log(`✏️ Editando registro com ID: ${newRecord.id}`);

    const response = await fetch(`http://localhost:5000/financial/${newRecord.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: newRecord.date,
        type: newRecord.type,
        amount: newRecord.amount,
        description: newRecord.description,
      }),
    });

    if (!response.ok) {
      throw new Error("Erro ao editar o registro");
    }

    const data = await response.json();
    console.log("✅ Registro editado com sucesso!", data);

    // Atualizar a lista de registros no estado
    const updatedRecords = records.map(record =>
      record.id === newRecord.id ? { ...record, ...newRecord } : record
    );

    setRecords(updatedRecords);
    storage.setFinancial(updatedRecords);
    setIsModalOpen(false);
    setNewRecord({
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      amount: 0,
      description: ''
    });

  } catch (error) {
    console.error("🚨 Erro ao editar no banco:", error);
  }
};


  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.text('Relatório Financeiro', pageWidth / 2, 20, { align: 'center' });
    
    // Period
    doc.setFontSize(12);
    doc.text(`Período: ${selectedMonth}`, pageWidth / 2, 30, { align: 'center' });
    
    // Summary
    doc.setFontSize(14);
    doc.text('Resumo', 20, 50);
    doc.setFontSize(12);
    doc.text(`Receitas: R$ ${totalIncome.toFixed(2)}`, 20, 60);
    doc.text(`Despesas: R$ ${totalExpenses.toFixed(2)}`, 20, 70);
    doc.text(`Saldo: R$ ${balance.toFixed(2)}`, 20, 80);
    
    // Transactions
    doc.setFontSize(14);
    doc.text('Transações', 20, 100);
    
    let y = 110;
    monthlyRecords.forEach(record => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      const date = new Date(record.date).toLocaleDateString();
      const type = record.type === 'income' ? 'Receita' : 'Despesa';
      const amount = `R$ ${record.amount.toFixed(2)}`;
      
      doc.setFontSize(10);
      doc.text(date, 20, y);
      doc.text(type, 60, y);
      doc.text(record.description, 100, y);
      doc.text(amount, 180, y);
      
      y += 10;
    });
    
    doc.save(`relatorio-financeiro-${selectedMonth}.pdf`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-playfair text-[#4A3E3E]">Financeiro</h1>
        <div className="flex space-x-3">
          <button
            onClick={generatePDF}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download size={20} />
            <span>Exportar PDF</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingUp className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Receitas</p>
            <p className="text-2xl font-semibold text-green-600">
              R$ {totalIncome.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-full">
            <TrendingDown className="text-red-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Despesas</p>
            <p className="text-2xl font-semibold text-red-600">
              R$ {totalExpenses.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Calendar className="text-primary" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Saldo</p>
            <p className={`text-2xl font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-playfair mb-4">Fluxo de Caixa</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#16a34a" 
                name="Receitas"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#dc2626" 
                name="Despesas"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex space-x-4 items-center mb-4">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
    <input
      type="text"
      placeholder="Buscar transações..."
      onChange={(e) => setSearch(e.target.value)}
      className="input-field pl-10 w-full"
      aria-label="Buscar transações"
    />
  </div>
</div>

<div className="space-y-4">
  {monthlyRecords.length === 0 ? (
    <div className="text-center py-12">
      <p className="text-gray-500">Nenhuma transação encontrada</p>
    </div>
  ) : (
    monthlyRecords.map(record => (
      <div key={record.id} className="card flex justify-between items-center p-4 border rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-full ${
            record.type === 'income' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {record.type === 'income' ? (
              <TrendingUp className="text-green-600" size={20} />
            ) : (
              <TrendingDown className="text-red-600" size={20} />
            )}
          </div>
          <div>
            <p className="font-medium">{record.description}</p>
            <p className="text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</p>
            {/* Aqui está a exibição do nome do cliente */}
            <p className="text-sm text-gray-500">
              Cliente: {record.customer_name && record.customer_name.trim() !== '' ? record.customer_name : 'Desconhecido'}
            </p>
          </div>
        </div>
    
        <p className={`text-lg font-semibold ${
          record.type === 'income' ? 'text-green-600' : 'text-red-600'
        }`}>
          R$ {record.amount.toFixed(2)}
        </p>
    
        <div className="flex space-x-2">
          <button 
            onClick={() => handleEdit(record)} 
            className="text-blue-500 hover:text-blue-700"
            aria-label="Editar transação"
          >
            ✏️
          </button>
    
          <button 
            onClick={() => handleDelete(record.id)} 
            className="text-red-500 hover:text-red-700"
            aria-label="Excluir transação"
          >
            🗑️
          </button>
        </div>
      </div>
    ))
    
  )}
</div>

<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title={newRecord.id ? "Editar Transação" : "Nova Transação"} // Muda o título do modal
>
  <form onSubmit={newRecord.id ? handleEditSubmit : handleSubmit} className="space-y-4">
    <div>
      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
        Tipo
      </label>
      <select
        id="type"
        required
        value={newRecord.type}
        onChange={(e) => setNewRecord(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
        className="input-field w-full"
      >
        <option value="income">Receita</option>
        <option value="expense">Despesa</option>
      </select>
    </div>

    <div>
      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
        Descrição
      </label>
      <input
        type="text"
        id="description"
        required
        value={newRecord.description}
        onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
        className="input-field w-full"
      />
    </div>

    <div>
      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
        Valor
      </label>
      <input
        type="number"
        id="amount"
        required
        min="0"
        step="0.01"
        value={newRecord.amount}
        onChange={(e) => setNewRecord(prev => ({ ...prev, amount: Number(e.target.value) }))}
        className="input-field w-full"
      />
    </div>

    <div>
      <label htmlFor="date" className="block text-sm font-medium text-gray-700">
        Data
      </label>
      <input
        type="date"
        id="date"
        required
        value={newRecord.date}
        onChange={(e) => setNewRecord(prev => ({ ...prev, date: e.target.value }))}
        className="input-field w-full"
      />
    </div>

    <div className="flex justify-end space-x-3 pt-4">
      <button
        type="button"
        onClick={() => setIsModalOpen(false)}
        className="btn-secondary"
      >
        Cancelar
      </button>
      <button type="submit" className="btn-primary">
        {newRecord.id ? "Atualizar" : "Salvar"} {/* Muda o texto do botão */}
      </button>
    </div>
  </form>
</Modal>

    </motion.div>
  );
}

export default Financial;