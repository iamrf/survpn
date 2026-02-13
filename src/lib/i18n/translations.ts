// Translation keys and values for all supported languages

export type LanguageCode = 'fa' | 'en' | 'ar';

export interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    close: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    search: string;
    refresh: string;
    copy: string;
    copied: string;
    share: string;
  };

  // Navigation
  nav: {
    home: string;
    wallet: string;
    subscription: string;
    settings: string;
    admin: string;
  };

  // Home Page
  home: {
    title: string;
    welcome: string;
    selectPlan: string;
    customSubscription: string;
    activeSubscription: string;
    noSubscription: string;
    purchaseSuccess: string;
    purchaseError: string;
    somethingWentWrong: string;
    madeForFreedom: string;
    alwaysWithYou: string;
    wantCustomService: string;
    customServiceDescription: string;
    subscriptionActivatedImmediately: string;
    failedToProcessPurchase: string;
  };

  // Wallet Page
  wallet: {
    title: string;
    balance: string;
    topUp: string;
    withdraw: string;
    history: string;
    transactions: string;
    amount: string;
    paymentMethod: string;
    telegramStars: string;
    crypto: string;
    enterAmount: string;
    processing: string;
    checkingPayment: string;
    paymentSuccess: string;
    paymentPending: string;
    transactionCompleted: string;
    transactionPending: string;
    checkTransactions: string;
    referral: string;
    referralCode: string;
    referralLink: string;
    copyReferralCode: string;
    shareReferralLink: string;
    invalidAmount: string;
    userNotFound: string;
    paymentLinkError: string;
    telegramStarsNotAvailable: string;
    checkingPaymentStatus: string;
    paymentConfirmed: string;
    transactionAlreadyCompleted: string;
    waitingForConfirmation: string;
    checkingTransactions: string;
    withdrawAmount: string;
    withdrawPasskey: string;
    insufficientBalance: string;
    withdrawSuccess: string;
    withdrawError: string;
    cancelWithdraw: string;
    withdrawCancelled: string;
    referralStats: string;
    totalReferrals: string;
    totalCommissions: string;
    recentCommissions: string;
    referredUsers: string;
    registrationBonus: string;
    commissionRate: string;
    noTransactions: string;
    autoChecking: string;
    lastChecked: string;
    checkingNow: string;
    plisioPaymentLoading: string;
    cancelPayment: string;
    referralSystem: string;
    referralAndAffiliate: string;
    view: string;
    inviteFriends: string;
    commissionFromTransactions: string;
    commissionReceived: string;
    yourReferralCode: string;
    referralLink: string;
    copyLink: string;
    shareLink: string;
    referralStats: string;
    totalReferrals: string;
    totalCommissions: string;
    recentCommissions: string;
    referredUsers: string;
    registrationDate: string;
    transaction: string;
    registration: string;
    paid: string;
    pending: string;
    useThisLinkToRegister: string;
    withdrawableBalance: string;
    walletAddressNotSet: string;
    pleaseSetWalletAddress: string;
    withdrawWillBeProcessed: string;
    confirmAndSubmit: string;
    sending: string;
    recentTransactions: string;
    transactionsPending: string;
    autoCheckActive: string;
      lastCheck: string;
      referralSystem: string;
      referralAndAffiliate: string;
      view: string;
      inviteFriends: string;
      commissionFromTransactions: string;
      commissionReceived: string;
      yourReferralCode: string;
      copyLink: string;
      shareLink: string;
      registrationDate: string;
      transaction: string;
      registration: string;
      paid: string;
      pending: string;
      useThisLinkToRegister: string;
      withdrawableBalance: string;
      pleaseSetWalletAddress: string;
      withdrawWillBeProcessed: string;
      confirmAndSubmit: string;
      sending: string;
      recentTransactions: string;
      transactionsPending: string;
      autoCheckActive: string;
      lastCheckTime: string;
  };

  // Settings Page
  settings: {
    title: string;
    userInfo: string;
    name: string;
    username: string;
    phone: string;
    phoneNotVerified: string;
    verifyPhone: string;
    access: string;
    admin: string;
    user: string;
    referralCode: string;
    payment: string;
    walletAddress: string;
    walletAddressNotSet: string;
    clickToSet: string;
    withdrawalPasskey: string;
    passkeyNotSet: string;
    setPasskey: string;
    passkeySet: string;
    stats: string;
    accountBalance: string;
    language: string;
    selectLanguage: string;
    timeline: string;
    joinDate: string;
    lastSeen: string;
    logout: string;
    walletAddressPlaceholder: string;
    walletAddressWarning: string;
    passkeyPlaceholder: string;
    passkeyWarning: string;
    passkeyLength: string;
    languageChanged: string;
    walletUpdated: string;
    passkeySetSuccess: string;
    phoneVerified: string;
    phoneVerificationFailed: string;
    phoneVerificationCancelled: string;
    referralCodeCopied: string;
    subscriptionLinkCopied: string;
    qrCodeDescription: string;
    phoneChecking: string;
    phoneCheckingDescription: string;
    phoneNotReceived: string;
    telegramFeatureNotAvailable: string;
    cancelled: string;
  };

  // Subscription/Configs Page
  subscription: {
    title: string;
    mySubscription: string;
    active: string;
    inactive: string;
    expired: string;
    limited: string;
    disabled: string;
    subscriptionLink: string;
    copyLink: string;
    scanQR: string;
    servers: string;
    refreshServers: string;
    noServers: string;
    retry: string;
    configCopied: string;
    subscriptionUpdated: string;
    updateError: string;
    serversUpdated: string;
    loadingServers: string;
    serverCount: string;
    update: string;
    copy: string;
    copied: string;
    serverTip: string;
    subscriptionDescription: string;
    vpnServers: string;
    other: string;
    noSubscription: string;
    used: string;
  };

  // Admin Pages
  admin: {
    title: string;
    overview: string;
    users: string;
    transactions: string;
    withdrawals: string;
    deposits: string;
    totalUsers: string;
    totalDeposits: string;
    pendingWithdrawals: string;
    approve: string;
    reject: string;
    userDetails: string;
    balance: string;
    updateBalance: string;
    transactionHistory: string;
  };
  
  // Subscription Plan Component
  plan: {
    renew: string;
    purchaseAndActivate: string;
    instantActivation: string;
    traffic: string;
    validityPeriod: string;
    days: string;
    confirmPurchase: string;
    confirmPurchaseDescription: string;
    amountWillBeDeducted: string;
    yesConfirm: string;
    instantActivationNote: string;
    gb: string;
  };
  
  // Custom Subscription Drawer
  customSubscription: {
    title: string;
    createCustom: string;
    monthlyTraffic: string;
    validityPeriod: string;
    gb: string;
    days: string;
    cost: string;
    totalCost: string;
    currentBalance: string;
    balanceAfterPurchase: string;
    insufficientBalance: string;
    purchaseAndActivate: string;
    finalConfirmation: string;
    confirmDescription: string;
    trafficLabel: string;
    durationLabel: string;
    priceLabel: string;
    userNotFound: string;
    success: string;
    customSubscriptionCreated: string;
    error: string;
    subscriptionError: string;
    somethingWentWrong: string;
    min: string;
    max: string;
  };

  // Errors
  errors: {
    notFound: string;
    accessDenied: string;
    somethingWentWrong: string;
    tryAgain: string;
    networkError: string;
  };
}

