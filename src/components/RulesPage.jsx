import React from 'react';
import { DEFAULT_RULES, RULES_VERSION } from '../data/rules.js';
import { describeRuleChanges, parseRules } from '../utils/rules.js';

const RuleText = ({ text }) => {
  // "Title. Text" shows a bold title.
  const match = text.match(/^([^.]{1,40}\.)\s+(.+)$/);
  return match ? <><strong>{match[1]}</strong> {match[2]}</> : text;
};

const RulesEditor = ({ rulesText, error, onSave, onCancel }) => {
  const [draft, setDraft] = React.useState(rulesText);
  return (
    <section className="panel">
      <p className="rules-help">
        Start a section with <strong># </strong> and a rule with a number, like <strong>1. Title. Text</strong>.
        Keep each rule on one line. Rules are renumbered for you.
      </p>
      <textarea
        className="rules-editor"
        aria-label="Rules text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <div className="modal-actions">
        <button className="modal-close" onClick={onCancel}>Cancel</button>
        <button className="primary-button" disabled={!draft.trim()} onClick={() => onSave(draft)}>Save Rules</button>
      </div>
    </section>
  );
};

const RulesShare = ({ changes }) => {
  const [status, setStatus] = React.useState('');
  const message = `RFCN BBALL rule changes (from version ${RULES_VERSION})\n\n${changes}`;

  const share = async () => {
    try {
      await navigator.share({ title: 'RFCN BBALL rule changes', text: message });
    } catch (err) {
      if (err.name !== 'AbortError') setStatus('Sharing failed. Use Copy Changes instead.');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setStatus('Changes copied.');
    } catch {
      setStatus('Copy failed. Select the text under "View changes" instead.');
    }
  };

  return (
    <section className="panel rules-share">
      <p>The rules on this device have been edited. Share the changes so they can be added for everyone.</p>
      <div className="rules-share-actions">
        {navigator.share ? (
          <button className="primary-button" onClick={share}>Share Changes</button>
        ) : (
          <a
            className="rules-email-link"
            href={`mailto:?subject=${encodeURIComponent('RFCN BBALL rule changes')}&body=${encodeURIComponent(message.replace(/\n/g, '\r\n'))}`}
          >
            Email Changes
          </a>
        )}
        <button onClick={copy}>Copy Changes</button>
      </div>
      {status && <p role="status">{status}</p>}
      <details>
        <summary>View changes</summary>
        <pre>{changes}</pre>
      </details>
    </section>
  );
};

export const RulesPage = ({ rulesText, editing, error, onEdit, onSave, onCancelEdit, onBack }) => {
  const changes = describeRuleChanges(DEFAULT_RULES, rulesText);

  return (
    <main className="rules-page">
      <div className="rules-page-header">
        {!editing && <button onClick={onBack}>← Back</button>}
        <h1>{editing ? 'Edit Rules' : 'Rules & Fellowship Standards'}</h1>
        {!editing && <button className="primary-button" onClick={onEdit}>🔒 Edit Rules</button>}
      </div>

      {editing ? (
        <RulesEditor rulesText={rulesText} error={error} onSave={onSave} onCancel={onCancelEdit} />
      ) : (
        <>
          {changes && <RulesShare key={changes} changes={changes} />}
          <section className="panel rules-content">
            {parseRules(rulesText).map((line, i) => {
              if (line.type === 'heading') return <h2 key={i}>{line.text}</h2>;
              if (line.type === 'rule') {
                return (
                  <div className="rule-line" key={i}>
                    <span>{line.number}.</span>
                    <p><RuleText text={line.text} /></p>
                  </div>
                );
              }
              return <p key={i}>{line.text}</p>;
            })}
          </section>
        </>
      )}
    </main>
  );
};
