import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { Plus, Search, Tag, Gift } from 'lucide-react';
import type { Customer, Product } from '../types';
import Modal from '../components/Modal';
import { fetchCustomers, createCustomer, fetchCustomerHistory } from "../utils/api";
import axios from 'axios';


function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    points: 0,
    birthday: '',
    tags: [],
    purchaseHistory: []
  });
  const [tagInput, setTagInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers()
      .then(setCustomers)
      .catch((erro) => console.error("❌ Erro ao buscar customers:", erro));
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase())
  );

  const isBirthday = (birthday: string) => {
    const today = new Date();
    const birthDate = new Date(birthday);
    return today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setNewCustomer(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewCustomer(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let customer: Customer;
  
      if (newCustomer.id) {
        customer = { ...newCustomer as Customer };
        await updateCustomer(customer.id, customer); // Passando `customer.id` e `customer` como parâmetros
        setCustomers(prevCustomers =>
          prevCustomers.map(c => (c.id === customer.id ? customer : c))
        );
      } else {
        customer = {
          id: crypto.randomUUID(),
          ...newCustomer as Omit<Customer, "id">
        };
        await createCustomer(customer);
        setCustomers([...customers, customer]);
      }
  
      setIsModalOpen(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        points: 0,
        birthday: '',
        tags: [],
        purchaseHistory: []
      });
    } catch (error) {
      console.error("Erro ao cadastrar/editar cliente:", error);
    } finally {
      setLoading(false);
    }
  };
  

  const updateCustomer = async (customerId: string, updatedData: { name: string, email: string, tags: string[] }) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/customers/${customerId}`, // Alterar para a URL correta
        updatedData
      );
      console.log("Cliente atualizado:", response.data);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
    }
  };
  

  const handleCustomerClick = async (customer: Customer) => {
    try {
      const history = await fetchCustomerHistory(customer.id);
      setSelectedCustomer({ ...customer, purchaseHistory: history });
    } catch (error) {
      console.error("Erro ao buscar histórico do cliente:", error);
    }
  };

  const birthdayCustomers = customers.filter(customer => isBirthday(customer.birthday));

  const handleEditCustomer = (customer: Customer) => {
    setNewCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm("Tem certeza de que deseja excluir este cliente?")) {
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5000/customers/${customerId}`, {
        method: "DELETE",
      });
  
      if (!response.ok) {
        throw new Error("Erro ao excluir o cliente.");
      }
  
      console.log("✅ Cliente excluído com sucesso!");
      
      // Atualiza o estado do frontend removendo o cliente excluído
      setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== customerId));
  
    } catch (error) {
      console.error("❌ Erro ao excluir cliente:", error);
    }
  };
  

  const renderCustomerCard = (customer: Customer) => (
    <div
      key={customer.id}
      className="card cursor-pointer"
      onClick={() => handleCustomerClick(customer)} // Aqui chamamos a função ao clicar no card
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-playfair text-lg flex items-center space-x-2">
            <span>{customer.name}</span>
            {isBirthday(customer.birthday) && (
              <Gift className="text-primary" size={20} />
            )}
          </h3>
          <p className="text-sm text-gray-600">{customer.email}</p>
          <p className="text-sm text-gray-600">{customer.phone}</p>
          <p className="text-sm text-gray-600">{customer.tags}</p>
          <p className="text-sm text-gray-600">{customer.birthday
            ? new Intl.DateTimeFormat("pt-BR").format(new Date(customer.birthday))
            : "Data inválida"}
        </p>
        </div>
  
        <div className="text-right">
          <p className="text-sm text-gray-600">Pontos Fidelidade</p>
          <p className="text-lg font-semibold text-primary">{customer.points}</p>
        </div>
      </div>
  
      {Array.isArray(customer.tags) && customer.tags.length > 0 && (
        <div className="mt-4 flex items-center space-x-2">
          <Tag size={16} className="text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {customer.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-secondary/20 text-primary text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
  
      <div className="mt-4 flex justify-end space-x-4">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Impede que o clique no botão dispare o clique no card
            handleEditCustomer(customer);
          }}
          className="btn-primary text-sm flex items-center space-x-2"
        >
          <span>Editar</span>
        </button>
  
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteCustomer(customer.id);
          }}
          className="btn-danger text-sm flex items-center space-x-2"
        >
          <span>Excluir</span>
        </button>
      </div>
    </div>
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-playfair text-[#4A3E3E]">Clientes</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {birthdayCustomers.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 rounded-lg text-white">
          <h2 className="text-2xl font-playfair mb-4">🎉 Aniversariantes do Dia</h2>
          <div className="space-y-3">
            {birthdayCustomers.map(customer => (
              <div key={customer.id} className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{customer.name}</h3>
                  <p className="text-sm">{customer.phone}</p>
                </div>
                <a
                  href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}?text=Hoje%20%C3%A9%20um%20dia%20especial%20e%20n%C3%A3o%20poder%C3%ADamos%20deixar%20de%20celebrar%20com%20voc%C3%AA!%20Desejamos%20um%20ano%20repleto%20de%20realiza%C3%A7%C3%B5es,%20sa%C3%BAde%20e%20felicidade.%20Que%20este%20novo%20ciclo%20seja%20cheio%20de%20sucesso%20e%20novas%20oportunidades.%20Que%20seu%20dia%20seja%20incr%C3%ADvel!%20%F0%9F%A5%B3%F0%9F%8E%82`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>Enviar Mensagem</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar clientes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10 w-full"
        />
      </div>

      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum cliente encontrado</p>
          </div>
        ) : (
          filteredCustomers.map(customer => renderCustomerCard(customer))
        )}
      </div>

      {selectedCustomer && (
  <Modal
  isOpen={!!selectedCustomer}
  onClose={() => setSelectedCustomer(null)}
  title={`Histórico de Compras de ${selectedCustomer?.name || 'Cliente'}`}
>
<div className="space-y-4">
  {selectedCustomer?.purchaseHistory?.length === 0 ? (
    <p className="text-gray-500">Nenhuma compra registrada.</p>
  ) : (
    selectedCustomer?.purchaseHistory?.map((purchase, index) => (
      <div key={index} className="border p-4 rounded-lg">
        <p>
          <strong>Data:</strong> {purchase?.date ? new Date(purchase.date).toLocaleDateString() : "Data desconhecida"}
        </p>
        <p>
          <strong>Valor:</strong> R$ {Number(purchase?.amount ?? 0).toFixed(2)}  {/* Garantindo que amount seja um número válido */}
        </p>
        <p>
          <strong>Itens:</strong> 
          {purchase?.items && Array.isArray(purchase.items) && purchase.items.length > 0 ? (
            purchase.items
              .map((item: { product: Product; quantity: number }) => 
                `${item.product.name || "Produto não especificado"} (R$ ${item.product.price?.toFixed(2)}) - Quantidade: ${item.quantity}`
              )
              .join(', ')
          ) : "Nenhum item registrado"}
        </p>
      </div>
    ))
  )}
</div>





</Modal>
)}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={newCustomer.id ? "Editar Cliente" : "Novo Cliente"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              type="text"
              id="name"
              required
              value={newCustomer.name}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
              className="input-field w-full"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              required
              value={newCustomer.email}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
              className="input-field w-full"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              required
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
              className="input-field w-full"
            />
          </div>

          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">
              Data de Nascimento
            </label>
            <input
              type="date"
              id="birthday"
              required
              value={newCustomer.birthday}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, birthday: e.target.value }))}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="input-field w-full"
                placeholder="Digite uma tag e pressione Enter"
              />
              <div className="flex flex-wrap gap-2">
                {newCustomer.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-secondary/20 text-primary text-sm rounded-full flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-primary hover:text-primary/70"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
        
      </Modal>
    </motion.div>
  );
}

export default Customers;