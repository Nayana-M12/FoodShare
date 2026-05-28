const pool = require('../db');
const { getColumns, pickFields } = require('./dbHelpers');

async function addFeedback(req, res) {
  try {
    const { columns } = await getColumns('feedback');

    const payload = {
      delivery_id: req.body.delivery_id || req.body.deliveryId,
      rating: req.body.rating,
      comments: req.body.comments,
    };

    const feedbackData = pickFields(payload, columns, ['feedback_id']);

    if (!feedbackData.delivery_id || !feedbackData.rating) {
      return res.status(400).json({
        success: false,
        message: 'delivery_id and rating are required.',
      });
    }

    const [result] = await pool.query('INSERT INTO feedback SET ?', [feedbackData]);

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully.',
      feedbackId: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit feedback.',
      error: error.message,
    });
  }
}

module.exports = {
  addFeedback,
};
