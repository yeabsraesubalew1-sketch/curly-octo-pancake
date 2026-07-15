/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Department, Instructor, Course } from "../types";

export interface ParseResult<T> {
  success: boolean;
  data: T[];
  error?: string;
}

// Parses csv file content for Departments
// Expected format: id,name,durationYears
export function parseDepartmentsCSV(csvText: string): ParseResult<Department> {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) {
    return { success: false, data: [], error: "CSV file is empty or missing data rows." };
  }

  const header = lines[0].split(",").map(h => h.trim().toLowerCase());
  const expected = ["id", "name", "durationyears"];
  const matches = expected.every(col => header.includes(col));
  
  if (!matches) {
    return { success: false, data: [], error: `Invalid header. Expected columns: id, name, durationYears (got: ${lines[0]})` };
  }

  const idIdx = header.indexOf("id");
  const nameIdx = header.indexOf("name");
  const durationIdx = header.indexOf("durationyears");
  const maxSectionsIdx = header.indexOf("maxsectionsperyear");

  const results: Department[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVRow(lines[i]);
    if (row.length < 3) {
      return { success: false, data: [], error: `Row ${i + 1} has insufficient columns (expected at least 3, got ${row.length}). Transaction rolled back.` };
    }

    const id = row[idIdx]?.trim();
    const name = row[nameIdx]?.trim();
    const durationStr = row[durationIdx]?.trim();
    const maxSectionsStr = maxSectionsIdx !== -1 ? row[maxSectionsIdx]?.trim() : undefined;

    if (!id || !name || !durationStr) {
      return { success: false, data: [], error: `Row ${i + 1} has empty values. Transaction rolled back.` };
    }

    const durationYears = parseInt(durationStr, 10);
    if (isNaN(durationYears) || durationYears < 1 || durationYears > 8) {
      return { success: false, data: [], error: `Row ${i + 1} invalid durationYears: "${durationStr}". Must be a number between 1 and 8. Transaction rolled back.` };
    }

    let maxSectionsPerYear = 3;
    if (maxSectionsStr) {
      const parsedMaxSec = parseInt(maxSectionsStr, 10);
      if (!isNaN(parsedMaxSec) && parsedMaxSec >= 1 && parsedMaxSec <= 26) {
        maxSectionsPerYear = parsedMaxSec;
      }
    }

    results.push({ id, name, durationYears, maxSectionsPerYear });
  }

  return { success: true, data: results };
}

// Parses csv file content for Instructors
// Expected format: id,name,username,password,maxHoursPerWeek
export function parseInstructorsCSV(csvText: string): ParseResult<Instructor> {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) {
    return { success: false, data: [], error: "CSV file is empty or missing data rows." };
  }

  const header = lines[0].split(",").map(h => h.trim().toLowerCase());
  const expected = ["id", "name", "username", "password", "maxhoursperweek"];
  const matches = expected.every(col => header.includes(col));

  if (!matches) {
    return { success: false, data: [], error: `Invalid header. Expected columns: id, name, username, password, maxHoursPerWeek` };
  }

  const idIdx = header.indexOf("id");
  const nameIdx = header.indexOf("name");
  const userIdx = header.indexOf("username");
  const passIdx = header.indexOf("password");
  const maxHrsIdx = header.indexOf("maxhoursperweek");

  const results: Instructor[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVRow(lines[i]);
    if (row.length < 5) {
      return { success: false, data: [], error: `Row ${i + 1} has insufficient columns (expected 5, got ${row.length}). Transaction rolled back.` };
    }

    const id = row[idIdx]?.trim();
    const name = row[nameIdx]?.trim();
    const username = row[userIdx]?.trim();
    const password = row[passIdx]?.trim();
    const maxHrsStr = row[maxHrsIdx]?.trim();

    if (!id || !name || !username || !password || !maxHrsStr) {
      return { success: false, data: [], error: `Row ${i + 1} has empty values. Transaction rolled back.` };
    }

    const maxHoursPerWeek = parseInt(maxHrsStr, 10);
    if (isNaN(maxHoursPerWeek) || maxHoursPerWeek < 1 || maxHoursPerWeek > 40) {
      return { success: false, data: [], error: `Row ${i + 1} invalid maxHoursPerWeek: "${maxHrsStr}". Must be a number between 1 and 40.` };
    }

    results.push({ id, name, username, password, maxHoursPerWeek });
  }

  return { success: true, data: results };
}

// Parses csv file content for Courses
// Expected format: code,title,hasLab,labHours,lectureHours
export function parseCoursesCSV(csvText: string): ParseResult<Course> {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) {
    return { success: false, data: [], error: "CSV file is empty or missing data rows." };
  }

  const header = lines[0].split(",").map(h => h.trim().toLowerCase());
  const expected = ["code", "title", "haslab", "labhours", "lecturehours"];
  const matches = expected.every(col => header.includes(col));

  if (!matches) {
    return { success: false, data: [], error: `Invalid header. Expected: code, title, hasLab, labHours, lectureHours` };
  }

  const codeIdx = header.indexOf("code");
  const titleIdx = header.indexOf("title");
  const hasLabIdx = header.indexOf("haslab");
  const labHoursIdx = header.indexOf("labhours");
  const lectureHoursIdx = header.indexOf("lecturehours");

  const results: Course[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVRow(lines[i]);
    if (row.length < 5) {
      return { success: false, data: [], error: `Row ${i + 1} has insufficient columns (expected 5, got ${row.length}). Transaction rolled back.` };
    }

    const code = row[codeIdx]?.trim();
    const title = row[titleIdx]?.trim();
    const hasLabStr = row[hasLabIdx]?.trim().toLowerCase();
    const labHoursStr = row[labHoursIdx]?.trim();
    const lectureHoursStr = row[lectureHoursIdx]?.trim();

    if (!code || !title || !hasLabStr || !labHoursStr || !lectureHoursStr) {
      return { success: false, data: [], error: `Row ${i + 1} has empty values. Transaction rolled back.` };
    }

    const hasLab = hasLabStr === "true" || hasLabStr === "yes" || hasLabStr === "1";
    const labHours = parseInt(labHoursStr, 10);
    const lectureHours = parseInt(lectureHoursStr, 10);

    if (isNaN(labHours) || labHours < 0 || labHours > 10) {
      return { success: false, data: [], error: `Row ${i + 1} invalid labHours: "${labHoursStr}". Must be a number between 0 and 10.` };
    }
    if (isNaN(lectureHours) || lectureHours < 0 || lectureHours > 10) {
      return { success: false, data: [], error: `Row ${i + 1} invalid lectureHours: "${lectureHoursStr}". Must be a number between 0 and 10.` };
    }

    results.push({ code, title, hasLab, labHours, lectureHours });
  }

  return { success: true, data: results };
}

// Simple CSV helper that supports quoted values with commas
function splitCSVRow(text: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
