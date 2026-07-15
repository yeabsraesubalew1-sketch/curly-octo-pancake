/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true }, // e.g. "SE"
    name: { type: String, required: true, trim: true },
    durationYears: { type: Number, required: true, min: 1 },
    maxSectionsPerYear: { type: Number, required: true, min: 1, default: 3 }
  },
  { timestamps: true }
);

departmentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Department", departmentSchema);
