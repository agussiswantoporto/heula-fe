/**
 * Centralized Indonesian copy (design Section 17).
 *
 * All user-facing strings live here: Gojek-casual voice, zero emoji. Keeping
 * copy in one typed object makes the no-emoji audit a single-file concern and
 * keeps wording consistent across the recommendation engine, stages, toasts,
 * notifications, onboarding, and settings.
 */
import type { Goal, MethodId } from "@/types";

/** Goal -> Indonesian display label (design Section 10). */
export const GOAL_LABELS: Record<Goal, string> = {
  weight_loss: "Turun berat badan",
  metabolic: "Kesehatan metabolik - gula darah",
  focus: "Fokus & produktivitas",
  maintain: "Maintain berat badan",
  general: "Coba-coba - umum",
};

export const copy = {
  /** Short Gojek-voice taglines per method (no emoji). */
  methodTaglines: {
    "14:10": "Santai dulu, puasa 14 jam yang gampang buat pemula.",
    "16:8": "Paling populer, 16 jam puasa yang pas buat sehari-hari.",
    "18:6": "Naik level dikit, window makan 6 jam yang lebih ketat.",
    "20:4": "Buat yang udah kebiasa, cuma 4 jam window makan.",
    omad: "Sekali makan sehari, buat yang pengen tantangan serius.",
    custom: "Atur sendiri jam puasamu, sesuai gaya kamu.",
  } satisfies Record<MethodId, string>,

  /** Recommendation rationales keyed by decision row (R1-R16). */
  recommendation: {
    heavyWarning:
      "Kamu latihan intens, jadi kita pilih yang lebih santai dulu. Hindari OMAD atau 20:4 ya, biar recovery kamu tetap oke.",
    heavyRationale:
      "Latihanmu berat, jadi puasa 14:10 cukup biar tenaga dan pemulihanmu tetap kejaga.",

    // BMI post-process notes (FEAT-002). Underweight is delivered via the
    // warning field so it always surfaces; overweight/obese is appended to
    // rationale as firmer-but-safe framing.
    underweightNote:
      "Berat badanmu masih di bawah ideal, jadi puasa yang ketat kita tahan dulu ya. Fokus dulu ke makan cukup dan bergizi, baru pelan-pelan jalanin puasa yang santai.",
    underweightRationale:
      "Karena berat badanmu masih kurang, kita mulai dari yang paling santai dulu biar asupanmu tetap aman.",
    overweightNote:
      "Berat badanmu lagi di atas ideal, jadi 18:6 bisa jadi langkah berikutnya yang lebih mantap kalau kamu udah nyaman. Tetap pelan-pelan dan jangan dipaksa ya.",

    weightLossNone:
      "Buat turun berat badan tanpa olahraga, mulai dari 16:8 dulu biar nyaman. Kalau udah kebiasa, naik ke 18:6 pelan-pelan.",
    weightLossLight:
      "Turun berat badan sambil olahraga ringan, 16:8 pas banget. Masih ada ruang buat naik ke 18:6 atau yang lebih advanced kalau udah pede.",
    weightLossModerate:
      "Olahraga kamu lumayan rutin, jadi 16:8 ini seimbang antara progres turun berat dan tenaga buat latihan.",

    metabolicNone:
      "Buat kesehatan metabolik tanpa beban latihan, 18:6 kasih window puasa lebih panjang yang bantu kontrol gula darah tapi tetap kebawa.",
    metabolicLight:
      "16:8 kasih manfaat metabolik yang solid dan tetap sustainable bareng olahraga ringanmu.",
    metabolicModerate:
      "16:8 bantu kontrol gula darah tanpa ganggu latihanmu yang lumayan rutin.",

    focusNone:
      "Buat fokus dan produktivitas, 16:8 kasih window puasa yang bersih buat kerja maksimal.",
    focusLight:
      "16:8 pas buat jaga fokus sekaligus nyambung sama aktivitas olahraga ringanmu.",
    focusModerate:
      "16:8 nyeimbangin fokus kerja sama beban latihanmu yang lumayan.",

    maintainNone:
      "Buat jaga berat badan, 14:10 santai dan gampang dijalanin tiap hari.",
    maintainLight:
      "14:10 lenient dan ramah buat maintenance bareng olahraga ringanmu.",
    maintainModerate:
      "Latihan kamu lumayan rutin, jadi 16:8 kasih struktur ringan yang lebih pas buat maintenance.",

    generalNone:
      "Baru coba-coba? 16:8 awalan yang ramah dan gampang buat pemula.",
    generalLight:
      "16:8 awalan yang ramah buat pemula sambil tetap olahraga ringan.",
    generalModerate:
      "16:8 ramah buat pemula dan tetap nyambung sama aktivitasmu.",
  },

  /** Fasting stage descriptions (design Section 7.2), no emoji. */
  stages: {
    pencernaanLabel: "Pencernaan",
    pencernaanDesc:
      "Tubuhmu lagi nyerna makanan terakhir dan ngatur gula darah.",
    bakarLemakLabel: "Mulai bakar lemak",
    bakarLemakDesc:
      "Cadangan gula mulai menipis, tubuh pelan-pelan beralih ke lemak.",
    ketosisLabel: "Ketosis mulai",
    ketosisDesc:
      "Tubuh makin banyak bakar lemak dan mulai produksi keton.",
    autophagyLabel: "Autophagy",
    autophagyDesc:
      "Sel-sel mulai bersih-bersih dan daur ulang bagian yang rusak.",
    deepFastLabel: "Deep fast",
    deepFastDesc:
      "Puasa dalam, proses pemulihan dan pembersihan sel makin maksimal.",
  },

  /** Toasts in friendly voice. */
  toasts: {
    fastStarted: "Yuk mulai puasa, kamu pasti bisa!",
    fastStopped: "Puasa disudahi, catatan kamu udah kesimpen.",
    fastCompleted: "Mantap, target kamu kelar!",
    saveFailed: "Gagal nyimpen data, coba lagi ya.",
    deleted: "Catatan udah dihapus.",
    startTimeUpdated: "Waktu mulai berhasil diubah.",
  },

  /** Notification bodies (no emoji). */
  notifications: {
    endTitle: "Waktunya buka puasa",
    endBody: "Waktunya buka puasa, kamu berhasil!",
    startTitle: "Yuk mulai puasa",
    startBody: "Udah waktunya mulai puasa nih, semangat ya!",
    unsupported:
      "Browser kamu belum dukung notifikasi, tapi timer tetap jalan kok.",
    denied: "Notifikasi lagi dimatiin. Kamu masih bisa pakai timer kok.",
  },

  /** Empty and loading states. */
  states: {
    historyEmpty: "Belum ada catatan puasa. Yuk mulai yang pertama!",
    statsEmpty: "Belum ada data buat ditampilin. Mulai puasa dulu yuk.",
    loading: "Sebentar ya, lagi nyiapin...",
    noGoal: "Belum ada tujuan",
  },

  /** Onboarding copy. */
  onboarding: {
    welcomeTitle: "Selamat datang di Heula",
    welcomeBody:
      "Teman puasa kamu yang bantu atur jadwal dan pantau progres. Yuk kenalan dulu.",
    goalQuestion: "Apa tujuan puasa kamu?",
    exerciseQuestion: "Kamu olahraga gak?",
    exerciseYes: "Ya, olahraga",
    exerciseNo: "Gak olahraga",
    intensityQuestion: "Seberapa intens olahraganya?",
    intensityLight: "Ringan",
    intensityModerate: "Sedang",
    intensityHeavy: "Berat",
    recommendationTitle: "Rekomendasi buat kamu",
    recommendationHint:
      "Ini saran kami, tapi kamu bebas pilih metode lain yang kamu mau.",
    recommendedBadge: "Rekomendasi buat kamu",
    methodListTitle: "Atau pilih metode lain",
    fiveTwoTitle: "5:2 (info aja)",
    fiveTwoDesc:
      "Metode 5:2 puasa 2 hari seminggu, belum ada di timer. Jadiin info dulu ya.",
    confirm: "Mulai sekarang",
    next: "Lanjut",
    back: "Kembali",
    welcomeCta: "Yuk mulai",
  },

  /** Home timer screen copy. */
  timer: {
    idleTitle: "Belum lagi puasa",
    idleBody: "Tap mulai kalau kamu udah siap. Timer bakal jalan dari sekarang.",
    start: "Mulai puasa",
    stop: "Sudahi puasa",
    editStart: "Ubah waktu mulai",
    elapsedLabel: "Udah jalan",
    remainingLabel: "Sisa waktu",
    targetEndLabel: "Target buka",
    overfastLabel: "Lewat target",
    planLabel: "Metode",
    stopConfirmTitle: "Sudahi puasa sekarang?",
    stopConfirmBody:
      "Catatan puasa kamu bakal disimpan. Kamu bisa mulai lagi kapan aja.",
    stopConfirmYes: "Ya, sudahi",
    stopConfirmNo: "Lanjut puasa",
    completeTitle: "Mantap, target kamu kelar! Mau lanjut atau sudahi?",
    completeContinue: "Lanjut",
    completeStop: "Sudahi",
    editStartTitle: "Ubah waktu mulai",
    editStartLabel: "Kapan kamu mulai puasa?",
    editStartFuture: "Waktu mulai gak boleh di masa depan ya.",
    editStartSave: "Simpan",
  },

  /** History screen copy. */
  history: {
    title: "Riwayat",
    completedBadge: "Target tercapai",
    stoppedBadge: "Disudahi lebih awal",
    durationLabel: "Durasi",
    todayLabel: "Hari ini",
    yesterdayLabel: "Kemarin",
    deleteConfirmTitle: "Hapus catatan ini?",
    deleteConfirmBody:
      "Catatan puasa ini bakal dihapus permanen dan gak bisa dibalikin.",
    deleteConfirmYes: "Ya, hapus",
    deleteConfirmNo: "Batal",
  },

  /** Stats screen copy. */
  stats: {
    title: "Statistik",
    goalLabel: "Tujuan kamu",
    currentStreak: "Streak sekarang",
    longestStreak: "Streak terpanjang",
    totalFasts: "Total puasa",
    totalHours: "Total jam",
    averageLength: "Rata-rata durasi",
    weeklyTitle: "7 hari terakhir",
    dayUnit: "hari",
    fastUnit: "kali",
    hourUnit: "jam",
  },

  /** Settings / profile copy. */
  settings: {
    planTitle: "Metode puasa",
    planSubtitle: "Pilih metode puasa yang aktif sekarang.",
    customTitle: "Jam puasa custom",
    customHint: "Atur antara 8 sampai 23 jam.",
    customInvalid: "Isi antara 8 sampai 23 jam ya.",
    customApply: "Simpan jam custom",
    goalTitle: "Tujuan kamu",
    dailyGoalTitle: "Target harian",
    dailyGoalHint: "Jam puasa yang kamu incar tiap hari.",
    reminderTitle: "Pengingat",
    reminderSubtitle:
      "Kalau notifikasi kamu izinin dan Heula udah dipasang, pengingat bisa muncul walau aplikasi lagi ketutup. Sifatnya best-effort ya, tergantung HP kamu.",
    reminderEnd: "Ingatkan saat buka puasa",
    reminderStart: "Ingatkan saat mulai puasa",
    reminderStatusLabel: "Status notifikasi",
    reminderGranted: "Notifikasi aktif. Kita bakal ingetin kamu, best-effort ya.",
    reminderDefault:
      "Belum diizinkan. Nyalain dulu biar kita bisa ingetin kamu pas waktunya.",
    reminderDenied: "Notifikasi lagi dimatiin. Kamu masih bisa pakai timer kok.",
    reminderDeniedHint:
      "Kita gak bisa minta izin lagi dari sini. Kalau mau nyalain, atur manual di pengaturan browser atau HP kamu.",
    reminderUnsupported:
      "Browser kamu belum dukung notifikasi, tapi timer tetap jalan kok.",
    reminderUnsupportedHint:
      "Browser kamu belum dukung notifikasi, tapi timer tetap jalan kok.",
    reminderEnable: "Izinkan notifikasi",
    installIOSTitle: "Pasang Heula ke layar utama",
    installIOSBody:
      "Biar makin enak dan pengingat bisa jalan, pasang Heula ke layar utama. Tap tombol Share di Safari, terus pilih Tambah ke Layar Utama. Di iOS, notifikasi baru aktif setelah Heula dipasang ya.",
    installIOSDismiss: "Nanti aja",
    themeTitle: "Tampilan",
    themeSystem: "Ikut sistem",
    themeLight: "Terang",
    themeDark: "Gelap",
    reprofiling: "Atur ulang profil",
    reprofilingHint: "Jawab ulang pertanyaan buat dapet rekomendasi baru.",
    reset: "Reset semua data",
    resetHint: "Hapus semua catatan dan pengaturan, balik ke awal.",
    resetConfirmTitle: "Reset semua data?",
    resetConfirmBody:
      "Semua catatan puasa dan pengaturan bakal dihapus. Aksi ini gak bisa dibalikin.",
    resetConfirmYes: "Ya, reset",
    resetConfirmNo: "Batal",
    about: "Tentang Heula",
    aboutVersion: "Versi",
    aboutBody:
      "Heula teman puasa kamu. Semua data disimpan di HP kamu sendiri dan jalan offline.",
    goalCardLabel: "Tujuan kamu",
    fiveTwoTitle: "5:2 (info aja)",
    fiveTwoDesc:
      "Metode 5:2 puasa 2 hari seminggu, belum ada di timer. Jadiin info dulu ya.",
  },
} as const;
