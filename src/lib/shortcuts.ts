/**
 * Global keyboard shortcuts must not fire while the user is typing ("c" in a comment is a letter,
 * not "create issue"), when a modifier is held (Ctrl+C is copy), or when a dialog is already open.
 */
export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function canUseSingleKeyShortcut(e: KeyboardEvent) {
  return (
    !e.metaKey &&
    !e.ctrlKey &&
    !e.altKey &&
    !isTypingTarget(e.target) &&
    !document.querySelector('[role="dialog"], [role="alertdialog"]')
  );
}

/**
 * "Create issue" is requested through a DOM event, so the palette and the `c` key don't need to know
 * which page is open. The page's CreateIssueDialog listens and calls preventDefault() to say "handled".
 */
export const CREATE_ISSUE_EVENT = "jira:create-issue";

/** Returns false when no page could handle it (e.g. you're not on a project page). */
export function requestCreateIssue() {
  const event = new Event(CREATE_ISSUE_EVENT, { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}
