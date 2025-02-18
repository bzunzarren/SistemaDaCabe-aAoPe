"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Search, AlertCircle, Filter } from "lucide-react"
import type { Product } from "../types"
import { SIZES } from "../types"
import Modal from "../components/Modal"
import axios from "axios"

export default function ProductsPage() {
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [brandFilter, setBrandFilter] = useState("")
  const [codeFilter, setCodeFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: "",
    code: "",
    brandId: "",
    categoryId: "",
    category: "",
    color: "",
    price: 0,
    purchasePrice: 0,
    image: "",
    sizes: [{ size: "PP", quantity: 1 }],
  })

  useEffect(() => {
    loadProducts()
    loadBrands()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      console.log("🔍 Buscando produtos...")
      const response = await axios.get("http://localhost:5000/products")
      const data = response.data

      console.log("✅ Produtos recebidos da API:", data)

      const formattedData: Product[] = data.map((product: Product) => ({
        ...product,
        price: Number(product.price),
      }))

      setProducts(formattedData)
      setError(null)
    } catch (err) {
      console.error("❌ Erro ao carregar produtos:", err)
      setError("Erro ao carregar produtos. Por favor, tente novamente.")
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const loadBrands = async () => {
    try {
      const response = await axios.get("http://localhost:5000/brands")      ; // 🔥 Corrigido!
      const data = response.data;
  
      if (Array.isArray(data) && data.every((item) => typeof item === "object")) {
        setBrands(data);
      } else {
        console.error("❌ Erro: A resposta da API não é um array de objetos:", data);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar marcas:", error);
      setBrands([]);
    }
  };
  

  const CATEGORIES = [
    { id: "1", name: "Camisetas" },
    { id: "2", name: "Calças" },
    { id: "3", name: "Vestidos" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    console.log("📌 Produto a ser salvo:", newProduct);
  
    // Match the exact fields expected by the backend
    const productToSave = {
      name: newProduct.name.trim(),
      price: Number(newProduct.price),
      category: CATEGORIES.find((cat) => cat.id === newProduct.categoryId)?.name || "Sem categoria",
      code: newProduct.code.trim(),
      brand_id: newProduct.brandId,  // 🔥 Corrigido (antes: brandId)
      category_id: newProduct.categoryId, // 🔥 Corrigido (antes: categoryId)
      color: newProduct.color.trim(),
      purchase_price: Number(newProduct.purchasePrice), // 🔥 Corrigido para padronizar (snake_case)
      image: newProduct.image.trim() || null,
      sizes: newProduct.sizes.map((size) => ({
        size: size.size,
        quantity: Number(size.quantity),
      })),
      stock: newProduct.sizes.reduce((total, size) => total + Number(size.quantity), 0),
    };
    
  
 // Validação de campos obrigatórios
if (!productToSave.name || 
  !productToSave.price || 
  !productToSave.category || 
  !productToSave.purchase_price ||  // 🔥 Corrigido (antes: purchasePrice)
  !productToSave.brand_id ||        // 🔥 Corrigido (antes: brandId)
  !productToSave.category_id) {     // 🔥 Corrigido (antes: categoryId)
alert("Preencha todos os campos obrigatórios (nome, preço, categoria, preço de compra, marca e categoria).");
return;
}

  
    try {
      console.log("🚀 Enviando para o servidor:", productToSave);
  
      const response = await axios.post("http://localhost:5000/products", productToSave);
  
      console.log("✅ Resposta do servidor:", response.data);
  
      const createdProduct = response.data;
      setProducts((prev) => [...prev, createdProduct]);
      setIsModalOpen(false);
  
      setNewProduct({
        name: "",
        code: "",
        brandId: "",
        categoryId: "",
        category: "",
        color: "",
        price: 0,
        purchasePrice: 0,
        image: "",
        sizes: [{ size: "PP", quantity: 1 }],
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("❌ Erro ao criar produto:", error.response.data);
        alert(`Erro ao salvar o produto: ${error.response.data.error || error.message}`);
      } else {
        console.error("❌ Erro desconhecido:", error);
        alert("Erro desconhecido ao salvar o produto.");
      }
    }
  };
  
  

  const handleSizeChange = (index: number, field: "size" | "quantity", value: string | number) => {
    setNewProduct((prev) => ({
      ...prev,
      sizes: prev.sizes?.map((item, i) => (i === index ? { ...item, [field]: value } : item)) || [],
    }))
  }

  const handleAddSize = () => {
    setNewProduct((prev) => ({
      ...prev,
      sizes: [...(prev.sizes || []), { size: SIZES[0], quantity: 1 }],
    }))
  }

  const handleRemoveSize = (index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      sizes: prev.sizes?.filter((_, i) => i !== index) || [],
    }))
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      (product.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (product.code?.toLowerCase().includes(search.toLowerCase()) ?? false);
  
    const matchesBrand = !brandFilter || product.brandId === brandFilter;
    const matchesCode = !codeFilter || product.code?.includes(codeFilter);
  
    return matchesSearch && matchesBrand && matchesCode;
  });
  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 flex items-center space-x-2">
          <AlertCircle size={24} />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto p-6 space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          aria-label="Adicionar novo produto"
        >
          <Plus size={20} />
          <span>Novo Produto</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Buscar produtos"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Abrir filtros"
          >
            <Filter size={20} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input
                type="text"
                value={codeFilter}
                onChange={(e) => setCodeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Filtrar por código"
                aria-label="Filtrar por código"
              />
            </div>
            <div>
              <label htmlFor="brandFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Marca
              </label>
              <select
                id="brandFilter"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filtrar por marca"
              >
                <option value="">Todas as marcas</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {filteredProducts?.length > 0 ? (
    filteredProducts.map((product) => (
      <div 
        key={product.id} 
        className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-transform hover:scale-105"
      >
        {/* Imagem do Produto */}
        <div className="relative w-full aspect-square bg-gray-200">
          <img
            src={product.image || "https://placehold.co/300x300"}
            alt={product.name || "Produto sem nome"}
            className="w-full h-full object-cover rounded-t-lg"
            onError={(e) => e.currentTarget.src = "https://placehold.co/300x300"} // Fallback se a imagem estiver quebrada
          />
        </div>

        {/* Informações do Produto */}
        <div className="p-4 flex flex-col justify-between flex-grow">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
            <p className="text-sm text-gray-600">{product.brandName || 'Marca não disponível'}</p>
            <p className="text-sm text-gray-600">{product.code || 'Código não disponível'}</p>
          </div>
          <div className="mt-auto">
            <p className="text-lg font-semibold text-blue-600">R$ {Number(product.price).toFixed(2)}</p>
          </div>
        </div>
      </div>
    ))
  ) : (
    <div className="col-span-full text-center py-12">
      <p className="text-gray-500">Nenhum produto encontrado</p>
    </div>
  )}
</div>


      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Produto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Código do Produto
            </label>
            <input
              type="text"
              id="code"
              required
              value={newProduct.code}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, code: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="Ex: SKU123"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              type="text"
              id="name"
              required
              value={newProduct.name}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="Nome do produto"
            />
          </div>

          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
              Marca
            </label>
            <select
  id="brand"
  required
  value={newProduct.brandId}
  onChange={(e) => setNewProduct((prev) => ({ ...prev, brandId: e.target.value }))}
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
>
  <option value="">Selecione uma marca</option>
  {brands.map((brand) => (
    <option key={brand.id} value={brand.id}>
      {brand.name}
    </option>
  ))}
</select>


          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Categoria
            </label>
            <select
              id="category"
              required
              value={newProduct.categoryId}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            >
              <option value="">Selecione uma categoria</option>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Preço de Venda
              </label>
              <input
                type="number"
                id="price"
                required
                min="0"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700">
                Preço de Compra
              </label>
              <input
                type="number"
                id="purchasePrice"
                required
                min="0"
                step="0.01"
                value={newProduct.purchasePrice}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Tamanhos e Quantidades</label>
              <button
                type="button"
                onClick={handleAddSize}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                aria-label="Adicionar novo tamanho"
              >
                <Plus size={16} />
                Adicionar tamanho
              </button>
            </div>

            {newProduct.sizes?.map((sizeItem, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <label htmlFor={`size-${index}`} className="sr-only">
                    Tamanho
                  </label>
                  <select
                    id={`size-${index}`}
                    value={sizeItem.size}
                    onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  >
                    {SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor={`quantity-${index}`} className="sr-only">
                    Quantidade
                  </label>
                  <input
                    id={`quantity-${index}`}
                    type="number"
                    min="1"
                    value={sizeItem.quantity}
                    onChange={(e) => handleSizeChange(index, "quantity", Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                    placeholder="Quantidade"
                  />
                </div>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                    aria-label={`Remover tamanho ${sizeItem.size}`}
                  >
                    <AlertCircle size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700">
              Cor
            </label>
            <input
              type="text"
              id="color"
              required
              value={newProduct.color}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, color: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="Ex: Azul"
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              URL da Imagem (opcional)
            </label>
            <input
              type="url"
              id="image"
              value={newProduct.image}
              onChange={(e) => setNewProduct((prev) => ({ ...prev, image: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              placeholder="https://placehold.co/300x300"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  )
}

