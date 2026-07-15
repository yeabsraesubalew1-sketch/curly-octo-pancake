/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Department, Instructor, Course, CourseAssignment, ScheduleItem } from "../types";
import { api } from "../lib/api";

type Setter<T> = (value: T | ((prev: T) => T)) => void;

/**
 * Loads the full academic dataset (departments, instructors, courses,
 * assignments, schedule) from the MongoDB-backed API for the current
 * session, and returns React-state-shaped setters that both update the
 * UI immediately and persist the change back to the database -- mirroring
 * how the original app's useEffect-driven localStorage sync worked, but
 * now against real network calls.
 */
export function useAcademicData() {
  const [departments, setDepartmentsState] = useState<Department[]>([]);
  const [instructors, setInstructorsState] = useState<Instructor[]>([]);
  const [courses, setCoursesState] = useState<Course[]>([]);
  const [assignments, setAssignmentsState] = useState<CourseAssignment[]>([]);
  const [schedule, setScheduleState] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const departmentsRef = useRef(departments);
  const instructorsRef = useRef(instructors);
  const coursesRef = useRef(courses);
  const assignmentsRef = useRef(assignments);
  const scheduleRef = useRef(schedule);

  useEffect(() => {
    departmentsRef.current = departments;
  }, [departments]);

  useEffect(() => {
    instructorsRef.current = instructors;
  }, [instructors]);

  useEffect(() => {
    coursesRef.current = courses;
  }, [courses]);

  useEffect(() => {
    assignmentsRef.current = assignments;
  }, [assignments]);

  useEffect(() => {
    scheduleRef.current = schedule;
  }, [schedule]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, i, c, a, s] = await Promise.all([
        api.get<Department[]>("/departments", false),
        api.get<Instructor[]>("/instructors"),
        api.get<Course[]>("/courses"),
        api.get<CourseAssignment[]>("/assignments", false),
        api.get<ScheduleItem[]>("/schedule")
      ]);
      setDepartmentsState(d);
      setInstructorsState(i);
      setCoursesState(c);
      setAssignmentsState(a);
      setScheduleState(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data from the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Generic helper: optimistically updates local state, then PUTs the
  // resulting array to the backend so it's persisted in MongoDB.
  function makeRemoteSetter<T>(
    stateRef: { current: T[] },
    localSetter: (v: T[]) => void,
    path: string
  ): Setter<T[]> {
    return (value) => {
      const previous = stateRef.current;
      const next = typeof value === "function" ? (value as (prev: T[]) => T[])(previous) : value;

      stateRef.current = next;
      localSetter(next);

      api.put<T[]>(path, next).catch((err) => {
        stateRef.current = previous;
        localSetter(previous);
        setError(err instanceof Error ? err.message : `Failed to save changes to ${path}.`);
      });
    };
  }

  const setDepartments = makeRemoteSetter(departmentsRef, setDepartmentsState, "/departments");
  const setInstructors = makeRemoteSetter(instructorsRef, setInstructorsState, "/instructors");
  const setCourses = makeRemoteSetter(coursesRef, setCoursesState, "/courses");
  const setAssignments = makeRemoteSetter(assignmentsRef, setAssignmentsState, "/assignments");
  const setSchedule = useCallback((value: ScheduleItem[] | ((prev: ScheduleItem[]) => ScheduleItem[])) => {
    const previous = scheduleRef.current;
    const next = typeof value === "function" ? value(previous) : value;
    scheduleRef.current = next;
    setScheduleState(next);
  }, []);

  const generateSchedule = useCallback(async () => {
    try {
      const result = await api.post<{ success: boolean; msg: string; errors: any[]; schedule: ScheduleItem[] }>(
        "/schedule/generate"
      );
      setScheduleState(result.schedule || []);
      scheduleRef.current = result.schedule || [];
      return { success: result.success, msg: result.msg, errors: result.errors };
    } catch (err) {
      return {
        success: false,
        msg: err instanceof Error ? err.message : "Failed to generate the schedule.",
        errors: []
      };
    }
  }, []);

  const resetDb = useCallback(async () => {
    await api.post("/db/reset");
    await refetch();
  }, [refetch]);

  return {
    departments,
    instructors,
    courses,
    assignments,
    schedule,
    loading,
    error,
    setDepartments,
    setInstructors,
    setCourses,
    setAssignments,
    setSchedule,
    generateSchedule,
    resetDb,
    refetch
  };
}
