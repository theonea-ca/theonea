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
  bookingUrl: "https://theonea.setmore.com",
  intakeUrl: "https://theonea.ca/intake.html",
  visitGuideUrl: "https://theonea.ca/guide/",
  websiteUrl: "https://theonea.ca",

  // 预约订金：客人用 Interac e-Transfer 发到这个邮箱
  emtEmail: "wyran0319@gmail.com",
  depositAmount: 30,

  // 发给客人的登录链接
  appUrl: "https://theonea.ca/app/"
};
