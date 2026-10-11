/** X (Twitter) API v2 — POST /2/tweets. Returns the tweet id. */
export async function publishToX(accessToken: string, text: string): Promise<string> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`X API ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { data?: { id?: string } };
  if (!json.data?.id) throw new Error("X API returned no tweet id");
  return json.data.id;
}
