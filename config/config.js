import mysql from 'mysql2/promise'
// import {config} from 'dotenv'
// config()
import dotenv from 'dotenv'
dotenv.config()
const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    waitForConnections: true,  
    connectionLimit: 5,          
    queueLimit: 0      
})

export {pool}