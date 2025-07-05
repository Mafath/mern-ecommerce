import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique : true,
    lowercase: true,
    trim: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please enter a valid email"
    ]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minLength: [6, "Password must be at least 6 characters"]
  },
  cartItems: [
    {
      quantity: {
        type: Number,
        required: true,
        default: 1
      },
      product: {//product field connects to Product model
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
      }
    }
  ],
  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer"
  }
}, {
  timestamps: true  //createdAt, updatedAt times of each user
});


//pre-save hook to hash password before saving the user to the database
userSchema.pre("save", async function(next) { //hashing password before save the user
  if(!this.isModified("password")) return next(); //if password is not modified, we can call the next function

  try{
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();  //then we call next function whatever that is
  } catch(error) {
    next(error);
  }
})


userSchema.methods.matchPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
}

//create a model
const User = mongoose.model("User", userSchema); //("model name", "schema name")
// methn api User kyl dunnta database eke users kyl tyenne. mongoose does this

export default User;