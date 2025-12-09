require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Criar o cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Testar conexão
const testConnection = async () => {
  try {
    const { error } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (error) throw error;

    console.log('✅ Supabase conectado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar no Supabase:', error.message);
  }
};

testConnection();

module.exports = supabase;
