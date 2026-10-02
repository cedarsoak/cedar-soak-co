// ---------------------------------------------------------------------------
// Booking settings — edit the numbers here to change pricing and rules.
// Everything on the booking page, the admin, and the Stripe checkout reads
// from this one file. All money is in cents ($249.00 = 24900).
// ---------------------------------------------------------------------------

export const BOOKING = {
  /** Nightly rate for 3+ night stays: 3 nights = $747 (the Cedar Soak); each extra night adds $249. */
  nightlyRateCents: 24900,
  minNights: 2,
  maxNights: 7,

  /** The two featured stays. The 2-night Fall Soak has its own flat price (not a discount). */
  stays: {
    fallSoak: { name: "Fall Soak", nights: 2, priceCents: 54900 },
    cedarSoak: { name: "Cedar Soak", nights: 3, priceCents: 74700 },
  },

  /**
   * "Book 3+ nights, get a bonus night free" — only with a promo code (AFTERGLOW is
   * handed out on the /afterglow page to track Wedding Expo bookings). Link people to
   * /book?promo=AFTERGLOW and the code is filled in for them.
   */
  bonusNight: {
    enabled: true,
    /** Codes that unlock the free night. Add more (e.g. "SOAK4") to run other offers. */
    promoCodes: ["AFTERGLOW"],
    /** The free night applies once the stay is at least this long (3 paid + 1 free = 4). */
    minNightsForFreeNight: 4,
    label: "Bonus night free (book 3+, get one on us)",
    /** Only one use per person — checked against past confirmed bookings with the same email. */
    oncePerPerson: true,
  },

  /** Deposit collected online to hold the date ($249 = one night). */
  depositCents: 24900,
  /**
   * false = the deposit is a damage deposit, held and refunded after pickup (matches the
   *         Rental Agreement, section 8). The full rental is still owed as the balance.
   * true  = the deposit counts toward the rental price, so the balance is total minus the deposit.
   */
  depositAppliesToRental: false,
  /** Shown to customers under the price summary. */
  balanceDueText: "Rental balance is due on or before delivery day. We'll send a secure payment link.",

  /** Delivery pricing: free within this radius of Oakwood, OH; beyond it, flat fee + per mile past the radius. */
  delivery: {
    originLabel: "Oakwood, OH",
    originLat: 39.7253,
    originLng: -84.1741,
    freeRadiusMiles: 15,
    feeCents: 4500,
    perMileCents: 250,
    /** Straight-line distance x this factor ~= driving distance, for the online estimate. */
    roadFactor: 1.25,
  },

  /** Packages. Set luxAddOnCents to a number (e.g. 7500) to offer The Lux online; null hides it. */
  packages: {
    escape: { label: "The Escape", description: "Tub, trailer, setup, walkthrough and pickup." },
    lux: {
      label: "The Lux",
      description: "Adds towels, pillows, blanket, side table and a wine ice bucket.",
      addOnCents: 9900 as number | null,
    },
  },

  heatOptions: ["Wood-fire", "Electric", "Hybrid / not sure yet"],
  occasions: [
    "Wedding weekend",
    "The Afterglow (morning after)",
    "Bachelorette party",
    "Date night",
    "Birthday",
    "Anniversary",
    "Staycation",
    "Family gathering",
    "Other",
  ],

  /** "How did you hear about us?" choices on the booking form. */
  referralOptions: [
    "Instagram",
    "TikTok",
    "Facebook",
    "Google search",
    "Wedding expo",
    "Friend or family",
    "Poster or flyer",
    "Venue or planner",
    "Saw the trailer in person",
    "Other",
  ],

  /** "Expected guests" dropdown. The last option means "more than maxOccupancy" and is saved as that number + 1. */
  guestOptions: [1, 2, 3, 4, 5, 6, 7],

  /** Earliest bookable date = today + this many days (gives you time to prep). */
  minLeadDays: 2,
  /** How far ahead customers can book. */
  maxMonthsAhead: 12,
  /**
   * Turnover days: the pickup day is always blocked for the next renter. Add extra
   * days here if you need more time to clean between rentals.
   */
  turnoverDaysAfterPickup: 0,
  /** Minutes a date is held while the customer is on the Stripe payment page. */
  holdMinutes: 35,

  /** Rental Agreement, section 3 — "Maximum occupancy is ___ persons". null = "as posted by CedarSoak at set-up". */
  maxOccupancy: 6 as number | null,

  /** Customer account page ("View my rental"). */
  account: {
    /** Customers can switch packages until this many hours before delivery. */
    packageChangeCutoffHours: 48,
  },

  /**
   * Referral reward: a friend who books with a customer's share link gets this much off,
   * and the customer who shared it gets the same credit once the friend's deposit is paid.
   * The credit comes off the sharer's upcoming rental, or their next one if none is booked.
   * Set either to 0 to turn it off.
   */
  referral: {
    friendDiscountCents: 2500,
    referrerCreditCents: 2500,
  },

  /** Hours of notice needed to get the deposit back when cancelling (Rental Agreement, section 8). */
  cancellationNoticeHours: 48,
  /** Days the client has to pay a balance or damage invoice (Stripe Invoicing). */
  invoiceDaysUntilDue: 7,

  /** Shown next to the "text me" checkbox on the forms. Only text people who ticked it. */
  smsConsentText:
    "Text me updates about my booking and occasional Cedar Soak offers. Message and data rates may apply. Reply STOP to opt out anytime.",

  businessName: "Cedar Soak Co.",
  businessPhone: "937-604-6399",
  businessEmail: "cedarsoak@gmail.com",
  timeZone: "America/New_York",
} as const;

export type PackageKey = keyof typeof BOOKING.packages;

export function luxAvailable(): boolean {
  return BOOKING.packages.lux.addOnCents !== null;
}
