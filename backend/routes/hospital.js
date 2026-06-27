const router = require("express").Router();
const { getAll } = require("../controllers/hospitalController");

router.get("/", getAll);

module.exports = router;
