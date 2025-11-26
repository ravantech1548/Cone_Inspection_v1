import express from 'express';
import { login } from '../services/auth.service.js';
import { LoginSchema } from '@textile-inspector/shared';

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    // Validate input
    const { username, password } = LoginSchema.parse(req.body);
    
    // Call login service
    const result = await login(username, password);
    
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json(result);
  } catch (error) {
    // Log the full error for debugging
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      body: req.body
    });
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.errors
      });
    }
    
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

export default router;
