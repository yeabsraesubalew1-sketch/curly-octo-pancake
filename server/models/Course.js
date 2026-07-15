/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    hasLab: { type: Boolean, required: true, default: false },
    labHours: { type: Number, required: true, default: 0 },
    lectureHours: { type: Number, required: true, default: 2 }
  },
  { timestamps: true }
);

courseSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Course", courseSchema);
