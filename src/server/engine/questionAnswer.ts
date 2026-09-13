import type { Language } from "@/types";

export interface QuestionAnswer {
  hasQuestion: boolean;
  topic: string | null;
  answer: string;
}

const QUESTION_PATTERNS = [
  /\?/,
  /\b(can|could|is it|is there|how|what|why|does|do|will|should|would|where|when|which)\b/i,
  /\b(kya|kaise|kitna|kab|kahan|kyun|batao|bataiye|chahiye|hoga|hota)\b/i,
  /\b(guarantee|guaranteed|safe|fraud|scam|real|genuine|fee|cost|charge|portal|direct|apply|ielts|bank statement|show money|appointment|embassy|slot|hec)\b/i,
];

export function detectAndAnswerQuestion(studentText: string, language: Language = "english"): QuestionAnswer {
  const text = studentText.trim();
  if (!text) {
    return { hasQuestion: false, topic: null, answer: "" };
  }

  const lower = text.toLowerCase();
  const isQuestionLike = QUESTION_PATTERNS.some((p) => p.test(text));

  if (!isQuestionLike && !text.includes("?")) {
    return { hasQuestion: false, topic: null, answer: "" };
  }

  // 1. Visa Guarantee Scam
  if (
    lower.includes("guarantee") ||
    lower.includes("guaranteed") ||
    lower.includes("100%") ||
    (lower.includes("visa") && (lower.includes("pakka") || lower.includes("confirm") || lower.includes("sure")))
  ) {
    return {
      hasQuestion: true,
      topic: "visa_guarantee",
      answer: getVisaGuaranteeAnswer(language),
    };
  }

  // 2. Scholarship Fees & Paid Quotas
  if (
    lower.includes("scholarship") &&
    (lower.includes("fee") ||
      lower.includes("cost") ||
      lower.includes("free") ||
      lower.includes("charge") ||
      lower.includes("pay") ||
      lower.includes("paisa") ||
      lower.includes("lakh") ||
      lower.includes("rs") ||
      lower.includes("pkr"))
  ) {
    return {
      hasQuestion: true,
      topic: "scholarship_fees",
      answer: getScholarshipFeeAnswer(language),
    };
  }

  // 3. Direct University Application vs Agent
  if (
    (lower.includes("direct") || lower.includes("without agent") || lower.includes("without consultant") || lower.includes("khud")) &&
    (lower.includes("apply") || lower.includes("application") || lower.includes("admission"))
  ) {
    return {
      hasQuestion: true,
      topic: "direct_application",
      answer: getDirectApplicationAnswer(language),
    };
  }

  // 4. Bank Statement & Show Money
  if (
    lower.includes("bank statement") ||
    lower.includes("show money") ||
    lower.includes("statement") ||
    lower.includes("balance") ||
    lower.includes("sperrkonto") ||
    lower.includes("blocked account")
  ) {
    return {
      hasQuestion: true,
      topic: "bank_statement",
      answer: getBankStatementAnswer(language),
    };
  }

  // 5. IELTS & English Language Requirements
  if (
    lower.includes("ielts") ||
    lower.includes("english") ||
    lower.includes("pte") ||
    lower.includes("toefl") ||
    lower.includes("duolingo") ||
    lower.includes("moi") ||
    lower.includes("proficiency")
  ) {
    return {
      hasQuestion: true,
      topic: "ielts_requirements",
      answer: getIeltsAnswer(language),
    };
  }

  // 6. Consultant Legitimacy & How to Verify
  if (
    (lower.includes("consultant") || lower.includes("agent") || lower.includes("agency")) &&
    (lower.includes("verify") || lower.includes("check") || lower.includes("genuine") || lower.includes("real") || lower.includes("safe") || lower.includes("trust") || lower.includes("fraud") || lower.includes("scam"))
  ) {
    return {
      hasQuestion: true,
      topic: "consultant_verification",
      answer: getConsultantVerificationAnswer(language),
    };
  }

  // 7. Embassy Appointments & Slot Fees
  if (
    lower.includes("appointment") ||
    lower.includes("slot") ||
    lower.includes("vfs") ||
    lower.includes("gerry") ||
    lower.includes("interview")
  ) {
    return {
      hasQuestion: true,
      topic: "embassy_appointments",
      answer: getAppointmentAnswer(language),
    };
  }

  // 8. HEC Attestation & Equivalence
  if (lower.includes("hec") || lower.includes("ibcc") || lower.includes("attestation") || lower.includes("equivalence")) {
    return {
      hasQuestion: true,
      topic: "hec_attestation",
      answer: getHecAnswer(language),
    };
  }

  // 9. Admission Letter / Offer Letter Authenticity
  if (
    lower.includes("offer letter") ||
    lower.includes("admission letter") ||
    lower.includes("cas") ||
    lower.includes("i-20") ||
    lower.includes("i20") ||
    lower.includes("acceptance")
  ) {
    return {
      hasQuestion: true,
      topic: "offer_verification",
      answer: getOfferVerificationAnswer(language),
    };
  }

  // General helpful answer if a question is asked
  return {
    hasQuestion: true,
    topic: "general",
    answer: getGeneralSafetyAnswer(language),
  };
}

