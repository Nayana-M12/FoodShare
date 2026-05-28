const pool = require('../db');
const {
  getColumns,
  pickFields,
  pickFirstValue,
  findFirstMatchingColumn,
} = require('./dbHelpers');

async function resolveNgoId(payload) {
  const directNgoId = pickFirstValue(payload, ['ngo_id', 'ngoId']);

  if (directNgoId) {
    const [directRows] = await pool.query(
      'SELECT ngo_id FROM ngos WHERE ngo_id = ? LIMIT 1',
      [directNgoId]
    );

    if (directRows[0]?.ngo_id) {
      return directRows[0].ngo_id;
    }

    const [userRows] = await pool.query(
      'SELECT ngo_id FROM ngos WHERE user_id = ? LIMIT 1',
      [directNgoId]
    );

    if (userRows[0]?.ngo_id) {
      return userRows[0].ngo_id;
    }
  }

  const userId = pickFirstValue(payload, ['user_id', 'userId']);

  if (!userId) {
    return null;
  }

  const [rows] = await pool.query(
    'SELECT ngo_id FROM ngos WHERE user_id = ? LIMIT 1',
    [userId]
  );

  return rows[0]?.ngo_id || null;
}

async function availableFood(req, res) {
  try {
    const foodMeta = await getColumns('food_donations');
    const statusColumn = findFirstMatchingColumn(foodMeta.columns, ['status', 'donation_status']);
    const ngoColumn = findFirstMatchingColumn(foodMeta.columns, ['ngo_id']);
    const requestedNgoId = pickFirstValue(req.query, ['ngo_id', 'ngoId']);

    const pickupsMeta = await getColumns('pickup_requests');
    const deliveriesMeta = await getColumns('deliveries');
    const volunteersMeta = await getColumns('volunteers');
    const usersMeta = await getColumns('users');
    const pickupDonationColumn = findFirstMatchingColumn(pickupsMeta.columns, ['donation_id', 'food_donation_id', 'food_id']);
    const pickupRequestColumn = findFirstMatchingColumn(pickupsMeta.columns, ['request_id', 'pickup_request_id']);
    const deliveryRequestColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['request_id', 'pickup_request_id']);
    const deliveryVolunteerColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['volunteer_id', 'assigned_volunteer_id', 'user_id']);
    const volunteerUserIdColumn = findFirstMatchingColumn(volunteersMeta.columns, ['user_id', 'volunteer_user_id']);
    const userNameColumn = findFirstMatchingColumn(usersMeta.columns, ['name', 'full_name', 'username']);

    const conditions = [];
    const params = [];

    if (statusColumn) {
      const statuses = requestedNgoId
        ? ['pending', 'approved', 'available']
        : ['approved', 'available'];

      conditions.push(`\`${statusColumn}\` IN (${statuses.map(() => '?').join(', ')})`);
      params.push(...statuses);
    }

    if (ngoColumn && requestedNgoId) {
      conditions.push(`\`${ngoColumn}\` = ?`);
      params.push(requestedNgoId);
    }

    let rows = [];

    const joinPickup = pickupDonationColumn && pickupRequestColumn;
    const joinDelivery = joinPickup && deliveryRequestColumn && deliveryVolunteerColumn;
    const volunteerJoinColumn = deliveryVolunteerColumn === 'user_id'
      ? volunteerUserIdColumn
      : volunteersMeta.primaryKey;
    const joinVolunteer = joinDelivery && volunteerJoinColumn;
    const joinUser = joinVolunteer && userNameColumn && volunteerUserIdColumn;

    const selectColumns = ['fd.*'];
    if (joinUser) {
      selectColumns.push(`MAX(u.\`${userNameColumn}\`) AS volunteer_name`);
    }

    const baseQuery = `SELECT ${selectColumns.join(', ')}
      FROM food_donations fd
      ${joinPickup ? `LEFT JOIN pickup_requests pr ON fd.\`${foodMeta.primaryKey}\` = pr.\`${pickupDonationColumn}\`` : ''}
      ${joinDelivery ? `LEFT JOIN deliveries d ON pr.\`${pickupRequestColumn}\` = d.\`${deliveryRequestColumn}\`` : ''}
      ${joinVolunteer ? `LEFT JOIN volunteers v ON d.\`${deliveryVolunteerColumn}\` = v.\`${volunteerJoinColumn}\`` : ''}
      ${joinUser ? `LEFT JOIN users u ON v.\`${volunteerUserIdColumn}\` = u.\`${usersMeta.primaryKey}\`` : ''}`;

    const groupBy = `GROUP BY fd.\`${foodMeta.primaryKey}\``;

    if (conditions.length > 0) {
      [rows] = await pool.query(
        `${baseQuery} WHERE ${conditions.join(' AND ')} ${groupBy} ORDER BY 1 DESC`,
        params
      );
    } else {
      [rows] = await pool.query(`${baseQuery} ${groupBy} ORDER BY 1 DESC`);
    }

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load available food.',
      error: error.message,
    });
  }
}

