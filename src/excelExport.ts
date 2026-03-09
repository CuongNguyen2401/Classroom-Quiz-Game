import * as XLSX from "xlsx";
import { resultManager } from "./resultManager";
import { quizEngine } from "./quizEngine";

export function exportResultsToExcel() {
  const results = resultManager.getResults();
  const questions = quizEngine.getQuestions();

  const data = results.map((r) => {
    const q = questions[r.questionIndex];
    return {
      "Question Number": r.questionIndex + 1,
      "Question Text": q.question,
      "Selected Answer": r.selected.toUpperCase(),
      "Correct Answer": q.correct.toUpperCase(),
      "Result": r.correct ? "CORRECT" : "WRONG",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Quiz Results");

  XLSX.writeFile(workbook, "Head_Tilting_Quiz_Results.xlsx");
}
