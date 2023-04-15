const express=require("express")
const dotenv=require("dotenv")
dotenv.config('./.env')
const dbConnect=require('./dbConnect')
const authRouter=require('./routers/authRouter')
const postRouter=require('./routers/postRouter')
const app=express()
const morgan =require('morgan')
const {success}=require("./utils/responseWrapper")
const cookieParser=require('cookie-parser')
const cors=require('cors')
const userRouter=require('./routers/userRouter')
const cloudinary = require('cloudinary').v2;

//Middlewares
app.use(express.json({limit:'30mb'}))
app.use(morgan('common'))
app.use(cookieParser())

// Cors is used to allow backend to be accessed from any url on internet in this we are accessing it from https://localhost/3000
app.use(cors({
    credentials:true,
    origin:'http://localhost:3000'
}))

// Configuration 
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
})



app.get('/',(req,res)=>{
    // res.status(200).send('Ok done')
    res.send(success(200,'Ok done'))

})


app.use('/auth',authRouter)

app.use('/posts',postRouter)

app.use('/user',userRouter)




const port=process.env.PORT || 4001

dbConnect();

app.listen(port,()=>{
    console.log(`Listening at ${port}`);
})
