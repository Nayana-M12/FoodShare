const pool = require('../db');
const {
  getColumns,
  pickFields,
  pickFirstValue,
  findFirstMatchingColumn,
} = require('./dbHelpers');

async function resolveDonorId(payload) {
  const directDonorId = pickFirstValue(payload, ['donor_id', 'donorId']);

  if (directDonorId) {
    const [directRows] = await pool.query(
      'SELECT donor_id FROM donors WHERE donor_id = ? LIMIT 1',
      [directDonorId]
    );

    if (directRows[0]?.donor_id) {
      return directRows[0].donor_id;
    }

    const [userRows] = await pool.query(
      'SELECT donor_id FROM donors WHERE user_id = ? LIMIT 1',
      [directDonorId]
    );

    if (userRows[0]?.donor_id) {
      return userRows[0].donor_id;
    }
  }

  const userId = pickFirstValue(payload, ['user_id', 'userId']);

  if (!userId) {
    return null;
  }

  const [rows] = await pool.query(
    'SELECT donor_id FROM donors WHERE user_id = ? LIMIT 1',
    [userId]
  );

  return rows[0]?.donor_id || null;
}

async function addDonation(req, res) {
  try {
    const { columns } = await getColumns('food_donations');
    let resolvedDonorId = await resolveDonorId(req.body);
    const userId = pickFirstValue(req.body, ['user_id', 'userId', 'id', 'userID']);

    if (columns.includes('donor_id') && !resolvedDonorId && userId) {
      const donorsMeta = await getColumns('donors');
      const donorUserIdColumn = findFirstMatchingColumn(donorsMeta.columns, ['user_id', 'donor_user_id', 'userId']);

      if (donorUserIdColumn) {
        const [existing] = await pool.query(
          `SELECT \`${donorsMeta.primaryKey}\` AS donor_id FROM donors WHERE \`${donorUserIdColumn}\` = ? LIMIT 1`,
          [userId]
        );

        if (existing[0]?.donor_id) {
          resolvedDonorId = existing[0].donor_id;
        } else {
          const donorData = pickFields(req.body, donorsMeta.columns, [donorsMeta.primaryKey]);
          donorData[donorUserIdColumn] = userId;
          const [result] = await pool.query('INSERT INTO donors SET ?', [donorData]);
          resolvedDonorId = result.insertId;
        }
      }
    }

    if (columns.includes('donor_id') && !resolvedDonorId) {
      return res.status(400).json({
        success: false,
        message: 'Donor account not found for this user.',
      });
    }

    const payload = {
      ...req.body,
      donor_id: resolvedDonorId,
      status: req.body.status || 'pending',
    };

    const donationData = pickFields(payload, columns, ['id']);

    if (Object.keys(donationData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid donation fields were provided.',
      });
    }

    const [result] = await pool.query('INSERT INTO food_donations SET ?', [donationData]);
    const donationId = result.insertId;

    let assignedVolunteer = null;

    try {
      const ngoId = pickFirstValue(req.body, ['ngo_id', 'ngoId']);
      const pickupMeta = await getColumns('pickup_requests');
      const deliveriesMeta = await getColumns('deliveries');
      const volunteersMeta = await getColumns('volunteers');
      const usersMeta = await getColumns('users');

      const pickupDonationColumn = findFirstMatchingColumn(pickupMeta.columns, ['donation_id', 'food_donation_id', 'food_id']);
      const pickupNgoColumn = findFirstMatchingColumn(pickupMeta.columns, ['ngo_id', 'ngo_user_id', 'user_id']);
      const pickupStatusColumn = findFirstMatchingColumn(pickupMeta.columns, ['request_status', 'status']);

      if (pickupDonationColumn && pickupNgoColumn && ngoId) {
        const pickupPayload = {
          [pickupDonationColumn]: donationId,
          [pickupNgoColumn]: ngoId,
        };

        if (pickupStatusColumn) {
          pickupPayload[pickupStatusColumn] = 'pending';
        }

        const [pickupResult] = await pool.query('INSERT INTO pickup_requests SET ?', [pickupPayload]);
        const requestId = pickupResult.insertId;

        const volunteerColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['volunteer_id', 'assigned_volunteer_id', 'user_id']);
        const requestColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['request_id', 'pickup_request_id']);
        const volunteerUserIdColumn = findFirstMatchingColumn(volunteersMeta.columns, ['user_id', 'volunteer_user_id']);
        const userNameColumn = findFirstMatchingColumn(usersMeta.columns, ['name', 'full_name', 'username']);

        if (volunteerColumn && requestColumn && volunteersMeta.columns.length > 0) {
          const volunteerSelects = [`v.\`${volunteersMeta.primaryKey}\` AS volunteer_id`];
          if (volunteerUserIdColumn) {
            volunteerSelects.push(`v.\`${volunteerUserIdColumn}\` AS volunteer_user_id`);
          }
          if (userNameColumn && volunteerUserIdColumn) {
            volunteerSelects.push(`u.\`${userNameColumn}\` AS volunteer_name`);
          }

          const [volunteerRows] = await pool.query(
            `SELECT ${volunteerSelects.join(', ')}
             FROM volunteers v
             ${userNameColumn && volunteerUserIdColumn ? `LEFT JOIN users u ON v.\`${volunteerUserIdColumn}\` = u.\`${usersMeta.primaryKey}\`` : ''}
             ORDER BY RAND()
             LIMIT 1`
          );

          const volunteer = volunteerRows[0];

          if (volunteer?.volunteer_id) {
            const deliveryPayload = {
              [requestColumn]: requestId,
              [volunteerColumn]: volunteerColumn === 'user_id'
                ? volunteer.volunteer_user_id || volunteer.volunteer_id
                : volunteer.volunteer_id,
            };

            const statusColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['status', 'delivery_status']);
            if (statusColumn) {
              deliveryPayload[statusColumn] = 'assigned';
            }

            await pool.query('INSERT INTO deliveries SET ?', [deliveryPayload]);
            assignedVolunteer = {
              id: volunteer.volunteer_id,
              name: volunteer.volunteer_name || null,
            };
          }
        }
      }
    } catch (assignError) {
      console.warn('Volunteer assignment skipped:', assignError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Donation added successfully.',
      donationId,
      assignedVolunteer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add donation.',
      error: error.message,
    });
  }
}

async function viewDonations(req, res) {
  try {
    const donorId = await resolveDonorId(req.query);

    if (!donorId) {
      return res.status(400).json({
        success: false,
        message: 'A donor identifier is required.',
      });
    }

    const { columns } = await getColumns('food_donations');
    const ownerColumn = findFirstMatchingColumn(columns, ['donor_id', 'user_id', 'created_by']);

    if (!ownerColumn) {
      return res.status(500).json({
        success: false,
        message: 'No owner column found in food_donations table.',
      });
    }

    const [rows] = await pool.query(
      `SELECT * FROM food_donations WHERE \`${ownerColumn}\` = ? ORDER BY 1 DESC`,
      [donorId]
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch donations.',
      error: error.message,
    });
  }
}

async function updateDonation(req, res) {
  try {
    const donationId = req.params.id;
    const { columns, primaryKey } = await getColumns('food_donations');
    const updates = pickFields(req.body, columns, [primaryKey]);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields were provided to update.',
      });
    }

    const [result] = await pool.query(
      `UPDATE food_donations SET ? WHERE \`${primaryKey}\` = ?`,
      [updates, donationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Donation updated successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update donation.',
      error: error.message,
    });
  }
}

async function deleteDonation(req, res) {
  try {
    const donationId = req.params.id;
    const { primaryKey } = await getColumns('food_donations');

    const [result] = await pool.query(
      `DELETE FROM food_donations WHERE \`${primaryKey}\` = ?`,
      [donationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Donation deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete donation.',
      error: error.message,
    });
  }
}

module.exports = {
  addDonation,
  viewDonations,
  updateDonation,
  deleteDonation,
};
