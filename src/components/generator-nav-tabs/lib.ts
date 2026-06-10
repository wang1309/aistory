export function getCenteredTabScrollLeft({
  containerWidth,
  contentWidth,
  tabOffsetLeft,
  tabWidth,
}: {
  containerWidth: number;
  contentWidth: number;
  tabOffsetLeft: number;
  tabWidth: number;
}) {
  const maxScrollLeft = Math.max(contentWidth - containerWidth, 0);
  const centered = tabOffsetLeft + tabWidth / 2 - containerWidth / 2;

  if (centered <= 0) {
    return 0;
  }

  if (centered >= maxScrollLeft) {
    return maxScrollLeft;
  }

  return centered;
}
