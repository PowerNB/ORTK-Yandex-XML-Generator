import { useMemo, useState, useEffect } from "react";
import type { Rubric } from "../types";

type Props = {
  value: string;
  onChange: (value: string) => void;
  rubrics: Rubric[];
  placeholder?: string;
  onSelect: (value: string) => void;
};

const RubricPicker = ({ value, onChange, rubrics, placeholder, onSelect }: Props) => {
  const [query, setQuery] = useState(value || "");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rubrics.slice(0, 8);
    return rubrics
      .filter((r) => r.id.toString().includes(q) || r.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, rubrics]);

  return (
    <div className="rubric-picker single">
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
      />
      <div className={`rubric-suggestions${focused ? " active" : ""}`}>
        {suggestions.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => {
              onSelect(String(item.id));
              setQuery(`${item.id} — ${item.name}`);
              setFocused(false);
            }}
          >
            {item.id} — {item.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RubricPicker;