function getVisaGuaranteeAnswer(lang: Language): string {
  if (lang === "urdu") {
    return "💡 آپ کے سوال کا براہ راست جواب: کوئی بھی کنسلٹنٹ، ایجنٹ یا ادارہ ویزا کی 100% گارنٹی نہیں دے سکتا۔ ویزا جاری کرنے کا مکمل اور حتمی اختیار صرف متعلقہ ملک کے سفارت خانے اور امیگریشن اتھارٹی کے پاس ہوتا ہے۔ ویزا گارنٹی کا دعویٰ برٹش کونسل اور ایف آئی اے کے قوانین کے تحت سنگین دھوکہ دہی کا سب سے بڑا ریڈ فلیگ ہے۔";
  }
  if (lang === "roman_urdu") {
    return "💡 Direct Jawab: Koi bhi consultant ya agent visa ki 100% guarantee nahi de sakta. Visa grant karne ka ikhtiyar sirf embassy aur immigration department ke paas hota hai. 'Guaranteed Visa' ka daawa karna FIA aur British Council ke qawaneen ke mutabiq fraud ka sab se bara red flag signal hai.";
  }
  return "💡 Direct Answer to Your Question: Absolutely NO consultant, agency, or university can guarantee a student visa. Visas are granted solely at the discretion of the destination country's government immigration department (e.g. UKVI, US Consular Affairs, IRCC Canada). Promising a '100% guaranteed visa' is an established fraud red flag under British Council and FIA guidelines.";
}

function getScholarshipFeeAnswer(lang: Language): string {
  if (lang === "urdu") {
    return "💡 آپ کے سوال کا براہ راست جواب: بین الاقوامی اسکالرشپس (جیسے Erasmus Mundus, Chevening, Fulbright, DAAD, Türkiye Bursları) کی کوئی درخواست فیس نہیں ہوتی اور یہ 100% مفت ہوتی ہیں۔ کسی بھی ایجنٹ یا کنسلٹنٹ کو اسکالرشپ پروسیسنگ یا سیٹ بکنگ کی مد میں رقم ادا نہ کریں؛ جینون اسکالرشپس میں کوئی ایجنٹ کوٹہ موجود نہیں ہوتا۔";
  }
  if (lang === "roman_urdu") {
    return "💡 Direct Jawab: Tamam bari international scholarships (jaise Erasmus Mundus, Chevening, Fulbright, DAAD, Turkiye Burslari) bilkul FREE hoti hain aur inki koi application fee nahi hoti. Kisi bhi consultant ko scholarship dilwane ya file charges ke naam par fees na dain, kyunke in scholarships mein koi agent quota nahi hota.";
  }
  return "💡 Direct Answer to Your Question: Major global scholarships (such as Erasmus Mundus, Chevening, Fulbright USEFP, DAAD, Türkiye Bursları, MEXT, Commonwealth) have ZERO application fees and are 100% free to apply directly. Never pay an agent a 'scholarship reservation fee' or file processing charge — legitimate international scholarships have no agent quotas.";
}

