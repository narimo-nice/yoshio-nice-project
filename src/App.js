import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase 設定 ──────────────────────────────────────────────
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Claude API ─────────────────────────────────────────────────
const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_KEY;

const SYSTEM_PROMPT = `あなたはYoshioの専属パーソナル秘書AIです。

【Yoshioのプロフィール】
- 名前：成毛喜男（よしお）、51歳、京都府与謝野町在住
- 仕事：株式会社マドック 営業＆マーケティング
- 健康：血圧高め（上140・下95〜100）、現在体重75kg→目標63kg（-12kg）
- 生活：5時起床・20時就寝・夕方散歩習慣あり
- 人生ビジョン：与謝野町の活性化に貢献・2030年春 町議会議員選挙 当選

【3本柱】
A. ダイエット：夜ご飯7割・早歩き週4〜5日・体重測定毎週
B. 与謝野町：SNS発信（Facebook週3・Instagram週2〜3・YouTube月2〜4本）・2030年出馬
C. マドック：建築板金業界向けAI講座（32万円/人・助成金82%OFF）・年間売上目標1億592万円

【秘書スタイル】
- 日本語で、親しみやすく・プロフェッショナルに
- バックキャスト思考で「今日すべき最善の行動」を提示
- 必要に応じて医師・経営コンサル・ライフコーチの視点を提供
- 回答は簡潔に（200字以内を目安）、必要に応じて箇条書き`;

