import { Inngest } from "inngest";

export type AppEvents = {
  "post.publish.scheduled": { data: { postId: string } };
  "post.publish.canceled": { data: { postId: string } };
};

export const inngest = new Inngest({ id: "postpulse" });
