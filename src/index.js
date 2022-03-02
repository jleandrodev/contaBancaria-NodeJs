const { verify } = require('crypto');
const express = require('express');
const { v4 } = require('uuid');

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

    req.customer = customer

    next();
};

function getBalance(statement) {
    

        const balance = statement.reduce((acc, operation) => {
            if(operation.type === 'credit') {
                acc + operation.amount;
            } else {
                acc - operation.amount;
            };

        }, 0);

        return balance;
    };
    ;

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
    const { amount, description } = req.body;

    const { customer } = req;

    const statement = {
        amount,
        description,
        created_at: new Date(),
        type: 'credit',
    };

    customer.statement.push(statement);

    res.status(201).json('OK!')
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


app.listen(PORT, () => {
    console.log(`Server is running in http://localhost:${PORT}`)
})

