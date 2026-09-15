import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TrainerPage } from "@/components/trainer/trainer-page";
import {
  getAdjacent,
  getDistractorPool,
  getExamBlockForLesson,
  getLesson,
  getLessonNumbers,
  getLessonMetas,
} from "@/lib/content/loader";
import { categoryById } from "@/lib/content/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return getLessonNumbers().map((lesson) => ({ n: String(lesson) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  const lesson = getLesson(Number(n));
  if (!lesson) return { title: "Урок не найден" };
  const category = categoryById.get(lesson.category);
  const description = `${lesson.summary ?? lesson.subtitle} · ${lesson.phrases.length} живых фраз уровня ${lesson.difficulty} с переводом и примерами.`;
  return {
    title: `Урок ${lesson.lesson}. ${lesson.title}`,
    description,
    alternates: { canonical: `/lesson/${lesson.lesson}` },
    openGraph: {
      title: `Урок ${lesson.lesson}. ${lesson.title}`,
      description,
      url: `/lesson/${lesson.lesson}`,
      type: "article",
    },
    keywords: [lesson.title, category?.labelRu ?? "", ...lesson.tags],
  };
}

export default async function LessonPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const number = Number(n);
  const lesson = getLesson(number);
  if (!lesson) notFound();

  const pool = getDistractorPool(number, 40);
  const { next } = getAdjacent(number);
  const exam = getExamBlockForLesson(number);
  const metas = getLessonMetas();

  // After this lesson the block exam becomes available.
  const examReady = exam ? number >= exam.toLesson && metas.length >= exam.toLesson : false;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: `Урок ${lesson.lesson}. ${lesson.title}`,
    description: lesson.summary,
    inLanguage: "es-RU",
    teaches: lesson.phrases.map((phrase) => phrase.spanish).slice(0, 5),
    educationalLevel: lesson.difficulty,
    isPartOf: { "@type": "Course", name: "Español Real" },
  };

  return (
    <AppShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrainerPage
        mode="lesson"
        lessons={[lesson]}
        pool={pool}
        nextHref={examReady && exam ? `/exam/${exam.block}` : next ? `/lesson/${next.lesson}` : undefined}
      />
    </AppShell>
  );
}
