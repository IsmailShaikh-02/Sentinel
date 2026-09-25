import z from "zod";

export const publicStatusParamSchema = z.object({
    params: z.object({
        userId: z.string().uuid("Invalid user ID format")
    })
})