// Fixed (non-data) strings that appear inside the generated documents, in both
// languages. Shared by the HTML preview (lib/templates.ts) and the PDF renderer
// (lib/pdf.ts) so the two always agree.
import { Lang } from "./i18n";

type B = { en: string; ar: string };

const S = {
  certKicker: { en: "Certificate of Achievement", ar: "شهادة تقدير" },
  presentedTo: { en: "This certificate is proudly presented to", ar: "تُمنح هذه الشهادة بكل فخر إلى" },
  awardDefault: { en: "Award", ar: "جائزة" },
  recipientName: { en: "Recipient name", ar: "اسم المستلم" },

  teacher: { en: "Teacher", ar: "المعلم" },
  date: { en: "Date", ar: "التاريخ" },
  school: { en: "School", ar: "المدرسة" },
  signature: { en: "Signature", ar: "التوقيع" },
  officialStamp: { en: "Official stamp", ar: "الختم الرسمي" },
  schoolNamePh: { en: "School name", ar: "اسم المدرسة" },

  prTitle: { en: "Progress Report", ar: "تقرير الأداء" },
  student: { en: "Student", ar: "الطالب" },
  studentName: { en: "Student name", ar: "اسم الطالب" },
  klass: { en: "Class", ar: "الصف" },
  subject: { en: "Subject", ar: "المادة" },
  mark: { en: "Mark", ar: "الدرجة" },
  teacherComment: { en: "Teacher's comment", ar: "ملاحظة المعلم" },
  noSubjects: { en: "No subjects selected — pick subject columns to fill this table.", ar: "لم تُحدَّد مواد — اختر أعمدة المواد لملء هذا الجدول." },

  frTitle: { en: "Fee Receipt", ar: "إيصال رسوم" },
  receipt: { en: "Receipt", ar: "إيصال" },
  receivedFrom: { en: "Received from", ar: "استُلم من" },
  method: { en: "Method", ar: "طريقة الدفع" },
  description: { en: "Description", ar: "البيان" },
  amount: { en: "Amount", ar: "المبلغ" },
  tuitionDefault: { en: "Tuition fee", ar: "رسوم دراسية" },
  total: { en: "Total", ar: "الإجمالي" },
  paid: { en: "Paid", ar: "المدفوع" },
  balance: { en: "Balance", ar: "الرصيد" },
  paidPill: { en: "PAID", ar: "مدفوع" },
  receivedBy: { en: "Received by", ar: "استلمها" },

  idTag: { en: "Student ID", ar: "بطاقة طالب" },
  idRole: { en: "Student", ar: "طالب" },
  libTag: { en: "Library", ar: "مكتبة" },
  libRole: { en: "Member", ar: "عضو" },
  validUntil: { en: "Valid until", ar: "صالحة حتى" },
  expires: { en: "Expires", ar: "تنتهي" },
  cardTerms: {
    en: "This card is property of the school and must be returned on request. Use is non-transferable.",
    ar: "هذه البطاقة ملك للمدرسة ويجب إعادتها عند الطلب. الاستخدام غير قابل للتحويل.",
  },
  cardReturn: { en: "If found, please return to", ar: "في حال العثور عليها، يُرجى إعادتها إلى" },
  cardEmergency: { en: "Emergency contact", ar: "جهة الاتصال للطوارئ" },

  corridorPass: { en: "Corridor pass", ar: "تصريح ممرات" },
  hallPass: { en: "Hall Pass", ar: "تصريح مرور" },
  permissionFor: { en: "Permission for", ar: "تصريح لـ" },
  destination: { en: "Destination", ar: "الوجهة" },
  timeOut: { en: "Time out", ar: "وقت الخروج" },
  issuedBy: { en: "Issued by", ar: "أصدره" },

  // letters
  attTitle: { en: "Attendance Notice", ar: "إشعار حضور" },
  dearGuardian: { en: "Dear Parent / Guardian,", ar: "عزيزي ولي الأمر،" },
  attClose: { en: "Please contact the school office if you have any questions or wish to discuss the matter further.", ar: "يرجى التواصل مع إدارة المدرسة لأي استفسار أو لمناقشة الأمر." },
  schoolAdmin: { en: "School administration", ar: "إدارة المدرسة" },
  attendance: { en: "Attendance", ar: "الحضور" },
  daysAbsent: { en: "Days absent", ar: "أيام الغياب" },
  period: { en: "Period", ar: "الفترة" },

  enrTitle: { en: "Enrollment Confirmation", ar: "تأكيد التسجيل" },
  toWhom: { en: "To whom it may concern,", ar: "إلى من يهمه الأمر،" },
  enrClose: { en: "This confirmation is issued upon request and may be used for official purposes.", ar: "صدر هذا التأكيد بناءً على الطلب ويمكن استخدامه للأغراض الرسمية." },
  authSignatory: { en: "Authorised signatory", ar: "الموقّع المعتمد" },
  classGrade: { en: "Class / grade", ar: "الصف / المرحلة" },
  academicYear: { en: "Academic year", ar: "العام الدراسي" },
  admissionNo: { en: "Admission no.", ar: "رقم القبول" },
  statusLbl: { en: "Status", ar: "الحالة" },
  confirmedDefault: { en: "confirmed", ar: "مؤكَّد" },

  permTitle: { en: "Permission Slip", ar: "إذن مشاركة" },
  permClose: { en: "Please sign below to give consent for your child to participate. Return this slip to the school office by the date indicated.", ar: "يرجى التوقيع أدناه للموافقة على مشاركة طفلكم. أعيدوا هذه القسيمة إلى إدارة المدرسة في الموعد المحدد." },
  activity: { en: "Activity", ar: "النشاط" },
  location: { en: "Location", ar: "المكان" },
  cost: { en: "Cost", ar: "التكلفة" },
  parentSig: { en: "Parent / guardian signature", ar: "توقيع ولي الأمر" },
  activityDefault: { en: "a school activity", ar: "نشاط مدرسي" },

  refTitle: { en: "Reference Letter", ar: "خطاب توصية" },
  refClose: { en: "Please do not hesitate to contact me should you require any further information.", ar: "لا تترددوا في التواصل معي إذا احتجتم أي معلومات إضافية." },
  theStudent: { en: "the student", ar: "الطالب" },

  // completion / graduation certificate
  complKicker: { en: "Certificate of Completion", ar: "شهادة إتمام" },
  complCertify: { en: "This is to certify that", ar: "نشهد بأن" },
  program: { en: "Program", ar: "البرنامج" },
  result: { en: "Result", ar: "النتيجة" },
  completionDate: { en: "Completion date", ar: "تاريخ الإتمام" },
  programDefault: { en: "the programme of study", ar: "البرنامج الدراسي" },

  // transfer certificate
  tcTitle: { en: "Transfer Certificate", ar: "شهادة نقل" },
  tcClose: { en: "This certificate is issued for the purpose of transfer or admission to another institution.", ar: "تصدر هذه الشهادة لغرض النقل أو القبول في مؤسسة أخرى." },
  dob: { en: "Date of birth", ar: "تاريخ الميلاد" },
  dateLeaving: { en: "Date of leaving", ar: "تاريخ المغادرة" },
  reason: { en: "Reason", ar: "السبب" },
  conduct: { en: "Conduct", ar: "السلوك" },

  // bonafide certificate
  bfTitle: { en: "Bonafide Certificate", ar: "شهادة قيد" },
  bfClose: { en: "This certificate is issued upon request for official use.", ar: "تصدر هذه الشهادة بناءً على الطلب للاستخدام الرسمي." },
  purpose: { en: "Purpose", ar: "الغرض" },
  purposeDefault: { en: "general use", ar: "الاستخدام العام" },

  // character certificate
  ccTitle: { en: "Character Certificate", ar: "شهادة حسن سيرة وسلوك" },
  ccClose: { en: "We wish them success in all their future endeavours.", ar: "نتمنى له كل التوفيق في مستقبله." },
  conductDefault: { en: "good", ar: "حسن" },
};

