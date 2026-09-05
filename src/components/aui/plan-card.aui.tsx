/**
 * Plan card — rendered inside the official assistant message for data parts
 * named "plan" (see thread.aui.tsx `case "data"`). Codex-style checked-off
 * steps, styled with the pond glass language.
 */

export type PlanData = {
  explanation: string;
  steps: Array<{ text: string; status: "completed" | "in_progress" | "pending" }>;
};

export const PlanCard = ({ data }: { data: PlanData }) => {
  const done = data.steps.filter((step) => step.status === "completed").length;
  return (
    <article className="oh-chat-plan">
      <div className="oh-chat-plan-head">
        <span>
          计划 · {done}/{data.steps.length}
        </span>
      </div>
      <p className="oh-chat-plan-explanation">{data.explanation}</p>
      {data.steps.map((step) => (
        <div key={step.text} className={`oh-plan-step ${step.status}`}>
          <span className="oh-plan-glyph" aria-hidden="true">
            {step.status === "completed" ? "✔" : "□"}
          </span>
          <span className="oh-plan-step-text">{step.text}</span>
        </div>
      ))}
    </article>
  );
};
