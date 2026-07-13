const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d', { alpha: false });

const $ = (s) => document.querySelector(s);
const ui = {
  menu: $('#menu'), hud: $('#hud'), start: $('#startBtn'), pause: $('#pauseBtn'),
  pauseScreen: $('#pauseScreen'), resume: $('#resumeBtn'), restart: $('#restartBtn'),
  gameOver: $('#gameOverScreen'), retry: $('#retryBtn'), menuBtn: $('#menuBtn'), choice: $('#choiceScreen'),
  choiceCards: $('#choiceCards'), choiceTitle: $('#choiceTitle'), choiceKicker: $('#choiceKicker'),
  resonance: $('#resonanceBanner'), resonanceTitle: $('#resonanceTitle'), resonanceDesc: $('#resonanceDesc'),
  hpBar: $('#hpBar'), hpText: $('#hpText'), xpBar: $('#xpBar'), level: $('#levelText'),
  timer: $('#timerText'), threat: $('#threatText'), comboBox: $('#comboBox'), comboText: $('#comboText'), comboBar: $('#comboBar'),
  slots: $('#weaponSlots'), passives: $('#passiveList'), touch: $('#touchControls'), joystick: $('#joystick'), stick: $('#stick'),
  starterOptions: $('#starterOptions'), starterName: $('#starterName'), starterDesc: $('#starterDesc'),
  resultTime: $('#resultTime'), resultKills: $('#resultKills'), resultCombo: $('#resultCombo'), resultLevel: $('#resultLevel'),
};

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const choose = (arr) => arr[(Math.random() * arr.length) | 0];
const distSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const lerp = (a, b, t) => a + (b - a) * t;

let vw = 1280, vh = 720, dpr = 1;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  vw = window.innerWidth; vh = window.innerHeight;
  canvas.width = Math.floor(vw * dpr); canvas.height = Math.floor(vh * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize); resize();

const COLORS = {
  cyan: '#50e7ff', violet: '#8b63ff', pink: '#ff4f9a', amber: '#ffcc5c',
  green: '#74f2a7', red: '#ff5b6e', white: '#f5f7ff', bg: '#080b16'
};

const WEAPONS = {
  blade: {
    name: '펄스 블레이드', icon: '◇', color: '#50e7ff', role: '공격 / 근접',
    desc: '주변을 회전하며 적을 절단한다.',
    resonance: {
      2: ['쌍성 궤도', '블레이드가 반대편에 하나 더 생성된다.'],
      4: ['절단 파동', '적중할 때 짧은 충격파가 뻗어나간다.'],
      6: ['천체 분쇄기', '궤도가 넓어지고 연속 적중 시 대폭발이 발생한다.']
    }
  },
  ember: {
    name: '엠버 캐스터', icon: '✦', color: '#ff5b6e', role: '공격 / 원거리',
    desc: '가장 가까운 적에게 열탄을 발사한다.',
    resonance: {
      2: ['연발 점화', '한 번에 두 발을 부채꼴로 발사한다.'],
      4: ['화염 분열', '열탄이 적중하면 작은 불씨로 갈라진다.'],
      6: ['초신성 탄두', '일정 발사마다 거대한 관통 탄환을 발사한다.']
    }
  },
  bulwark: {
    name: '불워크 드론', icon: '⬡', color: '#74f2a7', role: '방어 / 반격',
    desc: '충돌 피해를 줄이고 공명이 쌓이면 보호막을 만든다.',
    resonance: {
      2: ['연결 장갑', '최대 체력과 피해 감소가 증가한다.'],
      4: ['보복 방벽', '피격 시 주변 적에게 충격파를 방출한다.'],
      6: ['이동 요새', '주기적으로 완전 방어막을 충전하고 접촉한 적을 밀어낸다.']
    }
  },
  gravity: {
    name: '중력 우물', icon: '◉', color: '#8b63ff', role: '제어 / 집속',
    desc: '주기적으로 적을 한곳에 끌어당긴다.',
    resonance: {
      2: ['조석 고정', '흡입 범위와 힘이 증가한다.'],
      4: ['붕괴핵', '중심부에 갇힌 적이 지속 피해를 받는다.'],
      6: ['쌍둥이 특이점', '서로 교차하는 두 개의 우물을 생성한다.']
    }
  },
  magnet: {
    name: '자석 코어', icon: '⊕', color: '#ffcc5c', role: '성장 / 수집',
    desc: '경험 결정의 흡수 범위를 늘린다.',
    resonance: {
      2: ['과충전 흡수', '경험치 획득량이 증가한다.'],
      4: ['회수 충격', '결정을 흡수할 때 주변 적에게 미세 충격을 준다.'],
      6: ['전장 회수', '주기적으로 화면 전체 결정을 끌어오며 보호막을 얻는다.']
    }
  },
  echo: {
    name: '에코 비콘', icon: '⌁', color: '#ff4f9a', role: '지원 / 복제',
    desc: '다른 장비와 기본 코어 탄환을 확률적으로 복제한다.',
    resonance: {
      2: ['잔향', '복제 확률이 크게 상승한다.'],
      4: ['반향 연쇄', '복제된 효과가 약한 추가 효과를 남긴다.'],
      6: ['무한 회랑', '일정 주기마다 다음 장비 발동을 확정으로 세 번 복제한다.']
    }
  }
};

