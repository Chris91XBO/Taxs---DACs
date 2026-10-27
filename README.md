# Receivable Status – Fintech360 and Cashier360

Receivables dashboard (issued / received / outstanding invoices, by group and
company), moved out of the claude.ai dashboard into plain files so it can be
edited freely.

## Run it

The page loads its data with `fetch`, so serve the folder instead of
double-clicking the file:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page: styles, layout, calculations (`dash.calc(...)`) and drawing code. |
| `dash.js` | Small stand-in for the claude.ai dashboard runtime (`dash.data`, `dash.calc`, `dash.onData`, `dash.params`, …). Lists the data files in `DATASETS`. |
| `data/fintech_invoices.json` | 210 Fintech360 invoices from the *Updated Outstanding Revenue Report – Fintech (27/10/2026)* workbook (October + previous months), amounts in USD. |
| `data/cashier_invoices.json` | 11 Cashier360 invoices from *Book2.xlsx* (current + previous month). Invoice C6 #54, received 03/08/2026, is left out as it was settled before October. |
| `vendor/d3.v7.9.0.min.js` | d3, vendored so the page works offline. |

## Updating the data

Each invoice is one object:

```json
{ "id": "OCT-001", "group": "G1", "invoice": "983", "client": "…", "service": "…",
  "month": "Sep 2026", "period": "2026-09", "amount": 22250, "currency": "USD",
  "usd": 22250, "entity": "Fintech HK", "status": "Received", "paid_on": "2026-10-23",
  "sheet": "October invoices" }
```

- `sheet` is `"October invoices"` (current month) or `"Prior invoices"`.
- `status` is `"Received"` or `"Outstanding"`; `paid_on` is `YYYY-MM-DD` or empty.
- `id` must be unique within a file.

To add another source, put a JSON array in `data/` and add it to `DATASETS` in
`dash.js`; it's then available as `dash.data('<id>')` and as a `dash.calc` input.

The reporting month (October 2026, "as at 31/10/2026") is written in
`index.html`; update the headings when you roll to a new month.
