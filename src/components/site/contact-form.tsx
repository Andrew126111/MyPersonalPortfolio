"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, Mail, MailCheck, Send, X } from "lucide-react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/*
 * "Get in touch" form in a native <dialog> (focus trap, Esc to close, backdrop for free).
 * There's no server: submitting opens the visitor's own mail app with a drafted email to me
 * (subject + body filled in from the form), so nothing is stored or sent by the site itself.
 *
 * Lots of people (especially on laptops) only use webmail and have no mail app set up, so the
 * mailto link silently does nothing for them. After "Draft email" the dialog therefore stays
 * open with fallbacks: open the same draft in Gmail or Outlook on the web, copy the whole
 * message, or try the mail app again. The form is only hidden, so "Edit message" keeps input.
 * To send straight from the page later, point the form at a service like Formspree.
 */

export type ContactFormHandle = { open: () => void };

const TOPICS = ["Internship", "A project", "Just saying hi"] as const;

type Draft = { subject: string; body: string };

const enc = encodeURIComponent;
const mailtoUrl = (d: Draft) => `mailto:${site.email}?subject=${enc(d.subject)}&body=${enc(d.body)}`;
const gmailUrl = (d: Draft) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(site.email)}&su=${enc(d.subject)}&body=${enc(d.body)}`;
const outlookUrl = (d: Draft) =>
  `https://outlook.live.com/mail/0/deeplink/compose?to=${enc(site.email)}&subject=${enc(d.subject)}&body=${enc(d.body)}`;

export const ContactForm = forwardRef<ContactFormHandle>(function ContactForm(_, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("Internship");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [copied, setCopied] = useState(false);

  useImperativeHandle(ref, () => ({ open: () => dialogRef.current?.showModal() }));
  const close = () => dialogRef.current?.close();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const d = {
      subject: `${topic}${name ? ` · from ${name}` : ""}`,
      body: `${message}\n\n${name ? `— ${name}` : ""}`.trim(),
    };
    setDraft(d);
    setCopied(false);
    window.location.href = mailtoUrl(d); // opens the mail app, if there is one; the page stays put
  }

  async function copyMessage() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(`To: ${site.email}\nSubject: ${draft.subject}\n\n${draft.body}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the Gmail/Outlook buttons still work */
    }
  }

  // Closing (Done, X, Esc or the backdrop) after a draft starts the next visit fresh.
  // Listens to the native "close" event, which fires however the dialog was closed.
  const draftRef = useRef<Draft | null>(null);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => {
      if (!draftRef.current) return;
      formRef.current?.reset();
      setTopic("Internship");
      setDraft(null);
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const field =
    "w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-glow/70";
  const option =
    "flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-glow/60 hover:bg-white/[0.07]";
  const closeBtn = (
    <button
      type="button"
      onClick={close}
      aria-label="Close"
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/12 text-muted-foreground transition-colors hover:border-glow hover:text-glow"
    >
      <X className="size-4" />
    </button>
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="contact-form-title"
      onClick={(e) => e.target === dialogRef.current && close()} // click the backdrop to close
      className="m-auto w-[min(560px,calc(100vw-2rem))] rounded-3xl border border-white/12 bg-[#0b1626]/95 p-0 text-foreground shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9),0_0_60px_-20px_rgb(94_224_255/0.3)] backdrop:bg-[rgb(3_8_16/0.6)] backdrop:backdrop-blur-sm open:animate-[dialog-in_0.35s_cubic-bezier(0.16,1,0.3,1)]"
    >
      {/* after "Draft email": confirmation + fallbacks for people without a mail app */}
      {draft && (
        <div className="p-6 sm:p-8" aria-live="polite">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="flex size-11 items-center justify-center rounded-full bg-glow/15 text-glow">
                <MailCheck className="size-5" />
              </span>
              <h3 id="contact-form-title" className="mt-4 font-heading text-3xl font-bold text-cream">
                Almost there
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                Your email app should be opening with the message ready. Just hit send.
              </p>
            </div>
            {closeBtn}
          </div>

          <p className="mt-6 text-sm text-foreground/85">Nothing opened? Send it another way:</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <a href={gmailUrl(draft)} target="_blank" rel="noreferrer" className={option}>
              <Mail className="size-4 text-glow" /> Open in Gmail <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
            </a>
            <a href={outlookUrl(draft)} target="_blank" rel="noreferrer" className={option}>
              <Mail className="size-4 text-glow" /> Open in Outlook <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
            </a>
            <button type="button" onClick={copyMessage} className={option}>
              {copied ? <Check className="size-4 text-glow" /> : <Copy className="size-4 text-glow" />}
              {copied ? "Copied, paste it anywhere" : "Copy message + my email"}
            </button>
            <a href={mailtoUrl(draft)} className={option}>
              <Send className="size-4 text-glow" /> Try my email app again
            </a>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-glow"
            >
              <ArrowLeft className="size-4" /> Edit message
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-full bg-glow px-5 py-2.5 text-sm font-semibold text-ink transition-transform duration-200 hover:-translate-y-0.5"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* the form stays mounted (just hidden) so "Edit message" keeps what they typed */}
      <form ref={formRef} onSubmit={onSubmit} hidden={!!draft} className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.12em] text-glow uppercase">Get in touch</p>
            <h3 id={draft ? undefined : "contact-form-title"} className="mt-2 font-heading text-3xl font-bold text-cream">
              Send me a message
            </h3>
          </div>
          {closeBtn}
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
          <p className="text-xs text-muted-foreground">Opens your email app with this drafted (or Gmail / Outlook).</p>
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
