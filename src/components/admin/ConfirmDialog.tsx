import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
};

const DANGER_BTN =
  'inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold text-white shadow-card transition hover:scale-[1.02] hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-red-600';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  busy,
  tone = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  useEffect(() => {
    if (open && dialogRef.current) {
      const cancelBtn = dialogRef.current.querySelector<HTMLButtonElement>('[data-dialog-cancel]');
      cancelBtn?.focus();
    }
  }, [open]);

  const isDanger = tone === 'danger';

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      onClick={(e) => {
        if (e.target === dialogRef.current) onCancel();
      }}
      className="w-[min(28rem,92vw)] overflow-hidden rounded-3xl bg-white p-0 shadow-cheese backdrop:bg-espresso-900/55 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
              isDanger ? 'bg-red-50 text-red-600' : 'bg-cheese-100 text-cheddar'
            }`}
          >
            {isDanger ? (
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
              >
                <path
                  d="M3 6h14M8 6V4h4v2M6 6l1 11h6l1-11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M9 9v5M11 9v5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
              >
                <circle cx="10" cy="10" r="7" />
                <path d="M10 6.5v4M10 13.3v.2" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-extrabold text-espresso-900">{title}</h2>
            {description && (
              <div className="mt-2 text-sm leading-relaxed text-espresso-700">{description}</div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            data-dialog-cancel
            className="btn-ghost"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={isDanger ? DANGER_BTN : 'btn-primary'}
          >
            {busy ? 'Eliminando…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
