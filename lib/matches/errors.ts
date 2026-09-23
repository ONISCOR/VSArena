export class AgentOwnershipError extends Error {
  readonly status = 403 as const;

  constructor(message: string) {
    super(message);
    this.name = "AgentOwnershipError";
  }
}

export class RateLimitError extends Error {
  readonly status = 429 as const;

  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class OfficialIngestError extends Error {
  readonly status = 400 as const;

  constructor(message: string) {
    super(message);
    this.name = "OfficialIngestError";
  }
}

export function isAgentOwnershipError(error: unknown): error is AgentOwnershipError {
  return error instanceof AgentOwnershipError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isOfficialIngestError(error: unknown): error is OfficialIngestError {
  return error instanceof OfficialIngestError;
}
