"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Tab = "home" | "library" | "words" | "profile";
type ContentType = "文章" | "新闻" | "书籍" | "单词";
type Difficulty = "A2" | "B1" | "B2" | "C1";
type Accent = "en-US" | "en-GB";
type Panel = "reminder" | "difficulty" | "accent" | "reader" | null;

type Reading = {
  id: string;
  type: ContentType;
  level: string;
  minutes: number;
  title: string;
  subtitle: string;
  color: string;
  paragraphs: string[];
  sourceUrl?: string;
  publishedAt?: string;
  source?: "BBC News";
};

type WordInfo = {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
};

type BBCItem = {
  id: string;
  title: string;
  description: string;
  link: string;
  publishedAt: string;
};

type BBCFeed = {
  source: string;
  sourceUrl: string;
  updatedAt: string;
  items: BBCItem[];
};

type AppState = {
  savedWords: WordInfo[];
  goal: number;
  activity: Record<string, number>;
  completed: string[];
  reminderEnabled: boolean;
  reminderTime: string;
  difficulty: Difficulty;
  accent: Accent;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "linguaday-v4-state";

const DEFAULT_STATE: AppState = {
  savedWords: [],
  goal: 20,
  activity: {},
  completed: [],
  reminderEnabled: false,
  reminderTime: "20:30",
  difficulty: "B1",
  accent: "en-US",
};

const difficultyNames: Record<Difficulty, string> = {
  A2: "基础",
  B1: "中级",
  B2: "中高级",
  C1: "高级",
};

const readings: Reading[] = [
  {
    id: "walking",
    type: "文章",
    level: "B1 中级",
    minutes: 8,
    title: "Why Walking Helps Us Think",
    subtitle: "为什么散步能激发灵感？",
    color: "mint",
    paragraphs: [
      "Many people discover their best ideas while walking. A gentle rhythm helps the mind wander, and this freedom can encourage creative thinking.",
      "Scientists believe that movement increases blood flow and improves our mood. When we leave our desk, we also see new surroundings and notice details that we usually ignore.",
      "The next time you face a difficult problem, take a short walk. You may return with a fresh perspective and a surprisingly simple solution.",
    ],
  },
  {
    id: "quiet-cities",
    type: "新闻",
    level: "B2 中高级",
    minutes: 6,
    title: "Cities Create More Quiet Spaces",
    subtitle: "城市正在打造更多安静空间",
    color: "blue",
    paragraphs: [
      "Several cities are turning busy streets into peaceful public spaces. The projects add trees, benches and safe paths for people who walk or cycle.",
      "Local residents say the quieter areas make daily life more enjoyable. Small businesses have also welcomed the change because more people stop and explore their neighborhoods.",
    ],
  },
  {
    id: "secret-garden",
    type: "书籍",
    level: "B1 中级",
    minutes: 12,
    title: "The Secret Garden",
    subtitle: "《秘密花园》精选章节",
    color: "rose",
    paragraphs: [
      "Mary found a key buried in the soft earth. It looked old, and she wondered which door it might open.",
      "Behind the wall, the garden had been sleeping for years. Yet tiny green leaves were beginning to appear, promising that spring would soon arrive.",
      "For the first time in a long while, Mary felt curious and hopeful. She decided to bring the forgotten garden back to life.",
    ],
  },
  {
    id: "everyday-growth",
    type: "单词",
    level: "A2 基础",
    minutes: 5,
    title: "Everyday Growth",
    subtitle: "关于成长与好习惯的核心词汇",
    color: "amber",
    paragraphs: [
      "Curiosity encourages us to explore. A steady routine makes progress possible, while patience helps us continue when a challenge feels difficult.",
      "Confidence does not appear overnight. It grows whenever we practice, reflect and discover that we can do a little more than yesterday.",
    ],
  },
];

const localDictionary: Record<string, Omit<WordInfo, "word">> = {
  discover: { phonetic: "/dɪˈskʌvər/", meaning: "v. 发现；了解到", example: "We discover something new every day." },
  rhythm: { phonetic: "/ˈrɪðəm/", meaning: "n. 节奏；规律", example: "Walking has a gentle rhythm." },
  wander: { phonetic: "/ˈwɑːndər/", meaning: "v. 漫游；走神", example: "Let your mind wander for a moment." },
  freedom: { phonetic: "/ˈfriːdəm/", meaning: "n. 自由；自主", example: "Creative work needs freedom." },
  encourage: { phonetic: "/ɪnˈkɜːrɪdʒ/", meaning: "v. 鼓励；促进", example: "Good teachers encourage questions." },
  creative: { phonetic: "/kriˈeɪtɪv/", meaning: "adj. 有创造力的", example: "She found a creative solution." },
  movement: { phonetic: "/ˈmuːvmənt/", meaning: "n. 运动；移动", example: "Regular movement improves our health." },
  increases: { phonetic: "/ɪnˈkriːsɪz/", meaning: "v. 增加；提高", example: "Exercise increases blood flow." },
  improves: { phonetic: "/ɪmˈpruːvz/", meaning: "v. 改善；提高", example: "Practice improves your speaking." },
  surroundings: { phonetic: "/səˈraʊndɪŋz/", meaning: "n. 周围环境", example: "Notice your surroundings." },
  perspective: { phonetic: "/pərˈspektɪv/", meaning: "n. 视角；观点", example: "Travel gives us a new perspective." },
  surprisingly: { phonetic: "/sərˈpraɪzɪŋli/", meaning: "adv. 出人意料地", example: "The answer was surprisingly simple." },
  peaceful: { phonetic: "/ˈpiːsfəl/", meaning: "adj. 宁静的；和平的", example: "The park is quiet and peaceful." },
  residents: { phonetic: "/ˈrezɪdənts/", meaning: "n. 居民", example: "Local residents welcomed the park." },
  enjoyable: { phonetic: "/ɪnˈdʒɔɪəbəl/", meaning: "adj. 令人愉快的", example: "Reading can be very enjoyable." },
  neighborhoods: { phonetic: "/ˈneɪbərhʊdz/", meaning: "n. 社区；街区", example: "Trees make neighborhoods greener." },
  buried: { phonetic: "/ˈberid/", meaning: "adj. 被埋藏的", example: "The key was buried in the earth." },
  promising: { phonetic: "/ˈprɑːmɪsɪŋ/", meaning: "adj. 有希望的；有前途的", example: "The first results are promising." },
  curious: { phonetic: "/ˈkjʊriəs/", meaning: "adj. 好奇的", example: "Curious learners ask good questions." },
  forgotten: { phonetic: "/fərˈɡɑːtən/", meaning: "adj. 被遗忘的", example: "They found a forgotten garden." },
  curiosity: { phonetic: "/ˌkjʊriˈɑːsəti/", meaning: "n. 好奇心", example: "Curiosity makes learning exciting." },
  routine: { phonetic: "/ruːˈtiːn/", meaning: "n. 日常习惯；常规", example: "A simple routine builds progress." },
  progress: { phonetic: "/ˈprɑːɡres/", meaning: "n. 进步；进展", example: "Small steps create real progress." },
  patience: { phonetic: "/ˈpeɪʃəns/", meaning: "n. 耐心", example: "Language learning takes patience." },
  confidence: { phonetic: "/ˈkɑːnfɪdəns/", meaning: "n. 信心；自信", example: "Practice builds confidence." },
  reflect: { phonetic: "/rɪˈflekt/", meaning: "v. 反思；认真思考", example: "Take time to reflect on your day." },
};

const icons = { home: "⌂", library: "▤", words: "◇", profile: "○" };

function cleanWord(value: string) {
  return value.toLowerCase().replace(/[^a-z']/g, "");
}

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatFeedTime(value: string) {
  if (!value) return "等待首次更新";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "已更新";
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function WordToken({ token, onSelect }: { token: string; onSelect: (word: string) => void }) {
  const word = cleanWord(token);
  return (
    <button
      className={`word-token ${word ? "has-definition" : ""}`}
      onClick={() => word && onSelect(word)}
      disabled={!word}
      aria-label={word ? `查询 ${word}` : undefined}
    >
      {token}
    </button>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [reader, setReader] = useState<Reading | null>(null);
  const [readerFontSize, setReaderFontSize] = useState(19);
  const [readerLineHeight, setReaderLineHeight] = useState(1.9);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [lookupCache, setLookupCache] = useState<Record<string, WordInfo>>(() =>
    Object.fromEntries(Object.entries(localDictionary).map(([word, info]) => [word, { word, ...info }]))
  );
  const [lookupLoading, setLookupLoading] = useState(false);
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [filter, setFilter] = useState<ContentType | "全部">("全部");
  const [panel, setPanel] = useState<Panel>(null);
  const [ready, setReady] = useState(false);
  const [feed, setFeed] = useState<BBCFeed | null>(null);
  const [feedStatus, setFeedStatus] = useState<"loading" | "ready" | "offline">("loading");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const readerStartedAt = useRef(Date.now());
  const [sessionCompleted, setSessionCompleted] = useState(false);

  async function loadBBC() {
    setFeedStatus("loading");
    try {
      const response = await fetch("./bbc-news.json", { cache: "no-store" });
      if (!response.ok) throw new Error("BBC feed unavailable");
      setFeed(await response.json());
      setFeedStatus("ready");
    } catch {
      setFeedStatus("offline");
    }
  }

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setState({ ...DEFAULT_STATE, ...JSON.parse(stored) });
      else {
        window.localStorage.removeItem("linguaday-words");
        window.localStorage.removeItem("linguaday-minutes");
        window.localStorage.removeItem("linguaday-goal");
      }
    } catch {
      setState(DEFAULT_STATE);
    }
    setReady(true);
    loadBBC();

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    setIsInstalled(standalone);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  useEffect(() => {
    if (!state.reminderEnabled || !("Notification" in window)) return;
    const checkReminder = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const firedKey = `linguaday-reminder-${dateKey(now)}`;
      if (
        currentTime === state.reminderTime &&
        Notification.permission === "granted" &&
        !window.localStorage.getItem(firedKey)
      ) {
        new Notification("LinguaDay 学习提醒", { body: "今天也和英语见个面吧。", icon: "./icon-192.png" });
        window.localStorage.setItem(firedKey, "1");
      }
    };
    checkReminder();
    const timer = window.setInterval(checkReminder, 30000);
    return () => window.clearInterval(timer);
  }, [state.reminderEnabled, state.reminderTime]);

  const bbcReadings = useMemo<Reading[]>(
    () =>
      (feed?.items || []).map((item, index) => ({
        id: `bbc-${item.id || index}`,
        type: "新闻",
        level: `${state.difficulty} ${difficultyNames[state.difficulty]}`,
        minutes: Math.max(3, Math.min(8, Math.ceil(item.description.split(/\s+/).length / 35))),
        title: item.title,
        subtitle: item.description,
        color: index % 2 ? "blue" : "bbc",
        paragraphs: [item.description],
        sourceUrl: item.link,
        publishedAt: item.publishedAt,
        source: "BBC News",
      })),
    [feed, state.difficulty]
  );

  const allReadings = useMemo(() => [...bbcReadings, ...readings], [bbcReadings]);
  const filteredReadings = useMemo(
    () => (filter === "全部" ? allReadings : allReadings.filter((item) => item.type === filter)),
    [filter, allReadings]
  );

  const todayMinutes = state.activity[dateKey()] || 0;
  const totalMinutes = Object.values(state.activity).reduce((sum, value) => sum + value, 0);
  const progress = Math.min(100, Math.round((todayMinutes / state.goal) * 100));
  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return { key: dateKey(date), label: index === 6 ? "今" : ["日", "一", "二", "三", "四", "五", "六"][date.getDay()] };
    });
    const max = Math.max(...days.map((day) => state.activity[day.key] || 0), 1);
    return days.map((day) => ({ ...day, minutes: state.activity[day.key] || 0, height: Math.max(8, ((state.activity[day.key] || 0) / max) * 100) }));
  }, [state.activity]);
  const weekMinutes = week.reduce((sum, day) => sum + day.minutes, 0);
  const streak = useMemo(() => {
    let count = 0;
    const cursor = new Date();
    if (!state.activity[dateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
    while (state.activity[dateKey(cursor)] > 0) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [state.activity]);

  const selectedInfo = selectedWord ? lookupCache[selectedWord] : null;
  const savedSelected = selectedWord ? state.savedWords.some((item) => item.word === selectedWord) : false;
  const recommended = readings.find((item) => item.level.startsWith(state.difficulty)) || readings[0];

  function openReading(item: Reading) {
    setReader(item);
    setSessionCompleted(false);
    setPanel(null);
    readerStartedAt.current = Date.now();
    window.scrollTo({ top: 0 });
  }

  async function selectWord(word: string) {
    setSelectedWord(word);
    if (lookupCache[word]) return;
    setLookupLoading(true);
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!response.ok) throw new Error("not found");
      const result = await response.json();
      const entry = result[0];
      const definition = entry?.meanings?.[0]?.definitions?.[0];
      const info: WordInfo = {
        word,
        phonetic: entry?.phonetic || entry?.phonetics?.find((item: { text?: string }) => item.text)?.text || "暂无音标",
        meaning: definition?.definition || "暂未找到释义",
        example: definition?.example || `Tap the sound button to hear “${word}”.`,
      };
      setLookupCache((cache) => ({ ...cache, [word]: info }));
    } catch {
      setLookupCache((cache) => ({
        ...cache,
        [word]: { word, phonetic: "暂无音标", meaning: "暂未找到在线释义，可听发音或加入生词本。", example: `The selected word is “${word}”.` },
      }));
    } finally {
      setLookupLoading(false);
    }
  }

  function toggleSave(info: WordInfo) {
    setState((current) => ({
      ...current,
      savedWords: current.savedWords.some((item) => item.word === info.word)
        ? current.savedWords.filter((item) => item.word !== info.word)
        : [info, ...current.savedWords],
    }));
  }

  function pronounce(word: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(word);
    speech.lang = state.accent;
    speech.rate = 0.82;
    window.speechSynthesis.speak(speech);
  }

  function finishReading() {
    if (!reader || sessionCompleted) return;
    const elapsedMinutes = Math.max(1, Math.ceil((Date.now() - readerStartedAt.current) / 60000));
    setState((current) => ({
      ...current,
      activity: { ...current.activity, [dateKey()]: (current.activity[dateKey()] || 0) + elapsedMinutes },
      completed: current.completed.includes(reader.id) ? current.completed : [...current.completed, reader.id],
    }));
    setSessionCompleted(true);
  }

  async function enableReminder() {
    if (!("Notification" in window)) {
      window.alert("当前浏览器不支持系统通知，提醒时间仍会保存在应用中。");
      setState((current) => ({ ...current, reminderEnabled: true }));
      return;
    }
    const permission = await Notification.requestPermission();
    setState((current) => ({ ...current, reminderEnabled: permission === "granted" }));
    if (permission !== "granted") window.alert("未获得通知权限。你仍可稍后在浏览器设置中开启。");
  }

  async function installApp() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstallPrompt(null);
      return;
    }
    window.alert("请使用安卓 Chrome 打开右上角菜单，选择“安装应用”或“添加到主屏幕”。电脑 Chrome 也可以安装。");
  }

  const wordSheet = selectedWord && (
    <div className="sheet-backdrop" onClick={() => setSelectedWord(null)}>
      <section className="word-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        {lookupLoading && !selectedInfo ? (
          <div className="sheet-loading"><span className="spinner" />正在查询 {selectedWord}…</div>
        ) : selectedInfo ? (
          <>
            <div className="word-sheet-title">
              <div><h2>{selectedWord}</h2><span>{selectedInfo.phonetic}</span></div>
              <button className="sound-button" onClick={() => pronounce(selectedWord)} aria-label="播放读音">▶</button>
            </div>
            <p className="meaning">{selectedInfo.meaning}</p>
            <div className="example"><span>例句</span>{selectedInfo.example}</div>
            <button className={`save-button ${savedSelected ? "saved" : ""}`} onClick={() => toggleSave(selectedInfo)}>
              {savedSelected ? "✓ 已加入生词本（点击移除）" : "＋ 加入生词本"}
            </button>
          </>
        ) : null}
      </section>
    </div>
  );

  const settingsSheet = panel && (
    <div className="sheet-backdrop" onClick={() => setPanel(null)}>
      <section className="word-sheet settings-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        {panel === "reminder" && (
          <>
            <h2>学习提醒</h2>
            <p className="sheet-note">应用打开时可在设定时间发送系统通知；安卓系统可能限制后台网页提醒。</p>
            <label className="field-label">提醒时间<input type="time" value={state.reminderTime} onChange={(event) => setState((current) => ({ ...current, reminderTime: event.target.value }))} /></label>
            <button className="save-button" onClick={state.reminderEnabled ? () => setState((current) => ({ ...current, reminderEnabled: false })) : enableReminder}>
              {state.reminderEnabled ? "关闭提醒" : "开启提醒并授权通知"}
            </button>
          </>
        )}
        {panel === "difficulty" && (
          <>
            <h2>内容难度</h2>
            <p className="sheet-note">选择后，推荐内容和 BBC 新闻会使用相应难度标签。</p>
            <div className="choice-list">
              {(["A2", "B1", "B2", "C1"] as Difficulty[]).map((level) => (
                <button key={level} className={state.difficulty === level ? "active" : ""} onClick={() => { setState((current) => ({ ...current, difficulty: level })); setPanel(null); }}>
                  <b>{level}</b><span>{difficultyNames[level]}</span><i>{state.difficulty === level ? "✓" : ""}</i>
                </button>
              ))}
            </div>
          </>
        )}
        {panel === "accent" && (
          <>
            <h2>发音偏好</h2>
            <p className="sheet-note">影响单词发音按钮使用的语音口音。</p>
            <div className="choice-list">
              <button className={state.accent === "en-US" ? "active" : ""} onClick={() => { setState((current) => ({ ...current, accent: "en-US" })); setPanel(null); }}><b>US</b><span>美式英语</span><i>{state.accent === "en-US" ? "✓" : ""}</i></button>
              <button className={state.accent === "en-GB" ? "active" : ""} onClick={() => { setState((current) => ({ ...current, accent: "en-GB" })); setPanel(null); }}><b>UK</b><span>英式英语</span><i>{state.accent === "en-GB" ? "✓" : ""}</i></button>
            </div>
          </>
        )}
        {panel === "reader" && (
          <>
            <h2>阅读设置</h2>
            <label className="field-label">字号：{readerFontSize}px<input type="range" min="16" max="25" value={readerFontSize} onChange={(event) => setReaderFontSize(Number(event.target.value))} /></label>
            <label className="field-label">行距：{readerLineHeight.toFixed(1)}<input type="range" min="1.5" max="2.3" step="0.1" value={readerLineHeight} onChange={(event) => setReaderLineHeight(Number(event.target.value))} /></label>
            {reader?.sourceUrl && <a className="source-button" href={reader.sourceUrl} target="_blank" rel="noreferrer">在 BBC 阅读完整原文 ↗</a>}
            <button className={`save-button ${sessionCompleted ? "saved" : ""}`} onClick={finishReading}>{sessionCompleted ? "✓ 本次阅读已记录" : "完成阅读并记录时长"}</button>
          </>
        )}
      </section>
    </div>
  );

  if (reader) {
    return (
      <main className="app-shell reader-shell">
        <header className="reader-topbar">
          <button className="icon-button" onClick={() => setReader(null)} aria-label="返回">←</button>
          <div><span>{reader.source || reader.type}</span><strong>{reader.level}</strong></div>
          <button className="icon-button menu-dots" onClick={() => setPanel("reader")} aria-label="阅读设置">⋯</button>
        </header>
        <article className="reader">
          <div className="reader-kicker">{reader.source || reader.type} · 约 {reader.minutes} 分钟</div>
          <h1>{reader.title}</h1>
          <p className="reader-subtitle">{reader.source ? "BBC News 英文新闻摘要" : reader.subtitle}</p>
          {reader.publishedAt && <p className="published-at">发布于 {new Date(reader.publishedAt).toLocaleString("zh-CN")}</p>}
          <div className="reader-rule" />
          <div className="reading-tip"><span>☝</span> 所有英文单词均可点击查询、发音并收藏</div>
          <div className="article-body" style={{ "--reader-size": `${readerFontSize}px`, "--reader-line": readerLineHeight } as React.CSSProperties}>
            {reader.paragraphs.map((paragraph, index) => (
              <p key={index}>
                {paragraph.split(/(\s+)/).map((token, tokenIndex) => token.trim() ? <WordToken key={tokenIndex} token={token} onSelect={selectWord} /> : token)}
              </p>
            ))}
          </div>
          {reader.sourceUrl && <a className="source-button" href={reader.sourceUrl} target="_blank" rel="noreferrer">继续阅读 BBC 完整原文 ↗</a>}
          <button className={`reading-complete ${sessionCompleted ? "done" : ""}`} onClick={finishReading}>
            <div className="complete-mark">{sessionCompleted ? "✓" : "＋"}</div>
            <div><strong>{sessionCompleted ? "本次学习已记录" : "完成本次阅读"}</strong><span>{sessionCompleted ? "学习时长已加入今日统计" : "完成后才会计入真实学习数据"}</span></div>
          </button>
          {reader.source && <p className="bbc-credit">内容摘要来自 <a href="https://www.bbc.com/news" target="_blank" rel="noreferrer">BBC News</a>，版权归原作者所有。</p>}
        </article>
        {wordSheet}
        {settingsSheet}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand"><div className="brand-mark">L</div><div><strong>LinguaDay</strong><span>每天进步一点点</span></div></div>
        <div className="streak"><span>✦</span><strong>{streak}</strong> 天</div>
      </header>

      <div className="page-content">
        {tab === "home" && (
          <section className="page-section">
            <div className="greeting"><p>你好，学习者</p><h1>今天也和英语<br />见个面吧。</h1></div>
            <div className="goal-card">
              <div className="goal-top"><div><span>今日学习</span><strong>{todayMinutes}<small> / {state.goal} 分钟</small></strong></div><div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><span>{progress}%</span></div></div>
              <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
              <p>{progress >= 100 ? "今日目标已完成，保持这个节奏！" : `再学 ${Math.max(state.goal - todayMinutes, 0)} 分钟，就完成今日目标`}</p>
            </div>

            {!isInstalled && <button className="install-banner" onClick={installApp}><span className="install-app-icon">L</span><div><strong>安装 LinguaDay</strong><small>添加到手机或电脑桌面，支持基础离线打开</small></div><b>安装</b></button>}

            <div className="bbc-panel">
              <div className="bbc-panel-head"><div><b>BBC</b><span>NEWS · 英语阅读</span></div><button onClick={loadBBC} disabled={feedStatus === "loading"} aria-label="刷新 BBC 新闻">{feedStatus === "loading" ? "更新中" : "刷新 ↻"}</button></div>
              {feedStatus === "offline" ? <p>暂时无法更新新闻，已保留其他学习内容。请稍后重试。</p> : <p>最新摘要自动更新 · {formatFeedTime(feed?.updatedAt || "")}</p>}
              {bbcReadings[0] && <button className="bbc-headline" onClick={() => openReading(bbcReadings[0])}><strong>{bbcReadings[0].title}</strong><span>阅读摘要并查词 →</span></button>}
            </div>

            <div className="section-heading"><div><span>匹配 {state.difficulty} 难度</span><h2>为你推荐</h2></div><button onClick={() => setTab("library")}>查看全部 →</button></div>
            <button className="featured-card" onClick={() => openReading(recommended)}>
              <div className="featured-copy"><div className="pill-row"><span>精选短文</span><span>{recommended.level}</span></div><h3>{recommended.title}</h3><p>{recommended.subtitle}</p><div className="read-meta"><span>约 {recommended.minutes} 分钟</span><b>开始阅读 →</b></div></div>
              <div className="feature-art"><span className="sun" /><span className="hill hill-one" /><span className="hill hill-two" /><span className="walker">♟</span></div>
            </button>

            <div className="quick-grid">
              <button onClick={() => { setFilter("单词"); setTab("library"); }}><span className="quick-icon amber">Aa</span><div><strong>每日单词</strong><small>点击单词即可查询</small></div><i>›</i></button>
              <button onClick={() => setTab("words")}><span className="quick-icon lilac">◇</span><div><strong>生词复习</strong><small>{state.savedWords.length} 个待巩固</small></div><i>›</i></button>
            </div>

            <div className="week-card">
              <div className="week-title"><div><strong>近 7 天学习</strong><span>连续学习 {streak} 天</span></div><b>{weekMinutes}<small> 分钟</small></b></div>
              <div className="week-bars">{week.map((day, index) => <div key={day.key}><i style={{ height: `${day.height}%` }} className={index === 6 ? "today" : ""} /><span>{day.label}</span></div>)}</div>
            </div>
          </section>
        )}

        {tab === "library" && (
          <section className="page-section library-page">
            <div className="page-title"><span>BBC 新闻与精选内容</span><h1>发现好内容</h1><p>新闻摘要自动更新；完整原文从 BBC 官方网站打开。</p></div>
            <div className="feed-status"><span className={feedStatus} />BBC News：{feedStatus === "ready" ? `更新于 ${formatFeedTime(feed?.updatedAt || "")}` : feedStatus === "loading" ? "正在更新" : "暂时离线"}<button onClick={loadBBC}>刷新</button></div>
            <div className="filter-row">{(["全部", "文章", "新闻", "书籍", "单词"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
            <div className="reading-list">
              {filteredReadings.map((item) => (
                <button className="reading-card" key={item.id} onClick={() => openReading(item)}>
                  <div className={`book-cover ${item.color}`}><span>{item.source || item.type}</span><b>{item.source ? "BBC" : item.title.split(" ")[0]}</b><i /></div>
                  <div className="reading-card-copy"><div className="tiny-label">{item.source || item.type} · {item.level}</div><h3>{item.title}</h3><p>{item.subtitle}</p><div><span>◷ {item.minutes} 分钟</span><b>阅读 →</b></div></div>
                </button>
              ))}
            </div>
          </section>
        )}

        {tab === "words" && (
          <section className="page-section words-page">
            <div className="page-title"><span>你的真实收藏</span><h1>生词本</h1><p>只有你主动收藏的单词才会出现在这里。</p></div>
            <div className="word-summary"><div><strong>{state.savedWords.length}</strong><span>已收藏</span></div><i /><div><strong>{Math.min(state.savedWords.length, 3)}</strong><span>今日待复习</span></div><button disabled={!state.savedWords.length} onClick={() => state.savedWords[0] && selectWord(state.savedWords[0].word)}>开始复习</button></div>
            {!state.savedWords.length ? <div className="empty-state"><span>Aa</span><h3>生词本还是空的</h3><p>阅读时点击任意英文单词，就能查询并收藏到这里。</p><button onClick={() => setTab("library")}>去阅读</button></div> : (
              <div className="saved-list">{state.savedWords.map((info) => <button key={info.word} onClick={() => { setLookupCache((cache) => ({ ...cache, [info.word]: info })); setSelectedWord(info.word); }}><span className="word-letter">{info.word.slice(0, 1).toUpperCase()}</span><div><strong>{info.word}</strong><small>{info.phonetic}</small><p>{info.meaning}</p></div><i onClick={(event) => { event.stopPropagation(); pronounce(info.word); }}>▶</i></button>)}</div>
            )}
          </section>
        )}

        {tab === "profile" && (
          <section className="page-section profile-page">
            <div className="profile-hero"><div className="avatar">学</div><div><span>英语学习者</span><h1>我的学习</h1><p>{streak ? `已连续学习 ${streak} 天` : "从第一次真实学习开始记录"}</p></div></div>
            <div className="stats-grid"><div><span>累计学习</span><strong>{totalMinutes}<small> 分钟</small></strong><p>完成阅读后自动记录</p></div><div><span>生词本</span><strong>{state.savedWords.length}<small> 个</small></strong><p>仅统计你的收藏</p></div></div>
            <div className="settings-card"><div className="settings-heading"><div><span>每日目标</span><strong>{state.goal} 分钟</strong></div><b>可随时调整</b></div><input aria-label="每日学习目标" type="range" min="10" max="60" step="5" value={state.goal} onChange={(event) => setState((current) => ({ ...current, goal: Number(event.target.value) }))} /><div className="range-labels"><span>轻松 10</span><span>专注 30</span><span>进阶 60</span></div></div>
            <button className="pwa-card" onClick={installApp}><span className="install-app-icon">L</span><div><strong>{isInstalled ? "LinguaDay 已安装" : "安装到手机或电脑"}</strong><small>{isInstalled ? "可以从桌面直接打开" : "独立运行 · 桌面图标 · 基础离线使用"}</small></div><b>{isInstalled ? "✓" : "安装"}</b></button>
            {streak >= 7 && <div className="achievement-card"><div className="medal">✦</div><div><span>最新成就</span><h3>七日学习者</h3><p>连续七天与英语见面，做得漂亮！</p></div></div>}
            <div className="settings-list">
              <button onClick={() => setPanel("reminder")}><span>◎</span><div><strong>学习提醒</strong><small>{state.reminderEnabled ? `每天 ${state.reminderTime}` : "未开启"}</small></div><i>›</i></button>
              <button onClick={() => setPanel("difficulty")}><span>文</span><div><strong>内容难度</strong><small>{state.difficulty} · {difficultyNames[state.difficulty]}</small></div><i>›</i></button>
              <button onClick={() => setPanel("accent")}><span>◐</span><div><strong>发音偏好</strong><small>{state.accent === "en-US" ? "美式英语" : "英式英语"}</small></div><i>›</i></button>
            </div>
          </section>
        )}
      </div>

      <nav className="bottom-nav" aria-label="主导航">{([["home", "首页"], ["library", "阅读"], ["words", "生词本"], ["profile", "我的"]] as [Tab, string][]).map(([key, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><span>{icons[key]}</span><small>{label}</small></button>)}</nav>
      {wordSheet}
      {settingsSheet}
    </main>
  );
}
