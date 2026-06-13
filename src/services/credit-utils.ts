type CreditLike = {
  credits: number;
  expired_at?: Date | null;
  order_no?: string | null;
};

function compareCreditExpiry(a: CreditLike, b: CreditLike) {
  const aTime = a.expired_at?.getTime();
  const bTime = b.expired_at?.getTime();

  if (aTime == null && bTime == null) {
    return 0;
  }

  if (aTime == null) {
    return 1;
  }

  if (bTime == null) {
    return -1;
  }

  return aTime - bTime;
}

export function isCreditExpired(
  credit: Pick<CreditLike, "expired_at">,
  now: Date = new Date()
) {
  if (!credit.expired_at) {
    return false;
  }

  return credit.expired_at.getTime() < now.getTime();
}

export function sumAvailableCredits(
  credits: CreditLike[],
  now: Date = new Date()
) {
  return credits.reduce((total, credit) => {
    if (isCreditExpired(credit, now)) {
      return total;
    }

    return total + (credit.credits || 0);
  }, 0);
}

export function findCoveringCredit(
  credits: CreditLike[],
  requiredCredits: number,
  now: Date = new Date()
) {
  let left_credits = 0;

  const orderedCredits = [...credits].sort(compareCreditExpiry);

  for (const credit of orderedCredits) {
    if (isCreditExpired(credit, now)) {
      continue;
    }

    left_credits += credit.credits || 0;

    if (left_credits >= requiredCredits) {
      return {
        order_no: credit.order_no || "",
        expired_at: credit.expired_at || null,
        left_credits,
      };
    }
  }

  return null;
}
