// /controllers/auth.controller.js
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs'; // Import Node.js File System module
import path, { dirname } from 'path'; // <-- 1. Import 'dirname' from path
import { fileURLToPath } from 'url';   // <-- 2. Import 'fileURLToPath' from 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Handle user sign up
// export const signup = async (req, res) => {
//   try {
//     // Create a new user with all the new fields from the request body
//     const user = new User({
//       firstName: req.body.firstName,
//       lastName: req.body.lastName,
//       email: req.body.email,
//       country: req.body.country,
//       mobile: req.body.mobile,
//       maritalStatus: req.body.maritalStatus,
//       gender: req.body.gender,
//       accountType: req.body.accountType,
//       dateOfBirth: req.body.dateOfBirth,
//       // IMPORTANT: Hash both the password and the transaction pin
//       password: bcrypt.hashSync(req.body.password, 8),
//       transactionPin: bcrypt.hashSync(req.body.transactionPin, 8),
//     });

//     await user.save();
//     res.status(201).send({ message: "User was registered successfully!" });
//   } catch (error) {
//     // Provide more specific error feedback if possible
//     if (error.code === 11000) {
//       return res.status(400).send({ message: "Failed! Email is already in use." });
//     }
//     res.status(500).send({ message: error.message || "An error occurred during registration." });
//   }
// };



export const signup = async (req, res) => {
  try {
    // Create a new user instance with data from the request body
    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      country: req.body.country,
      mobile: req.body.mobile,
      maritalStatus: req.body.maritalStatus,
      gender: req.body.gender,
      accountType: req.body.accountType,
      dateOfBirth: req.body.dateOfBirth,
      nidOrPassport: req.body.nidOrPassport,
      // Hash the password and transaction pin for security
      password: bcrypt.hashSync(req.body.password, 8),
      transactionPin: bcrypt.hashSync(req.body.transactionPin, 8),
    });

    // Save the new user to the database
    const savedUser = await user.save();

    // --- THIS IS THE UPDATED PART ---

    // 1. Generate a JWT token for the newly created user
    const token = jwt.sign({ id: savedUser.id }, process.env.JWT_SECRET, {
      expiresIn: 86400, // Token expires in 24 hours
    });

    // 2. Respond with a 201 status (Created) and send back the user data and token
    // This allows the frontend to automatically log the user in.
    res.status(201).send({
      id: savedUser._id,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      role: savedUser.role,
      country: savedUser.country,
      mobile: savedUser.mobile,
      gender: savedUser.gender,
      maritalStatus: savedUser.maritalStatus,
      dateOfBirth: savedUser.dateOfBirth,
      nidOrPassport: savedUser.nidOrPassport,
      accountType: savedUser.accountType,
      points: savedUser.points, // Will be the default value (e.g., 0)
      accountNumber: savedUser.accountNumber, // Will be the auto-generated number from the model
      profilePicture: savedUser.profilePicture,
      createdAt: savedUser.createdAt,
      accessToken: token, // The session token
    });

  } catch (error) {
    // Handle specific errors, like a duplicate email
    if (error.code === 11000) {
      return res.status(400).send({ message: "Failed! Email is already in use." });
    }
    // Handle other potential errors
    res.status(500).send({ message: error.message || "An error occurred during registration." });
  }
};

// Handle user sign in
export const signin = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({ accessToken: null, message: "Invalid Password!" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: 86400, // 24 hours
    });

    // --- INCLUDE THE ACCOUNT NUMBER IN THE RESPONSE ---
    res.status(200).send({
      id: user._id,
      firstName: user.firstName, // Send firstName instead of name
      lastName: user.lastName,   // Send lastName
      email: user.email,
      role: user.role,
      country: user.country,
      mobile: user.mobile,
      gender: user.gender,
      maritalStatus: user.maritalStatus,
      dateOfBirth: user.dateOfBirth,
      nidOrPassport: user.nidOrPassport,
      accountType: user.accountType,
      country : user.country,
      points: user.points,
      accountNumber: user.accountNumber, // <-- ADD THIS LINE
      profilePicture: user.profilePicture,
      accessToken: token,
      createdAt : user.createdAt
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};



export const updateProfilePicture = async (req, res) => {
    try {
        const userId = req.userId; 
        const { profilePicture } = req.body;

        if (!profilePicture || !profilePicture.startsWith('data:image')) {
            return res.status(400).send({ message: "Invalid or no image data provided." });
        }
        
        const base64Data = profilePicture.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        const fileExtension = profilePicture.split(';')[0].split('/')[1];
        const fileName = `user-${userId}-${Date.now()}.${fileExtension}`;
        
        // This will now work correctly because we defined __dirname above
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        
        fs.writeFileSync(filePath, imageBuffer);

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: fileUrl },
            { new: true }
        ).select('-password -transactionPin');

        if (!updatedUser) {
            fs.unlinkSync(filePath); 
            return res.status(404).send({ message: "User not found." });
        }

        res.status(200).send({
            message: "Profile picture updated successfully!",
            profilePicture: updatedUser.profilePicture
        });

    } catch (error) {
        console.error("PROFILE PICTURE UPLOAD FAILED:", error);
        res.status(500).send({ message: error.message || "An error occurred while updating the profile picture." });
    }
};



// NEW CONTROLLER FOR CHANGING PASSWORD
export const changePassword = async (req, res) => {
  try {
    // Get user ID from the authenticated request (set by auth middleware)
    const userId = req.userId;
    
    // Get current password and new password from request body
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).send({ 
        message: "Current password and new password are required." 
      });
    }
    
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }
    
    // Verify current password
    const passwordIsValid = bcrypt.compareSync(currentPassword, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ message: "Current password is incorrect." });
    }
    
    // Hash the new password
    const hashedNewPassword = bcrypt.hashSync(newPassword, 8);
    
    // Update user's password
    user.password = hashedNewPassword;
    await user.save();
    
    // Send success response
    res.status(200).send({ 
      message: "Password changed successfully." 
    });
  } catch (error) {
    console.error("PASSWORD CHANGE FAILED:", error);
    res.status(500).send({ 
      message: error.message || "An error occurred while changing the password." 
    });
  }
};
