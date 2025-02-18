    import axios from "axios";
    import { Product } from '../types';  // Ajuste o caminho conforme necessário
    import { Customer } from "../types"; // Ajuste o caminho conforme necessário
    import type { Brand } from "../types"; // Ajuste o caminho conforme necessário
    import type { Sale , PurchaseHistory } from "../types"; // Certifique-se de que o caminho está correto



    const API_URL = "http://localhost:5000"; // Backend rodando na porta 5000

    // Função para buscar produtos
    export const fetchProducts = async (): Promise<Product[]> => {
        try {
          const response = await axios.get<Product[]>(`${API_URL}/produtos`);
          
          return response.data.map((product: Product) => ({
            ...product,
            price: Number(product.price) // 🔹 Garantir que price seja um número
          }));
        } catch (error) {
          console.error("❌ Erro ao buscar produtos:", error);
          return [];
        }
      };
      
      

      export const getProducts = async () => {
        try {
          const response = await axios.get('http://localhost:5000/products');
          console.log('✅ Resposta da API:', response.data);
          return response.data;
        } catch (error) {
          console.error('❌ Erro ao buscar produtos:', error);
          throw error;
        }
      };
      

      export const API_BASE_URL = "http://localhost:5000";
    export const createProduct = async (productData: Omit<Product, "id">): Promise<Product> => {
      try {
        const response = await axios.post(`${API_BASE_URL}/products`, productData);
        return response.data;
      } catch (error) {
        console.error("❌ Erro ao criar produto:", error);
        throw error;
      }
    };

    export const createCustomer = async (customer: Omit<Customer, "id">) => {
      try {
          const newCustomer = { id: crypto.randomUUID(), ...customer };
          const response = await axios.post(`${API_URL}/customers`, newCustomer);
          return response.data;
      } catch (error) {
          console.error("❌ Erro ao criar cliente:", error);
          throw error;
      }
  };
  
  export const getCustomerById = async (id: string): Promise<Customer | null> => {
      try {
          const response = await axios.get(`${API_URL}/customers/${id}`);
          return response.data;
      } catch (error) {
          console.error("❌ Erro ao buscar cliente:", error);
          return null;
      }
  };
  
      
      // 🔹 Buscar todas as marcas
export const fetchBrands = async (): Promise<Brand[]> => {
    try {
      const response = await axios.get(`${API_URL}/brands`);
      return response.data;
    } catch (error) {
      console.error("❌ Erro ao buscar marcas:", error);
      return [];
    }
  };
  
  // 🔹 Criar uma nova marca
  export const createBrand = async (brand: Omit<Brand, "id">) => {
    try {
      const newBrand = { id: crypto.randomUUID(), ...brand };
      const response = await axios.post(`${API_URL}/brands`, newBrand);
      return response.data;
    } catch (error) {
      console.error("❌ Erro ao criar marca:", error);
      throw error;
    }
  };
  
  // 🔹 Atualizar uma marca
  export const updateBrand = async (id: string, brand: Omit<Brand, "id">) => {
    try {
      await axios.put(`${API_URL}/brands/${id}`, brand);
    } catch (error) {
      console.error("❌ Erro ao atualizar marca:", error);
      throw error;
    }
  };
  
  // 🔹 Excluir uma marca
  export const deleteBrand = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/brands/${id}`);
    } catch (error) {
      console.error("❌ Erro ao excluir marca:", error);
      throw error;
    }
  };


// 🔹 Buscar clientes
export const fetchCustomers = async (): Promise<Customer[]> => {
    try {
      const response = await axios.get(`${API_URL}/customers`);
      return response.data;
    } catch (error) {
      console.error("❌ Erro ao buscar clientes:", error);
      return [];
    }
  };
  
  // 🔹 Criar uma venda
  export const createSale = async (sale: Sale) => {
    try {
      const response = await axios.post(`${API_URL}/vendas`, sale);
      return response.data;
    } catch (error) {
      console.error("❌ Erro ao registrar venda:", error);
      throw error;
    }
  };
  
  // 🔹 Buscar histórico de compras de um cliente
  export const fetchCustomerHistory = async (customerId: string) => {
    try {
      const response = await axios.get(`${API_URL}/clientes/${customerId}/historico`);
      return response.data;
    } catch (error: unknown) {  // ✅ `unknown` em vez de `any`
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn("⚠️ Nenhum histórico de compras encontrado para este cliente.");
        return [];
      }
      console.error("❌ Erro ao buscar histórico de compras:", error);
      return [];
    }
  };
  
  

// 🔹 Adicionar compra ao histórico de um cliente
export const addPurchaseToCustomerHistory = async (
  customerId: string,
  purchase: PurchaseHistory
): Promise<PurchaseHistory | null> => {
  try {
    const response = await axios.post(`http://localhost:5000/clientes/${customerId}/historico`, purchase);
    return response.data;
  } catch (error) {
    console.error("❌ Erro ao adicionar compra ao histórico:", error);
    return null;
  }
};

