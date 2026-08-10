const { pool } = require("../config/database");
const ApiError = require("../utils/api-error");

exports.sellerList = async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const [[count]] = await pool.execute(
    "SELECT COUNT(*) AS total, SUM(read_at IS NULL) AS unread FROM notifications WHERE user_id=?",
    [req.user.id]
  );

  const [rows] = await pool.execute(`
    SELECT id,type,title,message,entity_type AS entityType,
      entity_id AS entityId,read_at AS readAt,created_at AS createdAt
    FROM notifications
    WHERE user_id=?
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `, [req.user.id]);

  const total = Number(count.total || 0);
  res.json({
    data: rows,
    unread: Number(count.unread || 0),
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalRecords: total,
      limit,
    },
  });
};

exports.markRead = async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new ApiError(400, "Invalid notification ID.", "INVALID_NOTIFICATION_ID");
  }

  const [result] = await pool.execute(`
    UPDATE notifications
    SET read_at=COALESCE(read_at,NOW())
    WHERE id=? AND user_id=?
  `, [id, req.user.id]);

  if (!result.affectedRows) {
    throw new ApiError(404, "Notification not found.", "NOTIFICATION_NOT_FOUND");
  }

  res.json({ message: "Notification marked as read." });
};

exports.markAllRead = async (req, res) => {
  await pool.execute(
    "UPDATE notifications SET read_at=NOW() WHERE user_id=? AND read_at IS NULL",
    [req.user.id]
  );
  res.json({ message: "All notifications marked as read." });
};

exports.removeAll = async (req, res) => {
  const [result] = await pool.execute(
    "DELETE FROM notifications WHERE user_id=?",
    [req.user.id]
  );

  res.json({
    message: "All notifications deleted successfully.",
    deleted: Number(result.affectedRows),
  });
};

exports.removeSelected = async (req, res) => {
  const ids = Array.isArray(req.body.ids)
    ? [...new Set(req.body.ids.map((value) => Number.parseInt(value, 10)))]
        .filter((value) => Number.isSafeInteger(value) && value > 0)
    : [];

  if (!ids.length || ids.length > 100) {
    throw new ApiError(400, "Select between 1 and 100 notifications.", "INVALID_NOTIFICATION_SELECTION");
  }

  const placeholders = ids.map(() => "?").join(",");
  const [result] = await pool.execute(`
    DELETE FROM notifications
    WHERE user_id=? AND id IN (${placeholders})
  `, [req.user.id, ...ids]);

  res.json({
    message: "Selected notifications deleted successfully.",
    deleted: Number(result.affectedRows),
  });
};
