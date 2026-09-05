export type ApologyStyle = 
  | 'imperial'    // 宫廷甄嬛体 / 臣妾罪该万死
  | 'corporate'   // 大厂黑话复盘体 / 底层逻辑与赋能
  | 'humble_dog'  // 卑微小狗求饶体 / 呼吸都是我的错
  | 'wuxia'       // 江湖负荆请罪体 / 在下自废武功
  | 'gamer'       // 电竞滑跪体 / 义父下把给你当狗
  | 'classical';  // 古风文言赋论体 / 悔过自新策

export interface PunishmentItem {
  id: string;
  nameZh: string;
  nameEn: string;
  pinyin: string;
  icon: string;
  dangerLevel: number; // 1 to 5
  descriptionZh: string;
  descriptionEn: string;
  ruleZh: string;
  ruleEn: string;
  funFactZh: string;
  funFactEn: string;
  soundType: 'thud' | 'click' | 'crunch' | 'beep' | 'gong';
}

export interface MemeTopic {
  id: string;
  titleZh: string;
  titleEn: string;
  pinyin: string;
  tag: 'dating' | 'workplace' | 'gaming' | 'culture';
  lethalityScore: number; // 1 to 100%
  summaryZh: string;
  summaryEn: string;
  classicQuoteZh: string;
  classicQuoteEn: string;
  originZh: string;
  originEn: string;
  countermeasureZh: string;
  countermeasureEn: string;
}

export interface ApologyFormState {
  recipient: string;
  offense: string;
  style: ApologyStyle;
  penalty: string;
  customOffense?: string;
  customRecipient?: string;
}

export interface SealStamp {
  id: string;
  textZh: string;
  textEn: string;
  rotation: number;
  x: number;
  y: number;
}
