'use client';

import { Check, Info, ShieldCheck } from "lucide-react";
import type { InstitutionalPageData } from "../../lib/institutional-data";

export function InstitutionalPage({ data }: { data: InstitutionalPageData }) {
  return (
    <article>
      <header className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-20">
          <p className="text-xs font-bold uppercase text-muted-foreground">{data.eyebrow}</p>
          <h1 data-institutional-title className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">{data.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{data.introduction}</p>
          <p className="mt-7 text-xs text-muted-foreground">{data.updatedAt}</p>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="grid gap-10 sm:gap-12">
          {data.sections.map((section, sectionIndex) => (
            <section key={section.title} className="grid gap-4 border-b border-border pb-10 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-6 sm:pb-12">
              <span className="text-sm font-bold text-muted-foreground">{String(sectionIndex + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">{section.title}</h2>
                {section.body?.map((paragraph) => <p key={paragraph} className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{paragraph}</p>)}
                {section.items && <ul className="mt-5 grid gap-3">{section.items.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground sm:text-base"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3" /></span><span>{item}</span></li>)}</ul>}
                {section.steps && <ol className="mt-6 grid gap-3 sm:grid-cols-3">{section.steps.map((step, index) => <li key={step.title} className="rounded-lg border border-border bg-card p-5"><span className="text-xs font-bold text-muted-foreground">PASSO {index + 1}</span><h3 className="mt-3 font-bold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p></li>)}</ol>}
              </div>
            </section>
          ))}
        </div>
        <aside className="mt-10 flex gap-4 rounded-lg border border-border bg-muted/40 p-5 sm:p-6">
          {data.title === "Termos e Privacidade" ? <ShieldCheck className="mt-0.5 size-5 shrink-0" /> : <Info className="mt-0.5 size-5 shrink-0" />}
          <div><h2 className="font-bold">{data.note.title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{data.note.description}</p></div>
        </aside>
      </div>
    </article>
  );
}
