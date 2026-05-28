const pool = require('../db');
const {
  getColumns,
  pickFirstValue,
  findFirstMatchingColumn,
} = require('./dbHelpers');

async function deliveriesByVolunteer(req, res) {
  try {
    let volunteerId = pickFirstValue(req.query, ['volunteer_id', 'volunteerId', 'user_id', 'userId']);

    if (!volunteerId) {
      return res.status(400).json({
        success: false,
        message: 'A volunteer identifier is required.',
      });
    }

    const deliveriesMeta = await getColumns('deliveries');
    const ownerColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['volunteer_id', 'assigned_volunteer_id', 'user_id']);

    if (!ownerColumn) {
      return res.status(500).json({
        success: false,
        message: 'No volunteer column found in deliveries table.',
      });
    }

    if (ownerColumn === 'volunteer_id' && volunteerId) {
      const volunteersMeta = await getColumns('volunteers');
      const volunteerUserIdColumn = findFirstMatchingColumn(volunteersMeta.columns, ['user_id', 'volunteer_user_id']);

      if (volunteerUserIdColumn) {
        const [directMatch] = await pool.query(
          `SELECT \`${volunteersMeta.primaryKey}\` AS volunteer_id FROM volunteers WHERE \`${volunteersMeta.primaryKey}\` = ? LIMIT 1`,
          [volunteerId]
        );

        if (!directMatch[0]) {
          const [userMatch] = await pool.query(
            `SELECT \`${volunteersMeta.primaryKey}\` AS volunteer_id FROM volunteers WHERE \`${volunteerUserIdColumn}\` = ? LIMIT 1`,
            [volunteerId]
          );

          if (userMatch[0]?.volunteer_id) {
            volunteerId = userMatch[0].volunteer_id;
          }
        }
      }
    }

    const pickupMeta = await getColumns('pickup_requests');
    const foodMeta = await getColumns('food_donations');
    const requestColumn = findFirstMatchingColumn(deliveriesMeta.columns, ['request_id', 'pickup_request_id']);
    const pickupRequestColumn = findFirstMatchingColumn(pickupMeta.columns, ['request_id', 'pickup_request_id']);
    const pickupDonationColumn = findFirstMatchingColumn(pickupMeta.columns, ['donation_id', 'food_donation_id', 'food_id']);

    const foodSelects = ['d.*'];
    if (foodMeta.columns.includes('food_name')) {
      foodSelects.push('fd.food_name AS food_name');
    }
    if (foodMeta.primaryKey) {
      foodSelects.push(`fd.\`${foodMeta.primaryKey}\` AS donation_id`);
    }
    const donationStatusColumn = findFirstMatchingColumn(foodMeta.columns, ['status', 'donation_status']);
    if (donationStatusColumn) {
      foodSelects.push(`fd.\`${donationStatusColumn}\` AS donation_status`);
    }
    const deliveredAtColumn = findFirstMatchingColumn(foodMeta.columns, ['delivered_at', 'deliveredAt']);
    if (deliveredAtColumn) {
      foodSelects.push(`fd.\`${deliveredAtColumn}\` AS delivered_at`);
    }
    if (foodMeta.columns.includes('quantity')) {
      foodSelects.push('fd.quantity AS quantity');
    }
    if (foodMeta.columns.includes('pickup_address')) {
      foodSelects.push('fd.pickup_address AS pickup_address');
    }
    if (foodMeta.columns.includes('pickup_phone')) {
      foodSelects.push('fd.pickup_phone AS pickup_phone');
    }
    // attempt to include NGO location for delivery 'To' column
    const foodNgoColumn = findFirstMatchingColumn(foodMeta.columns, ['ngo_id', 'ngoId']);
    const pickupNgoColumn = findFirstMatchingColumn(pickupMeta.columns, ['ngo_id', 'ngo_user_id', 'user_id']);
    let ngoJoin = '';
    let ngoLocationSelect = null;

    // Prefer explicit NGO join if ngos table exists and has an address column
    try {
      const ngosMeta = await getColumns('ngos');
      const ngoLocationColumn = findFirstMatchingColumn(ngosMeta.columns, ['address', 'ngo_address', 'location']);
      if (ngoLocationColumn) {
        if (foodNgoColumn) {
          ngoJoin = `LEFT JOIN ngos n ON fd.\`${foodNgoColumn}\` = n.\`${ngosMeta.primaryKey}\``;
          ngoLocationSelect = `n.\`${ngoLocationColumn}\` AS ngo_location`;
        } else if (pickupNgoColumn) {
          ngoJoin = `LEFT JOIN ngos n ON pr.\`${pickupNgoColumn}\` = n.\`${ngosMeta.primaryKey}\``;
          ngoLocationSelect = `n.\`${ngoLocationColumn}\` AS ngo_location`;
        }
      }
    } catch (e) {
      // ignore - ngos table may not exist
    }

    // Fallback: check for address-like columns directly on pickup_requests or food_donations
    if (!ngoLocationSelect) {
      const pickupAddressCol = findFirstMatchingColumn(pickupMeta.columns, ['ngo_address', 'ngo_location', 'ngo_address_line', 'ngo_loc', 'ngo_address1', 'location']);
      const foodAddressCol = findFirstMatchingColumn(foodMeta.columns, ['ngo_address', 'ngo_location', 'ngo_address_line', 'ngo_loc', 'ngo_address1', 'location']);
      if (pickupAddressCol) {
        ngoLocationSelect = `pr.\`${pickupAddressCol}\` AS ngo_location`;
      } else if (foodAddressCol) {
        ngoLocationSelect = `fd.\`${foodAddressCol}\` AS ngo_location`;
      } else {
        // If pickup_requests references a user (NGO user), try joining users table to get their address
        const pickupNgoUserCol = findFirstMatchingColumn(pickupMeta.columns, ['ngo_user_id', 'ngo_user', 'ngo_userId', 'user_id']);
        if (pickupNgoUserCol) {
          try {
            const usersMeta = await getColumns('users');
            const userAddressCol = findFirstMatchingColumn(usersMeta.columns, ['address', 'location', 'user_address']);
            if (userAddressCol) {
              ngoJoin = `${ngoJoin} LEFT JOIN users u ON pr.\`${pickupNgoUserCol}\` = u.\`${usersMeta.primaryKey}\``;
              ngoLocationSelect = `u.\`${userAddressCol}\` AS ngo_location`;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    }

    const joinPickup = requestColumn && pickupRequestColumn;
    const joinFood = joinPickup && pickupDonationColumn;

    if (ngoLocationSelect) {
      foodSelects.push(ngoLocationSelect);
    }

    const [rows] = await pool.query(
      `SELECT ${foodSelects.join(', ')}
       FROM deliveries d
       ${joinPickup ? `LEFT JOIN pickup_requests pr ON d.\`${requestColumn}\` = pr.\`${pickupRequestColumn}\`` : ''}
       ${joinFood ? `LEFT JOIN food_donations fd ON pr.\`${pickupDonationColumn}\` = fd.\`${foodMeta.primaryKey}\`` : ''}
       ${ngoJoin}
       WHERE d.\`${ownerColumn}\` = ?
       ORDER BY d.\`${deliveriesMeta.primaryKey}\` DESC`,
      [volunteerId]
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch deliveries.',
      error: error.message,
    });
  }
}

async function updateStatus(req, res) {
  try {
    const allowedStatuses = ['assigned', 'picked_up', 'in_transit', 'delivered'];
    const deliveryId = req.params.id;
    const status = String(req.body.status || '').toLowerCase();

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

      const { primaryKey, columns } = await getColumns('deliveries');
      const statusColumn = findFirstMatchingColumn(columns, ['status', 'delivery_status']);

    if (!statusColumn) {
      return res.status(500).json({
        success: false,
        message: 'No status column found in deliveries table.',
      });
    }

    const [result] = await pool.query(
      `UPDATE deliveries SET \`${statusColumn}\` = ? WHERE \`${primaryKey}\` = ?`,
      [status, deliveryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found.',
      });
    }
      try {
        const pickupMeta = await getColumns('pickup_requests');
        const requestColumn = findFirstMatchingColumn(columns, ['request_id', 'pickup_request_id']);
        const pickupRequestColumn = findFirstMatchingColumn(pickupMeta.columns, ['request_id', 'pickup_request_id']);
        const pickupStatusColumn = findFirstMatchingColumn(pickupMeta.columns, ['request_status', 'status']);

        const foodMeta = await getColumns('food_donations');
        const donationStatusColumn = findFirstMatchingColumn(foodMeta.columns, ['status', 'donation_status']);
        const deliveredAtColumn = findFirstMatchingColumn(foodMeta.columns, ['delivered_at', 'deliveredAt']);
        const pickupDonationColumn = findFirstMatchingColumn(pickupMeta.columns, ['donation_id', 'food_donation_id', 'food_id']);

        if (requestColumn && pickupRequestColumn) {
          const [deliveryRows] = await pool.query(
            `SELECT \`${requestColumn}\` AS request_id FROM deliveries WHERE \`${primaryKey}\` = ? LIMIT 1`,
            [deliveryId]
          );

          const pickupRequestId = deliveryRows[0]?.request_id;

          if (pickupRequestId && pickupStatusColumn) {
            const mappedStatus = status === 'delivered' ? 'delivered' : 'approved';
            await pool.query(
              `UPDATE pickup_requests SET \`${pickupStatusColumn}\` = ? WHERE \`${pickupRequestColumn}\` = ?`,
              [mappedStatus, pickupRequestId]
            );
          }

          if (pickupRequestId && pickupDonationColumn && donationStatusColumn && status === 'delivered') {
            const [pickupRows] = await pool.query(
              `SELECT \`${pickupDonationColumn}\` AS donation_id FROM pickup_requests WHERE \`${pickupRequestColumn}\` = ? LIMIT 1`,
              [pickupRequestId]
            );

            const donationId = pickupRows[0]?.donation_id;

            if (donationId) {
              const updatePayload = {
                [donationStatusColumn]: 'delivered',
              };
              if (deliveredAtColumn) {
                updatePayload[deliveredAtColumn] = new Date();
              }

              await pool.query(
                `UPDATE food_donations SET ? WHERE \`${foodMeta.primaryKey}\` = ?`,
                [updatePayload, donationId]
              );
            }
          }

          if (status === 'delivered') {
            const volunteerColumn = findFirstMatchingColumn(columns, ['volunteer_id', 'assigned_volunteer_id', 'user_id']);
            if (volunteerColumn) {
              const [volunteerRows] = await pool.query(
                `SELECT \`${volunteerColumn}\` AS volunteer_id FROM deliveries WHERE \`${primaryKey}\` = ? LIMIT 1`,
                [deliveryId]
              );

              const volunteerId = volunteerRows[0]?.volunteer_id;

              if (volunteerId) {
                const volunteersMeta = await getColumns('volunteers');
                const availabilityColumn = findFirstMatchingColumn(volunteersMeta.columns, ['availability_status', 'availabilityStatus', 'availability', 'status']);
                const volunteerUserIdColumn = findFirstMatchingColumn(volunteersMeta.columns, ['user_id', 'volunteer_user_id']);
                const targetColumn = volunteerColumn === 'user_id' && volunteerUserIdColumn
                  ? volunteerUserIdColumn
                  : volunteersMeta.primaryKey;

                if (availabilityColumn) {
                  await pool.query(
                    `UPDATE volunteers SET \`${availabilityColumn}\` = 'Available' WHERE \`${targetColumn}\` = ?`,
                    [volunteerId]
                  );
                }
              }
            }
          }
        }
      } catch (syncError) {
        console.warn('Pickup request status sync skipped:', syncError.message);
      }

    return res.status(200).json({
      success: true,
      message: 'Delivery status updated successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update delivery status.',
      error: error.message,
    });
  }
}

module.exports = {
  deliveriesByVolunteer,
  updateStatus,
};
