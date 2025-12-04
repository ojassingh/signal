import { z } from "zod";

const pipeNameSchema = z
  .string()
  .min(1, "Pipe name is required")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid Tinybird pipe name");

const paramsSchema = z
  .record(z.string(), z.union([z.string(), z.number()]))
  .optional()
  .default({});

export async function queryPipe<T>(
  pipeName: string,
  params: Record<string, string | number> = {}
): Promise<T[]> {
  const validatedPipe = pipeNameSchema.parse(pipeName);
  const validatedParams = paramsSchema.parse(params);

  const TINYBIRD_API =
    (process.env.TINYBIRD_API_URL || "https://api.us-east.tinybird.co") +
    "/v0/pipes";

  const url = new URL(`${TINYBIRD_API}/${validatedPipe}.json`);

  for (const [key, value] of Object.entries(validatedParams)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.TINYBIRD_TOKEN}` },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Tinybird error: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  const json = (await response.json()) as { data: T[] };
  return json.data;
}
