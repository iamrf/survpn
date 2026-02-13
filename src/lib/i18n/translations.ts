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
