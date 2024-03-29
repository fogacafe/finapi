const { json } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());


/**
 * Para usar middleware em todas rodas
 * app.use(verifyIfExistsAccountCPF);
*/

/**
 * uuid tem varias versões
 * cada uma tem uma maneira de gerar o id
 * a v4 utiliza numeros randomicos
 */

/**
 * cpf - string
 * name - string
 * id - uuid
 * statement []
 */

const customers = [];

//Middleware
function verifyIfExistsAccountCPF(request, response, next){
  const { cpf } = request.params;

  const customer = customers.find(
    (customer)=> customer.cpf === cpf
  );

  if(!customer)
    return response.status(400).json({error:"Customer not found"});

  request.customer = customer;

  return next();
}

function getBalance(statement){
  return statement.reduce((acc, operation)=>{
    if(operation.type === 'credit'){
      return acc + operation.amount;
    }else{
      return acc - operation.amount;
    }
  }, 0);
}

app.post("/account", (request, response)=>{
  const {cpf, name} = request.body;

  const customerAlredyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if(customerAlredyExists)
    return response.status(400).json({error:"Customer alredy exists!"});


  customers.push({
    cpf,
    name,
    id : uuidv4(),
    statement:[]
  });

  return response.status(201).send();
});

app.get("/statement/:cpf",verifyIfExistsAccountCPF, (request,response)=>{
  const { customer } = request;

  return response.json(customer.statement);
});

app.get("/statement/date/:cpf",verifyIfExistsAccountCPF, (request,response)=>{
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) => 
      statement.created_at.toDateString() === 
      new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});

app.post("/deposit/:cpf",verifyIfExistsAccountCPF,(request, response)=>{
  const { customer } = request;
  const { description, amount } = request.body;

  const statementOperation = {
    description,
    amount,
    created_at:new Date(),
    type:"credit"
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw/:cpf",verifyIfExistsAccountCPF,(request,response)=>{
  const { customer } = request;
  const { amount } = request.body; 

  const balance = getBalance(customer.statement);

  if(balance < amount)
    return response.status(400).json({error : "Insufficient founds!"});

  const statementOperation={
    amount,
    created_at: new Date(),
    type: "debit"
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.put("/account/:cpf", verifyIfExistsAccountCPF, (request,response)=>{
  const { name } = request.body;
  const {customer } = request;

  customer.name = name;

  return response.status(201).send();
});

app.get("/account/:cpf", verifyIfExistsAccountCPF, (request, response)=>{
  const { customer } = request;

  return response.status(200).json(customer);
})

app.delete("/account/:cpf", verifyIfExistsAccountCPF, (request,response)=>{
  const { customer } = request;

  //splice - Deleta o item e a quantidade em sequencia que será deletada
  customers.splice(customer, 1);

  return response.status(200).json(customers);
})

app.get("/balance/:cpf", verifyIfExistsAccountCPF,(request,response)=>{
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
});

app.listen(3333);