# Refund Policy

*Version 1.0.0 — last updated 2026-09-26*

This document describes the rules our support system uses to evaluate refund requests. The same rules are enforced programmatically (see `policy.json`) — this page is the human-readable version of the same policy, meant for customers, support staff, and reviewers of this system.

## 1. Refund window

Refund requests must be submitted within **30 days** of the order date. Requests made after this window are denied automatically, regardless of the reason given. We don't make exceptions here on a case-by-case basis — the window applies uniformly.

## 2. Final sale / clearance items

Items purchased as **clearance** are sold as-is, at a disclosed markdown, and are **not eligible for refund**. This is different from an item simply being in poor condition — a clearance listing means the customer was informed of the item's condition (or the discontinued/closeout status) at the time of purchase, and the price reflected that. Because this was disclosed up front, it is not treated as a defect.

This is distinct from an item that was listed as new or open-box but arrived damaged — see Section 4.

## 3. High-value orders require human review

Any refund request on an order totaling **more than $500** is automatically routed to human review before a final decision is made, no matter how clear-cut the request otherwise appears. This is a hard threshold — our AI-assisted system can help gather context and reason about the request, but it does not have final authority to approve or deny a request above this amount on its own.

## 4. Damaged or incorrect items

If an item has a **verified issue** on file — it arrived damaged in transit, the wrong item was shipped, or an item was missing from the order — the request is eligible for approval. Our support system checks the customer's description of what happened against the verified facts on the order before deciding; a request is only approved when the customer's account is consistent with what we have on record.

## 5. Suspicious or conflicting requests

Some requests are escalated for human review rather than decided automatically, including:

- The customer's description contradicts what's on file (for example, claiming an item arrived damaged when no shipping issue was ever reported, or claiming an order never arrived when it's marked delivered).
- The customer has submitted multiple refund requests in a short period of time.
- Any other signal that the request doesn't add up.

Escalation isn't a denial — it means a person will review the details before a final decision is made.

## How AI is used

Our support system uses AI to help read and reason about the free-text explanation a customer provides, and to help articulate the reasoning behind a decision. The AI does not have the authority to override the rules above — the refund window, final-sale/clearance exclusion, and the $500 review threshold are enforced by our system directly, before AI is ever consulted. The AI's role is confined to the cases these hard rules don't already resolve, and even then, its output is checked against the same verified order facts described above.
