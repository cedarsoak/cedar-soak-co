// CedarSoak Rental Agreement, Release of Liability, Assumption of Risk, and
// Towing Addendum — the text of Legal/CedarSoak_Rental_Agreement_and_Liability_Release.docx.
// Customers read and sign this online during booking; the signed PDF is built
// from the same text. If you revise the Word document, update it here too and
// bump AGREEMENT_VERSION so each signed copy records which version was signed.

import { BOOKING } from "./booking-config";

export const AGREEMENT_VERSION = "2026-10-07";
export const AGREEMENT_TITLE = "Hot Tub Trailer Rental Agreement, Release of Liability, Assumption of Risk, and Towing Addendum";

export type Block = { type: "p"; text: string } | { type: "ul"; items: string[] } | { type: "h"; text: string };

export interface AgreementSection {
  id: string;
  title: string;
  blocks: Block[];
  initials: boolean;
}

function depositText(): string {
  const d = BOOKING.depositCents / 100;
  return `$${Number.isInteger(d) ? d : d.toFixed(2)}`;
}

function occupancyRule(): string {
  return BOOKING.maxOccupancy
    ? `Maximum occupancy is ${BOOKING.maxOccupancy} persons at one time.`
    : "Maximum occupancy is the number of persons stated by CedarSoak at set-up, at one time.";
}

export const AGREEMENT_INTRO =
  "PLEASE READ CAREFULLY. This document affects your legal rights. By signing, you give up the right to bring certain claims against CedarSoak Co. and agree to be responsible for yourself, your guests, the rental premises, and (if applicable) the towing of the trailer.";

