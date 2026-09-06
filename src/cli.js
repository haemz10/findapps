import { writeFileSync, mkdirSync } from 'node:fs';
import { config } from './config.js';
import { generatePost } from './generator.js';
import * as tistory from './publishers/tistory.js';
import * as naver from './publishers/naver.js';

/** 설정된 플랫폼에 맞는 발행 모듈을 반환한다. */
function publisher() {
  switch (config.platform) {
    case 'tistory': return tistory;
    case 'naver': return naver;
    default:
      console.error(`✗ 알 수 없는 PLATFORM: ${config.platform} (tistory | naver)`);
      process.exit(1);
  }
}

/** `--key value` 및 `--key=value` 형태의 인자를 파싱한다. */
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    if (key.includes('=')) {
      const [k, v] = key.split('=');
      out[k] = v;
    } else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
      out[key] = argv[++i];
    } else {
      out[key] = true;
    }
  }
  return out;
}

function saveDraft(post) {
  mkdirSync('output', { recursive: true });
  const file = `output/${Date.now()}.json`;
  writeFileSync(file, JSON.stringify(post, null, 2));
  return file;
}

const HELP = `블로그 자동화 CLI

사용법:
  npm run login                                  로그인 세션 저장(최초 1회)
  npm run generate -- --topic "주제" [옵션]       AI로 초안 생성 후 output/에 저장
  npm run publish  -- --file output/xxxx.json    저장된 초안 발행
  npm run run      -- --topic "주제" [옵션]        생성 + 즉시 발행

옵션:
  --topic     글 주제 (generate/run 필수)
  --tone      어조 (기본: "친근하고 읽기 쉬운")
  --keywords  쉼표로 구분한 SEO 키워드
`;

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const pub = () => publisher();

  const buildOpts = () => ({
    topic: args.topic,
    tone: args.tone,
    keywords: args.keywords ? String(args.keywords).split(',').map((s) => s.trim()) : [],
  });

  switch (cmd) {
    case 'login':
      await pub().login();
      break;

    case 'generate': {
      const post = await generatePost(buildOpts());
      const file = saveDraft(post);
      console.log(`✓ 초안 생성 완료: ${post.title}`);
      console.log(`  저장 위치: ${file}`);
      break;
    }

    case 'publish': {
      if (!args.file) { console.error('✗ --file 이 필요합니다.'); process.exit(1); }
      const { readFileSync } = await import('node:fs');
      const post = JSON.parse(readFileSync(args.file, 'utf8'));
      await pub().publish(post);
      break;
    }

    case 'run': {
      const post = await generatePost(buildOpts());
      saveDraft(post);
      console.log(`✓ 초안 생성 완료: ${post.title} → 발행 시작`);
      await pub().publish(post);
      break;
    }

    default:
      console.log(HELP);
  }
}

main().catch((err) => {
  console.error('✗ 오류:', err.message);
  process.exit(1);
});
