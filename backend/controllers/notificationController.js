const pool = require('../db');
const {
  getColumns,
  pickFields,
  pickFirstValue,
  findFirstMatchingColumn,
} = require('./dbHelpers');

async function addNotification(req, res) {
  try {
    const { columns } = await getColumns('notifications');
    const payload = {
      ...req.body,
      user_id: pickFirstValue(req.body, ['user_id', 'userId', 'recipient_id', 'recipientId']),
      is_read: req.body.is_read !== undefined ? req.body.is_read : 0,
    };

    const notificationData = pickFields(payload, columns, ['id']);

    if (Object.keys(notificationData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid notification fields were provided.',
      });
    }

    const [result] = await pool.query('INSERT INTO notifications SET ?', [notificationData]);

    return res.status(201).json({
      success: true,
      message: 'Notification added successfully.',
      notificationId: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add notification.',
      error: error.message,
    });
  }
}

async function getNotifications(req, res) {
  try {
    const userId = req.params.userId;
    const { columns } = await getColumns('notifications');
    const ownerColumn = findFirstMatchingColumn(columns, ['user_id', 'recipient_id', 'to_user_id']);

    if (!ownerColumn) {
      return res.status(500).json({
        success: false,
        message: 'No user column found in notifications table.',
      });
    }

    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE \`${ownerColumn}\` = ? ORDER BY 1 DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications.',
      error: error.message,
    });
  }
}

async function markRead(req, res) {
  try {
    const notificationId = req.params.id;
    const { primaryKey, columns } = await getColumns('notifications');
    const readColumn = findFirstMatchingColumn(columns, ['is_read', 'read_status', 'read']);

    if (!readColumn) {
      return res.status(500).json({
        success: false,
        message: 'No read-status column found in notifications table.',
      });
    }

    const readValue = readColumn === 'read_status' ? 'read' : 1;

    const [result] = await pool.query(
      `UPDATE notifications SET \`${readColumn}\` = ? WHERE \`${primaryKey}\` = ?`,
      [readValue, notificationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification.',
      error: error.message,
    });
  }
}

module.exports = {
  addNotification,
  getNotifications,
  markRead,
};
