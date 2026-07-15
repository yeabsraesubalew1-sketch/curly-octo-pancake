/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    departmentId: { type: String, required: true },
    year: { type: Number, required: true },
    section: { type: String, required: true },
    courseCode: { type: String, required: true },
    instructorId: { type: String, default: "" }
  },
  { timestamps: true }
);

assignmentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Assignment", assignmentSchema);
