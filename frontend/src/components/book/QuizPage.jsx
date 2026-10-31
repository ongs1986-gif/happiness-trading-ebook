import { Check, X, RotateCcw } from "lucide-react";
import { useQuiz, useStopFlip } from "./quizState";

function Option({ q, oi, part, state, set }) {
  const selected = state.answers[q.index] === oi;
  const correct = state.submitted && oi === q.answer;
  const wrong = state.submitted && selected && oi !== q.answer;
  const cls = correct ? "opt-correct" : wrong ? "opt-wrong" : selected ? "opt-selected" : "";
  return (
    <button
      type="button"
      data-testid={`quiz-option-p${part}-q${q.index}-o${oi}`}
      className={`quiz-opt ${cls}`}
      disabled={state.submitted}
      onClick={() => set((s) => ({ ...s, answers: { ...s.answers, [q.index]: oi } }))}
    >
      <span className="quiz-opt-letter">{String.fromCharCode(65 + oi)}</span>
      <span className="flex-1">{q.options[oi]}</span>
      {correct && <Check size={13} />}
      {wrong && <X size={13} />}
    </button>
  );
}

function ScoreCard({ part, total, state, set }) {
  const score = Object.entries(state.answers).filter(([qi, oi]) => oi === state.questions?.[qi]).length;
  const allAnswered = Object.keys(state.answers).length === total;
  if (!state.submitted) {
    return (
      <button type="button" data-testid={`quiz-submit-button-part-${part}`} className="quiz-submit" disabled={!allAnswered}
        onClick={() => set((s) => ({ ...s, submitted: true }))}>
        {allAnswered ? "Periksa Jawaban" : `Jawab semua pertanyaan (${Object.keys(state.answers).length}/${total})`}
      </button>
    );
  }
  return (
    <div className="quiz-score" data-testid={`quiz-score-part-${part}`}>
      <div>
        <div className="quiz-score-num">{score}/{total}</div>
        <div className="quiz-score-label">{score === total ? "Luar biasa — pikiran jernih!" : "Terus berlatih dengan tenang."}</div>
      </div>
      <button type="button" data-testid={`quiz-retake-part-${part}`} className="quiz-retake"
        onClick={() => set((s) => ({ ...s, answers: {}, submitted: false }))}>
        <RotateCcw size={12} /> Ulangi
      </button>
    </div>
  );
}

export function QuizPage({ page }) {
  const s = page.section;
  const part = s.part_number;
  const [state, set] = useQuiz(part);
  const ref = useStopFlip();
  const questions = s.quiz.questions;
  const answerKey = Object.fromEntries(questions.map((q, i) => [i, q.answer]));
  return (
    <div className="pg-pad quiz" ref={ref} data-testid={page.first ? `quiz-container-part-${part}` : undefined}>
      {page.first && (
        <>
          <div className="kicker">Bagian {part} · Evaluasi Tambahan</div>
          <h2 className="quiz-title">Quiz Cepat Bagian {part}</h2>
        </>
      )}
      {page.questions.map((q) => (
        <div key={q.index} className="quiz-q">
          <div className="quiz-q-text"><span className="quiz-q-num">{q.index + 1}.</span> {q.q}</div>
          <div className="quiz-opts">
            {q.options.map((_, oi) => <Option key={oi} q={q} oi={oi} part={part} state={state} set={set} />)}
          </div>
          {state.submitted && <div className="quiz-explain">{q.explain}</div>}
        </div>
      ))}
      {page.last && <ScoreCard part={part} total={questions.length} state={{ ...state, questions: answerKey }} set={set} />}
    </div>
  );
}

export function ReflectionPage({ page, print }) {
  const s = page.section;
  const part = s.part_number;
  const [state, set] = useQuiz(part);
  const ref = useStopFlip();
  return (
    <div className="pg-pad quiz" ref={ref} data-testid={`reflection-page-part-${part}`}>
      <div className="kicker">Bagian {part} · Lembar Praktik</div>
      <h2 className="quiz-title">Lembar Praktik</h2>
      <p className="reflect-intro">Tuliskan jawaban Anda dengan jujur. Catatan tersimpan otomatis di perangkat ini.</p>
      {s.quiz.reflections.map((prompt, ri) => (
        <div key={ri} className="reflect-item">
          <div className="reflect-prompt">{ri + 1}. {prompt}</div>
          {print ? (
            <div className="reflect-lines">{state.reflections[ri] || ""}</div>
          ) : (
            <textarea
              data-testid={`reflection-input-p${part}-${ri}`}
              className="reflect-input"
              rows={6}
              placeholder="Tulis refleksi Anda di sini…"
              value={state.reflections[ri] || ""}
              onChange={(e) => { const v = e.target.value; set((st) => ({ ...st, reflections: { ...st.reflections, [ri]: v } })); }}
              onKeyDown={(e) => e.stopPropagation()}
            />
          )}
        </div>
      ))}
    </div>
  );
}
