// Modified from SurveyAI by Sameer Shaik (CC BY-NC 4.0): model call goes through
// ../lib/ai-provider (Claude by default); daily question limit added.
const { generate } = require('../lib/ai-provider');

const DAILY_LIMIT = parseInt(process.env.AI_QA_DAILY_LIMIT || '100', 10);

let dailyCount = 0;
let lastResetDate = new Date().toISOString().slice(0, 10);

function checkAndIncrementCounter() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== lastResetDate) {
    dailyCount = 0;
    lastResetDate = today;
  }
  if (dailyCount >= DAILY_LIMIT) return false;
  dailyCount++;
  return true;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { question, reportContext } = JSON.parse(event.body);

    if (!question || question.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Question is required.' }),
      };
    }

    if (question.trim().length > 500) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Question too long. Please keep it under 500 characters.' }),
      };
    }

    const systemPrompt = `You are SurveyAI, an expert RICS-qualified building surveyor assistant.
You are answering a question about a specific property defect report.
Your answers must be:
- Grounded ONLY in the report data provided. Do not introduce defects, costs, or risks not present in the report.
- Written in plain, accessible English (not technical surveying jargon unless asked).
- Honest about uncertainty — if the report does not contain enough information to answer confidently, say so clearly.
- Concise: 3–6 sentences maximum unless a longer answer is clearly warranted.
- Professionally cautious: always recommend consulting a qualified Chartered Surveyor for decisions involving legal completion or significant expenditure.

If the question is entirely unrelated to the property report (e.g. general knowledge, personal advice unrelated to property), respond:
"I can only answer questions related to this specific property report. Please ask me about the defects, risks, costs, or recommended actions identified in this survey."`;

    const userMessage = `PROPERTY REPORT CONTEXT:
Reference: ${reportContext.ref}
Severity: ${reportContext.severity} (Score: ${reportContext.severityScore}/100)
Urgency: ${reportContext.urgency}
Defects identified: ${reportContext.defectCategories.map(d => `${d.name} (${d.confidence}% confidence, ${d.severity} severity)`).join(', ')}
Survey description: ${reportContext.surveyDescription}
Risk matrix — Likelihood: ${reportContext.riskMatrix?.likelihood}, Impact: ${reportContext.riskMatrix?.impact}
Indicative repair costs: £${reportContext.costEstimate?.low?.toLocaleString()} – £${reportContext.costEstimate?.high?.toLocaleString()} (GBP, 2025 UK rates)
Recommendations: ${reportContext.recommendations?.map(r => `[${r.priority}] ${r.action} (${r.timeframe})`).join('; ')}
${reportContext.locationContextNotes ? `Location context: ${reportContext.locationContextNotes}` : ''}
${reportContext.citations?.length ? `Referenced standards: ${reportContext.citations.map(c => c.reference).join(', ')}` : ''}

USER QUESTION: ${question}`;

    if (!checkAndIncrementCounter()) {
      return {
        statusCode: 429,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Daily question limit reached. Please try again tomorrow.' }),
      };
    }

    const answer = await generate({ system: systemPrompt, text: userMessage, maxTokens: 400 });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ answer }),
    };

  } catch (err) {
    console.error('[qa] Error:', err);
    return {
      statusCode: err.statusCode || 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
