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
  // Square 收款链接（留空 = 不显示刷卡按钮）。在 Square 后台 → 在线 → 付款链接里创建，复制链接粘贴到这里
  // 预约订金 $30：显示在预约成功页，和 e-Transfer 并列
  depositPayUrl: "",
  // Shelf Edit：会员 $29 / 非会员 $49 各建一个链接，护肤柜页面会按客人身份显示对应的那个
  shelfEditPayUrl: { member: "", regular: "" },

  // 护肤柜页面「预约 Shelf Edit」按钮：预约系统里 Shelf Edit 项目的 id
  shelfEditService: "shelf_edit",

  // 发给客人的登录链接
  appUrl: "https://theonea.ca/app/",

  // ---------- 会员 Membership ----------
  // 来满几次自动成为会员（按「护理记录」里不同的日期计算）
  memberVisits: 3,
  // 最近一次到店后多少天内保持会员身份；过期只是暂停，下次到店自动恢复
  memberActiveDays: 365,
  // 会员福利（客人端显示，中英双语）
  memberPerks: [
    { zh: "每季度一次 Shelf Edit 护肤柜整理，会员价 $29", en: "One Shelf Edit each season at the member price, $29" },
    { zh: "优先预约热门时段", en: "Priority booking for popular times" }
  ],

  // ---------- 储值 Prepaid balance ----------
  // 充值档位（单位：加元）。改这里即可，不用改代码
  topupTiers: [
    { paid: 500, bonus: 20 },
    { paid: 1000, bonus: 50 }
  ],
  // 储值条款（客人端显示，中英双语）
  balanceTerms: [
    { zh: "储值为自愿预付，可用于 The ONEA 所有护理及加选项目。", en: "Prepaying is optional. Your balance can be used for any treatment or add-on at The ONEA." },
    { zh: "余额长期有效，不设有效期，也不收取任何手续费或管理费。", en: "Your balance never expires, and there are no service or maintenance fees." },
    { zh: "余额分为“储值金额”（您支付的金额）和“赠送额度”（充值时赠送）。付款时优先使用赠送额度。", en: "Your balance has two parts: Prepaid (the amount you paid) and Bonus (credit added when you top up). Bonus is used first when you pay." },
    { zh: "赠送额度不可兑换现金。", en: "Bonus credit has no cash value." },
    { zh: "未使用的储值金额不退还。", en: "Unused Prepaid amounts are non-refundable." },
    { zh: "使用余额付款时，仍可使用当次适用的一项优惠。充值赠送不与其他充值活动叠加。", en: "You may still use one eligible promotion per visit when paying with your balance. Top-up bonuses cannot be combined with other top-up offers." },
    { zh: "余额可转给家人或朋友使用，请联系我们办理。", en: "Your balance can be transferred to a family member or friend. Please contact us to arrange this." },
    { zh: "预约定金按定金政策单独处理，与余额分开。", en: "Booking deposits follow our deposit policy and are separate from your balance." },
    { zh: "您可以随时在 App 中查看余额和每一笔记录。", en: "You can check your balance and every transaction in the app at any time." },
    { zh: "如 The ONEA 停止营业，我们会提前通知并退还所有未使用的储值金额。", en: "If The ONEA closes, we will give advance notice and refund all unused Prepaid amounts." },
    { zh: "条款如有更新，不影响您已有的余额。", en: "Any future changes to these terms will not affect your existing balance." }
  ]
};
