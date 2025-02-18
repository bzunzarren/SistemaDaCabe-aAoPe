
import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { DollarSign, ShoppingBag, Users } from "lucide-react"
import type { Customer,Sale,MonthlyData } from "../types"
import { Product } from "../types";



const Dashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
  
        const [customersRes, productsRes] = await Promise.all([
          fetch("http://localhost:5000/customers").then((res) => res.json()),
          fetch("http://localhost:5000/products").then((res) => res.json()),
        ]);
  
        setCustomers(customersRes);
        setProducts(productsRes);
      } catch (error) {
        console.error("❌ Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);
  

  // A função getMonthlySalesData agora inclui a data
const getMonthlySalesData = (): MonthlyData[] => {
  const monthlyTotals: Record<number, number> = {}

  sales.forEach((sale) => {
    const saleDate = new Date(sale.date)
    const monthIndex = saleDate.getMonth()
    monthlyTotals[monthIndex] = (monthlyTotals[monthIndex] || 0) + sale.total
  })

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

  return months.map((monthName, index) => ({
    date: `2025-${String(index + 1).padStart(2, "0")}-01`,  // Gerando uma data no formato 'YYYY-MM-DD'
    month: monthName,
    totalSales: monthlyTotals[index] || 0,
    totalRevenue: monthlyTotals[index] || 0,
  }))
}
  
const today = new Date();
today.setHours(0, 0, 0, 0); // Ignora a hora para considerar apenas a data

// Adicionando log para verificar a data de hoje
console.log("Data de hoje:", today);

// Calculando as vendas de hoje
const totalSalesToday = sales
  .filter((sale) => {
    const saleDate = new Date(sale.date);
    saleDate.setHours(0, 0, 0, 0); // Ignora a hora da venda

    // Log para comparar as datas
    console.log("Venda data:", saleDate);
    console.log("Comparando com hoje:", today);

    return saleDate.getTime() === today.getTime(); // Compara apenas a data, ignorando a hora
  })
  .reduce((acc, sale) => acc + sale.total, 0) // Soma os totais das vendas de hoje
  .toFixed(2); // Formata o resultado com 2 casas decimais

console.log("Total das vendas de hoje:", totalSalesToday);




  const monthlyData = getMonthlySalesData()

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-playfair text-[#4A3E3E]">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card: Vendas Hoje */}
        <div className="card flex items-center space-x-4">
    <div className="p-3 bg-primary/10 rounded-full">
      <DollarSign className="text-primary" size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-600">Vendas Hoje</p>
      <p className="text-2xl font-semibold">R$ {totalSalesToday}</p>
    </div>
  </div>
        {/* Card: Produtos */}
        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <ShoppingBag className="text-primary" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Produtos</p>
            <p className="text-2xl font-semibold">{products.length}</p>
          </div>
        </div>
        {/* Card: Customers */}
        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Users className="text-primary" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">Clientes</p>
            <p className="text-2xl font-semibold">{customers.length}</p>
          </div>
        </div>
      </div>
      {/* Gráfico de Vendas Mensais */}
      <div className="card">
        <h2 className="text-xl font-playfair mb-4">Vendas Mensais</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8B7355" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}

export default Dashboard

