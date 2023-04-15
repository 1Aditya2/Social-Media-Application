const User=require('../models/User')
const bcrypt=require('bcrypt')
// const { token } = require('morgan')
const jwt=require('jsonwebtoken')
const {success,error}=require('../utils/responseWrapper')


const signUpController=async(req,res)=>{
    try{
        const {name,email,password}=req.body
        if(!email || !password || !name){
            // res.status(400).send('All fields are required!')
            return res.send(error(400,'All fields are required'))
        }

        const oldUser=await User.findOne({email})

        if(oldUser){
            // res.status(409).send("User is already registered")
            return res.send(error(409,'User is already registered'))
        }
        //WE will do hashing to store the password of the user inside our database

        const hashedPassword=await bcrypt.hash(password, 10)

        const user=await User.create({
            name,
            email,
            password:hashedPassword
        })

        console.log('User created successfully');
        // return res.json({
        //     user
        // })
        return res.send(success(200,'User created successfully'))

    }
    catch(e){
        return res.send(error(500,e.message))
    }
}
const loginController=async(req,res)=>{
    try{
        const {email,password} = req.body

        if(!email || !password){
            // res.status(400).send('All fields are required!')
            
            return res.send(error(400,'All field are required'))
        }

        const user=await User.findOne({email}).select('+password')

        if(!user){
            // res.status(409).send("User is not registered")
            return res.send(error(409,'User is not registered'))
        }

        const matched=await bcrypt.compare(password,user.password)

        if(!matched){
            // res.status(404).send("incorrect password")
            return res.send(error(404,'Incorrect password!'))
        }

        const accessToken=generateAccessToken({
            _id:user._id,
        })
        const refreshToken=generateRefreshToken({
            _id:user._id,
        })

        if(!accessToken || !refreshToken){
            return res.send(error(500,'Internal Server Error.Come again later!'))
        }
        res.cookie('rt',refreshToken,{
            httpOnly:true,
            secure:true
        })

        // return res.json({
        //     accessToken
        // })
        return res.send(success(200,{accessToken}))

    }
    catch(e){
        return res.send(error(500,e.message))
    }
}

//A NEW ACCESS TOKEN IS CREATED
const refreshAccessTokenController=async(req,res)=>{
    console.log('control reaches refreshAccessToken');
    const cookies=req.cookies

    if(!cookies.rt){
        // return res.status(401).send("Refresh Token in Cookie IS required")
        return res.send(error(401,'Refresh Token in Cookie is required'))

    }
    const refreshAccessToken=cookies.rt


    try{

        const decoded=jwt.verify(refreshAccessToken,process.env.REFRESH_TOKEN_SECRET_KEY)
        const _id=decoded._id
        const accessToken = generateAccessToken({_id})
        // res.status(201).json({accessToken})
        console.log(`refresh token verified and access token generated ${accessToken}`);
        return res.send(success(201,{
            accessToken
        }))
    }
    catch(e){
        console.log(e);
        // res.status(401).send("Invalid refresh token")
        return res.send(error(401,'Invalid refresh token'))
    }
}

const generateAccessToken=(data)=>{
    
    try{
        const token=jwt.sign(data,process.env.ACCESS_TOKEN_SECRET_KEY,{
            expiresIn:'1h'
        })
        return token
    }
    catch(error){
        console.log(error);
    }
}
const generateRefreshToken=(data)=>{
    
    try{
        const token=jwt.sign(data,process.env.REFRESH_TOKEN_SECRET_KEY,{
            expiresIn:'1y'
        })
        return token
    }
    catch(error){
        console.log(error);
    }
}

const logOutController=async(req,res)=>{
    try {
        res.clearCookie('rt',{
            httpOnly:true,
            secure:true
        })
        return res.send(success(200,'User logged out!'))
    } catch (e) {
        console.log(e);
        return res.send(error(404,'Sorry cannot log out!'))
    }
}



module.exports={
    signUpController,
    loginController,
    refreshAccessTokenController,
    logOutController,
  
}