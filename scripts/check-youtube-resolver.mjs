const resolverBaseUrl = (
  process.env.YOUTUBE_RESOLVER_URL ||
  "https://personalnews-youtube-resolver.personalnewsapp.workers.dev"
).replace(/\/$/, "");
const sampleUrl =
  process.argv[2] || "https://www.youtube.com/@MachoNachoProductions";

const healthResponse = await fetch(`${resolverBaseUrl}/health`, {
  signal: AbortSignal.timeout(15_000),
});
if (!healthResponse.ok) {
  throw new Error(`Resolver health check failed with HTTP ${healthResponse.status}`);
}

const target = new URL(`${resolverBaseUrl}/api/v1/youtube/resolve`);
target.searchParams.set("url", sampleUrl);
const response = await fetch(target, { signal: AbortSignal.timeout(20_000) });
const body = await response.json().catch(() => null);
if (!response.ok) {
  throw new Error(
    `Resolver request failed with HTTP ${response.status}: ${JSON.stringify(body)}`,
  );
}
if (
  !body ||
  typeof body.feedUrl !== "string" ||
  !body.feedUrl.startsWith("https://www.youtube.com/feeds/videos.xml?")
) {
  throw new Error(`Resolver returned an invalid payload: ${JSON.stringify(body)}`);
}

console.log(
  JSON.stringify(
    {
      status: "ok",
      resolver: resolverBaseUrl,
      input: sampleUrl,
      feedUrl: body.feedUrl,
      title: body.title,
    },
    null,
    2,
  ),
);
