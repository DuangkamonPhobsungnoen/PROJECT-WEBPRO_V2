const express = require('express');
const path = require("path");
const pool = require('../config.js')
const multer = require("multer");
const Joi = require('joi');

router = express.Router();

// Validate
// const carSchema = Joi.object({
//   car_code: Joi.string().required(), 
//   car_brand: Joi.string().required(), 
//   car_model: Joi.string().required(), 
//   car_seat: Joi.string().required().pattern(/0[0-9]{2}/), 
//   car_bag: Joi.string().required().pattern(/0[0-9]{2}/), 
//   car_rentprice: Joi.string().required().pattern(/0[0-9]{10}/),
// })

// SET STORAGE 
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./static/uploads");
  },
  filename: function (req, file, callback) {
    callback(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
//for homepage
router.get("/car/nissan", async function (req, res, next) {
  try {
    const [rows, fields] = await pool.query('SELECT * FROM car WHERE car_brand = "Nissan"')
    return res.json(rows)
  } catch (err) {
    return res.status(500).json(err)
  }

});

router.get("/car/honda", async function (req, res, next) {
  try {
    const [rows, fields] = await pool.query('SELECT * FROM car WHERE car_brand = "Honda"')
    return res.json(rows)
  } catch (err) {
    return res.status(500).json(err)
  }

});

router.get("/car/toyota", async function (req, res, next) {
  try {
    const [rows, fields] = await pool.query('SELECT * FROM car WHERE car_brand = "Toyota"')
    return res.json(rows)
  } catch (err) {
    return res.status(500).json(err)
  }
});

router.get("/car/other", async function (req, res, next) {
  try {
    const [rows, fields] = await pool.query('SELECT * FROM car WHERE car_brand not in( "Toyota", "Honda", "Nissan")')
    return res.json(rows)
  } catch (err) {
    return res.status(500).json(err)
  }
});

// select Car
router.get("/car", async function (req, res, next) {
  try {
    const [rows, fields] = await pool.query('SELECT * FROM car')
    return res.json(rows)
  } catch (err) {
    return res.status(500).json(err)
  }

});

router.get("/car/:id", async function (req, res, next) {
  try {
    const [rows, fields] = await pool.query('SELECT * FROM car WHERE car_id=?', [req.params.id])
    return res.json(rows)
  } catch (err) {
    return res.status(500).json(err)
  }

});

const upload = multer({ storage: storage });

//   add car 
router.post("/car", upload.single("myImageCar"), async function (req, res, next) {
  //   try {
  //   await carSchema.validateAsync(req.body, { abortEarly: false })
  // } catch (err) {
  //   return res.status(400).send(err)
  // }

  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "Please upload a file" });
  }

  const { car_code, car_brand, car_model, car_seat, car_bag, car_rentprice } = req.body
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  // console.log("filepath", file)
  try {
    const [rows1, fields1] = await conn.query('select car_code from car where car_code = ?',
      [car_code])
    if (rows1.length === 0) {
      console.log("id is duplicate")
      const results = await conn.query(
        "INSERT INTO car(`car_code`, `car_brand`, `car_model`, `car_seat`, `car_bag`, `car_rentprice`, `car_img`) VALUES(?, ?, ?, ?, ?, ?, ?)",
        [car_code, car_brand, car_model, car_seat, car_bag, car_rentprice, file.path.substr(6)]
      );
    }
    else {
      return res.json({ check: false })
  }

    await conn.commit();
    return res.json({ message: "success" });
  } catch (err) {
    await conn.rollback();
    return res.status(400).json(err);
  } finally {
    conn.release();
  }
});

router.delete('/car/:id', async function (req, res, next) {
  const carId = req.params.id
  try {
      const [rows, fields] = await pool.query(
        'DELETE FROM car WHERE car_id = ?', [carId]
      )
      res.json("success")
  } catch (error) {
      res.status(500).json(error)
  } 
});

router.post("/test", upload.single("myImageCar"), async function (req, res, next) {
  const file = req.file;

});

//   update car 
router.put("/updatecar/:id", upload.single("myImageCar"), async function (req, res, next) {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "Please upload a file" });
  }
  
  const { car_code, car_brand, car_model, car_seat, car_bag, car_rentprice } = req.body
  console.log('ทำไมถึงทำกับฉันได้ ',car_code, car_brand, car_model, car_seat, car_bag, car_rentprice, req.params.id, file.path.substr(6))
  console.log(req.params.id)
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  
  try {
    const results1 = await conn.query(
      "UPDATE car SET car_code=?, car_brand=?, car_model=?, car_seat=?, car_bag=?, car_rentprice=?, car_img=? WHERE car_id=?",
      [car_code, car_brand, car_model, car_seat, car_bag, car_rentprice, file.path.substr(6), req.params.id]
    );

    const results2 = await conn.query("SELECT * FROM car");

    await conn.commit();
    return res.json(results2);
  } catch (err) {
    await conn.rollback();
    return res.status(400).json(err);
  } finally {
    conn.release();
  }
});

exports.router = router;