export const translations: Record<LanguageCode, Translations> = {
  fa: {
    common: {
      loading: 'در حال بارگذاری...',
      error: 'خطا',
      success: 'موفقیت',
      cancel: 'انصراف',
      confirm: 'تایید',
      close: 'بستن',
      save: 'ذخیره',
      delete: 'حذف',
      edit: 'ویرایش',
      back: 'بازگشت',
      next: 'بعدی',
      search: 'جستجو',
      refresh: 'به‌روزرسانی',
      copy: 'کپی',
      copied: 'کپی شد',
      share: 'اشتراک‌گذاری',
    },
    nav: {
      home: 'خانه',
      wallet: 'کیف پول',
      subscription: 'اشتراک من',
      settings: 'تنظیمات',
      admin: 'مدیریت',
    },
    home: {
      title: 'خانه',
      welcome: 'خوش آمدید',
      selectPlan: 'انتخاب پلن',
      customSubscription: 'ساخت اشتراک سفارشی',
      activeSubscription: 'اشتراک فعال',
      noSubscription: 'اشتراکی فعال نیست',
      purchaseSuccess: 'خرید موفق',
      purchaseError: 'خطا در خرید',
      somethingWentWrong: 'مشکلی پیش آمد',
      madeForFreedom: 'ساخته شده برای آزادی',
      alwaysWithYou: 'سور وی پی ان همیشه همراه شماست',
      wantCustomService: 'سرویس اختصاصی می‌خواهید؟',
      customServiceDescription: 'اگر نیاز به حجم یا زمان متفاوتی دارید، پلن سفارشی خود را بسازید.',
      subscriptionActivatedImmediately: 'اشتراک بلافاصله پس از خرید فعال می‌شود',
      failedToProcessPurchase: 'پردازش خرید با خطا مواجه شد',
    },
    wallet: {
      title: 'کیف پول',
      balance: 'موجودی',
      topUp: 'شارژ',
      withdraw: 'برداشت',
      history: 'تاریخچه',
      transactions: 'تراکنش‌ها',
      amount: 'مبلغ',
      paymentMethod: 'روش پرداخت',
      telegramStars: 'ستاره تلگرام',
      crypto: 'کریپتو ( رمز ارز )',
      enterAmount: 'مبلغ را وارد کنید',
      processing: 'در حال پردازش...',
      checkingPayment: 'بررسی پرداخت',
      paymentSuccess: 'پرداخت موفق',
      paymentPending: 'در انتظار تایید',
      transactionCompleted: 'تراکنش تکمیل شده',
      transactionPending: 'در انتظار',
      checkTransactions: 'بررسی تراکنش‌ها',
      referral: 'معرفی',
      referralCode: 'کد معرف',
      referralLink: 'لینک معرفی',
      copyReferralCode: 'کپی کد معرف',
      shareReferralLink: 'اشتراک‌گذاری لینک معرفی',
      invalidAmount: 'لطفاً مبلغ معتبری وارد کنید',
      userNotFound: 'اطلاعات کاربر یافت نشد',
      paymentLinkError: 'خطا در ایجاد لینک پرداخت. لطفاً دوباره تلاش کنید.',
      telegramStarsNotAvailable: 'پرداخت با ستاره‌های تلگرام در این نسخه در دسترس نیست',
      checkingPaymentStatus: 'در حال بررسی وضعیت پرداخت شما...',
      paymentConfirmed: 'تراکنش {txId} تایید و به حساب شما اضافه شد',
      transactionAlreadyCompleted: 'این تراکنش قبلاً تایید شده است',
      waitingForConfirmation: 'پرداخت شما هنوز تایید نشده. لطفاً چند دقیقه صبر کنید و دوباره بررسی کنید.',
      checkingTransactions: 'پرداخت شما در حال بررسی است. لطفاً از دکمه بررسی تراکنش‌ها استفاده کنید.',
      withdrawAmount: 'مبلغ برداشت',
      withdrawPasskey: 'رمز عبور برداشت',
      insufficientBalance: 'موجودی ناکافی',
      withdrawSuccess: 'درخواست برداشت با موفقیت ثبت شد',
      withdrawError: 'خطا در ثبت درخواست برداشت',
      cancelWithdraw: 'لغو برداشت',
      withdrawCancelled: 'برداشت لغو شد',
      referralStats: 'آمار معرفی',
      totalReferrals: 'کل معرفی‌ها',
      totalCommissions: 'کل کمیسیون',
      recentCommissions: 'کمیسیون‌های اخیر',
      referredUsers: 'کاربران معرفی شده',
      registrationBonus: 'پاداش ثبت‌نام',
      commissionRate: 'نرخ کمیسیون',
      noTransactions: 'تراکنشی یافت نشد',
      autoChecking: 'بررسی خودکار',
      lastChecked: 'آخرین بررسی',
      checkingNow: 'در حال بررسی...',
      plisioPaymentLoading: 'در حال انتقال به صفحه پرداخت...',
      cancelPayment: 'لغو پرداخت',
    },
    settings: {
      title: 'تنظیمات',
      userInfo: 'اطلاعات کاربری',
      name: 'نام',
      username: 'نام کاربری',
      phone: 'شماره موبایل',
      phoneNotVerified: 'تایید نشده',
      verifyPhone: 'تایید شماره',
      access: 'دسترسی',
      admin: 'مدیر کل',
      user: 'کاربر',
      referralCode: 'کد معرف',
      payment: 'پرداخت و تسویه',
      walletAddress: 'آدرس ولت (برداشت وجه)',
      walletAddressNotSet: 'تنظیم نشده',
      clickToSet: 'کلیک کنید',
      withdrawalPasskey: 'رمز عبور برداشت',
      passkeyNotSet: 'تنظیم نشده (امنیت حساب)',
      setPasskey: 'تنظیم رمز عبور',
      passkeySet: '•••• (تنظیم شده)',
      stats: 'آمار و وضعیت',
      accountBalance: 'موجودی حساب',
      language: 'زبان برنامه',
      selectLanguage: 'انتخاب زبان',
      timeline: 'تاریخچه‌ی زمانی',
      joinDate: 'تاریخ عضویت',
      lastSeen: 'آخرین مشاهده',
      logout: 'خروج از حساب کاربری',
      walletAddressPlaceholder: 'آدرس کیف پول دیجیتال شما',
      walletAddressWarning: 'آدرس ولت پس از ثبت قابل تغییر نیست. برای تغییر با پشتیبانی تماس بگیرید.',
      passkeyPlaceholder: '----',
      passkeyWarning: 'رمز عبور برداشت پس از ثبت قابل تغییر نیست. برای تغییر با پشتیبانی تماس بگیرید.',
      passkeyLength: 'رمز عبور (۴ رقم)',
      languageChanged: 'زبان با موفقیت تغییر کرد',
      walletUpdated: 'آدرس ولت با موفقیت بروزرسانی شد',
      passkeySetSuccess: 'رمز عبور برداشت با موفقیت تنظیم شد',
      phoneVerified: 'شماره تماس شما با موفقیت تایید شد',
      phoneVerificationFailed: 'خطا در ثبت شماره تماس. لطفاً دوباره تلاش کنید.',
      phoneVerificationCancelled: 'تایید شماره تماس انجام نشد',
      referralCodeCopied: 'کد معرف شما در کلیپ‌بورد کپی شد',
      subscriptionLinkCopied: 'لینک اشتراک با موفقیت کپی شد',
      qrCodeDescription: 'این کد را در اپلیکیشن v2ray (مانند v2rayNG یا Shadowrocket) اسکن کنید تا تنظیمات به صورت خودکار اعمال شود.',
      phoneChecking: 'در حال بررسی...',
      phoneCheckingDescription: 'در حال دریافت اطلاعات از تلگرام',
      phoneNotReceived: 'شماره تماس دریافت نشد. لطفاً دوباره تلاش کنید.',
      telegramFeatureNotAvailable: 'قابلیت در این نسخه تلگرام در دسترس نیست',
      cancelled: 'لغو شد',
    },
    subscription: {
      title: 'اشتراک من',
      mySubscription: 'اشتراک من',
      active: 'فعال',
      inactive: 'غیرفعال',
      expired: 'منقضی شده',
      limited: 'محدود شده',
      disabled: 'غیرفعال',
      subscriptionLink: 'لینک اشتراک',
      copyLink: 'کپی لینک اشتراک',
      scanQR: 'اسکن کد QR',
      servers: 'سرورهای موجود',
      refreshServers: 'به‌روزرسانی',
      noServers: 'سروری یافت نشد',
      retry: 'تلاش مجدد',
      configCopied: 'کانفیگ {name} در حافظه کپی شد',
      subscriptionUpdated: 'اطلاعات اشتراک به‌روزرسانی شد',
      updateError: 'خطا در به‌روزرسانی اطلاعات',
      serversUpdated: 'لیست سرورها به‌روزرسانی شد',
      loadingServers: 'در حال بارگذاری سرورها...',
      serverCount: 'سرور',
      update: 'به‌روزرسانی',
      copy: 'کپی',
      copied: 'کپی شد',
      serverTip: '💡 هر سرور را می‌توانید به صورت جداگانه کپی کرده و در اپلیکیشن VPN خود وارد کنید. برای به‌روزرسانی لیست سرورها، دکمه به‌روزرسانی را بزنید.',
      subscriptionDescription: 'لینک اشتراک و سرورهای VPN',
      vpnServers: 'سرورهای VPN',
      other: 'سایر',
      used: 'استفاده شده',
    },
    admin: {
      title: 'مدیریت',
      overview: 'نمای کلی',
      users: 'کاربران',
      transactions: 'تراکنش‌ها',
      withdrawals: 'برداشت‌ها',
      deposits: 'سپرده‌ها',
      totalUsers: 'کل کاربران',
      totalDeposits: 'کل سپرده‌ها',
      pendingWithdrawals: 'برداشت‌های در انتظار',
      approve: 'تایید',
      reject: 'رد',
      userDetails: 'جزئیات کاربر',
      balance: 'موجودی',
      updateBalance: 'بروزرسانی موجودی',
      transactionHistory: 'تاریخچه تراکنش‌ها',
    },
    plan: {
      renew: 'تمدید',
      purchaseAndActivate: 'خرید و فعالسازی با یک کلیک',
      instantActivation: 'فعال‌سازی آنی',
      traffic: 'ترافیک / حجم',
      validityPeriod: 'مدت اعتبار',
      days: 'روز',
      confirmPurchase: 'تایید نهایی خرید',
      confirmPurchaseDescription: 'آیا از خرید اشتراک {planName} به مبلغ {price} دلار اطمینان دارید؟',
      amountWillBeDeducted: 'مبلغ مورد نظر از کیف پول شما کسر خواهد شد.',
      yesConfirm: 'بله، تایید و خرید',
      instantActivationNote: 'با یک کلیک به صورت آنی فعال می شود',
      gb: 'GB',
    },
    customSubscription: {
      title: 'اشتراک سفارشی',
      createCustom: 'ساخت اشتراک سفارشی',
      monthlyTraffic: 'ترافیک ماهانه',
      validityPeriod: 'مدت اعتبار',
      gb: 'گیگابایت',
      days: 'روز',
      cost: 'هزینه:',
      totalCost: 'مجموع هزینه',
      currentBalance: 'موجودی فعلی',
      balanceAfterPurchase: 'موجودی پس از خرید',
      insufficientBalance: 'موجودی ناکافی',
      purchaseAndActivate: 'خرید و فعال‌سازی',
      finalConfirmation: 'تایید نهایی',
      confirmDescription: 'آیا از خرید اشتراک سفارشی با مشخصات زیر اطمینان دارید؟',
      trafficLabel: 'ترافیک:',
      durationLabel: 'مدت:',
      priceLabel: 'هزینه:',
      userNotFound: 'کاربر یافت نشد',
      success: 'موفقیت',
      customSubscriptionCreated: 'اشتراک سفارشی با موفقیت ایجاد شد',
      error: 'خطا',
      subscriptionError: 'خطا در ایجاد اشتراک',
      somethingWentWrong: 'خطایی رخ داد',
      min: 'حداقل',
      max: 'حداکثر',
    },
    errors: {
      notFound: 'صفحه یافت نشد',
      accessDenied: 'دسترسی محدود',
      somethingWentWrong: 'مشکلی پیش آمد',
      tryAgain: 'لطفاً دوباره تلاش کنید',
      networkError: 'خطا در اتصال به سرور',
    },
  },

  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      search: 'Search',
      refresh: 'Refresh',
      copy: 'Copy',
      copied: 'Copied',
      share: 'Share',
    },
    nav: {
      home: 'Home',
      wallet: 'Wallet',
      subscription: 'My Subscription',
      settings: 'Settings',
      admin: 'Admin',
    },
    home: {
      title: 'Home',
      welcome: 'Welcome',
      selectPlan: 'Select Plan',
      customSubscription: 'Create Custom Subscription',
      activeSubscription: 'Active Subscription',
      noSubscription: 'No active subscription',
      purchaseSuccess: 'Purchase Successful',
      purchaseError: 'Purchase Error',
      somethingWentWrong: 'Something went wrong',
      madeForFreedom: 'Made for Freedom',
      alwaysWithYou: 'SurVPN is always with you',
      wantCustomService: 'Want a Custom Service?',
      customServiceDescription: 'If you need a different volume or duration, create your custom plan.',
      subscriptionActivatedImmediately: 'Subscription activates immediately after purchase',
      failedToProcessPurchase: 'Failed to process purchase',
    },
    wallet: {
      title: 'Wallet',
      balance: 'Balance',
      topUp: 'Top Up',
      withdraw: 'Withdraw',
      history: 'History',
      transactions: 'Transactions',
      amount: 'Amount',
      paymentMethod: 'Payment Method',
      telegramStars: 'Telegram Stars',
      crypto: 'Crypto',
      enterAmount: 'Enter amount',
      processing: 'Processing...',
      checkingPayment: 'Checking Payment',
      paymentSuccess: 'Payment Successful',
      paymentPending: 'Pending Confirmation',
      transactionCompleted: 'Transaction Completed',
      transactionPending: 'Pending',
      checkTransactions: 'Check Transactions',
      referral: 'Referral',
      referralCode: 'Referral Code',
      referralLink: 'Referral Link',
      copyReferralCode: 'Copy Referral Code',
      shareReferralLink: 'Share Referral Link',
    },
    settings: {
      title: 'Settings',
      userInfo: 'User Information',
      name: 'Name',
      username: 'Username',
      phone: 'Phone Number',
      phoneNotVerified: 'Not Verified',
      verifyPhone: 'Verify Phone',
      access: 'Access',
      admin: 'Administrator',
      user: 'User',
      referralCode: 'Referral Code',
      payment: 'Payment & Withdrawal',
      walletAddress: 'Wallet Address (Withdrawal)',
      walletAddressNotSet: 'Not Set',
      clickToSet: 'Click to set',
      withdrawalPasskey: 'Withdrawal Passkey',
      passkeyNotSet: 'Not Set (Account Security)',
      setPasskey: 'Set Passkey',
      passkeySet: '•••• (Set)',
      stats: 'Statistics & Status',
      accountBalance: 'Account Balance',
      language: 'App Language',
      selectLanguage: 'Select Language',
      timeline: 'Timeline',
      joinDate: 'Join Date',
      lastSeen: 'Last Seen',
      logout: 'Logout',
      walletAddressPlaceholder: 'Your digital wallet address',
      walletAddressWarning: 'Wallet address cannot be changed after registration. Contact support to change.',
      passkeyPlaceholder: '----',
      passkeyWarning: 'Withdrawal passkey cannot be changed after registration. Contact support to change.',
      passkeyLength: 'Passkey (4 digits)',
      languageChanged: 'Language changed successfully',
      walletUpdated: 'Wallet address updated successfully',
      passkeySetSuccess: 'Withdrawal passkey set successfully',
      phoneVerified: 'Phone number verified successfully',
      phoneVerificationFailed: 'Failed to verify phone number. Please try again.',
      phoneVerificationCancelled: 'Phone verification cancelled',
      referralCodeCopied: 'Referral code copied to clipboard',
      subscriptionLinkCopied: 'Subscription link copied successfully',
      qrCodeDescription: 'Scan this code in a v2ray app (such as v2rayNG or Shadowrocket) to automatically apply the settings.',
      phoneChecking: 'Checking...',
      phoneCheckingDescription: 'Receiving information from Telegram',
      phoneNotReceived: 'Phone number not received. Please try again.',
      telegramFeatureNotAvailable: 'This feature is not available in this version of Telegram',
      cancelled: 'Cancelled',
    },
    subscription: {
      title: 'My Subscription',
      mySubscription: 'My Subscription',
      active: 'Active',
      inactive: 'Inactive',
      expired: 'Expired',
      limited: 'Limited',
      disabled: 'Disabled',
      subscriptionLink: 'Subscription Link',
      copyLink: 'Copy Subscription Link',
      scanQR: 'Scan QR Code',
      servers: 'Available Servers',
      refreshServers: 'Refresh',
      noServers: 'No servers found',
      retry: 'Retry',
      configCopied: 'Config {name} copied to clipboard',
      subscriptionUpdated: 'Subscription information updated',
      updateError: 'Error updating information',
      serversUpdated: 'Server list updated',
      loadingServers: 'Loading servers...',
      serverCount: 'servers',
      update: 'Update',
      copy: 'Copy',
      copied: 'Copied',
      serverTip: '💡 You can copy each server separately and import it into your VPN app. To update the server list, click the update button.',
      subscriptionDescription: 'Subscription link and VPN servers',
      vpnServers: 'VPN Servers',
      other: 'Other',
      used: 'Used',
    },
    admin: {
      title: 'Admin',
      overview: 'Overview',
      users: 'Users',
      transactions: 'Transactions',
      withdrawals: 'Withdrawals',
      deposits: 'Deposits',
      totalUsers: 'Total Users',
      totalDeposits: 'Total Deposits',
      pendingWithdrawals: 'Pending Withdrawals',
      approve: 'Approve',
      reject: 'Reject',
      userDetails: 'User Details',
      balance: 'Balance',
      updateBalance: 'Update Balance',
      transactionHistory: 'Transaction History',
    },
    plan: {
      renew: 'Renew',
      purchaseAndActivate: 'Purchase and Activate with One Click',
      instantActivation: 'Instant Activation',
      traffic: 'Traffic / Volume',
      validityPeriod: 'Validity Period',
      days: 'days',
      confirmPurchase: 'Final Purchase Confirmation',
      confirmPurchaseDescription: 'Are you sure you want to purchase the {planName} subscription for ${price}?',
      amountWillBeDeducted: 'The amount will be deducted from your wallet.',
      yesConfirm: 'Yes, Confirm and Purchase',
      instantActivationNote: 'Activates instantly with one click',
      gb: 'GB',
    },
    customSubscription: {
      title: 'Custom Subscription',
      createCustom: 'Create Custom Subscription',
      monthlyTraffic: 'Monthly Traffic',
      validityPeriod: 'Validity Period',
      gb: 'GB',
      days: 'days',
      cost: 'Cost:',
      totalCost: 'Total Cost',
      currentBalance: 'Current Balance',
      balanceAfterPurchase: 'Balance After Purchase',
      insufficientBalance: 'Insufficient Balance',
      purchaseAndActivate: 'Purchase and Activate',
      finalConfirmation: 'Final Confirmation',
      confirmDescription: 'Are you sure you want to purchase a custom subscription with the following specifications?',
      trafficLabel: 'Traffic:',
      durationLabel: 'Duration:',
      priceLabel: 'Price:',
      userNotFound: 'User not found',
      success: 'Success',
      customSubscriptionCreated: 'Custom subscription created successfully',
      error: 'Error',
      subscriptionError: 'Error creating subscription',
      somethingWentWrong: 'Something went wrong',
      min: 'Min',
      max: 'Max',
    },
    errors: {
      notFound: 'Page Not Found',
      accessDenied: 'Access Denied',
      somethingWentWrong: 'Something went wrong',
      tryAgain: 'Please try again',
      networkError: 'Network error',
    },
  },

  ar: {
    common: {
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجاح',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      close: 'إغلاق',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      back: 'رجوع',
      next: 'التالي',
      search: 'بحث',
      refresh: 'تحديث',
      copy: 'نسخ',
      copied: 'تم النسخ',
      share: 'مشاركة',
    },
    nav: {
      home: 'الرئيسية',
      wallet: 'المحفظة',
      subscription: 'اشتراكي',
      settings: 'الإعدادات',
      admin: 'الإدارة',
    },
    home: {
      title: 'الرئيسية',
      welcome: 'مرحباً',
      selectPlan: 'اختر الخطة',
      customSubscription: 'إنشاء اشتراك مخصص',
      activeSubscription: 'اشتراك نشط',
      noSubscription: 'لا يوجد اشتراك نشط',
      purchaseSuccess: 'تم الشراء بنجاح',
      purchaseError: 'خطأ في الشراء',
      somethingWentWrong: 'حدث خطأ ما',
    },
    wallet: {
      title: 'المحفظة',
      balance: 'الرصيد',
      topUp: 'شحن',
      withdraw: 'سحب',
      history: 'السجل',
      transactions: 'المعاملات',
      amount: 'المبلغ',
      paymentMethod: 'طريقة الدفع',
      telegramStars: 'نجوم تيليجرام',
      crypto: 'عملة رقمية',
      enterAmount: 'أدخل المبلغ',
      processing: 'جاري المعالجة...',
      checkingPayment: 'التحقق من الدفع',
      paymentSuccess: 'تم الدفع بنجاح',
      paymentPending: 'في انتظار التأكيد',
      transactionCompleted: 'اكتملت المعاملة',
      transactionPending: 'قيد الانتظار',
      checkTransactions: 'التحقق من المعاملات',
      referral: 'الإحالة',
      referralCode: 'رمز الإحالة',
      referralLink: 'رابط الإحالة',
      copyReferralCode: 'نسخ رمز الإحالة',
      shareReferralLink: 'مشاركة رابط الإحالة',
    },
    settings: {
      title: 'الإعدادات',
      userInfo: 'معلومات المستخدم',
      name: 'الاسم',
      username: 'اسم المستخدم',
      phone: 'رقم الهاتف',
      phoneNotVerified: 'غير مُتحقق',
      verifyPhone: 'التحقق من الهاتف',
      access: 'الوصول',
      admin: 'المسؤول',
      user: 'المستخدم',
      referralCode: 'رمز الإحالة',
      payment: 'الدفع والسحب',
      walletAddress: 'عنوان المحفظة (السحب)',
      walletAddressNotSet: 'غير مضبوط',
      clickToSet: 'انقر للضبط',
      withdrawalPasskey: 'كلمة مرور السحب',
      passkeyNotSet: 'غير مضبوط (أمان الحساب)',
      setPasskey: 'ضبط كلمة المرور',
      passkeySet: '•••• (مضبوط)',
      stats: 'الإحصائيات والحالة',
      accountBalance: 'رصيد الحساب',
      language: 'لغة التطبيق',
      selectLanguage: 'اختر اللغة',
      timeline: 'الجدول الزمني',
      joinDate: 'تاريخ الانضمام',
      lastSeen: 'آخر ظهور',
      logout: 'تسجيل الخروج',
      walletAddressPlaceholder: 'عنوان محفظتك الرقمية',
      walletAddressWarning: 'لا يمكن تغيير عنوان المحفظة بعد التسجيل. اتصل بالدعم للتغيير.',
      passkeyPlaceholder: '----',
      passkeyWarning: 'لا يمكن تغيير كلمة مرور السحب بعد التسجيل. اتصل بالدعم للتغيير.',
      passkeyLength: 'كلمة المرور (4 أرقام)',
      languageChanged: 'تم تغيير اللغة بنجاح',
      walletUpdated: 'تم تحديث عنوان المحفظة بنجاح',
      passkeySetSuccess: 'تم ضبط كلمة مرور السحب بنجاح',
      phoneVerified: 'تم التحقق من رقم الهاتف بنجاح',
      phoneVerificationFailed: 'فشل التحقق من رقم الهاتف. يرجى المحاولة مرة أخرى.',
      phoneVerificationCancelled: 'تم إلغاء التحقق من الهاتف',
      referralCodeCopied: 'تم نسخ رمز الإحالة إلى الحافظة',
      subscriptionLinkCopied: 'تم نسخ رابط الاشتراك بنجاح',
      qrCodeDescription: 'امسح هذا الرمز في تطبيق v2ray (مثل v2rayNG أو Shadowrocket) لتطبيق الإعدادات تلقائياً.',
      phoneChecking: 'جارٍ التحقق...',
      phoneCheckingDescription: 'جارٍ استلام المعلومات من تيليجرام',
      phoneNotReceived: 'لم يتم استلام رقم الهاتف. يرجى المحاولة مرة أخرى.',
      telegramFeatureNotAvailable: 'هذه الميزة غير متاحة في هذا الإصدار من تيليجرام',
      cancelled: 'تم الإلغاء',
    },
    subscription: {
      title: 'اشتراكي',
      mySubscription: 'اشتراكي',
      active: 'نشط',
      inactive: 'غير نشط',
      expired: 'منتهي الصلاحية',
      limited: 'محدود',
      disabled: 'معطل',
      subscriptionLink: 'رابط الاشتراك',
      copyLink: 'نسخ رابط الاشتراك',
      scanQR: 'مسح رمز QR',
      servers: 'الخوادم المتاحة',
      refreshServers: 'تحديث',
      noServers: 'لم يتم العثور على خوادم',
      retry: 'إعادة المحاولة',
      configCopied: 'تم نسخ الإعداد {name} إلى الحافظة',
      subscriptionUpdated: 'تم تحديث معلومات الاشتراك',
      updateError: 'خطأ في تحديث المعلومات',
      serversUpdated: 'تم تحديث قائمة الخوادم',
      loadingServers: 'جارٍ تحميل الخوادم...',
      serverCount: 'خوادم',
      update: 'تحديث',
      copy: 'نسخ',
      copied: 'تم النسخ',
      serverTip: '💡 يمكنك نسخ كل خادم بشكل منفصل واستيراده إلى تطبيق VPN الخاص بك. لتحديث قائمة الخوادم، انقر فوق زر التحديث.',
      subscriptionDescription: 'رابط الاشتراك وخوادم VPN',
      vpnServers: 'خوادم VPN',
      other: 'أخرى',
      used: 'مستخدم',
    },
    admin: {
      title: 'الإدارة',
      overview: 'نظرة عامة',
      users: 'المستخدمون',
      transactions: 'المعاملات',
      withdrawals: 'عمليات السحب',
      deposits: 'الودائع',
      totalUsers: 'إجمالي المستخدمين',
      totalDeposits: 'إجمالي الودائع',
      pendingWithdrawals: 'عمليات السحب المعلقة',
      approve: 'موافقة',
      reject: 'رفض',
      userDetails: 'تفاصيل المستخدم',
      balance: 'الرصيد',
      updateBalance: 'تحديث الرصيد',
      transactionHistory: 'سجل المعاملات',
    },
    plan: {
      renew: 'تجديد',
      purchaseAndActivate: 'شراء وتفعيل بنقرة واحدة',
      instantActivation: 'تفعيل فوري',
      traffic: 'الحركة / الحجم',
      validityPeriod: 'مدة الصلاحية',
      days: 'أيام',
      confirmPurchase: 'تأكيد الشراء النهائي',
      confirmPurchaseDescription: 'هل أنت متأكد من شراء اشتراك {planName} بمبلغ ${price}؟',
      amountWillBeDeducted: 'سيتم خصم المبلغ من محفظتك.',
      yesConfirm: 'نعم، تأكيد والشراء',
      instantActivationNote: 'يتم التفعيل فوراً بنقرة واحدة',
      gb: 'GB',
    },
    customSubscription: {
      title: 'اشتراك مخصص',
      createCustom: 'إنشاء اشتراك مخصص',
      monthlyTraffic: 'الحركة الشهرية',
      validityPeriod: 'مدة الصلاحية',
      gb: 'GB',
      days: 'أيام',
      cost: 'التكلفة:',
      totalCost: 'التكلفة الإجمالية',
      currentBalance: 'الرصيد الحالي',
      balanceAfterPurchase: 'الرصيد بعد الشراء',
      insufficientBalance: 'رصيد غير كافٍ',
      purchaseAndActivate: 'شراء وتفعيل',
      finalConfirmation: 'التأكيد النهائي',
      confirmDescription: 'هل أنت متأكد من شراء اشتراك مخصص بالمواصفات التالية؟',
      trafficLabel: 'الحركة:',
      durationLabel: 'المدة:',
      priceLabel: 'السعر:',
      userNotFound: 'لم يتم العثور على المستخدم',
      success: 'نجاح',
      customSubscriptionCreated: 'تم إنشاء الاشتراك المخصص بنجاح',
      error: 'خطأ',
      subscriptionError: 'خطأ في إنشاء الاشتراك',
      somethingWentWrong: 'حدث خطأ ما',
      min: 'الحد الأدنى',
      max: 'الحد الأقصى',
    },
    errors: {
      notFound: 'الصفحة غير موجودة',
      accessDenied: 'تم رفض الوصول',
      somethingWentWrong: 'حدث خطأ ما',
      tryAgain: 'يرجى المحاولة مرة أخرى',
      networkError: 'خطأ في الاتصال بالخادم',
    },
  },
};

// RTL languages
export const rtlLanguages: LanguageCode[] = ['fa', 'ar'];

// Check if a language is RTL
export function isRTL(lang: LanguageCode): boolean {
  return rtlLanguages.includes(lang);
}

// Get text direction for a language
export function getTextDirection(lang: LanguageCode): 'rtl' | 'ltr' {
  return isRTL(lang) ? 'rtl' : 'ltr';
}
