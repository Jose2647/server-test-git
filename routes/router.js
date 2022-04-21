const express = require("express")
const router = new express.Router()
const Products = require('../models/productsSchema')
const USER = require("../models/userSchema")
const bcrypt = require("bcryptjs");
const authenticate = require("../middleware/authenticate")

//get all products

router.get('/getproducts', async(req,res)=>{
    try{
        const productsdata = await Products.find()
        // console.log('console the data  '+ productsdata)
        res.status(201).json(productsdata)
    }catch(error){
        console.log('error '+ error.messge)
    }
}) 

// get iduvidual product
router.get('/getproductsone/:id',async(req,res)=>{
    try{
        const {id} = req.params
        // console.log(id)
        const individualdata = await Products.findOne({id:id})
        // console.log(individualdata + ' individual data')
        res.status(201).json(individualdata)
    }catch(error){
        res.status(400).json(individualdata)
        console.log('error '+ error.messge)
    }
})

// register data
router.post("/register",async(req,res)=>{
    // console.log(req.body)

    const {fname,email,number,number01,password,cpassword} = req.body

    if(!fname || !email || !number || !number01 || !password || !cpassword){
        res.status(422).json({error:"fill all data"})
        // console.log("not data avaliable")
    }
    try{
        const preuser = await USER.findOne({email:email})

        if(preuser){
            res.status(422).json({error:"this user is already present"})
        }else if (password !== cpassword){
            res.status(422).json({error:"password and cpassword not match"})
        }else{
            const finalUser = new USER({
                fname,email,number,number01,password,cpassword
            })

            const storedata = await finalUser.save()
            // console.log(storedata)

            res.status(201).json(storedata)

        }

    }catch(error){
        console.log("error the bhai catch ma for registratoin time" + error.message);
        res.status(422).send(error);
    }
})

// login user api

router.post("/login",async(req,res)=>{

const {email,password} = req.body

    if( !email || !password){
        res.status(400).json({error:"fill the details"})
    }
    try{
        const userlogin = await USER.findOne({email:email})
        // console.log(userlogin + "válido usuario")
        if(userlogin){
            const isMatch = await bcrypt.compare(password,userlogin.password)
            

            if(!isMatch){
                res.status(400).json({error:"informações invalidas 1"})
            }else{
                
                const token = await userlogin.generateAuthtokenn()
            // console.log(token)

            res.cookie("transportsurui",token,{
                expires:new Date(Date.now() + 2900000),
                httpOnly:true
            })
            res.status(201).json(userlogin);
            }
            
                

        }else {
            res.status(400).json({ error: "usuário não exist" });
        }
    } catch (error){
        res.status(400).json({error:"informações invalidas 2"})
    } 

    
})

// adding the data in the cart

router.post("/addcart/:id",authenticate,async(req,res)=>{
    try {
        const {id} = req.params
        const cart = await Products.findOne({id:id})
        // console.log(cart + " informações  contidas no cart")

        const UserContact = await USER.findOne({_id:req.userID})
        console.log(UserContact)


        if(UserContact){
            const cartData = await UserContact.addcartdata(cart)
            await UserContact.save()
            // console.log(cartData)
            res.status(201).json(UserContact)
        }else{
            res.status(401).json({error:"invalid user"})
        }

    } catch (error) {
        res.status(401).json({error:"invalid user"})
    }
})


//get cart details
router.get("/cartdetails",authenticate,async(req,res)=>{
    try {
        const buyuser = await USER.findOne({_id:req.userID})
        res.status(201).json(buyuser)
    } catch (error) {
        // console.log("error" + error)
    }
})

//get valid user

router.get("/validuser",authenticate,async(req,res)=>{
    try {
        const validuserone = await USER.findOne({_id:req.userID})
        res.status(201).json(validuserone)
    } catch (error) {
        // console.log("error" + error)
    }
})

//remove itém from cart

router.delete("/remove/:id",authenticate,async(req,res)=>{
    try {
        const {id} = req.params
        req.rootUser.carts = req.rootUser.carts.filter((curel)=>{
            return curel.id != id
        })
        req.rootUser.save()
        res.status(201).json(req.rootUser )
        // console.log("itém removido")
    } catch (error) {
        console.log("error" + error)
        res.status(400).json(req.rootUser)
    }
})

// for user logout
router.get("/logout", authenticate, async (req, res) => {
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((curelem) => {
            return curelem.token !== req.token
        });

        res.clearCookie("transportsurui", { path: "/" });
        req.rootUser.save();
        res.status(201).json(req.rootUser.tokens);
        console.log("user logout");

    } catch (error) {
        console.log(error + "jwt provide then logout");
    }
});

// router.get("/logout",authenticate,async(req,res)=>{
//     try {
//         req.rootUser.tokens = req.rootUser.tokens.filter((curelem)=>{
//             return curelem.token !==  req.token
//         })

//         res.clearCookie("transportsurui",{path:"/"})

//         req.rootUser.save()
//         res.status(201).json(req.rootUser.tokens)
//         console.log("usuário deslogado")
//     } catch (error) {
//         // res.status(400).json(req.rootUser.tokens)
//         console.log("erro ao fazer logout")
//     }
// })




module.exports = router