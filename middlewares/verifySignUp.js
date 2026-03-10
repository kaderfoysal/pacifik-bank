// /middlewares/verifySignUp.js

import User from '../models/user.model.js';

export const checkDuplicateEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).send({ message: "Failed! Email is already in use!" });
    }
    next();
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

// No need to wrap it in an object anymore, we export the function directly.