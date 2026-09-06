import Anthropic from '@anthropic-ai/sdk';
import { config, requireEnv } from './config.js';

/**
 * Claude API로 블로그 글 초안을 생성한다.
 *
 * @param {object} opts
 * @param {string} opts.topic   - 글 주제 (필수)
 * @param {string} [opts.tone]  - 어조 (예: "친근한", "전문적인")
 * @param {string[]} [opts.keywords] - SEO 키워드
 * @returns {Promise<{title: string, tags: string[], html: string}>}
 */
export async function generatePost({ topic, tone = '친근하고 읽기 쉬운', keywords = [] }) {
  requireEnv(config.anthropic.apiKey, 'ANTHROPIC_API_KEY');
  if (!topic) throw new Error('주제(topic)가 필요합니다.');

  const client = new Anthropic({ apiKey: config.anthropic.apiKey });

  const keywordLine = keywords.length
    ? `\n반드시 자연스럽게 포함할 키워드: ${keywords.join(', ')}`
    : '';

  const prompt = `당신은 한국어 블로그 작가입니다. 아래 주제로 블로그 글 한 편을 작성하세요.

주제: ${topic}
어조: ${tone}${keywordLine}

요구사항:
- 실제 독자에게 도움이 되는 구체적인 정보 위주로 작성
- 소제목(h2), 문단(p), 필요 시 목록(ul/li)을 사용한 HTML 본문
- 과장/광고성 표현 자제, 자연스러운 문장

아래 형식의 JSON만 출력하세요. 다른 설명은 절대 붙이지 마세요.
{
  "title": "글 제목",
  "tags": ["태그1", "태그2", "태그3"],
  "html": "<h2>...</h2><p>...</p> 형태의 본문 HTML"
}`;

  const res = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
  const json = extractJson(text);

  if (!json.title || !json.html) {
    throw new Error('생성 결과에서 title/html을 찾지 못했습니다. 응답:\n' + text.slice(0, 500));
  }
  return {
    title: json.title,
    tags: Array.isArray(json.tags) ? json.tags : [],
    html: json.html,
  };
}

/** 모델 응답에서 JSON 블록을 안전하게 추출한다(코드펜스 포함 대비). */
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('JSON 파싱 실패. 원문:\n' + text.slice(0, 500));
  }
  return JSON.parse(raw.slice(start, end + 1));
}
