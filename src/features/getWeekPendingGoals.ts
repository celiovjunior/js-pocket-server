import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { db } from '../db'
import { lte, and, count, gte, eq, sql } from 'drizzle-orm'
import { goalCompletions, goals } from '../db/schema'

dayjs.extend(weekOfYear)

export async function getWeekPendingGoals() {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  const createdGoalsUntilCurrentWeek = db
    .$with('created_goals_until_current_week')
    .as(
      db
        .select({
          id: goals.id,
          title: goals.title,
          desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
          createdAt: goals.createdAt,
        })
        .from(goals)
        .where(lte(goals.createdAt, lastDayOfWeek))
    )

  const goalCompletionCounts = db.$with('goal_completion_counts').as(
    db
      .select({
        goalId: goalCompletions.goalId,
        completionCount: count(goalCompletions.id).as('completionCount'),
      })
      .from(goalCompletions)
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastDayOfWeek)
        )
      )
      .groupBy(goalCompletions.goalId)
  )

  const pendingGoals = await db
    .with(createdGoalsUntilCurrentWeek, goalCompletionCounts)
    .select({
      id: createdGoalsUntilCurrentWeek.id,
      title: createdGoalsUntilCurrentWeek.title,
      desiredWeeklyFrequency:
        createdGoalsUntilCurrentWeek.desiredWeeklyFrequency,
      completionCount:
        sql`COALESCE(${goalCompletionCounts.completionCount}, 0)`.mapWith(
          Number
        ),
    })
    .from(createdGoalsUntilCurrentWeek)
    .leftJoin(
      goalCompletionCounts,
      eq(goalCompletionCounts.goalId, createdGoalsUntilCurrentWeek.id)
    )
  // .toSQL()

  return {
    pendingGoals,
  }
}
