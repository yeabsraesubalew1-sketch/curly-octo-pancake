/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from "mongoose";

// NOTE: Instructor passwords are intentionally stored in plaintext (not hashed).
// The Admin dashboard has a "reveal password" feature that lets the Registrar
// look up a forgotten instructor password, which is only possible if it is
// stored reversibly. This mirrors the original app's design. The Admin
// account itself (the higher-privilege account) IS hashed with bcrypt --
// see Admin.js -- since it never needs to be displayed back to anyone.
const instructorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true }, // e.g. "inst_1"
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    maxHoursPerWeek: { type: Number, required: true, default: 16 }
  },
  { timestamps: true }
);

instructorSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Instructor", instructorSchema);