function getDirectApplicationAnswer(lang: Language): string {
  if (lang === "urdu") {
    return "💡 آپ کے سوال کا براہ راست جواب: جی ہاں! دنیا کی 95 فیصد سے زیادہ معیاری یونیورسٹیاں (برطانیہ، کینیڈا، امریکہ، جرمنی اور یورپ) براہ راست آن لائن درخواستیں قبول کرتی ہیں۔ آپ کو داخلہ لینے کے لیے کسی ایجنٹ یا مڈل مین کی کوئی مجبوری نہیں ہوتی، اور خود اپلائی کرنے سے آپ کی درخواست محفوظ اور کنٹرول میں رہتی ہے۔";
  }
  if (lang === "roman_urdu") {
    return "💡 Direct Jawab: Ji haan! Aap university ki official website par direct online apply kar sakte hain. UK (UCAS), Canada, US, Germany (uni-assist) aur Europe ki 95%+ universities direct applications leti hain. Kisi agent ko paise diye baghair aap khud apna application portal bana kar apply kar sakte hain.";
  }
  return "💡 Direct Answer to Your Question: Yes! Over 95% of reputable universities in the UK, Canada, USA, Germany, Australia, and Europe accept direct student applications through their official online portals (e.g., UCAS, uni-assist, Common App, or direct university portals). You do NOT need to hire an agent to apply or receive an authentic offer letter.";
}

function getBankStatementAnswer(lang: Language): string {
  if (lang === "urdu") {
    return "💡 آپ کے سوال کا براہ راست جواب: ایجنٹ سے تھرڈ پارٹی بینک اسٹیٹمنٹ، جعلی شو منی یا عارضی قرض لینا انتہائی غیر قانونی ہے۔ سفارت خانے اسٹیٹ بینک اور پاکستانی بینکوں سے براہ راست اسٹیٹمنٹ کی تصدیق کرتے ہیں۔ جعلی اسٹیٹمنٹ پکڑے جانے پر برطانیہ (Rule 9.7.1) اور کینیڈا (Section 40) میں فوری طور پر 10 سال کی ویزا پابندی عائد کی جاتی ہے۔ رقم آپ کے یا آپ کے قانونی اسپانسر کے اپنے اکاؤنٹ میں ہونا ضروری ہے۔";
  }
  if (lang === "roman_urdu") {
    return "💡 Direct Jawab: Agent se fake bank statement ya temporary 'show money' lena bohot bara jurm aur khatra hai. Embassies direct Pakistani banks se statement verify karti hain. Fake statement submit karne par UK aur Canada mein fori 10 saal ka visa ban lag jata hai. Paise hamesha aapke ya parents ke genuine account mein required time ke liye hone chahiye.";
  }
  return "💡 Direct Answer to Your Question: Using an agent-arranged third-party bank statement or temporary 'show money' is strictly illegal. Embassies verify bank records directly with Pakistani banks and the State Bank of Pakistan. Submitting a forged or borrowed statement leads to an immediate visa refusal and a mandatory 10-year immigration ban (under UK Rule 9.7.1, Canada Section 40, and US INA 212). Funds must legitimately belong to you or your registered sponsor.";
}

