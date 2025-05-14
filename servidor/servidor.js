require('colors')
var http = require('http');
var express = require('express');
let bodyParser = require("body-parser");
var mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;
const uri = 'mongodb+srv://kauan:pJGg8HUJbuEsvLFj@cluster0.tzvmrin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri, { useNewUrlParser: true });

var dbo = client.db("AulaBD");//criar banco de dados
var usuarios = dbo.collection("usuarios");//coleção de dados


var app = express();
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs')
app.set('views', './views');



var server = http.createServer(app);
server.listen(80);

console.log("Servidor rodando...".rainbow)

app.get("/Inicio", function(requisicao, resposta){
    resposta.redirect("aula 1/INDEX.HTML")
})

app.post("/inicio", function(requisicao,resposta){
    resposta.redirect("aula 1/INDEX.HTML")
})

/*app.get("/cadastrar",function(requisicao,resposta){
    let nome = requisicao.query.Nome 
    let login = requisicao.query.Login
    let senha = requisicao.query.Senha 
    let nasc = requisicao.query.Nascimento

    console.log(nome, login, senha, nasc)
})*/

app.post("/cadastrar", function(requisicao, resposta) {
    let nome = requisicao.body.Nome;
    let login = requisicao.body.Login;
    let senha = requisicao.body.Senha;
    let nasc = requisicao.body.Nasc;

    console.log(nome, login, senha, nasc);

    var data = { db_nome: nome, db_login: login, db_senha: senha, db_nasc: nasc };
    usuarios.insertOne(data, function(err){
        console.log(err)
        if(err){
            resposta.render("resposta", {status: "Erro",nome,login,senha,nasc});
        }else{
            resposta.render("resposta", {status: "Sucesso",nome,login,senha,nasc})
        }
    })




    
});

app.get("/for_ejs", function(requisicao,resposta){
    let valor = requisicao.query.valor;
    resposta.render("exemplo_for",{valor});
})

app.post('/logar', function(requisicao,resposta){
    let login = requisicao.body.login
    let senha = requisicao.body.senha
    console.log(login,senha)
    
    var data = {db_login: login, db_senha: senha}
    
    usuarios.find(data).toArray(function(err,items){
        if(items.length == 0){
            resposta.render("resposta_login",{status: "usuario/senha não encontrados"});
        }else if(err){
            resposta.render("resposta_login",{status: "erro ao logar"});
        }else{
            resposta.render("resposta_login",{status: "usuario" +login+ "logado"})
        }
    })

});

app.post("/atualizar_senha", function(requisicao,resposta){
    let login = requisicao.body.login;
    let senha = requisicao.body.senha;
    let novasenha = requisicao.body.novasenha;

    let data = {db_login: login,db_senha: senha }
    let new_data = {$set: {db_senha: novasenha}}

    usuarios.updateOne(data, new_data, function(err,result){
        console.log(result);

        usuarios.updateOne(data, new_data, function(err, result) {
            console.log(result);
        
            if (err) {
                resposta.render('resposta_login', {status: "Erro ao atualizar usuário!"});
            } else if (!result || result.modifiedCount === 0) {
                resposta.render('resposta_login', {status: "Usuário/senha não encontrado!"});
            } else {
                resposta.render('resposta_login', {status: "Usuário atualizado com sucesso!"});
            }
        });
        
    })
    
})

app.post("/remover_usuario", function(requisicao,resposta){
    let login = requisicao.body.login;
    let senha = requisicao.body.senha;

    let data = {db_login: login, db_senha: senha}

    usuarios.deleteOne(data, function(err,result){
        console.log(result);

        if (result.deletedCount == 0) {
            resposta.render('resposta_login', {status: "Usuário/senha não encontrado!"})
          }else if (err) {
            resposta.render('resposta_login', {status: "Erro ao remover usuário!"})
          }else {
            resposta.render('resposta_login', {status: "Usuário removido com sucesso!"})        
          };
    
    })
})

