import {
  findCreditByOrderNo,
  getUserValidCredits,
  insertCredit,
} from "@/models/credit";
import { and, asc, eq, gte, sql } from "drizzle-orm";
import { credits as creditsTable } from "@/db/schema";
import { db } from "@/db";
import { getIsoTimestr } from "@/lib/time";
import { getSnowId } from "@/lib/hash";
import { Order } from "@/types/order";
import { UserCredits } from "@/types/user";
import { getFirstPaidOrderByUserUuid } from "@/models/order";

export enum CreditsTransType {
  NewUser = "new_user", // initial credits for new user
  OrderPay = "order_pay", // user pay for credits
  SystemAdd = "system_add", // system add credits
  Ping = "ping", // cost for ping api
  ChatContinue = "chat_continue", // cost for streaming continue chat
}

export enum CreditsAmount {
  NewUserGet = 50,
  PingCost = 1,
}

export async function getUserCredits(user_uuid: string): Promise<UserCredits> {
  let user_credits: UserCredits = {
    left_credits: 0,
  };

  try {
    const first_paid_order = await getFirstPaidOrderByUserUuid(user_uuid);
    if (first_paid_order) {
      user_credits.is_recharged = true;
    }

    const credits = await getUserValidCredits(user_uuid);
    if (credits) {
      credits.forEach((v) => {
        user_credits.left_credits += v.credits || 0;
      });
    }

    if (user_credits.left_credits < 0) {
      user_credits.left_credits = 0;
    }

    if (user_credits.left_credits > 0) {
      user_credits.is_pro = true;
    }

    return user_credits;
  } catch (e) {
    console.log("get user credits failed: ", e);
    return user_credits;
  }
}

export async function decreaseCredits({
  user_uuid,
  trans_type,
  credits,
}: {
  user_uuid: string;
  trans_type: CreditsTransType;
  credits: number;
}) {
  try {
    await db().transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${user_uuid}))`);

      const now = new Date();
      const userCredits = await tx
        .select()
        .from(creditsTable)
        .where(
          and(
            gte(creditsTable.expired_at, now),
            eq(creditsTable.user_uuid, user_uuid)
          )
        )
        .orderBy(asc(creditsTable.expired_at));

      let order_no = "";
      let expired_at: Date | null = null;
      let left_credits = 0;

      for (const credit of userCredits) {
        left_credits += credit.credits;

        if (left_credits >= credits) {
          order_no = credit.order_no || "";
          expired_at = credit.expired_at || null;
          break;
        }
      }

      if (left_credits < credits) {
        throw new Error("insufficient credits");
      }

      const new_credit: typeof creditsTable.$inferInsert = {
        trans_no: getSnowId(),
        created_at: new Date(getIsoTimestr()),
        expired_at,
        user_uuid,
        trans_type,
        credits: 0 - credits,
        order_no,
      };

      await tx.insert(creditsTable).values(new_credit);
    });
  } catch (e) {
    console.log("decrease credits failed: ", e);
    throw e;
  }
}

export async function increaseCredits({
  user_uuid,
  trans_type,
  credits,
  expired_at,
  order_no,
}: {
  user_uuid: string;
  trans_type: string;
  credits: number;
  expired_at?: string;
  order_no?: string;
}) {
  try {
    const new_credit: typeof creditsTable.$inferInsert = {
      trans_no: getSnowId(),
      created_at: new Date(getIsoTimestr()),
      user_uuid: user_uuid,
      trans_type: trans_type,
      credits: credits,
      order_no: order_no || "",
      expired_at: expired_at ? new Date(expired_at) : null,
    };
    await insertCredit(new_credit);
  } catch (e) {
    console.log("increase credits failed: ", e);
    throw e;
  }
}

export async function updateCreditForOrder(order: Order) {
  try {
    const credit = await findCreditByOrderNo(order.order_no);
    if (credit) {
      // order already increased credit
      return;
    }

    await increaseCredits({
      user_uuid: order.user_uuid,
      trans_type: CreditsTransType.OrderPay,
      credits: order.credits,
      expired_at: order.expired_at,
      order_no: order.order_no,
    });
  } catch (e) {
    console.log("update credit for order failed: ", e);
    throw e;
  }
}
