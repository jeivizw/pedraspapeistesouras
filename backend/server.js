require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const app = express();
app.use(cors());
app.use(express.json());


function calcularVencedor(j1, move1, j2, move2) {
    if (move1 === move2) return 'Empate';

    if (
        (move1 === 'pedra' && move2 === 'tesoura') ||
        (move1 === 'papel' && move2 === 'pedra') ||
        (move1 === 'tesoura' && move2 === 'papel')
    ) {
        return j1; 
    }

    return j2; 
}


app.post("/jokenpo/criar", async (req, res) => {
    const { jogador1 } = req.body;
    try {
        const { data, error } = await supabase
            .from("partidas_jokenpo")
            .insert([{ jogador1, status: 'aguardando' }])
            .select();
        
        if (error) throw error;
        res.status(201).json(data[0]); 
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});


app.put("/jokenpo/entrar/:id", async (req, res) => {
    const { id } = req.params;
    const { jogador2 } = req.body;

    try {
        const { data, error } = await supabase
            .from("partidas_jokenpo")
            .update({ jogador2, status: 'jogando' })
            .eq("id", id)
            .select();

        if (error) throw error;
        res.status(200).json(data[0]);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.put("/jokenpo/jogar/:id", async (req, res) => {
    const { id } = req.params;
    const { nome_jogador, jogada } = req.body; 
    try {

        const { data: partida, error: buscaError } = await supabase
            .from("partidas_jokenpo")
            .select("*")
            .eq("id", id)
            .single();

        if (buscaError) throw buscaError;

        let updateData = {};


        if (partida.jogador1 === nome_jogador) {
            updateData = { jogada1: jogada };
        } else if (partida.jogador2 === nome_jogador) {
            updateData = { jogada2: jogada };
        } else {
            return res.status(400).json({ error: "Jogador não está nesta partida!" });
        }


        const j1Move = updateData.jogada1 || partida.jogada1;
        const j2Move = updateData.jogada2 || partida.jogada2;

        if (j1Move && j2Move) {

            const vencedor = calcularVencedor(partida.jogador1, j1Move, partida.jogador2, j2Move);
            updateData.status = 'finalizado';
            updateData.vencedor = vencedor;

            if (vencedor !== 'Empate') {
                await supabase.from("ranking_jokenpo").insert([{ nome_jogador: vencedor }]);
            }
        }

        const { data, error } = await supabase
            .from("partidas_jokenpo")
            .update(updateData)
            .eq("id", id)
            .select();

        if (error) throw error;
        res.status(200).json(data[0]);

    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.get("/jokenpo/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from("partidas_jokenpo")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        

        if (data.status !== 'finalizado') {
            data.jogada1 = data.jogada1 ? "JOGOU" : null;
            data.jogada2 = data.jogada2 ? "JOGOU" : null;
        }

        res.status(200).json(data);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});


app.get("/ranking", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("ranking_jokenpo")
            .select("*")
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        res.status(200).json(data);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Jokenpô Server rodando em http://localhost:${PORT}`);
});