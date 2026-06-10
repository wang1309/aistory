type ReviewMenuState = {
  phase: "processing" | "reviewing";
  from: number;
  to: number;
};

type ShouldShowReviewMenuArgs = {
  hasEditorFocus: boolean;
  isChildOfMenu: boolean;
  isEditable: boolean;
  selectionFrom: number;
  selectionTo: number;
  selectedText: string;
  review: ReviewMenuState | null;
};

export function shouldShowReviewMenu({
  hasEditorFocus,
  isChildOfMenu,
  isEditable,
  selectionFrom,
  selectionTo,
  selectedText,
  review,
}: ShouldShowReviewMenuArgs) {
  if (!isEditable) return false;

  if (review) {
    return selectionFrom === review.from && selectionTo === review.to;
  }

  const hasEditorContext = hasEditorFocus || isChildOfMenu;
  const hasSelection = selectionFrom !== selectionTo;
  const hasSelectedText = selectedText.length > 0;

  return hasEditorContext && hasSelection && hasSelectedText;
}

export type { ReviewMenuState };