export function agreementSections(): AgreementSection[] {
  return [
    {
      id: "s1",
      title: "1. Parties and Rental Details",
      initials: false,
      blocks: [
        {
          type: "p",
          text: "This Agreement is between CedarSoak Co., its owners, members, employees, agents, and assigns (together, “CedarSoak”), and the person signing below as Renter (“Renter”). The Renter's name, contact details, rental address, rental dates, and package are the ones entered in this booking and printed on the signed copy.",
        },
        {
          type: "p",
          text: "The rented equipment (the “Equipment”) includes the wood-fired cedar hot tub, the 16-foot dual-axle trailer on which it is mounted, the heater/stove and chimney, steps, covers, and any accessories provided (including Lux package items).",
        },
      ],
    },
    {
      id: "s2",
      title: "2. Assumption of Risk",
      initials: true,
      blocks: [
        {
          type: "p",
          text: "Renter understands that using a wood-fired hot tub involves inherent risks that cannot be fully eliminated, even with careful use. These risks include, but are not limited to:",
        },
        {
          type: "ul",
          items: [
            "Overheating (hyperthermia), dizziness, fainting, dehydration, or loss of consciousness from hot water;",
            "Drowning or near-drowning, including of children, impaired persons, or anyone left unsupervised;",
            "Slips, trips, and falls on wet steps, decking, trailer surfaces, or surrounding ground;",
            "Burns from the wood-fired heater, stove pipe/chimney, hot metal, embers, or hot water;",
            "Fire, smoke inhalation, and carbon monoxide exposure from burning wood;",
            "Increased risk for persons who are pregnant, have heart conditions, high or low blood pressure, diabetes, or other medical conditions, or who take medications that cause drowsiness;",
            "Increased risk when using alcohol, cannabis, or other drugs before or during use;",
            "Waterborne irritation or illness, and injury from weather (including lightning), uneven ground, or wildlife.",
          ],
        },
        {
          type: "p",
          text: "Renter knowingly and voluntarily assumes all of these risks, known and unknown, for Renter and for every person Renter allows to use or be near the Equipment.",
        },
      ],
    },
    {
      id: "s3",
      title: "3. Rules of Safe Use",
      initials: true,
      blocks: [
        { type: "p", text: "Renter agrees to follow, and to make sure every guest follows, these rules for the entire rental period:" },
        {
          type: "ul",
          items: [
            "A responsible, sober adult (age 21+) must supervise the tub at all times while it is in use or while the fire is burning.",
            "Children under 5 are not permitted in the tub. Children ages 5–17 must be directly supervised by a parent or guardian at all times.",
            occupancyRule(),
            "Water temperature must not exceed 104°F. Check temperature before entering. Limit soaks to 15–20 minutes, and exit immediately if feeling dizzy, nauseous, or overheated.",
            "No one who is intoxicated or impaired may use the tub. No diving, jumping, horseplay, or submerging heads.",
            "No glass containers in or around the tub. Keep all electrical devices away from the water.",
            "Only dry, untreated firewood supplied by or approved by CedarSoak may be burned. No accelerants, trash, painted or treated wood.",
            "Keep the chimney, stove, and hot surfaces clear of people, clothing, towels, and flammable items. Never leave a fire unattended.",
            "Obey all local burn bans, fire codes, HOA rules, and noise ordinances. If a burn ban is in effect, do not light the fire.",
            "Exit the tub immediately during thunderstorms, lightning, or high winds.",
            "Do not move, relocate, unhitch, level, or adjust the trailer or tub once CedarSoak has set it up, except as allowed in the Towing Addendum.",
            "Do not add chemicals, soaps, bath bombs, oils, or any foreign substances to the water.",
          ],
        },
      ],
    },
    {
      id: "s4",
      title: "4. Release and Waiver of Liability",
      initials: true,
      blocks: [
        {
          type: "p",
          text: "In exchange for being allowed to rent and use the Equipment, Renter, on behalf of Renter and Renter’s heirs, family, guests, estate, and assigns, releases, waives, and discharges CedarSoak from any and all claims, demands, losses, damages, and causes of action, including claims for personal injury, illness, death, or property damage, arising out of or related to the rental, delivery, set-up, use, misuse, or presence of the Equipment, including claims arising from CedarSoak’s own ordinary negligence, to the fullest extent permitted by Ohio law.",
        },
        { type: "p", text: "This release does not apply to claims caused by CedarSoak’s gross negligence or willful or wanton misconduct." },
      ],
    },
    {
      id: "s5",
      title: "5. Indemnification",
      initials: true,
      blocks: [
        {
          type: "p",
          text: "Renter agrees to defend, indemnify, and hold harmless CedarSoak from any claim, lawsuit, loss, cost, or expense (including reasonable attorney fees) brought by Renter, any guest, any property owner, or any other third party that arises from the use, misuse, supervision, or custody of the Equipment during the rental period, or from Renter’s breach of this Agreement.",
        },
      ],
    },
    {
      id: "s6",
      title: "6. Guests",
      initials: true,
      blocks: [
        {
          type: "p",
          text: "Renter is responsible for all persons who use or are near the Equipment during the rental period. Renter will share the rules in Section 3 with every guest and will have each adult guest sign the Guest Acknowledgment and Release (attached) before using the tub. A parent or guardian must sign for any minor. Renter’s failure to obtain guest signatures does not reduce Renter’s obligations under Section 5.",
        },
      ],
    },
    {
      id: "s7",
      title: "7. Premises and Set-Up Location",
      initials: true,
      blocks: [
        {
          type: "ul",
          items: [
            "Renter confirms that Renter owns the rental address or has written permission from the owner, landlord, venue, or HOA to place and operate the Equipment there.",
            "Renter will provide a firm, level, accessible location clear of overhead lines, low branches, structures, and flammable materials, and will disclose any underground utilities, septic systems, sprinkler lines, or soft ground.",
            "CedarSoak is not responsible for ruts, lawn or landscaping damage, driveway marks, or other ordinary wear to the premises from delivery, set-up, draining, or pickup.",
            "Renter is responsible for any fines, permits, or complaints relating to the placement or use of the Equipment at the rental address.",
          ],
        },
      ],
    },
    {
      id: "s8",
      title: "8. Equipment Damage, Deposit, Cancellation, and Weather",
      initials: true,
      blocks: [
        {
          type: "ul",
          items: [
            `A ${depositText()} deposit holds the rental date and is applied toward accidental damage.`,
            "Renter is financially responsible for loss, theft, or damage to the Equipment during the rental period beyond normal wear and tear, including damage caused by guests, misuse, prohibited substances in the water, or improper burning. Charges that exceed the deposit will be billed to Renter and are due within 14 days.",
            "Cancellations require at least 48 hours’ notice before the rental start time. Cancellations with less notice forfeit the deposit.",
            "Weather before delivery. If severe weather, a burn ban, or other unsafe conditions are expected before the Equipment is delivered, CedarSoak will first work with Renter to reschedule the rental. A refund of amounts paid is a last resort, offered only if the rental cannot be rescheduled. CedarSoak decides, in its sole discretion, whether conditions justify rescheduling or cancelling.",
            "Weather during the rental. Once the Equipment has been delivered, no refund will be given for severe weather, a burn ban, or nights Renter does not use. CedarSoak may, in its sole discretion, offer a rain check toward a future rental.",
            "CedarSoak may cancel or end a rental for unsafe conditions, severe weather, a burn ban, or violation of this Agreement. CedarSoak’s liability for doing so will never exceed the amounts Renter has paid.",
          ],
        },
      ],
    },
    {
      id: "s9",
      title: "9. Towing Addendum — Renter Towing",
      initials: true,
      blocks: [
        {
          type: "p",
          text: "This Section applies only if CedarSoak approves, in writing, for Renter to tow the trailer. Unless approved, only CedarSoak may hitch, tow, or move the trailer.",
        },
        {
          type: "p",
          text: "Trailer specifications. The trailer is a 16-foot dual-axle trailer weighing approximately 1,400 lbs empty and approximately 2,500 lbs as transported. The trailer is not equipped with trailer brakes. Renter must confirm, using the tow vehicle’s owner’s manual, that the tow vehicle is rated to safely tow an unbraked trailer of at least 2,500 lbs.",
        },
        {
          type: "p",
          text: "Driver and vehicle requirements. Renter (or the driver named below) must be at least 21 years old, hold a valid driver’s license, and carry current automobile liability insurance on the tow vehicle. The tow vehicle must have a properly rated hitch and ball of the correct size, working trailer light connection, and must be in safe mechanical condition.",
        },
        { type: "p", text: "Towing rules. Renter agrees to:" },
        {
          type: "ul",
          items: [
            "Tow only with the tub fully drained, the fire completely out, the stove cold, and no people, animals, or cargo in the tub or on the trailer;",
            "Attach safety chains crossed under the tongue, confirm the coupler is locked, and check that all lights work before every trip;",
            "Not exceed 55 mph or the posted speed limit, whichever is lower, and allow extra stopping distance at all times;",
            "Tow only between the pickup location and the rental address listed above, by the most direct safe route, and not leave the State of Ohio;",
            "Not tow under the influence of alcohol or drugs, while distracted, or in severe weather;",
            "Photograph the trailer and tub (all sides, tires, lights, hitch) at pickup and at return, and report any damage or incident to CedarSoak immediately.",
          ],
        },
        {
          type: "p",
          text: "Custody and responsibility. From the time the trailer is hitched to Renter’s vehicle until it is returned to and accepted by CedarSoak, the trailer is in Renter’s sole care, custody, and control. During that time Renter is solely responsible for:",
        },
        {
          type: "ul",
          items: [
            "All damage to the trailer, tub, stove, and accessories, including tires, axles, lights, frame, and hitch;",
            "All damage to Renter’s own vehicle and property;",
            "All injury, death, or property damage to any third party arising from the towing, parking, or use of the trailer, including any traffic accident;",
            "All tickets, fines, tolls, towing/impound fees, and roadside assistance costs.",
          ],
        },
        {
          type: "p",
          text: "Insurance. Renter agrees that Renter’s own automobile and liability insurance is primary for any loss or accident occurring while Renter tows or has custody of the trailer. Renter will provide proof of insurance before towing and will notify Renter’s insurer of any claim. CedarSoak’s insurance, if any, is excess only and does not cover Renter, Renter’s vehicle, or Renter’s driving.",
        },
        {
          type: "p",
          text: "Release and indemnity for towing. Renter releases CedarSoak from, and will defend, indemnify, and hold CedarSoak harmless against, any claim, loss, or expense (including attorney fees) arising from Renter’s towing, hitching, unhitching, parking, or transport of the trailer, to the fullest extent permitted by Ohio law.",
        },
        { type: "p", text: "[ ] Towing approved by CedarSoak    [X] Towing NOT approved (CedarSoak delivers)" },
      ],
    },
    {
      id: "s10",
      title: "10. General Terms",
      initials: false,
      blocks: [
        {
          type: "ul",
          items: [
            "Medical. Renter confirms that Renter and guests are responsible for deciding whether they are medically fit to use a hot tub, and should consult a physician if unsure. In an emergency, call 911.",
            "No warranties. The Equipment is rented “as is.” Renter will inspect the Equipment at set-up and report any concern before use.",
            "Governing law. This Agreement is governed by Ohio law. Any dispute will be brought in the courts of Montgomery County, Ohio.",
            "Severability. If any part of this Agreement is found unenforceable, the rest remains in full effect, and the unenforceable part will be enforced to the greatest extent the law allows.",
            "Entire agreement. This is the complete agreement between the parties about the rental and may be changed only in writing signed by both parties.",
          ],
        },
      ],
    },
  ];
}

