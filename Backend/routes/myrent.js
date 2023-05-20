const express = require('express')
const pool = require('../config.js')
const { isLoggedIn } = require('../middlewares')

router = express.Router();

//user car
router.get("/myrent/car", isLoggedIn, async function (req, res, next) {
  console.log(req.user.id)
  try {
    const [rows, fields] = await pool.query("SELECT *, DATE_FORMAT(r_day_pickup, '%Y-%m-%d') as dayPickup, DATE_FORMAT(r_day_return, '%Y-%m-%d') as dayReturn FROM rental left outer join car using(car_id) where u_id = ?", [req.user.u_id])
    return res.json(rows)
  } catch (err) {
    return res.status(500).json(err)
  }

});

//is pay?
router.get("/myrent/pay", async function (req, res, next) {
  try {
    const [rows, fields] = await pool.query('SELECT r_id FROM payment')
    return res.json(rows)
  } catch (err) {
    return res.status(500).json(err)
  }

});

//is return?
router.get("/myrent/return", async function (req, res, next) {
  try {
    const [rows, fields] = await pool.query('SELECT r_id FROM return_car')
    return res.json(rows)
  } catch (err) {
    return res.status(500).json(err)
  }

});

//button pickup car
router.put("/myrent/pickup/:id", async function (req, res, next) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [rows, fields] = await conn.query('UPDATE rental SET r_status=? WHERE r_id=?',
      ["return", req.params.id])
      await conn.commit();
    return res.json(rows)
  } catch (err) {
    await conn.rollback();
    return res.status(500).json(err)
  }finally {
    conn.release();
  }

});

//button return car
router.post("/myrent/return/:id", async function (req, res, next) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const [rows, fields] = await conn.query('INSERT INTO return_car(r_id, re_timestamp, re_status) VALUES(?, CURRENT_TIMESTAMP, ?)',
      [req.params.id, "รอตรวจสอบการคืนรถ"])

    await conn.commit();
    return res.json(rows)
  } catch (err) {
    await conn.rollback();
    return res.status(500).json(err)
  } finally {
    conn.release();
  }
});

//for admin
router.get("/admin/return", async function (req, res, next) {
  try {
    const [rows, fields] = await pool.query('SELECT * FROM return_car WHERE re_status = "รอตรวจสอบการคืนรถ"')
    return res.json(rows)
  } catch (err) {
    return res.status(500).json(err)
  }

});

router.post("/myrent/remove", async function (req, res, next) {
  const { rentId } = req.body
  // console.log(req.body)
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const [rows, fields] = await conn.query("DELETE FROM rental WHERE r_id = ?", [rentId])
    await conn.commit();
    return res.json({ message: `Delete car Id ${rentId}` });

  } catch (err) {
    await conn.rollback();
    console.log(err)
    res.json({ message: "can't find rent Id" })
    return next(err);
  } finally {
    conn.release();
  }
});
exports.router = router;