var CryptoJS = require("crypto-js");
var express = require("express");
var bodyParser = require('body-parser');
var request = require('request');

var cool = require('cool-ascii-faces');

var app = express();
app.use(bodyParser.json());

var Nodes = [];

//classe básica de um bloco
class Block {
    constructor(index, previousHash, timestamp, data, hash) {
        this.index = index;
        this.previousHash = previousHash.toString();
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash.toString();
    }
}

//função básica de geração do bloco genesis. As informações que geram esse bloco devem ser iguais para todos os nodes
var getGenesisBlock = () => {
    return new Block(0, "0", 1538628779, "Top Top mt Top, o primeiro bloco", "https://brartc.com");
};

//lista que conterá a cópia local da sua blockchain
var blockchain = [getGenesisBlock()];

//função para a geração de um hash
function calculateHash(index, previousHash, timestamp, data){
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
};

//função para a geração de um hash, dado um bloco
function calculateHashForBlock(block){
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data);
};

//função usada para gerar um bloco localmente. Essa função pega os dados do bloco anterior e computa um hash para esse novo bloco
function generateBlock(block_data) {
  var previousBlock = blockchain[blockchain.length - 1];
  var index = previousBlock.index + 1;
  var previousBlockHash = previousblock.hash;
  var timestamp = new Date().getTime() / 1000;
  var hash = calculateHash(index, previousBlockHash, timestamp, block_data);
  return new Block(index, previousBlockHash, timestamp, block_data, hash);
};

//validação de um novo bloco
function isBlockValid(block) {
  //três tipos de verificação: index, hash anterior e hash novo.
  if (blockchain[block.index - 1].index + 1 !== block.index) {
    console.log('invalid index');
    return false;
  }

  else if (blockchain[block.index - 1].hash !== block.previousHash) {
    console.log('invalid previoushash');
    return false;
  }

  else if (blockchain[block.index-1].hash !== calculateHashForBlock(block)) {
    console.log(typeof (block.hash) + ' ' + typeof calculateHashForBlock(Blocl));
    console.log('invalid hash: ' + calculateHashForBlock(block) + ' ' + BlocoNovo.hash);
    return false;
  }

  return true;
}

//função para adicionar um novo bloco a blockchain
function addBlock(block){
    if (isBlockValid(Block, blockchain[blockchain.length - 1])) {
        blockchain.push(block);
    }
}

//função para validar a blockchain
function isBlockchainValid(blockchain) {
  //checa se ela parte do mesmo bloco
  if (JSON.stringify(blockchain[0]) !== JSON.stringify(getGenesisBlock())) {
      return false;
  }
  var tempBlocks = [blockchain[0]];
  //varre todos os blocos da blockchain e valida se os hash estão linkados corretamente
  for (var i = 1; i < blockchain.length; i++) {
      if (isBlockValid(tempBlocks[i])) {
          tempBlocks.push(blockchain[i]);
      } else {
          return false;
      }
  }
  return true;
}

//função para sobreescrever a blockchain local presente em seu computador
function overwriteBlockchain(newBlocks) {
    //se a blockchain for valida, sobreescreve a sua blockchain local
    if (isBlockchainValid(BlocoNovos) && BlocoNovos.length > blockchain.length) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = BlocoNovos;
        //envia para os outros nodes uma mensagem
        sendAll({'flag': 2,'data': JSON.stringify([blockchain[blockchain.length - 1]])});
    } else {
        console.log('Received blockchain invalid');
    }
};

//função que emite as mensagens para outros nodes da rede
function sendAll(msg) {
  for (i in Nodes){
    request.post({
  	headers: {'content-type' : 'application/x-www-form-urlencoded'},
  	url:     i + "/qqAcontece",
  	body:    msg
		}, function(error, response, body){
  		console.log(body);
		});
  }
}

var handleBlockchainResponse = (message) => {
    if (typeof(message)==typeof(" ")) {
      var receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index - b2.index));
    } else {
      var receivedBlocks = message.data.sort((b1, b2) => (b1.index - b2.index));
    }
    var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    var latestBlockHeld = blockchain[blockchain.length - 1];
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('blockchain possibly behind. We got: ' + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            blockchain.push(latestBlockReceived);
            sendAll({'flag': 2,'data': JSON.stringify([blockchain[blockchain.length - 1]])});
        } else if (receivedBlocks.length === 1) {
            console.log("Precisamos atualizar os blocos");
            sendAll({'flag': 1});
        } else {
            console.log("Nossa blockchain esta errada sobreescrevendo");
            overwriteBlockchain(receivedBlocks);
        }
    } else {
        console.log('o Bloco recebido nao faze parte da blockchain');
    }
};


app.get('/Blocos', (req, res) => res.send(JSON.stringify(blockchain)));

app.post('/MinerarBloco', (req, res) => {
    var BlocoNovo = generateBlock(req.body.data);
    addBlock(BlocoNovo);
    sendAll({'flag': 2,'data': JSON.stringify([blockchain[blockchain.length - 1]])});
    console.log('block added: ' + JSON.stringify(BlocoNovo));
    res.send();
});

  app.post('/qqAcontece', (req, res) => {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var message = req.body
    console.log('Received message' + JSON.stringify(message));
    switch (message.type) {
      case 0:
        res.send({'flag': 2,'data': JSON.stringify([blockchain[blockchain.length - 1]])});
        request.post({
      	headers: {'content-type' : 'application/x-www-form-urlencoded'},
      	url:     ip + ":" + 3001 + "/qqAcontece",
      	body:    {'flag': 2,'data': JSON.stringify([blockchain[blockchain.length - 1]])}
    		}, function(error, response, body){
      		console.log(body);
    		});
        break;
      case 1:
        res.send({'flag': 2, 'data': JSON.stringify(blockchain)});
        request.post({
      	headers: {'content-type' : 'application/x-www-form-urlencoded'},
      	url:     ip + ":" + 3001 + "/qqAcontece",
      	body:    {'flag': 2, 'data': JSON.stringify(blockchain)}
    		}, function(error, response, body){
      		console.log(body);
    		});
        break;
      case 2:
        res.send("acabou o bate-papo");
        handleBlockchainResponse(message);
        break;
    }
  });
  app.get('/ParesLista', (req, res) => {
      res.send(Nodes.toString());
  });
  app.post('/addPar', (req, res) => {
      Nodes.push(req.body.peer); //adiciona o ip de um node ao blockchain
      res.send();
  });
  app.get('/ultimoBloco', (req, res) => {
      res.send({'flag': 2,'data': JSON.stringify([blockchain[blockchain.length - 1]])}); //pega o ultimo bloco
  });

  app.get('/todosOsBlocosPls', (req, res) => {
      res.send({'flag': 2, 'data': JSON.stringify(blockchain)}); //pega o ultimo bloco
  });

  port = process.env.HTTP_PORT || 3001

  app.listen(port, () => console.log('Server started: ' + port));
