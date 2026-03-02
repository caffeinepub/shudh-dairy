import { getFounderInfo } from "@/utils/storeCustomization";
import { Quote } from "lucide-react";
import { motion } from "motion/react";

export function FounderSection() {
  const founder = getFounderInfo();

  // Resolve photo: custom base64 → default generated photo
  const photoSrc =
    founder.photo || "/assets/generated/founder-photo.dim_400x400.jpg";

  return (
    <section
      data-ocid="founder.section"
      className="founder-section relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full founder-blob-1 blur-3xl opacity-30" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full founder-blob-2 blur-3xl opacity-20" />
        {/* Grain texture overlay */}
        <div className="absolute inset-0 founder-grain" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        {/* Section label */}
        <motion.div
          className="flex items-center gap-3 mb-10 sm:mb-12"
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="h-px w-8 founder-divider-line" />
          <span className="founder-label text-xs font-bold tracking-widest uppercase">
            Our Story
          </span>
          <div className="h-px w-8 founder-divider-line" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ── Photo column ──────────────────────────────────────── */}
          <motion.div
            className="flex justify-center lg:justify-start"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="relative">
              {/* Decorative frame */}
              <div className="founder-frame-outer absolute -inset-3 rounded-[2rem] -rotate-2" />
              <div className="founder-frame-inner absolute -inset-1.5 rounded-[1.75rem] rotate-1" />

              {/* Photo */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  data-ocid="founder.photo"
                  src={photoSrc}
                  alt={`${founder.name} — ${founder.title}`}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
                {/* Photo overlay gradient */}
                <div className="absolute inset-0 founder-photo-overlay" />
              </div>

              {/* Founded year badge */}
              <motion.div
                className="founder-year-badge absolute -bottom-5 -right-5 rounded-2xl px-4 py-3 shadow-lg"
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.35, ease: "backOut" }}
              >
                <p className="founder-year-label text-xs font-bold uppercase tracking-wider">
                  Since
                </p>
                <p className="founder-year-value text-3xl font-bold leading-none font-display">
                  {founder.foundedYear}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* ── Bio column ────────────────────────────────────────── */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
          >
            {/* Decorative quote icon */}
            <div className="founder-quote-icon w-12 h-12 rounded-xl flex items-center justify-center">
              <Quote size={22} className="founder-quote-icon-color" />
            </div>

            {/* Pull quote */}
            <blockquote className="founder-pullquote text-xl sm:text-2xl font-display font-bold leading-snug">
              "Pure dairy. Trusted families. Udaipur's own."
            </blockquote>

            {/* Bio text */}
            <p
              data-ocid="founder.bio"
              className="founder-bio text-base leading-relaxed"
            >
              {founder.bio}
            </p>

            {/* Founder name + title */}
            <div className="pt-2">
              <div className="founder-name-divider h-0.5 w-12 mb-4 rounded-full" />
              <p
                data-ocid="founder.name"
                className="founder-name font-display text-2xl font-bold leading-tight"
              >
                {founder.name}
              </p>
              <p className="founder-title text-sm font-semibold mt-1 tracking-wide">
                {founder.title}
              </p>
              <p className="founder-company text-xs mt-1.5 tracking-wider uppercase">
                SUNRISE MILK AND AGRO PRODUCT'S
              </p>
            </div>

            {/* Trust pillars */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { emoji: "🐄", label: "Farm Direct" },
                { emoji: "✨", label: "No Additives" },
                { emoji: "❤️", label: "Family Values" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="founder-pillar rounded-xl p-3 text-center"
                >
                  <div className="text-xl mb-1">{item.emoji}</div>
                  <p className="founder-pillar-text text-xs font-semibold">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
