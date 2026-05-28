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

async function createDonation(req, res) {
  try {
    const { columns, primaryKey } = await getColumns('food_donations');
    let resolvedDonorId = await resolveDonorId(req.body);
    const resolvedNgoId = await resolveNgoId(req.body);

    if (columns.includes('donor_id') && !resolvedDonorId) {
      return res.status(400).json({
        success: false,
        message: 'Donor account not found for this user.',
      });
    }

    const statusColumn = findFirstMatchingColumn(columns, ['status', 'donation_status']);
    const ngoColumn = findFirstMatchingColumn(columns, ['ngo_id']);

    const payload = {
      ...req.body,
      donor_id: resolvedDonorId,
      ngo_id: resolvedNgoId,
    };

    if (statusColumn) {
      payload[statusColumn] = 'pending';
    }

    if (ngoColumn && resolvedNgoId) {
      payload[ngoColumn] = resolvedNgoId;
    }

    const donationData = pickFields(payload, columns, [primaryKey]);

    if (Object.keys(donationData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid donation fields were provided.',
      });
    }

    const [result] = await pool.query('INSERT INTO food_donations SET ?', [donationData]);

    return res.status(201).json({
      success: true,
      message: 'Donation created successfully.',
      donationId: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create donation.',
      error: error.message,
    });
  }
}