function getIeltsAnswer(lang: Language): string {
  if (lang === "urdu") {
    return "💡 آپ کے سوال کا براہ راست جواب: انگریزی کی شرائط یونیورسٹی اور ویزا قوانین پر منحصر ہوتی ہیں۔ اگرچہ کچھ یونیورسٹیاں انگلش میڈیم سرٹیفکیٹ (MOI) قبول کرتی ہیں، لیکن ویزا امیگریشن (SELT) کے لیے اکثر مستند ٹیسٹ (جیسے IELTS for UKVI, PTE Academic, یا TOEFL) لازمی ہوتا ہے۔ کسی ایسے ایجنٹ پر بھروسہ نہ کریں جو بغیر کسی مستند دستاویز کے تمام انگریزی ضروریات بائی پاس کرنے کا دعویٰ کرے۔";
  }
  if (lang === "roman_urdu") {
    return "💡 Direct Jawab: IELTS ki requirement university aur visa rules par depend karti hai. Kuch universities Pakistani degrees ke English Proficiency Certificate (MOI) par admit kar leti hain, lekin student visa ke liye aksar official approved test (jaise IELTS for UKVI ya PTE) zaroori hota hai. Agent ke baghair official university requirements check karein.";
  }
  return "💡 Direct Answer to Your Question: English language requirements depend on both the university's academic policy and the destination country's student visa regulations. While some universities accept an English Medium of Instruction (MOI) certificate from recognized Pakistani universities, visa authorities (such as UKVI) often mandate an approved Secure English Language Test (SELT) like IELTS for UKVI or PTE Academic. Always verify the official list on the university's official site.";
}

function getConsultantVerificationAnswer(lang: Language): string {
  if (lang === "urdu") {
    return "💡 آپ کے سوال کا براہ راست جواب: کنسلٹنٹ کی تصدیق کے 3 بنیادی طریقے ہیں: 1) یونیورسٹی کی آفیشل ویب سائٹ پر 'Find an Agent' کا پیج چیک کریں کہ کیا وہ رجسٹرڈ پارٹنر ہیں۔ 2) ان سے برٹش کونسل سرٹیفائیڈ ایجنٹ یا ICEF رجسٹریشن کوڈ طلب کریں۔ 3) فیس اور ٹیوشن ڈپازٹ کبھی بھی کسی کنسلٹنٹ کے ذاتی اکاؤنٹ میں نہ بھیجیں، بلکہ ہمیشہ یونیورسٹی کے آفیشل بینک اکاؤنٹ میں جمع کروائیں۔";
  }
  if (lang === "roman_urdu") {
    return "💡 Direct Jawab: Consultant ko verify karne ke 3 tareeqay hain: 1) University ki official website par jaa kar 'Find an Agent' page check karein ke unka naam list mein hai ya nahi. 2) Unka British Council ya ICEF certification code check karein. 3) Tuition fees hamesha direct university ke official bank account mein wire karein, kisi agent ke personal account mein nahi.";
  }
  return "💡 Direct Answer to Your Question: To verify whether an educational consultant is genuine: 1) Check the university's official website under 'International Students -> Approved Agents' to confirm they have an active contract. 2) Ask for their British Council Certified Agent badge or ICEF agency number. 3) Check SECP corporate registration. 4) Golden Safety Rule: Never wire tuition deposits into a consultant's personal or local business account — tuition must only be paid directly to the university's verified international account.";
}

function getAppointmentAnswer(lang: Language): string {
  if (lang === "urdu") {
    return "💡 آپ کے سوال کا براہ راست جواب: سفارت خانے کے ویزا اپوائنٹمنٹ سلاٹس (جیسے VFS Global, Gerry's, یا US Embassy) صرف آفیشل پورٹل کے ذریعے براہ راست بک ہوتے ہیں۔ کسی ایجنٹ کو 'وی آئی پی سلاٹ' یا 'ارجنٹ اپوائنٹمنٹ' کے نام پر بھاری رقوم نہ دیں، کیونکہ یہ غیر مجاز اور فراڈ ہو سکتا ہے۔";
  }
  if (lang === "roman_urdu") {
    return "💡 Direct Jawab: Visa appointment slots (VFS Global, Gerry's, US Embassy) sirf unke official portal par direct book hotay hain. Kisi agent ko 'VIP slot' ya urgent date ke naam par extra paise na dain, kyunke unauthorized booking pakri jaane par appointment cancel ho sakti hai.";
  }
  return "💡 Direct Answer to Your Question: Official visa appointment slots (at VFS Global, Gerry's, TLScontact, or the US Embassy) are booked directly through their official portals. Any official fee is paid directly on the portal. Beware of agents charging high black-market fees for 'VIP slots' or 'guaranteed dates' — unauthorized bookings are frequently flagged and cancelled by embassies.";
}

