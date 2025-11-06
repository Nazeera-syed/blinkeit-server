import AddressModel from '../models/address.model.js'
import UserModel from '../models/user.model.js'

export const addAddressController =async(request,response)=>{
    try {
         const firebaseUid = request.userId; // from auth middleware
         const { address_line , city, state, pincode, country,mobile } = request.body

         const createAddress = new AddressModel({
            address_line,
            city,
            state,
            country,
            pincode,
            mobile,
            userId: firebaseUid 
          })

            const saveAddress = await createAddress.save()
            
            const addUserAddressId = await UserModel.findOneAndUpdate( 
                 { uid: firebaseUid },
      { $push: { address_details:  saveAddress._id } },
      { new: true }
    );
        

        return response.json({
            message : "Address Created Successfully",
            error : false,
            success : true,
            data : saveAddress
        })



    } catch (error) {
         return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }

}

export const getAddressController = async(request,response)=>{
    try {

          const firebaseUid = request.userId; // from auth middleware
          const data = await AddressModel.find({ userId: firebaseUid }).sort({ createdAt : -1})

           return response.json({
            data : data,
            message : "List of address",
            error : false,
            success : true
        })
        
    } catch (error) {
          return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const updateAddressController = async(request,response)=>{
    try {
           const firebaseUid = request.userId; // from auth middleware
           const { _id, address_line,city,state,country,pincode, mobile } = request.body 

            const updateAddress = await AddressModel.updateOne({ _id : _id,  userId: firebaseUid },{
            address_line,
            city,
            state,
            country,
            mobile,
            pincode
        })

        return response.json({
            message : "Address Updated",
            error : false,
            success : true,
            data : updateAddress
        })

    } catch (error) {
         return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}
 export const deleteAddresscontroller = async(request,response)=>{
    try {
        const firebaseUid = request.userId; // from auth middleware  
        const { _id } = request.body 

        const disableAddress = await AddressModel.updateOne({ _id : _id, userId: firebaseUid},{
            status : false
        })

        return response.json({
            message : "Address remove",
            error : false,
            success : true,
            data : disableAddress
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}