export type DocLabels = Record<keyof typeof S, string> & {
  // sentence builders (interpolated)
  dearName: (n: string) => string;
  attMsg: (n: string) => string;
  enrBody: (n: string, status: string, year: string) => string;
  permBody: (n: string, event: string) => string;
  refBody: (who: string) => string;
  complBody: (program: string, year: string) => string;
  tcBody: (n: string, klass: string, dateLeaving: string) => string;
  bfBody: (n: string, klass: string, year: string) => string;
  bfPurpose: (purpose: string) => string;
  ccBody: (n: string, klass: string, conduct: string) => string;
};

// Which fixed labels each template exposes for user editing (the headline text
// + key captions). Keys are scalar entries of S above.
export type LabelKey = keyof typeof S;
export const EDITABLE_LABELS: Record<string, LabelKey[]> = {
  "certificate-classic": ["certKicker", "presentedTo", "teacher", "date", "school"],
  "progress-report": ["prTitle", "student", "klass", "subject", "mark", "teacherComment"],
  "fee-receipt": ["frTitle", "receivedFrom", "method", "description", "total", "paid", "balance", "paidPill", "receivedBy"],
  "student-id-card": ["idTag", "idRole", "validUntil", "cardTerms", "cardReturn", "cardEmergency"],
  "library-card": ["libTag", "libRole", "expires", "cardTerms", "cardReturn", "cardEmergency"],
  "hall-pass": ["corridorPass", "hallPass", "permissionFor", "destination", "timeOut", "issuedBy"],
  "attendance-letter": ["attTitle", "attClose", "attendance", "daysAbsent", "period", "schoolAdmin"],
  "enrollment-confirmation": ["enrTitle", "toWhom", "enrClose", "academicYear", "admissionNo", "statusLbl", "authSignatory"],
  "permission-slip": ["permTitle", "permClose", "activity", "location", "cost", "parentSig"],
  "reference-letter": ["refTitle", "refClose", "authSignatory"],
  "completion-certificate": ["complKicker", "complCertify", "program", "result", "completionDate"],
  "transfer-certificate": ["tcTitle", "tcClose", "dob", "dateLeaving", "reason", "conduct"],
  "bonafide-certificate": ["bfTitle", "bfClose", "purpose"],
  "character-certificate": ["ccTitle", "ccClose", "conduct", "period"],
};

