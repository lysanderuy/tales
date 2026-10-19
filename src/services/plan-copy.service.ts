import "server-only";

import { db } from "@/db";
import { AppError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import { ScheduleError, repeatDates } from "@/lib/plan/schedule";
import { addDays } from "@/lib/time/zone";
import { createMany, loadDay, type Tx } from "@/services/block.service";
import type {
  CopyDayInput,
  PlannedAddedResponse,
  RepeatDayInput,
} from "@/validators/plan-copy.validator";

const MAX_ADDED_PER_REQUEST = 2000;

async function copyOnto(
  tx: Tx,
  userId: string,
  sourceDate: string,
  targetDates: readonly string[],
  preview: boolean,
): Promise<PlannedAddedResponse> {
  const source = await loadDay(tx, userId, sourceDate);
  const total = source.length * targetDates.length;
  if (total > MAX_ADDED_PER_REQUEST) throw new AppError(422, messages.copyTooMany);
  if (preview) return { added: total };
  const rows = targetDates.flatMap((date) =>
    source.map((block) => ({
      nodeId: block.nodeId,
      date,
      timeOfDay: block.timeOfDay,
      plannedMinutes: block.plannedMinutes,
    })),
  );
  return { added: await createMany(tx, userId, rows) };
}

export const planCopyService = {
  async copy(userId: string, input: CopyDayInput): Promise<PlannedAddedResponse> {
    return db.transaction((tx) =>
      copyOnto(tx, userId, input.sourceDate, input.targetDates, input.preview ?? false),
    );
  },

  async repeat(userId: string, input: RepeatDayInput): Promise<PlannedAddedResponse> {
    let dates: string[];
    try {
      dates = repeatDates({
        startKey: addDays(input.sourceDate, 1),
        endKey: input.endDate,
        weekdays: input.weekdays,
      });
    } catch (error) {
      if (error instanceof ScheduleError) {
        throw new AppError(
          422,
          error.reason === "span-too-long" ? messages.repeatRangeTooLong : messages.invalidRequest,
        );
      }
      throw error;
    }
    return db.transaction((tx) =>
      copyOnto(tx, userId, input.sourceDate, dates, input.preview ?? false),
    );
  },
};
