"use client";

import React from "react";

interface PaymentPolicyNoticeProps {
  className?: string;
}

export default function PaymentPolicyNotice({
  className = "",
}: PaymentPolicyNoticeProps) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-white/5 p-3 text-left text-xs leading-relaxed text-white/75 ${className}`}
    >
      <p>
        <span className="font-medium text-white/85">CZ:</span> Rezervací
        blokujete místo, které mohlo připadnout někomu dalšímu. Když nám dáte
        vědět více než 24 hodin před akcí, můžeme zaplacenou vstupenku převést
        na další akci. Při pozdějším zrušení nebo neúčasti vstupenka propadá.
      </p>
      <p className="mt-2">
        <span className="font-medium text-white/85">EN:</span> Your
        registration reserves a spot that could have gone to someone else. If
        you contact us more than 24 hours before the event, we can move your
        paid ticket to the next event. Later cancellations or no-shows mean
        the ticket is forfeited.
      </p>
    </div>
  );
}