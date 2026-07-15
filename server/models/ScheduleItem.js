/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from "mongoose";

const scheduleItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    departmentId: { type: String, required: true },
    year: { type: Number, required: true },
    section: { type: String, required: true },
    day: { type: Number, required: true, min: 0, max: 4 },
    period: { type: Number, required: true, min: 1, max: 8 },
    courseCode: { type: String, required: true },
    isLab: { type: Boolean, required: true, default: false },
    instructorId: { type: String, required: true }
  },
  { timestamps: true }
);

scheduleItemSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("ScheduleItem", scheduleItemSchema);
