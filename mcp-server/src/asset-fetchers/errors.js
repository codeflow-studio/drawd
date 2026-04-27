/**
 * Typed error thrown when a keyed provider was requested but the matching
 * env var is unset. The orchestrator catches this to fall through to the
 * next provider in the chain (Unsplash → Pexels → Picsum).
 */
export class MissingApiKeyError extends Error {
  constructor(provider, envVar) {
    super(`${envVar} is not set. Falling back to a keyless source.`);
    this.name = "MissingApiKeyError";
    this.provider = provider;
    this.envVar = envVar;
  }
}
