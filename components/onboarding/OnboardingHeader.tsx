import Link from "next/link";

interface OnboardingHeaderProps {
  step: 1 | 2 | 3;
}

const STEP_LABELS = ["Face the Mirror", "Excavate Your Why", "Forge Your Environment"];

export function OnboardingHeader({ step }: OnboardingHeaderProps) {
  return (
    <div className="mb-8 sm:mb-12 shrink-0">
      {/* Logo */}
      <Link
        href="/"
        className="inline-block font-heading text-sm font-bold tracking-[0.15em] text-forge-orange uppercase hover:opacity-80 transition-opacity duration-200"
      >
        MINDFORGE
      </Link>

      {/* Step progress */}
      <div className="mt-6 flex items-center gap-0">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center">
            {/* Dot */}
            <div className="relative flex items-center justify-center">
              <div
                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                  s < step
                    ? "bg-forge-orange scale-90"
                    : s === step
                    ? "bg-forge-orange ring-2 ring-forge-orange/30 scale-110"
                    : "bg-forge-border"
                }`}
              />
            </div>
            {/* Connector line */}
            {i < 2 && (
              <div className="mx-2 h-px w-10 sm:w-16 transition-all duration-300">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    background: s < step ? "#FF6B2B" : "#2A2927",
                    width: "100%",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step label */}
      <p className="mt-3 text-xs tracking-[0.15em] text-text-muted uppercase">
        Step {step} of 3 —{" "}
        <span className="text-text-secondary">{STEP_LABELS[step - 1]}</span>
      </p>
    </div>
  );
}
