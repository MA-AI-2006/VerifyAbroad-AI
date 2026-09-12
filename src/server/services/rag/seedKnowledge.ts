export interface SeedDocument {
  id: string;
  title: string;
  source: string;
  docType: "policy" | "guideline";
  content: string;
}

export const SEED_KNOWLEDGE_DOCUMENTS: SeedDocument[] = [
  {
    id: "hec-equivalence-regulations",
    title: "HEC Pakistan: Foreign Degree Recognition & Equivalence Guidelines",
    source: "Higher Education Commission (HEC) Pakistan Official Equivalence Manual",
    docType: "policy",
    content: `HEC Higher Education Commission Pakistan Equivalence Regulations for Foreign Degrees:
1. Accreditation Requirement: Foreign qualifications are only recognized if awarded by institutions chartered and accredited by the recognized national accreditation body of the host country.
2. Degree Mills and Unaccredited Online Entities: Degrees from unauthorized online colleges, distance learning without residency requirements (where not recognized), and offshore campuses in unaccredited zones (such as non-accredited entities in Northern Cyprus or Eastern Europe) are strictly not given equivalence in Pakistan.
3. Attestation Protocol: Before applying for government employment, higher education, or professional registration (e.g. PMC, PEC), foreign degree holders must submit original transcripts, graduation certificates, passport entry/exit stamps proving physical residency during studies, and visa copies.
4. Warning on Non-Accredited Agent Programs: Students are warned that consultants offering guaranteed degree completions in accelerated periods or without standard classroom attendance are fraudulent.`,
  },
  {
    id: "ukvi-student-visa-rules",
    title: "UKVI & British Council: Student Route Sponsor Licensing & CAS Protocols",
    source: "UK Visas and Immigration (UKVI) Student Sponsor Guidance & British Council",
    docType: "policy",
    content: `UK Visas and Immigration (UKVI) Student Route Regulations:
1. Confirmation of Acceptance for Studies (CAS): A valid CAS is an electronic reference number issued exclusively by a licensed UKVI Student Sponsor institution. No third-party consultant or agency has the authority to generate a CAS.
2. Maintenance Funds 28-Day Rule: Tuition fee balance and maintenance funds (£1,334 per month for London, £1,023 per month outside London for up to 9 months) must be held continuously in a regulated financial institution for a minimum consecutive 28-day period prior to visa application. The balance must never drop below the required threshold for even one day.
3. Tuition Payments: Official universities accept tuition deposits and fees only through direct banking mechanisms (such as Convera, Flywire, or direct university IBAN wire transfers). Never pay tuition into local personal bank accounts of consultants or middlemen.
4. Academic Technology Approval Scheme (ATAS): Required for postgraduate study in certain science, engineering, and tech disciplines before visa application can be submitted.`,
  },
  {
    id: "german-daad-anabin-rules",
    title: "German DAAD & Anabin: University Admissions & Sperrkonto (Blocked Account)",
    source: "DAAD Germany & KMK Anabin Central Office for Foreign Education",
    docType: "policy",
    content: `Federal Republic of Germany Student Visa & Higher Education Regulations:
1. Public University Tuition: The vast majority of German public universities charge zero tuition fees for international students (a semester fee of €150-€350 for public transit and student services is standard). Any consultant demanding high annual tuition for standard German public university programs is misleading applicants.
2. Anabin Database & Direct Qualification: Admission requires that the student's Pakistani qualification matches the German Abitur or Bachelor standard. University status must be 'H+' on the Anabin database. 16-year Bachelor degrees from HEC-recognized institutions generally qualify for direct Master's admission.
3. Blocked Account (Sperrkonto): Proof of financial resources requires opening a legally recognized Blocked Account (Sperrkonto) with authorized providers (such as Fintiba, Coracle, Expatrio, or Deutsche Bank) in the student's own name, currently requiring approximately €11,904/year. Funds are released monthly to the student after arrival. Consultants must never hold these funds in third-party accounts.`,
  },
  {
    id: "australia-cricos-gs-rules",
    title: "Australian Home Affairs: Genuine Student (GS) & CRICOS Provider Rules",
    source: "Australian Department of Home Affairs & CRICOS Register",
    docType: "policy",
    content: `Australian Department of Home Affairs Subclass 500 Student Visa Requirements:
1. CRICOS Registration: International students can only enroll in courses registered on the Commonwealth Register of Institutions and Courses for Overseas Students (CRICOS). Each valid offer letter includes a CRICOS course code.
2. Genuine Student (GS) Criterion: Replaces the former GTE requirement. Students must provide detailed written evidence of their personal circumstances, academic progression, reasons for choosing Australia and the specific provider, and economic ties to Pakistan.
3. Financial Capacity Evidence: Applicants must show evidence of 12 months of living costs (AU$29,710+), course fees, and travel expenses. Funds must be from genuine, verifiable sources. Third-party 'show money' provided by loans sharks or consultants is investigated and leads to visa refusal and a 3-year ban under PIC 4020 for providing fraudulent documents.`,
  },
  {
    id: "us-sevp-f1-visa-rules",
    title: "US Department of State & SEVP: F-1 Visa, Form I-20 & SEVIS Compliance",
    source: "U.S. Immigration and Customs Enforcement (ICE) Student and Exchange Visitor Program",
    docType: "policy",
    content: `United States Student Visa (F-1) Protocols:
1. Form I-20 Issuance: Only SEVP-certified schools are authorized to issue Form I-20 (Certificate of Eligibility for Nonimmigrant Student Status). The I-20 is issued directly by the Designated School Official (DSO) at the university after direct academic review and financial verification.
2. SEVIS I-901 Fee: Must be paid directly online through the official US government portal (fmjfee.com). The SEVIS fee is never payable to local consultants or via cash transfers.
3. Visa Interview & Non-Guarantee: F-1 student visas require an in-person consular interview at the US Embassy in Islamabad or Consulate in Karachi. No consultant can guarantee visa approval. Guarantees of '100% visa success' or claims of 'embassy quota' are fraudulent.
4. Work Authorization: F-1 students are strictly limited to on-campus employment up to 20 hours per week during school terms. Off-campus employment without explicit DSO/USCIS authorization (CPT or OPT) is a federal visa violation.`,
  },
  {
    id: "study-abroad-fraud-red-flags",
    title: "VerifyAbroad Advisory: Critical Red Flags in Study Abroad Consultancies",
    source: "VerifyAbroad Fraud Intelligence Unit & Overseas Education Protection Network",
    docType: "guideline",
    content: `Top Warning Signals and Fraud Modus Operandi in Educational Consultancy:
1. Guaranteed Visa Approval: Consulates and embassies do not sell visas or grant quotas to private agencies. Any agent claiming '100% guaranteed visa' or 'internal embassy contacts' is operating a scam.
2. Arranging 'Show Money' / Fake Bank Statements: Agents providing fake bank balances or turnover letters violate criminal forgery laws. Embassies verify bank statements directly with commercial banks; forged statements result in immediate 5-to-10 year visa bans and potential criminal referral.
3. Passport and Original Document Retention: Agents withholding a student's original passport, matric/intermediate degrees, or identity documents as collateral for money or fees are committing document extortion.
4. Tuition Paid to Personal / Agent Accounts: Authentic universities only accept fee transfers to their own institutional bank accounts or authorized payment platforms (Flywire, Convera). Never wire tuition fees to an agent's personal account.
5. Offer Letters without Official Registrar Contact: Counterfeit offer letters often feature blurred logos, generic email domains (@gmail.com, @consultant.com instead of university.edu/ac.uk), and lack verifiable admission portals.`,
  },
];
