/**
 * LinkedIn API — POST /rest/posts (Accounts API, text-only share).
 * Requires the `w_member_social` scope (app review on LinkedIn).
 * Returns the post URN from the x-restli-id response header.
 */
export async function publishToLinkedIn(
  accessToken: string,
  personId: string,
  text: string,
): Promise<string> {
  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "LinkedIn-Version": "202506",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${personId}`,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN",
        destinationUrn: `urn:li:shareTargetGroup:person:${personId}`,
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`LinkedIn API ${res.status}: ${await res.text()}`);
  }
  return res.headers.get("x-restli-id") ?? `urn:li:share:${personId}:unknown`;
}
