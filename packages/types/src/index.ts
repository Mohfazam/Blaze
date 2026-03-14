import { z } from "zod"

export const CreateSiteSchema = z.object({
  url: z.string().url(),
  languages: z.array(z.string()).min(1).max(4)
})

export type CreateSiteInput = z.infer<typeof CreateSiteSchema>

export const CreateSiteResponseSchema = z.object({
  siteId: z.string(),
  status: z.literal("pending")
})

export type CreateSiteResponse = z.infer<typeof CreateSiteResponseSchema>
