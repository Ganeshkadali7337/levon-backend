const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "schoolManagementUser",
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "schoolManagementUser",
    unique: true,
  },
});

module.exports = mongoose.model("Student", studentSchema);
