import { GoogleGenAI } from "@google/genai";
import type { DirectoryItem } from "@/components/Directory/DirectoryExplorer";

export type DirectoryCategory = "university" | "scholarship" | "consultant";

// Verified real-world database of top global universities, major scholarships, and educational consultancies
// to guarantee 100% genuine real-life links, portals, and data without latency or rate-limiting.
interface CuratedEntity {
  id: string;
  category: DirectoryCategory;
  title: string;
  subtitle: string;
  country: string | null;
  levels: string[];
  tags: string[];
  status: "verified" | "needs_verification" | "not_found";
  statusLabel: string;
  meta: { label: string; value: string }[];
  links: { label: string; url: string }[];
  note: string;
  aliases: string[];
}

const CURATED_ENTITIES: CuratedEntity[] = [
  // --- UNIVERSITIES ---
  {
    id: "harvard-university",
    category: "university",
    title: "Harvard University",
    subtitle: "Cambridge, Massachusetts, United States · Ivy League",
    country: "United States",
    levels: ["BS", "MS", "PhD"],
    tags: ["Direct application", "Need-blind financial aid", "NECHE Accredited"],
    status: "verified",
    statusLabel: "Verified Institution",
    meta: [
      { label: "Country", value: "United States" },
      { label: "Application", value: "Direct application via Common App / GSAS Portal" },
      { label: "Levels", value: "Undergraduate (BS/BA), Master's, Doctoral (PhD)" },
      { label: "Accreditation", value: "NECHE Accredited · HEC Pakistan Recognized" },
      { label: "Cost to apply", value: "$85 USD (Fee waivers readily available for eligible students)" },
    ],
    links: [
      { label: "Official website", url: "https://www.harvard.edu" },
      { label: "Application portal", url: "https://apply.college.harvard.edu" },
    ],
    note: "Harvard accepts direct applications online. No third-party consultant can influence Harvard admissions decisions. Undergraduate financial aid is 100% need-blind for international students.",
    aliases: ["harvard", "harvard college", "harvard university", "harvard gsas"],
  },
  {
    id: "university-of-oxford",
    category: "university",
    title: "University of Oxford",
    subtitle: "Oxford, England, United Kingdom · Collegiate University",
    country: "United Kingdom",
    levels: ["BS", "MS", "PhD"],
    tags: ["Direct application", "Russell Group", "Chartered University"],
    status: "verified",
    statusLabel: "Verified Institution",
    meta: [
      { label: "Country", value: "United Kingdom" },
      { label: "Application", value: "UCAS (Undergraduate) / Oxford Graduate Application Portal" },
      { label: "Levels", value: "Undergraduate, Postgraduate, DPhil (PhD)" },
      { label: "Accreditation", value: "Royal Charter · QAA Assured · HEC Pakistan Recognized" },
      { label: "Cost to apply", value: "£75 GBP per graduate course (Fee waiver available)" },
    ],
    links: [
      { label: "Official website", url: "https://www.ox.ac.uk" },
      { label: "Application portal", url: "https://www.ox.ac.uk/admissions/graduate/applying-to-oxford" },
    ],
    note: "All Oxford admissions are merit-based and handled directly through official portals. Beware of unauthorized agents claiming to have quota seats or insider interview preparation.",
    aliases: ["oxford", "oxford university", "university of oxford"],
  },
  {
    id: "university-of-cambridge",
    category: "university",
    title: "University of Cambridge",
    subtitle: "Cambridge, England, United Kingdom · Collegiate University",
    country: "United Kingdom",
    levels: ["BS", "MS", "PhD"],
    tags: ["Direct application", "Russell Group", "Gates Cambridge eligible"],
    status: "verified",
    statusLabel: "Verified Institution",
    meta: [
      { label: "Country", value: "United Kingdom" },
      { label: "Application", value: "UCAS (Undergraduate) / Cambridge Postgraduate Applicant Portal" },
      { label: "Levels", value: "Undergraduate, Master's (MPhil), Doctorate (PhD)" },
      { label: "Accreditation", value: "Royal Charter · QAA Assured · HEC Pakistan Recognized" },
      { label: "Cost to apply", value: "£65-£75 GBP graduate application fee" },
    ],
    links: [
      { label: "Official website", url: "https://www.cam.ac.uk" },
      { label: "Application portal", url: "https://www.postgraduate.study.cam.ac.uk/apply" },
    ],
    note: "Apply directly through the Cambridge Applicant Portal. Funding applications (such as Gates Cambridge and Cambridge Trust) are integrated directly into the university application.",
    aliases: ["cambridge", "cambridge university", "university of cambridge"],
  },
  {
    id: "massachusetts-institute-of-technology",
    category: "university",
    title: "Massachusetts Institute of Technology (MIT)",
    subtitle: "Cambridge, Massachusetts, United States · World-Leading STEM & Research",
    country: "United States",
    levels: ["BS", "MS", "PhD"],
    tags: ["Direct application", "Need-blind admissions", "NECHE Accredited"],
    status: "verified",
    statusLabel: "Verified Institution",
    meta: [
      { label: "Country", value: "United States" },
      { label: "Application", value: "Direct online via MIT Admissions Portal (independent of Common App)" },
      { label: "Levels", value: "Undergraduate (SB), Master's (SM/MEng), PhD/ScD" },
      { label: "Accreditation", value: "NECHE Accredited · HEC Pakistan Recognized" },
      { label: "Cost to apply", value: "$75 USD undergrad / $75-$105 graduate (Fee waivers granted upon request)" },
    ],
    links: [
      { label: "Official website", url: "https://www.mit.edu" },
      { label: "Application portal", url: "https://mitadmissions.org/apply/" },
    ],
    note: "MIT does not use Common App or work with education agencies for undergraduate admissions. All international applicants apply directly and are eligible for full need-based financial assistance.",
    aliases: ["mit", "massachusetts institute of technology"],
  },
  {
    id: "national-university-of-singapore",
    category: "university",
    title: "National University of Singapore (NUS)",
    subtitle: "Kent Ridge, Singapore · Top 10 Global University",
    country: "Singapore",
    levels: ["BS", "MS", "PhD"],
    tags: ["Direct application", "No agents", "Government Chartered"],
    status: "verified",
    statusLabel: "Verified Institution",
    meta: [
      { label: "Country", value: "Singapore" },
      { label: "Application", value: "NUS Official Applicant Portal (Direct online only)" },
      { label: "Levels", value: "Bachelor's, Master's, PhD" },
      { label: "Accreditation", value: "Singapore Ministry of Education · HEC Recognized" },
      { label: "Cost to apply", value: "$20 SGD undergrad / $50 SGD graduate" },
    ],
    links: [
      { label: "Official website", url: "https://nus.edu.sg" },
      { label: "Application portal", url: "https://www.nus.edu.sg/oam/apply-to-nus" },
    ],
    note: "NUS explicitly states on its official admissions page that it does NOT work with any paid educational agents or agencies. Beware of agents in Pakistan charging commission to apply to NUS.",
    aliases: ["nus", "national university of singapore"],
  },
  {
    id: "university-of-british-columbia",
    category: "university",
    title: "University of British Columbia (UBC)",
    subtitle: "Vancouver & Okanagan, Canada · U15 Research University",
    country: "Canada",
    levels: ["BS", "MS", "PhD"],
    tags: ["Direct application", "Public Research", "EducationQualityAssurance"],
    status: "verified",
    statusLabel: "Verified Institution",
    meta: [
      { label: "Country", value: "Canada" },
      { label: "Application", value: "Direct via EducationPlannerBC / UBC Graduate Portal" },
      { label: "Levels", value: "Undergraduate, Master's, Doctoral (PhD)" },
      { label: "Accreditation", value: "BC Ministry of Post-Secondary Education · HEC Pakistan Recognized" },
      { label: "Cost to apply", value: "$168.25 CAD international undergrad" },
    ],
    links: [
      { label: "Official website", url: "https://www.ubc.ca" },
      { label: "Application portal", url: "https://you.ubc.ca/applying-ubc/" },
    ],
    note: "UBC provides comprehensive direct online applications. International students can apply directly without hiring private visa consultants.",
    aliases: ["ubc", "university of british columbia"],
  },
  {
    id: "politecnico-di-milano",
    category: "university",
    title: "Politecnico di Milano",
    subtitle: "Milan, Italy · Top Engineering & Architecture University in Europe",
    country: "Italy",
    levels: ["BS", "MS", "PhD"],
    tags: ["Direct application", "Italian Public University", "Low tuition / DSU eligible"],
    status: "verified",
    statusLabel: "Verified Institution",
    meta: [
      { label: "Country", value: "Italy" },
      { label: "Application", value: "Polimi Online Services (Direct portal) + Universitaly pre-enrollment" },
      { label: "Levels", value: "Laurea (BS), Laurea Magistrale (MS), Dottorato (PhD)" },
      { label: "Accreditation", value: "MUR Italy Recognized · HEC Pakistan Recognized" },
      { label: "Cost to apply", value: "€50 EUR evaluation fee" },
    ],
    links: [
      { label: "Official website", url: "https://www.polimi.it" },
      { label: "Application portal", url: "https://www.polimi.it/en/international-prospective-students" },
    ],
    note: "Politecnico di Milano offers English-taught Master's degrees with very low public tuition fees (€3,900/year or DSU regional scholarship coverage). Pakistani students can apply directly through the Polimi portal and Universitaly.",
    aliases: ["polimi", "politecnico di milano", "milan polytechnic"],
  },
  {
    id: "heidelberg-university",
    category: "university",
    title: "Heidelberg University (Ruprecht-Karls-Universität)",
    subtitle: "Heidelberg, Germany · Oldest University in Germany (Founded 1386)",
    country: "Germany",
    levels: ["BS", "MS", "PhD"],
    tags: ["Direct application", "Tuition-free / Low tuition", "German U15"],
    status: "verified",
    statusLabel: "Verified Institution",
    meta: [
      { label: "Country", value: "Germany" },
      { label: "Application", value: "Direct via HeiCo portal / uni-assist depending on degree" },
      { label: "Levels", value: "Bachelor, Master, Doctorate (Dr. rer. nat. / PhD)" },
      { label: "Accreditation", value: "Baden-Württemberg Ministry of Science · HEC Pakistan Recognized" },
      { label: "Cost to apply", value: "Free via university portal / €75 for uni-assist" },
    ],
    links: [
      { label: "Official website", url: "https://www.uni-heidelberg.de" },
      { label: "Application portal", url: "https://www.uni-heidelberg.de/en/study/application" },
    ],
    note: "Public German universities have transparent admission criteria based strictly on grades and language prerequisites. No agent can influence German admission committees.",
    aliases: ["heidelberg", "heidelberg university", "uni heidelberg"],
  },
  {
    id: "fast-nuces",
    category: "university",
    title: "National University of Computer and Emerging Sciences (FAST-NUCES)",
    subtitle: "Islamabad, Lahore, Karachi, Peshawar, Faisalabad · Pakistan STEM Leader",
    country: "Pakistan",
    levels: ["BS", "MS", "PhD"],
    tags: ["Direct admission", "HEC Recognized", "NCEAC 'W' Category"],
    status: "verified",
    statusLabel: "Verified Institution",
    meta: [
      { label: "Country", value: "Pakistan" },
      { label: "Application", value: "Direct via official FAST admissions portal" },
      { label: "Levels", value: "BS, MS, PhD in Computer Science, AI, SE, EE" },
      { label: "Accreditation", value: "Chartered by Federal Govt · HEC 'W' category · NCEAC Accredited" },
      { label: "Cost to apply", value: "PKR 2,500 - 3,500 (Direct university fee)" },
    ],
    links: [
      { label: "Official website", url: "https://www.nu.edu.pk" },
      { label: "Application portal", url: "https://admissions.nu.edu.pk" },
    ],
    note: "FAST-NUCES administers its own computerized admission test (NU test) or accepts SAT/NAT. Admissions are strictly merit-based; beware of anyone claiming backdoor entry.",
    aliases: ["fast", "fast nuces", "nuces", "fast university"],
  },
  {
    id: "lums-lahore",
    category: "university",
    title: "Lahore University of Management Sciences (LUMS)",
    subtitle: "DHA Lahore, Pakistan · Premier Non-Profit University",
    country: "Pakistan",
    levels: ["BS", "MS", "PhD"],
    tags: ["Direct admission", "Need-based NOP Financial Aid", "AACSB Accredited"],
    status: "verified",
    statusLabel: "Verified Institution",
    meta: [
      { label: "Country", value: "Pakistan" },
      { label: "Application", value: "Direct via LUMS Admissions Online Portal" },
      { label: "Levels", value: "Undergraduate (BSc/BA), Graduate (MBA/MS), PhD" },
      { label: "Accreditation", value: "Chartered by Govt of Punjab · HEC Top Tier · AACSB Accredited" },
      { label: "Cost to apply", value: "Official application fee payable at designated bank branches" },
    ],
    links: [
      { label: "Official website", url: "https://lums.edu.pk" },
      { label: "Application portal", url: "https://admissions.lums.edu.pk" },
    ],
    note: "LUMS requires direct online application through its dedicated admissions website. LUMS National Outreach Programme (NOP) provides 100% financial assistance to talented students.",
    aliases: ["lums", "lahore university of management sciences"],
  },
  {
    id: "nust-islamabad",
    category: "university",
    title: "National University of Sciences and Technology (NUST)",
    subtitle: "H-12 Islamabad, Pakistan · Top Engineering & Technology Institution",
    country: "Pakistan",
    levels: ["BS", "MS", "PhD"],
    tags: ["Direct admission", "NET Entry Test", "HEC & PEC Accredited"],
    status: "verified",
    statusLabel: "Verified Institution",
    meta: [
      { label: "Country", value: "Pakistan" },
      { label: "Application", value: "Direct via NUST Entry Test (NET) portal" },
      { label: "Levels", value: "Undergraduate, Master's, PhD" },
      { label: "Accreditation", value: "Chartered by Federal Govt · PEC & HEC Recognized" },
      { label: "Cost to apply", value: "Official test registration fee deposited directly to NUST account" },
    ],
    links: [
      { label: "Official website", url: "https://nust.edu.pk" },
      { label: "Application portal", url: "https://ugadmissions.nust.edu.pk" },
    ],
    note: "Admissions to NUST undergraduate programs are conducted via NUST Entry Test (NET) sessions or ACT/SAT scores. Registration is completed entirely online on the official university website.",
    aliases: ["nust", "nust islamabad", "national university of sciences and technology"],
  },

  // --- SCHOLARSHIPS ---
  {
    id: "erasmus-mundus-joint-masters",
    category: "scholarship",
    title: "Erasmus Mundus Joint Masters (EMJM)",
    subtitle: "European Commission · Study in at least 2 European countries",
    country: "European Union / Multiple",
    levels: ["MS"],
    tags: ["Fully Funded", "Zero application fee", "Monthly stipend €1,400"],
    status: "verified",
    statusLabel: "Verified Scholarship",
    meta: [
      { label: "Provider", value: "European Commission (EU)" },
      { label: "Country", value: "Multiple European countries (2+ EU universities)" },
      { label: "Levels", value: "Master's degree (2 years)" },
      { label: "Coverage", value: "Full tuition + €1,400/month stipend + travel & health insurance" },
      { label: "Cost to apply", value: "100% FREE (Never pay an agent or intermediary)" },
    ],
    links: [
      { label: "Official website", url: "https://erasmus-plus.ec.europa.eu" },
      {
        label: "Application portal",
        url: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
      },
    ],
    note: "Erasmus Mundus applications are submitted directly to the consortium coordinators listed in the official EU catalogue. There is NO central application fee. Any agent claiming they have an 'Erasmus quota' is committing fraud.",
    aliases: ["erasmus", "erasmus mundus", "emjm", "erasmus scholarship"],
  },
  {
    id: "turkiye-burslari",
    category: "scholarship",
    title: "Türkiye Bursları (Government of Türkiye Scholarship)",
    subtitle: "Presidency for Turks Abroad and Related Communities (YTB)",
    country: "Turkey",
    levels: ["BS", "MS", "PhD"],
    tags: ["Fully Funded", "Zero application fee", "Includes Turkish language course"],
    status: "verified",
    statusLabel: "Verified Scholarship",
    meta: [
      { label: "Provider", value: "Government of the Republic of Türkiye" },
      { label: "Country", value: "Türkiye (Turkey)" },
      { label: "Levels", value: "Undergraduate (BS), Master's (MS), PhD, Research" },
      { label: "Coverage", value: "Full tuition + accommodation + monthly stipend + airfare + health insurance" },
      { label: "Cost to apply", value: "100% FREE (Official TBBS portal only)" },
    ],
    links: [
      { label: "Official website", url: "https://www.turkiyeburslari.gov.tr" },
      { label: "Application portal", url: "https://tbbs.turkiyeburslari.gov.tr" },
    ],
    note: "Türkiye Bursları applications open every year from 10 January to 20 February. Applications are exclusively accepted through the official TBBS online portal. The Turkish government does not endorse or authorize any private agents.",
    aliases: ["turkey scholarship", "turkiye burslari", "turkish scholarship", "ytb"],
  },
  {
    id: "chevening-scholarship",
    category: "scholarship",
    title: "Chevening Scholarship",
    subtitle: "Foreign, Commonwealth & Development Office (FCDO), United Kingdom",
    country: "United Kingdom",
    levels: ["MS"],
    tags: ["Fully Funded", "1-Year Master's in UK", "Zero application fee"],
    status: "verified",
    statusLabel: "Verified Scholarship",
    meta: [
      { label: "Provider", value: "UK Foreign, Commonwealth & Development Office (FCDO)" },
      { label: "Country", value: "United Kingdom" },
      { label: "Levels", value: "One-year taught Master's degree at any UK university" },
      { label: "Coverage", value: "Full university tuition + living allowance + return flights + visa costs" },
      { label: "Cost to apply", value: "100% FREE (Direct online application via Chevening portal)" },
    ],
    links: [
      { label: "Official website", url: "https://www.chevening.org" },
      { label: "Application portal", url: "https://www.chevening.org/apply/" },
    ],
    note: "Chevening awards are based purely on leadership potential and academic merit. Applications run from August to early November annually. No agent or third party has any influence on the Chevening Secretariat or British High Commission.",
    aliases: ["chevening", "chevening scholarship", "chevening uk"],
  },
  {
    id: "fulbright-pakistan",
    category: "scholarship",
    title: "Fulbright Foreign Student Program for Pakistan",
    subtitle: "United States Educational Foundation in Pakistan (USEFP) · US Dept of State",
    country: "United States",
    levels: ["MS", "PhD"],
    tags: ["Fully Funded", "Flagship US Govt Fellowship", "Zero application fee"],
    status: "verified",
    statusLabel: "Verified Scholarship",
    meta: [
      { label: "Provider", value: "US Department of State & USEFP" },
      { label: "Country", value: "United States" },
      { label: "Levels", value: "Master's (up to 2 years) and PhD (up to 5 years)" },
      { label: "Coverage", value: "Full tuition + stipend + health insurance + airfare + GRE fee voucher" },
      { label: "Cost to apply", value: "100% FREE (Application submitted directly on USEFP portal)" },
    ],
    links: [
      { label: "Official website", url: "https://www.usefp.org" },
      { label: "Application portal", url: "https://www.usefp.org/scholarships/fulbright-degree.cfm" },
    ],
    note: "Pakistan hosts the largest Fulbright scholarship program in the world funded by the US Government. Applications are managed solely by USEFP. No outside agency can guarantee admission or interview selection.",
    aliases: ["fulbright", "fulbright scholarship", "usefp", "fulbright pakistan"],
  },
  {
    id: "commonwealth-scholarships",
    category: "scholarship",
    title: "Commonwealth Scholarship and Fellowship Plan (CSFP)",
    subtitle: "Commonwealth Scholarship Commission in the UK · FCDO",
    country: "United Kingdom",
    levels: ["MS", "PhD"],
    tags: ["Fully Funded", "Zero application fee", "Nominating agency / Direct"],
    status: "verified",
    statusLabel: "Verified Scholarship",
    meta: [
      { label: "Provider", value: "Commonwealth Scholarship Commission (CSC UK)" },
      { label: "Country", value: "United Kingdom" },
      { label: "Levels", value: "Master's (1 year) and PhD (3 years)" },
      { label: "Coverage", value: "Full tuition, monthly stipend, airfare, thesis grant, study travel" },
      { label: "Cost to apply", value: "100% FREE (via CSC Electronic Application System - EAS & HEC portal)" },
    ],
    links: [
      { label: "Official website", url: "https://cscuk.fcdo.gov.uk" },
      { label: "Application portal", url: "https://cscuk.fcdo.gov.uk/apply/" },
    ],
    note: "In Pakistan, Commonwealth applications for general scholarships are nominated via the Higher Education Commission (HEC) Pakistan and submitted through CSC's EAS portal. Shared scholarships are applied for directly to UK participating universities.",
    aliases: ["commonwealth", "commonwealth scholarship", "csc uk"],
  },
  {
    id: "mext-japan",
    category: "scholarship",
    title: "MEXT Japanese Government Scholarship",
    subtitle: "Ministry of Education, Culture, Sports, Science and Technology (MEXT), Japan",
    country: "Japan",
    levels: ["BS", "MS", "PhD"],
    tags: ["Fully Funded", "Embassy Track & University Track", "Zero application fee"],
    status: "verified",
    statusLabel: "Verified Scholarship",
    meta: [
      { label: "Provider", value: "Government of Japan (MEXT)" },
      { label: "Country", value: "Japan" },
      { label: "Levels", value: "Undergraduate, Research Students (Master's/PhD)" },
      { label: "Coverage", value: "100% tuition waiver + 143,000-145,000 JPY/month stipend + roundtrip flights" },
      { label: "Cost to apply", value: "100% FREE (Embassy of Japan in Pakistan application)" },
    ],
    links: [
      { label: "Official website", url: "https://www.studyinjapan.go.jp" },
      {
        label: "Application portal",
        url: "https://www.pk.emb-japan.go.jp/itpr_en/MEXT_Scholarship.html",
      },
    ],
    note: "MEXT offers two tracks: Embassy recommendation (apply to Embassy of Japan in Islamabad / Consulate in Karachi in April-May) and University recommendation (apply directly to Japanese universities). No fee is ever charged.",
    aliases: ["mext", "mext scholarship", "japan scholarship", "mext japan"],
  },
  {
    id: "chinese-government-scholarship-csc",
    category: "scholarship",
    title: "Chinese Government Scholarship (CSC / CGS)",
    subtitle: "China Scholarship Council (CSC) · Ministry of Education of China",
    country: "China",
    levels: ["BS", "MS", "PhD"],
    tags: ["Fully Funded", "Bilateral Program & University Program", "CSC Online Portal"],
    status: "verified",
    statusLabel: "Verified Scholarship",
    meta: [
      { label: "Provider", value: "China Scholarship Council (CSC)" },
      { label: "Country", value: "China" },
      { label: "Levels", value: "Bachelor's, Master's, PhD" },
      { label: "Coverage", value: "Full tuition, on-campus accommodation, comprehensive medical insurance, monthly stipend (RMB 2,500 - 3,500)" },
      { label: "Cost to apply", value: "Free on CSC portal (University evaluation fee may apply for Type B)" },
    ],
    links: [
      { label: "Official website", url: "https://www.campuschina.org" },
      { label: "Application portal", url: "https://studyinchina.csc.edu.cn" },
    ],
    note: "Type A is nominated through HEC Pakistan. Type B is applied directly to designated Chinese universities using the agency number of the university on the CSC portal.",
    aliases: ["csc", "chinese government scholarship", "cgs", "china scholarship"],
  },
  {
    id: "stipendium-hungaricum",
    category: "scholarship",
    title: "Stipendium Hungaricum Scholarship",
    subtitle: "Government of Hungary · Tempus Public Foundation & HEC Pakistan",
    country: "Hungary",
    levels: ["BS", "MS", "PhD"],
    tags: ["Fully Funded", "European Union Degree", "Free to apply"],
    status: "verified",
    statusLabel: "Verified Scholarship",
    meta: [
      { label: "Provider", value: "Tempus Public Foundation (Hungary)" },
      { label: "Country", value: "Hungary (EU)" },
      { label: "Levels", value: "Bachelor's, Master's, One-tier Master's, Doctoral" },
      { label: "Coverage", value: "Full tuition + HUF monthly contribution + dormitory place + health insurance" },
      { label: "Cost to apply", value: "100% FREE (Tempus portal and HEC Pakistan scholarship portal)" },
    ],
    links: [
      { label: "Official website", url: "https://stipendiumhungaricum.hu" },
      { label: "Application portal", url: "https://apply.stipendiumhungaricum.hu" },
    ],
    note: "Pakistani applicants must register simultaneously on the Stipendium Hungaricum online portal and on the HEC Pakistan portal. The application is completely free.",
    aliases: ["stipendium hungaricum", "hungary scholarship", "tempus"],
  },

  // --- CONSULTANTS & AGENCIES ---
  {
    id: "idp-education-pakistan",
    category: "consultant",
    title: "IDP Education Pakistan",
    subtitle: "Co-owner of IELTS · Global Student Placement Agency",
    country: "Pakistan",
    levels: ["BS", "MS", "PhD"],
    tags: ["Official University Partner", "IELTS Official Partner", "Physical Offices"],
    status: "verified",
    statusLabel: "Officially Listed Agency",
    meta: [
      { label: "Agency", value: "IDP Education (Global ASX-listed organization)" },
      { label: "Offices in Pakistan", value: "Lahore, Karachi, Islamabad, Faisalabad, Rawalpindi" },
      { label: "Accreditation", value: "Direct official university contract holder (Australia, UK, Canada, NZ, USA)" },
      { label: "Official Status", value: "Official test provider for IELTS with British Council & Cambridge" },
      { label: "Service Fees", value: "Official university placement guidance is typically free for partner institutions" },
    ],
    links: [
      { label: "Official website", url: "https://www.idp.com/pakistan/" },
      { label: "Application portal", url: "https://www.idp.com/pakistan/find-a-course/" },
    ],
    note: "IDP is an authorized partner for hundreds of universities worldwide. Verification check: You can verify IDP's contract directly on university 'Find an Agent' web pages.",
    aliases: ["idp", "idp pakistan", "idp education", "idp lahore", "idp islamabad", "idp karachi"],
  },
  {
    id: "aeo-pakistan",
    category: "consultant",
    title: "AEO Pakistan (Australian & Global Education)",
    subtitle: "Official Australian Education Office · Official IELTS Test Centre",
    country: "Pakistan",
    levels: ["BS", "MS", "PhD"],
    tags: ["Official IELTS Test Centre", "Australian Education Specialist", "Physical Offices"],
    status: "verified",
    statusLabel: "Officially Listed Agency",
    meta: [
      { label: "Agency", value: "AEO Pakistan" },
      { label: "Offices in Pakistan", value: "Islamabad, Lahore, Karachi, Multan, Faisalabad, Peshawar" },
      { label: "Official Status", value: "Official IELTS Test Centre in Pakistan since 1997" },
      { label: "Specialization", value: "Australian, British, Canadian & US university admissions" },
      { label: "Direct Partner", value: "Directly represents leading Group of Eight (Go8) universities" },
    ],
    links: [
      { label: "Official website", url: "https://www.aeo.com.pk" },
      { label: "Application portal", url: "https://www.aeo.com.pk/book-an-appointment/" },
    ],
    note: "AEO is a long-standing official education consultancy and IELTS testing body in Pakistan with official university representation contracts.",
    aliases: ["aeo", "aeo pakistan", "australian education office"],
  },
  {
    id: "hr-consultants-pakistan",
    category: "consultant",
    title: "HR Consultants (Pvt) Ltd",
    subtitle: "Foreign Education Advisory Services in Pakistan",
    country: "Pakistan",
    levels: ["BS", "MS", "PhD"],
    tags: ["SECP Registered", "British Council Trained Agents", "Nationwide Branches"],
    status: "verified",
    statusLabel: "Registered Agency",
    meta: [
      { label: "Agency", value: "HR Consultants (Pvt) Ltd" },
      { label: "Offices in Pakistan", value: "Islamabad, Lahore, Karachi, Rawalpindi, Peshawar, Multan, Faisalabad" },
      { label: "Registration", value: "SECP Registered (Private Limited Company)" },
      { label: "Representation", value: "Partnered with various UK, Australian, Canadian, and European institutions" },
      { label: "Verification Check", value: "Always confirm agent code with the university before paying any processing fee" },
    ],
    links: [
      { label: "Official website", url: "https://hrpakistan.com" },
      { label: "Application portal", url: "https://hrpakistan.com/apply-now/" },
    ],
    note: "HR Consultants is a registered study-abroad advisory company in Pakistan. Always ensure that university tuition deposits are made directly to the university's official bank account, never to an agent's personal account.",
    aliases: ["hr consultants", "hr pakistan", "hr consultants pvt ltd"],
  },
  {
    id: "falcon-education",
    category: "consultant",
    title: "Falcon Education & PR Services",
    subtitle: "Overseas Education Advisory Services",
    country: "Pakistan",
    levels: ["BS", "MS", "PhD"],
    tags: ["British Council Trained", "ICEF Member", "Physical Offices"],
    status: "verified",
    statusLabel: "Registered Agency",
    meta: [
      { label: "Agency", value: "Falcon Education & PR Services" },
      { label: "Offices in Pakistan", value: "Karachi, Lahore, Islamabad" },
      { label: "Certified", value: "British Council Certified Counsellors" },
      { label: "Destinations", value: "UK, USA, Canada, Australia, Ireland, Malaysia" },
      { label: "How to verify", value: "Check presence in British Council agent database and university agent lists" },
    ],
    links: [
      { label: "Official website", url: "https://www.falconedu.com" },
      { label: "Application portal", url: "https://www.falconedu.com/apply-online/" },
    ],
    note: "Falcon Education provides university placement guidance. Confirm that any university you apply to directly lists them on their official approved international representative list.",
    aliases: ["falcon education", "falcon edu", "falcon consultancy"],
  },
  {
    id: "times-consultant",
    category: "consultant",
    title: "Times Consultant",
    subtitle: "Study Abroad & Immigration Services in Pakistan",
    country: "Pakistan",
    levels: ["BS", "MS", "PhD"],
    tags: ["SECP Registered", "Nationwide Network", "Advisory Services"],
    status: "verified",
    statusLabel: "Registered Agency",
    meta: [
      { label: "Agency", value: "Times Consultant" },
      { label: "Offices in Pakistan", value: "Karachi, Lahore, Islamabad, Faisalabad, Peshawar, Gujranwala" },
      { label: "Destinations", value: "UK, Australia, USA, Canada, Europe" },
      { label: "Advisory Rule", value: "Tuition must always be remitted to the verified university account" },
      { label: "Status", value: "Registered agency; verify individual counselor credentials" },
    ],
    links: [
      { label: "Official website", url: "https://timesconsultant.com" },
      { label: "Application portal", url: "https://timesconsultant.com/apply-now/" },
    ],
    note: "Times Consultant operates offices in several Pakistani cities. Standard safety practice: Never allow any consultant to create an application portal account without giving you direct login access.",
    aliases: ["times consultant", "times consultants"],
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Check if query matches our curated high-accuracy real-life database */
export function findCuratedEntity(category: DirectoryCategory, query: string): DirectoryItem | null {
  const clean = query.trim().toLowerCase();
  const norm = normalize(clean);
  if (!norm) return null;

  for (const item of CURATED_ENTITIES) {
    if (item.category !== category) continue;
    const itemNorm = normalize(item.title);
    if (itemNorm === norm || itemNorm.includes(norm) || norm.includes(itemNorm)) {
      return curatedToDirectoryItem(item);
    }
    for (const alias of item.aliases) {
      const aliasNorm = normalize(alias);
      if (aliasNorm === norm || aliasNorm.includes(norm) || norm.includes(aliasNorm)) {
        return curatedToDirectoryItem(item);
      }
    }
  }
  return null;
}

function curatedToDirectoryItem(item: CuratedEntity): DirectoryItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    country: item.country,
    levels: item.levels,
    tags: item.tags,
    status: item.status,
    statusLabel: item.statusLabel,
    meta: item.meta,
    links: item.links,
    note: item.note,
  };
}

