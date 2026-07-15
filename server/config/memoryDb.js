/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import {
  SEED_DEPARTMENTS,
  SEED_INSTRUCTORS,
  SEED_COURSES,
  SEED_ASSIGNMENTS,
} from "../seedData.js";

const store = {
  Admin: [],
  Department: [],
  Instructor: [],
  Course: [],
  Assignment: [],
  ScheduleItem: [],
};

const FALLBACK_DB_DIR = path.join(process.cwd(), ".data");
const FALLBACK_DB_PATH = path.join(FALLBACK_DB_DIR, "memory-db.json");

const identityKeys = {
  Admin: "username",
  Department: "id",
  Instructor: "id",
  Course: "code",
  Assignment: "id",
  ScheduleItem: "id",
};

function clone(value) {
  return structuredClone(value);
}

function defaultStore() {
  return {
    Admin: [],
    Department: clone(SEED_DEPARTMENTS),
    Instructor: clone(SEED_INSTRUCTORS),
    Course: clone(SEED_COURSES),
    Assignment: clone(SEED_ASSIGNMENTS),
    ScheduleItem: [],
  };
}

function normalizePersistedStore(raw) {
  const defaults = defaultStore();

  return {
    Admin: Array.isArray(raw?.Admin) ? raw.Admin : defaults.Admin,
    Department: Array.isArray(raw?.Department)
      ? raw.Department
      : defaults.Department,
    Instructor: Array.isArray(raw?.Instructor)
      ? raw.Instructor
      : defaults.Instructor,
    Course: Array.isArray(raw?.Course) ? raw.Course : defaults.Course,
    Assignment: Array.isArray(raw?.Assignment)
      ? raw.Assignment
      : defaults.Assignment,
    ScheduleItem: Array.isArray(raw?.ScheduleItem)
      ? raw.ScheduleItem
      : defaults.ScheduleItem,
  };
}

function hydrateStore(nextStore) {
  store.Admin = clone(nextStore.Admin);
  store.Department = clone(nextStore.Department);
  store.Instructor = clone(nextStore.Instructor);
  store.Course = clone(nextStore.Course);
  store.Assignment = clone(nextStore.Assignment);
  store.ScheduleItem = clone(nextStore.ScheduleItem);
}

function saveStore() {
  fs.mkdirSync(FALLBACK_DB_DIR, { recursive: true });
  fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(store, null, 2), "utf8");
}

function loadOrInitializeStore() {
  if (!fs.existsSync(FALLBACK_DB_PATH)) {
    const initial = defaultStore();
    hydrateStore(initial);
    saveStore();
    console.warn(`[db] Initialized fallback store at ${FALLBACK_DB_PATH}`);
    return;
  }

  try {
    const persisted = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, "utf8"));
    const normalized = normalizePersistedStore(persisted);
    hydrateStore(normalized);
    console.warn(`[db] Loaded fallback store from ${FALLBACK_DB_PATH}`);
  } catch (err) {
    const initial = defaultStore();
    hydrateStore(initial);
    saveStore();
    console.error(
      `[db] Failed reading fallback store, reinitialized from seed data: ${err.message}`,
    );
  }
}

function normalizeCollectionName(model) {
  return model.modelName;
}

function matchesFilter(doc, filter = {}) {
  return Object.entries(filter).every(([key, value]) => doc[key] === value);
}

function sortItems(items, sortSpec = {}) {
  const entries = Object.entries(sortSpec);

  if (entries.length === 0) {
    return items;
  }

  return [...items].sort((left, right) => {
    for (const [key, direction] of entries) {
      const leftValue = left[key];
      const rightValue = right[key];

      if (leftValue === rightValue) {
        continue;
      }

      const comparison = leftValue > rightValue ? 1 : -1;
      return direction === -1 ? comparison * -1 : comparison;
    }

    return 0;
  });
}

function wrapDocument(modelName, rawDoc) {
  const doc = clone(rawDoc);
  const idKey = identityKeys[modelName];

  Object.defineProperty(doc, "save", {
    enumerable: false,
    value: async function save() {
      const collection = store[modelName];
      const keyValue = this[idKey];
      const nextValue = clone(this);
      const index = collection.findIndex((item) => item[idKey] === keyValue);

      if (index >= 0) {
        collection[index] = nextValue;
      } else {
        collection.push(nextValue);
      }

      saveStore();
      return wrapDocument(modelName, nextValue);
    },
  });

  Object.defineProperty(doc, "toJSON", {
    enumerable: false,
    value: function toJSON() {
      const plain = clone(this);
      delete plain.save;
      delete plain.toJSON;
      return plain;
    },
  });

  return doc;
}

function makeFindResult(modelName, filter) {
  const items = store[modelName]
    .filter((doc) => matchesFilter(doc, filter))
    .map((doc) => wrapDocument(modelName, doc));

  return {
    then(resolve, reject) {
      return Promise.resolve(items).then(resolve, reject);
    },
    catch(reject) {
      return Promise.resolve(items).catch(reject);
    },
    sort(sortSpec) {
      return Promise.resolve(sortItems(items, sortSpec));
    },
  };
}

function patchModel(model, modelName) {
  model.find = (filter = {}) => makeFindResult(modelName, filter);

  model.findOne = async (filter = {}) => {
    const found = store[modelName].find((doc) => matchesFilter(doc, filter));
    return found ? wrapDocument(modelName, found) : null;
  };

  model.countDocuments = async (filter = {}) =>
    store[modelName].filter((doc) => matchesFilter(doc, filter)).length;

  model.create = async (doc) => {
    const wrapped = wrapDocument(modelName, doc);
    const key = identityKeys[modelName];
    const index = store[modelName].findIndex(
      (item) => item[key] === wrapped[key],
    );

    if (index >= 0) {
      store[modelName][index] = clone(wrapped);
    } else {
      store[modelName].push(clone(wrapped));
    }

    saveStore();
    return wrapped;
  };

  model.insertMany = async (docs) => {
    const wrappedDocs = docs.map((doc) => wrapDocument(modelName, doc));
    const key = identityKeys[modelName];

    for (const wrapped of wrappedDocs) {
      const index = store[modelName].findIndex(
        (item) => item[key] === wrapped[key],
      );

      if (index >= 0) {
        store[modelName][index] = clone(wrapped);
      } else {
        store[modelName].push(clone(wrapped));
      }
    }

    saveStore();
    return wrappedDocs;
  };

  model.deleteMany = async (filter = {}) => {
    const before = store[modelName].length;
    store[modelName] = store[modelName].filter(
      (doc) => !matchesFilter(doc, filter),
    );

    saveStore();
    return { deletedCount: before - store[modelName].length };
  };

  model.deleteOne = async (filter = {}) => {
    const index = store[modelName].findIndex((doc) =>
      matchesFilter(doc, filter),
    );

    if (index === -1) {
      return { deletedCount: 0 };
    }

    store[modelName].splice(index, 1);
    saveStore();
    return { deletedCount: 1 };
  };
}

export function installMemoryDbFallback(models) {
  loadOrInitializeStore();

  for (const model of Object.values(models)) {
    patchModel(model, normalizeCollectionName(model));
  }
}
