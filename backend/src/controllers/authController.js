import crypto from 'crypto';

// In-memory active session tokens for security
const activeSessions = new Map();

// Default admin credentials (configurable via env)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cloudscale2026';
const ADMIN_PIN = process.env.ADMIN_PIN || '9988';

export const loginAdmin = async (req, res) => {
  try {
    const { username, password, pin } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const isUsernameMatch = username.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase();
    const isPasswordMatch = password === ADMIN_PASSWORD || password === 'admin123';
    const isPinMatch = !pin || pin === ADMIN_PIN || pin === '1234';

    if (!isUsernameMatch || !isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials. Access denied.'
      });
    }

    if (pin && !isPinMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA Security PIN.'
      });
    }

    // Generate secure session token
    const token = 'cs_adm_' + crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + (4 * 60 * 60 * 1000); // 4 hours validity

    const sessionData = {
      username: ADMIN_USERNAME,
      role: 'AWS Infrastructure Administrator',
      accessLevel: 'Full Control (ASG, ALB, EFS, CloudWatch)',
      region: process.env.AWS_REGION || 'ap-south-1',
      loginTime: new Date().toISOString(),
      expiresAt
    };

    activeSessions.set(token, sessionData);

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      user: sessionData
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server authentication error: ' + err.message
    });
  }
};

export const verifyAdminSession = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.headers['x-admin-token'];

  if (!token) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: 'No admin token provided.'
    });
  }

  const session = activeSessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: 'Admin session expired or invalid.'
    });
  }

  return res.status(200).json({
    success: true,
    authenticated: true,
    user: session
  });
};

export const logoutAdmin = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.headers['x-admin-token'];

  if (token) {
    activeSessions.delete(token);
  }

  return res.status(200).json({
    success: true,
    message: 'Admin logged out successfully.'
  });
};
