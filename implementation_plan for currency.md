# Multi-Currency & Localization Strategy

As requested, here is a detailed breakdown of how we should handle multi-currency support (especially INR vs USD), how other platforms do it, and what our code needs to look like to support this seamlessly.

## The Problem
Our creators are primarily based in India (expecting INR), but brands might be international (paying in USD, EUR, etc.). 
If a creator sets their minimum rate to ₹50,000 INR, a US brand should see that as ~$600 USD. 
If a US brand offers $1,000 USD for a campaign, the Indian creator should see that as ~$83,000 INR.

## How Other Companies Handle This

### 1. Stripe (The Payment Processor Approach)
Stripe handles "Presentment Currency" vs "Settlement Currency".
- **Presentment Currency**: What the customer (brand) sees and pays in (e.g., USD).
- **Settlement Currency**: What the merchant (creator) receives in their bank account (e.g., INR).
- **Exchange Rates**: Stripe guarantees the exchange rate at the moment of checkout. They take a small conversion fee (usually 1-2%).

### 2. Upwork (The Marketplace Approach)
- **Unified Currency**: Upwork standardizes *everything* in USD on the platform. All contracts, hourly rates, and escrow are in USD.
- **Conversion at Withdrawal**: The freelancer only converts to their local currency (e.g., INR) when they withdraw funds to their local bank account. 
- **Pros**: Extremely simple backend (no daily exchange rate syncs needed).
- **Cons**: Creators have to mentally convert their rates, and take on exchange rate risk.

### 3. Airbnb (The Dynamic Display Approach)
- **Base Currency**: The host sets their price in their local currency (e.g., INR).
- **Display Currency**: The guest sees the price converted to their local currency (e.g., USD) using a daily updated exchange rate.
- **Checkout**: The guest is charged in USD. Airbnb handles the conversion and pays the host in INR.

---

## Our Recommended Approach (The "Airbnb Model")

Since our users are primarily in India, forcing them to think in USD (the Upwork model) is bad UX. We should let Creators think in INR and Brands think in USD.

> [!TIP]
> **Core Principle**: Store the base `amount` and `currency` in the database exactly as the user entered it, and only convert for *display* purposes based on the viewer's preference.

### 1. Database Schema (Already Implemented)
We have already set up the database to handle this cleanly. Every monetary value is an object, not just a raw number.
```json
{
  "amount": 50000,
  "currency": "INR"
}
```

### 2. Live Exchange Rates (To-Do)
We need a background service or an API (like Open Exchange Rates or Fixer.io) to fetch daily conversion rates. 
```javascript
// Example cached exchange rates
const rates = {
  USD_TO_INR: 83.15,
  INR_TO_USD: 0.012
}
```

### 3. Frontend Display Utility (To-Do)
We will create a global React hook `useCurrency()` that knows the user's preferred currency. 
When rendering a dashboard, instead of raw `Intl.NumberFormat`, we pass it through the converter:

```tsx
function formatMoney(baseAmount, baseCurrency, userPreferredCurrency) {
  if (baseCurrency === userPreferredCurrency) {
    return format(baseAmount, baseCurrency); // No conversion
  }
  const convertedAmount = convert(baseAmount, baseCurrency, userPreferredCurrency);
  return format(convertedAmount, userPreferredCurrency);
}
```

### 4. Escrow & Payouts (Future)
When a brand pays $1,000 USD into escrow, we hold it. When it's time to pay the creator, our payment gateway (e.g., Stripe Connect or Razorpay) handles the actual FX conversion to deposit INR into the creator's local bank account.

## Next Steps for Implementation

To make our codebase "future-ready" for this right now, we need to:

1. **Update Frontend Formatting**: Create a central `formatCurrency(amount, currency)` utility that takes the currency string from the backend instead of hardcoding `"USD"` everywhere (which is what the brand and influencer dashboards currently do).
2. **User Preferences**: Add a "Display Currency" dropdown in both the Brand and Influencer Settings pages.
3. **API Integration**: Integrate a free exchange rate API to handle the live math on the frontend.

## Open Questions

> [!IMPORTANT]
> 1. Do you want to build the `useCurrency` hook and integrate a live exchange rate API right now, or just refactor the frontend to dynamically use the `currency` string from the backend (so it's not hardcoded to USD)?
> 2. For Phase 1, should we default all Brand accounts to USD and all Influencer accounts to INR?
