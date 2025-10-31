import { PresetWork } from '@/types/blocks/fanfic-generate';

/**
 * Preset works database for Fanfic Generator
 * Contains popular IPs with characters and worldview information
 */
export const PRESET_WORKS: PresetWork[] = [
  {
    id: 'harry-potter',
    name: '哈利波特',
    nameEn: 'Harry Potter',
    nameDe: 'Harry Potter',
    nameJa: 'ハリー・ポッター',
    nameKo: '해리 포터',
    category: 'novel',
    description: '魔法世界的冒险故事,讲述哈利·波特在霍格沃茨魔法学校的成长历程',
    worldview: '霍格沃茨魔法学校,巫师与麻瓜的世界,伏地魔与凤凰社的对抗,四大学院系统',
    characters: [
      {
        id: 'harry',
        name: '哈利·波特',
        nameEn: 'Harry Potter',
        nameDe: 'Harry Potter',
        nameJa: 'ハリー・ポッター',
        nameKo: '해리 포터',
        role: 'main',
        description: '男主角,"活下来的男孩",格兰芬多学生,勇敢正直',
      },
      {
        id: 'hermione',
        name: '赫敏·格兰杰',
        nameEn: 'Hermione Granger',
        nameDe: 'Hermine Granger',
        nameJa: 'ハーマイオニー・グレンジャー',
        nameKo: '헤르미온느 그레인저',
        role: 'main',
        description: '聪明的女巫,麻瓜出身,格兰芬多学生,博学多才',
      },
      {
        id: 'ron',
        name: '罗恩·韦斯莱',
        nameEn: 'Ron Weasley',
        nameDe: 'Ron Weasley',
        nameJa: 'ロン・ウィーズリー',
        nameKo: '론 위즐리',
        role: 'main',
        description: '哈利的好友,纯血巫师家庭,格兰芬多学生,忠诚善良',
      },
      {
        id: 'draco',
        name: '德拉科·马尔福',
        nameEn: 'Draco Malfoy',
        nameDe: 'Draco Malfoy',
        nameJa: 'ドラコ・マルフォイ',
        nameKo: '드레이코 말포이',
        role: 'supporting',
        description: '斯莱特林学生,纯血贵族,傲慢但内心挣扎',
      },
      {
        id: 'severus',
        name: '西弗勒斯·斯内普',
        nameEn: 'Severus Snape',
        nameDe: 'Severus Snape',
        nameJa: 'セブルス・スネイプ',
        nameKo: '세베루스 스네이프',
        role: 'supporting',
        description: '魔药学教授,双面间谍,深爱莉莉',
      },
    ],
    popularPairings: [
      ['harry', 'hermione'],
      ['harry', 'draco'],
      ['hermione', 'draco'],
      ['james', 'severus'],
    ],
  },
  {
    id: 'marvel',
    name: '漫威宇宙',
    nameEn: 'Marvel Universe',
    nameDe: 'Marvel-Universum',
    nameJa: 'マーベル・ユニバース',
    nameKo: '마블 유니버스',
    category: 'movie',
    description: '超级英雄电影宇宙,包含复仇者联盟、X战警等系列',
    worldview: '地球与多元宇宙,超能力者与普通人共存,复仇者联盟保护世界',
    characters: [
      {
        id: 'tony',
        name: '托尼·斯塔克',
        nameEn: 'Tony Stark',
        nameDe: 'Tony Stark',
        nameJa: 'トニー・スターク',
        nameKo: '토니 스타크',
        role: 'main',
        description: '钢铁侠,天才发明家,亿万富翁,自恋但有责任心',
      },
      {
        id: 'steve',
        name: '史蒂夫·罗杰斯',
        nameEn: 'Steve Rogers',
        nameDe: 'Steve Rogers',
        nameJa: 'スティーブ・ロジャース',
        nameKo: '스티브 로저스',
        role: 'main',
        description: '美国队长,超级士兵,正直善良,领导力强',
      },
      {
        id: 'loki',
        name: '洛基',
        nameEn: 'Loki',
        nameDe: 'Loki',
        nameJa: 'ロキ',
        nameKo: '로키',
        role: 'supporting',
        description: '阿斯加德王子,诡计之神,复杂的反英雄',
      },
      {
        id: 'peter',
        name: '彼得·帕克',
        nameEn: 'Peter Parker',
        nameDe: 'Peter Parker',
        nameJa: 'ピーター・パーカー',
        nameKo: '피터 파커',
        role: 'main',
        description: '蜘蛛侠,高中生,聪明善良,责任感强',
      },
      {
        id: 'bucky',
        name: '巴基·巴恩斯',
        nameEn: 'Bucky Barnes',
        nameDe: 'Bucky Barnes',
        nameJa: 'バッキー・バーンズ',
        nameKo: '버키 반스',
        role: 'supporting',
        description: '冬兵,史蒂夫的好友,被洗脑成杀手',
      },
    ],
    popularPairings: [
      ['tony', 'steve'],
      ['steve', 'bucky'],
      ['tony', 'loki'],
      ['peter', 'tony'],
    ],
  },
  {
    id: 'attack-on-titan',
    name: '进击的巨人',
    nameEn: 'Attack on Titan',
    nameDe: 'Attack on Titan',
    nameJa: '進撃の巨人',
    nameKo: '진격의 거인',
    category: 'anime',
    description: '人类与巨人的生存战争,充满黑暗与悬疑的史诗故事',
    worldview: '三重城墙保护人类,巨人威胁,艾尔迪亚与马莱的历史冲突',
    characters: [
      {
        id: 'eren',
        name: '艾伦·耶格尔',
        nameEn: 'Eren Yeager',
        nameDe: 'Eren Jäger',
        nameJa: 'エレン・イェーガー',
        nameKo: '에렌 예거',
        role: 'main',
        description: '主角,拥有进击的巨人之力,坚定但极端',
      },
      {
        id: 'mikasa',
        name: '三笠·阿克曼',
        nameEn: 'Mikasa Ackerman',
        nameDe: 'Mikasa Ackermann',
        nameJa: 'ミカサ・アッカーマン',
        nameKo: '미카사 아커만',
        role: 'main',
        description: '艾伦的青梅竹马,战斗力强,深爱艾伦',
      },
      {
        id: 'armin',
        name: '阿尔敏·阿诺德',
        nameEn: 'Armin Arlert',
        nameDe: 'Armin Arlert',
        nameJa: 'アルミン・アルレルト',
        nameKo: '아르민 아를레르트',
        role: 'main',
        description: '智慧担当,继承超大型巨人,善良理性',
      },
      {
        id: 'levi',
        name: '利威尔·阿克曼',
        nameEn: 'Levi Ackerman',
        nameDe: 'Levi Ackermann',
        nameJa: 'リヴァイ・アッカーマン',
        nameKo: '리바이 아커만',
        role: 'supporting',
        description: '人类最强士兵,冷酷但重视同伴',
      },
      {
        id: 'reiner',
        name: '莱纳·布朗',
        nameEn: 'Reiner Braun',
        nameDe: 'Reiner Braun',
        nameJa: 'ライナー・ブラウン',
        nameKo: '라이너 브라운',
        role: 'supporting',
        description: '铠之巨人,双重身份,人格分裂',
      },
    ],
    popularPairings: [
      ['eren', 'levi'],
      ['eren', 'mikasa'],
      ['eren', 'armin'],
      ['levi', 'erwin'],
    ],
  },
  {
    id: 'the-king-avatar',
    name: '全职高手',
    nameEn: "The King's Avatar",
    nameDe: "The King's Avatar",
    nameJa: '全職高手',
    nameKo: '전직고수',
    category: 'novel',
    description: '电竞题材小说,讲述职业选手叶修重返巅峰的故事',
    worldview: '《荣耀》游戏世界,职业联赛,战队竞争,电竞文化',
    characters: [
      {
        id: 'ye-xiu',
        name: '叶修',
        nameEn: 'Ye Xiu',
        nameDe: 'Ye Xiu',
        nameJa: '葉修',
        nameKo: '예슈',
        role: 'main',
        description: '荣耀教科书,战术大师,一叶之秋操作者',
      },
      {
        id: 'zhou-zekai',
        name: '周泽楷',
        nameEn: 'Zhou Zekai',
        nameDe: 'Zhou Zekai',
        nameJa: '周澤楷',
        nameKo: '저우쩌카이',
        role: 'main',
        description: '枪王,轮回队长,沉默寡言但实力强大',
      },
      {
        id: 'huang-shaotian',
        name: '黄少天',
        nameEn: 'Huang Shaotian',
        nameDe: 'Huang Shaotian',
        nameJa: '黄少天',
        nameKo: '황샤오톈',
        role: 'supporting',
        description: '剑圣,话痨,蓝雨队副队长',
      },
      {
        id: 'yu-wenzhou',
        name: '喻文州',
        nameEn: 'Yu Wenzhou',
        nameDe: 'Yu Wenzhou',
        nameJa: '喩文州',
        nameKo: '위원저우',
        role: 'supporting',
        description: '蓝雨队长,战术大师,温和理性',
      },
      {
        id: 'sun-xiang',
        name: '孙翔',
        nameEn: 'Sun Xiang',
        nameDe: 'Sun Xiang',
        nameJa: '孫翔',
        nameKo: '순샹',
        role: 'supporting',
        description: '嘉世队长,继承一叶之秋,年轻气盛',
      },
    ],
    popularPairings: [
      ['ye-xiu', 'zhou-zekai'],
      ['ye-xiu', 'huang-shaotian'],
      ['yu-wenzhou', 'huang-shaotian'],
      ['ye-xiu', 'sun-xiang'],
    ],
  },
  {
    id: 'mo-dao-zu-shi',
    name: '魔道祖师',
    nameEn: 'Mo Dao Zu Shi',
    nameDe: 'Mo Dao Zu Shi',
    nameJa: '魔道祖師',
    nameKo: '마도조사',
    category: 'novel',
    description: '古风仙侠小说,讲述魏无羡与蓝忘机的前世今生',
    worldview: '修仙世界,五大世家,正道与魔道的对立,转世重生',
    characters: [
      {
        id: 'wei-wuxian',
        name: '魏无羡',
        nameEn: 'Wei Wuxian',
        nameDe: 'Wei Wuxian',
        nameJa: '魏無羨',
        nameKo: '위우셴',
        role: 'main',
        description: '夷陵老祖,魔道创始人,洒脱不羁,重情重义',
      },
      {
        id: 'lan-wangji',
        name: '蓝忘机',
        nameEn: 'Lan Wangji',
        nameDe: 'Lan Wangji',
        nameJa: '藍忘機',
        nameKo: '란왕지',
        role: 'main',
        description: '含光君,姑苏蓝氏二公子,清冷高洁,深情专一',
      },
      {
        id: 'jiang-cheng',
        name: '江澄',
        nameEn: 'Jiang Cheng',
        nameDe: 'Jiang Cheng',
        nameJa: '江澄',
        nameKo: '장청',
        role: 'supporting',
        description: '云梦江氏宗主,魏无羡的师弟,傲娇刀子嘴',
      },
      {
        id: 'lan-xichen',
        name: '蓝曦臣',
        nameEn: 'Lan Xichen',
        nameDe: 'Lan Xichen',
        nameJa: '藍曦臣',
        nameKo: '란시천',
        role: 'supporting',
        description: '泽芜君,姑苏蓝氏宗主,温文尔雅',
      },
      {
        id: 'nie-huaisang',
        name: '聂怀桑',
        nameEn: 'Nie Huaisang',
        nameDe: 'Nie Huaisang',
        nameJa: '聶懷桑',
        nameKo: '녜화이상',
        role: 'supporting',
        description: '清河聂氏宗主,表面废柴实则智谋深沉',
      },
    ],
    popularPairings: [
      ['wei-wuxian', 'lan-wangji'],
      ['jiang-cheng', 'lan-xichen'],
      ['nie-mingjue', 'jin-guangyao'],
    ],
  },
  {
    id: 'genshin-impact',
    name: '原神',
    nameEn: 'Genshin Impact',
    nameDe: 'Genshin Impact',
    nameJa: '原神',
    nameKo: '원신',
    category: 'game',
    description: '开放世界冒险游戏,七国世界观,元素战斗',
    worldview: '提瓦特大陆,七神与七国,元素力量,天理与深渊',
    characters: [
      {
        id: 'aether',
        name: '空',
        nameEn: 'Aether',
        nameDe: 'Aether',
        nameJa: '空',
        nameKo: '아이테르',
        role: 'main',
        description: '旅行者,寻找失散的妹妹,温柔坚定',
      },
      {
        id: 'zhongli',
        name: '钟离',
        nameEn: 'Zhongli',
        nameDe: 'Zhongli',
        nameJa: '鍾離',
        nameKo: '종려',
        role: 'main',
        description: '岩神摩拉克斯,博学睿智,优雅从容',
      },
      {
        id: 'childe',
        name: '达达利亚',
        nameEn: 'Tartaglia',
        nameDe: 'Tartaglia',
        nameJa: 'タルタリヤ',
        nameKo: '타르탈리아',
        role: 'supporting',
        description: '愚人众执行官,战斗狂热,重视家人',
      },
      {
        id: 'xiao',
        name: '魈',
        nameEn: 'Xiao',
        nameDe: 'Xiao',
        nameJa: '魈',
        nameKo: '샤오',
        role: 'supporting',
        description: '三眼五显仙人,守护璃月,孤独冷漠',
      },
      {
        id: 'venti',
        name: '温迪',
        nameEn: 'Venti',
        nameDe: 'Venti',
        nameJa: 'ウェンティ',
        nameKo: '벤티',
        role: 'main',
        description: '风神巴巴托斯,自由奔放,爱喝酒',
      },
    ],
    popularPairings: [
      ['aether', 'zhongli'],
      ['zhongli', 'childe'],
      ['xiao', 'venti'],
      ['aether', 'childe'],
    ],
  },
  {
    id: 'honkai-star-rail',
    name: '崩坏：星穹铁道',
    nameEn: 'Honkai: Star Rail',
    nameDe: 'Honkai: Star Rail',
    nameJa: '崩壊：スターレイル',
    nameKo: '붕괴: 스타레일',
    category: 'game',
    description: '星际冒险RPG,星穹列车穿越宇宙的旅程',
    worldview: '星穹列车,多个星球世界,星神信仰,开拓命途',
    characters: [
      {
        id: 'dan-heng',
        name: '丹恒',
        nameEn: 'Dan Heng',
        nameDe: 'Dan Heng',
        nameJa: '丹恒',
        nameKo: '단항',
        role: 'main',
        description: '列车守卫,冷静理智,隐藏身份',
      },
      {
        id: 'blade',
        name: '刃',
        nameEn: 'Blade',
        nameDe: 'Blade',
        nameJa: '刃',
        nameKo: '블레이드',
        role: 'supporting',
        description: '星核猎手,不死之身,复仇与痛苦',
      },
      {
        id: 'jing-yuan',
        name: '景元',
        nameEn: 'Jing Yuan',
        nameDe: 'Jing Yuan',
        nameJa: '景元',
        nameKo: '경원',
        role: 'supporting',
        description: '云骑将军,睿智老练,爱睡觉',
      },
      {
        id: 'caelus',
        name: '穹',
        nameEn: 'Caelus',
        nameDe: 'Caelus',
        nameJa: '穹',
        nameKo: '카엘루스',
        role: 'main',
        description: '开拓者,星核容器,勇敢善良',
      },
      {
        id: 'aventurine',
        name: '砂金',
        nameEn: 'Aventurine',
        nameDe: 'Aventurin',
        nameJa: 'アベンチュリン',
        nameKo: '아벤츄린',
        role: 'supporting',
        description: '公司石心十人,赌徒气质,神秘复杂',
      },
    ],
    popularPairings: [
      ['dan-heng', 'blade'],
      ['jing-yuan', 'blade'],
      ['caelus', 'dan-heng'],
      ['aventurine', 'ratio'],
    ],
  },
  {
    id: 'sherlock',
    name: '神探夏洛克',
    nameEn: 'Sherlock',
    nameDe: 'Sherlock',
    nameJa: 'SHERLOCK',
    nameKo: '셜록',
    category: 'movie',
    description: 'BBC现代改编版福尔摩斯,侦探推理剧',
    worldview: '现代伦敦,贝克街221B,犯罪与推理',
    characters: [
      {
        id: 'sherlock',
        name: '夏洛克·福尔摩斯',
        nameEn: 'Sherlock Holmes',
        nameDe: 'Sherlock Holmes',
        nameJa: 'シャーロック・ホームズ',
        nameKo: '셜록 홈즈',
        role: 'main',
        description: '咨询侦探,高智商反社会人格,观察入微',
      },
      {
        id: 'john',
        name: '约翰·华生',
        nameEn: 'John Watson',
        nameDe: 'John Watson',
        nameJa: 'ジョン・ワトソン',
        nameKo: '존 왓슨',
        role: 'main',
        description: '军医,博客作者,夏洛克的室友和好友',
      },
      {
        id: 'mycroft',
        name: '麦考夫·福尔摩斯',
        nameEn: 'Mycroft Holmes',
        nameDe: 'Mycroft Holmes',
        nameJa: 'マイクロフト・ホームズ',
        nameKo: '마이크로프트 홈즈',
        role: 'supporting',
        description: '夏洛克的哥哥,英国政府高官,更聪明但懒惰',
      },
      {
        id: 'moriarty',
        name: '莫里亚蒂',
        nameEn: 'Jim Moriarty',
        nameDe: 'Jim Moriarty',
        nameJa: 'ジム・モリアーティ',
        nameKo: '짐 모리어티',
        role: 'supporting',
        description: '犯罪天才,夏洛克的宿敌,疯狂危险',
      },
    ],
    popularPairings: [
      ['sherlock', 'john'],
      ['sherlock', 'moriarty'],
      ['mycroft', 'lestrade'],
    ],
  },
  {
    id: 'demon-slayer',
    name: '鬼灭之刃',
    nameEn: 'Demon Slayer',
    nameDe: 'Demon Slayer',
    nameJa: '鬼滅の刃',
    nameKo: '귀멸의 칼날',
    category: 'anime',
    description: '大正时代的鬼杀队与鬼的战斗故事',
    worldview: '大正时代日本,鬼杀队组织,呼吸法,鬼舞辻无惨统治的鬼',
    characters: [
      {
        id: 'tanjiro',
        name: '灶门炭治郎',
        nameEn: 'Tanjiro Kamado',
        nameDe: 'Tanjiro Kamado',
        nameJa: '竈門炭治郎',
        nameKo: '카마도 탄지로',
        role: 'main',
        description: '主角,水之呼吸和日之呼吸使用者,善良温柔',
      },
      {
        id: 'giyu',
        name: '富冈义勇',
        nameEn: 'Giyu Tomioka',
        nameDe: 'Giyu Tomioka',
        nameJa: '冨岡義勇',
        nameKo: '토미오카 기유',
        role: 'supporting',
        description: '水柱,冷酷外表温柔内心,保护炭治郎',
      },
      {
        id: 'zenitsu',
        name: '我妻善逸',
        nameEn: 'Zenitsu Agatsuma',
        nameDe: 'Zenitsu Agatsuma',
        nameJa: '我妻善逸',
        nameKo: '아가츠마 젠이츠',
        role: 'main',
        description: '雷之呼吸,胆小但睡着后战力爆表',
      },
      {
        id: 'inosuke',
        name: '嘴平伊之助',
        nameEn: 'Inosuke Hashibira',
        nameDe: 'Inosuke Hashibira',
        nameJa: '嘴平伊之助',
        nameKo: '하시비라 이노스케',
        role: 'main',
        description: '兽之呼吸,野生儿,戴野猪头套',
      },
      {
        id: 'rengoku',
        name: '炼狱杏寿郎',
        nameEn: 'Kyojuro Rengoku',
        nameDe: 'Kyojuro Rengoku',
        nameJa: '煉獄杏寿郎',
        nameKo: '렌고쿠 쿄쥬로',
        role: 'supporting',
        description: '炎柱,热血正直,炎之呼吸大师',
      },
    ],
    popularPairings: [
      ['tanjiro', 'giyu'],
      ['rengoku', 'akaza'],
      ['zenitsu', 'nezuko'],
    ],
  },
  {
    id: 'one-piece',
    name: '海贼王',
    nameEn: 'One Piece',
    nameDe: 'One Piece',
    nameJa: 'ワンピース',
    nameKo: '원피스',
    category: 'anime',
    description: '海上冒险漫画,路飞寻找ONE PIECE成为海贼王',
    worldview: '伟大航路,恶魔果实,海贼、海军、革命军三方势力',
    characters: [
      {
        id: 'luffy',
        name: '蒙奇·D·路飞',
        nameEn: 'Monkey D. Luffy',
        nameDe: 'Monkey D. Ruffy',
        nameJa: 'モンキー・D・ルフィ',
        nameKo: '몽키 D. 루피',
        role: 'main',
        description: '草帽海贼团船长,橡胶果实能力者,乐观坚定',
      },
      {
        id: 'zoro',
        name: '罗罗诺亚·索隆',
        nameEn: 'Roronoa Zoro',
        nameDe: 'Lorenor Zorro',
        nameJa: 'ロロノア・ゾロ',
        nameKo: '로로노아 조로',
        role: 'main',
        description: '三刀流剑士,路痴,忠诚可靠',
      },
      {
        id: 'sanji',
        name: '香吉士',
        nameEn: 'Sanji',
        nameDe: 'Sanji',
        nameJa: 'サンジ',
        nameKo: '상디',
        role: 'main',
        description: '厨师,骑士精神,好色但绅士',
      },
      {
        id: 'law',
        name: '特拉法尔加·罗',
        nameEn: 'Trafalgar Law',
        nameDe: 'Trafalgar Law',
        nameJa: 'トラファルガー・ロー',
        nameKo: '트라팔가 로',
        role: 'supporting',
        description: '红心海贼团船长,手术果实能力者,冷静理智',
      },
      {
        id: 'ace',
        name: '波特卡斯·D·艾斯',
        nameEn: 'Portgas D. Ace',
        nameDe: 'Portgas D. Ace',
        nameJa: 'ポートガス・D・エース',
        nameKo: '포트거스 D. 에이스',
        role: 'supporting',
        description: '路飞的哥哥,火拳艾斯,烧烧果实',
      },
    ],
    popularPairings: [
      ['luffy', 'law'],
      ['zoro', 'sanji'],
      ['ace', 'sabo'],
    ],
  },
];

