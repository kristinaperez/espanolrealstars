"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { ExerciseRunner, type SessionResult } from "./exercise-runner";
import { PremiumLock, SessionSummary } from "./session-summary";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { useProgress } from "@/components/providers/progress-provider";
import { categoryById, course } from "@/lib/content/config";
import type { Distractor, Lesson } from "@/lib/content/types";
import { buildExamSession, buildLessonSession } from "@/lib/exercises/generator";

type Phase = "intro" | "run" | "done";

export function TrainerPage({
  mode,
  lessons,
  pool,
  nextHref,
  reviewHref,
  blockNumber,
}: {
  mode: "lesson" | "exam";
  lessons: Lesson[];
  pool: Distractor[];
  nextHref?: string;
  reviewHref?: string;
  blockNumber?: number;
}) {
  const { state, dispatch, access, ready } = useProgress();
  const [phase, setPhase] = useState<Phase>("intro");
  const [result, setResult] = useState<SessionResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  const lesson = lessons[0];
  const locked =
    ready &&
    !access(mode === "exam" ? lessons[lessons.length - 1].lesson : lesson.lesson);

  const session = useMemo(() => {
    if (mode === "exam") {
      return buildExamSession(lessons, pool, `exam-${blockNumber}-${attempt}`, course.examQuestionCount);
    }
    return buildLessonSession(lessons[0], pool, String(attempt));
  }, [attempt, blockNumber, lessons, mode, pool]);

  const progress = state.lessons[String(lesson.lesson)];
  const category = categoryById.get(lesson.category);

  const finish = (payload: SessionResult) => {
    if (mode === "exam" && blockNumber) {
      dispatch({ type: "examComplete", block: blockNumber, correct: payload.correct, total: payload.total });
    } else {
      dispatch({ type: "lessonComplete", lesson: lesson.lesson, correct: payload.correct, total: payload.total });
    }
    setResult(payload);
    setPhase("done");
  };

  if (locked) {
    return <PremiumLock nextLesson={lesson.lesson} />;
  }

  if (phase === "run") {
    return (
      <ExerciseRunner
        key={`${mode}-${attempt}`}
        exercises={session.exercises}
        mode={mode}
        title={mode === "exam" ? `Экзамен ${blockNumber}` : lesson.title}
        subtitle={mode === "exam" ? "Проверка знаний по блоку уроков" : lesson.subtitle}
        onFinish={finish}
      />
    );
  }

  if (phase === "done" && result) {
    return (
      <SessionSummary
        result={result}
        title={mode === "exam" ? "Экзамен сдан!" : "Урок пройден!"}
        nextHref={nextHref}
        retryHref={mode === "lesson" ? `/lesson/${lesson.lesson}` : blockNumber ? `/exam/${blockNumber}` : undefined}
        reviewHref="/learn/review"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">
            {mode === "exam" ? `Экзамен ${blockNumber}` : `Урок ${lesson.lesson}`}
          </Badge>
          <Badge>{category?.emoji} {category?.labelRu ?? lesson.category}</Badge>
          <Badge tone="accent">{lesson.difficulty}</Badge>
          <Badge>{lesson.phrases.length} фраз</Badge>
          {progress?.completed ? <Badge tone="success">✓ пройден</Badge> : null}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{lesson.title}</h1>
        {lesson.subtitle ? <p className="text-base text-muted">{lesson.subtitle}</p> : null}
        {lesson.summary ? <p className="max-w-2xl text-base">{lesson.summary}</p> : null}
      </header>

      {lesson.authorComment ? (
        <Card className="border-primary/30 bg-primary/8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="h-4 w-4" /> Комментарий автора
          </p>
          <p className="mt-2 text-[15px] font-medium leading-relaxed">{lesson.authorComment}</p>
        </Card>
      ) : null}

      <Card>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
          <BookOpen className="h-4 w-4" /> Фразы урока
        </p>
        <ul className="mt-4 flex flex-col divide-y divide-line">
          {lesson.phrases.map((phrase) => (
            <li key={phrase.spanish} className="py-3">
              <p className="text-lg font-bold tracking-tight">{phrase.spanish}</p>
              <p className="text-sm text-muted">{phrase.translation}</p>
              {phrase.example ? (
                <p className="mt-1 text-sm text-muted">
                  <span className="font-semibold text-foreground">{phrase.example}</span>
                  {phrase.exampleTranslation ? ` — ${phrase.exampleTranslation}` : ""}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        {mode === "exam" ? (
          <p className="mt-4 text-sm text-muted">
            В экзамен входят фразы из уроков {lessons.map((item) => item.lesson).join(", ")}.
          </p>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-bold">
            {mode === "exam" ? `${course.examQuestionCount} вопросов` : "Карточки · практика · мини-тест"}
          </p>
          <p className="text-sm text-muted">
            {state.settings.showTranslations
              ? "Ошибки автоматически попадают в план повторения."
              : "Ошибки автоматически попадают в план повторения."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              setAttempt((value) => value + 1);
              setPhase("run");
            }}
          >
            <GraduationCap className="h-5 w-5" /> Ещё раз
          </Button>
          <Button
            size="lg"
            onClick={() => {
              setPhase("run");
            }}
          >
            Начать <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      {nextHref ? (
        <p className="text-sm text-muted">
          Дальше:{" "}
          <Link href={nextHref} className="font-bold text-primary underline decoration-primary/40">
            следующий урок
          </Link>{" "}
          ·{" "}
          <Link href={reviewHref ?? "/learn/review"} className="font-bold text-primary underline decoration-primary/40">
            повторение
          </Link>
        </p>
      ) : null}
    </div>
  );
}
