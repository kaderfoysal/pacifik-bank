import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // --- Updated and New Fields ---
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  country: { type: String, required: true },
  mobile: { type: String, required: true },
  maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'], required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'], required: true },
  accountType: { type: String, enum: ['Savings', 'Checking'], required: true },
  dateOfBirth: { type: Date, required: false },
  nidOrPassport: { type: String, required: false, unique: true },
  transactionPin: { type: String, required: true },
  profilePicture: {
    type: String, // Will store the Base64 string
    default: null
  },
  // --- NEW FIELD FOR ACCOUNT NUMBER ---
  accountNumber: {
    type: String,
    unique: true,
  },

  // --- Existing Fields ---
  role: { type: String, enum: ['member', 'admin'], default: 'member' },
  points: { type: Number, default: 0 },
}, { timestamps: true });


// --- LOGIC TO GENERATE UNIQUE ACCOUNT NUMBER ---
UserSchema.pre('save', async function (next) {
  // Only generate an account number if the user is new
  if (this.isNew) {
    let accountNumber;
    let isUnique = false;
    
    // Loop until we find a unique account number
    while (!isUnique) {
      // Generate a random 11-digit number
      accountNumber = Math.floor(10000000000 + Math.random() * 90000000000).toString();
      
      // Check if this account number already exists
      const existingUser = await mongoose.models.User.findOne({ accountNumber });
      if (!existingUser) {
        isUnique = true;
      }
    }
    this.accountNumber = accountNumber;
  }
  next();
});

const User = mongoose.model('User', UserSchema);
export default User;