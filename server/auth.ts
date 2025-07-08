import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { storage } from './storage.js';
import { PasswordUtils } from './utils/password.js';

// Configure local authentication strategy
export function setupLocalAuth() {
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email: string, password: string, done) => {
      try {
        // Find user by email
        const users = await storage.getAllUsers();
        const user = users.find(u => u.email === email);
        
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Check if user has a password set
        if (!user.password) {
          return done(null, false, { message: 'Account not properly configured. Please contact support.' });
        }

        // Compare password using bcrypt
        const isPasswordValid = await PasswordUtils.comparePassword(password, user.password);
        
        if (!isPasswordValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Remove password from user object before returning
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        // Remove password from user object
        const { password: _, ...userWithoutPassword } = user;
        done(null, userWithoutPassword);
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  });
}