async function listDonations(req, res) {
  try {
    const foodMeta = await getColumns('food_donations');
    const statusColumn = findFirstMatchingColumn(foodMeta.columns, ['status', 'donation_status']);
    const donorColumn = findFirstMatchingColumn(foodMeta.columns, ['donor_id', 'user_id', 'created_by']);
    const ngoColumn = findFirstMatchingColumn(foodMeta.columns, ['ngo_id']);

    const pickupsMeta = await getColumns('pickup_requests');
    const deliveriesMeta = await getColumns('deliveries');
    const volunteersMeta = await getColumns('volunteers');
    const usersMeta = await getColumns('users');

    const pickupDonationColumn = findFirstMatchingColumn(pickupsMeta.columns, ['donation_id', 'food_donation_id', 'food_id']);
    const pickupRequestColumn = findFirstMatchingColumn(pickupsMeta.columns, ['request_id', 'pickup_request_id']);
    const pickupStatusColumn = findFirstMatchingColumn(pickupsMeta.columns, ['request_status', 'status']);

    const deliveryRequestColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['request_id', 'pickup_request_id']);
    const deliveryVolunteerColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['volunteer_id', 'assigned_volunteer_id', 'user_id']);
    const deliveryStatusColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['status', 'delivery_status']);

    const volunteerUserIdColumn = findFirstMatchingColumn(volunteersMeta.columns, ['user_id', 'volunteer_user_id']);
    const volunteerNameColumn = findFirstMatchingColumn(volunteersMeta.columns, ['name', 'full_name']);
    const userNameColumn = findFirstMatchingColumn(usersMeta.columns, ['name', 'full_name', 'username']);

    const joinPickup = pickupDonationColumn && pickupRequestColumn;
    const joinDelivery = joinPickup && deliveryRequestColumn && deliveryVolunteerColumn;
    const volunteerJoinColumn = deliveryVolunteerColumn === 'user_id'
      ? volunteerUserIdColumn
      : volunteersMeta.primaryKey;
    const joinVolunteer = joinDelivery && volunteerJoinColumn;
    const joinUsers = joinVolunteer && userNameColumn && volunteerUserIdColumn;

    const selectColumns = ['fd.*'];

    if (pickupRequestColumn) {
      selectColumns.push(`MAX(pr.\`${pickupRequestColumn}\`) AS pickup_request_id`);
    }

    if (pickupStatusColumn) {
      selectColumns.push(`MAX(pr.\`${pickupStatusColumn}\`) AS pickup_status`);
    }

    if (deliveryStatusColumn) {
      selectColumns.push(`MAX(d.\`${deliveryStatusColumn}\`) AS delivery_status`);
    }

    if (deliveriesMeta.primaryKey) {
      selectColumns.push(`MAX(d.\`${deliveriesMeta.primaryKey}\`) AS delivery_id`);
    }

    if (volunteersMeta.primaryKey) {
      selectColumns.push(`MAX(v.\`${volunteersMeta.primaryKey}\`) AS volunteer_id`);
    }

    if (volunteerNameColumn && joinUsers) {
      selectColumns.push(
        `COALESCE(MAX(v.\`${volunteerNameColumn}\`), MAX(u.\`${userNameColumn}\`)) AS volunteer_name`
      );
    } else if (volunteerNameColumn) {
      selectColumns.push(`MAX(v.\`${volunteerNameColumn}\`) AS volunteer_name`);
    } else if (joinUsers) {
      selectColumns.push(`MAX(u.\`${userNameColumn}\`) AS volunteer_name`);
    }

    const baseQuery = `SELECT ${selectColumns.join(', ')}
      FROM food_donations fd
      ${joinPickup ? `LEFT JOIN pickup_requests pr ON fd.\`${foodMeta.primaryKey}\` = pr.\`${pickupDonationColumn}\`` : ''}
      ${joinDelivery ? `LEFT JOIN deliveries d ON pr.\`${pickupRequestColumn}\` = d.\`${deliveryRequestColumn}\`` : ''}
      ${joinVolunteer ? `LEFT JOIN volunteers v ON d.\`${deliveryVolunteerColumn}\` = v.\`${volunteerJoinColumn}\`` : ''}
      ${joinUsers ? `LEFT JOIN users u ON v.\`${volunteerUserIdColumn}\` = u.\`${usersMeta.primaryKey}\`` : ''}`;

    const conditions = [];
    const params = [];

    const donorIdParam = pickFirstValue(req.query, ['donor_id', 'donorId']);
    const userIdParam = pickFirstValue(req.query, ['user_id', 'userId']);
    let donorId = donorIdParam;

    if (donorColumn === 'donor_id') {
      if (donorIdParam) {
        const [donorRows] = await pool.query(
          'SELECT donor_id FROM donors WHERE donor_id = ? LIMIT 1',
          [donorIdParam]
        );

        if (!donorRows[0]?.donor_id && userIdParam) {
          donorId = await resolveDonorId({ user_id: userIdParam });
        }
      } else if (userIdParam) {
        donorId = await resolveDonorId({ user_id: userIdParam });
      }
    }

    const donorFilterValue = donorColumn === 'user_id' && userIdParam
      ? userIdParam
      : donorId;

    if (donorFilterValue && donorColumn) {
      conditions.push(`fd.\`${donorColumn}\` = ?`);
      params.push(donorFilterValue);
    }

    const ngoId = pickFirstValue(req.query, ['ngo_id', 'ngoId']);
    if (ngoId && ngoColumn) {
      conditions.push(`fd.\`${ngoColumn}\` = ?`);
      params.push(ngoId);
    }

    const volunteerId = pickFirstValue(req.query, ['volunteer_id', 'volunteerId']);
    if (volunteerId && deliveryVolunteerColumn) {
      conditions.push(`d.\`${deliveryVolunteerColumn}\` = ?`);
      params.push(volunteerId);
    }

    const statusFilter = pickFirstValue(req.query, ['status']);
    if (statusFilter && statusColumn) {
      const statuses = String(statusFilter)
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

      if (statuses.length > 0) {
        conditions.push(`LOWER(fd.\`${statusColumn}\`) IN (${statuses.map(() => '?').join(', ')})`);
        params.push(...statuses);
      }
    }

    const groupBy = `GROUP BY fd.\`${foodMeta.primaryKey}\``;
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `${baseQuery} ${whereClause} ${groupBy} ORDER BY fd.\`${foodMeta.primaryKey}\` DESC`,
      params
    );

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
    const ngoId = await resolveNgoId(req.body);
    const foodMeta = await getColumns('food_donations');
    const statusColumn = findFirstMatchingColumn(foodMeta.columns, ['status', 'donation_status']);
    const ngoColumn = findFirstMatchingColumn(foodMeta.columns, ['ngo_id']);
    const acceptedAtColumn = findFirstMatchingColumn(foodMeta.columns, ['ngo_accepted_at', 'ngoAcceptedAt', 'accepted_at']);
    const assignedVolunteerColumn = findFirstMatchingColumn(foodMeta.columns, ['assigned_volunteer', 'assignedVolunteer']);

    const [donationRows] = await pool.query(
      `SELECT * FROM food_donations WHERE \`${foodMeta.primaryKey}\` = ? LIMIT 1`,
      [donationId]
    );

    if (!donationRows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.',
      });
    }

    const currentStatus = statusColumn ? String(donationRows[0][statusColumn] || '').toLowerCase() : '';
    if (currentStatus && currentStatus !== 'pending') {
      return res.status(409).json({
        success: false,
        message: 'Donation already approved or delivered.',
      });
    }

    const updatePayload = {};
    if (statusColumn) {
      updatePayload[statusColumn] = 'approved';
    }
    if (ngoColumn && ngoId) {
      updatePayload[ngoColumn] = ngoId;
    }
    if (acceptedAtColumn) {
      updatePayload[acceptedAtColumn] = new Date();
    }

    if (Object.keys(updatePayload).length > 0) {
      await pool.query(
        `UPDATE food_donations SET ? WHERE \`${foodMeta.primaryKey}\` = ?`,
        [updatePayload, donationId]
      );
    }

    const pickupsMeta = await getColumns('pickup_requests');
    const pickupDonationColumn = findFirstMatchingColumn(pickupsMeta.columns, ['donation_id', 'food_donation_id', 'food_id']);
    const pickupNgoColumn = findFirstMatchingColumn(pickupsMeta.columns, ['ngo_id', 'ngo_user_id', 'user_id']);
    const pickupStatusColumn = findFirstMatchingColumn(pickupsMeta.columns, ['request_status', 'status']);
    const pickupRequestColumn = findFirstMatchingColumn(pickupsMeta.columns, ['request_id', 'pickup_request_id']);

    if (!pickupDonationColumn) {
      return res.status(500).json({
        success: false,
        message: 'Pickup request table is missing donation column.',
      });
    }

    const pickupWhere = [`\`${pickupDonationColumn}\` = ?`];
    const pickupParams = [donationId];

    if (pickupNgoColumn && ngoId) {
      pickupWhere.push(`\`${pickupNgoColumn}\` = ?`);
      pickupParams.push(ngoId);
    }

    const [pickupRows] = await pool.query(
      `SELECT * FROM pickup_requests WHERE ${pickupWhere.join(' AND ')} ORDER BY 1 DESC LIMIT 1`,
      pickupParams
    );

    let pickupRequestId = pickupRows[0]?.[pickupsMeta.primaryKey] || null;

    if (pickupRows[0]) {
      const pickupUpdates = {};
      if (pickupStatusColumn) {
        pickupUpdates[pickupStatusColumn] = 'approved';
      }
      if (pickupNgoColumn && ngoId) {
        pickupUpdates[pickupNgoColumn] = ngoId;
      }
      if (Object.keys(pickupUpdates).length > 0) {
        await pool.query(
          `UPDATE pickup_requests SET ? WHERE \`${pickupsMeta.primaryKey}\` = ?`,
          [pickupUpdates, pickupRequestId]
        );
      }
    } else {
      const pickupPayload = {
        [pickupDonationColumn]: donationId,
      };
      if (pickupNgoColumn && ngoId) {
        pickupPayload[pickupNgoColumn] = ngoId;
      }
      if (pickupStatusColumn) {
        pickupPayload[pickupStatusColumn] = 'approved';
      }

      const [pickupResult] = await pool.query('INSERT INTO pickup_requests SET ?', [pickupPayload]);
      pickupRequestId = pickupResult.insertId;
    }

    const deliveriesMeta = await getColumns('deliveries');
    const deliveryRequestColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['request_id', 'pickup_request_id']);
    const deliveryVolunteerColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['volunteer_id', 'assigned_volunteer_id', 'user_id']);
    const deliveryStatusColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['status', 'delivery_status']);

    if (!deliveryRequestColumn || !deliveryVolunteerColumn) {
      return res.status(200).json({
        success: true,
        message: 'Donation approved. Delivery assignment skipped.',
      });
    }

    const [existingDeliveries] = await pool.query(
      `SELECT * FROM deliveries WHERE \`${deliveryRequestColumn}\` = ? LIMIT 1`,
      [pickupRequestId]
    );

    if (existingDeliveries[0]) {
      return res.status(200).json({
        success: true,
        message: 'Donation approved. Volunteer already assigned.',
      });
    }

    const volunteersMeta = await getColumns('volunteers');
    const availabilityColumn = findFirstMatchingColumn(volunteersMeta.columns, ['availability_status', 'availabilityStatus', 'availability', 'status']);
    const volunteerNameColumn = findFirstMatchingColumn(volunteersMeta.columns, ['name', 'full_name']);
    const volunteerUserIdColumn = findFirstMatchingColumn(volunteersMeta.columns, ['user_id', 'volunteer_user_id']);
    const usersMeta = await getColumns('users');
    const userNameColumn = findFirstMatchingColumn(usersMeta.columns, ['name', 'full_name', 'username']);

    if (!availabilityColumn) {
      return res.status(200).json({
        success: true,
        message: 'Donation approved. Volunteer availability column not found.',
      });
    }

    const [availableRows] = await pool.query(
      `SELECT v.*, ${volunteerNameColumn ? `v.\`${volunteerNameColumn}\`` : userNameColumn ? `u.\`${userNameColumn}\`` : 'NULL'} AS volunteer_name
       FROM volunteers v
       ${userNameColumn && volunteerUserIdColumn ? `LEFT JOIN users u ON v.\`${volunteerUserIdColumn}\` = u.\`${usersMeta.primaryKey}\`` : ''}
       WHERE LOWER(v.\`${availabilityColumn}\`) = 'available'
       ORDER BY RAND()
       LIMIT 1`
    );

    if (!availableRows[0]) {
      return res.status(200).json({
        success: true,
        message: 'All volunteers are busy. We will get back to you once someone is free.',
      });
    }

    const volunteer = availableRows[0];
    const volunteerIdValue = deliveryVolunteerColumn === 'user_id'
      ? volunteer[volunteerUserIdColumn] || volunteer[volunteersMeta.primaryKey]
      : volunteer[volunteersMeta.primaryKey];

    const deliveryPayload = {
      [deliveryRequestColumn]: pickupRequestId,
      [deliveryVolunteerColumn]: volunteerIdValue,
    };

    if (deliveryStatusColumn) {
      deliveryPayload[deliveryStatusColumn] = 'assigned';
    }

    await pool.query('INSERT INTO deliveries SET ?', [deliveryPayload]);

    await pool.query(
      `UPDATE volunteers SET \`${availabilityColumn}\` = ? WHERE \`${volunteersMeta.primaryKey}\` = ?`,
      ['Busy', volunteer[volunteersMeta.primaryKey]]
    );

    if (assignedVolunteerColumn) {
      await pool.query(
        `UPDATE food_donations SET \`${assignedVolunteerColumn}\` = ? WHERE \`${foodMeta.primaryKey}\` = ?`,
        [volunteer.volunteer_name || volunteer.name || null, donationId]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Donation approved and volunteer assigned.',
      assignedVolunteer: {
        id: volunteer[volunteersMeta.primaryKey],
        name: volunteer.volunteer_name || volunteer.name || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve donation.',
      error: error.message,
    });
  }
}