async function listNgos(req, res) {
  try {
    const ngoMeta = await getColumns('ngos');
    const userMeta = await getColumns('users');
    const ngoNameColumn = findFirstMatchingColumn(ngoMeta.columns, ['ngo_name', 'organization_name', 'name', 'organization']);
    const ngoUserIdColumn = findFirstMatchingColumn(ngoMeta.columns, ['user_id', 'ngo_user_id', 'userId']);
    const userNameColumn = findFirstMatchingColumn(userMeta.columns, ['name', 'full_name', 'username']);

    const ngoSelects = [
      `n.\`${ngoMeta.primaryKey}\` AS id`,
    ];

    if (ngoNameColumn) {
      ngoSelects.push(`n.\`${ngoNameColumn}\` AS ngo_name`);
    }

    if (ngoUserIdColumn) {
      ngoSelects.push(`n.\`${ngoUserIdColumn}\` AS ngo_user_id`);
    }

    if (userNameColumn && ngoUserIdColumn) {
      ngoSelects.push(`u.\`${userNameColumn}\` AS user_name`);
    }

    if (ngoUserIdColumn && userNameColumn) {
      const [missingUsers] = await pool.query(
        `SELECT u.\`${userMeta.primaryKey}\` AS user_id, u.\`${userNameColumn}\` AS name
         FROM users u
         LEFT JOIN ngos n ON u.\`${userMeta.primaryKey}\` = n.\`${ngoUserIdColumn}\`
         WHERE u.role = 'ngo' AND n.\`${ngoUserIdColumn}\` IS NULL`
      );

      for (const user of missingUsers) {
        const insertPayload = {
          [ngoUserIdColumn]: user.user_id,
        };

        if (ngoNameColumn) {
          insertPayload[ngoNameColumn] = user.name || null;
        }

        await pool.query('INSERT INTO ngos SET ?', [insertPayload]);
      }
    }

    const joinUsers = ngoUserIdColumn && userNameColumn;
    const [ngoRows] = await pool.query(
      `SELECT ${ngoSelects.join(', ')}
       FROM ngos n
       ${joinUsers ? `LEFT JOIN users u ON n.\`${ngoUserIdColumn}\` = u.\`${userMeta.primaryKey}\`` : ''}
       ORDER BY n.\`${ngoMeta.primaryKey}\` DESC`
    );

    const data = ngoRows.map((row) => ({
      id: row.id,
      name: row.ngo_name || row.user_name || `NGO ${row.id}`,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load NGOs.',
      error: error.message,
    });
  }
}

async function requestPickup(req, res) {
  try {
    const { columns } = await getColumns('pickup_requests');
    const resolvedNgoId = await resolveNgoId(req.body);
    const payload = {
      ...req.body,
      ngo_id: resolvedNgoId,
      donation_id: pickFirstValue(req.body, ['donation_id', 'donationId', 'food_donation_id', 'foodDonationId', 'food_id', 'foodId']),
      request_status: req.body.request_status || req.body.status || 'approved',
    };

    const ngoColumn = findFirstMatchingColumn(columns, ['ngo_id', 'ngo_user_id', 'user_id']);
    const donationColumn = findFirstMatchingColumn(columns, ['donation_id', 'food_donation_id', 'food_id']);
    const statusColumn = findFirstMatchingColumn(columns, ['request_status', 'status']);

    if (ngoColumn && payload.ngo_id !== null) {
      payload[ngoColumn] = payload.ngo_id;
    }

    if (donationColumn && payload.donation_id !== null) {
      payload[donationColumn] = payload.donation_id;
    }

    if (statusColumn) {
      payload[statusColumn] = payload.request_status;
    }

    const requestData = pickFields(payload, columns, ['id']);

    if (Object.keys(requestData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid pickup request fields were provided.',
      });
    }

    const [result] = await pool.query('INSERT INTO pickup_requests SET ?', [requestData]);

    return res.status(201).json({
      success: true,
      message: 'Pickup request created successfully.',
      requestId: result.insertId,
    });
  } catch (error) {
    console.error('Pickup request failed:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
        ? `Failed to create pickup request: ${error.message}`
        : 'Failed to create pickup request.',
      error: error.message,
    });
  }
}

