const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d', { alpha: false });

const $ = (s) => document.querySelector(s);
const ui = {
  menu: $('#menu'), hud: $('#hud'), start: $('#startBtn'), pause: $('#pauseBtn'),
  pauseScreen: $('#pauseScreen'), resume: $('#resumeBtn'), restart: $('#restartBtn'), pauseMenu: $('#pauseMenuBtn'),
  gameOver: $('#gameOverScreen'), retry: $('#retryBtn'), menuBtn: $('#menuBtn'), choice: $('#choiceScreen'),
  choiceCards: $('#choiceCards'), choiceTitle: $('#choiceTitle'), choiceKicker: $('#choiceKicker'),
  resonance: $('#resonanceBanner'), resonanceTitle: $('#resonanceTitle'), resonanceDesc: $('#resonanceDesc'),
  bossNotice: $('#bossNotice'), bossNoticeKicker: $('#bossNoticeKicker'), bossNoticeName: $('#bossNoticeName'),
  hpBar: $('#hpBar'), hpText: $('#hpText'), xpBar: $('#xpBar'), level: $('#levelText'),
  timer: $('#timerText'), threat: $('#threatText'), comboBox: $('#comboBox'), comboText: $('#comboText'), comboBar: $('#comboBar'),
  bossBar: $('#bossBar'), bossName: $('#bossName'), bossHpBar: $('#bossHpBar'),
  slots: $('#weaponSlots'), passives: $('#passiveList'), touch: $('#touchControls'), joystick: $('#joystick'), stick: $('#stick'),
  resultTime: $('#resultTime'), resultKills: $('#resultKills'), resultCombo: $('#resultCombo'), resultLevel: $('#resultLevel'),
  starterOptions: $('#starterOptions'), starterName: $('#starterName'), starterDesc: $('#starterDesc'),
};

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;

