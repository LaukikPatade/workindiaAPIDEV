const {verify}=require('jsonwebtoken')
module.exports={
    checkToken:(req,res,next)=>{
        const token=req.get("authorization")
        if(token){
            token=token.slice(7)
            verify(token,"workindia",(err,result)=>{
                if(err){
                    res.send({
                        success:0,
                        message:"Invalid token"
                    })
                }
                else{
                    next()
                }
            })
        }
        else{
            res.send({
                success:0,
                message:"Access Denied: Authorized user only"
            })
        }
    }
}