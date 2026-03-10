import User from '../models/user.model.js'; // Make sure to use import and add .js

// Use the 'export' keyword before each function
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    console.log('users', users);
    res.status(200).json(users);
  } catch (error) {
    console.log('error', error);
    res.status(500).send({ message: error.message });
  }
};



export const addPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    // 1. We now expect the new total points value from the frontend
    const { points } = req.body;
    const { io, userSockets } = req;

    // 2. Update validation: check if 'points' is a valid, non-negative number
    const newTotalPoints = parseInt(points, 10);
    if (isNaN(newTotalPoints) || newTotalPoints < 0) {
        return res.status(400).send({ message: 'Please provide a valid, non-negative number of points.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      // 3. CRITICAL CHANGE: Use '$set' to overwrite the value instead of '$inc'
      { $set: { points: newTotalPoints } },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).send({ message: 'User not found.' });
    }

    // --- Real-time logic remains the same ---
    const socketId = userSockets[userId];
    if (socketId) {
      io.to(socketId).emit('pointsUpdated', {
          newPoints: updatedUser.points
      });
      console.log(`Emitted points update to user ${userId}`);
    }

    res.status(200).send({ message: "Points updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};


// --- NEW: DELETE USER FUNCTION ---
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user by ID and delete them
    const deletedUser = await User.findByIdAndDelete(userId);

    // If no user was found with that ID
    if (!deletedUser) {
      return res.status(404).send({ message: 'User not found.' });
    }

    // Respond with a success message
    res.status(200).send({ message: 'User deleted successfully.' });

  } catch (error) {
    // Handle potential errors (e.g., invalid ID format)
    res.status(500).send({ message: error.message || 'An error occurred while deleting the user.' });
  }
};