let vw = 1280, vh = 720, dpr = 1;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  vw = window.innerWidth;
  vh = window.innerHeight;
  canvas.width = Math.floor(vw * dpr);
  canvas.height = Math.floor(vh * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const COLORS = {
  cyan: '#7ce8ff', violet: '#9e79ff', pink: '#ff61b0', amber: '#ffcc5c',
  green: '#74f2a7', red: '#ff6d7a', white: '#f5f7ff', bg: '#050814',
  blue: '#4ab7ff', deep: '#0d1330', comet: '#b5f5ff', chrono: '#8fffe0'
};

const WEAPONS = {
  blade: {
    name: '펄스 블레이드', icon: '◒', color: '#7ce8ff', role: '공격 / 근접',
    desc: '초승달 형태의 광자 칼날이 궤도를 돌며 적을 절단한다.',
    resonance: {
      2: ['쌍월 궤도', '반대편에 두 번째 광자 칼날이 생성된다.'],
      4: ['성흔 파동', '적중 지점에서 관통하는 절단 파동이 발사된다.'],
      6: ['천체 분쇄기', '궤도가 확대되고 연속 처치마다 별빛 폭발이 발생한다.']
    }
  },
  ember: {
    name: '별빛 캐스터', icon: '✦', color: '#ff7b9e', role: '공격 / 원거리',
    desc: '가장 가까운 적에게 긴 광미를 남기는 별빛 탄환을 발사한다.',
    resonance: {
      2: ['쌍성 사격', '한 번에 두 발의 별빛 탄환을 발사한다.'],
      4: ['성운 분열', '적중한 탄환이 세 갈래 별가루로 분열한다.'],
      6: ['초신성 탄두', '주기적으로 거대한 관통 초신성탄을 발사한다.']
    }
  },
  bulwark: {
    name: '불워크 드론', icon: '⬡', color: '#74f2a7', role: '방어 / 반격',
    desc: '방어 위성을 배치해 피해를 줄이고 공명 시 반격한다.',
    resonance: {
      2: ['연결 장갑', '최대 체력과 피해 감소가 증가한다.'],
      4: ['보복 방벽', '피격 시 주변 적에게 충격파를 방출한다.'],
      6: ['이동 요새', '주기적으로 완전 방어막을 충전하고 적을 밀어낸다.']
    }
  },
  gravity: {
    name: '중력 우물', icon: '◉', color: '#9e79ff', role: '제어 / 집속',
    desc: '공간을 찌그러뜨려 적을 한곳에 끌어당긴다.',
    resonance: {
      2: ['조석 고정', '흡입 범위와 힘이 증가한다.'],
      4: ['붕괴핵', '사건의 지평선 내부의 적이 지속 피해를 받는다.'],
      6: ['쌍둥이 특이점', '서로 교차하는 두 개의 우물을 생성한다.']
    }
  },
  comet: {
    name: '혜성 창', icon: '➳', color: '#b5f5ff', role: '공격 / 관통',
    desc: '가장 가까운 적을 향해 거대한 혜성을 발사한다.',
    resonance: {
      2: ['이중 궤적', '혜성이 나란히 두 발 발사된다.'],
      4: ['혜성 파편', '관통할 때마다 주변으로 얼음별 파편을 뿌린다.'],
      6: ['대충돌', '혜성이 사라질 때 광역 폭발을 일으킨다.']
    }
  },
  prism: {
    name: '성좌 프리즘', icon: '✧', color: '#c2a7ff', role: '소환 / 집중',
    desc: '작은 프리즘 위성이 공전하며 적에게 별빛을 발사한다.',
    resonance: {
      2: ['쌍둥이 프리즘', '공전 위성이 두 개로 증가한다.'],
      4: ['성좌 연결', '위성 사이에 피해를 주는 별자리 선이 연결된다.'],
      6: ['천구 의식', '세 개의 위성이 빠르게 연속 사격한다.']
    }
  },
  chrono: {
    name: '시간 고리', icon: '◎', color: '#8fffe0', role: '제어 / 지원',
    desc: '주변 시간을 늦춰 적의 접근 속도를 감소시킨다.',
    resonance: {
      2: ['느린 궤도', '감속 범위와 효과가 증가한다.'],
      4: ['시간 파동', '주기적으로 정지 파동을 방출해 피해를 준다.'],
      6: ['영원의 원환', '고리 안의 적이 크게 느려지고 무기 주기가 빨라진다.']
    }
  }
};

const PASSIVES = {
  magnet: { name: '자석 코어', icon: '⊕', color: '#ffcc5c', desc: '결정 흡수 범위 +28', max: 10 },
  echo: { name: '에코 비콘', icon: '⌁', color: '#ff61b0', desc: '장비 발동 복제 확률 증가', max: 8 },
  power: { name: '출력 증폭', icon: '▲', color: '#ff7b8d', desc: '모든 피해 +12%', max: 12 },
  haste: { name: '가속 회로', icon: '»', color: '#7ce8ff', desc: '공격 주기 8% 단축', max: 10 },
  vitality: { name: '재생 장갑', icon: '+', color: '#74f2a7', desc: '최대 체력 +15, 즉시 회복', max: 10 },
  speed: { name: '벡터 부스터', icon: '➤', color: '#9e79ff', desc: '이동 속도 +7%', max: 8 },
  crit: { name: '취약점 해석', icon: '✧', color: '#ffd57f', desc: '치명타 확률 +5%', max: 10 },
  chain: { name: '연쇄 과부하', icon: '⌁', color: '#ff61b0', desc: '처치 체인 유지시간 +15%', max: 8 },
  greed: { name: '개척 계약', icon: '◆', color: '#ff9f43', desc: '적 체력 +8%, 경험치 +18%', max: 7 },
  armor: { name: '충격 흡수재', icon: '▣', color: '#9fb7d9', desc: '받는 피해 -6%', max: 8 },
};

class AudioKit {
  constructor() { this.ctx = null; this.enabled = true; }
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
  tone(freq, duration=.06, type='sine', volume=.025, slide=0) {
    if (!this.enabled) return;
    this.init();
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + duration);
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + duration);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + duration);
  }
  hit(strong=false) { this.tone(strong ? 120 : 180, strong ? .11 : .05, 'square', strong ? .045 : .018, -70); }
  pickup() { this.tone(680, .05, 'sine', .018, 220); }
  level() { [420, 620, 910].forEach((f,i)=>setTimeout(()=>this.tone(f,.14,'triangle',.03,120), i*70)); }
  resonance() { [180, 260, 390, 580].forEach((f,i)=>setTimeout(()=>this.tone(f,.22,'sawtooth',.025,200), i*55)); }
  boss() { [90, 120, 180].forEach((f,i)=>setTimeout(()=>this.tone(f,.48,'sawtooth',.035,90), i*120)); }
  hurt() { this.tone(90,.18,'sawtooth',.045,-45); }
}
const audio = new AudioKit();

