const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const JWT_SECRET = "randomstring";
const bcrypt  = require("bcrypt");
const { z } = require('zod')
const mongoose = require("mongoose");
const {UserModel,TodoModel} = require("./db");

mongoose.connect("mongodb+srv://rishik3555:u6SX8FKJ4SaRgkqN@cluster0.sbvxn.mongodb.net/Todo-App-DB")

app.use(express.json())

app.post("/signup", async function(req, res) {
    const requireBody = z.object({
        email : z.string().min(3).max(100).email(),
        password: z.string().min(3).max(100),
        name: z.string().min(3).max(100)
    })

    const parsedData = requireBody.safeParse(req.body);

    if (!parsedData.success) {
        res.json({
            msg: "Signup Failed",
            error: parsedData.error
        })
        return
    }
    else {
        const {email, password, name} = parsedData.data;

        const hashPasword = await bcrypt.hash(password, 10);

        await UserModel.create({
            email: email,
            password: hashPasword,
            name: name
        });
            
        res.json({
            message: "You are signed up"
        })
}
});


app.post('/login', async (req,res) => {
    try{
        const email = req.body.email;
        const password = req.body.password;

        const response = await UserModel.findOne({
            email: email,
        })

        const matchPasword = await bcrypt.compare(password, response.password);

        if (response && matchPasword) {
            const token = jwt.sign({
                id: response._id.toString()
            },JWT_SECRET)
            res.send({
                token: token
            })
        }
    } catch(error) {
        res.json({
            msg: "Sign in Failed"
        })
    }
}) 

function auth(req,res,next) {
    const token = req.headers.token;

    const decoded = jwt.verify(token, JWT_SECRET);

    if (response) {
        req.userId = decoded.id
        next()
    }
    else {
        res.json({
            msg: "Invalid credentials"
        })
    }
}

app.post('/todos',auth, async (req,res) => {
    const userId = req.userId;
    const title = req.body.title;

    await TodoModel.create({
        userId: userId,
        title: title
    })
    res.json({
        msg: "Todo created successfully"
    })
})

app.get('/todos',auth, async (req,res) => {
    const userId = req.userId;

    const todo = TodoModel.find({
        userId: userId
    })
    res.json({
        todo: todo
    })
})

app.listen(3000);

app.put('/todos/:id', auth, async (req, res) => {
    const userId = req.userId;
    const todoId = req.params.id;
    const title = req.body.title;

    const updatedTodo = await TodoModel.findOneAndUpdate(
        { _id: todoId, userId: userId },
        { title: title },
        { new: true }
    );

    res.json({
        msg: "Todo updated successfully",
        todo: updatedTodo
    });
});

app.delete('/todos/:id', auth, async (req, res) => {
    const userId = req.userId;
    const todoId = req.params.id;

    await TodoModel.findOneAndDelete({
        _id: todoId,
        userId: userId
    });

    res.json({
        msg: "Todo deleted successfully"
    });
});