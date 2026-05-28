const bcrypt = require('bcryptjs');
const pool = require('../db');
const { getColumns, pickFields, removeSensitiveFields } = require('./dbHelpers');

const allowedRoles = ['donor', 'ngo', 'volunteer', 'admin'];

async function register(req, res) {
  try {
    const { columns } = await getColumns('users');
    const name = req.body.name || req.body.full_name || req.body.username || '';
    const email = req.body.email || '';
    const password = req.body.password;
    const role = String(req.body.role || '').toLowerCase();

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required.',
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be donor, ngo, volunteer, or admin.',
      });
    }

    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = pickFields(
      {
        ...req.body,
        name,
        email,
        password: hashedPassword,
        role,
      },
      columns,
      ['id']
    );

    if (!userData.password && columns.includes('password')) {
      userData.password = hashedPassword;
    }

    const [result] = await pool.query('INSERT INTO users SET ?', [userData]);
    const userId = result.insertId;

    if (role === 'donor') {
      const donorData = {
        user_id: userId,
        organization_name: req.body.restaurantName || req.body.organization_name || null,
        address: req.body.address || null,
      };
      await pool.query('INSERT INTO donors SET ?', [donorData]);
    }

    if (role === 'ngo') {
      const ngoData = {
        user_id: userId,
        ngo_name: req.body.organizationName || req.body.ngo_name || null,
        address: req.body.address || null,
      };
      await pool.query('INSERT INTO ngos SET ?', [ngoData]);
    }

    if (role === 'volunteer') {
      const volunteerData = {
        user_id: userId,
        vehicle_type: req.body.vehicleType || req.body.vehicle_type || null,
        availability_status: 'available',
      };
      await pool.query('INSERT INTO volunteers SET ?', [volunteerData]);
    }

    if (role === 'admin') {
      const adminData = {
        user_id: userId,
      };
      await pool.query('INSERT INTO admin SET ?', [adminData]);
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      userId: userId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const email = req.body.email || req.body.username || '';
    const password = req.body.password || '';
    const requestedRole = String(req.body.role || '').toLowerCase();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required.',
      });
    }

    const [usersByEmail] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = usersByEmail[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || '');

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    if (requestedRole && user.role && requestedRole !== String(user.role).toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Role mismatch for this account.',
      });
    }

    if (requestedRole && !allowedRoles.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role supplied.',
      });
    }

    const normalizedUser = { ...user };

    if (user.role === 'ngo') {
      const [ngoRows] = await pool.query('SELECT * FROM ngos WHERE user_id = ? LIMIT 1', [user.id]);
      const ngo = ngoRows[0];
      if (ngo) {
        normalizedUser.ngo_id = ngo.ngo_id;
      }
    }

    if (user.role === 'donor') {
      const [donorRows] = await pool.query('SELECT * FROM donors WHERE user_id = ? LIMIT 1', [user.id]);
      const donor = donorRows[0];
      if (donor) {
        normalizedUser.donor_id = donor.donor_id;
      }
    }

    if (user.role === 'volunteer') {
      const [volunteerRows] = await pool.query('SELECT * FROM volunteers WHERE user_id = ? LIMIT 1', [user.id]);
      const volunteer = volunteerRows[0];
      if (volunteer) {
        normalizedUser.volunteer_id = volunteer.volunteer_id;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: removeSensitiveFields(normalizedUser),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message,
    });
  }
}

module.exports = {
  register,
  login,
};
