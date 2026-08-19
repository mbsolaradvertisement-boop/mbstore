/**
 * Select the next logged-in support user in stable user-id order.
 *
 * The singleton state row is locked for the caller's transaction, so two
 * tickets created concurrently cannot read and advance the same cursor.
 * A user is online when at least one of their sessions has not expired.
 */
async function nextOnlineSupport(connection) {
  const [stateRows] = await connection.execute(
    "SELECT last_support_id FROM support_assignment_state WHERE id=1 FOR UPDATE"
  );

  if (!stateRows.length) {
    await connection.execute(
      "INSERT INTO support_assignment_state (id,last_support_id) VALUES (1,NULL)"
    );
  }

  const lastSupportId = stateRows[0]?.last_support_id || null;
  const [agents] = await connection.execute(`
    SELECT DISTINCT u.id
    FROM users u
    JOIN sessions s ON s.user_id=u.id AND s.expires_at>NOW()
    WHERE u.role='Support'
      AND u.status='Verified'
      AND u.login_allowed=TRUE
    ORDER BY u.id
  `);

  if (!agents.length) return null;

  const next = agents.find((agent) => !lastSupportId || agent.id > lastSupportId) || agents[0];
  await connection.execute(
    "UPDATE support_assignment_state SET last_support_id=? WHERE id=1",
    [next.id]
  );
  return next.id;
}

module.exports = { nextOnlineSupport };
