import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { functions } from "@/inngest/functions";

// Inngest's cloud (or `npx inngest-cli dev` locally) calls this endpoint to
// execute function steps. Nothing here runs while a step is sleeping.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
