export interface Product {
  id: string;
  name: string;
  code: string; // Incluído para unificar a definição do produto
  brandId: string | undefined;
  brandName?: string; // Usado para mostrar o nome da marca, caso seja fornecido
  categoryId: string; // Ajustado para categoryId, para manter consistência
  category: string; // Se necessário, pode ser mantido para o nome da categoria
  sizes: { size: string; quantity: number }[]; // Tamanho e quantidade
  color: string; // Cor do produto
  price: number; // Preço do produto
  image: string | undefined; // Imagem do produto
  stock: number; // Quantidade em estoque
}

export interface Brand {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORIES = [
  'Camisetas',
  'Calças',
  'Vestidos',
  'Saias',
  'Blusas',
  'Casacos',
  'Acessórios',
  'Calçados'
] as const;

export const SIZES = [
  'PP',
  'P',
  'M',
  'G',
  'GG',
  'XG',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42'
] as const;

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  birthday: string; // 🔹 Mude de `Date` para `string`
  tags: string[];
  purchaseHistory: Purchase[];
}



export interface Purchase {
  id: string;
  date: string;
  products: {
    product: Product;
    quantity: number;
  }[];
  total: number;
  discount: number;
  customerId: string;
}

export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  customer_name?: string; // Adicione essa linha
}


export interface Sale {
  id: string;
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  discount: number;
  paymentMethod: string;
  date: string;
}

export interface Brand {
  id: string;
  name: string;
  createdAt: string; // 🔹 Mantendo string para evitar conflitos
  updatedAt: string;
}


export interface Purchase {
  id: string;
  date: string;
  amount: number;  // Adicione a propriedade amount
  items: {        // Adicione a propriedade items, que pode ser uma lista de produtos
    product: Product;
    quantity: number;
  }[];
  customerId: string;
}


export interface Product {
  id: string;
  name: string;
  price: number;
  // Adicione os outros campos conforme necessário
}

export interface PurchaseHistory {
  date: string;
  amount: number;
  items: string[]; // Ou use outro tipo conforme necessário
}


// Supondo que o tipo MonthlyData seja algo assim:
export interface MonthlyData {
  date: string;  // Adicionando a propriedade date
  month: string;
  totalSales: number;
  totalRevenue: number;
}
