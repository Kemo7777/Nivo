import { Link } from "wouter";
import { Layout } from "@/components/Layout";

type Section = { heading: string; body: string };

const PAGES: Record<string, { title: string; intro: string; sections: Section[] }> = {
  shipping: {
    title: "الشحن والاسترجاع",
    intro: "كل حاجة محتاج تعرفها عن وصول طلبك وإرجاعه.",
    sections: [
      {
        heading: "الشحن",
        body: "الشحن مجاني على الطلبات فوق ١٠٠٠ ج.م، وباقي الطلبات ٦٠ ج.م. القاهرة والجيزة بتوصل في ١–٢ يوم عمل، وباقي المحافظات ٢–٤ أيام.",
      },
      {
        heading: "الاسترجاع",
        body: "عندك ٣٠ يوم من يوم الاستلام إنك ترجّع أي قطعة بحالتها. كلّمنا على الاستوديو وهنرتّب الاستلام.",
      },
      {
        heading: "الإصلاح",
        body: "الإصلاح مجاني مدى الحياة على كل قطعة. لو القطعة اتقطعت أو محتاجة تعديل، ابعتلنا وهي بترجع زي الأول.",
      },
    ],
  },
  materials: {
    title: "الخامات",
    intro: "بنشتري خامات موثّقة المصدر، وبنعرف كل مورد بالاسم.",
    sections: [
      {
        heading: "صوف ميرينو",
        body: "من مزارع في شمال البرتغال. ناعم على الجلد، وبيتدفى من غير ما يبقى تقيل.",
      },
      {
        heading: "كشمير",
        body: "من مورد واحد بنتعامل معاه من ٢٠١٩. بيطرى مع الغسيل ويفضل سنين.",
      },
      {
        heading: "كتان",
        body: "من إيطاليا. بيتنفّس في الحر وبيتحسّن مع الوقت.",
      },
      {
        heading: "جلد مدبوغ نباتيًا",
        body: "دباغة نباتية بدون كروم، بتاخد لون أغمق مع الاستعمال.",
      },
    ],
  },
  privacy: {
    title: "الخصوصية",
    intro: "بناخد أقل قدر ممكن من بياناتك، وبنستخدمها للتوصيل بس.",
    sections: [
      {
        heading: "اللي بنجمعه",
        body: "الاسم، رقم الموبايل، والعنوان — عشان نوصل الطلب. والبريد لو اخترت تشترك في القائمة.",
      },
      {
        heading: "اللي مش بنعمله",
        body: "مش بنبيع بياناتك ولا بنشاركها مع أي طرف تالت غير شركة التوصيل. ومش بنخزّن أي بيانات بطاقة.",
      },
      {
        heading: "حذف بياناتك",
        body: "كلّمنا في الاستوديو في أي وقت وهنمسح كل حاجة عنك.",
      },
    ],
  },
  terms: {
    title: "الشروط",
    intro: "شروط بسيطة لاستخدام الموقع والشراء مننا.",
    sections: [
      {
        heading: "الطلبات",
        body: "الطلب بيتأكد لما نكلّمك. لو قطعة خلصت، بنبلّغك وبنرجّع المبلغ كامل لو مدفوع.",
      },
      {
        heading: "الأسعار",
        body: "كل الأسعار بالجنيه المصري وشاملة الضريبة. بنحتفظ بحق تعديل الأسعار في أي وقت.",
      },
      {
        heading: "الملكية",
        body: "كل التصميمات والصور ملك NIVO. ممنوع استخدامها من غير إذن مكتوب.",
      },
    ],
  },
};

export default function Info({ page }: { page: keyof typeof PAGES }) {
  const content = PAGES[page] ?? PAGES.shipping;

  return (
    <Layout>
      <section className="container-nivo pt-14 pb-10 md:pt-20 md:pb-14">
        <p className="eyebrow">معلومات</p>
        <h1 className="mt-4 font-display text-[clamp(2.2rem,6vw,3.4rem)] leading-tight text-ink">
          {content.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-loose text-muted-foreground">
          {content.intro}
        </p>
      </section>

      <section className="container-nivo pb-20 md:pb-28">
        <div className="max-w-3xl border-t border-line">
          {content.sections.map((s) => (
            <div key={s.heading} className="border-b border-line py-8">
              <h2 className="text-lg text-ink">{s.heading}</h2>
              <p className="mt-3 text-[14px] leading-loose text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            to="/shop"
            className="bg-olive px-7 py-3 text-[12px] tracking-[0.16em] text-cream transition-colors hover:bg-olive-dark"
          >
            تسوق الكولكشن
          </Link>
          <Link
            to="/contact"
            className="border border-line px-7 py-3 text-[12px] tracking-[0.16em] text-ink transition-colors hover:border-ink/40"
          >
            كلّم الاستوديو
          </Link>
        </div>
      </section>
    </Layout>
  );
}