export function isEditableLabel(k: string): k is LabelKey {
  return k in S;
}

// overrides: { labelKey: customText } — replaces the default for non-empty values.
export function docLabels(lang: Lang, overrides?: Record<string, string>): DocLabels {
  const out = {} as DocLabels;
  (Object.keys(S) as (keyof typeof S)[]).forEach((k) => {
    (out as Record<string, string | ((...a: string[]) => string)>)[k] = (S[k] as B)[lang];
  });
  if (lang === "ar") {
    out.dearName = (n) => `عزيزي ${n}،`;
    out.attMsg = (n) =>
      `نودّ إبلاغكم رسمياً بشأن حضور ابنكم/ابنتكم ${n} في المدرسة. نرجو دعمكم لضمان الانتظام في الحضور مستقبلاً.`;
    out.enrBody = (n, status, year) =>
      `نُفيد بأن ${n} ${status} للتسجيل في مؤسستنا للعام الدراسي ${year}.`;
    out.permBody = (n, event) =>
      `دُعي ابنكم/ابنتكم ${n} للمشاركة في ${event}. نلتمس موافقتكم على حضوره/حضورها.`;
    out.refBody = (who) =>
      `يسعدني تقديم هذه التوصية لـ ${who}. لقد أظهر/أظهرت طوال معرفتي به/بها شخصية قوية والتزاماً وقدرة، وأوصي به/بها دون تحفّظ.`;
    out.complBody = (program, year) =>
      `قد أتمّ بنجاح ${program} للعام الدراسي ${year}.`;
    out.tcBody = (n, klass, dateLeaving) =>
      `نشهد بأن ${n}، الطالب في ${klass}، قد غادر هذه المؤسسة بتاريخ ${dateLeaving}. وفيما يلي بياناته.`;
    out.bfBody = (n, klass, year) =>
      `نشهد بأن ${n} طالب نظامي في هذه المؤسسة، ومقيّد في ${klass} خلال العام الدراسي ${year}.`;
    out.bfPurpose = (purpose) => `تصدر هذه الشهادة لغرض ${purpose}.`;
    out.ccBody = (n, klass, conduct) =>
      `نشهد بأن ${n}، الطالب في ${klass}، قد حافظ على سلوك ${conduct} طوال فترة دراسته في هذه المؤسسة.`;
  } else {
    out.dearName = (n) => `Dear ${n},`;
    out.attMsg = (n) =>
      `This letter is to formally notify you regarding the school attendance of your child, ${n}. We request your support in ensuring regular attendance going forward.`;
    out.enrBody = (n, status, year) =>
      `This is to certify that ${n} is ${status} for enrollment at our institution for the academic year ${year}.`;
    out.permBody = (n, event) =>
      `Your child ${n} has been invited to take part in ${event}. We are seeking your permission for them to attend.`;
    out.refBody = (who) =>
      `I am pleased to provide this reference for ${who}. Throughout the time I have known them, they have consistently demonstrated strong character, reliability, and ability. I recommend them without reservation.`;
    out.complBody = (program, year) =>
      `has successfully completed ${program} for the academic year ${year}.`;
    out.tcBody = (n, klass, dateLeaving) =>
      `This is to certify that ${n}, a student of ${klass}, has left this institution on ${dateLeaving}. Their particulars are recorded below.`;
    out.bfBody = (n, klass, year) =>
      `This is to certify that ${n} is a bonafide student of this institution, enrolled in ${klass} during the academic year ${year}.`;
    out.bfPurpose = (purpose) => `This certificate is issued for the purpose of ${purpose}.`;
    out.ccBody = (n, klass, conduct) =>
      `This is to certify that ${n}, a student of ${klass}, has maintained ${conduct} conduct throughout their time at this institution.`;
  }
  // Apply user wording overrides (scalar labels only).
  if (overrides) {
    for (const [k, v] of Object.entries(overrides)) {
      if (v && v.trim() && isEditableLabel(k)) {
        (out as Record<string, string | ((...a: string[]) => string)>)[k] = v;
      }
    }
  }
  return out;
}
