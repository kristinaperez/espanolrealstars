import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TrainerPage } from "@/components/trainer/trainer-page";
import { getDistractorPool, getExamBlock, getExamBlocks, getExamLessons, getLessonMetas } from "@/lib/content/loader";

export const dynamicParams = false;

export function generateStaticParams() {
  return getExamBlocks().map((block) => ({ n: String(block.block) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  const block = getExamBlock(Number(n));
  if (!block) return { title: "Экзамен не найден" };
  return {
    title: block.title,
    description: `Экзамен по урокам ${block.fromLesson}–${block.toLesson}: ${block.phraseCount} фраз, смешанные упражнения и оценка результата.`,
    alternates: { canonical: `/exam/${block.block}` },
  };
}

export default async function ExamPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const block = getExamBlock(Number(n));
  if (!block) notFound();

  const lessons = getExamLessons(block.block);
  const pool = getDistractorPool(-1, 40);
  const metas = getLessonMetas();
  const nextLesson = metas.find((meta) => meta.lesson > block.toLesson);

  return (
    <AppShell>
      <TrainerPage
        mode="exam"
        lessons={lessons}
        pool={pool}
        blockNumber={block.block}
        nextHref={nextLesson ? `/lesson/${nextLesson.lesson}` : "/certificate"}
      />
    </AppShell>
  );
}