/**
 * Get work by ID
 */
export function getWorkById(id: string): PresetWork | undefined {
  return PRESET_WORKS.find(work => work.id === id);
}

/**
 * Get works by category
 */
export function getWorksByCategory(category: PresetWork['category']): PresetWork[] {
  return PRESET_WORKS.filter(work => work.category === category);
}

/**
 * Search works by name
 */
export function searchWorksByName(query: string): PresetWork[] {
  const lowerQuery = query.toLowerCase();
  return PRESET_WORKS.filter(
    work =>
      work.name.toLowerCase().includes(lowerQuery) ||
      work.nameEn.toLowerCase().includes(lowerQuery) ||
      work.nameDe.toLowerCase().includes(lowerQuery) ||
      work.nameJa.toLowerCase().includes(lowerQuery) ||
      work.nameKo.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all category types
 */
export const WORK_CATEGORIES = [
  { id: 'anime', name: '动漫', nameEn: 'Anime' },
  { id: 'novel', name: '小说', nameEn: 'Novel' },
  { id: 'movie', name: '影视', nameEn: 'Movie/TV' },
  { id: 'game', name: '游戏', nameEn: 'Game' },
] as const;

/**
 * Get character name by locale with fallback
 */
export function getCharacterName(character: { name: string; nameEn: string; nameDe?: string; nameJa?: string; nameKo?: string }, locale: string): string {
  switch (locale) {
    case 'zh':
      return character.name;
    case 'de':
      return character.nameDe || character.nameEn;
    case 'ja':
      return character.nameJa || character.nameEn;
    case 'ko':
      return character.nameKo || character.nameEn;
    default:
      return character.nameEn;
  }
}

/**
 * Get work name by locale with fallback
 */
export function getWorkName(work: { name: string; nameEn: string; nameDe?: string; nameJa?: string; nameKo?: string }, locale: string): string {
  switch (locale) {
    case 'zh':
      return work.name;
    case 'de':
      return work.nameDe || work.nameEn;
    case 'ja':
      return work.nameJa || work.nameEn;
    case 'ko':
      return work.nameKo || work.nameEn;
    default:
      return work.nameEn;
  }
}

/**
 * Get character by ID from a work
 */
export function getCharacterById(work: PresetWork, characterId: string) {
  return work.characters.find(c => c.id === characterId);
}
