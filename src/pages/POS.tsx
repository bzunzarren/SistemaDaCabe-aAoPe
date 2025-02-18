import React, { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import { Search, ShoppingCart, Trash2, Plus, Minus, User, CreditCard } from 'lucide-react';
import { storage } from '../utils/storage';
import type { Product, Customer, Sale } from '../types';
import { addPurchaseToCustomerHistory } from "../utils/api";

interface CartItem {
  product: Product;
  quantity: number;
}

const PAYMENT_METHODS = [
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'PIX',
];

function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [showCustomerSelect, setShowCustomerSelect] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchProducts().then(setProducts);
    fetchCustomers().then(setCustomers);
  }, []);

  useEffect(() => {
    setFilteredProducts(
      products.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, products]);

  

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/products");
      if (!response.ok) {
        throw new Error("Erro ao buscar produtos");
      }
      return await response.json();
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      return [];
    }
  };

  const updateProductStock = async (productId: string, newQuantity: number) => {
    try {
      const response = await fetch(`http://localhost:5000/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar estoque do produto.");
      }
  
      console.log("✅ Estoque atualizado:", data);
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
    }
  };
  
  
  const fetchCustomers = async () => {
    try {
        console.log("📡 Buscando clientes da API...");

        const response = await fetch("http://localhost:5000/customers");

        console.log("📌 Resposta recebida:", response);

        if (!response.ok) {
            throw new Error("Erro ao buscar customers: " + response.statusText);
        }

        const data = await response.json();
        console.log("✅ Clientes recebidos:", data);

        return data;
    } catch (error) {
        console.error("❌ Erro ao buscar customers:", error);
        return [];
    }
};


  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Produto sem estoque disponível!');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        // Verificar se há estoque suficiente
        if (existing.quantity + 1 > product.stock) {
          alert('Quantidade solicitada maior que o estoque disponível!');
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });        
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const item = prev.find(item => item.product.id === productId);
      const product = products.find(p => p.id === productId);
      
      if (item && product) {
        const newQuantity = item.quantity + delta;
        
        // Verificar se há estoque suficiente ao aumentar a quantidade
        if (delta > 0 && newQuantity > product.stock) {
          alert('Quantidade solicitada maior que o estoque disponível!');
          return prev;
        }
        
        // Atualizar ou remover o item
        return prev
          .map(item => {
            if (item.product.id === productId) {
              return newQuantity <= 0 ? null : { ...item, quantity: newQuantity };
            }
            return item;
          })
          .filter((item): item is CartItem => item !== null);
      }
      return prev;
    });
  };

  const subtotal = cart.reduce((sum, item) => 
    sum + (Number(item.product.price || 0) * Number(item.quantity || 0)), 0
  );  
  const total = subtotal - (subtotal * (Number(discount) || 0) / 100);

  const handleFinalizeSale = async () => {
    if (!selectedCustomer) {
      alert('Por favor, selecione um cliente');
      return;
    }

    if (cart.length === 0) {
      alert('Carrinho vazio');
      return;
    }

    try {
      // Verificar estoque novamente antes de finalizar
      for (const item of cart) {
        const currentProduct = products.find(p => p.id === item.product.id);
        if (!currentProduct || currentProduct.stock < item.quantity) {
          alert(`Estoque insuficiente para o produto: ${item.product.name}`);
          return;
        }
      }

      // Atualizar o estoque de cada produto
      for (const item of cart) {
        const currentProduct = products.find(p => p.id === item.product.id);
        if (currentProduct) {
          const newStock = currentProduct.stock - item.quantity;
          await updateProductStock(item.product.id, newStock);
          
          // Atualizar o estado local dos produtos
          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === item.product.id
                ? { ...p, stock: newStock }
                : p
            )
          );
        }
      }

      const sale: Sale = {
        id: crypto.randomUUID(),
        customerId: selectedCustomer.id,
        items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
        })),
        total,
        discount,
        paymentMethod,
        date: new Date().toISOString(),
    };
    
    storage.addSale(sale);
    
    await addPurchaseToCustomerHistory(selectedCustomer.id, {
        date: sale.date,
        amount: sale.total,
        items: sale.items.map(item => item.productId),
    });
    
      
      setCart([]);
      setDiscount(0);
      setPaymentMethod(PAYMENT_METHODS[0]);
      alert('Venda finalizada com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda. Por favor, tente novamente.');
    }
  };

  

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-3xl font-playfair text-[#4A3E3E]">PDV</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                aria-label={`Adicionar ${product.name} ao carrinho`}
                className={`card hover:shadow-lg transition-shadow text-left p-4 bg-white rounded-lg ${
                  product.stock === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {product.stock === 0 && (
                  <span className="text-red-500 text-sm">Esgotado</span>
                )}
                <img
                  src={product.image || "https://placehold.co/150x150"}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.category}</p>
                <p className="text-primary font-semibold mt-1">
                  R$ {Number(product.price).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Estoque: {product.stock} unidades
                </p>
              </button>
            ))
          ) : (
            <p className="text-gray-500">Nenhum produto encontrado.</p>
          )}
        </div>
      </div>

      <div className="card h-fit sticky top-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="text-primary" size={24} />
            <h2 className="text-xl font-playfair">Carrinho</h2>
          </div>
          <button
            onClick={() => setShowCustomerSelect(!showCustomerSelect)}
            className="flex items-center space-x-2 text-primary hover:text-primary-dark"
          >
            <User size={20} />
            <span>
              {selectedCustomer ? selectedCustomer.name : 'Selecionar Cliente'}
            </span>
          </button>
        </div>

        {showCustomerSelect && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-2">Selecione o Cliente</h3>
            <div className="space-y-2">
              {customers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerSelect(false);
                  }}
                  className="w-full text-left p-2 hover:bg-white rounded transition-colors"
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.email}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {cart.map(item => (
            <div key={item.product.id} className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium">{item.product.name}</h3>
                <p className="text-sm text-gray-600">
                  R$ {(Number(item.product?.price) || 0).toFixed(2)} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(item.product.id, -1)}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={16} />
                </button>
                <button
                  onClick={() => updateQuantity(item.product.id, 1)}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => updateQuantity(item.product.id, -item.quantity)}
                  className="p-1 hover:bg-gray-100 rounded text-red-500"
                  aria-label="Remover item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="discount">Desconto (%)</label>
            <input
              id="discount"
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) =>
                setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))
              }
              className="input-field w-20 text-right"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-2 rounded-md border text-sm flex items-center justify-center space-x-1
                    ${
                      paymentMethod === method
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 hover:border-primary/30"
                    }`}
                >
                  <CreditCard size={16} />
                  <span>{method}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <button
    onClick={handleFinalizeSale}
    disabled={!selectedCustomer || cart.length === 0}
    className={`w-full mt-6 py-2 px-4 rounded-md font-medium ${
        !selectedCustomer || cart.length === 0
        ? "bg-gray-300 cursor-not-allowed"
        : "bg-primary text-white hover:bg-primary-dark"
    }`}
>
    Finalizar Venda
</button>
      </div>
    </motion.div>
  );
}

export default POS;