async function assignVolunteer(req, res) {
  try {
    const donationId = req.params.id;
    const volunteerId = pickFirstValue(req.body, ['volunteer_id', 'volunteerId']);

    if (!volunteerId) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer id is required.',
      });
    }

    const foodMeta = await getColumns('food_donations');
    const statusColumn = findFirstMatchingColumn(foodMeta.columns, ['status', 'donation_status']);

    const [donationRows] = await pool.query(
      `SELECT * FROM food_donations WHERE \`${foodMeta.primaryKey}\` = ? LIMIT 1`,
      [donationId]
    );

    if (!donationRows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.',
      });
    }

    if (statusColumn && String(donationRows[0][statusColumn] || '').toLowerCase() !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Donation must be approved before assigning a volunteer.',
      });
    }

    const pickupsMeta = await getColumns('pickup_requests');
    const pickupDonationColumn = findFirstMatchingColumn(pickupsMeta.columns, ['donation_id', 'food_donation_id', 'food_id']);
    const pickupRequestColumn = findFirstMatchingColumn(pickupsMeta.columns, ['request_id', 'pickup_request_id']);

    if (!pickupDonationColumn) {
      return res.status(500).json({
        success: false,
        message: 'Pickup request table is missing donation column.',
      });
    }

    const [pickupRows] = await pool.query(
      `SELECT * FROM pickup_requests WHERE \`${pickupDonationColumn}\` = ? ORDER BY 1 DESC LIMIT 1`,
      [donationId]
    );

    const pickupRequestId = pickupRows[0]?.[pickupsMeta.primaryKey];

    if (!pickupRequestId) {
      return res.status(400).json({
        success: false,
        message: 'Pickup request not found for this donation.',
      });
    }

    const deliveriesMeta = await getColumns('deliveries');
    const deliveryRequestColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['request_id', 'pickup_request_id']);
    const deliveryVolunteerColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['volunteer_id', 'assigned_volunteer_id', 'user_id']);
    const deliveryStatusColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['status', 'delivery_status']);

    const [existingDeliveries] = await pool.query(
      `SELECT * FROM deliveries WHERE \`${deliveryRequestColumn}\` = ? LIMIT 1`,
      [pickupRequestId]
    );

    if (existingDeliveries[0]) {
      return res.status(409).json({
        success: false,
        message: 'Volunteer already assigned for this donation.',
      });
    }

    const volunteersMeta = await getColumns('volunteers');
    const availabilityColumn = findFirstMatchingColumn(volunteersMeta.columns, ['availability_status', 'availabilityStatus', 'availability', 'status']);

    if (!availabilityColumn) {
      return res.status(500).json({
        success: false,
        message: 'Volunteer availability column not found.',
      });
    }

    const [volunteerRows] = await pool.query(
      `SELECT v.*, ${volunteerNameColumn ? `v.\`${volunteerNameColumn}\`` : userNameColumn ? `u.\`${userNameColumn}\`` : 'NULL'} AS volunteer_name
       FROM volunteers v
       ${userNameColumn && volunteerUserIdColumn ? `LEFT JOIN users u ON v.\`${volunteerUserIdColumn}\` = u.\`${usersMeta.primaryKey}\`` : ''}
       WHERE v.\`${volunteersMeta.primaryKey}\` = ?
       LIMIT 1`,
      [volunteerId]
    );

    if (!volunteerRows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found.',
      });
    }

    if (String(volunteerRows[0][availabilityColumn] || '').toLowerCase() !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Volunteer is not available.',
      });
    }

    const deliveryPayload = {
      [deliveryRequestColumn]: pickupRequestId,
      [deliveryVolunteerColumn]: deliveryVolunteerColumn === 'user_id'
        ? volunteerRows[0].user_id || volunteerRows[0][volunteersMeta.primaryKey]
        : volunteerRows[0][volunteersMeta.primaryKey],
    };

    if (deliveryStatusColumn) {
      deliveryPayload[deliveryStatusColumn] = 'assigned';
    }

    await pool.query('INSERT INTO deliveries SET ?', [deliveryPayload]);

    await pool.query(
      `UPDATE volunteers SET \`${availabilityColumn}\` = ? WHERE \`${volunteersMeta.primaryKey}\` = ?`,
      ['Busy', volunteerRows[0][volunteersMeta.primaryKey]]
    );

    const assignedVolunteerColumn = findFirstMatchingColumn(foodMeta.columns, ['assigned_volunteer', 'assignedVolunteer']);
    if (assignedVolunteerColumn) {
      await pool.query(
        `UPDATE food_donations SET \`${assignedVolunteerColumn}\` = ? WHERE \`${foodMeta.primaryKey}\` = ?`,
        [volunteerRows[0].volunteer_name || volunteerRows[0].name || null, donationId]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Volunteer assigned successfully.',
      assignedVolunteer: {
        id: volunteerRows[0][volunteersMeta.primaryKey],
        name: volunteerRows[0].volunteer_name || volunteerRows[0].name || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to assign volunteer.',
      error: error.message,
    });
  }
}

