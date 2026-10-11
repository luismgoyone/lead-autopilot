"use client";

import { useState } from "react";
import { z } from "zod";
import { InquiryResult, type InquiryResultData } from "@/components/inquiry-result";
import { Turnstile, turnstileEnabled } from "@/components/turnstile";
import {
  PREFERRED_TIMES,
  inquirySchema,
  type InquiryFieldErrors,
} from "@/lib/inquiry";

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent"; data: InquiryResultData }
  | { state: "error"; message: string };

const inputClass =
  "w-full rounded-lg border border-pine/25 bg-sage/60 px-4 py-3 text-slate placeholder:text-slate/50 focus:border-pine focus:outline-none focus:ring-4 focus:ring-sunrise/20";

export function InquiryForm() {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [errors, setErrors] = useState<InquiryFieldErrors>({});
  const [preferredTime, setPreferredTime] = useState<string>("Any time");
  const [token, setToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    const result = inquirySchema.safeParse(data);
    if (!result.success) {
      setErrors(z.flattenError(result.error).fieldErrors);
      return;
    }
    setErrors({});
    if (turnstileEnabled && !token) {
      setStatus({ state: "error", message: "Please complete the \"verify you are human\" check." });
      return;
    }
    setStatus({ state: "sending" });

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, website: data.website, turnstileToken: token }),
      });
      const json = await res.json();
      // Each Turnstile token works once, so get a fresh one after any attempt.
      setToken(null);
      setTurnstileKey((k) => k + 1);
      if (!res.ok || !json.ok) {
        setErrors(json.fieldErrors ?? {});
        setStatus({ state: "error", message: json.error ?? "Something went wrong." });
        return;
      }
      form.reset();
      setPreferredTime("Any time");
      setStatus({ state: "sent", data: json });
    } catch {
      setStatus({
        state: "error",
        message: "We couldn't send that. Please try again or call (074) 555-0142.",
      });
    }
  }

  if (status.state === "sent") {
    return <InquiryResult data={status.data} onReset={() => setStatus({ state: "idle" })} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="relative grid gap-5 sm:grid-cols-2">
      <Field label="Full name" name="name" error={errors.name} required>
        <input id="name" name="name" autoComplete="name" placeholder="e.g. Maria Santos" className={inputClass} />
      </Field>
      <Field label="Email" name="email" error={errors.email} required>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="maria@example.com" className={inputClass} />
      </Field>
      <Field label="Phone (optional)" name="phone" error={errors.phone}>
        <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0917 000 0000" className={inputClass} />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Preferred time</legend>
        <div className="grid grid-cols-3 gap-2">
          {PREFERRED_TIMES.map((time) => (
            <label
              key={time}
              className={`cursor-pointer rounded-lg border px-2 py-3 text-center text-sm font-medium ${
                preferredTime === time
                  ? "border-pine bg-pine text-white"
                  : "border-pine/25 bg-white text-slate hover:bg-sage/50"
              }`}
            >
              <input
                type="radio"
                name="preferredTime"
                value={time}
                checked={preferredTime === time}
                onChange={() => setPreferredTime(time)}
                className="sr-only"
              />
              {time}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-2">
        <Field label="How can we help?" name="message" error={errors.message} required>
          <textarea
            id="message"
            name="message"
            rows={5}
            placeholder="Tell us what's going on, or ask about a service or time."
            className={inputClass}
          />
        </Field>
      </div>

      {/* Honeypot for bots: hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-3 sm:col-span-2">
        <Turnstile onToken={setToken} resetKey={turnstileKey} />
        {status.state === "error" && (
          <p role="alert" className="rounded-lg bg-sunrise/15 px-4 py-3 text-sm text-slate">
            {status.message}
          </p>
        )}
        <button
          type="submit"
          disabled={status.state === "sending"}
          className="w-full rounded-lg bg-sunrise px-6 py-3.5 font-semibold text-white shadow-sm hover:bg-[#d06a4d] disabled:opacity-60 sm:w-fit"
        >
          {status.state === "sending" ? "Sending…" : "Send inquiry"}
        </button>
        <p className="text-sm text-slate/60">
          This is a demo clinic. Please use made-up details.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string[];
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
        {required && <span className="text-sunrise"> *</span>}
      </label>
      {children}
      {error?.[0] && <p className="text-sm text-[#b4532f]">{error[0]}</p>}
    </div>
  );
}
