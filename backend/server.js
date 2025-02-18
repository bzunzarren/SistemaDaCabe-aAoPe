import dotenv from "dotenv";
dotenv.config();  // 💡 Mova para o topo para garantir que as variáveis sejam carregadas

import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 🔹 Opcional para formulários


// Criando a conexão com o MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  // Testar conexão com MySQL
  db.connect(err => {
    if (err) {
      console.error("❌ Erro ao conectar ao MySQL:", err.message);
      return;
    }
    console.log("✅ Conectado ao MySQL!");
  
    // Verificar banco selecionado
    db.query("SELECT DATABASE() AS database_name", (err, results) => {
      if (err) {
        console.error("❌ Erro ao selecionar banco de dados:", err.message);
      } else {
        console.log("📌 Banco de dados selecionado:", results[0]?.database_name || "Nenhum banco selecionado!");
      }
    });
  });
  

// 📌 Rota de Teste da Conexão
app.get("/test-db", (req, res) => {
  db.query("SELECT DATABASE() AS database_name", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Banco de dados conectado!", database: results[0]?.database_name });
  });
});

// 📌 Rota para listar produtos
app.get('/products', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, p.name, p.code, p.brand_id, p.color, p.price, p.sale_price, p.image, p.quantity,
        COALESCE(b.name, 'Sem marca') AS brandName 
      FROM products p 
      LEFT JOIN brands b ON p.brand_id = b.id;
    `;

    const [results] = await db.promise().query(query);

    if (!results.length) {
      return res.status(404).json({ message: 'Nenhum produto encontrado' });
    }

    res.status(200).json(results);
  } catch (err) {
    console.error('❌ Erro ao buscar produtos:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});




app.post("/products", (req, res) => {
  const { name, code, brand_id, color, price, image, quantity } = req.body;

  console.log("📦 Dados recebidos no backend:", req.body); // Debug

  if (!name || !price || !brand_id) {  // Removemos quantity, image e color da exigência
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
}


const query = `
    INSERT INTO products (id, name, code, brand_id, color, price, image, quantity) 
    VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)
