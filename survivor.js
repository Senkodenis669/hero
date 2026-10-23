/* Дневник героя — арена в реальном времени (window.HD_GAME). Plain JS, no deps. */
(function(){
"use strict";
var CLS={war:{n:"Воин",col:"#c23b4e",dark:"#7e1f30"},mag:{n:"Маг",col:"#4a5bd6",dark:"#2a3389"},ran:{n:"Странник",col:"#2f8f5b",dark:"#1b5a37"}};
var BODY=["......hhhh......",".....hhhhhh.....",".....hssssh.....",".....sesses.....",".....ssssss.....","......soos......",".......ss.......","....cccccccc....","...sccccccccs...","...sccccccccs...","...scbbbbbbcs...","....cccccccc....",".....pppppp.....",".....pp..pp.....",".....pp..pp.....",".....ff..ff.....","....fff..fff...."];

/* ---------- PRNG ---------- */
function hashStr(str){var h=1779033703^str.length;for(var i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return (h^h>>>16)>>>0}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function rngFor(s){return mulberry(hashStr(String(s)))}

/* ---------- sprites ---------- */
function mkSprite(rows,pal){
  var w=0;rows.forEach(function(r){if(r.length>w)w=r.length});
  var c=document.createElement("canvas");c.width=w;c.height=rows.length;var x=c.getContext("2d");
  rows.forEach(function(r,y){for(var i=0;i<r.length;i++){var ch=r[i];if(ch!=="."&&pal[ch]){x.fillStyle=pal[ch];x.fillRect(i,y,1,1)}}});
  return c;
}
function heroSprite(cls,level,hp){
  var cv=document.createElement("canvas");cv.width=16;cv.height=17;var ctx=cv.getContext("2d");
  var C=CLS[cls]||CLS.war;var tired=hp<30;
  var pal={h:"#5b3a29",s:tired?"#e3c7b8":"#f1c59a",e:"#1b1b2f",o:tired?"#6e3434":"#b5534a",c:C.col,b:"#6b4a2b",p:"#2c3150",f:"#3a2a20",m:"#a8b0c2",g:"#f2b84b",w:"#dfe5f2",t:"#8a5a2b",q:"#8fd3ff",k:C.dark,r:"#e05a6a",l:"#d9d9d9"};
  var px=function(x,y,c){if(x<0||x>15||y<0||y>16)return;ctx.fillStyle=pal[c]||c;ctx.fillRect(x,y,1,1)};
  if(level>=5){for(var y=8;y<=15;y++){px(2,y,"k");px(13,y,"k")}for(y=11;y<=15;y++){px(3,y,"k");px(12,y,"k")}px(4,15,"k");px(11,15,"k")}
  var rows=BODY.slice();
  if(tired){rows[3]=".....sesses.....".replace(/e/g,"o")}
  rows.forEach(function(r,y){for(var x=0;x<16;x++){var ch=r[x];if(ch!==".")px(x,y,ch)}});
  if(tired){px(6,3,"e");px(9,3,"e")}
  var x;
  if(level>=3&&level<10){for(x=5;x<=10;x++)px(x,0,"m");for(x=4;x<=11;x++)px(x,1,"m");px(4,2,"m");px(11,2,"m")}
  if(level>=10){for(x=5;x<=10;x++)px(x,1,"g");[5,7,8,10].forEach(function(x){px(x,0,"g")});px(7,1,"r");px(8,1,"r")}
  if(cls==="war"){for(y=2;y<=9;y++)px(14,y,"w");px(13,10,"g");px(14,10,"g");px(15,10,"g");px(14,11,"t");px(14,12,"t")}
  else if(cls==="mag"){for(y=3;y<=16;y++)px(14,y,"t");px(13,1,"q");px(14,1,"q");px(15,1,"q");px(14,0,"q");px(14,2,"q");if(level>=5){px(13,0,"w");px(15,2,"w")}}
  else{for(y=6;y<=12;y++){px(1,y,"t");px(2,y,"l")}px(2,5,"t");px(2,13,"t");px(3,4,"t");px(3,14,"t")}
  return cv;
}

/* ---------- bestiary ---------- */
var MOBS={
  slime:{n:"Слизь Прокрастинации",hp:14,atk:4,def:0,spd:1,beh:"split",min:1,w:6,gold:2,
    s:["............","............","............",".....gg.....","....gggg....","...gwgggg...","..gggggggg..","..ggeggegg..",".gggggggggg.",".gggdddgggg.","gggggggggggg",".gggggggggg."],
    p:{g:"#59c27a",w:"#d8ffe4",e:"#10101e",d:"#2b6b40"}},
  slimelet:{n:"Слизнячок Отложенных Дел",hp:6,atk:2,def:0,spd:1,beh:"melee",min:99,w:0,gold:1,
    s:["............","............","............","............","............",".....gg.....","....gwgg....","...geggeg...","...gggggg...","..ggddgggg..","..gggggggg..","............"],
    p:{g:"#8ad9a0",w:"#ffffff",e:"#10101e",d:"#2b6b40"}},
  skel:{n:"Скелет Недосыпа",hp:18,atk:5,def:1,spd:1,beh:"melee",min:1,w:6,gold:3,
    s:[".........zz.","....wwww..z.","...wwwwww...","...wbbwbbw..","...wwwwww...","....wkwk....",".....ww.....","...wwwwww...","..w.wwww.w..","....w..w....","....w..w....","...ww..ww..."],
    p:{w:"#e6e2d3",b:"#3a2d5c",k:"#2a2238",z:"#8fd3ff"}},
  gob:{n:"Гоблин-думскроллер",hp:11,atk:4,def:0,spd:2,beh:"fast",min:2,w:5,gold:3,
    s:["............","..gg....gg..","...gggggg...","...geggeg...","...gggggg...","....gmmg....","...cccccc...","..gccccccg..","..g.cccc.pp.","....cccc.pp.","....c..c....","...cc..cc..."],
    p:{g:"#7fb83a",e:"#ffef7a",m:"#3b1a1a",c:"#5a3b7a",p:"#8fd3ff"}},
  sugar:{n:"Сахарный демон",hp:13,atk:5,def:0,spd:1,beh:"ranged",range:4,min:2,w:5,gold:3,
    s:["..r......r..","..rr....rr..","...pppppp...","..pppppppp..","..peppppep..","..pppppppp..","..ppmmmmpp..","...pppppp...","..wpypwpyp..","...pppppp...","....p..p....","...rr..rr..."],
    p:{p:"#ff8fc8",r:"#c2185b",e:"#2a0a1e",m:"#7a1440",w:"#ffffff",y:"#ffe066"}},
  shadow:{n:"Тень Понедельника",hp:40,atk:7,def:3,spd:.5,beh:"tank",min:3,w:3,gold:6,
    s:["....kkkk....","..kkkkkkkk..",".kkkkkkkkkk.",".kkyykkyykk.",".kkkkkkkkkk.","kkkkmmmmkkkk","kkkkkkkkkkkk","kkkkkkkkkkkk","kjkkkkkkkkjk","kkkkkkkkkkkk","kk.kkk.kkk.k","k...k...k..."],
    p:{k:"#3b2a6e",y:"#ffd84a",m:"#170f33",j:"#5a46a0"}},
  coffee:{n:"Кофейный бес",hp:12,atk:6,def:1,spd:2,beh:"fast",min:4,w:4,gold:4,
    s:["....s.s.....",".....s.s....","..wwwwwww...","..wbbbbbw...","..wwwwwwwww.","..wewwewww.w","..wwwwwwwww.","..wwmmmww...","...wwwww....","...r...r....","..r.....r...",".rr.....rr.."],
    p:{w:"#e8e0d0",b:"#6b3f1f",e:"#1a1020",m:"#a33",s:"#b0a8d8",r:"#c24a3b"}},
  ghost:{n:"Призрак Непрочитанных",hp:12,atk:6,def:0,spd:1,beh:"ranged",range:5,min:4,w:4,gold:4,
    s:[".........rr.","...wwwww.rr.","..wwwwwwww..",".wwewwweww..",".wwwwwwwww..",".wwwwmwwww..",".wwwwwwwww..",".wwwwwwwww..",".wwwwwwwww..",".ww.www.ww..",".w...w...w..","............"],
    p:{w:"#cfd8ff",e:"#22264a",m:"#5a5f99",r:"#ff3d5a"}},
  golem:{n:"Голем Немытой Посуды",hp:55,atk:8,def:4,spd:.5,beh:"tank",min:6,w:3,gold:8,
    s:["............","...gggggg...","..gwwwwwwg..","..gewwwweg..","..gggggggg..",".bgwwwwwwgb.",".bggyggyggb.",".bgwwwwwwgb.","..gggggggg..","..gg....gg..","..gg....gg..",".ggg....ggg."],
    p:{g:"#8c93a8",w:"#e4e8f0",e:"#c23b4e",b:"#5d6478",y:"#c9b25a"}},
  mimic:{n:"Мимик Импульсных Покупок",hp:30,atk:7,def:2,spd:1,beh:"melee",min:99,w:0,gold:20,
    s:["............",".bbbbbbbbbb.","bttttttttttb","bwbwbwbwbwbb","brrrrrrrrrrb","bwbwbwbwbwbb","bttttyyttttb","bttttttttttb","bbbbbbbbbbbb",".b........b.","............","............"],
    p:{b:"#4a2a12",t:"#9a5f28",w:"#ffffff",r:"#b0203a",y:"#f2b84b"}},
  pal:{n:"Фамильяр Дисциплины",hp:1,atk:1,def:0,spd:1,beh:"ally",min:99,w:0,gold:0,
    s:["............",".....yy.....","....yyyy....",".yyyyyyyyyy.","..yyeyyeyy..","...yyyyyy...","...yyooyy...","..yyy..yyy..","..yy....yy..","............","............","............"],
    p:{y:"#ffd84a",e:"#3a2a00",o:"#ff9f43"}}
};
var BOSSES=[
  {k:"deadline",n:"Босс: Дедлайн",hp:110,atk:8,def:2,spd:.6,beh:"melee",gold:40,boss:true,gim:"ускоряется с каждым ходом",
    s:["......rrrr......","....rrwwwwrr....","...rwwwwkwwwr...","..rwwwwwkwwwwr..","..rweewwkwweewr.","..rwkkwwkwwkkwr.","..rwwwwwkkkkwwr.","..rwwwwwwwwwwwr.","..rwwkmmmmmkwwr.","...rwwwwwwwwwr..","....rrwwwwrr....","......rrrr......",".....r....r.....","....rr....rr....","...rrr....rrr...","................"],
    p:{r:"#d8324a",w:"#fff1d6",k:"#1b1b2f",e:"#ff2a2a",m:"#5a0a18"}},
  {k:"feed",n:"Босс: Бесконечная Лента",hp:120,atk:7,def:2,spd:1,beh:"melee",gold:45,boss:true,gim:"призывает думскроллеров",
    s:["....kkkkkkkk....","...kbbbbbbbbk...","...kbwwwwwwbk...","...kbbbbbbbbk...","...kbeebbeebk...","...kbbbbbbbbk...","...kbwwwwwwbk...","...kbmmmmmmbk...","...kbbbbbbbbk...","...kbwwwwwbbk...","...kbbbbbbbbk...","...kbbbyybbbk...","...kkkkkkkkkk...","..kk..kkkk..kk..",".kk..........kk.","................"],
    p:{k:"#1b1b2f",b:"#3d6bd8",w:"#cfe0ff",e:"#ffef7a",m:"#ff4d6d",y:"#f2b84b"}},
  {k:"critic",n:"Босс: Внутренний Критик",hp:100,atk:7,def:1,spd:1,beh:"ranged",range:5,gold:45,boss:true,gim:"лечится, если его не бить",
    s:[".....pppppp.....","...pppppppppp...","..pppppppppppp..","..pkkkkppkkkkp..","..pkykkppkykkp..","..pkkkkppkkkkp..","..pppppppppppp..","..ppppmmmmpppp..","...pppppppppp...","....pppppppp....",".....pp..pp.....","..ww.pp..pp.....",".www..pppp......","..w.............","................","................"],
    p:{p:"#9b59d0",k:"#1b1b2f",y:"#ffffff",m:"#3a0f4a",w:"#f1c59a"}}
];
var KIND_RU={damageAll:"удар по всем",damageOne:"мощный удар",heal:"лечение",stunAll:"оглушение",shield:"щит",execute:"казнь",teleport:"телепорт",summon:"призыв",charm:"очарование",random:"случайность"};

/* ---------- arena tuning ---------- */
var RUN=600;                 // seconds to survive
var BOSS_AT=[180,360,540];   // one boss from BOSSES each
var MAX_MOBS=260;

/* weapons: lv 1..5; s(lv) gives the numbers for that level */
var WEAP={
  sword:{n:"Меч воли",g:"МЧ",c:"#ff8a8a",d:"Рубит всех перед героем широким замахом.",
    s:function(l){return{cd:1.15-.07*(l-1),dmg:1.3+.3*(l-1),r:30+3*l,arc:2.3+.15*l,both:l>=4}}},
  bolt:{n:"Искра знаний",g:"ИС",c:"#8fb4ff",d:"Самонаводящиеся снаряды в ближайших врагов.",
    s:function(l){return{cd:1.05-.06*(l-1),dmg:1.15+.25*(l-1),n:1+Math.floor(l/2)}}},
  arrow:{n:"Стрелы упорства",g:"СТ",c:"#9be08a",d:"Быстрые стрелы, пробивают врагов насквозь.",
    s:function(l){return{cd:.85-.05*(l-1),dmg:1+.2*(l-1),n:1+(l>=3?1:0)+(l>=5?1:0),pierce:1+l}}},
  orbit:{n:"Книги дисциплины",g:"КН",c:"#f2b84b",d:"Книги кружат вокруг героя и бьют всех, кого задели.",
    s:function(l){return{n:Math.min(5,l+1),dmg:.6+.15*(l-1),r:30+2*l,spd:2.6+.2*l}}},
  aura:{n:"Аура спокойствия",g:"АУ",c:"#7dffd0",d:"Постоянно ранит и замедляет врагов рядом.",
    s:function(l){return{r:24+5*l,dmg:.3+.08*(l-1)}}},
  zap:{n:"Молния дедлайна",g:"МЛ",c:"#fff27a",d:"Бьёт молнией по случайным врагам на экране.",
    s:function(l){return{cd:2.3-.15*(l-1),dmg:1.5+.3*(l-1),n:Math.min(6,l+1)}}}
};
var START_W={war:"sword",mag:"bolt",ran:"arrow"};
var PERKS={
  might:{n:"Сила воли",g:"СИ",c:"#ff6b6b",d:"+12% к урону."},
  haste:{n:"Быстрые руки",g:"СК",c:"#ffd84a",d:"Оружие перезаряжается на 8% быстрее."},
  boots:{n:"Лёгкий шаг",g:"НО",c:"#9be08a",d:"+10% к скорости бега."},
  heart:{n:"Крепкое сердце",g:"СР",c:"#ff8fc8",d:"+15% к здоровью и лечение."},
  magnet:{n:"Притяжение",g:"МГ",c:"#8fd3ff",d:"Опыт и монеты притягиваются издалека."},
  armor:{n:"Броня привычки",g:"БР",c:"#a8b0c2",d:"Входящий урон меньше."},
  regen:{n:"Второе дыхание",g:"РГ",c:"#7dffa6",d:"Здоровье медленно восстанавливается."},
  luck:{n:"Удача",g:"УД",c:"#c9a0ff",d:"+5% к шансу крита и больше монет."}
};
var MAXW=4,MAXLV=5;

/* ---------- CSS ---------- */
var CSS=[
".sv-root{position:fixed;inset:0;z-index:1000;background:#0d0b1f;color:#e8e3ff;font:14px/1.3 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;overscroll-behavior:none;overflow:hidden}",
".sv-root *{box-sizing:border-box}.sv-root [hidden]{display:none!important}",
".sv-cv{position:absolute;inset:0;width:100%;height:100%;display:block}",
".sv-hud{position:absolute;left:0;right:0;top:0;padding:calc(env(safe-area-inset-top,0px) + 6px) 10px 0;display:grid;gap:6px;pointer-events:none}",
".sv-xp{height:8px;border-radius:5px;background:#1b1840;box-shadow:inset 0 0 0 1px #3a3480;overflow:hidden}.sv-xp i{display:block;height:100%;width:0;background:linear-gradient(90deg,#5a8bff,#8fd3ff);transition:width .15s}",
".sv-row{display:flex;align-items:center;justify-content:space-between;gap:8px}",
".sv-hp{flex:1;max-width:170px;height:14px;border-radius:7px;background:#2a0f1c;box-shadow:inset 0 0 0 1px #5a1f34;position:relative;overflow:hidden}",
".sv-hp i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#e0455e,#ff7a8a);transition:width .12s}.sv-hp b{position:absolute;left:0;top:0;bottom:0;background:rgba(143,211,255,.75)}",
".sv-hp span{position:absolute;inset:0;text-align:center;font-size:10px;line-height:14px;font-weight:700;color:#fff;text-shadow:0 1px 2px #000}",
".sv-time{font:700 20px/1 'Press Start 2P','Courier New',monospace;color:#fff;text-shadow:0 2px 0 #000;letter-spacing:.04em}",
".sv-chips{display:flex;gap:6px;font-size:12px;font-weight:700}.sv-chips span{background:rgba(13,11,31,.7);border:1px solid #3a3480;border-radius:8px;padding:3px 7px;white-space:nowrap}",
".sv-lv{font-size:11px;color:#8fd3ff;font-weight:700}",
".sv-boss{display:grid;gap:3px;justify-items:center}.sv-boss span{font-size:12px;font-weight:700;color:#ffb3c0;text-shadow:0 1px 2px #000}",
".sv-boss div{width:min(320px,90%);height:9px;border-radius:5px;background:#2a0f1c;box-shadow:inset 0 0 0 1px #8a2a44;overflow:hidden}.sv-boss i{display:block;height:100%;background:linear-gradient(90deg,#b0203a,#ff5f73)}",
".sv-btn{pointer-events:auto;font:inherit;color:#fff;background:rgba(29,25,70,.85);border:1px solid #4a43a0;border-radius:12px;cursor:pointer;touch-action:manipulation}",
".sv-btn:active{transform:scale(.95)}.sv-btn:disabled{opacity:.45}",
".sv-pause{width:36px;height:36px;font-weight:900;font-size:14px}",
".sv-skills{position:absolute;right:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);display:grid;grid-template-columns:repeat(2,58px);gap:8px;pointer-events:none}",
".sv-sk{position:relative;width:58px;height:58px;border-radius:16px;display:grid;place-items:center;overflow:hidden;padding:0}",
".sv-sk b{font:700 13px/1 'Press Start 2P','Courier New',monospace;position:relative;z-index:1}.sv-sk small{position:absolute;bottom:3px;left:0;right:0;font-size:8px;opacity:.8;z-index:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 3px}",
".sv-sk em{position:absolute;inset:0;background:conic-gradient(rgba(0,0,0,.65) var(--p,0%),transparent 0);font-style:normal}",
".sv-sk.ready{box-shadow:0 0 0 2px #8fd3ff,0 0 14px rgba(143,211,255,.5)}",
".sv-ov{position:absolute;inset:0;background:rgba(7,6,22,.82);display:grid;place-items:center;padding:20px;z-index:3;pointer-events:auto}",
".sv-card{width:min(380px,100%);display:grid;gap:10px;text-align:center}",
".sv-card h2{margin:0;font:400 14px/1.6 'Press Start 2P','Courier New',monospace;color:#8fd3ff;letter-spacing:.04em}",
".sv-card p{margin:0;color:#aab1dc;font-size:13px}",
".sv-opt{display:grid;grid-template-columns:44px 1fr;gap:10px;align-items:center;text-align:left;padding:10px 12px;border-radius:14px;width:100%;animation:sv-pop .25s ease-out both}",
".sv-opt:nth-child(3){animation-delay:.05s}.sv-opt:nth-child(4){animation-delay:.1s}.sv-opt:nth-child(5){animation-delay:.15s}",
".sv-opt i{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font:400 11px 'Press Start 2P','Courier New',monospace;color:#0b0d20;font-style:normal}",
".sv-opt b{display:block;font-size:14px}.sv-opt span{display:block;font-size:12px;color:#aab1dc}.sv-opt u{text-decoration:none;color:#f2b84b;font-size:11px;font-weight:700}",
".sv-big{padding:14px;font-weight:700;font-size:15px;width:100%}.sv-big.pri{background:#5a8bff;border-color:#5a8bff}",
".sv-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sv-grid div{background:rgba(255,255,255,.05);border-radius:10px;padding:8px}.sv-grid small{display:block;font-size:10px;color:#8f96c4;letter-spacing:.06em}.sv-grid b{font-size:20px}",
".sv-shout{position:absolute;left:0;right:0;top:34%;text-align:center;pointer-events:none;font:400 16px/1.6 'Press Start 2P','Courier New',monospace;color:#fff;text-shadow:0 3px 0 #000,0 0 18px rgba(143,211,255,.6);padding:0 16px;opacity:0}",
".sv-shout.on{animation:sv-shout 1.8s ease-out both}.sv-shout small{display:block;font:600 13px system-ui,sans-serif;color:#ffd84a;margin-top:6px}",
".sv-help{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom,0px) + 90px);text-align:center;color:#aab1dc;font-size:13px;pointer-events:none;transition:opacity .6s}",
"@keyframes sv-pop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}",
"@keyframes sv-shout{0%{opacity:0;transform:scale(1.4)}12%{opacity:1;transform:scale(1)}75%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}",
"@media (prefers-reduced-motion:reduce){.sv-opt,.sv-shout.on{animation-duration:.01s}}"
].join("\n");
var styleEl=null,mounts=0;
function injectCSS(){if(styleEl&&styleEl.isConnected)return;styleEl=document.createElement("style");styleEl.id="sv-style";styleEl.textContent=CSS;document.head.appendChild(styleEl)}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

/* ---------- art ---------- */
var ART=null;
function flashOf(c){var w=document.createElement("canvas");w.width=c.width;w.height=c.height;var x=w.getContext("2d");x.drawImage(c,0,0);x.globalCompositeOperation="source-atop";x.fillStyle="#fff";x.fillRect(0,0,w.width,w.height);return w}
function mainColor(p){var best=null;for(var k in p){if(!best)best=p[k]}return best||"#fff"}
function mkFloor(seed){var R=rngFor(seed);var c=document.createElement("canvas");c.width=c.height=32;var x=c.getContext("2d");
  x.fillStyle="#141130";x.fillRect(0,0,32,32);
  for(var by=0;by<2;by++)for(var bx=0;bx<2;bx++){var v=R(),ox=bx*16,oy=by*16;
    x.fillStyle=v<.33?"#211d45":v<.66?"#1d1a3e":"#262150";x.fillRect(ox+1,oy+1,15,15);
    x.fillStyle="rgba(255,255,255,.05)";x.fillRect(ox+1,oy+1,15,1);x.fillStyle="rgba(0,0,0,.28)";x.fillRect(ox+1,oy+15,15,1);
    for(var k=0;k<6;k++){x.fillStyle=R()<.5?"rgba(255,255,255,.04)":"rgba(0,0,0,.2)";x.fillRect(ox+2+Math.floor(R()*12),oy+2+Math.floor(R()*12),1+Math.floor(R()*2),1)}
    if(R()<.18){x.fillStyle="rgba(0,0,0,.35)";var cx=ox+3+Math.floor(R()*8),cy=oy+3+Math.floor(R()*8);for(var j=0;j<5;j++){x.fillRect(cx,cy,1,1);cx+=R()<.5?1:0;cy+=1}}
    if(R()<.12){x.fillStyle="rgba(89,194,122,.18)";x.fillRect(ox+1+Math.floor(R()*10),oy+12,4,3)}}
  return c}
function art(){if(ART)return ART;ART={floor:[0,1,2,3].map(function(i){return mkFloor("floor"+i)}),mob:{},white:{},
  props:{
    bones:mkSprite(["..w.....","...w.w..","w..ww...",".ww..w..","...w..w."],{w:"#cfc8b0"}),
    skull:mkSprite([".wwww.","wkwwkw","wwwwww",".w.w.."],{w:"#e6e2d3",k:"#1b1b2f"}),
    candle:mkSprite(["..y..",".yoy.","..o..",".www.",".www.",".www.","wwwww"],{y:"#ffe066",o:"#ff9f43",w:"#e8e0d0"}),
    rock:mkSprite(["..gggg..",".gGGggg.","gGggggdg","gggggddg",".dddddd."],{g:"#4a4670",G:"#625d92",d:"#2e2b4f"})
  },
  gem:[mkSprite(["..b..",".bBb.","bBwBb",".bBb.","..b.."],{b:"#3d6bd8",B:"#8fb4ff",w:"#fff"}),
       mkSprite(["...g...","..gGg..",".gGwGg.","gGGGGGg",".gGGGg.","..gGg..","...g..."],{g:"#2f8f5b",G:"#7dffa6",w:"#fff"}),
       mkSprite(["...r...","..rRr..",".rRwRr.","rRRRRRr",".rRRRr.","..rRr..","...r..."],{r:"#b0203a",R:"#ff5f73",w:"#fff"})],
  coin:mkSprite([".yyy.","yoyoy","yyoyy","yoyoy",".yyy."],{y:"#f2b84b",o:"#b07a1c"}),
  meat:mkSprite(["...www","..wbb.",".rrrb.","rrRrr.","rrrr..",".rr..."],{w:"#f1e6d0",b:"#c9a27a",r:"#b5534a",R:"#e07a6a"}),
  magnet:mkSprite(["r...r","r...r","r...r","w...w",".www."],{r:"#e0455e",w:"#cfd8ff"}),
  chest:mkSprite([".bbbbbbbbbb.","bttttttttttb","bttttttttttb","bbbbbyybbbbb","bttttyyttttb","bttttttttttb","bbbbbbbbbbbb"],{b:"#4a2a12",t:"#9a5f28",y:"#f2b84b"}),
  book:mkSprite([".rrrrr","rwwwwr","rwwwwr","rwwwwr","rrrrr."],{r:"#f2b84b",w:"#fff1d6"}),
  pal:mkSprite(MOBS.pal.s,MOBS.pal.p)
};
  for(var k in MOBS){ART.mob[k]=mkSprite(MOBS[k].s,MOBS[k].p);ART.white[k]=flashOf(ART.mob[k])}
  BOSSES.forEach(function(b){ART.mob[b.k]=mkSprite(b.s,b.p);ART.white[b.k]=flashOf(ART.mob[b.k])});
  return ART}

/* ======================================================================= */
function mount(el,opts){
  if(!el)throw new Error("HD_GAME.mount: нет контейнера");
  opts=opts||{};injectCSS();mounts++;var A=art();
  var RM=false;try{RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}
  var H0=opts.hero||{},st=H0.stats||{};
  var num=function(v,d){v=+v;return isFinite(v)?v:d};
  var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
  var sil=Math.max(1,num(st.sil,1)),vyn=Math.max(1,num(st.vyn,1)),int_=Math.max(1,num(st.int,1)),duh=Math.max(1,num(st.duh,1));
  var cls=CLS[H0.cls]?H0.cls:"war",level=Math.max(1,Math.floor(num(H0.level,1)));
  var heroName=String(H0.name||"Герой").slice(0,24);
  var R=rngFor(String(opts.seed||"hd-seed")+"#arena");
  var P={atkPct:0,defPct:0,hpPct:0,critPct:0,dodgePct:0,lifestealPct:0,goldPct:0,regenPerFloor:0,lowHpAtkPct:0,thornsPct:0,firstHitStun:false,reviveOnce:false,extraPotions:0,visionPlus:0};
  var passives=(H0.passives||[]).filter(function(s){return s&&s.effect});
  passives.forEach(function(s){var e=s.effect;for(var k in P){if(!(k in e))continue;if(typeof P[k]==="boolean"){if(e[k])P[k]=true}else{var v=+e[k];if(isFinite(v))P[k]+=v}}});
  P.lifestealPct=clamp(P.lifestealPct,0,1);P.thornsPct=clamp(P.thornsPct,0,3);P.regenPerFloor=clamp(P.regenPerFloor,0,1);P.goldPct=Math.max(-.9,P.goldPct);P.lowHpAtkPct=Math.max(0,P.lowHpAtkPct);

  /* hero numbers come from the diary: Сила → урон, Выносливость → HP и броня, Интеллект → крит, Дух → перезарядка */
  var baseHP=Math.max(10,Math.round((60+vyn*14+level*6)*Math.max(.1,1+P.hpPct)));
  var baseAtk=Math.max(1,(6+sil*3+level)*(cls==="war"?1.2:1)*Math.max(.1,1+P.atkPct));
  var baseDef=Math.max(0,(1+vyn)*Math.max(0,1+P.defPct));
  var baseCrit=clamp(.05+int_*.02+P.critPct,0,.75);
  var dodge=clamp(.03+(cls==="ran"?.08:0)+P.dodgePct,0,.6);
  var cdMul=Math.max(.45,1-duh*.04),magMul=cls==="mag"?1.3:1;
  var hpPct0=H0.hpPct==null?100:clamp(num(H0.hpPct,100),0,100);

  var up={might:0,haste:0,boots:0,heart:0,magnet:0,armor:0,regen:0,luck:0};
  var weapons=[{id:START_W[cls],lv:1,t:.4,a:0}];
  var maxHP=baseHP,hp=Math.round(maxHP*Math.max(50,hpPct0)/100),shield=0,potions=1+Math.max(0,Math.floor(P.extraPotions)),revived=false;
  var acts=(H0.actives||[]).filter(function(s){return s&&s.effect&&s.type!=="passive"}).slice(0,3).map(function(s){
    return {s:s,cd:0,max:Math.max(3,num(s.effect.cooldown,5)*2.2*cdMul)}});

  /* state */
  var hero={x:0,y:0,vx:0,vy:0,face:1,inv:0,anim:0,moving:false,dead:0};
  var mobs=[],shots=[],drops=[],parts=[],floats=[],fxs=[],allies=[];
  var T=0,wave=1,kills=0,bossKills=0,gold=0,xp=0,lvl=1,need=7,pendingLv=0,spawnAcc=0,bossIdx=0,boss=null;
  var paused=false,menu=null,over=false,ended=false,destroyed=false,shakeT=0,shakeA=0,raf=0,last=0,regenAcc=0,auraT=0,helpT=6;
  var W=0,Hh=0,dpr=1,Z=2,camX=0,camY=0,vign=null;
  var keys={},stick=null;

  /* ---------- DOM ---------- */
  var C=CLS[cls];
  var root=document.createElement("div");root.className="sv-root";
  var skHTML="";acts.forEach(function(a,i){skHTML+='<button class="sv-btn sv-sk" data-a="sk" data-i="'+i+'" aria-label="'+esc(a.s.name)+'"><em></em><b>'+esc(String(a.s.glyph||a.s.name||"?").slice(0,2))+'</b><small>'+esc(a.s.name)+'</small></button>'});
  skHTML+='<button class="sv-btn sv-sk sv-pot" data-a="pot" aria-label="Выпить зелье"><em></em><b style="color:#ff7a8a">+HP</b><small>Зелье ×<span class="sv-pn">0</span></small></button>';
  root.innerHTML='<canvas class="sv-cv" aria-label="Арена"></canvas>'+
    '<div class="sv-hud"><div class="sv-xp" aria-label="Опыт"><i></i></div>'+
      '<div class="sv-row"><div class="sv-hp" aria-label="Здоровье"><i></i><b></b><span></span></div><div class="sv-time">00:00</div>'+
      '<div class="sv-row" style="gap:6px"><div class="sv-chips"><span>💀 <b class="sv-kl">0</b></span><span>🪙 <b class="sv-gd">0</b></span></div><button class="sv-btn sv-pause" data-a="pause" aria-label="Пауза">II</button></div></div>'+
      '<div class="sv-row"><span class="sv-lv">'+esc(heroName)+' · '+C.n+' · ур. <b class="sv-lvn">1</b></span><span class="sv-lv">волна <b class="sv-wv">1</b> из 10</span></div>'+
      '<div class="sv-boss" hidden><span class="sv-bn"></span><div><i></i></div></div></div>'+
    '<div class="sv-shout"></div><div class="sv-help">Веди пальцем по экрану, чтобы бегать. Оружие бьёт само.</div>'+
    '<div class="sv-skills">'+skHTML+'</div><div class="sv-ov" hidden></div>';
  el.appendChild(root);
  var $=function(s){return root.querySelector(s)};
  var cv=$(".sv-cv"),ctx=cv.getContext("2d"),ov=$(".sv-ov"),shoutEl=$(".sv-shout"),helpEl=$(".sv-help");
  var ui={xp:$(".sv-xp i"),hp:$(".sv-hp i"),sh:$(".sv-hp b"),hpt:$(".sv-hp span"),time:$(".sv-time"),kl:$(".sv-kl"),gd:$(".sv-gd"),lv:$(".sv-lvn"),wv:$(".sv-wv"),boss:$(".sv-boss"),bn:$(".sv-bn"),bb:$(".sv-boss i"),pn:$(".sv-pn"),pot:$(".sv-pot")};
  var skBtns=root.querySelectorAll('[data-a="sk"]');
  var prevOverflow=document.body.style.overflow;document.body.style.overflow="hidden";

  /* ---------- helpers ---------- */
  function rnd(a,b){return a+R()*(b-a)}
  function dist2(a,b){var dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy}
  function viewR(){return Math.hypot(W/Z,Hh/Z)/2}
  function onScreen(m,pad){pad=pad||0;return Math.abs(m.x-camX)<W/Z/2+pad&&Math.abs(m.y-camY)<Hh/Z/2+pad}
  function crit(){return clamp(baseCrit+up.luck*.05,0,.9)}
  function dmgMul(){return (1+up.might*.12)*(hp/maxHP<.35?1+P.lowHpAtkPct:1)}
  function cdF(){return Math.max(.35,1-up.haste*.08)}
  function magnetR(){return 26*(1+up.magnet*.35+P.visionPlus*.25)}
  function speed(){return (58+(cls==="ran"?6:0))*(1+up.boots*.1)}
  function armor(){return baseDef+up.armor*2.5}
  function regenRate(){return up.regen*.25+(maxHP*.002*up.regen)}
  function shout(t,sub){shoutEl.innerHTML=esc(t)+(sub?"<small>"+esc(sub)+"</small>":"");shoutEl.classList.remove("on");void shoutEl.offsetWidth;shoutEl.classList.add("on")}
  function floatAt(x,y,t,c,big){floats.push({x:x,y:y,t:String(t),c:c||"#fff",big:!!big,life:big?1.1:.75,max:big?1.1:.75})}
  function burst(x,y,c,n,spd){if(RM)n=Math.ceil(n/3);for(var i=0;i<n;i++){var a=R()*6.283,s=(spd||40)*(.4+R()*.8);parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+R()*.35,max:.7,c:c,s:R()<.3?2:1})}}
  function shake(a){if(RM)return;shakeT=.25;shakeA=Math.max(shakeA,a||3)}
  function nearest(from,maxD,filter){var best=null,bd=maxD*maxD;for(var i=0;i<mobs.length;i++){var m=mobs[i];if(m.hp<=0||m.ally||(filter&&!filter(m)))continue;var d=dist2(from,m);if(d<bd){bd=d;best=m}}return best}
  function visible(){return mobs.filter(function(m){return m.hp>0&&!m.ally&&onScreen(m,8)})}

  /* ---------- mobs ---------- */
  function hpMul(){var tm=T/60;return 1+tm*.35+tm*tm*.035}
  function mkMob(key,def,x,y){var spr=A.mob[key];var m=Mobj(key,def,spr,x,y);mobs.push(m);return m}
  function Mobj(key,def,spr,x,y){var hm=def.boss?hpMul()*4:hpMul();var hpv=Math.round(def.hp*hm);
    return {key:key,def:def,n:def.n,x:x,y:y,w:spr.width,h:spr.height,r:def.boss?9:Math.max(4,spr.width*.38),hp:hpv,max:hpv,atk:def.atk*(1+T/60*.12),
      spd:(22+(def.spd||1)*16)*(def.boss?1:rnd(.9,1.1)),beh:def.beh,range:(def.range||4)*16,boss:!!def.boss,gold:def.gold||1,xpv:def.boss?20:Math.max(1,Math.round(def.hp/14))*(1+Math.floor(T/150)),
      flash:0,kx:0,ky:0,stun:0,slow:0,shootT:rnd(1,2.5),hitBy:{},phase:R()*6.28,face:1,stunned1:false,lastHit:T,ally:false,life:0,age:0,col:mainColor(def.p)}}
  function spawnPos(){var a=R()*6.283,r=viewR()+14;return{x:hero.x+Math.cos(a)*r,y:hero.y+Math.sin(a)*r}}
  function pool(){var list=[];for(var k in MOBS){var d=MOBS[k];if(d.w>0&&d.min<=wave)list.push(k)}return list}
  function pick(list){var tot=0;list.forEach(function(k){tot+=MOBS[k].w});var x=R()*tot;for(var i=0;i<list.length;i++){x-=MOBS[list[i]].w;if(x<0)return list[i]}return list[0]}
  function spawnTick(dt){
    if(boss&&boss.hp>0)dt*=.55;
    var rate=.8+T/60*.45;spawnAcc+=rate*dt;var alive=0;for(var i=0;i<mobs.length;i++)if(!mobs[i].ally&&mobs[i].hp>0)alive++;
    var list=pool();
    while(spawnAcc>=1){spawnAcc-=1;if(alive>=MAX_MOBS)break;var k=pick(list),p=spawnPos();mkMob(k,MOBS[k],p.x,p.y);alive++}
    if(bossIdx<BOSS_AT.length&&T>=BOSS_AT[bossIdx]){var b=BOSSES[bossIdx%BOSSES.length];var p2=spawnPos();boss=mkMob(b.k,b,p2.x,p2.y);boss.gimT=3;bossIdx++;
      shout(b.n.replace("Босс: ",""),b.gim?"Босс "+b.gim:"Босс!");shake(5)}
  }
  function swarm(){var k=wave>=5?"gob":"slime",n=18+wave*2;for(var i=0;i<n;i++){var a=i/n*6.283,r=viewR()+6;mkMob(k,MOBS[k],hero.x+Math.cos(a)*r,hero.y+Math.sin(a)*r)}shout("Окружают!","Пробейся сквозь кольцо")}
  var swarmAt={2:1,5:1,8:1};

  function hitMob(m,raw,opt){if(m.hp<=0)return;opt=opt||{};
    var c=!opt.noCrit&&R()<crit();var d=Math.max(1,Math.round(raw*(c?2:1)));
    m.hp-=d;m.flash=.09;m.lastHit=T;
    if(opt.kb){var dx=m.x-(opt.fx==null?hero.x:opt.fx),dy=m.y-(opt.fy==null?hero.y:opt.fy),l=Math.hypot(dx,dy)||1;var f=m.boss?opt.kb*.15:opt.kb;m.kx+=dx/l*f;m.ky+=dy/l*f}
    if(P.firstHitStun&&!m.stunned1&&!m.boss){m.stunned1=true;m.stun=Math.max(m.stun,.6)}
    if(P.lifestealPct>0&&hp>0)heal(d*P.lifestealPct*.25,true);
    if(onScreen(m,10))floatAt(m.x+rnd(-3,3),m.y-m.h*.5,d,c?"#ffd84a":"#fff",c);
    if(m.hp<=0)killMob(m)}
  function killMob(m){m.hp=0;kills++;burst(m.x,m.y,m.col,m.boss?40:8,m.boss?80:45);
    if(m.boss){bossKills++;boss=null;drops.push({k:"chest",x:m.x,y:m.y,v:0});shake(7);shout("Босс повержен!","Открой сундук");
      for(var i=0;i<6;i++)drops.push({k:"gem",x:m.x+rnd(-14,14),y:m.y+rnd(-14,14),v:10})}
    else{drops.push({k:"gem",x:m.x,y:m.y,v:m.xpv});
      var gc=.13+up.luck*.03;if(R()<gc)drops.push({k:"coin",x:m.x+rnd(-4,4),y:m.y+rnd(-4,4),v:Math.max(1,Math.round(m.gold*(1+P.goldPct)))});
      if(R()<.008)drops.push({k:"meat",x:m.x,y:m.y,v:0});else if(R()<.003)drops.push({k:"magnet",x:m.x,y:m.y,v:0})}
    if(m.key==="slime")for(var j=0;j<2;j++){var s=mkMob("slimelet",MOBS.slimelet,m.x+rnd(-5,5),m.y+rnd(-5,5));s.kx=rnd(-40,40);s.ky=rnd(-40,40)}
    if(drops.length>320)mergeGems()}
  function mergeGems(){var tot=0,keep=[];drops.forEach(function(d){if(d.k==="gem"&&!onScreen(d,40))tot+=d.v;else keep.push(d)});drops=keep;if(tot)drops.push({k:"gem",x:hero.x+rnd(-60,60),y:hero.y+rnd(-60,60),v:tot})}
  function heal(n,quiet){var h=Math.min(maxHP-hp,n);if(h<=0)return;hp+=h;if(!quiet&&h>=1)floatAt(hero.x,hero.y-14,"+"+Math.round(h),"#7dffa6",true)}
  function hurt(raw,src){if(hero.inv>0||over||hero.dead)return;
    if(R()<dodge){floatAt(hero.x,hero.y-14,"уворот","#8fd3ff");hero.inv=.25;return}
    var a=armor();var d=Math.max(1,Math.round(raw*(1-Math.min(.65,a/(a+30)))));
    if(src&&P.thornsPct>0&&src.hp>0)hitMob(src,raw*P.thornsPct,{noCrit:true});
    if(shield>0){var s=Math.min(shield,d);shield-=s;d-=s;if(!d){floatAt(hero.x,hero.y-14,"щит","#8fd3ff");hero.inv=.3;return}}
    hp-=d;hero.inv=.5;floatAt(hero.x,hero.y-14,"-"+d,"#ff5f73",true);shake(3);
    if(hp<=0){if(P.reviveOnce&&!revived){revived=true;hp=Math.round(maxHP*.5);hero.inv=2;shout("Второй шанс!","Ты поднимаешься снова");burst(hero.x,hero.y,"#ffd84a",30,90);visible().forEach(function(m){if(!m.boss)hitMob(m,m.max,{noCrit:true})})}
      else{hp=0;hero.dead=.01;shake(8);burst(hero.x,hero.y,C.col,40,70)}}}

  /* ---------- weapons ---------- */
  function shoot(o){shots.push(o)}
  function fireWeapon(w){var s=WEAP[w.id].s(w.lv),dm=baseAtk*dmgMul(),t;
    switch(w.id){
    case "sword":t=nearest(hero,s.r+30);var ang=t?Math.atan2(t.y-hero.y,t.x-hero.x):(hero.face>0?0:Math.PI);
      slash(ang,s,dm);if(s.both)slash(ang+Math.PI,s,dm);return;
    case "bolt":for(var i=0;i<s.n;i++){t=nearest(hero,viewR(),i?function(m){return R()<.6}:null)||nearest(hero,viewR());var a0=t?Math.atan2(t.y-hero.y,t.x-hero.x):R()*6.28;a0+=(i-(s.n-1)/2)*.35;
        shoot({k:"bolt",x:hero.x,y:hero.y-4,vx:Math.cos(a0)*140,vy:Math.sin(a0)*140,r:4,dmg:dm*s.dmg,pierce:1,life:2.2,tg:t,c:"#8fb4ff"})}return;
    case "arrow":t=nearest(hero,viewR());var a1=t?Math.atan2(t.y-hero.y,t.x-hero.x):(hero.face>0?0:Math.PI);
      for(var j=0;j<s.n;j++){var aa=a1+(j-(s.n-1)/2)*.18;shoot({k:"arrow",x:hero.x,y:hero.y-3,vx:Math.cos(aa)*230,vy:Math.sin(aa)*230,r:3,dmg:dm*s.dmg,pierce:s.pierce,life:1.4,c:"#e8e0d0"})}return;
    case "zap":var vis=visible();for(var z=0;z<s.n&&vis.length;z++){var m=vis.splice(Math.floor(R()*vis.length),1)[0];
        fxs.push({k:"zap",x:m.x,y:m.y,life:.25,max:.25,seed:R()});hitMob(m,dm*s.dmg,{kb:30});burst(m.x,m.y,"#fff27a",5,50)}return}}
  function slash(ang,s,dm){fxs.push({k:"slash",x:hero.x,y:hero.y,a:ang,arc:s.arc,r:s.r,life:.18,max:.18});
    for(var i=0;i<mobs.length;i++){var m=mobs[i];if(m.hp<=0||m.ally)continue;var dx=m.x-hero.x,dy=m.y-hero.y,d=Math.hypot(dx,dy);if(d>s.r+m.r)continue;
      var da=Math.atan2(dy,dx)-ang;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)<=s.arc/2||d<m.r+6)hitMob(m,dm*s.dmg,{kb:90})}}
  function weaponTick(dt){for(var i=0;i<weapons.length;i++){var w=weapons[i],s=WEAP[w.id].s(w.lv);
      if(w.id==="orbit"){w.a+=s.spd*dt;var dm=baseAtk*dmgMul()*s.dmg;
        for(var k=0;k<s.n;k++){var a=w.a+k/s.n*6.283,bx=hero.x+Math.cos(a)*s.r,by=hero.y+Math.sin(a)*s.r;
          for(var j=0;j<mobs.length;j++){var m=mobs[j];if(m.hp<=0||m.ally)continue;var dx=m.x-bx,dy=m.y-by;if(dx*dx+dy*dy>(m.r+5)*(m.r+5))continue;
            if((m.hitBy.orbit||0)>T)continue;m.hitBy.orbit=T+.45;hitMob(m,dm,{kb:60,fx:hero.x,fy:hero.y})}}continue}
      if(w.id==="aura"){auraT-=dt;var r2=s.r*s.r;for(var q=0;q<mobs.length;q++){var mm=mobs[q];if(mm.hp>0&&!mm.ally&&dist2(mm,hero)<r2)mm.slow=.2}
        if(auraT<=0){auraT=.5;var ad=baseAtk*dmgMul()*s.dmg;for(var u=0;u<mobs.length;u++){var m2=mobs[u];if(m2.hp>0&&!m2.ally&&dist2(m2,hero)<r2)hitMob(m2,ad,{noCrit:true})}}continue}
      w.t-=dt;if(w.t<=0){w.t=s.cd*cdF();fireWeapon(w)}}}

  /* ---------- active skills from the diary ---------- */
  function cast(i){var a=acts[i];if(!a||over||paused||hero.dead)return;if(a.cd>0)return;var e=a.s.effect;var res=apply(e.kind,+e.power||0);
    if(!res)return;a.cd=a.max;shout(e.shout||a.s.name,res!==true?res:null)}
  function apply(kind,p){var list,t,dm=baseAtk*dmgMul()*magMul;
    switch(kind){
    case "damageAll":list=visible();if(!list.length){floatAt(hero.x,hero.y-18,"врагов нет","#aab1dc");return false}
      fxs.push({k:"ring",x:hero.x,y:hero.y,r0:6,r1:viewR(),c:"#ffd84a",life:.45,max:.45});shake(6);list.forEach(function(m){hitMob(m,dm*(p||1.3)*2,{kb:120})});return true;
    case "damageOne":list=visible();if(!list.length){floatAt(hero.x,hero.y-18,"нет цели","#aab1dc");return false}
      t=list.reduce(function(a,b){return b.hp>a.hp?b:a});fxs.push({k:"beam",x:hero.x,y:hero.y,x2:t.x,y2:t.y,life:.3,max:.3});shake(5);hitMob(t,dm*(p||1.5)*6,{kb:150});burst(t.x,t.y,"#f2b84b",16,70);return true;
    case "heal":if(hp>=maxHP){floatAt(hero.x,hero.y-18,"HP полное","#aab1dc");return false}heal(maxHP*(p||.3)*magMul);burst(hero.x,hero.y,"#7dffa6",18,50);return true;
    case "stunAll":list=visible();if(!list.length)return false;var tn=.8+1.2*(p||1);list.forEach(function(m){m.stun=Math.max(m.stun,m.boss?tn/2:tn)});
      fxs.push({k:"ring",x:hero.x,y:hero.y,r0:6,r1:viewR(),c:"#8fd3ff",life:.5,max:.5});return "враги оглушены на "+tn.toFixed(1)+" с";
    case "shield":var add=Math.round(Math.min(maxHP-shield,maxHP*(p||.3)*magMul));if(add<=0)return false;shield+=add;floatAt(hero.x,hero.y-18,"щит +"+add,"#8fd3ff",true);return true;
    case "execute":var thr=Math.min(.9,p||.3),n=0;visible().forEach(function(m){if(!m.boss&&m.hp/m.max<=thr){n++;fxs.push({k:"x",x:m.x,y:m.y,life:.35,max:.35});hitMob(m,m.hp+1,{noCrit:true})}else if(m.boss)hitMob(m,dm*3,{})});
      shake(4);return n?"казнено: "+n:true;
    case "teleport":var dx=hero.vx,dy=hero.vy;if(!dx&&!dy){t=nearest(hero,200);if(t){dx=hero.x-t.x;dy=hero.y-t.y}else dx=hero.face}
      var l=Math.hypot(dx,dy)||1;burst(hero.x,hero.y,"#c9a0ff",18,60);hero.x+=dx/l*80;hero.y+=dy/l*80;hero.inv=Math.max(hero.inv,1.2);burst(hero.x,hero.y,"#c9a0ff",18,60);
      mobs.forEach(function(m){if(m.hp>0&&!m.ally&&dist2(m,hero)<30*30)hitMob(m,dm,{kb:120})});return true;
    case "summon":allies.push({x:hero.x+10,y:hero.y,life:12,t:0,a:R()*6.28,p:p||1.2});burst(hero.x,hero.y,"#ffd84a",16,50);return "фамильяр на 12 с";
    case "charm":list=visible().filter(function(m){return !m.boss}).sort(function(a,b){return dist2(a,hero)-dist2(b,hero)}).slice(0,3+Math.round(p||1));
      if(!list.length)return false;list.forEach(function(m){m.ally=true;m.life=8;m.hp=m.max;burst(m.x,m.y,"#ff8fc8",8,40)});return "очаровано: "+list.length;
    case "random":var ks=["damageAll","damageOne","heal","stunAll","shield","execute","summon"];return apply(ks[Math.floor(R()*ks.length)],Math.max(.3,p/1.5)*1.2)||true}
    return false}
  function drink(){if(over||paused||hero.dead||potions<=0)return;if(hp>=maxHP){floatAt(hero.x,hero.y-18,"HP полное","#aab1dc");return}potions--;heal(maxHP*.4);burst(hero.x,hero.y,"#ff7a8a",14,40)}

  /* ---------- level ups ---------- */
  function needFor(l){return 4+l*3+Math.max(0,l-12)*5}
  function gainXp(v){xp+=v;while(xp>=need){xp-=need;lvl++;need=needFor(lvl);pendingLv++}if(pendingLv&&!menu)levelUp(false)}
  function options(){var o=[];
    weapons.forEach(function(w){if(w.lv<MAXLV)o.push({t:"w",id:w.id,lv:w.lv+1})});
    if(weapons.length<MAXW)for(var id in WEAP)if(!weapons.some(function(w){return w.id===id}))o.push({t:"w",id:id,lv:1});
    for(var k in PERKS)if(up[k]<MAXLV)o.push({t:"p",id:k,lv:up[k]+1});
    var out=[];while(o.length&&out.length<3){out.push(o.splice(Math.floor(R()*o.length),1)[0])}
    if(!out.length)out.push({t:"g",id:"gold",lv:0});return out}
  function levelUp(chest){paused=true;menu="lv";var opts2=options();
    ov.innerHTML='<div class="sv-card"><h2>'+(chest?"СУНДУК БОССА":"НОВЫЙ УРОВЕНЬ "+lvl)+'</h2><p>Выбери улучшение</p>'+opts2.map(function(o,i){
      var D=o.t==="w"?WEAP[o.id]:o.t==="p"?PERKS[o.id]:{n:"Мешок золота",g:"$",c:"#f2b84b",d:"+25 монет."};
      var tag=o.t==="w"?(o.lv===1?"НОВОЕ ОРУЖИЕ":"оружие · ур. "+o.lv):o.t==="p"?"улучшение · ур. "+o.lv:"";
      return '<button class="sv-btn sv-opt" data-a="opt" data-i="'+i+'"><i style="background:'+D.c+'">'+esc(D.g)+'</i><div><u>'+tag+'</u><b>'+esc(D.n)+'</b><span>'+esc(D.d)+'</span></div></button>'}).join("")+'</div>';
    ov.hidden=false;ov._opts=opts2;ov._chest=chest}
  function choose(i){var o=(ov._opts||[])[i];if(!o)return;
    if(o.t==="w"){var w=weapons.find(function(x){return x.id===o.id});if(w)w.lv++;else weapons.push({id:o.id,lv:1,t:.2,a:0})}
    else if(o.t==="p"){up[o.id]++;if(o.id==="heart"){var old=maxHP;maxHP=Math.round(baseHP*(1+up.heart*.15));hp+=maxHP-old;heal(maxHP*.2,true)}}
    else gold+=25;
    var wasChest=ov._chest;ov.hidden=true;ov.innerHTML="";menu=null;paused=false;
    if(!wasChest&&pendingLv>0)pendingLv--;
    if(pendingLv>0)levelUp(false);last=performance.now()}
  function pauseMenu(){if(over||menu)return;paused=true;menu="pause";
    ov.innerHTML='<div class="sv-card"><h2>ПАУЗА</h2><div class="sv-grid">'+
      [["ВРЕМЯ",fmtT(T)],["ВОЛНА",wave],["УБИТО",kills],["МОНЕТЫ",gold]].map(function(x){return '<div><small>'+x[0]+'</small><b>'+x[1]+'</b></div>'}).join("")+'</div>'+
      '<p>Оружие: '+weapons.map(function(w){return esc(WEAP[w.id].n)+" "+w.lv}).join(", ")+'</p>'+
      (passives.length?'<p>Пассивки из дневника: '+passives.map(function(s){return esc(s.name)}).join(", ")+'</p>':"")+
      '<button class="sv-btn sv-big pri" data-a="resume">Продолжить</button><button class="sv-btn sv-big" data-a="flee">Сбежать с добычей</button></div>';
    ov.hidden=false}
  function resume(){if(menu!=="pause")return;ov.hidden=true;ov.innerHTML="";menu=null;paused=false;last=performance.now()}
  function fmtT(t){t=Math.floor(t);return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0")}

  function finish(died,why){if(ended)return;ended=true;over=true;paused=true;menu="end";
    var res={floor:Math.min(10,wave),kills:kills,bossKills:bossKills,gold:gold,died:died,fled:why==="flee",time:Math.floor(Math.min(T,RUN)),level:lvl};
    var reward=Math.min(15,Math.round(gold*.1)+bossKills*5);
    ov.innerHTML='<div class="sv-card"><h2>'+(died?"ГЕРОЙ ПАЛ":why==="win"?"ТЫ ВЫСТОЯЛ!":"ТЫ СБЕЖАЛ")+'</h2>'+
      '<p>'+(died?"Арена победила… на сегодня. Выполняй квесты, чтобы стать сильнее.":why==="win"?"Десять минут против всей армии прокрастинации. Легенда.":"Ушёл живым и с добычей.")+'</p>'+
      '<div class="sv-grid">'+[["ВРЕМЯ",fmtT(Math.min(T,RUN))],["ВОЛНА",res.floor],["УБИТО",kills],["БОССОВ",bossKills],["УРОВЕНЬ",lvl],["ЗОЛОТО В ДНЕВНИК","+"+reward]].map(function(x){return '<div><small>'+x[0]+'</small><b>'+x[1]+'</b></div>'}).join("")+'</div>'+
      '<button class="sv-btn sv-big pri" data-act="leaveGame">Вернуться в дневник</button></div>';
    ov.hidden=false;
    try{opts.onEnd&&opts.onEnd(res)}catch(e){}}

  /* ---------- update ---------- */
  var grid={};
  function update(dt){
    T+=dt;helpT-=dt;if(helpT<0&&helpEl.style.opacity!=="0")helpEl.style.opacity="0";
    var nw=Math.min(10,Math.floor(T/60)+1);if(nw!==wave){wave=nw;if(P.regenPerFloor>0)heal(maxHP*P.regenPerFloor);if(swarmAt[wave])swarm();else shout("Волна "+wave,wave===10?"Последняя минута!":null)}
    if(T>=RUN&&!hero.dead){finish(false,"win");return}
    /* hero */
    if(hero.dead){hero.dead+=dt;if(hero.dead>1.2)finish(true);return}
    var ix=0,iy=0;if(keys.l)ix-=1;if(keys.r)ix+=1;if(keys.u)iy-=1;if(keys.d)iy+=1;
    if(stick&&stick.on){var sx=stick.x-stick.x0,sy=stick.y-stick.y0,sl=Math.hypot(sx,sy);if(sl>6){var k=Math.min(1,sl/40);ix=sx/sl*k;iy=sy/sl*k}}
    var il=Math.hypot(ix,iy);if(il>1){ix/=il;iy/=il}
    hero.vx=ix;hero.vy=iy;hero.moving=il>.05;if(Math.abs(ix)>.1)hero.face=ix>0?1:-1;
    hero.x+=ix*speed()*dt;hero.y+=iy*speed()*dt;if(hero.moving)hero.anim+=dt*10;
    hero.inv=Math.max(0,hero.inv-dt);
    regenAcc+=regenRate()*dt;if(regenAcc>=1){heal(Math.floor(regenAcc),true);regenAcc-=Math.floor(regenAcc)}
    acts.forEach(function(a){a.cd=Math.max(0,a.cd-dt)});
    spawnTick(dt);weaponTick(dt);
    /* grid for separation */
    grid={};for(var i=0;i<mobs.length;i++){var m=mobs[i];if(m.hp<=0)continue;var gk=(Math.floor(m.x/16))+","+(Math.floor(m.y/16));(grid[gk]||(grid[gk]=[])).push(m)}
    var far=viewR()*2.2;
    for(i=0;i<mobs.length;i++){m=mobs[i];if(m.hp<=0)continue;m.age+=dt;m.flash=Math.max(0,m.flash-dt);
      if(m.ally){m.life-=dt;if(m.life<=0){m.hp=0;burst(m.x,m.y,"#ff8fc8",8,40);continue}}
      var tx=hero.x,ty=hero.y,tgt=null;
      if(m.ally){tgt=nearest(m,140);if(tgt){tx=tgt.x;ty=tgt.y}}
      var dx=tx-m.x,dy=ty-m.y,d=Math.hypot(dx,dy)||1;
      if(!m.ally&&d>far){var p=spawnPos();m.x=p.x;m.y=p.y;continue}
      m.face=dx>0?1:-1;
      var sp=m.spd*(m.slow?.6:1);m.slow=0;
      if(m.boss&&m.def.k==="deadline")sp*=1+Math.min(1,m.age*.012);
      var mvx=0,mvy=0;
      if(m.stun>0){m.stun-=dt}
      else if(m.beh==="ranged"&&!m.ally){var want=m.range*.9;var dir=d>want+8?1:d<want-12?-1:0;mvx=dx/d*dir;mvy=dy/d*dir;
        if(dir===0){mvx=-dy/d*.5;mvy=dx/d*.5}
        m.shootT-=dt;if(m.shootT<=0&&d<m.range*1.4){m.shootT=m.boss?2.6:rnd(2,3);
          if(m.boss){for(var b=0;b<10;b++){var ba=b/10*6.283+m.age;shots.push({k:"orb",x:m.x,y:m.y,vx:Math.cos(ba)*55,vy:Math.sin(ba)*55,r:4,dmg:m.atk,life:4,enemy:true,c:"#c9a0ff"})}}
          else shots.push({k:"orb",x:m.x,y:m.y,vx:dx/d*70,vy:dy/d*70,r:3,dmg:m.atk,life:3,enemy:true,c:m.key==="ghost"?"#ff3d5a":"#ff8fc8"})}}
      else{mvx=dx/d;mvy=dy/d}
      if(m.boss)bossGimmick(m,dt,dx,dy,d);
      m.x+=(mvx*sp+m.kx)*dt;m.y+=(mvy*sp+m.ky)*dt;var kd=Math.pow(.0005,dt);m.kx*=kd;m.ky*=kd;
      /* separation */
      var cx=Math.floor(m.x/16),cy=Math.floor(m.y/16);
      for(var gx=cx-1;gx<=cx+1;gx++)for(var gy=cy-1;gy<=cy+1;gy++){var cell=grid[gx+","+gy];if(!cell)continue;
        for(var c=0;c<cell.length;c++){var o=cell[c];if(o===m||o.hp<=0)continue;var ox=m.x-o.x,oy=m.y-o.y,rr=m.r+o.r;var od=ox*ox+oy*oy;
          if(od<rr*rr&&od>.0001){var odl=Math.sqrt(od),push=(rr-odl)*.5*(o.boss&&!m.boss?1.6:1);m.x+=ox/odl*push*.5;m.y+=oy/odl*push*.5}
          if(m.ally!==o.ally&&od<rr*rr&&(m.hitBy.ally||0)<T){m.hitBy.ally=T+.5;if(m.ally)hitMob(o,Math.max(m.atk*2,baseAtk*.5),{noCrit:true});}}}
      /* contact */
      if(!m.ally&&m.stun<=0){var hd2=dist2(m,hero),hr=m.r+5;if(hd2<hr*hr)hurt(m.atk*.7,m)}}
    mobs=mobs.filter(function(m){return m.hp>0});
    /* allies (summoned familiar) */
    allies=allies.filter(function(a){a.life-=dt;a.a+=dt*2.2;a.x+=(hero.x+Math.cos(a.a)*22-a.x)*Math.min(1,dt*6);a.y+=(hero.y-6+Math.sin(a.a)*14-a.y)*Math.min(1,dt*6);
      a.t-=dt;if(a.t<=0){var t=nearest(a,viewR());if(t){a.t=.55;var aa=Math.atan2(t.y-a.y,t.x-a.x);shots.push({k:"bolt",x:a.x,y:a.y,vx:Math.cos(aa)*150,vy:Math.sin(aa)*150,r:3,dmg:baseAtk*a.p*magMul,pierce:1,life:2,tg:t,c:"#ffd84a"})}}
      return a.life>0});
    /* shots */
    for(i=0;i<shots.length;i++){var s=shots[i];s.life-=dt;
      if(s.tg&&s.tg.hp>0&&s.k==="bolt"){var ta=Math.atan2(s.tg.y-s.y,s.tg.x-s.x),ca=Math.atan2(s.vy,s.vx),df=Math.atan2(Math.sin(ta-ca),Math.cos(ta-ca)),na=ca+clamp(df,-6*dt,6*dt),spd=Math.hypot(s.vx,s.vy);s.vx=Math.cos(na)*spd;s.vy=Math.sin(na)*spd}
      s.x+=s.vx*dt;s.y+=s.vy*dt;
      if(s.enemy){if(dist2(s,hero)<(s.r+5)*(s.r+5)){hurt(s.dmg,null);s.life=0}continue}
      for(var j=0;j<mobs.length&&s.life>0;j++){var mm=mobs[j];if(mm.hp<=0||mm.ally||(s.hitSet&&s.hitSet.has(mm)))continue;
        var rr2=mm.r+s.r;if(dist2(s,mm)<rr2*rr2){(s.hitSet||(s.hitSet=new Set())).add(mm);
          hitMob(mm,s.dmg,{kb:50,fx:s.x-s.vx*.05,fy:s.y-s.vy*.05});s.pierce--;if(s.pierce<=0)s.life=0}}}
    shots=shots.filter(function(s){return s.life>0});
    /* drops */
    var mr=magnetR();
    for(i=0;i<drops.length;i++){var g=drops[i];var gdx=hero.x-g.x,gdy=hero.y-g.y,gd=Math.hypot(gdx,gdy);
      if(g.k!=="chest"&&(g.vac||gd<mr)){g.vac=true;var vs=140+(g.sp=(g.sp||0)+dt*300);g.x+=gdx/(gd||1)*Math.min(gd,vs*dt);g.y+=gdy/(gd||1)*Math.min(gd,vs*dt)}
      if(gd<8){g.take=true;
        if(g.k==="gem")gainXp(g.v);else if(g.k==="coin"){gold+=g.v;floatAt(hero.x,hero.y-16,"+"+g.v,"#f2b84b")}
        else if(g.k==="meat")heal(maxHP*.3);else if(g.k==="magnet"){drops.forEach(function(x){if(x.k==="gem"||x.k==="coin")x.vac=true});shout("Магнит!")}
        else if(g.k==="chest"){gold+=25;burst(g.x,g.y,"#f2b84b",30,80);levelUp(true)}}}
    drops=drops.filter(function(g){return !g.take});
    /* fx */
    parts=parts.filter(function(p){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.9;p.vy*=.9;return p.life>0});
    floats=floats.filter(function(f){f.life-=dt;f.y-=dt*(f.big?18:24);return f.life>0});
    fxs=fxs.filter(function(f){f.life-=dt;return f.life>0});
    if(shakeT>0){shakeT-=dt;if(shakeT<=0)shakeA=0}
  }
  function bossGimmick(m,dt,dx,dy,d){m.gimT-=dt;
    if(m.def.k==="deadline"&&m.gimT<=0){m.gimT=5;m.kx+=dx/d*260;m.ky+=dy/d*260;floatAt(m.x,m.y-14,"РЫВОК!","#ff5f73",true)}
    else if(m.def.k==="feed"&&m.gimT<=0){m.gimT=3.5;for(var i=0;i<3;i++)mkMob("gob",MOBS.gob,m.x+rnd(-16,16),m.y+rnd(-16,16));floatAt(m.x,m.y-14,"+3","#ff8fc8")}
    else if(m.def.k==="critic"&&T-m.lastHit>3&&m.hp<m.max){m.hp=Math.min(m.max,m.hp+m.max*.02*dt*10);if(m.gimT<=0){m.gimT=1;floatAt(m.x,m.y-14,"лечится","#7dffa6")}}}

  /* ---------- draw ---------- */
  function resize(){var r=root.getBoundingClientRect();W=Math.max(1,r.width);Hh=Math.max(1,r.height);dpr=Math.min(2.5,window.devicePixelRatio||1);
    cv.width=Math.round(W*dpr);cv.height=Math.round(Hh*dpr);Z=clamp(Math.min(W,Hh)/190,1.8,4);
    var g=ctx.createRadialGradient(W/2,Hh/2,Math.min(W,Hh)*.3,W/2,Hh/2,Math.hypot(W,Hh)*.6);g.addColorStop(0,"rgba(5,4,16,0)");g.addColorStop(1,"rgba(5,4,16,.75)");vign=g}
  function hash2(x,y){var h=Math.imul(x,374761393)+Math.imul(y,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return ((h^h>>>16)>>>0)/4294967296}
  function spr(img,x,y,sx,sy,flip,alpha){ctx.save();ctx.translate(x,y);ctx.scale(flip?-sx:sx,sy);if(alpha!=null)ctx.globalAlpha=alpha;ctx.drawImage(img,-img.width/2,-img.height);ctx.restore()}
  function shadow(x,y,w){ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(x,y,w,w*.35,0,0,6.283);ctx.fill()}
  function draw(){
    ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
    var sxo=shakeA?(R()-.5)*shakeA*2:0,syo=shakeA?(R()-.5)*shakeA*2:0;
    camX+=(hero.x-camX)*.2;camY+=(hero.y-camY)*.2;if(T<.05){camX=hero.x;camY=hero.y}
    var k=dpr*Z;ctx.setTransform(k,0,0,k,Math.round(cv.width/2-(camX+sxo)*k),Math.round(cv.height/2-(camY+syo)*k));ctx.imageSmoothingEnabled=false;
    var vw=W/Z/2+40,vh=Hh/Z/2+40;
    /* floor */
    var x0=Math.floor((camX-vw)/32),x1=Math.floor((camX+vw)/32),y0=Math.floor((camY-vh)/32),y1=Math.floor((camY+vh)/32);
    for(var ty=y0;ty<=y1;ty++)for(var tx=x0;tx<=x1;tx++){var h=hash2(tx,ty);ctx.drawImage(A.floor[Math.floor(h*4)],tx*32,ty*32);
      if(h>.93){var pr=h>.985?A.props.candle:h>.97?A.props.skull:h>.955?A.props.rock:A.props.bones;var px=tx*32+8+Math.floor(hash2(ty,tx)*14),py=ty*32+10+Math.floor(hash2(tx+7,ty)*14);
        if(pr===A.props.candle){var fl=.5+Math.sin(T*9+tx)*.1+R()*.05;ctx.fillStyle="rgba(255,200,90,"+(.10*fl)+")";ctx.beginPath();ctx.arc(px+2,py-4,14,0,6.283);ctx.fill()}
        ctx.drawImage(pr,px-pr.width/2,py-pr.height)}}
    /* aura */
    weapons.forEach(function(w){if(w.id!=="aura")return;var s=WEAP.aura.s(w.lv);var pul=1+Math.sin(T*4)*.04;ctx.fillStyle="rgba(125,255,208,.08)";ctx.strokeStyle="rgba(125,255,208,.35)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(hero.x,hero.y-3,s.r*pul,0,6.283);ctx.fill();ctx.stroke()});
    /* drops */
    for(var i=0;i<drops.length;i++){var g=drops[i];if(!onScreen(g,10))continue;var bob=Math.sin(T*5+i)*1.2;
      var im=g.k==="gem"?A.gem[g.v>=10?2:g.v>=3?1:0]:g.k==="coin"?A.coin:g.k==="meat"?A.meat:g.k==="magnet"?A.magnet:A.chest;
      if(g.k==="chest"){ctx.fillStyle="rgba(242,184,75,"+(.15+Math.sin(T*4)*.08)+")";ctx.beginPath();ctx.arc(g.x,g.y-3,12,0,6.283);ctx.fill()}
      ctx.drawImage(im,Math.round(g.x-im.width/2),Math.round(g.y-im.height/2+bob))}
    /* actors sorted by y */
    var list=[];for(i=0;i<mobs.length;i++){if(onScreen(mobs[i],20))list.push(mobs[i])}list.push(hero);list.sort(function(a,b){return a.y-b.y});
    for(i=0;i<list.length;i++){var m=list[i];
      if(m===hero){drawHero();continue}
      var spi=m.flash>0?A.white[m.key]:A.mob[m.key];var sc=m.boss?1.5:1;var wob=m.stun>0?0:Math.sin(T*10+m.phase);
      shadow(m.x,m.y,m.w*.38*sc);
      if(m.ally){ctx.fillStyle="rgba(255,143,200,.25)";ctx.beginPath();ctx.arc(m.x,m.y-m.h*.4*sc,m.w*.6*sc,0,6.283);ctx.fill()}
      spr(spi,m.x,m.y+(m.age<.3?(.3-m.age)*20:0),sc*(1+wob*.05),sc*(1-wob*.06)*(m.age<.3?m.age/.3:1),m.face<0,m.ally?.85:null);
      if(m.stun>0){ctx.fillStyle="#ffd84a";for(var s=0;s<3;s++){var a=T*5+s*2.1;ctx.fillRect(Math.round(m.x+Math.cos(a)*6),Math.round(m.y-m.h*sc-3+Math.sin(a)*2),1,1)}}
      if(!m.boss&&m.hp<m.max&&!m.ally){ctx.fillStyle="#2a0f1c";ctx.fillRect(m.x-6,m.y+2,12,1.5);ctx.fillStyle="#ff5f73";ctx.fillRect(m.x-6,m.y+2,12*m.hp/m.max,1.5)}}
    /* orbit books */
    weapons.forEach(function(w){if(w.id!=="orbit")return;var s=WEAP.orbit.s(w.lv);for(var k2=0;k2<s.n;k2++){var a=w.a+k2/s.n*6.283,bx=hero.x+Math.cos(a)*s.r,by=hero.y-3+Math.sin(a)*s.r;
      ctx.fillStyle="rgba(242,184,75,.25)";ctx.beginPath();ctx.arc(bx,by,6,0,6.283);ctx.fill();ctx.save();ctx.translate(bx,by);ctx.rotate(a*1.5);ctx.drawImage(A.book,-3,-2.5);ctx.restore()}});
    /* allies */
    allies.forEach(function(a){ctx.globalAlpha=a.life<2?(Math.sin(T*20)>0?1:.4):1;ctx.drawImage(A.pal,Math.round(a.x-6),Math.round(a.y-8+Math.sin(T*6)*1.5));ctx.globalAlpha=1});
    /* shots */
    for(i=0;i<shots.length;i++){var sh=shots[i];if(!onScreen(sh,10))continue;
      if(sh.k==="arrow"){var an=Math.atan2(sh.vy,sh.vx);ctx.save();ctx.translate(sh.x,sh.y);ctx.rotate(an);ctx.fillStyle="#8a5a2b";ctx.fillRect(-6,-.5,9,1);ctx.fillStyle="#e8e0d0";ctx.fillRect(3,-1.5,3,3);ctx.fillStyle="#9be08a";ctx.fillRect(-7,-1.5,2,3);ctx.restore()}
      else{ctx.fillStyle=sh.c;ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(sh.x,sh.y,sh.r+2,0,6.283);ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(sh.x,sh.y,sh.r*.7,0,6.283);ctx.fill();ctx.fillStyle="#fff";ctx.fillRect(sh.x-.5,sh.y-.5,1,1)}}
    /* fx */
    fxs.forEach(function(f){var p=1-f.life/f.max;
      if(f.k==="slash"){ctx.save();ctx.translate(hero.x,hero.y-4);ctx.globalAlpha=1-p;ctx.strokeStyle="#fff";ctx.lineWidth=4*(1-p)+1;ctx.beginPath();ctx.arc(0,0,f.r*(.7+p*.3),f.a-f.arc/2,f.a-f.arc/2+f.arc*Math.min(1,p*2.2));ctx.stroke();
        ctx.strokeStyle=C.col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,f.r*(.55+p*.3),f.a-f.arc/2,f.a-f.arc/2+f.arc*Math.min(1,p*2.2));ctx.stroke();ctx.restore()}
      else if(f.k==="zap"){var r2=rngFor(f.seed+":"+Math.floor(T*30));ctx.strokeStyle="#fff27a";ctx.globalAlpha=1-p;ctx.lineWidth=2;ctx.beginPath();var zx=f.x,zy=f.y-120;ctx.moveTo(zx,zy);
        for(var q=1;q<=7;q++){ctx.lineTo(f.x+(r2()-.5)*14*(1-q/7),zy+q*(120/7))}ctx.stroke();ctx.fillStyle="rgba(255,242,122,.4)";ctx.beginPath();ctx.arc(f.x,f.y,10*(1-p),0,6.283);ctx.fill();ctx.globalAlpha=1}
      else if(f.k==="ring"){ctx.strokeStyle=f.c;ctx.globalAlpha=1-p;ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x,f.y,f.r0+(f.r1-f.r0)*p,0,6.283);ctx.stroke();ctx.globalAlpha=1}
      else if(f.k==="beam"){ctx.strokeStyle="#f2b84b";ctx.globalAlpha=1-p;ctx.lineWidth=5*(1-p)+1;ctx.beginPath();ctx.moveTo(hero.x,hero.y-5);ctx.lineTo(f.x2,f.y2-5);ctx.stroke();ctx.globalAlpha=1}
      else if(f.k==="x"){ctx.strokeStyle="#ff5f73";ctx.globalAlpha=1-p;ctx.lineWidth=2;var z=6+p*4;ctx.beginPath();ctx.moveTo(f.x-z,f.y-z-5);ctx.lineTo(f.x+z,f.y+z-5);ctx.moveTo(f.x+z,f.y-z-5);ctx.lineTo(f.x-z,f.y+z-5);ctx.stroke();ctx.globalAlpha=1}});
    for(i=0;i<parts.length;i++){var pp=parts[i];ctx.globalAlpha=Math.min(1,pp.life/pp.max*2);ctx.fillStyle=pp.c;ctx.fillRect(pp.x,pp.y,pp.s,pp.s)}ctx.globalAlpha=1;
    /* floats */
    ctx.textAlign="center";ctx.textBaseline="middle";
    for(i=0;i<floats.length;i++){var f=floats[i];var a2=Math.min(1,f.life/f.max*2.5);var popS=f.big?1+Math.max(0,(f.life/f.max-.8))*2:1;
      ctx.globalAlpha=a2;ctx.font="900 "+(f.big?8:6)*popS+"px system-ui,-apple-system,sans-serif";ctx.lineWidth=2;ctx.strokeStyle="#07061a";ctx.strokeText(f.t,f.x,f.y);ctx.fillStyle=f.c;ctx.fillText(f.t,f.x,f.y)}ctx.globalAlpha=1;
    /* boss arrow when off-screen */
    if(boss&&boss.hp>0&&!onScreen(boss,-10)){var ba=Math.atan2(boss.y-camY,boss.x-camX),bx2=camX+Math.cos(ba)*Math.min(W/Z/2-14,Hh/Z/2-60),by2=camY+Math.sin(ba)*Math.min(W/Z/2-14,Hh/Z/2-60);
      ctx.save();ctx.translate(bx2,by2);ctx.rotate(ba);ctx.fillStyle="#ff5f73";ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-5);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore()}
    /* screen space */
    ctx.setTransform(dpr,0,0,dpr,0,0);if(vign){ctx.fillStyle=vign;ctx.fillRect(0,0,W,Hh)}
    if(hero.inv>0&&hp<maxHP*.3){ctx.fillStyle="rgba(224,69,94,"+(.12*hero.inv)+")";ctx.fillRect(0,0,W,Hh)}
    if(stick&&stick.on){ctx.globalAlpha=.5;ctx.strokeStyle="#cfd8ff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(stick.x0,stick.y0,40,0,6.283);ctx.stroke();
      var jx=stick.x-stick.x0,jy=stick.y-stick.y0,jl=Math.hypot(jx,jy);if(jl>40){jx=jx/jl*40;jy=jy/jl*40}
      ctx.fillStyle="#cfd8ff";ctx.beginPath();ctx.arc(stick.x0+jx,stick.y0+jy,18,0,6.283);ctx.fill();ctx.globalAlpha=1}
  }
  var heroCv=null,heroKey="";
  function drawHero(){var hpb=Math.round(hp/maxHP*100<30?1:0);var key=hpb+"";if(key!==heroKey||!heroCv){heroKey=key;heroCv=heroSprite(cls,level,hpb?20:100);hero.white=flashOf(heroCv)}
    if(hero.dead){var p=Math.min(1,hero.dead/1.2);spr(heroCv,hero.x,hero.y,1+p*.5,1-p,hero.face<0,1-p);return}
    var step=hero.moving?Math.sin(hero.anim):0;shadow(hero.x,hero.y,6);
    if(hero.inv>.3&&Math.floor(T*20)%2)return;
    spr(hero.inv>.35?hero.white:heroCv,hero.x,hero.y-Math.abs(step)*1.5,1+step*.04,1-Math.abs(step)*.05,hero.face<0);
    if(shield>0){ctx.strokeStyle="rgba(143,211,255,"+(.5+Math.sin(T*6)*.2)+")";ctx.lineWidth=1;ctx.beginPath();ctx.arc(hero.x,hero.y-8,12,0,6.283);ctx.stroke()}}

  /* ---------- hud ---------- */
  var hudT=0;
  function hud(){ui.xp.style.width=(xp/need*100).toFixed(1)+"%";ui.hp.style.width=(hp/maxHP*100).toFixed(1)+"%";ui.sh.style.width=(Math.min(1,shield/maxHP)*100).toFixed(1)+"%";
    ui.hpt.textContent=Math.ceil(hp)+" / "+maxHP;ui.time.textContent=fmtT(Math.max(0,RUN-T));ui.kl.textContent=kills;ui.gd.textContent=gold;ui.lv.textContent=lvl;ui.wv.textContent=wave;
    ui.pn.textContent=potions;ui.pot.disabled=potions<=0;
    if(boss&&boss.hp>0){ui.boss.hidden=false;ui.bn.textContent=boss.n;ui.bb.style.width=(boss.hp/boss.max*100).toFixed(1)+"%"}else ui.boss.hidden=true;
    acts.forEach(function(a,i){var b=skBtns[i];if(!b)return;b.querySelector("em").style.setProperty("--p",(a.cd/a.max*100).toFixed(1)+"%");b.classList.toggle("ready",a.cd<=0)})}

  /* ---------- loop ---------- */
  function frame(now){raf=0;if(destroyed)return;var dt=Math.min(.05,(now-(last||now))/1000);last=now;
    if(!paused)update(dt);draw();hudT-=dt;if(hudT<=0||paused){hudT=.08;hud()}
    raf=requestAnimationFrame(frame)}

  /* ---------- input ---------- */
  function onClick(e){var b=e.target.closest&&e.target.closest("[data-a]");if(!b||!root.contains(b)||b.disabled)return;var a=b.dataset.a;
    if(a==="sk")cast(+b.dataset.i);else if(a==="pot")drink();else if(a==="pause")pauseMenu();else if(a==="resume")resume();
    else if(a==="flee"){ov.hidden=true;finish(false,"flee")}else if(a==="opt")choose(+b.dataset.i)}
  var KEYS={ArrowUp:"u",ArrowDown:"d",ArrowLeft:"l",ArrowRight:"r",w:"u",s:"d",a:"l",d:"r","ц":"u","ы":"d","ф":"l","в":"r"};
  function onKey(e,down){if(destroyed||e.metaKey||e.ctrlKey||e.altKey)return;var k=e.key&&e.key.length===1?e.key.toLowerCase():e.key;
    if(KEYS[k]){keys[KEYS[k]]=down;e.preventDefault();return}
    if(!down)return;if(k==="1"||k==="2"||k==="3")cast(+k-1);else if(k==="q"||k==="й")drink();else if(k==="Escape"||k==="p"||k==="з"){if(menu==="pause")resume();else pauseMenu()}}
  function kd(e){onKey(e,true)}function ku(e){onKey(e,false)}
  function onDown(e){if(paused)return;if(e.target!==cv)return;stick={on:true,id:e.pointerId,x0:e.clientX-rootL(),y0:e.clientY-rootT(),x:e.clientX-rootL(),y:e.clientY-rootT()};try{cv.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()}
  function onMove(e){if(stick&&stick.on&&e.pointerId===stick.id){stick.x=e.clientX-rootL();stick.y=e.clientY-rootT();
    var dx=stick.x-stick.x0,dy=stick.y-stick.y0,l=Math.hypot(dx,dy);if(l>60){stick.x0=stick.x-dx/l*60;stick.y0=stick.y-dy/l*60}}}
  function onUp(e){if(stick&&e.pointerId===stick.id)stick=null}
  var rl={l:0,t:0};function rootL(){return rl.l}function rootT(){return rl.t}
  function onResize(){var r=root.getBoundingClientRect();rl.l=r.left;rl.t=r.top;resize()}
  function onVis(){if(document.hidden&&!over)pauseMenu()}
  function noScroll(e){if(e.target===cv)e.preventDefault()}
  root.addEventListener("click",onClick);document.addEventListener("keydown",kd);document.addEventListener("keyup",ku);
  cv.addEventListener("pointerdown",onDown);window.addEventListener("pointermove",onMove);window.addEventListener("pointerup",onUp);window.addEventListener("pointercancel",onUp);
  cv.addEventListener("touchmove",noScroll,{passive:false});
  window.addEventListener("resize",onResize);document.addEventListener("visibilitychange",onVis);

  onResize();shout("Продержись 10 минут",acts.length?"Навыки из дневника — кнопки справа внизу":"Выполняй квесты, чтобы стать сильнее");
  raf=requestAnimationFrame(frame);

  var handle={debug:{state:function(){return{T:T,wave:wave,hp:hp,maxHP:maxHP,lvl:lvl,xp:xp,need:need,mobs:mobs.length,kills:kills,gold:gold,weapons:weapons.map(function(w){return w.id+":"+w.lv}),menu:menu,over:over,boss:boss?boss.n:null}},
      skip:function(s){T+=s},god:function(){baseDef=1e6},hurt:function(n){hp=Math.max(1,hp-n)},xp:function(n){gainXp(n)},choose:choose,cast:cast},
    destroy:function(){if(destroyed)return;destroyed=true;over=true;
      root.removeEventListener("click",onClick);document.removeEventListener("keydown",kd);document.removeEventListener("keyup",ku);
      cv.removeEventListener("pointerdown",onDown);window.removeEventListener("pointermove",onMove);window.removeEventListener("pointerup",onUp);window.removeEventListener("pointercancel",onUp);
      cv.removeEventListener("touchmove",noScroll);window.removeEventListener("resize",onResize);document.removeEventListener("visibilitychange",onVis);
      if(raf)cancelAnimationFrame(raf);raf=0;document.body.style.overflow=prevOverflow;
      if(root.parentNode)root.parentNode.removeChild(root);
      mounts--;if(mounts<=0&&styleEl&&styleEl.parentNode){styleEl.parentNode.removeChild(styleEl);styleEl=null;mounts=0}}};
  return handle;
}
window.HD_GAME={mount:mount,version:2};
})();
