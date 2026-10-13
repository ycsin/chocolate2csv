# chocolate2csv

Converts Chocolate Finance monthly account statement PDFs into CSV or QIF files for a personal
finance app.

**Use it at <https://ycsin.github.io/chocolate2csv/>**, or download `index.html` and open it
locally. Drop the PDFs, pick the months, download. It's one self-contained file (pdf.js
embedded, no network access); the PDFs never leave the browser.

**Unofficial, not affiliated with Chocolate Finance.** Check the results against your
statements before relying on them.

## Output

- **One transactions CSV per currency account** (SGD, USD, …): money added and withdrawn,
  monthly returns, outperformance returns and currency conversions. Notes carry extra
  detail, e.g. a conversion's exchange rate and the amount in the other currency (each side
  appears in its own account).
- Every month is reconciled against the statement's start and end balance; any mismatch is
  reported, nothing is adjusted.
- The *Chocolate Managed Account* pages (underlying funds) don't change the account balance
  and aren't exported.
- **QIF** per account: the same transactions, starting with an *Opening Balance* record (the
  balance just before the first entry). QIF has no currency field, so import each file into an
  account of that currency. Dates are `YYYY-MM-DD`; name → payee (`P`), notes → memo (`M`).
- **Accounts CSV**: `Account type,Name,Balance,Currency,Balance Date` per exported account,
  with the balance just before the first exported entry.
- **Combined CSV**: all accounts in one file with a leading `account` column (multi-account
  imports; names match the Accounts CSV).

Columns: `date,amount,currency,name,notes`, inflows positive, dates `YYYY-MM-DD`.

Both statement layouts are supported: the older single-account statements (titled "<Month> <Year>
Statement · SGD") and the newer ones with a section per currency account. The **Accounts**
panel lets you rename or exclude an account (saved in the browser).

## Development

- `src/layout.js`: pdf.js text fragments → positioned lines
- `src/parser.js`: statement parsing, accounts, reconciliation
- `src/export.js`: starting balances and CSV formats
- `src/app.js`, `src/index.template.html`: the UI
- `vendor/`: pdf.js 3.11.174 (`pdf.min.js`, `pdf.worker.min.js`)
- `python3 build.py`: rebuilds `index.html` (inlines everything). Commit the result: GitHub
  Pages serves `index.html` as-is, and the *Build check* workflow fails if it's out of date.

Tests need your own statement PDFs and write private output (extracted statement text,
CSVs, screenshots); keep those outside the repo or in `test/out/`, which is git-ignored.
`cd test && npm install`, then:
- `node extract.js <pdf dir> out.json`: positioned text from the PDFs (private)
- `node reconcile.js out.json`: no warnings; every account reconciles each month
- `CHROME=<chrome-headless-shell> node e2e.js <pdf dir> <out dir>`: drive the page, save the zips
- `DUMP=out.json CHROME=... node config-e2e.js <pdf dir> <out dir>`: drive the Accounts panel

## License

Apache License 2.0, see [LICENSE](LICENSE). Includes PDF.js (Mozilla Foundation,
Apache-2.0), see [NOTICE](NOTICE). Not affiliated with or endorsed by Chocolate Finance.
