"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import GeminiIcon from "../icons/GeminiIcon";
import BookIcon from "../icons/BookIcon";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from "axios";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer?: string;
  answer?: string;
};

type SummarizedCardProps = {
  quiz: QuizQuestion[];
  setQuiz: React.Dispatch<React.SetStateAction<QuizQuestion[]>>;
  summary: string;
  setSummary: React.Dispatch<React.SetStateAction<string>>;
  title: string;
  content: string;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  articleId: string;
};

export default function SummarizedCard({
  setQuiz,
  summary,
  title,
  content,
  setStep,
  articleId,
}: SummarizedCardProps) {
  const [loading, setLoading] = useState<boolean>(false);

  const handleTakeQuiz = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (loading) return;
    if (!articleId) {
      console.error("articleId is missing");
      return;
    }

    setLoading(true);

    try {
      const quizRes = await axios.post(`/api/article/${articleId}/quizzes`);

      console.log("quiz saved:", quizRes.data);

      const quizzes = quizRes.data.quizzes;

      if (!Array.isArray(quizzes) || quizzes.length === 0) {
        console.error("No quizzes returned:", quizzes);
        return;
      }

      setQuiz(quizzes);
      setStep(3);
    } catch (err: any) {
      console.error(
        "HANDLE TAKE QUIZ ERROR:",
        err?.response?.data || err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-214 w-full h-fit max-h-154.5 p-7 gap-5">
      <CardHeader>
        <div className="flex gap-2 items-center">
          <GeminiIcon />
          <CardTitle>Article Quiz Generator</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <CardDescription className="flex gap-2 items-center justify-start">
          <BookIcon /> Summarized content
        </CardDescription>

        <div className="text-black font-inter text-[24px] font-semibold leading-8 tracking-[-0.6px]">
          {title}
        </div>

        <div className="max-h-70 overflow-scroll text-black font-inter text-[14px] font-normal leading-5">
          {summary}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between gap-2 items-end">
        <Dialog>
          <form>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-27 cursor-pointer"
              >
                See content
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-157 p-7">
              <DialogHeader>
                <DialogTitle className="text-black font-inter text-[24px] font-semibold leading-8 tracking-[-0.6px]">
                  {title}
                </DialogTitle>
                <div className="text-black font-inter text-[14px] font-normal leading-5">
                  {content}
                </div>
              </DialogHeader>
            </DialogContent>
          </form>
        </Dialog>

        <Button
          type="button"
          className="w-27 cursor-pointer"
          disabled={loading || !articleId}
          onClick={handleTakeQuiz}
        >
          {loading ? "Take a quiz..." : "Take a quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
}
