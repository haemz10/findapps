// mosaic.js — 사진 개인정보 모자이크 (sharp)
//
// 사용:  node scripts/mosaic.js <spec.json>
// spec 예:
// {
//   "image": "input/photos/01.jpg",
//   "blockSize": 16,               // 모자이크 셀 크기(px). 클수록 더 뭉갬. 기본 16
//   "regions": [                   // 0~1 상대좌표. 좌표는 EXIF 회전 보정 후(보이는 화면) 기준.
//     { "x": 0.30, "y": 0.10, "w": 0.25, "h": 0.20 }   // 상하좌우 15% 여유는 좌표 잡을 때 이미 포함
//   ]
// }
//
// 규칙: 원본은 절대 덮어쓰지 않는다. 처리본은 input/photos/_mosaic/ 에 저장.
//       sharp 한 파이프라인엔 resize 1회만 적용되므로 축소→버퍼→확대(nearest) 2단계로 분리.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(ROOT, 'input', 'photos', '_mosaic');

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

async function mosaicRegion(baseBuf, region, W, H, blockSize) {
  // 상대좌표 → 픽셀, 이미지 경계로 클램프
  let left = Math.round(clamp(region.x, 0, 1) * W);
  let top = Math.round(clamp(region.y, 0, 1) * H);
  let width = Math.round(clamp(region.w, 0, 1) * W);
  let height = Math.round(clamp(region.h, 0, 1) * H);
  width = clamp(width, 1, W - left);
  height = clamp(height, 1, H - top);
  if (width < 1 || height < 1) return null;

  // 1단계: 영역 추출 후 대폭 축소
  const downW = Math.max(1, Math.round(width / blockSize));
  const downH = Math.max(1, Math.round(height / blockSize));
  const small = await sharp(baseBuf)
    .extract({ left, top, width, height })
    .resize(downW, downH, { fit: 'fill' })
    .toBuffer();

  // 2단계: nearest로 원래 크기까지 확대 → 픽셀 뭉갬 효과
  const pixelated = await sharp(small)
    .resize(width, height, { kernel: 'nearest', fit: 'fill' })
    .toBuffer();

  return { input: pixelated, left, top };
}

async function processSpec(spec) {
  const imgPath = path.isAbsolute(spec.image) ? spec.image : path.resolve(ROOT, spec.image);
  if (!fs.existsSync(imgPath)) throw new Error(`이미지 없음: ${imgPath}`);
  const blockSize = Number(spec.blockSize) > 0 ? Number(spec.blockSize) : 16;

  // EXIF 회전 보정(.rotate()) 후 버퍼로 고정 → 이후 좌표는 보이는 화면 기준
  const baseBuf = await sharp(imgPath).rotate().toBuffer();
  const meta = await sharp(baseBuf).metadata();
  const W = meta.width, H = meta.height;

  const overlays = [];
  for (const r of spec.regions || []) {
    const ov = await mosaicRegion(baseBuf, r, W, H, blockSize);
    if (ov) overlays.push(ov);
  }
  if (!overlays.length) throw new Error('처리할 영역(regions)이 없습니다.');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, path.basename(imgPath));
  await sharp(baseBuf).composite(overlays).toFile(outPath);

  console.log(`✓ 모자이크 ${overlays.length}개 영역 적용: ${path.relative(ROOT, outPath)}`);
  console.log(`  원본(${W}x${H})은 그대로 보존됨. 처리본을 Read로 열어 실제로 가려졌는지 확인하세요.`);
  console.log('  덜 가려졌으면 spec의 해당 region 좌표(w/h)를 키워 재실행하세요.');
  return outPath;
}

async function main() {
  const specPath = process.argv[2];
  if (!specPath) { console.error('✗ 사용: node scripts/mosaic.js <spec.json>'); process.exit(1); }
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const specs = Array.isArray(spec) ? spec : [spec];
  for (const s of specs) await processSpec(s);
}

main().catch((e) => { console.error('✗ 오류:', e.message); process.exit(1); });
