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
};

export type DocLabels = Record<keyof typeof S, string> & {
  // sentence builders (interpolated)
  dearName: (n: string) => string;
  attMsg: (n: string) => string;
  enrBody: (n: string, status: string, year: string) => string;
  permBody: (n: string, event: string) => string;
  refBody: (who: string) => string;
};

export function docLabels(lang: Lang): DocLabels {
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
  }
  return out;
}
