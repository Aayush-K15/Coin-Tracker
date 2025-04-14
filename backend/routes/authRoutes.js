  const express = require("express");
  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");
  const { body, validationResult } = require("express-validator");
  const db = require("../config/db");
  require("dotenv").config();

  const router = express.Router();

  router.post("/signup", [
    body("name").notEmpty().trim().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage("Password must contain at least one letter and one number"),
    body("dob")
      .optional()
      .isISO8601()
      .withMessage("DOB must be a valid date in YYYY-MM-DD format"),
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: errors.array()[0].msg 
      });
    }

    const { name, email, password, dob } = req.body;

    try {
      // Check for existing user
      const [existingUser] = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );
      
      if (existingUser.length > 0) {
        console.log(`Signup attempt with existing email: ${email}`);
        return res.status(409).json({ 
          success: false,
          error: "Email is already registered. Please login instead." 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert new user
      const [result] = await db.query(
        "INSERT INTO users (name, email, password, dob) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, dob || null]
      );

      // Generate JWT token
      const token = jwt.sign(
        { 
          user_id: result.insertId,
          email: email
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Return response with token
      res.status(201).json({
        success: true,
        message: "User registered successfully!",
        user: {
          id: result.insertId,
          name,
          email,
          dob: dob || null
        },
        token
      });

      console.log(`✅ New user registered: ${email}`);

    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to complete registration. Please try again."
      });
    }
  });


  // **User Login**
  router.post("/login", [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      // **Fetch user from database**
      const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

      if (user.length === 0) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      // **Verify password**
      const isMatch = await bcrypt.compare(password, user[0].password);
      if (!isMatch) return res.status(401).json({ error: "Invalid email or password." });

      // **Generate JWT Token**
      const token = jwt.sign(
        { user_id: user[0].id, email: user[0].email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ message: "Login successful", token, user: { id: user[0].id, name: user[0].name, email: user[0].email } });
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({ error: "Failed to log in." });
    }
  });
  const authenticateToken = require("../middleware/auth");

  router.get("/me", authenticateToken, async (req, res) => {
    try {
      const user_id = req.user.user_id;

      const [user] = await db.query("SELECT id, name, email, dob FROM users WHERE id = ?", [user_id]);
      if (!user || user.length === 0) {
        return res.status(404).json({ success: false, error: "User not found." });
      }

      res.json({ success: true, user: user[0] });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch profile." });
    }
  });
  router.put("/me", authenticateToken, [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("dob").optional().isISO8601().withMessage("DOB must be a valid date")
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { name, dob } = req.body;
    const user_id = req.user.user_id;

    try {
      const updateFields = [];
      const updateValues = [];

      if (name) {
        updateFields.push("name = ?");
        updateValues.push(name);
      }

      if (dob) {
        updateFields.push("dob = ?");
        updateValues.push(dob);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ success: false, error: "No valid fields to update." });
      }

      updateValues.push(user_id);

      await db.query(`UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`, updateValues);

      res.json({ success: true, message: "Profile updated successfully." });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ success: false, error: "Failed to update profile." });
    }
  });

  // Update email
  router.put("/update-email", authenticateToken, [
    body("email").isEmail().withMessage("Valid email is required"),
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email } = req.body;
    const user_id = req.user.user_id;

    try {
      const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, error: "Email is already in use." });
      }

      await db.query("UPDATE users SET email = ? WHERE id = ?", [email, user_id]);
      res.json({ success: true, message: "Email updated successfully." });
    } catch (error) {
      console.error("Email update error:", error);
      res.status(500).json({ success: false, error: "Failed to update email." });
    }
  });

  module.exports = router;