"use client";

interface Props {
  repo: string;
  onConfigure: () => void;
  onSkip: () => void;
  skipped?: boolean;
}

export function GhostCard({ repo, onConfigure, onSkip, skipped }: Props) {
  return (
    <div
      className="card ghost"
      data-type="ghost"
      data-status="ghost"
      data-repo={repo}
      style={skipped ? { opacity: 0.35 } : undefined}
    >
      <div className="ghost-badge">Untracked repo · GitHub</div>
      <h3 className="ghost-name">{repo}</h3>
      <div className="ghost-sub">Setup needed</div>
      <div className="ghost-fields">
        <div className="ghost-field">
          <span className="k">Type</span>
          <span className="v" />
        </div>
        <div className="ghost-field">
          <span className="k">Status</span>
          <span className="v" />
        </div>
        <div className="ghost-field">
          <span className="k">What</span>
          <span className="v" />
        </div>
        <div className="ghost-field">
          <span className="k">Next</span>
          <span className="v" />
        </div>
      </div>
      <button className="ghost-cta" type="button" onClick={onConfigure}>
        Configure →
      </button>
      <button className="ghost-skip" type="button" onClick={onSkip}>
        Skip for now
      </button>
    </div>
  );
}
