const jwt=require('jsonwebtoken');
const { error } = require('../utils/responseWrapper');
const User = require("../models/User");

module.exports=async(req,res,next)=>{
    if(!req.headers || !req.headers.authorization || !req.headers.authorization.startsWith("Bearer")){
        // return res.status(401).send("Authorization header is required")
        res.send(error(401,'Authorization header is required'))
    }

    const accessToken=req.headers.authorization.split(" ")[1]
    console.log(`access token extracted ${accessToken}`);

    try{
        const decoded=jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET_KEY)
        console.log(decoded);
        req._id=decoded._id
        const user=await User.findById(req._id)
        // console.log('reached here');
        if(!user){
            return res.send(error(404,'User not found'))
        }
        console.log('access Token verified');
        next()
    }
    catch(e){
        console.log('access token not verified');
        // console.log(e);
        return res.send(error(401,'Invalid access key'))
        
    }

    
}