async function myRequests(req, res) {
  try {
    const ngoId = await resolveNgoId(req.query);

    if (!ngoId) {
      return res.status(400).json({
        success: false,
        message: 'A NGO identifier is required.',
      });
    }

    const { columns, primaryKey } = await getColumns('pickup_requests');
    const ownerColumn = findFirstMatchingColumn(columns, ['ngo_id', 'ngo_user_id', 'user_id']);
    const donationColumn = findFirstMatchingColumn(columns, ['donation_id', 'food_donation_id', 'food_id']);

    if (!ownerColumn) {
      return res.status(500).json({
        success: false,
        message: 'No NGO owner column found in pickup_requests table.',
      });
    }

    let rows = [];
    const orderColumn = columns.includes('created_at') ? 'created_at' : primaryKey;

    if (donationColumn) {
      const foodColumns = await getColumns('food_donations');
      const foodSelects = ['pr.*'];

      if (foodColumns.columns.includes('food_name')) {
        foodSelects.push('fd.food_name AS food_name');
      }

      if (foodColumns.columns.includes('quantity')) {
        foodSelects.push('fd.quantity AS quantity');
      }

      if (foodColumns.columns.includes('donor_name')) {
        foodSelects.push('fd.donor_name AS donor_name');
      }

      if (foodColumns.columns.includes('donor')) {
        foodSelects.push('fd.donor AS donor');
      }

      if (foodColumns.columns.includes('item_name')) {
        foodSelects.push('fd.item_name AS item_name');
      }

      if (foodColumns.columns.includes('food_item')) {
        foodSelects.push('fd.food_item AS food_item');
      }

      if (foodColumns.columns.includes('title')) {
        foodSelects.push('fd.title AS title');
      }

      if (foodColumns.columns.includes('created_at')) {
        foodSelects.push('fd.created_at AS donation_created_at');
      }

      const deliveriesMeta = await getColumns('deliveries');
      const volunteersMeta = await getColumns('volunteers');
      const usersMeta = await getColumns('users');
      const deliveryRequestColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['request_id', 'pickup_request_id']);
      const deliveryVolunteerColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['volunteer_id', 'assigned_volunteer_id', 'user_id']);
      const volunteerUserIdColumn = findFirstMatchingColumn(volunteersMeta.columns, ['user_id', 'volunteer_user_id']);
      const userNameColumn = findFirstMatchingColumn(usersMeta.columns, ['name', 'full_name', 'username']);
      const volunteerJoinColumn = deliveryVolunteerColumn === 'user_id'
        ? volunteerUserIdColumn
        : volunteersMeta.primaryKey;

      if (deliveryRequestColumn && deliveryVolunteerColumn && volunteerJoinColumn && userNameColumn && volunteerUserIdColumn) {
        foodSelects.push(`u.\`${userNameColumn}\` AS volunteer_name`);
      }

      const [joinedRows] = await pool.query(
        `SELECT ${foodSelects.join(', ')}
         FROM pickup_requests pr
         LEFT JOIN food_donations fd ON pr.\`${donationColumn}\` = fd.\`${foodColumns.primaryKey}\`
         ${deliveryRequestColumn && deliveryVolunteerColumn ? `LEFT JOIN deliveries d ON pr.\`${primaryKey}\` = d.\`${deliveryRequestColumn}\`` : ''}
         ${deliveryRequestColumn && deliveryVolunteerColumn && volunteerJoinColumn ? `LEFT JOIN volunteers v ON d.\`${deliveryVolunteerColumn}\` = v.\`${volunteerJoinColumn}\`` : ''}
         ${deliveryRequestColumn && deliveryVolunteerColumn && volunteerJoinColumn && userNameColumn && volunteerUserIdColumn ? `LEFT JOIN users u ON v.\`${volunteerUserIdColumn}\` = u.\`${usersMeta.primaryKey}\`` : ''}
         WHERE pr.\`${ownerColumn}\` = ?
         ORDER BY pr.\`${orderColumn}\` DESC`,
        [ngoId]
      );

      rows = joinedRows;
    } else {
      const [plainRows] = await pool.query(
        `SELECT * FROM pickup_requests WHERE \`${ownerColumn}\` = ? ORDER BY \`${orderColumn}\` DESC`,
        [ngoId]
      );
      rows = plainRows;
    }

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pickup requests.',
      error: error.message,
    });
  }
}

module.exports = {
  availableFood,
  requestPickup,
  myRequests,
  listNgos,
};
