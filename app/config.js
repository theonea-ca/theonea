/* ============================================================
   THE ONEA — 连接设置 / Connection settings
   ------------------------------------------------------------
   留空 = 演示模式（数据只存在当前浏览器，用来试用）
   填好 Supabase 的两项 = 正式模式（所有客人数据存在你的数据库）

   在 Supabase → Project Settings → API 里找到：
     Project URL        → supabaseUrl
     anon public key    → supabaseAnonKey
   （anon key 本来就是公开用的，可以放在网页里；
     千万不要放 service_role key。）
   ============================================================ */
window.ONEA_CONFIG = {
  supabaseUrl: "https://vfjmzfvlbvidnmqtvyhy.supabase.co",
  supabaseAnonKey: "sb_publishable_t3RNuxnxKeTHBKgzbGnluQ_eL7bu5em",

  // 客人端「预约」按钮、预填表等链接
  bookingUrl: "https://theonea.ca/book/",
  intakeUrl: "https://theonea.ca/intake.html",
  visitGuideUrl: "https://theonea.ca/guide/",
  websiteUrl: "https://theonea.ca",

  // 预约订金：客人用 Interac e-Transfer 发到这个邮箱
  emtEmail: "wyran0319@gmail.com",
  depositAmount: 30,

  // 发给客人的登录链接
  appUrl: "https://theonea.ca/app/",

  // ---------- 会员 Membership ----------
  // 来满几次自动成为会员（按「护理记录」里不同的日期计算）
  memberVisits: 3,
  // 最近一次到店后多少天内保持会员身份；过期只是暂停，下次到店自动恢复
  memberActiveDays: 365,
  // 会员福利（客人端显示，中英双语）
  memberPerks: [
    { zh: "每个换季一次 Shelf Edit 护肤柜整理", en: "A seasonal Shelf Edit of your skincare" },
    { zh: "优先预约热门时段", en: "Priority booking for popular times" }
  ]
};
