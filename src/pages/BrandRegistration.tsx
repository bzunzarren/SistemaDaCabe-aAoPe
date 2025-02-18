import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Plus, Building2 } from 'lucide-react';
import { fetchBrands, createBrand, updateBrand, deleteBrand } from '../utils/api'; // API do backend
import type { Brand } from '../types';
import { v4 as uuidv4 } from "uuid";

function BrandRegistration() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // 🔥 Buscar marcas do banco ao carregar a página
  useEffect(() => {
    fetchBrands().then(setBrands);
  }, []);

  // 🔹 Criar ou atualizar marca
  

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  console.log("📤 Enviando dados:", { name, phone });

  const newBrand = {
    id: editingBrand ? editingBrand.id : uuidv4(), // Gera um novo ID caso não esteja editando
    name,
    phone,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (editingBrand) {
    await updateBrand(editingBrand.id, newBrand);
    setEditingBrand(null);
  } else {
    await createBrand(newBrand);
  }

  setName("");
  setPhone("");
  fetchBrands().then(setBrands);
};

  
  
  
  // 🔹 Editar marca existente
  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setPhone(brand.phone);
  };

  // 🔹 Excluir marca
  const handleDelete = async (brandId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta marca?')) {
      await deleteBrand(brandId);
      fetchBrands().then(setBrands);
    }
  };

  // 🔹 Cancelar edição
  const handleCancel = () => {
    setEditingBrand(null);
    setName('');
    setPhone('');
  };

  return (
    <motion.div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Building2 className="text-primary" size={32} />
        <h1 className="text-3xl font-playfair text-[#4A3E3E]">Cadastro de Marcas</h1>
      </div>

      {/* 🔥 Formulário de Cadastro */}
      <form onSubmit={handleSubmit} className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Marca
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              required
              placeholder="Digite o nome da marca"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field w-full"
              required
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          {editingBrand && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
          <button type="submit" className="btn-primary flex items-center space-x-2">
            <Plus size={20} />
            <span>{editingBrand ? 'Atualizar' : 'Cadastrar'} Marca</span>
          </button>
        </div>
      </form>

      {/* 🔥 Lista de Marcas */}
      <div className="space-y-4">
        {brands.map(brand => (
          <motion.div
            key={brand.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card flex items-center justify-between"
          >
            <div>
              <h3 className="font-medium text-lg">{brand.name}</h3>
              <p className="text-gray-600">{brand.phone}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEdit(brand)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                title="Editar"
              >
                <Pencil size={20} />
              </button>
              <button
                onClick={() => handleDelete(brand.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                title="Excluir"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default BrandRegistration;
