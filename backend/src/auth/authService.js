const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/connection');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET must be set in environment variables');
    }
  }

  // Hash password with bcrypt
  async hashPassword(password) {
    return await bcrypt.hash(password, this.saltRounds);
  }

  // Verify password
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  generateToken(payload) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Generate session token
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Register new user
  async register(userData) {
    const { email, username, password, firstName, lastName, roleId } = userData;
    
    // Check if user already exists
    const existingUser = await db('users')
      .where('email', email)
      .orWhere('username', username)
      .first();
    
    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Get default role (user) if not specified
    const defaultRole = await db('roles').where('name', 'user').first();
    const finalRoleId = roleId || defaultRole.id;

    // Insert user
    const [user] = await db('users').insert({
      email,
      username,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role_id: finalRoleId,
      is_active: true,
      email_verified: false
    }).returning('*');

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  }

  // Login user
  async login(credentials, ipAddress, userAgent) {
    const { email, password } = credentials;
    
    // Find user with role information
    const user = await db('users')
      .join('roles', 'users.role_id', 'roles.id')
      .select(
        'users.*',
        'roles.name as role_name',
        'roles.permissions',
        'roles.description as role_description'
      )
      .where('users.email', email)
      .andWhere('users.is_active', true)
      .first();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await db('users')
      .where('id', user.id)
      .update({ last_login_at: new Date() });

    // Log login activity
    await this.logUserActivity(user.id, 'login', 'User logged in successfully', ipAddress, userAgent);

    // Generate tokens
    const jwtToken = this.generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role_name,
      permissions: user.permissions || []
    });

    const sessionToken = this.generateSessionToken();

    // Create session
    await db('user_sessions').insert({
      user_id: user.id,
      session_token: sessionToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      is_active: true
    });

    // Remove sensitive data
    const { password_hash, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token: jwtToken,
      sessionToken
    };
  }

  // Logout user
  async logout(sessionToken) {
    const session = await db('user_sessions')
      .where('session_token', sessionToken)
      .first();
    
    if (session) {
      await db('user_sessions')
        .where('session_token', sessionToken)
        .update({ is_active: false });
      
      // Log logout activity
      await this.logUserActivity(session.user_id, 'logout', 'User logged out successfully');
    }
  }

  // Get user by token
  async getUserByToken(token) {
    try {
      const decoded = this.verifyToken(token);
      
      const user = await db('users')
        .join('roles', 'users.role_id', 'roles.id')
        .select(
          'users.*',
          'roles.name as role_name',
          'roles.permissions',
          'roles.description as role_description'
        )
        .where('users.id', decoded.userId)
        .andWhere('users.is_active', true)
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Validate session
  async validateSession(sessionToken) {
    const session = await db('user_sessions')
      .join('users', 'user_sessions.user_id', 'users.id')
      .join('roles', 'users.role_id', 'roles.id')
      .select(
        'user_sessions.*',
        'users.email',
        'users.username',
        'users.first_name',
        'users.last_name',
        'roles.name as role_name',
        'roles.permissions'
      )
      .where('user_sessions.session_token', sessionToken)
      .andWhere('user_sessions.is_active', true)
      .andWhere('user_sessions.expires_at', '>', new Date())
      .first();

    if (!session) {
      throw new Error('Invalid or expired session');
    }

    return session;
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await db('users').where('id', userId).first();
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await db('users')
      .where('id', userId)
      .update({ password_hash: newPasswordHash });

    // Invalidate all sessions for this user
    await db('user_sessions')
      .where('user_id', userId)
      .update({ is_active: false });
  }

  // Clean expired sessions
  async cleanExpiredSessions() {
    const deleted = await db('user_sessions')
      .where('expires_at', '<', new Date())
      .orWhere('is_active', false)
      .del();
    
    return deleted;
  }

  // Log user activity
  async logUserActivity(userId, action, details, ipAddress = null, userAgent = null, metadata = null) {
    try {
      await db('user_activity').insert({
        user_id: userId,
        action,
        details,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: metadata ? JSON.stringify(metadata) : null
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  }
}

module.exports = new AuthService();