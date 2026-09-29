// Single entry point for model calls, so functions don't depend on a vendor SDK.
// AI_PROVIDER selects the backend:
//   anthropic (default) - Claude via @anthropic-ai/sdk, key in ANTHROPIC_API_KEY
//   bedrock             - the original Amazon Nova Pro on AWS Bedrock
// A local provider (e.g. Ollama) is added here as one more generate function.
//
// Modified from SurveyAI by Sameer Shaik (CC BY-NC 4.0): model calls moved out of
// the Netlify functions into this module; Claude added as the default provider.

class AiError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.statusCode = statusCode;
  }
}

// The frontend always labels uploads image/jpeg; the real type comes from the bytes.
function detectMediaType(buffer, fallback) {
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buffer.toString('ascii', 0, 4) === 'GIF8') return 'image/gif';
  return fallback;
}

// ---- Anthropic (Claude) ----

let anthropicClient;

async function generateAnthropic({ system, text, image, maxTokens }) {
  const Anthropic = require('@anthropic-ai/sdk');
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiError('ANTHROPIC_API_KEY is not set on the server.', 500);
  }
  anthropicClient ??= new Anthropic();

  const content = [];
  if (image) {
    const bytes = Buffer.from(image.base64, 'base64');
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: detectMediaType(bytes, image.mediaType), data: image.base64 },
    });
  }
  content.push({ type: 'text', text });

  const useFallbacks = (process.env.AI_FALLBACKS || 'default') !== 'off';
  let response;
  try {
    response = await anthropicClient.beta.messages.create({
      model: process.env.AI_MODEL || 'claude-opus-5-5',
      // Thinking tokens count toward max_tokens, so leave room above the answer size.
      max_tokens: Math.max(maxTokens, 16000),
      output_config: { effort: process.env.AI_EFFORT || 'medium' },
      // On a safety-classifier decline the API retries on Anthropic's recommended model.
      ...(useFallbacks && { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }),
      ...(system && { system }),
      messages: [{ role: 'user', content }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new AiError('ANTHROPIC_API_KEY is invalid.', 500);
    if (err instanceof Anthropic.RateLimitError) throw new AiError('Model rate limit reached. Please try again shortly.', 429);
    if (err instanceof Anthropic.APIError) throw new AiError(`Model API error (${err.status}): ${err.message}`, 502);
    throw err;
  }

  if (response.stop_reason === 'refusal') {
    throw new AiError('The model declined to analyse this request.', 422);
  }
  if (response.stop_reason === 'max_tokens') {
    throw new AiError('The model response was cut off (max_tokens).', 502);
  }
  return response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');
}

// ---- AWS Bedrock (original) ----

let bedrockClient;

async function generateBedrock({ system, text, image, maxTokens }) {
  const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
  bedrockClient ??= new BedrockRuntimeClient({
    region: process.env.BEDROCK_REGION || 'eu-west-2',
    credentials: {
      accessKeyId: process.env.BEDROCK_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.BEDROCK_AWS_SECRET_ACCESS_KEY,
    },
  });

  const content = [];
  if (image) {
    const bytes = Buffer.from(image.base64, 'base64');
    const mediaType = detectMediaType(bytes, image.mediaType);
    content.push({
      image: {
        format: mediaType === 'image/png' ? 'png' : mediaType === 'image/webp' ? 'webp' : 'jpeg',
        source: { bytes },
      },
    });
  }
  content.push({ text });

  const response = await bedrockClient.send(new ConverseCommand({
    modelId: process.env.AI_MODEL || 'amazon.nova-pro-v1:0',
    ...(system && { system: [{ text: system }] }),
    messages: [{ role: 'user', content }],
    inferenceConfig: { maxTokens },
  }));
  return response.output.message.content
    .filter(b => b.text)
    .map(b => b.text)
    .join('');
}

// ---- public API ----

const PROVIDERS = {
  anthropic: generateAnthropic,
  bedrock: generateBedrock,
};

/**
 * @param {{ system?: string, text: string, image?: { base64: string, mediaType: string }, maxTokens: number }} request
 * @returns {Promise<string>} the model's text answer
 */
async function generate(request) {
  const name = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
  const provider = PROVIDERS[name];
  if (!provider) throw new AiError(`Unknown AI_PROVIDER "${name}".`, 500);
  return provider(request);
}

module.exports = { generate, AiError };
