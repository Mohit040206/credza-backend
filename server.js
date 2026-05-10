require("dotenv").config();


const express=require("express");
const mongoose=require("mongoose");
const cors=require("cors");
const mainroutes=require("./src/routes/mainRoutes")

const app=express();

app.use(cors(
    "http://localhost:5173",
    "https://localhost:5173"
));

app.use(express.json());


// mount route
app.use("/api",mainroutes)


//Test route
app.get("/",(req,res)=>{
    res.send("App is live")
})
const PORT = process.env.PORT || 5000;


mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("MongoDB connected");
    app.listen(PORT,()=>{
        console.log(`Server running at port ${PORT}`);
    })
})
.catch(err=>console.log(err))

