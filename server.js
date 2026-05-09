require("dotenv").config();


const express=require("express");
const mongoose=require("mongoose");
const cors=require("cors");
const mainroutes=require("./src/routes/mainRoutes")

const app=express();

app.use(cors());

app.use(express.json());


// mount route
app.use("/api",mainroutes)


//Test route
app.get("/",(req,res)=>{
    res.send("App is live")
})


mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("MongoDB connected");
    app.listen(5000,()=>{
        console.log("Server running on port 5000");
    })
})
.catch(err=>console.log(err))