function getHecAnswer(lang: Language): string {
  if (lang === "urdu") {
    return "💡 آپ کے سوال کا براہ راست جواب: بیرون ملک ماسٹرز یا پی ایچ ڈی میں داخلے اور ویزا کے لیے آپ کی پاکستانی ڈگری اور ٹرانسکرپٹس کا ہائر ایجوکیشن کمیشن (HEC) پاکستان سے تصدیق شدہ ہونا لازمی ہوتا ہے، اور انٹرمیڈیٹ/میٹرک کی تصدیق IBCC سے ہوتی ہے۔ آپ HEC کے آفیشل پورٹل (eservices.hec.gov.pk) پر خود آن لائن درخواست جمع کروا سکتے ہیں۔";
  }
  if (lang === "roman_urdu") {
    return "💡 Direct Jawab: Abroad higher education aur visa ke liye HEC Pakistan ki degree attestation aur IBCC ki equivalence zaroori hoti hai. Aap kisi agent ke baghair HEC ke official portal (eservices.hec.gov.pk) par direct online attestation apply kar sakte hain.";
  }
  return "💡 Direct Answer to Your Question: Foreign universities and visa bodies require your degrees and transcripts to be attested by the Higher Education Commission (HEC) Pakistan and your intermediate certificates verified by IBCC. You can register and apply directly on the official HEC online portal (eservices.hec.gov.pk) without paying an agent.";
}

function getOfferVerificationAnswer(lang: Language): string {
  if (lang === "urdu") {
    return "💡 آپ کے سوال کا براہ راست جواب: آفر لیٹر کی تصدیق کے لیے لیٹر پر درج اسٹوڈنٹ آئی ڈی نمبر نوٹ کریں اور یونیورسٹی کے آفیشل بین الاقوامی داخلہ دفتر کے ای میل (جو .ac.uk, .edu, یا .de پر ختم ہوتا ہو، نہ کہ gmail پر) پر ای میل بھیج کر تحریری تصدیق حاصل کریں۔ اس تصدیق سے پہلے کوئی فیس نہ ادا کریں۔";
  }
  if (lang === "roman_urdu") {
    return "💡 Direct Jawab: Admission letter verify karne ke liye letter par likha Student ID number note karein aur university ke official admissions email (jo .edu ya .ac.uk par ho) par direct email bhej kar confirm karein ke letter genuine hai ya nahi. Confirmation se pehle koi deposit na dain.";
  }
  return "💡 Direct Answer to Your Question: To verify whether an offer letter, CAS, or I-20 is genuine: check the sender's email domain (it must be the university's official domain like `@manchester.ac.uk` or `@utoronto.ca`, never a free Gmail/Yahoo address). Then, email the university's official international admissions office quoting your Student ID number to confirm they issued the document before paying any tuition deposit.";
}

function getGeneralSafetyAnswer(lang: Language): string {
  if (lang === "urdu") {
    return "💡 آپ کے سوال کے متعلق اہم حفاظتی اصول: کسی بھی یونیورسٹی میں داخلے یا اسکالرشپ کی تصدیق ہمیشہ ادارے کی آفیشل ویب سائٹ اور پورٹل سے کریں۔ ٹیوشن فیس ہمیشہ یونیورسٹی کے آفیشل اکاؤنٹ میں بھیجیں، کبھی بھی ایجنٹ کے ذاتی اکاؤنٹ میں جمع نہ کروائیں۔";
  }
  if (lang === "roman_urdu") {
    return "💡 Study Abroad Safety Rule: Kisi bhi university ya scholarship ki verification hamesha unki official website aur direct portal se karein. Fees hamesha direct university ke account mein transfer karein, kisi agent ke personal account mein nahi.";
  }
  return "💡 Direct Guidance for Your Question: When evaluating any study abroad claim, always verify details directly on the university or scholarship's official website. Never transfer funds into a personal bank account, and always ensure you retain direct login access to your official student application portal.";
}
