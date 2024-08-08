const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const studentSchema = require("./Models/studentModel");
const teacherSchema = require("./Models/teacherModel");
const userSchema = require("./Models/userModel");
const authenticate = require("./authMiddleware");

app.use(cors());

app.use(express.json());

const PORT = 3000;

mongoose
  .connect("mongodb+srv://ganesh:ganesh@cluster7337.7exrzd7.mongodb.net/")
  .then(() => console.log("db connected..."));

app.listen(PORT, () => console.log("server running..."));

app.get("/", (req, res) => {
  res.send("hi");
});

app.post("/register-user", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    let existed = await userSchema.findOne({ username });
    if (existed) {
      return res.status(400).send("username is already taken");
    }

    if (!["teacher", "student"].includes(role)) {
      return res.status(400).send("provide valid role teacher or student");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userSchema({
      username,
      password: hashedPassword,
      role,
    });
    await newUser.save();
    res.status(200).send("user registered successfully");
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existed = await userSchema.findOne({ username });
    if (!existed) {
      return res.status(400).send("user not existed with the given username");
    } else {
      const passwordMatch = await bcrypt.compare(password, existed.password);
      if (!passwordMatch) {
        return res.status(400).send("invalid password");
      } else {
        const payload = {
          userId: existed._id,
          role: existed.role,
        };
        const token = jwt.sign(payload, "login-token");
        res.status(200).send({ token, role: existed.role });
      }
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.post("/add-teacher", authenticate, async (req, res) => {
  try {
    if (req.role !== "teacher") {
      return res.status(400).send("access denied");
    }
    const { name, subject } = req.body;

    let newTeacher = new teacherSchema({
      name,
      subject,
      user_id: req.userId,
    });
    await newTeacher.save();
    res.status(200).send("teacher added successfully");
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.post("/add-student", authenticate, async (req, res) => {
  try {
    if (req.role !== "teacher") {
      return res.status(400).send("access denied");
    }
    const { name, age, grade, password, username } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const existed = await userSchema.findOne({ username });

    if (existed) {
      res.status(400).send("student username is already taken");
    }
    const newUser = new userSchema({
      username,
      password: hashedPassword,
      role: "student",
    });
    await newUser.save();

    const newStudent = new studentSchema({
      name,
      age,
      grade,
      user_id: req.userId,
      student_id: newUser._id,
    });
    await newStudent.save();
    res.status(200).send("student added successfully");
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.get("/students", authenticate, async (req, res) => {
  try {
    if (req.role !== "teacher") {
      return res.status(400).send("access denied");
    }
    const studentsData = await studentSchema.find({ user_id: req.userId });
    res.status(200).send({ count: studentsData.length, studentsData });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.get("/teacher", authenticate, async (req, res) => {
  try {
    if (req.role !== "teacher") {
      return res.status(400).send("access denied");
    }
    const teacherData = await teacherSchema.findOne({ user_id: req.userId });
    res.status(200).send(teacherData);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.put("/update-student/:id", authenticate, async (req, res) => {
  try {
    if (req.role !== "teacher") {
      return res.status(400).send("access denied");
    }

    const student = await studentSchema.findOne({
      _id: req.params.id,
      user_id: req.userId,
    });

    if (!student) {
      return res.status(400).send("Student not found");
    }
    await studentSchema.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).send("student updated successfully");
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.put("/update-teacher/:id", authenticate, async (req, res) => {
  try {
    if (req.role !== "teacher") {
      return res.status(400).send("access denied");
    }

    const teacher = await teacherSchema.findOne({
      _id: req.params.id,
      user_id: req.userId,
    });

    if (!teacher) {
      return res.status(400).send("teacher not found");
    }
    await teacherSchema.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).send("teacher updated successfully");
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.get("/student-details", authenticate, async (req, res) => {
  try {
    const studentData = await studentSchema.findOne({ student_id: req.userId });
    res.status(200).send(studentData);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.delete("/delete-student/:id", authenticate, async (req, res) => {
  try {
    if (req.role !== "teacher") {
      return res.status(400).send("access denied");
    }
    const student = await studentSchema.findById(req.params.id);
    if (!student) {
      return res.status(400).send("Student not found");
    }

    if (student.user_id.toString() !== req.userId) {
      return res
        .status(400)
        .send("You are not authorized to delete this student");
    }

    await studentSchema.findByIdAndDelete(req.params.id);

    await userSchema.findByIdAndDelete(student.student_id);

    res.status(200).send("Student deleted successfully");
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});
