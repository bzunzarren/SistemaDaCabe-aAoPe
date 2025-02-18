import { Product, Customer, Purchase, FinancialRecord, Sale, Brand } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'dcap_products',
  CUSTOMERS: 'dcap_customers',
  PURCHASES: 'dcap_purchases',
  FINANCIAL: 'dcap_financial',
  SALES: 'dcap_sales',
  BRANDS: 'dcap_brands'
};

export const storage = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },  
  setProducts: (products: Product[]) => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },
  addProduct: (product: Product) => {
    const products = storage.getProducts();
    products.push(product);
    storage.setProducts(products);
  },
  updateProduct: (product: Product) => {
    const products = storage.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
      storage.setProducts(products);
    }
  },
  
  getBrands: (): Brand[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BRANDS) || '[]');
  },
  setBrands: (brands: Brand[]) => {
    localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(brands));
  },
  addBrand: (brand: Brand) => {
    const brands = storage.getBrands();
    brands.push(brand);
    storage.setBrands(brands);
  },
  updateBrand: (brand: Brand) => {
    const brands = storage.getBrands();
    const index = brands.findIndex(b => b.id === brand.id);
    if (index !== -1) {
      brands[index] = { ...brand, updatedAt: new Date().toISOString() };
      storage.setBrands(brands);
    }
  },
  deleteBrand: (brandId: string) => {
    const brands = storage.getBrands();
    const filteredBrands = brands.filter(b => b.id !== brandId);
    storage.setBrands(filteredBrands);
  },
  
  
  getCustomers: (): Customer[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
  },
  setCustomers: (customers: Customer[]) => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },
  addCustomer: (customer: Customer) => {
    const customers = storage.getCustomers();
    customers.push(customer);
    storage.setCustomers(customers);
  },
  updateCustomer: (customer: Customer) => {
    const customers = storage.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    if (index !== -1) {
      customers[index] = customer;
      storage.setCustomers(customers);
    }
  },
  
  getSales: (): Sale[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
  },
  setSales: (sales: Sale[]) => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  },
  addSale: (sale: Sale) => {
    const sales = storage.getSales();
    sales.push(sale);
    storage.setSales(sales);
    
    // Update customer purchase history
    const customers = storage.getCustomers();
    const customerIndex = customers.findIndex(c => c.id === sale.customerId);
    if (customerIndex !== -1) {
      const purchase: Purchase = {
        id: sale.id,
        date: sale.date,
        products: sale.items.map(item => ({
          product: storage.getProducts().find(p => p.id === item.productId)!,
          quantity: item.quantity
        })),
        total: sale.total,
        discount: sale.discount,
        customerId: sale.customerId
      };
      
      customers[customerIndex].purchaseHistory.push(purchase);
      storage.setCustomers(customers);
    }
    
    // Add financial record
    storage.addFinancialRecord({
      id: crypto.randomUUID(),
      date: sale.date,
      type: 'income',
      amount: sale.total,
      description: `Venda #${sale.id} - Cliente: ${customers[customerIndex]?.name || 'N/A'}`
    });
  },
  
  getPurchases: (): Purchase[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES) || '[]');
  },
  setPurchases: (purchases: Purchase[]) => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  },
  addPurchase: (purchase: Purchase) => {
    const purchases = storage.getPurchases();
    purchases.push(purchase);
    storage.setPurchases(purchases);
    
    // Update customer purchase history
    const customers = storage.getCustomers();
    const customerIndex = customers.findIndex(c => c.id === purchase.customerId);
    if (customerIndex !== -1) {
      customers[customerIndex].purchaseHistory.push(purchase);
      storage.setCustomers(customers);
    }
    
    // Add financial record for the purchase
    storage.addFinancialRecord({
      id: crypto.randomUUID(),
      date: purchase.date,
      type: 'income',
      amount: purchase.total,
      description: `Venda #${purchase.id} - Cliente: ${customers[customerIndex]?.name || 'N/A'}`
    });
  },
  
  getFinancial: (): FinancialRecord[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FINANCIAL) || '[]');
  },
  setFinancial: (records: FinancialRecord[]) => {
    localStorage.setItem(STORAGE_KEYS.FINANCIAL, JSON.stringify(records));
  },
  addFinancialRecord: (record: FinancialRecord) => {
    const records = storage.getFinancial();
    records.push(record);
    storage.setFinancial(records);
  },
  
  // Utility functions
  generateId: (): string => {
    return crypto.randomUUID();
  },
  
  // Initialize storage with some sample data if empty
  initialize: () => {
    if (storage.getProducts().length === 0) {
      storage.setProducts([
        {
          id: crypto.randomUUID(),
          name: 'Camiseta Básica',
          categoryId: 'Camisetas',
          brandId: 'BRAND123',
          code: 'CM-001',
          category: 'Roupas',
          sizes: [
            { size: 'P', quantity: 10 },
            { size: 'M', quantity: 15 },
            { size: 'G', quantity: 8 }
          ],
          color: 'Branco',
          price: 49.90,
          image: 'camiseta_teste.jpg',
          stock: 10 + 15 + 8 // 🔹 Soma dos tamanhos para preencher a propriedade
        }
      ]);
    }
    
    if (storage.getCustomers().length === 0) {
      storage.setCustomers([
        {
          id: crypto.randomUUID(),
          name: 'Maria Silva',
          email: 'maria@email.com',
          phone: '(11) 99999-9999',
          points: 100,
          birthday: '1990-05-15',
          tags: ['VIP', 'Frequente'],
          purchaseHistory: []
        },
        {
          id: crypto.randomUUID(),
          name: 'João Santos',
          email: 'joao@email.com',
          phone: '(11) 98888-8888',
          points: 50,
          birthday: '1985-10-20',
          tags: ['Novo'],
          purchaseHistory: []
        }
      ]);
    }
  }
};