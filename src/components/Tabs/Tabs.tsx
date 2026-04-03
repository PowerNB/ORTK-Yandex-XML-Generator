type Props = {
  tab: string;
  onTabChange: (value: string) => void;
  onInsertMock: () => void;
};

const Tabs = ({ tab, onTabChange, onInsertMock }: Props) => (
  <div className="card">
    <div className="tabs">
      <button className={`tab ${tab === "single" ? "active" : ""}`} onClick={() => onTabChange("single")}>
        Одна станция — все поля
      </button>
      <button className={`tab ${tab === "bulk" ? "active" : ""}`} onClick={() => onTabChange("bulk")}>
        Все станции — основные поля
      </button>
      <button className="tab" id="insertMock" onClick={onInsertMock}>
        Вставить мокап данные
      </button>
    </div>
  </div>
);

export default Tabs;