`;

db.query(query, [
    name,
    code || null,
    brand_id && brand_id !== "" ? brand_id : null,
    color || "Desconhecido",  // Valor padrão para color
    price,
    image || "sem-imagem.jpg", // Valor padrão para imagem
    quantity || 0  // Valor padrão para quantidade
], (err, result) => {
    if (err) {
        console.error("❌ Erro ao criar produto:", err.message);
        return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "✅ Produto criado com sucesso", productId: result.insertId });
});
}); // ✅ Chave de fechamento adicionada



app.get("/brands", (req, res) => {
  db.query("SELECT * FROM brands", (err, results) => {
    if (err) {
      console.error("❌ Erro ao buscar marcas:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.post("/brands", (req, res) => {
  const { id, name, phone } = req.body;

  console.log("📌 Dados recebidos:", req.body);

  const sql = "INSERT INTO brands (id, name, phone) VALUES (?, ?, ?)";

  db.query(sql, [id, name, phone], (err, result) => {
    if (err) {
      console.error("❌ Erro ao criar marca:", err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log("✅ Marca criada com sucesso!", result);
    res.status(201).json({ message: "Marca criada com sucesso!" });
  });
});



  app.put("/brands/:id", (req, res) => {
    const { name, phone } = req.body;
    const { id } = req.params;
    const sql = "UPDATE brands SET name = ?, phone = ?, updatedAt = NOW() WHERE id = ?";
  
    db.query(sql, [name, phone, id], (err, result) => {
      if (err) {
        console.error("❌ Erro ao atualizar marca:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Marca atualizada!" });
    });
  });
  app.delete("/brands/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM brands WHERE id = ?";
  
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error("❌ Erro ao excluir marca:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Marca excluída!" });
    });
  });
        
 
  app.get("/customers", (req, res) => {
    db.query("SELECT * FROM customers", (err, results) => {
      if (err) {
        console.error("❌ Erro ao buscar customers:", err.message);
        return res.status(500).json({ error: err.message });
      }
  
      const customers = results.map(customer => {
        let tags = [];
        try {
          tags = customer.tags ? JSON.parse(customer.tags) : [];
        } catch (e) {
          console.error("❌ Erro ao parsear tags:", e.message);
        }
        
        return {
          ...customer,
          tags,
        };
      });
  
      res.json(customers);
    });
  });
  

// Adicionar compra ao histórico de um cliente
app.post("/clientes/:customerId/historico", (req, res) => {
  const { customerId } = req.params;
  const { amount, items } = req.body;

  if (!amount || amount <= 0) {
    console.warn("⚠️ Tentativa de salvar histórico com valor inválido.");
    return res.status(400).json({ error: "Valor da compra inválido." });
  }

  const query = `
      INSERT INTO purchase_history (customer_id, date, amount, items) 
      VALUES (?, NOW(), ?, ?)
  `;

  db.query(query, [customerId, amount, JSON.stringify(items)], (err) => {
    if (err) {
      console.error("❌ Erro ao adicionar compra ao histórico:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "✅ Compra adicionada ao histórico com sucesso!" });
  });
});


// 🔹 Buscar histórico de compras do cliente
app.get("/clientes/:customerId/historico", (req, res) => {
  const { customerId } = req.params;

  const sql = "SELECT date, amount, items FROM purchase_history WHERE customer_id = ?";
  db.query(sql, [customerId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar histórico de compras:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});



// Adicionar novo cliente
app.post("/customers", (req, res) => {
  const { id, name, email, phone, points, birthday, tags } = req.body;
  const sql = "INSERT INTO customers (id, name, email, phone, points, birthday, tags) VALUES (?, ?, ?, ?, ?, ?, ?)";

  db.query(sql, [id, name, email, phone, points, birthday, JSON.stringify(tags)], (err, result) => {
    if (err) {
      console.error("❌ Erro ao adicionar cliente:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Cliente adicionado!", id });
  });
});

// Atualizar um cliente
app.put("/customers/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, tags } = req.body;

  // Exemplo de consulta para atualizar o cliente no banco
  db.query(
    "UPDATE customers SET name = ?, email = ?, tags = ? WHERE id = ?",
    [name, email, JSON.stringify(tags), id],
    (err, result) => {
      if (err) {
        console.error("Erro ao atualizar cliente:", err.message);
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      res.status(200).json({ message: "Cliente atualizado com sucesso" });
    }
  );
});

// Deletar cliente
app.delete("/customers/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM customers WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Erro ao excluir cliente:", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente não encontrado!" });
    }

    console.log("✅ Cliente excluído com sucesso!", result);
    res.json({ message: "Cliente excluído!" });
  });
});


app.post("/update-quantity", async (req, res) => {
  const { productId, change } = req.body;

  if (!productId || change === undefined) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  try {
    const query = `
      UPDATE products 
      SET quantity = GREATEST(quantity + ?, 0) 
      WHERE id = ?;
    `;

    const [result] = await db.promise().query(query, [change, productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    res.status(200).json({ message: "Quantidade atualizada com sucesso." });
  } catch (error) {
    console.error("❌ Erro ao atualizar a quantidade:", error);
    res.status(500).json({ error: "Erro no servidor." });
  }
});

app.patch("/products/:id", async (req, res) => {
  const { id } = req.params; // Pega o ID do produto
  const { quantity } = req.body; // Pega a nova quantidade do frontend

  if (!id || quantity === undefined) {
    return res.status(400).json({ error: "ID e quantidade são obrigatórios." });
  }

  try {
    // Verifica se o produto existe
    const [existingProduct] = await db.promise().query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    // Atualiza a quantidade do produto
    const updateQuery = "UPDATE products SET quantity = ? WHERE id = ?";
    await db.promise().query(updateQuery, [quantity, id]);

    res.status(200).json({ message: "Estoque atualizado com sucesso." });
  } catch (error) {
    console.error("❌ Erro ao atualizar estoque:", error);
    res.status(500).json({ error: "Erro no servidor." });
  }
});



app.post('/financial', (req, res) => {
  let { id, date, type, amount, description } = req.body;

  console.log("📌 Dados recebidos:", req.body);

  if (!id) {
    id = crypto.randomUUID(); // Gera um novo ID se não for fornecido
  }

  if (!date || !type || !amount || !description) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
  }

  const sql = `INSERT INTO financial_records (id, date, type, amount, description) VALUES (?, ?, ?, ?, ?)`;

  db.query(sql, [id, date, type, amount, description], (err, result) => {
    if (err) {
      console.error("🚨 Erro ao inserir no banco:", err.sqlMessage);
      return res.status(500).json({ error: err.sqlMessage });
    }

    console.log("✅ Registro salvo no banco!", result);
    res.json({ message: 'Registro inserido com sucesso' });
  });
});

app.put('/financial/:id', (req, res) => {
  const { id } = req.params;
  const { date, type, amount, description } = req.body;

  console.log(`✏️ Atualizando registro com ID ${id}`);
  console.log("📌 Dados recebidos para edição:", req.body);

  if (!date || !type || !amount || !description) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
  }

  const sql = `UPDATE financial_records SET date = ?, type = ?, amount = ?, description = ? WHERE id = ?`;

  db.query(sql, [date, type, amount, description, id], (err, result) => {
    if (err) {
      console.error("🚨 Erro ao atualizar registro:", err.sqlMessage);
      return res.status(500).json({ error: err.sqlMessage });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Registro não encontrado!" });
    }

    console.log("✅ Registro atualizado com sucesso!", result);
    res.json({ message: "Registro atualizado com sucesso!" });
  });
});



app.delete('/financial/:id', (req, res) => {
  const { id } = req.params;

  console.log(`🗑️ Excluindo registro com ID ${id}`);

  const sql = `DELETE FROM financial_records WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("🚨 Erro ao excluir registro:", err.sqlMessage);
      return res.status(500).json({ error: err.sqlMessage });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Registro não encontrado!" });
    }

    console.log("✅ Registro excluído com sucesso!", result);
    res.json({ message: "Registro excluído com sucesso!" });
  });
});


