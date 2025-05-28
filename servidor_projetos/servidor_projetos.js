var http = require('http');
var express = require('express');
let bodyParser = require("body-parser");
var mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;
const uri = 'mongodb+srv://kauan:pJGg8HUJbuEsvLFj@cluster0.tzvmrin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
var dbo = client.db("bd_carros");
var usuarios = dbo.collection("usuarios");

var app = express();
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', './views');

var server = http.createServer(app);
server.listen(80);

console.log("Servidor rodando!");

let usuarios2 = []; // Lista para armazenar usuários cadastrados


async function conectar(nomeBanco = "ProjetoBD") {
    if (!client.topology || !client.topology.isConnected()) {
        await client.connect();
    }
    return client.db(nomeBanco);
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

app.get("/inicio", function(req,res){
    res.redirect("Projetos/menu.html")
})
app.get("/cadastro_usu", function (req, res) {
    res.redirect("Projetos/cadastro_usu.html");
});
app.get("/carros", async function(req, res) {
  try {
    const db = await conectar("bd_carros");
    const carros = await db.collection("carros").find().toArray();
    res.render("carros", { carros });
  } catch (err) {
    res.status(500).send("Erro ao carregar carros");
  }
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
    usuarios2.push({ nome, user, senha });

    res.redirect("/login");
});

// Login de usuário
app.post("/login", function (req, res) {
    let user = req.body.User;
    let senha = req.body.Senha;
    console.log("Tentativa de login:", user, senha);

    let encontrado = usuarios2.find(u => u.user === user && u.senha === senha);

    if (encontrado) {
        res.render("resposta", { nome: encontrado.nome, user: encontrado.user, senha: encontrado.senha, erro: null });
    } else {
        res.render("resposta", { nome: null, user: null, senha: null, erro: "Usuário ou senha incorretos!" });
    }
});

app.post("/cadastro_usu", async function(req, resp) {
    const db = await conectar("bd_carros");
    let data = {
        db_nome: req.body.nome,
        db_usuario: req.body.usuario,
        db_senha: req.body.senha
    };

    db.collection("usuarios").insertOne(data, function (err) {
        if (err) {
            resp.render('resposta_usu.ejs', { resposta: "Erro ao cadastrar usuário!" });
        } else {
            // Redireciona para o login após cadastro
            resp.redirect("/inicio");
        }
    });
});


app.post("/login_usu", async function(req, resp) {
    const db = await conectar("bd_carros");
    let data = {
        db_usuario: req.body.usuario,
        db_senha: req.body.senha
    };
    // Busca na coleção "usuarios" os documentos que correspondem aos dados informados (ex: login e senha)
    db.collection("usuarios").find(data).toArray(function(err, items) {
      // Se nenhum usuário for encontrado (lista vazia), exibe mensagem de erro de login
        if (items.length === 0) {
            resp.render('resposta_usu.ejs', { resposta: "Usuário/senha não encontrado!" });
          // Se ocorrer algum erro durante a busca no banco de dados, exibe mensagem de erro genérica
        } else if (err) {
            resp.render('resposta_usu.ejs', { resposta: "Erro ao logar usuário!" });
        } else {
            // Redireciona para carros.html
            resp.redirect("/carros");
        }
    });
});

app.get("/listar_carros", async function(req, res) {
  try {//Serve para tentar executar um bloco de código que pode causar erro
    const db = await conectar("bd_carros"); // conecta ao banco de carros
    const carros = await db.collection("carros").find().toArray(); // busca todos os carros
    res.render("listar_carros", { carros }); // renderiza a página listar_carros.ejs
  } catch (err) {//Trata esse erro e envia a reposta correta
    console.error("Erro ao buscar carros:", err);
    res.status(500).send("Erro ao carregar carros");
  }
});

app.post("/cadastrar_carro", async function (req, res) {
  const { marca, modelo, ano, qtde_disponivel } = req.body;

  const carro = {
    marca,
    modelo,
    ano: parseInt(ano),
    qtde_disponivel: parseInt(qtde_disponivel)
  };

  try {
    const db = await conectar("bd_carros"); // usa o banco correto
    await db.collection("carros").insertOne(carro);
    res.redirect("/listar_carros"); // depois de cadastrar, redireciona para a lista
  } catch (err) {
    console.error("Erro ao cadastrar carro:", err);
    res.status(500).send("Erro ao cadastrar carro");
  }
});

app.post("/remover_carro", async function(req, res) {
  const id = new mongodb.ObjectId(req.body.id);
  try {
    const db = await conectar("bd_carros");
    await db.collection("carros").deleteOne({ _id: id });
    res.redirect("/carros");
  } catch (err) {
    res.status(500).send("Erro ao remover carro");
  }
});

app.post("/atualizar_carro", async function (req, res) {
    const id = new mongodb.ObjectId(req.body.id);
    const db = await conectar("bd_carros");

    await db.collection("carros").updateOne(
        { _id: id },
        {
            $set: {
                marca: req.body.marca,
                modelo: req.body.modelo,
                ano: req.body.ano,
                qtde_disponivel: parseInt(req.body.qtde)
            }
        }
    );

    res.redirect("/carros");
});

app.post("/vender_carro", async function(req, res) {
  const id = new mongodb.ObjectId(req.body.id);
  try {
    const db = await conectar("bd_carros");
    const carro = await db.collection("carros").findOne({ _id: id });

    if (carro.qtde_disponivel > 0) {
      await db.collection("carros").updateOne({ _id: id }, { $inc: { qtde_disponivel: -1 } });
    }

    res.redirect("/carros");
  } catch (err) {
    res.status(500).send("Erro ao vender carro");
  }
});



















