import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactFormValues } from '@/lib/validation/contact.schema';
import { submitContact } from '@/lib/contact';

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const startedAtRef = useRef<number>(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      hp_field: '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setStatus('sending');
    setErrorMsg('');

    const render_time_ms = Date.now() - startedAtRef.current;

    const result = await submitContact({
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      hp_field: data.hp_field ?? '',
      render_time_ms,
    });

    if (result.ok) {
      reset();
      setStatus('success');
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setErrorMsg(result.message);
      setStatus('error');
    }
  });

  const sending = status === 'sending' || isSubmitting;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="grid gap-5"
      aria-busy={sending}
    >
      {status === 'success' && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-sage-500/30 bg-sage-300/20 p-4 text-sm font-medium text-sage-700"
        >
          ¡Gracias! Recibimos tu mensaje. Te contactaremos muy pronto.
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800"
        >
          {errorMsg}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Nombre completo"
          htmlFor="name"
          error={errors.name?.message}
        >
          <input
            id="name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className={inputClass(Boolean(errors.name))}
            {...register('name')}
          />
        </Field>

        <Field
          label="Correo electrónico"
          htmlFor="email"
          error={errors.email?.message}
        >
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(errors.email)}
            className={inputClass(Boolean(errors.email))}
            {...register('email')}
          />
        </Field>
      </div>

      <Field label="Teléfono" htmlFor="phone" error={errors.phone?.message}>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+57 300 000 0000"
          aria-invalid={Boolean(errors.phone)}
          className={inputClass(Boolean(errors.phone))}
          {...register('phone')}
        />
      </Field>

      <Field label="Mensaje" htmlFor="message" error={errors.message?.message}>
        <textarea
          id="message"
          rows={5}
          aria-invalid={Boolean(errors.message)}
          className={`${inputClass(Boolean(errors.message))} resize-y`}
          {...register('message')}
        />
      </Field>

      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="hp_field">
          No llenar este campo
          <input
            id="hp_field"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register('hp_field')}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={sending}
        className="btn-primary w-full text-base disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {sending ? 'Enviando...' : 'Enviar mensaje'}
        {!sending && <span aria-hidden="true">→</span>}
      </button>

      <p className="text-xs text-espresso-700/70">
        Al enviar este formulario aceptas que Quesos La Colina te contacte por los medios proporcionados.
      </p>
    </form>
  );
}

function Field(props: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  const id = props.htmlFor;
  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-espresso-900"
      >
        {props.label}
      </label>
      {props.children}
      {props.error && (
        <span role="alert" className="text-xs font-medium text-red-700">
          {props.error}
        </span>
      )}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return [
    'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-espresso-900 placeholder:text-espresso-700/40 transition focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
      : 'border-espresso-900/10 focus:border-cheddar focus:ring-cheddar/30',
  ].join(' ');
}
