const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "schoolManagementUser",
    unique: true,
  },
});

module.exports = mongoose.model("Teacher", teacherSchema);