export const SIGNATURE_STATEMENT =
  "BY SIGNING BELOW, I CONFIRM THAT I AM AT LEAST 18 YEARS OLD, HAVE READ THIS ENTIRE AGREEMENT, UNDERSTAND IT, AND AM GIVING UP SUBSTANTIAL LEGAL RIGHTS, INCLUDING THE RIGHT TO SUE CEDARSOAK FOR ITS ORDINARY NEGLIGENCE. I SIGN IT VOLUNTARILY.";

export const ESIGN_CONSENT =
  "I agree to sign this Agreement electronically. My typed initials and drawn signature have the same legal effect as handwritten ones, and I can download a copy of the signed Agreement.";

export const GUEST_RELEASE_TEXT =
  "By signing below, each guest confirms that he or she: (1) has read or been told the Rules of Safe Use; (2) understands that using a wood-fired hot tub involves risks including overheating, drowning, burns, slips and falls, fire, and smoke; (3) is medically fit to use the tub and is not impaired; (4) voluntarily assumes all risks; and (5) releases CedarSoak Co. and its owners, employees, and agents from all claims for injury, illness, death, or property damage arising from use of the tub, including claims arising from CedarSoak’s ordinary negligence, to the fullest extent permitted by Ohio law. A parent or guardian must sign on behalf of any minor and supervise that minor at all times.";

export function initialedSectionIds(): string[] {
  return agreementSections()
    .filter((s) => s.initials)
    .map((s) => s.id);
}
