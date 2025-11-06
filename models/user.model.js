import mongoose from "mongoose";



const userSchema = new mongoose.Schema({

     uid: {
        type: String,
        required: true,
        unique: true
    },
    name:{
        type:String,
        default: ""
    },
   
    mobile:{
       type: String,
    unique: true, // Ensure no duplicate mobile numbers
    required: [true, "Phone number is required"],
    },
      email : {
        type : String,
         sparse: true // ✅ prevents duplicate null errors
    },
    
   
     
    status : {
        type : String,
        enum : ["Active","Inactive","Suspended"],
        default : "Active"
    },
    address_details :[
        {
            type:mongoose.Schema.ObjectId,
            ref:'address'
        }
    ],
     shopping_cart :[
        {
            type:mongoose.Schema.ObjectId,
            ref:'cartProduct'
        }
    ],
     orderHistory :[
        {
            type:mongoose.Schema.ObjectId,
            ref:'order'
        }
    ],
    
    role:{
        type:String,
        enum:["ADMIN","USER"],
        default:"USER"
    }
},{
    timestamps:true

})

const UserModel = mongoose.model("User",userSchema)

export default UserModel