// ── Styles ─────────────────────────────────────────────────────
const S = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#1B2A5E;--navy2:#2A3F7E;--em:#0A7C5E;--em2:#12A37D;
  --gold:#F5A623;--gold2:#FFD166;--pur:#7B5EA7;--red:#C0392B;
  --bg:#F0F4FF;--sur:#FFFFFF;--sur2:#F4F6FC;--bdr:#DDE3F0;
  --tx:#1B2A5E;--tx2:#4A5568;--tx3:#8896B0;--sw:220px;
}
body{font-family:'Noto Sans JP',sans-serif;background:var(--bg);color:var(--tx)}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:3px}
.shell{display:flex;min-height:100vh}
.sidebar{width:var(--sw);background:var(--navy);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;overflow-y:auto}
.slogo{padding:24px 20px 16px;border-bottom:1px solid rgba(255,255,255,.08)}
.slogo-t{font-family:'DM Serif Display',serif;font-size:15px;color:var(--gold);line-height:1.3}
.slogo-s{font-size:10px;color:rgba(255,255,255,.4);margin-top:3px;letter-spacing:1px;text-transform:uppercase}
.snav{padding:12px 0;flex:1}
.snav-lbl{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.3);padding:12px 20px 4px}
.nitem{display:flex;align-items:center;gap:10px;padding:10px 20px;cursor:pointer;border-left:3px solid transparent;transition:all .15s;font-size:13px;color:rgba(255,255,255,.6)}
.nitem:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.9)}
.nitem.active{border-left-color:var(--gold);background:rgba(245,166,35,.1);color:var(--gold);font-weight:700}
.sfooter{padding:16px 20px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:rgba(255,255,255,.3)}
.sfooter strong{color:rgba(255,255,255,.6);display:block;margin-bottom:2px}
.main{margin-left:var(--sw);flex:1;display:flex;flex-direction:column;min-height:100vh}
.topbar{background:var(--sur);border-bottom:1px solid var(--bdr);padding:0 28px;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:90}
.topbar-t{font-size:15px;font-weight:700;color:var(--navy)}
.topbar-d{font-size:12px;color:var(--tx3)}
.topbar-r{display:flex;align-items:center;gap:12px;position:relative}
.nbtn{width:34px;height:34px;border-radius:8px;background:var(--bg);border:1px solid var(--bdr);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;position:relative;transition:background .15s}
.nbtn:hover{background:var(--bdr)}
.nbadge{position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:var(--red);color:white;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace}
.avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--pur));display:flex;align-items:center;justify-content:center;font-size:13px;color:white;font-weight:700;cursor:pointer}
.content{padding:24px 28px;flex:1}
.card{background:var(--sur);border:1px solid var(--bdr);border-radius:12px;overflow:hidden;margin-bottom:16px}
.card-h{padding:16px 20px 12px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between}
.card-t{font-size:13px;font-weight:700;color:var(--navy)}
.card-b{padding:16px 20px}
.sgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}
.scard{background:var(--sur);border:1px solid var(--bdr);border-radius:12px;padding:16px;position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s}
.scard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(27,42,94,.1)}
.sacc{position:absolute;top:0;left:0;right:0;height:3px}
.slbl{font-size:11px;color:var(--tx3);margin-bottom:8px;font-weight:500}
.sval{font-size:26px;font-weight:900;font-family:'JetBrains Mono',monospace;line-height:1}
.ssub{font-size:11px;color:var(--tx3);margin-top:4px}
.schg{font-size:11px;font-weight:600;margin-top:6px}
.schg.up{color:var(--red)}.schg.dn{color:var(--em)}
.pbw{background:var(--bg);border-radius:99px;height:8px;overflow:hidden}
.pbf{height:100%;border-radius:99px;transition:width 1s ease}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.axcard{border-radius:12px;padding:16px;border:1px solid var(--bdr);background:var(--sur);transition:transform .15s}
.axcard:hover{transform:translateY(-2px)}
.axh{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.axic{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px}
.axt{font-size:13px;font-weight:700}
.axs{font-size:11px;color:var(--tx3)}
.tasks{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.task{display:flex;align-items:center;gap:8px;font-size:12px;padding:6px 8px;border-radius:6px;background:var(--bg);cursor:pointer;transition:background .12s}
.task:hover{background:var(--bdr)}
.task.done{opacity:.5;text-decoration:line-through}
.tck{width:16px;height:16px;border-radius:4px;border:2px solid var(--bdr);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;transition:all .15s}
.tck.on{background:var(--em);border-color:var(--em);color:white}
.je{border-left:3px solid var(--bdr);padding:10px 14px;margin-bottom:10px;border-radius:0 8px 8px 0;background:var(--bg)}
.je.today{border-left-color:var(--gold)}
.jd{font-size:10px;color:var(--tx3);margin-bottom:4px;font-family:'JetBrains Mono',monospace}
.jt{font-size:13px;line-height:1.6}
textarea.ji{width:100%;border:1px solid var(--bdr);border-radius:8px;padding:12px;font-size:13px;font-family:'Noto Sans JP',sans-serif;color:var(--tx);background:var(--bg);resize:vertical;min-height:80px;outline:none;transition:border-color .15s}
textarea.ji:focus{border-color:var(--navy)}
.rrow{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:10px}
.rf{display:flex;flex-direction:column;gap:4px}
.rl{font-size:10px;color:var(--tx3);font-weight:600;letter-spacing:.5px;text-transform:uppercase}
.ri{border:1px solid var(--bdr);border-radius:8px;padding:8px 10px;font-size:14px;font-family:'JetBrains Mono',monospace;font-weight:600;color:var(--navy);background:var(--bg);outline:none;transition:border-color .15s;width:100%}
.ri:focus{border-color:var(--navy);background:white}
.cwrap{display:flex;flex-direction:column;height:420px}
.cmsgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;background:var(--bg);border-radius:8px;margin-bottom:10px}
.cbub{max-width:85%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.6}
.cbub.user{align-self:flex-end;background:var(--navy);color:white;border-bottom-right-radius:3px}
.cbub.ai{align-self:flex-start;background:white;border:1px solid var(--bdr);color:var(--tx);border-bottom-left-radius:3px}
.ailbl{font-size:9px;font-weight:700;color:var(--gold);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
.cinrow{display:flex;gap:8px}
.cin{flex:1;border:1px solid var(--bdr);border-radius:8px;padding:10px 14px;font-size:13px;font-family:'Noto Sans JP',sans-serif;color:var(--tx);background:white;outline:none;transition:border-color .15s}
.cin:focus{border-color:var(--navy)}
.ldots{display:inline-flex;gap:4px}
.ldots span{width:6px;height:6px;border-radius:50%;background:var(--tx3);animation:bounce 1.2s infinite}
.ldots span:nth-child(2){animation-delay:.2s}.ldots span:nth-child(3){animation-delay:.4s}
@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
.btn{padding:9px 18px;border-radius:8px;font-size:13px;font-weight:700;font-family:'Noto Sans JP',sans-serif;border:none;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
.btn-p{background:var(--navy);color:white}.btn-p:hover{background:var(--navy2)}
.btn-g{background:var(--gold);color:var(--navy)}.btn-g:hover{background:var(--gold2)}
.btn-sm{padding:6px 12px;font-size:12px;border-radius:6px}
.btn-gh{background:transparent;border:1px solid var(--bdr);color:var(--tx2)}.btn-gh:hover{background:var(--bg)}
.npanel{position:absolute;top:48px;right:0;width:300px;background:white;border:1px solid var(--bdr);border-radius:12px;box-shadow:0 16px 48px rgba(27,42,94,.15);z-index:200;overflow:hidden}
.nph{padding:12px 16px;border-bottom:1px solid var(--bdr);font-size:12px;font-weight:700;color:var(--navy)}
.npi{padding:10px 16px;border-bottom:1px solid var(--bdr);display:flex;gap:10px;align-items:flex-start;font-size:12px;cursor:pointer;transition:background .12s}
.npi:hover{background:var(--bg)}.npi:last-child{border-bottom:none}
.npdot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px}
.nptx{color:var(--tx2);line-height:1.5}
.nptm{font-size:10px;color:var(--tx3);margin-top:2px;font-family:'JetBrains Mono',monospace}
.tag{display:inline-flex;padding:3px 8px;border-radius:99px;font-size:10px;font-weight:700}
.cdgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.cdcell{text-align:center;padding:10px 6px;border-radius:10px;border:1px solid var(--bdr);background:var(--sur)}
.cdyr{font-size:16px;font-weight:900;font-family:'JetBrains Mono',monospace}
.cdlbl{font-size:9px;color:var(--tx3);margin-top:2px}
.bchart{display:flex;gap:6px;align-items:flex-end;height:80px;padding:0 4px}
.bcol{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1}
.bar{width:100%;border-radius:4px 4px 0 0;transition:height .5s ease;min-height:4px}
.blbl{font-size:9px;color:var(--tx3);font-family:'JetBrains Mono',monospace}
.ph{margin-bottom:20px}
.ph h2{font-size:20px;font-weight:900;color:var(--navy)}
.ph p{font-size:13px;color:var(--tx3);margin-top:3px}
.toast{position:fixed;bottom:24px;right:24px;background:var(--navy);color:white;padding:12px 18px;border-radius:10px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:999;display:flex;align-items:center;gap:10px;animation:slideUp .3s ease;max-width:320px}
@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
.sdiv{height:1px;background:var(--bdr);margin:16px 0}
.loading{display:flex;align-items:center;justify-content:center;padding:40px;color:var(--tx3);font-size:13px}
`;

// ── Helpers ────────────────────────────────────────────────────
const DAYS = ["月","火","水","木","金","土","日"];
const today = new Date();
const todayStr = `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日（${DAYS[today.getDay()===0?6:today.getDay()-1]}）`;
const todayISO = today.toISOString().split("T")[0];

function PBar({ value, max, color = "var(--em)" }) {
  const pct = Math.min(100, (value / max) * 100);
  return <div className="pbw"><div className="pbf" style={{ width: `${pct}%`, background: color }} /></div>;
}

// ── Dashboard ──────────────────────────────────────────────────
function Dashboard({ tasks, setTasks, records, toast }) {
  const latest = records[records.length - 1] || {};
  const lw = latest.weight ?? 75.0;
  const diff = (75.2 - lw).toFixed(1);
  const done = Object.values(tasks).flat().filter(t => t.done).length;
  const total = Object.values(tasks).flat().length;

  const toggle = async (axis, id, cur) => {
    const { error } = await supabase.from("tasks").update({ done: !cur }).eq("id", id);
    if (!error) {
      setTasks(p => ({ ...p, [axis]: p[axis].map(t => t.id === id ? { ...t, done: !cur } : t) }));
      toast("タスク更新！");
    }
  };

  const axes = [
    { key: "body", label: "A. 身体", sub: "ダイエット戦略", color: "var(--em)", bg: "#E8F8F2", prog: (75.2 - lw) / 12 * 100 },
    { key: "town", label: "B. 与謝野町", sub: "2030年 議員出馬", color: "var(--pur)", bg: "#F3EEF8", prog: 8 },
    { key: "maddock", label: "C. マドック", sub: "AI講座・売上1億", color: "var(--navy)", bg: "#EEF1FA", prog: 15 },
  ];

  return (
    <div>
      <div className="ph"><h2>ダッシュボード</h2><p>{todayStr} ・ おはようございます、Yoshioさん！</p></div>
      <div className="sgrid">
        {[
          { lbl: "現在体重", val: lw, unit: "kg", sub: `目標63kgまで -${(lw-63).toFixed(1)}kg`, chg: `-${diff}kg 減量中`, cd: "dn", ac: "var(--em)" },
          { lbl: "最新血圧（上）", val: latest.bp_high ?? 140, unit: "", sub: "目標：正常域（130以下）", chg: "要医師相談 ⚠️", cd: "up", ac: "var(--red)" },
          { lbl: "今日のタスク", val: `${done}/${total}`, unit: "", sub: "完了済み", chg: done === total ? "全完了！" : `残り${total - done}件`, cd: done === total ? "dn" : "up", ac: "var(--gold)" },
          { lbl: "2030年まで", val: "約4年", unit: "", sub: "町議会議員 出馬まで", chg: "", ac: "var(--pur)" },
        ].map((s, i) => (
          <div key={i} className="scard">
            <div className="sacc" style={{ background: s.ac }} />
            <div className="slbl">{s.lbl}</div>
            <div className="sval" style={{ color: s.ac }}>{s.val}<span style={{ fontSize: 14, fontFamily: "Noto Sans JP", fontWeight: 400 }}>{s.unit}</span></div>
            <div className="ssub">{s.sub}</div>
            {s.chg && <div className={`schg ${s.cd}`}>{s.chg}</div>}
          </div>
        ))}
      </div>
      <div className="g3" style={{ marginBottom: 20 }}>
        {axes.map(ax => (
          <div key={ax.key} className="axcard">
            <div className="axh">
              <div className="axic" style={{ background: ax.bg }}>{ax.key === "body" ? "🏃" : ax.key === "town" ? "🌱" : "💼"}</div>
              <div><div className="axt" style={{ color: ax.color }}>{ax.label}</div><div className="axs">{ax.sub}</div></div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--tx3)", marginBottom: 4 }}>
                <span>進捗</span><span>{ax.prog.toFixed(0)}%</span>
              </div>
              <PBar value={ax.prog} max={100} color={ax.color} />
            </div>
            <div className="tasks">
              {tasks[ax.key].map(t => (
                <div key={t.id} className={`task ${t.done ? "done" : ""}`} onClick={() => toggle(ax.key, t.id, t.done)}>
                  <div className={`tck ${t.done ? "on" : ""}`}>{t.done ? "✓" : ""}</div>
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-h"><div className="card-t">2030年へのカウントダウン</div></div>
        <div className="card-b">
          <div className="cdgrid">
            {[
              { yr: "2026", lbl: "基盤構築", c: "var(--gold)", now: true },
              { yr: "2027", lbl: "成長加速", c: "#E07B39" },
              { yr: "2028", lbl: "影響力拡大", c: "var(--pur)" },
              { yr: "2029", lbl: "出馬準備", c: "var(--red)" },
              { yr: "2030", lbl: "当選！", c: "var(--em)" },
            ].map(y => (
              <div key={y.yr} className="cdcell" style={y.now ? { borderColor: y.c, background: "#FFFDF5" } : {}}>
                <div className="cdyr" style={{ color: y.c }}>{y.yr}</div>
                <div className="cdlbl">{y.lbl}</div>
                {y.now && <div style={{ fontSize: 9, color: "var(--gold)", marginTop: 3, fontWeight: 700 }}>← 今ここ</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Health ─────────────────────────────────────────────────────
function Health({ records, setRecords, toast }) {
  const [form, setForm] = useState({ weight: "", bpHigh: "", bpLow: "", walk: false });

  const save = async () => {
    if (!form.weight && !form.bpHigh) { toast("体重か血圧を入力してください"); return; }
    const rec = {
      recorded_at: todayISO,
      weight: parseFloat(form.weight) || null,
      bp_high: parseInt(form.bpHigh) || null,
      bp_low: parseInt(form.bpLow) || null,
      walked: form.walk,
    };
    const { data, error } = await supabase.from("health_records").insert(rec).select().single();
    if (!error) {
      setRecords(p => [...p, data]);
      setForm({ weight: "", bpHigh: "", bpLow: "", walk: false });
      toast("✅ 記録を保存しました！");
    } else {
      toast("エラーが発生しました");
    }
  };

  const maxW = Math.max(...records.map(r => r.weight || 75), 75);

  return (
    <div>
      <div className="ph"><h2>健康記録</h2><p>体重・血圧・運動の毎日の記録</p></div>
      <div className="card">
        <div className="card-h">
          <div className="card-t">今日の記録を入力</div>
          <span className="tag" style={{ background: "#E8F8F2", color: "var(--em)" }}>{todayStr}</span>
        </div>
        <div className="card-b">
          <div className="rrow">
            <div className="rf"><div className="rl">体重 (kg)</div><input className="ri" type="number" step="0.1" placeholder="74.0" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
            <div className="rf"><div className="rl">血圧（上）</div><input className="ri" type="number" placeholder="136" value={form.bpHigh} onChange={e => setForm({ ...form, bpHigh: e.target.value })} /></div>
            <div className="rf"><div className="rl">血圧（下）</div><input className="ri" type="number" placeholder="93" value={form.bpLow} onChange={e => setForm({ ...form, bpLow: e.target.value })} /></div>
            <div className="rf">
              <div className="rl">早歩き</div>
              <div onClick={() => setForm({ ...form, walk: !form.walk })} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: `1px solid ${form.walk ? "var(--em)" : "var(--bdr)"}`, borderRadius: 8, background: form.walk ? "#E8F8F2" : "var(--bg)", cursor: "pointer", height: 40 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${form.walk ? "var(--em)" : "var(--bdr)"}`, background: form.walk ? "var(--em)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11 }}>{form.walk ? "✓" : ""}</div>
                <span style={{ fontSize: 13, color: form.walk ? "var(--em)" : "var(--tx3)", fontWeight: form.walk ? 700 : 400 }}>実施</span>
              </div>
            </div>
          </div>
          <button className="btn btn-p" onClick={save}>記録を保存</button>
        </div>
      </div>
      <div className="g2">
        <div className="card">
          <div className="card-h"><div className="card-t">体重推移（過去7日）</div><span style={{ fontSize: 11, color: "var(--em)", fontWeight: 700 }}>目標: 63.0kg</span></div>
          <div className="card-b">
            <div className="bchart">
              {records.slice(-7).map((r, i) => {
                const h = Math.max(8, ((r.weight - 63) / (maxW - 63)) * 68);
                return (
                  <div key={i} className="bcol">
                    <div title={`${r.weight}kg`} className="bar" style={{ height: h, background: r.weight > 74.5 ? "var(--navy)" : "var(--em)" }} />
                    <div className="blbl">{(r.recorded_at || "").slice(5).replace("-", "/")}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--tx3)", marginBottom: 4 }}>
                <span>進捗（75.2kg → 63kg）</span>
                <span>{((75.2 - (records[records.length - 1]?.weight ?? 75)) / 12 * 100).toFixed(1)}%</span>
              </div>
              <PBar value={(75.2 - (records[records.length - 1]?.weight ?? 75))} max={12} color="var(--em)" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div className="card-t">最近の記録一覧</div></div>
          <div className="card-b" style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "var(--bg)" }}>{["日付", "体重", "血圧(上/下)", "早歩き"].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--tx3)", fontSize: 10, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
              <tbody>
                {[...records].reverse().slice(0, 7).map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--bdr)" }}>
                    <td style={{ padding: "8px 12px", color: "var(--tx2)" }}>{(r.recorded_at || "").slice(5).replace("-", "/")}</td>
                    <td style={{ padding: "8px 12px", fontFamily: "JetBrains Mono", fontWeight: 700, color: "var(--navy)" }}>{r.weight}</td>
                    <td style={{ padding: "8px 12px", fontFamily: "JetBrains Mono", color: r.bp_high >= 140 ? "var(--red)" : "var(--em)", fontWeight: 600 }}>{r.bp_high}/{r.bp_low}</td>
                    <td style={{ padding: "8px 12px" }}>{r.walked ? "✅" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div style={{ padding: 12, background: "#FFF5F5", border: "1px solid #FFCCCC", borderRadius: 10, fontSize: 12, color: "var(--red)" }}>
        <strong>【医師アドバイス】</strong> 血圧が上140前後の状態が続いています。早めに内科への受診を予約してください。
      </div>
    </div>
  );
}

// ── Goals ──────────────────────────────────────────────────────
function Goals({ tasks, setTasks, toast }) {
  const toggle = async (axis, id, cur) => {
    const { error } = await supabase.from("tasks").update({ done: !cur }).eq("id", id);
    if (!error) {
      setTasks(p => ({ ...p, [axis]: p[axis].map(t => t.id === id ? { ...t, done: !cur } : t) }));
      toast("タスク更新！");
    }
  };

  const goals = [
    { key: "body", label: "A. 身体・ダイエット", color: "var(--em)", bg: "#E8F8F2", milestones: [
      { text: "体重75kg → 63kg（-12kg）", target: "2026年末" },
      { text: "夕方30分早歩き 週4〜5日習慣化", target: "1ヶ月以内" },
      { text: "血圧：医師相談・服薬検討", target: "今月中" },
      { text: "体重-5kg達成（フェーズ1完了）", target: "3ヶ月以内" },
    ]},
    { key: "town", label: "B. 与謝野町貢献", color: "var(--pur)", bg: "#F3EEF8", milestones: [
      { text: "SNSプロフィール整備完了", target: "今週" },
      { text: "Facebook第1投稿 公開", target: "今週" },
      { text: "与謝野町商工会 加入", target: "今月" },
      { text: "新町長（佐賀氏）へのアプローチ", target: "来月" },
      { text: "町議会議員 選挙当選", target: "2030年春" },
    ]},
    { key: "maddock", label: "C. マドック 営業", color: "var(--navy)", bg: "#EEF1FA", milestones: [
      { text: "RCC顧客リスト抽出（社員5名以上）", target: "今週" },
      { text: "第1弾動画 撮影・公開", target: "今月" },
      { text: "AI講座 初受注（1社）", target: "来月" },
      { text: "年間売上目標 1億592万円 達成", target: "2026年度末" },
    ]},
  ];

  return (
    <div>
      <div className="ph"><h2>目標トラッカー</h2><p>A・B・C 3本柱のマイルストーン管理</p></div>
      {goals.map(g => {
        const gt = tasks[g.key] || [];
        const dn = gt.filter(t => t.done).length;
        return (
          <div key={g.key} className="card">
            <div className="card-h">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: g.color }} />
                <div className="card-t" style={{ color: g.color }}>{g.label}</div>
              </div>
              <span className="tag" style={{ background: g.bg, color: g.color }}>今日: {dn}/{gt.length} 完了</span>
            </div>
            <div className="card-b">
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx3)", marginBottom: 8, textTransform: "uppercase" }}>今日のタスク</div>
              <div className="tasks">
                {gt.map(t => (
                  <div key={t.id} className={`task ${t.done ? "done" : ""}`} onClick={() => toggle(g.key, t.id, t.done)}>
                    <div className={`tck ${t.done ? "on" : ""}`}>{t.done ? "✓" : ""}</div>
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>
              <div className="sdiv" />
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx3)", marginBottom: 8, textTransform: "uppercase" }}>マイルストーン</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {g.milestones.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "var(--bg)", borderRadius: 6, fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: g.color, opacity: 0.6 }} />
                      <span>{m.text}</span>
                    </div>
                    <span style={{ fontSize: 10, color: g.color, fontWeight: 700, background: g.bg, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap", marginLeft: 8 }}>{m.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Chat ───────────────────────────────────────────────────────
function Chat({ toast }) {
  const [msgs, setMsgs] = useState([{ role: "ai", text: "こんにちは、Yoshioさん！今日も絶好調ですか？何でも相談してください。バックキャスト思考で、今日の最善の行動を一緒に考えましょう。" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMsgs(p => [...p, { role: "user", text }]);
    setLoading(true);
    try {
      const history = msgs.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: SYSTEM_PROMPT, messages: [...history, { role: "user", content: text }] })
      });
      const data = await res.json();
      const reply = data.content?.find(c => c.type === "text")?.text ?? "エラーが発生しました";
      setMsgs(p => [...p, { role: "ai", text: reply }]);
    } catch { setMsgs(p => [...p, { role: "ai", text: "通信エラーが発生しました。" }]); }
    finally { setLoading(false); }
  };

  const quick = ["今日の体重を報告します", "モチベーションが下がっています", "AI講座の営業トークを教えて", "今週の優先アクションは？"];

  return (
    <div>
      <div className="ph"><h2>秘書AIチャット</h2><p>Yoshio専属の戦略秘書。何でも話しかけてください</p></div>
      <div className="card">
        <div className="card-h">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,var(--navy),var(--pur))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
            <div><div className="card-t">パーソナル秘書 AI</div><div style={{ fontSize: 10, color: "var(--em)", fontWeight: 700 }}>● オンライン</div></div>
          </div>
        </div>
        <div className="card-b">
          <div className="cwrap">
            <div className="cmsgs">
              {msgs.map((m, i) => (
                <div key={i} className={`cbub ${m.role}`}>
                  {m.role === "ai" && <div className="ailbl">秘書 AI</div>}
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                </div>
              ))}
              {loading && <div className="cbub ai"><div className="ailbl">秘書 AI</div><div className="ldots"><span /><span /><span /></div></div>}
              <div ref={ref} />
            </div>
            <div style={{ marginBottom: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {quick.map(q => <button key={q} className="btn btn-gh btn-sm" onClick={() => setInput(q)}>{q}</button>)}
            </div>
            <div className="cinrow">
              <input className="cin" placeholder="Yoshio秘書に話しかける..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} />
              <button className="btn btn-p" onClick={send} disabled={loading}>{loading ? "..." : "送信"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Journal ────────────────────────────────────────────────────
function Journal({ journals, setJournals, toast }) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("😊");
  const moods = ["😊", "💪", "😐", "😴", "🔥", "😤"];

  const save = async () => {
    if (!text.trim()) { toast("内容を入力してください"); return; }
    const { data, error } = await supabase.from("journals").insert({ recorded_at: todayISO, mood, content: text }).select().single();
    if (!error) {
      setJournals(p => [data, ...p]);
      setText(""); setMood("😊");
      toast("✅ 日誌を保存しました！");
    } else { toast("エラーが発生しました"); }
  };

  return (
    <div>
      <div className="ph"><h2>日誌</h2><p>毎日の振り返り・気づき・感謝を記録する</p></div>
      <div className="card">
        <div className="card-h">
          <div className="card-t">今日の日誌</div>
          <span className="tag" style={{ background: "#FFFDF5", color: "var(--gold)", border: "1px solid var(--gold)" }}>{todayStr}</span>
        </div>
        <div className="card-b">
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "var(--tx3)", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>今日の気分</div>
            <div style={{ display: "flex", gap: 8 }}>
              {moods.map(m => <button key={m} onClick={() => setMood(m)} style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${mood === m ? "var(--gold)" : "var(--bdr)"}`, background: mood === m ? "#FFFDF5" : "var(--bg)", fontSize: 18, cursor: "pointer" }}>{m}</button>)}
            </div>
          </div>
          <textarea className="ji" placeholder="今日の振り返りを書きましょう..." value={text} onChange={e => setText(e.target.value)} />
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button className="btn btn-p" onClick={save}>保存する</button>
            <button className="btn btn-gh" onClick={() => setText("")}>クリア</button>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-h"><div className="card-t">過去の日誌</div></div>
        <div className="card-b">
          {journals.length === 0 && <div style={{ fontSize: 13, color: "var(--tx3)", textAlign: "center", padding: 20 }}>まだ日誌がありません。今日から始めましょう！</div>}
          {journals.map((j, i) => (
            <div key={j.id || i} className={`je ${i === 0 ? "today" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div className="jd">{j.recorded_at}</div>
                <div style={{ fontSize: 18 }}>{j.mood}</div>
              </div>
              <div className="jt">{j.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────
const NOTIFS = [
  { id: 1, color: "#F5A623", text: "今日の早歩きはまだです！夕方17〜18時がおすすめ", time: "17:00", unread: true },
  { id: 2, color: "#0A7C5E", text: "体重記録を忘れずに。今週の測定日です", time: "07:00", unread: true },
  { id: 3, color: "#7B5EA7", text: "Facebook投稿日（水曜日）です！", time: "09:00", unread: false },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState({ body: [], town: [], maddock: [] });
  const [records, setRecords] = useState([]);
  const [journals, setJournals] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    const load = async () => {
      const [{ data: tr }, { data: hr }, { data: jr }] = await Promise.all([
        supabase.from("tasks").select("*").eq("task_date", todayISO).order("created_at"),
        supabase.from("health_records").select("*").order("recorded_at").limit(14),
        supabase.from("journals").select("*").order("recorded_at", { ascending: false }).limit(10),
      ]);
      if (tr) {
        setTasks({
          body: tr.filter(t => t.axis === "body"),
          town: tr.filter(t => t.axis === "town"),
          maddock: tr.filter(t => t.axis === "maddock"),
        });
      }
      if (hr) setRecords(hr);
      if (jr) setJournals(jr);
      setLoading(false);
    };
    load();
  }, []);

  const navItems = [
    { id: "dashboard", label: "ダッシュボード", icon: "🏠" },
    { id: "health", label: "健康記録", icon: "📊" },
    { id: "goals", label: "目標トラッカー", icon: "🎯" },
    { id: "chat", label: "秘書AIチャット", icon: "🤖" },
    { id: "journal", label: "日誌", icon: "📝" },
  ];
  const titles = { dashboard: "ダッシュボード", health: "健康記録", goals: "目標トラッカー", chat: "秘書AIチャット", journal: "日誌" };
  const unread = NOTIFS.filter(n => n.unread).length;

  return (
    <>
      <style>{S}</style>
      <div className="shell">
        <div className="sidebar">
          <div className="slogo">
            <div className="slogo-t">Yoshio Nice<br />Project</div>
            <div className="slogo-s">Personal Strategy HQ</div>
          </div>
          <div className="snav">
            <div className="snav-lbl">メニュー</div>
            {navItems.map(item => (
              <div key={item.id} className={`nitem ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
                <span>{item.icon}</span><span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="sfooter"><strong>成毛喜男（Yoshio）</strong><span>51歳 ・ 京都府与謝野町</span></div>
        </div>
        <div className="main">
          <div className="topbar">
            <div className="topbar-t">{titles[page]}</div>
            <div className="topbar-d">{todayStr}</div>
            <div className="topbar-r">
              <div className="nbtn" onClick={() => setShowNotif(!showNotif)}>
                🔔{unread > 0 && <div className="nbadge">{unread}</div>}
              </div>
              <div className="avatar">Y</div>
              {showNotif && (
                <div className="npanel">
                  <div className="nph">通知 ({unread}件未読)</div>
                  {NOTIFS.map(n => (
                    <div key={n.id} className="npi" style={{ background: n.unread ? "#FFFEF8" : "white" }}>
                      <div className="npdot" style={{ background: n.color }} />
                      <div><div className="nptx">{n.text}</div><div className="nptm">{n.time}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="content">
            {loading ? <div className="loading">データを読み込み中...</div> : (
              <>
                {page === "dashboard" && <Dashboard tasks={tasks} setTasks={setTasks} records={records} toast={showToast} />}
                {page === "health" && <Health records={records} setRecords={setRecords} toast={showToast} />}
                {page === "goals" && <Goals tasks={tasks} setTasks={setTasks} toast={showToast} />}
                {page === "chat" && <Chat toast={showToast} />}
                {page === "journal" && <Journal journals={journals} setJournals={setJournals} toast={showToast} />}
              </>
            )}
          </div>
        </div>
        {toast && <div className="toast"><span>✅</span><span>{toast}</span></div>}
      </div>
    </>
  );
}
