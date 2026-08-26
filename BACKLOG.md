# Future Tasks / Backlog

This document tracks future tasks, architectural shifts, and features to implement later.

## 1. Multi-Currency Support (Localization)
- **Status**: Planned (Backend schema prepared with amount/currency structure)
- **Details**:
  - The platform expects users primarily from India, so `INR` is the default currency for now.
  - In the future, we need to support dynamic currency conversion if a brand is paying in USD and the creator expects INR.
  - We will need a service to fetch daily exchange rates or let payment providers (Stripe) handle the conversion on checkout.
  - Frontend needs an interactive currency selector so creators can explicitly choose which currency their rates are listed in (e.g. INR vs USD). Currently, we default to INR.

## 2. Payouts and Wallets
- **Status**: Deferred
- **Details**:
  - We are not building an internal wallet system right now.
  - Transactions happen via Escrow or directly.
  - We will need to integrate Bank/Stripe Connect details purely for routing funds, not holding them.