const state = {
  mode: 'menu', selectedStarter: 'blade', time: 0, kills: 0, level: 1, xp: 0, xpNeed: 18,
  threat: 1, combo: 0, maxCombo: 0, comboTimer: 0,
  camera: { x:0, y:0, shake:0 }, hitStop: 0, flash: 0,
  spawnTimer: 0, miniBossTimer: 35, bossTimer: 90, bossIndex: 0, bossActiveId: null,
  weaponSlots: [], weaponStacks: {}, passives: {},
  entities: {
    enemies: [], projectiles: [], enemyProjectiles: [], particles: [], gems: [], wells: [],
    texts: [], shockwaves: [], telegraphs: []
  },
  input: { x:0, y:0, keys:new Set(), touchX:0, touchY:0 },
  nextId: 1, echoCycle: 0
};

const player = {
  x: 0, y: 0, r: 17, hp: 100, maxHp: 100, shield: 0, invuln: 0, speed: 230,
  angle: 0, coreCd: 0, bladeTick: 0, emberCd: 0, wellCd: 0, fortressCd: 0,
  cometCd: 0, prismCd: 0, chronoCd: 0, hitPulse: 0
};

function resetGame() {
  const starter = WEAPONS[state.selectedStarter] ? state.selectedStarter : 'blade';
  state.mode = 'playing';
  state.time = 0; state.kills = 0; state.level = 1; state.xp = 0; state.xpNeed = 18;
  state.threat = 1; state.combo = 0; state.maxCombo = 0; state.comboTimer = 0;
  state.camera.shake = 0; state.hitStop = 0; state.flash = 0;
  state.spawnTimer = .8; state.miniBossTimer = 35; state.bossTimer = 90;
  state.bossIndex = 0; state.bossActiveId = null; state.echoCycle = 0;
  state.weaponSlots = [starter]; state.weaponStacks = { [starter]: 1 }; state.passives = {};
  Object.values(state.entities).forEach(a => a.length = 0);
  player.x = player.y = 0;
  player.maxHp = starter === 'bulwark' ? 108 : 100;
  player.hp = player.maxHp; player.shield = 0; player.invuln = 0;
  player.angle = 0; player.coreCd = .25; player.bladeTick = 0; player.emberCd = 0;
  player.wellCd = 0; player.fortressCd = 0; player.cometCd = 0; player.prismCd = 0;
  player.chronoCd = 0; player.hitPulse = 0;
  ui.menu.classList.remove('active'); ui.menu.classList.add('hidden'); ui.hud.classList.remove('hidden');
  ui.choice.classList.add('hidden'); ui.pauseScreen.classList.add('hidden'); ui.gameOver.classList.add('hidden');
  ui.resonance.classList.add('hidden'); ui.bossNotice.classList.add('hidden'); ui.bossBar.classList.add('hidden');
  if (matchMedia('(pointer: coarse)').matches || innerWidth < 760) ui.touch.classList.remove('hidden');
  for (let i=0;i<3;i++) spawnEnemy('normal');
  renderLoadout();
  updateHUD();
}

function stat(key) { return state.passives[key] || 0; }
function weaponCount(key) { return state.weaponStacks[key] || 0; }
function damageMult() { return 1 + stat('power')*.12; }
function hasteMult() {
  const chronoBonus = weaponCount('chrono')>=6 ? .12 : 0;
  return Math.max(.30, 1 - stat('haste')*.08 - chronoBonus);
}
function enemyHpMult() { return (1 + state.time/165) * (1 + stat('greed')*.08); }
function xpMult() { return 1 + stat('greed')*.18; }
function damageReduction() { return clamp(stat('armor')*.06 + Math.max(0, weaponCount('bulwark')-1)*.035, 0, .68); }
function magnetRange() { return 74 + stat('magnet') * 28; }
function totalGrowth() {
  const weaponGrowth = Object.values(state.weaponStacks).reduce((a,b)=>a+b,0);
  const passiveGrowth = Object.values(state.passives).reduce((a,b)=>a+b,0);
  return weaponGrowth + passiveGrowth;
}
