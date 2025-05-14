var http = require('http');
var express = require('express');
let bodyParser = require("body-parser");
var mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;
const uri = 'mongodb+srv://kauan:pJGg8HUJbuEsvLFj@cluster0.tzvmrin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

var app = express();
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', './views');

var server = http.createServer(app);
server.listen(80);

console.log("Servidor rodando!");

let usuarios = []; // Lista para armazenar usuários cadastrados

async function conectar() {
    if (!client.topology || !client.topology.isConnected()) {
        await client.connect();
    }
    return client.db("ProjetoBD");
}


app.get("/", function (req, res) {
    res.redirect("Projetos/projetos.html");
});

// Rota para a página de login (login.html)
app.get("/login", function (req, res) {
    res.redirect("Projetos/login.html");
});

// Rota para a página de cadastro de usuário (cadastro.html)
app.get("/cadastrar", function (req, res) {
    res.redirect("Projetos/cadastro.html");
});

// Rota para o blog (busca posts do MongoDB)
app.get("/blog", async function (req, res) {
    try {
        const db = await conectar();
        const posts = await db.collection("posts").find().toArray();
        res.render("blog", { posts });
    } catch (err) {
        console.error("Erro ao buscar posts:", err);
        res.status(500).send("Erro ao carregar o blog");
    }
});

// Rota para a página de cadastro de post
app.get("/cadastrar_post", function (req, res) {
    res.redirect("Projetos/cadastrar_post.html");
});

// Rota para criar um novo post no MongoDB
app.post("/criar_post", async function (req, res) {
    const { title, summary, content } = req.body;
    try {
        const db = await conectar();
        await db.collection("posts").insertOne({ title, summary, content });
        res.redirect("/blog");
    } catch (err) {
        console.error("Erro ao cadastrar post:", err);
        res.status(500).send("Erro ao criar post");
    }
});

// Cadastro de usuário
app.post("/cadastrar", function (req, res) {
    let nome = req.body.Nome;
    let user = req.body.User;
    let senha = req.body.Senha;
    console.log("Cadastro:", nome, user, senha);

    // Adiciona o novo usuário
    usuarios.push({ nome, user, senha });

    res.redirect("/login");
});

// Login de usuário
app.post("/login", function (req, res) {
    let user = req.body.User;
    let senha = req.body.Senha;
    console.log("Tentativa de login:", user, senha);

    let encontrado = usuarios.find(u => u.user === user && u.senha === senha);

    if (encontrado) {
        res.render("resposta", { nome: encontrado.nome, user: encontrado.user, senha: encontrado.senha, erro: null });
    } else {
        res.render("resposta", { nome: null, user: null, senha: null, erro: "Usuário ou senha incorretos!" });
    }
});














