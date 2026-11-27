"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/*
 * "Get in touch" form in a native <dialog> (focus trap, Esc to close, backdrop for free).
 * There's no server: submitting opens the visitor's own mail app with a drafted email to me
 * (subject + body filled in from the form), so nothing is stored or sent by the site itself.
 * To send straight from the page later, point the form at a service like Formspree.
 */

export type ContactFormHandle = { open: () => void };

const TOPICS = ["Internship", "A project", "Just saying hi"] as const;

export const ContactForm = forwardRef<ContactFormHandle>(function ContactForm(_, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("Internship");

  useImperativeHandle(ref, () => ({ open: () => dialogRef.current?.showModal() }));
  const close = () => dialogRef.current?.close();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = `${topic}${name ? ` · from ${name}` : ""}`;
    const body = `${message}\n\n${name ? `— ${name}` : ""}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    close();
  }

  const field =
    "w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-glow/70";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="contact-form-title"
      onClick={(e) => e.target === dialogRef.current && close()} // click the backdrop to close
      className="m-auto w-[min(560px,calc(100vw-2rem))] rounded-3xl border border-white/12 bg-[#0b1626]/95 p-0 text-foreground shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9),0_0_60px_-20px_rgb(94_224_255/0.3)] backdrop:bg-[rgb(3_8_16/0.6)] backdrop:backdrop-blur-sm open:animate-[dialog-in_0.35s_cubic-bezier(0.16,1,0.3,1)]"
    >
      <form onSubmit={onSubmit} className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.12em] text-glow uppercase">Get in touch</p>
            <h3 id="contact-form-title" className="mt-2 font-heading text-3xl font-bold text-cream">
              Send me a message
            </h3>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/12 text-muted-foreground transition-colors hover:border-glow hover:text-glow"
          >
            <X className="size-4" />
          </button>
        </div>

        <fieldset className="mt-6">
          <legend className="mb-2 text-sm text-muted-foreground">What&apos;s it about?</legend>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={topic === t}
                onClick={() => setTopic(t)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  topic === t ? "border-glow bg-glow text-ink" : "border-white/15 text-foreground/85 hover:border-white/30",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm text-muted-foreground">Your name</span>
          <input name="name" autoComplete="name" placeholder="Jane Doe" className={field} />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm text-muted-foreground">Message</span>
          <textarea name="message" required rows={4} placeholder="Hey Andrew, …" className={cn(field, "resize-none")} />
        </label>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Opens your email app with this drafted.</p>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-glow px-5 py-2.5 text-sm font-semibold text-ink transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Send className="size-4" /> Draft email
          </button>
        </div>
      </form>
    </dialog>
  );
});
