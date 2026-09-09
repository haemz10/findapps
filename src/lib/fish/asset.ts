/**
 * 물고기 이미지 에셋.
 *
 * 물고기는 그림 파일 한 장으로 그린다. 아래 좌표들은 그 그림에 맞춰 한 번 맞춰두면
 * 말풍선이 어디서 나올지, 물고기가 얼마나 크게 보일지가 전부 결정된다.
 *
 * 파일을 갈아끼웠다면 `mouth` 와 `bodyBox` 를 다시 재야 한다.
 */

export interface FishAsset {
  /**
   * 그림 파일을 쓸 것인가.
   * false 면 코드로 그린 물고기를 쓴다. 파일을 넣기 전까지 이걸 켜두면
   * 매번 404 를 내므로, 파일을 실제로 추가한 다음 true 로 바꾼다.
   */
  enabled: boolean;
  /** public/ 아래 경로 */
  src: string;
  /** 이미지 안에서 주둥이(말이 나오는 곳)의 위치, 0~1 */
  mouth: { x: number; y: number };
  /**
   * 이미지 안에서 물고기 몸이 실제로 차지하는 영역, 0~1.
   * 지느러미까지 포함한 여백이 크면 물고기가 실제보다 작아 보이므로 이걸로 보정한다.
   */
  bodyBox: { x: number; y: number; w: number; h: number };
  /**
   * 정면을 보는 그림인가.
   * 정면 캐릭터는 좌우로 뒤집으면 어색하므로 뒤집지 않고 떠다니게만 한다.
   */
  frontFacing: boolean;
  /** 그림의 가로/세로 비 */
  aspect: number;
}

export const FISH_ASSET: FishAsset = {
  // public/fish/betta.png 를 넣은 뒤 true 로 바꾸면 그 사진이 물고기가 된다
  enabled: false,
  src: "/fish/betta.png",
  // 첨부한 그림에 맞춰 실제 파일이 들어오면 다시 잰다
  mouth: { x: 0.72, y: 0.42 },
  bodyBox: { x: 0.06, y: 0.04, w: 0.88, h: 0.92 },
  frontFacing: true,
  aspect: 1,
};
