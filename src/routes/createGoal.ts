import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { createGoal } from '../features/createGoal'
import z from 'zod'

export const createGoalRoute: FastifyPluginAsyncZod = async app => {
  app.post(
    '/goals',
    {
      schema: {
        body: z.object({
          title: z.string(),
          desiredWeeklyFrequency: z.number().int().min(1).max(7),
        }),
      },
    },
    async req => {
      const { title, desiredWeeklyFrequency } = req.body
      await createGoal({
        title,
        desiredWeeklyFrequency,
      })
    }
  )
}