app.post("/vendas", (req, res) => {
  const { id, customerId, items, total, discount, paymentMethod, date } = req.body;

  const saleQuery = "INSERT INTO sales (id, customer_id, total, discount, payment_method, date) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(saleQuery, [id, customerId, total, discount, paymentMethod, date], (err) => {
    if (err) {
      console.error("❌ Erro ao registrar venda:", err.message);
      return res.status(500).json({ error: err.message });
    }

    // 🔹 Salvar Itens da Venda
    const itemQuery = "INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ?";
    const itemsData = items.map(item => [id, item.productId, item.quantity, item.price]);

db.query(itemQuery, [itemsData], (err) => {

      if (err) {
        console.error("❌ Erro ao salvar itens da venda:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: "Venda registrada com sucesso!" });
    });
  });
});

app.post("/vendas", (req, res) => {
  const { id, customerId, items, total, discount, paymentMethod, date } = req.body;

  const saleQuery = "INSERT INTO sales (id, customer_id, total, discount, payment_method, date) VALUES (?, ?, ?, ?, ?, ?)";

  db.query(saleQuery, [id, customerId, total, discount, paymentMethod, date], (err) => {
    if (err) {
      console.error("❌ Erro ao registrar venda:", err.message);
      return res.status(500).json({ error: err.message });
    }

    // 🔹 Salvar Itens da Venda
    const itemQuery = "INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ?";
    const itemsData = items.map(item => [id, item.productId, item.quantity, item.price]);

    db.query(itemQuery, [itemsData], (err) => {
      if (err) {
        console.error("❌ Erro ao salvar itens da venda:", err.message);
        return res.status(500).json({ error: err.message });
      }

      // ✅ Adiciona a compra ao histórico do cliente
      const historyQuery = `
        INSERT INTO purchase_history (customer_id, date, amount, items) 
        VALUES (?, NOW(), ?, ?)
      `;

      db.query(historyQuery, [customerId, total, JSON.stringify(items)], (err) => {
        if (err) {
          console.error("❌ Erro ao adicionar compra ao histórico:", err.message);
          return res.status(500).json({ error: err.message });
        }

        console.log("✅ Venda registrada e adicionada ao histórico!");
        res.status(201).json({ message: "Venda registrada e adicionada ao histórico com sucesso!" });
      });
    });
  });
});


// Rota para retornar as vendas do dia
// No backend (Node.js)
app.get("/sales/today", (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Ajusta a data para o início do dia (sem hora)

  // Calculando a data de amanhã
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sql = "SELECT * FROM sales WHERE date >= ? AND date < ?";

  db.query(sql, [today.toISOString(), tomorrow.toISOString()], (err, results) => {
    if (err) {
      console.error("Erro ao buscar vendas do dia:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results); // Retorna as vendas do dia
  });
});

app.post('/api/sales', async (req, res) => {
  try {
    const query = `
      SELECT sales.id, sales.type, sales.description, sales.amount, sales.date, customers.name AS customer_name
      FROM sales
      LEFT JOIN customers ON sales.customer_id = customers.id;
    `;
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar dados", error });
  }
});
app.get('/api/sales', async (req, res) => {
  try {
    const query = `
      SELECT sales.id, sales.type, sales.description, sales.amount, sales.date, customers.name AS customer_name
      FROM sales
      LEFT JOIN customers ON sales.customer_id = customers.id;
    `;
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar dados", error });
  }
});








// 📌 Definição da porta do servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
