const express = require('express');
const res = require('express/lib/response');

require('dotenv').config();

const app = express();
const {v4: uuidv4} = require('uuid');
const PORT = process.env.PORT || 3333;

const customers = [];

app.use(express.json());

// middlewares
function verifyIfExisstAccount(req, res, next) {

    const { cpf } = req.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);

    if(!customer) {
        return res.status(400).json({error: 'Customer not found!'})
    }

    req.customer = customer;

    return next();
};

 function getBalance(statement) {

         const balance = statement.reduce((acc, operation) => {
            if(operation.type === 'credit') {
               return acc + operation.amount;
            } else {
               return acc - operation.amount;
            };

        }, 0);


        return balance;
    };
    


// Routes
app.post('/account', (req, res) => {
    const { cpf, name } = req.body;
    
    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);
    
    if(customerAlreadyExists) {
        return res.status(400).json({error: 'Customer already exists!'})
    };
    
    
    customers.push({
        cpf,
        name,
        uuid: uuidv4(),
        statement: [],
        
    })
    
    return res.status(201).json()
});

app.get('/customers', (req, res) => {
    return res.json(customers)
});


app.get('/statement', verifyIfExisstAccount, (req, res) => {
    const { customer } = req;
    
    res.status(200).json(customer.statement);
});

app.post('/deposit', verifyIfExisstAccount, (req, res) => {
    const { description, amount } = req.body;
    
    const { customer } = req;
    
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: 'credit',
    };
    
    customer.statement.push(statementOperation);
    
    return res.status(201).json('OK!')
});

app.post('/withdraw', verifyIfExisstAccount, (req, res) => {
    
    const { amount } = req.body;
    
    const { customer } = req;
    
    const balance = getBalance(customer.statement);
    
    if(balance < amount){
        return res.status(400).json({error: 'Insufficient funds!'});
    }
    
    const statementOperation = {
        amount,
        type: 'debit',
        created_at: new Date(),
    }

    customer.statement.push(statementOperation);

    return res.status(201).json('OK');
});

app.get('/statement/date', verifyIfExisstAccount, (req, res) => {
    const { customer } = req;

    const { date } = req.query;

    const dateFormat = new Date(date + ' 00:00');

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

    return res.json(statement);

    
});

app.put('/account', verifyIfExisstAccount, (req, res) => {

    const { name } = req.body;

    const { customer } = req;

    customer.name = name;

    return res.status(201).send();

});

app.get('/account', verifyIfExisstAccount, (req, res) => {

    const { customer } = req;

    return res.json(customer);
});

app.delete('/account', verifyIfExisstAccount, (req, res) => {

    const { customer } = req;

    customers.splice(customer, 1);

    res.status(200).json(customers);
});


app.get('/balance', verifyIfExisstAccount, (req, res) => {

    const { customer } = req;
    
    const  balance = getBalance(customer.statement);
    
    return res.json(balance);
});



app.listen(PORT, () => {
    console.log(`Server is running in http://localhost:${PORT}`)
}) ;   

