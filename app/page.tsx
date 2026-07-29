"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "home" | "library" | "words" | "profile";
type ContentType = "文章" | "新闻" | "书籍" | "单词";

type Reading = {
  id: number;
  type: ContentType;
  level: string;
  minutes: number;
  title: string;
  subtitle: string;
  color: string;
  paragraphs: string[];
};

type WordInfo = {
  phonetic: string;
  meaning: string;
  example: string;
};

const readings: Reading[] = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
    type: "单词",
    level: "今日 10 词",
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

const dictionary: Record<string, WordInfo> = {
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

const icons = {
  home: "⌂",
  library: "▤",
  words: "◇",
  profile: "○",
};

function cleanWord(value: string) {
  return value.toLowerCase().replace(/[^a-z']/g, "");
}

function WordToken({ token, onSelect }: { token: string; onSelect: (word: string) => void }) {
  const cleaned = cleanWord(token);
  const clickable = Boolean(dictionary[cleaned]);
  return (
    <button
      className={`word-token ${clickable ? "has-definition" : ""}`}
      onClick={() => clickable && onSelect(cleaned)}
      disabled={!clickable}
      aria-label={clickable ? `查询 ${cleaned}` : undefined}
    >
      {token}
    </button>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [reader, setReader] = useState<Reading | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<string[]>(["perspective", "curiosity", "routine"]);
  const [goal, setGoal] = useState(20);
  const [minutes, setMinutes] = useState(13);
  const [filter, setFilter] = useState<ContentType | "全部">("全部");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedWords = window.localStorage.getItem("linguaday-words");
    const storedGoal = window.localStorage.getItem("linguaday-goal");
    const storedMinutes = window.localStorage.getItem("linguaday-minutes");
    if (storedWords) setSavedWords(JSON.parse(storedWords));
    if (storedGoal) setGoal(Number(storedGoal));
    if (storedMinutes) setMinutes(Number(storedMinutes));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem("linguaday-words", JSON.stringify(savedWords));
    window.localStorage.setItem("linguaday-goal", String(goal));
    window.localStorage.setItem("linguaday-minutes", String(minutes));
  }, [savedWords, goal, minutes, ready]);

  const progress = Math.min(100, Math.round((minutes / goal) * 100));
  const filteredReadings = useMemo(
    () => (filter === "全部" ? readings : readings.filter((item) => item.type === filter)),
    [filter]
  );

  function openReading(item: Reading) {
    setReader(item);
    setMinutes((value) => Math.min(value + 1, 99));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleSave(word: string) {
    setSavedWords((words) =>
      words.includes(word) ? words.filter((item) => item !== word) : [word, ...words]
    );
  }

  function pronounce(word: string) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(word);
      speech.lang = "en-US";
      speech.rate = 0.82;
      window.speechSynthesis.speak(speech);
    }
  }

  if (reader) {
    return (
      <main className="app-shell reader-shell">
        <header className="reader-topbar">
          <button className="icon-button" onClick={() => setReader(null)} aria-label="返回">
            ←
          </button>
          <div>
            <span>{reader.type}</span>
            <strong>{reader.level}</strong>
          </div>
          <button className="icon-button" aria-label="更多选项">•••</button>
        </header>

        <article className="reader">
          <div className="reader-kicker">{reader.type} · {reader.minutes} 分钟</div>
          <h1>{reader.title}</h1>
          <p className="reader-subtitle">{reader.subtitle}</p>
          <div className="reader-rule" />
          <div className="reading-tip"><span>☝</span> 点击带虚线的单词，即时查看释义</div>
          <div className="article-body">
            {reader.paragraphs.map((paragraph, index) => (
              <p key={index}>
                {paragraph.split(/(\s+)/).map((token, tokenIndex) =>
                  token.trim() ? (
                    <WordToken key={tokenIndex} token={token} onSelect={setSelectedWord} />
                  ) : (
                    token
                  )
                )}
              </p>
            ))}
          </div>
          <div className="reading-complete">
            <div className="complete-mark">✓</div>
            <div><strong>读到这里，很棒！</strong><span>今天又向目标前进了一步</span></div>
          </div>
        </article>

        {selectedWord && dictionary[selectedWord] && (
          <div className="sheet-backdrop" onClick={() => setSelectedWord(null)}>
            <section className="word-sheet" onClick={(event) => event.stopPropagation()}>
              <div className="sheet-handle" />
              <div className="word-sheet-title">
                <div>
                  <h2>{selectedWord}</h2>
                  <span>{dictionary[selectedWord].phonetic}</span>
                </div>
                <button className="sound-button" onClick={() => pronounce(selectedWord)} aria-label="播放读音">◖))</button>
              </div>
              <p className="meaning">{dictionary[selectedWord].meaning}</p>
              <div className="example">
                <span>例句</span>
                {dictionary[selectedWord].example}
              </div>
              <button
                className={`save-button ${savedWords.includes(selectedWord) ? "saved" : ""}`}
                onClick={() => toggleSave(selectedWord)}
              >
                {savedWords.includes(selectedWord) ? "✓ 已加入生词本" : "＋ 加入生词本"}
              </button>
            </section>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">L</div>
          <div><strong>LinguaDay</strong><span>每天进步一点点</span></div>
        </div>
        <div className="streak"><span>✦</span><strong>7</strong> 天</div>
      </header>

      <div className="page-content">
        {tab === "home" && (
          <section className="page-section">
            <div className="greeting">
              <p>晚上好，学习者</p>
              <h1>今天也和英语<br />见个面吧。</h1>
            </div>

            <div className="goal-card">
              <div className="goal-top">
                <div><span>今日学习</span><strong>{minutes}<small> / {goal} 分钟</small></strong></div>
                <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
                  <span>{progress}%</span>
                </div>
              </div>
              <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
              <p>{progress >= 100 ? "今日目标已完成，保持这个节奏！" : `再学 ${Math.max(goal - minutes, 0)} 分钟，就完成今日目标`}</p>
            </div>

            <div className="section-heading">
              <div><span>为你精选</span><h2>继续学习</h2></div>
              <button onClick={() => setTab("library")}>查看全部 →</button>
            </div>

            <button className="featured-card" onClick={() => openReading(readings[0])}>
              <div className="featured-copy">
                <div className="pill-row"><span>精选短文</span><span>{readings[0].level}</span></div>
                <h3>{readings[0].title}</h3>
                <p>{readings[0].subtitle}</p>
                <div className="read-meta"><span>约 {readings[0].minutes} 分钟</span><b>开始阅读 →</b></div>
              </div>
              <div className="feature-art">
                <span className="sun" />
                <span className="hill hill-one" />
                <span className="hill hill-two" />
                <span className="walker">♟</span>
              </div>
            </button>

            <div className="quick-grid">
              <button onClick={() => { setFilter("单词"); setTab("library"); }}>
                <span className="quick-icon amber">Aa</span>
                <div><strong>每日单词</strong><small>10 个新词</small></div><i>›</i>
              </button>
              <button onClick={() => setTab("words")}>
                <span className="quick-icon lilac">◇</span>
                <div><strong>生词复习</strong><small>{savedWords.length} 个待巩固</small></div><i>›</i>
              </button>
            </div>

            <div className="week-card">
              <div className="week-title"><div><strong>本周学习</strong><span>连续学习 7 天</span></div><b>84<small> 分钟</small></b></div>
              <div className="week-bars">
                {[55, 78, 48, 88, 70, 96, progress].map((height, index) => (
                  <div key={index}><i style={{ height: `${height}%` }} className={index === 6 ? "today" : ""} /><span>{["一","二","三","四","五","六","今"][index]}</span></div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === "library" && (
          <section className="page-section library-page">
            <div className="page-title"><span>沉浸式输入</span><h1>发现好内容</h1><p>从你感兴趣的内容开始，自然积累英语。</p></div>
            <div className="filter-row">
              {(["全部", "文章", "新闻", "书籍", "单词"] as const).map((item) => (
                <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>
              ))}
            </div>
            <div className="reading-list">
              {filteredReadings.map((item) => (
                <button className="reading-card" key={item.id} onClick={() => openReading(item)}>
                  <div className={`book-cover ${item.color}`}>
                    <span>{item.type}</span><b>{item.title.split(" ")[0]}</b><i />
                  </div>
                  <div className="reading-card-copy">
                    <div className="tiny-label">{item.type} · {item.level}</div>
                    <h3>{item.title}</h3>
                    <p>{item.subtitle}</p>
                    <div><span>◷ {item.minutes} 分钟</span><b>阅读 →</b></div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {tab === "words" && (
          <section className="page-section words-page">
            <div className="page-title"><span>你的语言收藏</span><h1>生词本</h1><p>今天复习一点，记忆会更牢。</p></div>
            <div className="word-summary">
              <div><strong>{savedWords.length}</strong><span>已收藏</span></div>
              <i />
              <div><strong>{Math.min(savedWords.length, 3)}</strong><span>今日待复习</span></div>
              <button onClick={() => savedWords[0] && setSelectedWord(savedWords[0])}>开始复习</button>
            </div>
            {savedWords.length === 0 ? (
              <div className="empty-state"><span>Aa</span><h3>生词本还是空的</h3><p>阅读时点击带虚线的单词，就能收藏到这里。</p><button onClick={() => setTab("library")}>去阅读</button></div>
            ) : (
              <div className="saved-list">
                {savedWords.map((word) => {
                  const info = dictionary[word];
                  if (!info) return null;
                  return (
                    <button key={word} onClick={() => setSelectedWord(word)}>
                      <span className="word-letter">{word.slice(0, 1).toUpperCase()}</span>
                      <div><strong>{word}</strong><small>{info.phonetic}</small><p>{info.meaning}</p></div>
                      <i onClick={(event) => { event.stopPropagation(); pronounce(word); }}>◖))</i>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedWord && dictionary[selectedWord] && (
              <div className="sheet-backdrop" onClick={() => setSelectedWord(null)}>
                <section className="word-sheet" onClick={(event) => event.stopPropagation()}>
                  <div className="sheet-handle" />
                  <div className="word-sheet-title"><div><h2>{selectedWord}</h2><span>{dictionary[selectedWord].phonetic}</span></div><button className="sound-button" onClick={() => pronounce(selectedWord)}>◖))</button></div>
                  <p className="meaning">{dictionary[selectedWord].meaning}</p>
                  <div className="example"><span>例句</span>{dictionary[selectedWord].example}</div>
                  <button className="save-button saved" onClick={() => toggleSave(selectedWord)}>移出生词本</button>
                </section>
              </div>
            )}
          </section>
        )}

        {tab === "profile" && (
          <section className="page-section profile-page">
            <div className="profile-hero">
              <div className="avatar">Li</div>
              <div><span>英语学习者</span><h1>我的学习</h1><p>已坚持学习 7 天</p></div>
            </div>
            <div className="stats-grid">
              <div><span>累计学习</span><strong>284<small> 分钟</small></strong><p>比上周 +18%</p></div>
              <div><span>掌握单词</span><strong>126<small> 个</small></strong><p>本周新增 24 个</p></div>
            </div>
            <div className="settings-card">
              <div className="settings-heading"><div><span>每日目标</span><strong>{goal} 分钟</strong></div><b>可随时调整</b></div>
              <input aria-label="每日学习目标" type="range" min="10" max="60" step="5" value={goal} onChange={(event) => setGoal(Number(event.target.value))} />
              <div className="range-labels"><span>轻松 10</span><span>专注 30</span><span>进阶 60</span></div>
            </div>
            <div className="achievement-card">
              <div className="medal">✦</div>
              <div><span>最新成就</span><h3>七日学习者</h3><p>连续七天与英语见面，做得漂亮！</p></div>
            </div>
            <div className="settings-list">
              <button><span>◎</span><div><strong>学习提醒</strong><small>每天 20:30</small></div><i>›</i></button>
              <button><span>文</span><div><strong>内容难度</strong><small>B1 · 中级</small></div><i>›</i></button>
              <button><span>◐</span><div><strong>发音偏好</strong><small>美式英语</small></div><i>›</i></button>
            </div>
          </section>
        )}
      </div>

      <nav className="bottom-nav" aria-label="主导航">
        {([
          ["home", "首页"],
          ["library", "阅读"],
          ["words", "生词本"],
          ["profile", "我的"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
            <span>{icons[key]}</span><small>{label}</small>
          </button>
        ))}
      </nav>
    </main>
  );
}
