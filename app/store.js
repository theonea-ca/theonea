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

  /* ---------- 护肤柜 / My Shelf ---------- */
  const SHELF = {
    category: {
      cleanser: { zh: "洁面 / 卸妆", en: "Cleanser / makeup remover" },
      toner: { zh: "化妆水 / 爽肤水", en: "Toner / essence water" },
      serum: { zh: "精华", en: "Serum" },
      moisturizer: { zh: "乳液 / 面霜", en: "Lotion / cream" },
      eye: { zh: "眼霜", en: "Eye cream" },
      sunscreen: { zh: "防晒", en: "Sunscreen" },
      exfoliant: { zh: "酸类 / 去角质", en: "Acids / exfoliant" },
      retinoid: { zh: "A醇 / 视黄醇", en: "Retinoid" },
      mask: { zh: "面膜", en: "Mask" },
      oil: { zh: "面部油", en: "Face oil" },
      tool: { zh: "美容仪 / 工具", en: "Device / tool" },
      other: { zh: "其他", en: "Other" }
    },
    usage: {
      am: { zh: "早上用", en: "Mornings" },
      pm: { zh: "晚上用", en: "Evenings" },
      both: { zh: "早晚都用", en: "Morning & evening" },
      weekly: { zh: "每周几次", en: "A few times a week" },
      sometimes: { zh: "偶尔用", en: "Now and then" },
      not_using: { zh: "目前没在用", en: "Not using now" }
    },
    verdict: {
      keep: { zh: "保留", en: "Keep" },
      pause: { zh: "暂停", en: "Pause" },
      duplicate: { zh: "重复", en: "Duplicate" },
      stop: { zh: "停用", en: "Stop" }
    },
    limit: 20
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
      history: [],
      member: { priorVisits: 0, prepaid: false, prepaidSince: "" }
    };
  }

  /* ---------- 会员计算 / membership ----------
     到店次数 = 「护理记录」里不重复的日期（今天及以前）+ 建档前的到店次数
     会员 = 储值客人，或到店满 memberVisits 次
     到店会员：最近一次到店后 memberActiveDays 天内有效，过期为「暂停」，下次到店自动恢复
     储值会员：一直有效 */
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  function membership(data, todayISO) {
    const need = Number(CFG.memberVisits) || 3;
    const activeDays = Number(CFG.memberActiveDays) || 365;
    const today = todayISO || ymd(new Date());
    const m = (data && data.member) || {};
    const dates = [...new Set(((data && data.history) || []).map(h => h && h.date).filter(d => d && d <= today))].sort();
    const prior = Math.max(0, Math.floor(Number(m.priorVisits) || 0));
    const visits = dates.length + prior;
    // 没有带日期的记录时，用建档日期代替最近到店日
    const lastVisit = dates.at(-1) || (prior > 0 ? (data.since || "") : "");
    let until = "";
    if (lastVisit) { const d = new Date(lastVisit + "T12:00:00"); d.setDate(d.getDate() + activeDays); until = ymd(d); }
    const prepaid = !!m.prepaid;
    const earned = visits >= need;
    let status = "guest";
    if (prepaid) status = "member";
    else if (earned) status = (!until || until >= today) ? "member" : "paused";
    return {
      status, prepaid, visits, need,
      toGo: Math.max(0, need - visits),
      via: prepaid ? "prepaid" : earned ? "visits" : "",
      // 成为会员的日期：储值日，或刚好来满第 need 次的那天
      since: prepaid ? (m.prepaidSince || "") : !earned ? "" : prior >= need ? (data.since || "") : (dates.at(need - prior - 1) || ""),
      lastVisit, until: prepaid ? "" : until
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
    },

    /* ---------- 储值余额：只记流水，金额以「分」存；写入只走数据库函数 ---------- */
    async listBalance(clientId) {
      if (!clientId) return [];
      if (!LIVE) return balDemo.rows(clientId);
      const db = await sb();
      const { data, error } = await db.from("balance_transactions").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data;
    },
    async balanceTopup(clientId, paidCents, bonusCents, method, note) {
      if (!LIVE) return balDemo.topup(clientId, paidCents, bonusCents, method, note);
      return balRpc("balance_topup", { p_client: clientId, p_paid_cents: paidCents, p_bonus_cents: bonusCents || 0, p_method: method || null, p_note: note || null });
    },
    async balanceRedeem(clientId, amountCents, ref, labelZh, labelEn, note) {
      if (!LIVE) return balDemo.redeem(clientId, amountCents, ref, labelZh, labelEn, note);
      return balRpc("balance_redeem", { p_client: clientId, p_amount_cents: amountCents, p_booking_ref: ref || null, p_label_zh: labelZh || null, p_label_en: labelEn || null, p_note: note || null });
    },
    async balanceAdjust(clientId, type, paidCents, bonusCents, note) {
      if (!LIVE) return balDemo.adjust(clientId, type, paidCents, bonusCents, note);
      return balRpc("balance_adjust", { p_client: clientId, p_type: type, p_paid_cents: paidCents || 0, p_bonus_cents: bonusCents || 0, p_note: note || "" });
    },
    /* ---------- 护肤柜：客人自己写（验证手机号+访问码），你在后台打标签 ---------- */
    async shelfList(phone, code) {
      if (!LIVE) { const c = demoFind(phone, code); return c ? { ok: true, limit: SHELF.limit, items: shelfDemo.rows(c.id) } : { ok: false, error: "nomatch" }; }
      return shelfRpc("shelf_list", { p_phone: normPhone(phone), p_code: String(code || "").trim() });
    },
    async shelfPhotos(phone, code, id) {
      if (!LIVE) { const c = demoFind(phone, code); if (!c) return { ok: false }; const p = shelfDemo.photos()[id] || {}; return { ok: true, front: p.front || null, ingredients: p.ingredients || null }; }
      return shelfRpc("shelf_photos_get", { p_phone: normPhone(phone), p_code: String(code || "").trim(), p_id: id });
    },
    // item: name, brand, category, usage, opened, note；照片键（thumb/front/ingredients）只在有改动时才带
    async shelfSave(phone, code, id, item) {
      if (!LIVE) {
        const c = demoFind(phone, code); if (!c) return { ok: false, error: "nomatch" };
        if (!String(item.name || "").trim()) return { ok: false, error: "name_required" };
        return shelfDemo.save(c.id, id, item);
      }
      return shelfRpc("shelf_save", { p_phone: normPhone(phone), p_code: String(code || "").trim(), p_id: id || null, p_item: item });
    },
    async shelfDelete(phone, code, id) {
      if (!LIVE) { const c = demoFind(phone, code); if (!c) return { ok: false, error: "nomatch" }; shelfDemo.del(c.id, id); return { ok: true }; }
      return shelfRpc("shelf_delete", { p_phone: normPhone(phone), p_code: String(code || "").trim(), p_id: id });
    },
    async shelfForClient(clientId) {   // 后台：不含大图
      if (!clientId) return [];
      if (!LIVE) return shelfDemo.rows(clientId);
      const db = await sb();
      const { data, error } = await db.from("shelf_items").select("id,client_id,name,brand,category,usage,opened,note,thumb,verdict,advice_zh,advice_en,created_at,updated_at,reviewed_at,needs_review").eq("client_id", clientId).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    async shelfPhotosAdmin(id) {
      if (!LIVE) { const p = shelfDemo.photos()[id] || {}; return { front: p.front || null, ingredients: p.ingredients || null }; }
      const db = await sb();
      const { data, error } = await db.from("shelf_photos").select("front,ingredients").eq("item_id", id).maybeSingle();
      if (error) throw error;
      return data || {};
    },
    async shelfPending() {   // { client_id: 待查看件数 }
      const rows = !LIVE ? shelfDemo.all().filter(needsReview) : await (async () => {
        const db = await sb();
        const { data, error } = await db.from("shelf_items").select("client_id").eq("needs_review", true).limit(2000);
        if (error) throw error; return data;
      })();
      return rows.reduce((m, r) => (m[r.client_id] = (m[r.client_id] || 0) + 1, m), {});
    },
    async shelfAdminDelete(id) {
      if (!LIVE) { shelfDemo.put(shelfDemo.all().filter(r => r.id !== id)); const ph = shelfDemo.photos(); delete ph[id]; shelfDemo.putPhotos(ph); return; }
      const db = await sb();
      const { error } = await db.from("shelf_items").delete().eq("id", id);
      if (error) throw error;
    },
    async shelfReview(id, verdict, zh, en) {
      if (!LIVE) return shelfDemo.review(id, verdict, zh, en);
      const db = await sb();
      const { data, error } = await db.rpc("shelf_review", { p_id: id, p_verdict: verdict || null, p_advice_zh: zh || "", p_advice_en: en || "" });
      if (error) throw new Error(String(error.message || "").includes("function") ? "请先在 Supabase 运行 shelf.sql" : error.message);
      return data;
    },

    async clientBalance(phone, code) {
      if (!LIVE) {
        const c = demoLoad().find(x => x.phone === normPhone(phone) && x.code === String(code || "").trim());
        if (!c) return { ok: false };
        const rows = balDemo.rows(c.id), s = balSum(rows);
        return { ok: true, paid: s.paid, bonus: s.bonus, tx: rows.map(r => ({ type: r.type, paid: r.paid_cents, bonus: r.bonus_cents, label_zh: r.label_zh, label_en: r.label_en, at: r.created_at })) };
      }
      try {
        const db = await sb();
        const { data, error } = await db.rpc("client_balance", { p_phone: normPhone(phone), p_code: String(code || "").trim() });
        if (error) return { ok: false, error: "network" };
        return data;
      } catch (e) { return { ok: false, error: "network" }; }
    }
  };

  /* ---------- 储值：共用工具 + 演示模式 ---------- */
  const balSum = rows => rows.reduce((s, r) => ({ paid: s.paid + (r.paid_cents || 0), bonus: s.bonus + (r.bonus_cents || 0) }), { paid: 0, bonus: 0 });
  const BAL_ERR = { insufficient: "余额不足", note_required: "调整需要填写备注", bad_amount: "金额不正确", not_allowed: "请先登录后台" };
  async function balRpc(fn, args) {
    const db = await sb();
    const { data, error } = await db.rpc(fn, args);
    if (error) {
      const k = Object.keys(BAL_ERR).find(k => String(error.message || "").includes(k));
      throw new Error(k ? BAL_ERR[k] : (String(error.message || "").includes("function") ? "请先在 Supabase 运行 balance.sql" : error.message));
    }
    return data;
  }
  const balDemo = {
    KEY: "onea:demo-balance",
    all() { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
    put(rows) { try { localStorage.setItem(this.KEY, JSON.stringify(rows)); } catch (e) {} },
    rows(cid) { return this.all().filter(r => r.client_id === cid).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    add(cid, list) {
      const all = this.all(), now = Date.now();
      list.forEach((r, i) => all.push({ id: "t" + now.toString(36) + i, client_id: cid, paid_cents: 0, bonus_cents: 0, created_at: new Date(now + i).toISOString(), ...r }));
      this.put(all); const s = balSum(this.rows(cid)); return { paid: s.paid, bonus: s.bonus };
    },
    topup(cid, p, b, method, note) {
      if (!(p > 0) || b < 0) throw new Error(BAL_ERR.bad_amount);
      const list = [{ type: "topup", paid_cents: p, label_zh: "储值充值", label_en: "Top-up", method, note }];
      if (b > 0) list.push({ type: "bonus", bonus_cents: b, label_zh: "充值赠送", label_en: "Bonus" });
      return this.add(cid, list);
    },
    redeem(cid, amt, ref, zh, en, note) {
      if (!(amt > 0)) throw new Error(BAL_ERR.bad_amount);
      const s = balSum(this.rows(cid)); if (s.paid + s.bonus < amt) throw new Error(BAL_ERR.insufficient);
      const ub = Math.min(s.bonus, amt), up = amt - ub;
      const r = this.add(cid, [{ type: "redeem", paid_cents: -up, bonus_cents: -ub, booking_ref: ref, label_zh: zh, label_en: en, note }]);
      return { ...r, used_paid: up, used_bonus: ub };
    },
    adjust(cid, type, p, b, note) {
      if (!String(note || "").trim()) throw new Error(BAL_ERR.note_required);
      if (!p && !b) throw new Error(BAL_ERR.bad_amount);
      const s = balSum(this.rows(cid)); if (s.paid + p < 0 || s.bonus + b < 0) throw new Error(BAL_ERR.insufficient);
      return this.add(cid, [{ type, paid_cents: p, bonus_cents: b, label_zh: type === "refund" ? "余额退款" : "余额调整", label_en: type === "refund" ? "Refund" : "Adjustment", note }]);
    }
  };
  /* ---------- 护肤柜：共用工具 + 演示模式 ---------- */
  function demoFind(phone, code) { return demoLoad().find(x => x.phone === normPhone(phone) && x.code === String(code || "").trim()); }
  const needsReview = r => !r.reviewed_at || r.updated_at > r.reviewed_at;
  async function shelfRpc(fn, args) {
    try {
      const db = await sb();
      const { data, error } = await db.rpc(fn, args);
      if (error) return { ok: false, error: /function|schema cache/.test(String(error.message || "")) ? "not_ready" : "network" };
      return data;
    } catch (e) { return { ok: false, error: "network" }; }
  }
  const shelfDemo = {
    KEY: "onea:demo-shelf", PKEY: "onea:demo-shelf-photos",
    all() { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
    put(rows) { try { localStorage.setItem(this.KEY, JSON.stringify(rows)); return true; } catch (e) { return false; } },
    photos() { try { return JSON.parse(localStorage.getItem(this.PKEY) || "{}"); } catch (e) { return {}; } },
    putPhotos(p) { try { localStorage.setItem(this.PKEY, JSON.stringify(p)); return true; } catch (e) { return false; } },
    rows(cid) {
      const ph = this.photos();
      return this.all().filter(r => r.client_id === cid).map(r => ({ ...r, needs_review: needsReview(r),
        verdict: r.reviewed_at ? r.verdict : null, has_front: !!ph[r.id]?.front, has_ingredients: !!ph[r.id]?.ingredients }))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },
    save(cid, id, it) {
      const all = this.all(), now = new Date().toISOString();
      const fields = { name: String(it.name).trim(), brand: it.brand || "", category: it.category || "", usage: it.usage || "", opened: it.opened || "", note: it.note || "" };
      if (id) { const r = all.find(x => x.id === id && x.client_id === cid); if (!r) return { ok: false, error: "not_found" }; Object.assign(r, fields, { updated_at: now }); }
      else {
        if (all.filter(x => x.client_id === cid).length >= SHELF.limit) return { ok: false, error: "too_many" };
        id = "s" + Date.now().toString(36); all.push({ id, client_id: cid, ...fields, thumb: "", verdict: null, advice_zh: "", advice_en: "", created_at: now, updated_at: now, reviewed_at: null });
      }
      const r = all.find(x => x.id === id); if ("thumb" in it) r.thumb = it.thumb || "";
      const ph = this.photos(), p = ph[id] || {};
      if ("front" in it) p.front = it.front || null;
      if ("ingredients" in it) p.ingredients = it.ingredients || null;
      ph[id] = p;
      return this.put(all) && this.putPhotos(ph) ? { ok: true, id } : { ok: false, error: "photo_too_big" };
    },
    del(cid, id) { this.put(this.all().filter(r => !(r.id === id && r.client_id === cid))); const ph = this.photos(); delete ph[id]; this.putPhotos(ph); },
    review(id, verdict, zh, en) {
      const all = this.all(), r = all.find(x => x.id === id); if (!r) throw new Error("not_found");
      Object.assign(r, { verdict: verdict || null, advice_zh: zh || "", advice_en: en || "", reviewed_at: new Date(Date.now() + 1).toISOString() });
      this.put(all); return { ...r, needs_review: false };
    }
  };

  // persist demo writes made via saveClient
  const _save = DB.saveClient;
  DB.saveClient = async c => { const r = await _save(c); if (!LIVE) demoSave(); return r; };

  window.ONEA = { CFG, LIVE, PRESETS, SHELF, METRICS, JOURNEY, DB, blankData, normPhone, bi, membership, balSum };
})();
