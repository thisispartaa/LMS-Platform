import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { storage } from './storage.js';

// Configure local authentication strategy
export function setupLocalAuth() {
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email: string, password: string, done) => {
      try {
        console.log('Login attempt for email:', email);
        
        // Find user by email
        const users = await storage.getAllUsers();
        console.log('All users:', users.map(u => ({ email: u.email, id: u.id, hasPassword: !!u.password })));
        
        const user = users.find(u => u.email === email);
        console.log('Found user:', user ? { email: user.email, id: user.id, hasPassword: !!user.password } : 'not found');
        
        if (!user) {
          console.log('User not found');
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Check password (in production, use proper password hashing)
        console.log('Password check:', { provided: password, stored: user.password, match: user.password === password });
        if (user.password !== password) {
          console.log('Password mismatch');
          return done(null, false, { message: 'Invalid email or password' });
        }

        console.log('Login successful for user:', user.email);
        return done(null, user);
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
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}