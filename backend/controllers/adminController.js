const pool = require('../db');
const {
  getColumns,
  pickFields,
  pickFirstValue,
  findFirstMatchingColumn,
} = require('./dbHelpers');

async function users(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY 1 DESC');

    const safeRows = rows.map((row) => {
      const safeRow = { ...row };
      delete safeRow.password;
      return safeRow;
    });

    return res.status(200).json({
      success: true,
      data: safeRows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load users.',
      error: error.message,
    });
  }
}

async function donations(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM food_donations ORDER BY 1 DESC');

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load donations.',
      error: error.message,
    });
  }
}

async function approveDonation(req, res) {
  try {
    const donationId = req.params.id;
    const status = String(req.body.status || 'approved').toLowerCase();
    const { primaryKey, columns } = await getColumns('food_donations');
    const statusColumn = findFirstMatchingColumn(columns, ['status', 'donation_status']);

    if (!statusColumn) {
      return res.status(500).json({
        success: false,
        message: 'No status column found in food_donations table.',
      });
    }

    const [result] = await pool.query(
      `UPDATE food_donations SET \`${statusColumn}\` = ? WHERE \`${primaryKey}\` = ?`,
      [status, donationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Donation ${status} successfully.`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update donation status.',
      error: error.message,
    });
  }
}

async function assignVolunteer(req, res) {
  try {
    const { columns } = await getColumns('deliveries');
    const payload = {
      ...req.body,
      donation_id: pickFirstValue(req.body, ['donation_id', 'food_donation_id', 'donationId']),
      volunteer_id: pickFirstValue(req.body, ['volunteer_id', 'assigned_volunteer_id', 'volunteerId']),
      status: req.body.status || 'assigned',
    };

    const deliveryData = pickFields(payload, columns, ['id']);

    if (Object.keys(deliveryData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid delivery fields were provided.',
      });
    }

    const [result] = await pool.query('INSERT INTO deliveries SET ?', [deliveryData]);

    return res.status(201).json({
      success: true,
      message: 'Volunteer assigned successfully.',
      deliveryId: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to assign volunteer.',
      error: error.message,
    });
  }
}

async function dashboard(req, res) {
  try {
    const tables = [
      'users',
      'donors',
      'ngos',
      'volunteers',
      'admin',
      'food_donations',
      'pickup_requests',
      'deliveries',
      'feedback',
      'notifications',
    ];

    const stats = {};

    for (const tableName of tables) {
      const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM ${tableName}`);
      stats[tableName] = rows[0].total;
    }

    const { columns } = await getColumns('food_donations');
    const statusColumn = findFirstMatchingColumn(columns, ['status', 'donation_status']);

    if (statusColumn) {
      const [donationStatusRows] = await pool.query(
        `SELECT \`${statusColumn}\` AS status, COUNT(*) AS total FROM food_donations GROUP BY \`${statusColumn}\``
      );
      stats.donationStatus = donationStatusRows;
    }

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data.',
      error: error.message,
    });
  }
}

module.exports = {
  users,
  donations,
  approveDonation,
  assignVolunteer,
  dashboard,
};
