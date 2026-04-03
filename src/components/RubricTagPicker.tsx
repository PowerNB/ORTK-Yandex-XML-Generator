import { useMemo, useState } from "react";
import type { Rubric } from "../types";
import { resolveRubricInput } from "../utils/helpers";

type Props = {
  rubrics: Rubric[];
  selected: string[];
  networkRubric?: string;
  onChange: (next: string[]) => void;
};

const RubricTagPicker = ({ rubrics, selected, networkRubric, onChange }: Props) => {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return rubrics.slice(0, 8);
    return rubrics
      .filter((r) => r.id.toString().includes(q) || r.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [input, rubrics]);

  const addRubric = (value: string) => {
    const resolved = resolveRubricInput(value, rubrics);
    if (!resolved) return;
    if (selected.includes(resolved)) return;
    if (selected.length >= 3) return;
    onChange([...selected, resolved]);
    setInput("");
    setFocused(false);
  };

  const showInherited = selected.length === 0 && !!networkRubric;
  const inheritedName = showInherited
    ? rubrics.find((r) => r.id === networkRubric)?.name
    : null;

  return (
    <div className="rubric-picker">
      <div className="rubric-tags">
        {showInherited && (
          <span className="rubric-tag inherited" title="Берётся из настроек сети">
            {networkRubric}{inheritedName ? ` — ${inheritedName}` : ""} <em>(из сети)</em>
          </span>
        )}
        {selected.map((rubric) => {
          const name = rubrics.find((r) => r.id === rubric)?.name;
          return (
            <span className="rubric-tag" key={rubric}>
              {rubric}{name ? ` — ${name}` : ""}
              <button type="button" onClick={() => onChange(selected.filter((item) => item !== rubric))}>
                ×
              </button>
            </span>
          );
        })}
      </div>
      <input
        type="text"
        value={input}
        placeholder="Введите ID или название рубрики"
        onFocus={() => setFocused(true)}
        onBlur={() => {
          if (input.trim()) {
            addRubric(input);
            return;
          }
          setTimeout(() => setFocused(false), 150);
        }}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addRubric(input);
          }
        }}
      />
      <div className={`rubric-suggestions${focused ? " active" : ""}`}>
        {suggestions.map((item) => (
          <button type="button" key={item.id} onClick={() => addRubric(String(item.id))}>
            {item.id} — {item.name}
          </button>
        ))}
      </div>
      <span className="field-hint">
        До 3 рубрик. Чтобы добавить — введите значение и нажмите Enter или уберите фокус.
      </span>
    </div>
  );
};

export default RubricTagPicker;
