// ─────────────────────────────────────────────────────────────────────────────
// Sprint 2 navigation types.  Overlay screens are pushed on a modal stack
// that sits above the main tab navigator so the tab content stays mounted.
// ─────────────────────────────────────────────────────────────────────────────

export type OverlayParamList = {
  MainTabs: undefined;
  LogIssue: { lawnId: string };
  /** issueId is required when opening from history; when navigating right after
   *  a log submission we pass it as well. */
  CareCard: { lawnId: string; issueId: string };
  AskGuru: { lawnId: string };
  Paywall: undefined;
};
