/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import Assignment from "../models/Assignment.js";
import Course from "../models/Course.js";
import Department from "../models/Department.js";
import Instructor from "../models/Instructor.js";
import ScheduleItem from "../models/ScheduleItem.js";
import { installMemoryDbFallback } from "./memoryDb.js";

const LOCAL_FALLBACK_URI = "mongodb://127.0.0.1:27017/edusched";

const dbRuntime = {
  state: "starting", // starting | operational | degraded | offline
  mode: "unknown", // unknown | mongodb | fallback
  message: "Database connection is initializing.",
  lastError: null,
  updatedAt: new Date().toISOString(),
};

let connectInProgress = null;

function setDbRuntime(next) {
  Object.assign(dbRuntime, next, { updatedAt: new Date().toISOString() });
}

async function disconnectMongoSafely() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  try {
    await mongoose.disconnect();
  } catch (err) {
    console.warn(
      `[db] Failed to disconnect from MongoDB before retry: ${err.message}`,
    );
  }
}

export function getDbRuntimeStatus() {
  return { ...dbRuntime };
}

function getMongoUris() {
  const configuredUri = process.env.MONGODB_URI?.trim();

  if (!configuredUri) {
    return [LOCAL_FALLBACK_URI];
  }

  if (configuredUri === LOCAL_FALLBACK_URI) {
    return [configuredUri];
  }

  return [configuredUri, LOCAL_FALLBACK_URI];
}

export async function connectDB(options = {}) {
  const { forceReconnect = false } = options;

  if (connectInProgress) {
    return connectInProgress;
  }

  connectInProgress = (async () => {
    mongoose.set("strictQuery", true);

    mongoose.connection.on("disconnected", () => {
      console.warn("[db] MongoDB disconnected");

      if (dbRuntime.mode === "mongodb") {
        setDbRuntime({
          state: "offline",
          mode: "mongodb",
          message: "MongoDB disconnected.",
        });
      }
    });

    if (forceReconnect) {
      setDbRuntime({
        state: "starting",
        mode: "unknown",
        message:
          "Retrying database connection using the configured MongoDB URI first.",
      });
      await disconnectMongoSafely();
    }

    const uris = getMongoUris();

    for (let index = 0; index < uris.length; index += 1) {
      const uri = uris[index];

      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 750 });
        console.log(`[db] Connected to MongoDB -> ${mongoose.connection.name}`);

        setDbRuntime({
          state: "operational",
          mode: "mongodb",
          message: "Database Connected",
          lastError: null,
        });

        return mongoose.connection;
      } catch (err) {
        const label =
          uri === LOCAL_FALLBACK_URI
            ? "local MongoDB"
            : "configured MongoDB URI";
        console.error(
          `[db] MongoDB connection failed for ${label}: ${err.message}`,
        );

        setDbRuntime({
          state: "offline",
          mode: "mongodb",
          message: `MongoDB unavailable via ${label}.`,
          lastError: err.message,
        });

        if (index < uris.length - 1) {
          console.warn(`[db] Falling back to ${LOCAL_FALLBACK_URI}`);
        }
      }
    }

    installMemoryDbFallback({
      Admin,
      Department,
      Instructor,
      Course,
      Assignment,
      ScheduleItem,
    });
    console.warn(
      "[db] Running in in-memory demo mode; MongoDB is not available.",
    );

    setDbRuntime({
      state: "degraded",
      mode: "fallback",
      message: "Running in fallback mode because MongoDB is unavailable.",
    });

    return mongoose.connection;
  })();

  try {
    return await connectInProgress;
  } finally {
    connectInProgress = null;
  }
}
