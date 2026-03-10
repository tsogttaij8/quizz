"use client";
import { Button } from "@/components/ui/button";
import GeminiIcon from "../icons/GeminiIcon";
import { XIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

type QuickTestProps = {
  quiz?: QuizQuestion[];
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setResult: React.Dispatch<
    React.SetStateAction<
      {
        question: string;
        selected: string;
        correct: number;
        isCorrect: boolean;
      }[]
    >
  >;
  setSelectedOptions: React.Dispatch<React.SetStateAction<number[]>>;
};

type QuizQuestion = {
  question: string;
  options: string[];
  answer?: string;
};

export default function QuickTest({
  setStep,
  quiz,
  setSelectedOptions,
  setResult,
}: QuickTestProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const parsedQuiz: QuizQuestion[] = Array.isArray(quiz)
    ? quiz
    : JSON.parse(quiz as unknown as string);
  const currentQuestion = parsedQuiz[currentQuestionIndex];

  const handleAnswerClick = (optionIndex: number) => {
    const correctIndex = Number(currentQuestion.answer);
    setSelectedOptions((prev) => [...prev, optionIndex]);
    setResult((prev) => [
      ...prev,
      {
        question: currentQuestion.question,
        selected: currentQuestion.options[optionIndex],
        correct: correctIndex,
        isCorrect:
          currentQuestion.options[optionIndex] ===
          currentQuestion.options[correctIndex],
      },
    ]);

    if (currentQuestionIndex < parsedQuiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setStep(4);
    }
  };

  return (
    <div className="min-w-140 h-72 flex flex-col items-center justify-center gap-6">
      <div className="flex justify-between w-full">
        <div className="flex-col gap-2 items-center">
          <div className="flex gap-2 items-center">
            <GeminiIcon />
            <div className="text-black text-center font-inter text-[24px] font-semibold leading-8 tracking-[-0.6px]">
              Quick test
            </div>
          </div>
          <div className="text-gray-500 text-center font-inter text-[16px] font-medium leading-6 tracking-normal">
            Take a quick test about your knowledge from your content
          </div>
        </div>
        <Dialog>
          <form>
            <DialogTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                <XIcon />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-112.5 p-7">
              <DialogHeader>
                <DialogTitle className="text-black font-inter text-[24px] font-semibold leading-8 tracking-[-0.6px]">
                  Are you sure?
                </DialogTitle>
                <DialogDescription className="text-red-500">
                  If you press &apos;Cancel&apos;, this quiz will restart from
                  the beginning.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex items-center justify-between w-full gap-11">
                <DialogClose asChild>
                  <Button type="submit" className="w-44.75">
                    Go back
                  </Button>
                </DialogClose>
                <Button
                  variant="outline"
                  className="w-44.75"
                  onClick={() => setStep(1)}
                >
                  Cancel quiz
                </Button>
              </DialogFooter>
            </DialogContent>
          </form>
        </Dialog>
      </div>
      <div className="w-full h-fit bg-white border p-7 flex flex-col rounded-lg gap-5">
        <div className="flex justify-between gap-2 items-center">
          <div className="text-black font-inter text-[20px] font-medium leading-7 tracking-normal">
            {currentQuestion.question}
          </div>
          <div className="text-black font-inter text-[20px] font-medium leading-7 tracking-normal">
            {currentQuestionIndex + 1}/
            <span className="text-gray-500 font-inter text-[16px] font-medium leading-6 tracking-normal">
              {parsedQuiz.length}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {currentQuestion.options.map((option, optionIndex) => (
            <Button
              key={optionIndex}
              variant="outline"
              className="cursor-pointer text-left p-2 overflow-scroll max-w-90 wrap-break-word whitespace-normal h-fit"
              onClick={() => handleAnswerClick(optionIndex)}
            >
              {optionIndex + 1}. {option}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
