// In-memory store for the most recently generated startup report so screens
// (results page, tracker, vault save) can share it without prop drilling.
// Persisted to Supabase via the vault layer.

import { StartupReport, SurveyAnswers } from './supabase';

let currentReport: StartupReport | null = null;
let currentInput: SurveyAnswers | string | null = null;

const listeners = new Set<() => void>();

export function setReport(report: StartupReport | null, input: SurveyAnswers | string | null) {
  currentReport = report;
  currentInput = input;
  listeners.forEach((l) => l());
}

export function getReport(): StartupReport | null {
  return currentReport;
}

export function getInput(): SurveyAnswers | string | null {
  return currentInput;
}

export function subscribeReport(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