async function markDelivered(req, res) {
  try {
    const donationId = req.params.id;
    const foodMeta = await getColumns('food_donations');
    const statusColumn = findFirstMatchingColumn(foodMeta.columns, ['status', 'donation_status']);
    const deliveredAtColumn = findFirstMatchingColumn(foodMeta.columns, ['delivered_at', 'deliveredAt']);

    const [donationRows] = await pool.query(
      `SELECT * FROM food_donations WHERE \`${foodMeta.primaryKey}\` = ? LIMIT 1`,
      [donationId]
    );

    if (!donationRows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.',
      });
    }

    const currentStatus = statusColumn ? String(donationRows[0][statusColumn] || '').toLowerCase() : '';
    if (currentStatus === 'delivered') {
      return res.status(409).json({
        success: false,
        message: 'Donation already delivered.',
      });
    }

    const updatePayload = {};
    if (statusColumn) {
      updatePayload[statusColumn] = 'delivered';
    }
    if (deliveredAtColumn) {
      updatePayload[deliveredAtColumn] = new Date();
    }

    if (Object.keys(updatePayload).length > 0) {
      await pool.query(
        `UPDATE food_donations SET ? WHERE \`${foodMeta.primaryKey}\` = ?`,
        [updatePayload, donationId]
      );
    }

    const pickupsMeta = await getColumns('pickup_requests');
    const pickupDonationColumn = findFirstMatchingColumn(pickupsMeta.columns, ['donation_id', 'food_donation_id', 'food_id']);
    const pickupStatusColumn = findFirstMatchingColumn(pickupsMeta.columns, ['request_status', 'status']);

    const [pickupRows] = await pool.query(
      `SELECT * FROM pickup_requests WHERE \`${pickupDonationColumn}\` = ?`,
      [donationId]
    );

    const pickupRequestIds = pickupRows.map((row) => row[pickupsMeta.primaryKey]);

    if (pickupStatusColumn && pickupRequestIds.length > 0) {
      await pool.query(
        `UPDATE pickup_requests SET \`${pickupStatusColumn}\` = 'delivered' WHERE \`${pickupsMeta.primaryKey}\` IN (${pickupRequestIds.map(() => '?').join(', ')})`,
        pickupRequestIds
      );
    }

    const deliveriesMeta = await getColumns('deliveries');
    const deliveryRequestColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['request_id', 'pickup_request_id']);
    const deliveryStatusColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['status', 'delivery_status']);
    const deliveryVolunteerColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['volunteer_id', 'assigned_volunteer_id', 'user_id']);

    if (deliveryRequestColumn && pickupRequestIds.length > 0 && deliveryStatusColumn) {
      await pool.query(
        `UPDATE deliveries SET \`${deliveryStatusColumn}\` = 'delivered' WHERE \`${deliveryRequestColumn}\` IN (${pickupRequestIds.map(() => '?').join(', ')})`,
        pickupRequestIds
      );
    }

    if (deliveryRequestColumn && deliveryVolunteerColumn && pickupRequestIds.length > 0) {
      const [deliveryRows] = await pool.query(
        `SELECT \`${deliveryVolunteerColumn}\` AS volunteer_id FROM deliveries WHERE \`${deliveryRequestColumn}\` IN (${pickupRequestIds.map(() => '?').join(', ')})`,
        pickupRequestIds
      );

      const volunteerIds = deliveryRows
        .map((row) => row.volunteer_id)
        .filter(Boolean);

      if (volunteerIds.length > 0) {
        const volunteersMeta = await getColumns('volunteers');
        const availabilityColumn = findFirstMatchingColumn(volunteersMeta.columns, ['availability_status', 'availabilityStatus', 'availability', 'status']);
        const volunteerUserIdColumn = findFirstMatchingColumn(volunteersMeta.columns, ['user_id', 'volunteer_user_id']);
        const targetColumn = deliveryVolunteerColumn === 'user_id' && volunteerUserIdColumn
          ? volunteerUserIdColumn
          : volunteersMeta.primaryKey;

        if (availabilityColumn) {
          await pool.query(
            `UPDATE volunteers SET \`${availabilityColumn}\` = 'Available' WHERE \`${targetColumn}\` IN (${volunteerIds.map(() => '?').join(', ')})`,
            volunteerIds
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Donation marked as delivered.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark donation as delivered.',
      error: error.message,
    });
  }
}

module.exports = {
  createDonation,
  listDonations,
  approveDonation,
  assignVolunteer,
  markDelivered,
};
