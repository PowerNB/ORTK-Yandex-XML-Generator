type Props = {
  onGenerate: () => void;
  onDownload: () => void;
  onImportClick: () => void;
  errors: string[];
  warnings: string[];
  xmlOutput: string;
};

const ExportPanel = ({ onGenerate, onDownload, onImportClick, errors, warnings, xmlOutput }: Props) => (
  <div className="card">
    <h2>Экспорт XML</h2>
    <div className="actions">
      <button className="primary" onClick={onGenerate}>Сгенерировать XML</button>
      <button className="secondary" onClick={onDownload}>Скачать XML</button>
      <button className="secondary" onClick={onImportClick}>Импорт XML</button>
    </div>
    {errors.length > 0 && (
      <div className="errors">
        {errors.map((error, i) => (
          <div key={i}>{error}</div>
        ))}
      </div>
    )}
    {warnings.length > 0 && (
      <div className="warnings">
        {warnings.map((warning, i) => (
          <div key={i}>{warning}</div>
        ))}
      </div>
    )}
    {xmlOutput && (
      <pre className="xml-output">{xmlOutput}</pre>
    )}
  </div>
);

export default ExportPanel;
