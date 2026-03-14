import { z } from "zod"

export const CreateSiteSchema = z.object({
  url: z.string().url(),
  languages: z.array(z.string()).max(3).default([])
})

export type CreateSiteInput = z.infer<typeof CreateSiteSchema>

export const CreateSiteResponseSchema = z.object({
  siteId: z.string(),
  status: z.literal("pending")
})

export type CreateSiteResponse = z.infer<typeof CreateSiteResponseSchema>