const PASSIVES = {
  power: { name: '출력 증폭', icon: '▲', color: '#ff5b6e', desc: '모든 피해 +12%', max: 12 },
  haste: { name: '가속 회로', icon: '»', color: '#50e7ff', desc: '공격 주기 8% 단축', max: 10 },
  vitality: { name: '재생 장갑', icon: '+', color: '#74f2a7', desc: '최대 체력 +15, 즉시 회복', max: 10 },
  speed: { name: '벡터 부스터', icon: '➤', color: '#8b63ff', desc: '이동 속도 +7%', max: 8 },
  crit: { name: '취약점 해석', icon: '✧', color: '#ffcc5c', desc: '치명타 확률 +5%', max: 10 },
  chain: { name: '연쇄 과부하', icon: '⌁', color: '#ff4f9a', desc: '처치 체인 유지시간 +15%', max: 8 },
  greed: { name: '위험 계약', icon: '◆', color: '#ff9f43', desc: '적 체력 +8%, 경험치 +18%', max: 7 },
  armor: { name: '충격 흡수재', icon: '▣', color: '#9fb7d9', desc: '받는 피해 -6%', max: 8 },
};

class AudioKit {
  constructor() { this.ctx = null; this.enabled = true; }
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
  tone(freq, duration=.06, type='sine', volume=.025, slide=0) {
    if (!this.enabled) return; this.init();
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + duration);
    g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(.0001, t + duration);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + duration);
  }
  hit(strong=false) { this.tone(strong ? 115 : 180, strong ? .11 : .045, 'square', strong ? .045 : .018, -70); }
  pickup() { this.tone(620, .045, 'sine', .018, 180); }
  level() { [420, 620, 880].forEach((f,i)=>setTimeout(()=>this.tone(f,.14,'triangle',.03,120), i*70)); }
  resonance() { [180, 260, 390, 580].forEach((f,i)=>setTimeout(()=>this.tone(f,.22,'sawtooth',.025,200), i*55)); }
  hurt() { this.tone(90,.18,'sawtooth',.045,-45); }
}
const audio = new AudioKit();

const state = {
  mode: 'menu', selectedStarter: 'blade', time: 0, kills: 0, level: 1, xp: 0, xpNeed: 18,
  threat: 1, combo: 0, maxCombo: 0, comboTimer: 0,
  camera: { x:0, y:0, shake:0 }, hitStop: 0, flash: 0,
  spawnTimer: 0, eliteTimer: 45, weaponSlots: [], weaponStacks: {}, passives: {},
  entities: { enemies: [], projectiles: [], particles: [], gems: [], wells: [], texts: [], shockwaves: [] },
  input: { x:0, y:0, keys:new Set(), touchX:0, touchY:0 },
  nextId: 1, echoCharge: 0, globalPulse: 0
};

const player = {
  x: 0, y: 0, r: 17, hp: 100, maxHp: 100, shield: 0, invuln: 0, speed: 230,
  angle: 0, coreCd: 0, bladeTick: 0, emberCd: 0, wellCd: 0, fortressCd: 0, hitPulse: 0
};

function resetGame() {
  const starter = WEAPONS[state.selectedStarter] ? state.selectedStarter : 'blade';
  state.mode = 'playing'; state.time = 0; state.kills = 0; state.level = 1; state.xp = 0; state.xpNeed = 18;
  state.threat = 1; state.combo = 0; state.maxCombo = 0; state.comboTimer = 0; state.camera.shake = 0;
  state.hitStop = 0; state.flash = 0; state.spawnTimer = .8; state.eliteTimer = 45; state.globalPulse = 0;
  state.weaponSlots = [starter]; state.weaponStacks = { [starter]: 1 }; state.passives = {};
  Object.values(state.entities).forEach(a => a.length = 0);
  player.x = player.y = 0; player.maxHp = starter === 'bulwark' ? 108 : 100; player.hp = player.maxHp; player.shield = 0; player.invuln = 0;
  player.angle = 0; player.coreCd = .25; player.bladeTick = 0; player.emberCd = 0; player.wellCd = 0; player.fortressCd = 0; player.hitPulse = 0;
  ui.menu.classList.remove('active'); ui.menu.classList.add('hidden'); ui.hud.classList.remove('hidden');
  ui.choice.classList.add('hidden'); ui.pauseScreen.classList.add('hidden'); ui.gameOver.classList.add('hidden'); ui.resonance.classList.add('hidden');
  if (matchMedia('(pointer: coarse)').matches || innerWidth < 760) ui.touch.classList.remove('hidden');
  for (let i=0;i<3;i++) spawnEnemy(false);
  renderLoadout(); updateHUD();
}

function stat(key) { return state.passives[key] || 0; }
function weaponCount(key) { return state.weaponStacks[key] || 0; }
function damageMult() { return 1 + stat('power')*.12; }
function hasteMult() { return Math.max(.35, 1 - stat('haste')*.08); }
function enemyHpMult() { return (1 + state.time/155) * (1 + stat('greed')*.08); }
function xpMult() { return 1 + stat('greed')*.18 + (weaponCount('magnet') >= 2 ? .22 : 0); }
function damageReduction() { return clamp(stat('armor')*.06 + Math.max(0, weaponCount('bulwark')-1)*.035, 0, .68); }