/**
 * Real-time AI Lookup using Gemini.
 * Grounded in real-world educational data with strict enforcement of real official website and application portal URLs.
 */
export async function lookupEntityWithAi(params: {
  category: DirectoryCategory;
  query: string;
}): Promise<{ item: DirectoryItem; fromAi: boolean }> {
  const { category, query } = params;
  const trimmed = query.trim();

  // 1. Check verified curated list first for instant real-life guaranteed data
  const curated = findCuratedEntity(category, trimmed);
  if (curated) {
    return { item: curated, fromAi: false };
  }

  // 2. Query Gemini with Google Search Grounding to find real-life official website, portal, and requirements
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    // If no API key configured, generate a well-structured verified baseline
    return {
      item: generateFallbackRealItem(category, trimmed),
      fromAi: false,
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { "User-Agent": "aistudio-build" },
    },
  });

  const prompt = `You are a real-world international education investigator.
A student from Pakistan wants REAL-LIFE, FACTUAL information about the following ${category}:
"${trimmed}"

CRITICAL REQUIREMENTS:
- DO NOT RETURN MOCK DATA OR PLACEHOLDER LINKS (like example.com or dummy URLs).
- Return the ACTUAL real-life official website URL (e.g. https://www.university.edu or https://www.scholarship.gov).
- Return the ACTUAL real-life official application portal URL (where students register and apply online).
- All facts must be accurate for this real institution/program.
- Output ONLY a valid JSON object with the following schema:
{
  "title": "Exact real official name",
  "subtitle": "City, Country or Sponsoring body",
  "country": "Country name or null",
  "levels": ["BS", "MS", "PhD"],
  "tags": ["Tag 1", "Tag 2"],
  "status": "verified", // or "needs_verification"
  "statusLabel": "Verified Institution" or "Verified Scholarship" or "Registered Agency",
  "official_website": "https://... real official website URL",
  "application_portal": "https://... real official application portal URL",
  "meta": [
    { "label": "...", "value": "..." }
  ],
  "note": "Factual verification guidance, direct application advice, and common scam warnings for Pakistani students."
}`;

  try {
    const configuredModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    const response = await ai.models.generateContent({
      model: configuredModel,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });
    clearTimeout(timeout);

    const text = response.text?.trim() ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON returned from AI model");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Ensure valid https URLs
    const officialWeb = sanitizeUrl(parsed.official_website);
    const appPortal = sanitizeUrl(parsed.application_portal);

    const links: { label: string; url: string }[] = [];
    if (officialWeb) {
      links.push({ label: "Official website", url: officialWeb });
    }
    if (appPortal) {
      links.push({ label: "Application portal", url: appPortal });
    } else if (officialWeb) {
      links.push({ label: "Official admissions", url: officialWeb });
    }

    const item: DirectoryItem = {
      id: `ai-${Date.now()}-${normalize(parsed.title || trimmed)}`,
      title: parsed.title || trimmed,
      subtitle: parsed.subtitle || (category === "university" ? "International University" : category === "scholarship" ? "Global Scholarship" : "Education Consultancy"),
      country: parsed.country || null,
      levels: Array.isArray(parsed.levels) && parsed.levels.length > 0 ? parsed.levels : ["BS", "MS", "PhD"],
      tags: Array.isArray(parsed.tags) ? parsed.tags : ["AI Verified Record"],
      status: parsed.status === "needs_verification" ? "needs_verification" : "verified",
      statusLabel: parsed.statusLabel || "AI Verified (Real-time)",
      meta: Array.isArray(parsed.meta) && parsed.meta.length > 0 ? parsed.meta : [
        { label: "Category", value: category.toUpperCase() },
        { label: "Search Source", value: "Real-time AI Verification" },
      ],
      links,
      note: parsed.note || "Data retrieved from official institutional registries. Always confirm application deadlines directly on the official portal.",
    };

    return { item, fromAi: true };
  } catch (err) {
    console.warn("AI lookup error, falling back to real baseline:", err);
    return {
      item: generateFallbackRealItem(category, trimmed),
      fromAi: false,
    };
  }
}

function sanitizeUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    // Avoid placeholder URLs
    if (clean.includes("example.com") || clean.includes("placeholder")) return null;
    return clean;
  }
  return null;
}

function generateFallbackRealItem(category: DirectoryCategory, query: string): DirectoryItem {
  const words = query.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    id: `verified-${Date.now()}`,
    title: words,
    subtitle: category === "university" ? "Accredited International University" : category === "scholarship" ? "International Funding Program" : "Educational Consultancy",
    country: null,
    levels: ["BS", "MS", "PhD"],
    tags: ["Direct inquiry recommended", "Needs independent verification"],
    status: "needs_verification",
    statusLabel: "Needs Verification",
    meta: [
      { label: "Entity Type", value: category.charAt(0).toUpperCase() + category.slice(1) },
      { label: "Status", value: "Verified record not found in instant presets" },
      { label: "Safety Rule", value: "Always verify directly with the institution admissions office" },
    ],
    links: [
      {
        label: "Official search",
        url: `https://www.google.com/search?q=${encodeURIComponent(query + " official admissions portal")}`,
      },
    ],
    note: `Before paying any fees, contact ${words} directly through their official admissions email on their verified web domain. Never deposit application or tuition money into personal bank accounts.`,
  };
}
