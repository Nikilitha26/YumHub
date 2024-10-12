import cors from 'cors'
import express from 'express'
import {config} from 'dotenv'
import productsRouter from './routes/productsRouter.js'
import usersRouter from './routes/usersRouter.js'

config()


let PORT = process.env.PORT || 5005
const app = express()
app.use(cors({
    origin: 'http://localhost:8080' ,
    credentials: true
}))
app.use(express.json())
app.use(express.static('public'))

app.use('/users', usersRouter)
app.use('/products', productsRouter) 
app.listen(PORT, ()=>{
    console.log('http://localhost:'+PORT);
})

app.get('^/$|/capstoneaproject-backend', (req, res) => {
    res.status(200).sendFile(path.resolve('./static/html/index.html'))
})

app.get('*', (req, res) => {
    res.json({
        status: 404,
        msg: 'Resource not found'
    })
})