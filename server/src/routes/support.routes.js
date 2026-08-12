const router = require("express").Router();
const { authMiddleware, supportMiddleware } = require("../middleware/auth.middleware");
router.use(authMiddleware, supportMiddleware);
router.get("/dashboard", (_req, res) => res.json({ metrics: { openTickets: 0, pendingEnquiries: 0, resolvedTickets: 0, todaysRequests: 0 } }));
router.get("/profile", (req, res) => res.json({ profile: { id:req.user.id, name:req.user.name, email:req.user.email, gender:req.user.gender, role:req.user.role, status:req.user.status === "Verified" ? "active" : "inactive" } }));
module.exports = router;
