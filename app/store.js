/* THE ONEA — shared data layer + bilingual presets */
(function () {
  const CFG = window.ONEA_CONFIG || {};
  const LIVE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);

  /* ---------- presets (bilingual) ---------- */
  const PRESETS = {
    skinType: {
      dry: { zh: "干性", en: "Dry" },
      combo_dry: { zh: "混合偏干", en: "Combination–dry" },
      combo: { zh: "混合性", en: "Combination" },
      combo_oily: { zh: "混合偏油", en: "Combination–oily" },
      oily: { zh: "油性", en: "Oily" },
      normal: { zh: "中性", en: "Normal" }
    },
    sensitivity: {
      none: { zh: "不敏感", en: "Not sensitive" },
      mild: { zh: "轻度敏感", en: "Mildly sensitive" },
      moderate: { zh: "中度敏感", en: "Moderately sensitive" },
      high: { zh: "高度敏感", en: "Highly sensitive" }
    },
    concerns: {
      barrier: { zh: "屏障受损", en: "Weakened barrier" },
      redness: { zh: "泛红", en: "Redness" },
      dehydration: { zh: "缺水紧绷", en: "Dehydration" },
      oil: { zh: "T区出油", en: "Oily T-zone" },
      acne: { zh: "痘痘", en: "Breakouts" },
      pores: { zh: "毛孔", en: "Visible pores" },
      blackheads: { zh: "黑头", en: "Blackheads" },
      dullness: { zh: "暗沉", en: "Dullness" },
      pigment: { zh: "色斑", en: "Pigmentation" },
      lines: { zh: "细纹", en: "Fine lines" },
      firmness: { zh: "松弛", en: "Loss of firmness" },
      puffiness: { zh: "浮肿", en: "Puffiness" }
    },
    avoid: {
      aha: { zh: "果酸", en: "AHAs" },
      bha: { zh: "水杨酸", en: "BHA" },
      retinoid: { zh: "A醇类", en: "Retinoids" },
      alcohol: { zh: "含酒精爽肤水", en: "Alcohol-based toners" },
      scrub: { zh: "磨砂去角质", en: "Physical scrubs" },
      vitc: { zh: "高浓度VC", en: "High-strength vitamin C" },
      fragrance: { zh: "香精", en: "Fragrance" },
      oils: { zh: "精油", en: "Essential oils" },
      hotwater: { zh: "热水洗脸", en: "Hot water on face" }
    }
  };

  const METRICS = [
    { key: "hydration", zh: "水分", en: "Hydration" },
    { key: "barrier", zh: "屏障", en: "Barrier" },
    { key: "redness", zh: "泛红", en: "Redness", lower: true },
    { key: "sebum", zh: "油脂（T区）", en: "Sebum (T-zone)", lower: true },
    { key: "elasticity", zh: "弹性", en: "Elasticity" }
  ];

  const JOURNEY = [
    { key: "analysis", zh: "皮肤分析", en: "Skin analysis" },
    { key: "plan", zh: "护理方案", en: "Treatment plan" },
    { key: "session", zh: "到店护理", en: "Session" },
    { key: "home", zh: "居家建议", en: "At-home ritual" },
    { key: "d30", zh: "30 天回访", en: "30-day check-in" },
    { key: "d90", zh: "90 天对比", en: "90-day comparison" },
    { key: "m6", zh: "6 个月总结", en: "6-month summary" }
  ];

  const bi = (zh = "", en = "") => ({ zh, en });

  function blankData() {
    return {
      since: new Date().toISOString().slice(0, 10),
      skinType: "", sensitivity: "",
      goal: bi(),
      concerns: [], avoid: [],
      metrics: Object.fromEntries(METRICS.map(m => [m.key, { first: null, now: null }])),
      journey: JOURNEY.map(() => ({ date: "", done: false, body: bi() })),
      ritual: { am: [], pm: [] },
      weekly: bi(),
      note: { text: bi(), date: "" },
      history: []
    };
  }

  function normPhone(p) {
    let d = String(p || "").replace(/\D/g, "");
    if (d.length === 11 && d[0] === "1") d = d.slice(1);
    return d;
  }

  /* ---------- demo seed ---------- */
  function seed() {
    const d = blankData();
    Object.assign(d, {
      since: "2026-10-08", skinType: "combo_dry", sensitivity: "mild",
      goal: bi("稳定屏障 · 减少泛红", "Calm the barrier · reduce redness"),
      concerns: ["barrier", "redness", "dehydration", "oil"],
      avoid: ["aha", "retinoid", "alcohol", "scrub"],
      metrics: {
        hydration: { first: 38, now: 56 }, barrier: { first: 41, now: 60 },
        redness: { first: 68, now: 45 }, sebum: { first: 64, now: 58 },
        elasticity: { first: 57, now: 61 }
      },
      journey: [
        { date: "2026-10-08", done: true, body: bi("仪器检测 + 面诊。主要问题是屏障偏弱、缺水导致的泛红与外油内干，而不是“油皮”。", "Device analysis and consultation. The main issue is a weakened, dehydrated barrier causing redness — not truly oily skin.") },
        { date: "2026-10-08", done: true, body: bi("先修护、后功效。前 6 周只做屏障与补水，暂停一切酸类与强功效产品。", "Repair first, results second. Six weeks of barrier and hydration work only; all acids and strong actives on pause.") },
        { date: "2026-10-15", done: true, body: bi("屏障修护护理 90 分钟：温和清洁、舒缓导入、淋巴引流手法、修护面膜。", "90-min barrier ritual: gentle cleanse, soothing infusion, lymphatic massage, repair mask.") },
        { date: "2026-10-15", done: true, body: bi("居家步骤精简为早 4 步、晚 3 步。已同步到「今日仪式」。", "Home routine simplified to 4 steps AM and 3 steps PM — now in your Daily Ritual.") },
        { date: "2026-11-14", done: true, body: bi("水分 +18，泛红明显下降。继续当前方案，下次可以尝试加入温和的 PHA。", "Hydration +18 and visibly less redness. Stay the course; a gentle PHA may come next.") },
        { date: "2027-01-13", done: false, body: bi("同角度拍照对比 + 再次检测，评估是否进入功效阶段（提亮 / 毛孔）。", "Same-angle photos and re-analysis to decide whether to move into a results phase (brightening / pores).") },
        { date: "2027-04-14", done: false, body: bi("整理半年的变化，制定下一阶段的长期护肤节奏。", "A look back at six months, and a long-term rhythm for what comes next.") }
      ],
      ritual: {
        am: [
          { t: bi("温水 / 温和洁面", "Lukewarm water / gentle cleanser"), s: bi("油不多的早上，只用清水也可以", "Water alone is fine on less oily mornings") },
          { t: bi("修护精华", "Repair serum"), s: bi("2–3 滴，按压吸收，不要搓", "2–3 drops, press in — don't rub") },
          { t: bi("保湿乳", "Moisturizing lotion"), s: bi("脸颊多一层，T区薄涂", "Extra on cheeks, thin on T-zone") },
          { t: bi("防晒 SPF 30+", "Sunscreen SPF 30+"), s: bi("冬天也要，阴天也要", "Winter and cloudy days too") }
        ],
        pm: [
          { t: bi("温和洁面", "Gentle cleanser"), s: bi("有防晒时先用卸妆乳", "Use cleansing milk first if wearing sunscreen") },
          { t: bi("修护精华", "Repair serum"), s: bi("和早上同一支", "Same as the morning") },
          { t: bi("修护面霜", "Repair cream"), s: bi("取一颗黄豆大小", "A pea-sized amount") }
        ]
      },
      weekly: bi("每周三、周日晚：洁面后加一次舒缓面膜，10 分钟即可，不需要每天敷。", "Wednesday & Sunday evenings: a soothing mask after cleansing, 10 minutes. No need for daily masks."),
      note: {
        text: bi("这一个月皮肤稳定很多，泛红退得比预期快。果酸棉片继续先停，别急着加东西——等 1 月对比完我们再一起决定下一步。",
          "Your skin has settled a lot this month and the redness faded faster than expected. Keep the acid pads on pause — no need to add anything yet. We'll decide the next step together after January's comparison."),
        date: "2026-11-14"
      },
      history: [
        { date: "2026-11-14", name: bi("30 天回访 + 补水焕活护理", "30-day check-in + hydration facial"), detail: bi("60 分钟 · 检测复查", "60 min · re-analysis") },
        { date: "2026-10-15", name: bi("屏障修护护理", "Barrier ritual"), detail: bi("90 分钟", "90 min") },
        { date: "2026-10-08", name: bi("首次皮肤分析", "First skin analysis"), detail: bi("面诊 + 仪器检测", "Consultation + device analysis") }
      ]
    });
    return [{ id: "demo-mia", name: "Mia", phone: "5195550123", code: "123456", data: d, updated_at: new Date().toISOString() }];
  }

  /* ---------- demo backend (this browser only) ---------- */
  let memDB = null;
  const DEMO_KEY = "onea:demo-db";
  function demoLoad() {
    if (memDB) return memDB;
    try { const v = localStorage.getItem(DEMO_KEY); memDB = v ? JSON.parse(v) : seed(); }
    catch (e) { memDB = seed(); }
    return memDB;
  }
  function demoSave() { try { localStorage.setItem(DEMO_KEY, JSON.stringify(memDB)); } catch (e) {} }

  /* ---------- supabase ---------- */
  let sbPromise = null;
  function sb() {
    if (sbPromise) return sbPromise;
    sbPromise = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      s.onload = () => res(window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
        auth: { persistSession: true, storageKey: "onea-admin" }
      }));
      s.onerror = () => { sbPromise = null; rej(new Error("network")); };
      document.head.appendChild(s);
    });
    return sbPromise;
  }

  const DB = {
    live: LIVE,

    async clientLogin(phone, code) {
      phone = normPhone(phone); code = String(code || "").trim();
      if (!LIVE) {
        const c = demoLoad().find(x => x.phone === phone && x.code === code);
        return c ? { ok: true, client: { id: c.id, name: c.name, data: c.data } } : { ok: false, error: "nomatch" };
      }
      try {
        const db = await sb();
        const { data, error } = await db.rpc("client_login", { p_phone: phone, p_code: code });
        if (error) return { ok: false, error: "network" };
        return data;
      } catch (e) { return { ok: false, error: "network" }; }
    },

    async adminSignIn(email, password) {
      if (!LIVE) return { ok: true };
      try {
        const db = await sb();
        const { error } = await db.auth.signInWithPassword({ email, password });
        return error ? { ok: false, error: error.message } : { ok: true };
      } catch (e) { return { ok: false, error: "network" }; }
    },
    async adminSession() {
      if (!LIVE) return false;
      try { const db = await sb(); const { data } = await db.auth.getSession(); return !!data.session; }
      catch (e) { return false; }
    },
    async adminSignOut() { if (LIVE) { try { (await sb()).auth.signOut(); } catch (e) {} } },

    async listClients() {
      if (!LIVE) return JSON.parse(JSON.stringify(demoLoad()));
      const db = await sb();
      const { data, error } = await db.from("clients").select("id,name,phone,code,data,updated_at").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    async saveClient(c) {
      const row = { name: c.name, phone: normPhone(c.phone), code: String(c.code).trim(), data: JSON.parse(JSON.stringify(c.data)), updated_at: new Date().toISOString() };
      if (!LIVE) {
        const all = demoLoad();
        if (c.id) { const i = all.findIndex(x => x.id === c.id); all[i] = { ...all[i], ...row }; return all[i]; }
        const n = { id: "c" + Date.now().toString(36), ...row }; all.unshift(n); demoSave(); return n;
      }
      const db = await sb();
      const q = c.id ? db.from("clients").update(row).eq("id", c.id).select().single()
                     : db.from("clients").insert(row).select().single();
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    async deleteClient(id) {
      if (!LIVE) { memDB = demoLoad().filter(x => x.id !== id); demoSave(); return; }
      const db = await sb();
      const { error } = await db.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    resetDemo() { memDB = seed(); demoSave(); },

    /* ---------- 预约（仅后台可读写） ---------- */
    async listBookings(fromISO) {
      if (!LIVE) { try { return JSON.parse(localStorage.getItem("onea:demo-bookings") || "[]").filter(b => Date.parse(b.end_at) >= Date.parse(fromISO)).sort((a,b)=>Date.parse(a.start_at)-Date.parse(b.start_at)); } catch (e) { return []; } }
      const db = await sb();
      try { await db.rpc("expire_bookings"); } catch (e) {}
      const { data, error } = await db.from("bookings").select("*").gte("end_at", fromISO).order("start_at", { ascending: true }).limit(500);
      if (error) throw error;
      return data;
    },
    async updateBooking(id, patch) {
      if (!LIVE) {
        const all = JSON.parse(localStorage.getItem("onea:demo-bookings") || "[]"); const b = all.find(x => x.id === id); Object.assign(b, patch);
        localStorage.setItem("onea:demo-bookings", JSON.stringify(all)); return b;
      }
      const db = await sb();
      const { data, error } = await db.from("bookings").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    async addBlock(startISO, endISO, note) {
      const row = { ref: "BLOCK-" + Math.random().toString(36).slice(2,7).toUpperCase(), status: "blocked", name: note || "占用", phone: "-",
                    items: [], total_min: 0, total_price: 0, start_at: startISO, end_at: endISO, block_end: endISO };
      if (!LIVE) {
        const all = JSON.parse(localStorage.getItem("onea:demo-bookings") || "[]"); row.id = "b" + Date.now(); all.push(row);
        localStorage.setItem("onea:demo-bookings", JSON.stringify(all)); return row;
      }
      const db = await sb();
      const { data, error } = await db.from("bookings").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    async deleteBooking(id) {
      if (!LIVE) { const all = JSON.parse(localStorage.getItem("onea:demo-bookings") || "[]").filter(x => x.id !== id); localStorage.setItem("onea:demo-bookings", JSON.stringify(all)); return; }
      const db = await sb();
      const { error } = await db.from("bookings").delete().eq("id", id);
      if (error) throw error;
    },

    /* ---------- 到店前问卷（仅后台可读） ---------- */
    async listIntakes() {
      if (!LIVE) { try { return JSON.parse(localStorage.getItem("onea:demo-intake") || "[]"); } catch (e) { return []; } }
      const db = await sb();
      const { data, error } = await db.from("intake_submissions").select("*").order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data;
    },
    async setIntakeHandled(id, handled) {
      if (!LIVE) {
        const all = await DB.listIntakes(); const x = all.find(i => i.id === id); if (x) x.handled = handled;
        try { localStorage.setItem("onea:demo-intake", JSON.stringify(all)); } catch (e) {} return;
      }
      const db = await sb();
      const { error } = await db.from("intake_submissions").update({ handled }).eq("id", id);
      if (error) throw error;
    },
    async deleteIntake(id) {
      if (!LIVE) {
        const all = (await DB.listIntakes()).filter(i => i.id !== id);
        try { localStorage.setItem("onea:demo-intake", JSON.stringify(all)); } catch (e) {} return;
      }
      const db = await sb();
      const { error } = await db.from("intake_submissions").delete().eq("id", id);
      if (error) throw error;
    },

    /* ---------- 顾客偏好档案（仅后台）：单独一张表，客人端读不到 ---------- */
    async getComfort(clientId) {
      if (!clientId) return null;
      if (!LIVE) {
        try { return (JSON.parse(localStorage.getItem("onea:demo-comfort") || "{}"))[clientId] || null; }
        catch (e) { return null; }
      }
      const db = await sb();
      const { data, error } = await db.from("client_comfort").select("*").eq("client_id", clientId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async saveComfort(clientId, c) {
      const row = {
        client_id: clientId,
        room_temp: c.room_temp || null, pressure: c.pressure || null, atmosphere: c.atmosphere || null,
        sensitivities: (c.sensitivities || "").trim() || null,
        touches: (c.touches || "").trim() || null,
        private_notes: (c.private_notes || "").trim() || null,
        consent: !!c.consent,
        updated_at: new Date().toISOString()
      };
      if (!LIVE) {
        let all = {};
        try { all = JSON.parse(localStorage.getItem("onea:demo-comfort") || "{}"); } catch (e) {}
        all[clientId] = row;
        try { localStorage.setItem("onea:demo-comfort", JSON.stringify(all)); } catch (e) {}
        return row;
      }
      const db = await sb();
      const { data, error } = await db.from("client_comfort").upsert(row, { onConflict: "client_id" }).select().single();
      if (error) throw error;
      return data;
    }
  };
  // persist demo writes made via saveClient
  const _save = DB.saveClient;
  DB.saveClient = async c => { const r = await _save(c); if (!LIVE) demoSave(); return r; };

  window.ONEA = { CFG, LIVE, PRESETS, METRICS, JOURNEY, DB, blankData, normPhone, bi };
})();
