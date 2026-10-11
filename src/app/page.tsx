import Image from "next/image";
import { InquiryForm } from "@/components/inquiry-form";
import { Logo } from "@/components/logo";

const services = [
  {
    name: "Cleanings",
    description: "Gentle cleanings and checkups to keep your teeth and gums healthy. We recommend one every six months.",
  },
  {
    name: "Fillings",
    description: "Tooth-coloured fillings that blend in with your smile.",
  },
  {
    name: "Whitening",
    description: "In-clinic and take-home options, with a gentle formula for sensitive teeth.",
  },
  {
    name: "Braces consultations",
    description: "A relaxed first visit for teens and adults to talk through braces and clear aligners.",
  },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-pine/10 bg-mist/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <a href="#top" aria-label="Pinecrest Dental home">
              <Logo />
            </a>
            <span className="hidden rounded-full bg-sage px-3 py-1 text-xs font-semibold text-pine sm:inline">
              Demo business
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#services" className="hover:text-pine">Services</a>
            <a href="#hours" className="hover:text-pine">Hours</a>
            <a href="#inquiry" className="hover:text-pine">Contact</a>
            <a href="/log" className="hover:text-pine">Inquiry log</a>
          </nav>
          <a
            href="#inquiry"
            className="shrink-0 rounded-lg bg-sunrise px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white hover:bg-[#d06a4d]"
          >
            <span className="sm:hidden">Ask us</span>
            <span className="hidden sm:inline">Send an inquiry</span>
          </a>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-5 inline-block rounded-full bg-sage px-3 py-1 text-sm font-medium text-pine sm:hidden">
              Demo business
            </p>
            <h1 className="font-display text-4xl leading-tight font-medium text-slate sm:text-5xl md:text-6xl">
              Gentle dental care in the City of Pines.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate/80">
              Message us any time. We reply in under a minute, day or night.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#inquiry"
                className="rounded-lg bg-sunrise px-6 py-3.5 text-center font-semibold text-white hover:bg-[#d06a4d]"
              >
                Ask a question
              </a>
              <a
                href="tel:+63745550142"
                className="rounded-lg border border-pine/40 px-6 py-3.5 text-center font-semibold text-pine hover:bg-sage/50"
              >
                Call (074) 555-0142
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-[0_12px_32px_-8px_rgba(31,42,48,0.15)]">
            <Image
              src="/clinic.jpg"
              alt="A bright clinic waiting room with pine trees outside the windows"
              width={1376}
              height={768}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        {/* Services */}
        <section id="services" className="scroll-mt-20 border-y border-pine/10 bg-[#ebe8e0]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="text-sm font-semibold tracking-wider text-pine uppercase">Services</p>
            <h2 className="mt-2 font-display text-3xl font-medium sm:text-4xl">
              Calm, careful dental care for the whole family.
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <article key={service.name} className="rounded-2xl border border-white/60 bg-sage p-6">
                  <h3 className="font-display text-2xl font-medium text-pine">{service.name}</h3>
                  <p className="mt-3 text-slate/80">{service.description}</p>
                </article>
              ))}
              <article className="rounded-2xl border-2 border-sunrise/40 bg-sage p-6 sm:col-span-2 lg:col-span-2">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-2xl font-medium text-pine">Emergency care</h3>
                  <span className="rounded-full bg-sunrise/15 px-3 py-1 text-sm font-semibold text-[#b4532f]">
                    Same-day
                  </span>
                </div>
                <p className="mt-3 text-slate/80">
                  Toothache, a broken tooth or an accident? We keep time open every day for urgent visits.
                  Send us a message or call and we&apos;ll fit you in.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Hours */}
        <section id="hours" className="mx-auto grid max-w-6xl scroll-mt-20 gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold tracking-wider text-pine uppercase">Hours &amp; location</p>
            <h2 className="mt-2 font-display text-3xl font-medium sm:text-4xl">Find us in Baguio City.</h2>
            <p className="mt-4 text-lg text-slate/80">
              Dr. Andrea Reyes and her team keep visits quiet, personal and on time.
            </p>
            <p className="mt-6 text-slate/80">
              Session Road Extension, Baguio City, Benguet
            </p>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-[0_10px_30px_-8px_rgba(31,42,48,0.08)]">
            <h3 className="font-display text-2xl font-medium text-pine">Clinic hours</h3>
            <dl className="mt-6 divide-y divide-pine/10">
              <div className="flex justify-between py-3">
                <dt>Monday to Saturday</dt>
                <dd className="font-semibold text-pine">9:00 AM – 6:00 PM</dd>
              </div>
              <div className="flex justify-between py-3">
                <dt>Sunday</dt>
                <dd className="font-semibold text-slate/60">Closed</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-slate/70">
              Messages sent after hours still get a reply within a minute.
            </p>
          </div>
        </section>

        {/* Inquiry form */}
        <section id="inquiry" className="scroll-mt-20 bg-[#ebe8e0] py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="font-display text-3xl font-medium sm:text-4xl">Ask us anything.</h2>
              <p className="mt-3 text-slate/80">
                Booking, prices, or something that hurts. We&apos;ll get back to you right away.
              </p>
            </div>
            <div className="mt-10 rounded-3xl bg-white p-6 shadow-[0_12px_32px_-8px_rgba(31,42,48,0.08)] sm:p-10">
              <InquiryForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-pine text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo light />
            <p className="mt-3 text-sm text-white/75">Monday to Saturday, 9 AM to 6 PM · Baguio City</p>
          </div>
          <p className="text-sm text-white/75">
            Pinecrest Dental is a demo business.{" "}
            <a href="/log" className="rounded bg-white/10 px-2 py-1 hover:bg-white/20">
              Built with Lead Autopilot: see the live log
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
