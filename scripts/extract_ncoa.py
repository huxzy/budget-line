#!/usr/bin/env python3
"""
Generalised extractor for Nigerian state budget PDFs in NCoA layout.

Unlike the Niger-specific version, column boundaries are DETECTED from each
page's header row rather than hardcoded, and amount columns are found by
clustering the right edges of numeric tokens. That makes it portable across
states whose tables sit at different x positions.

Usage:
    python extract_ncoa.py --config states.config.json --state niger
    python extract_ncoa.py --config states.config.json --all
"""

import re, json, argparse, collections, sys
from pathlib import Path

import pandas as pd
import pdfplumber

NUM = re.compile(r'^-?[\d,]+\.\d{2}$')
DASH = {'-', '–', ''}

# Header labels that mark the text columns of an NCoA capital-project table.
HEADER_KEYS = [
    ('project',  ['Project Name', 'Project Description', 'Project']),
    ('mda',      ['Administrative Code', 'Administrative']),
    ('economic', ['Economic Code', 'Economic']),
    ('function', ['Function Code', 'Function']),
    ('program',  ['Programme Code', 'Programme']),
    ('location', ['Location Code', 'Location']),
]


def line_groups(page, tol=1.5):
    """Group chars into visual lines by exact top, merging within tol points.

    Exact-top grouping matters: wrapped cell text is rendered as a separate
    run at a slightly different top, and coarse bucketing merges two rows'
    text into one garbled line.
    """
    buckets = collections.defaultdict(list)
    for c in page.chars:
        buckets[round(c['top'] * 2) / 2].append(c)
    merged = []
    for k in sorted(buckets):
        if merged and k - merged[-1][0] <= tol:
            merged[-1][1].extend(buckets[k])
        else:
            merged.append([k, list(buckets[k])])
    return merged


def text_at(chars, lo, hi):
    cs = sorted([c for c in chars if lo <= c['x0'] < hi], key=lambda c: c['x0'])
    return re.sub(r'\s+', ' ', ''.join(c['text'] for c in cs)).strip()


def split_runs(chars):
    """Split a line's chars (stream order) into the strings they were drawn as.

    Within one string consecutive glyphs (spaces included) touch; a new string
    starts with a jump in x, forward or back.
    """
    runs, cur = [], []
    for c in chars:
        if cur and abs(c['x0'] - cur[-1]['x1']) > 1.5:
            runs.append(cur)
            cur = []
        cur.append(c)
    if cur:
        runs.append(cur)
    return runs


def numeric_runs(chars):
    """Amount tokens read as runs, for cell_mode="runs" documents.

    When a text cell overflows into the amount columns, extract_words fuses
    the figure's digits with the text's glyphs and the number is lost. Each
    figure is one contiguous string in the stream, so read it as a run.
    """
    out = []
    for run in split_runs(chars):
        t = ''.join(c['text'] for c in run).replace(' ', '')
        if NUM.match(t) or t in DASH - {''}:
            out.append({'text': t, 'x1': run[-1]['x1'], 'top': run[0]['top']})
    return out


def cells_by_runs(chars, cols):
    """Per-state option cell_mode="runs": read cells from content-stream order.

    Some Excel-to-PDF pipelines let a long cell overflow into the next column,
    so slicing by x interleaves two cells' glyphs ("GovernAacnqcuei s-i tGioenn").
    The stream still emits each cell contiguously and its glyphs touch, so split
    the line into runs wherever x jumps and give each run to the column it
    starts in.
    """
    out = {name: [] for _, _, name in cols}
    runs = split_runs(chars)
    def home_of(run):
        x = run[0]['x0']
        home = None
        for lo, hi, name in cols:
            if lo <= x:
                home = name
        return home

    # An overflowing cell can end exactly where the next cell begins, so the
    # two arrive as one run. If a column has no run of its own, split any run
    # crossing that column's start at the glyph sitting on it.
    starts = {name: lo + 6 for lo, _, name in cols}  # detect_text_columns pads lo by 6
    for name, start in starts.items():
        if any(home_of(r) == name for r in runs):
            continue
        for k, run in enumerate(runs):
            if run[0]['x0'] < start - 4 and run[-1]['x1'] > start + 4:
                j = min(range(len(run)), key=lambda q: abs(run[q]['x0'] - start))
                if j > 0 and abs(run[j]['x0'] - start) <= 1.6:
                    runs[k:k + 1] = [run[:j], run[j:]]
                break

    for run in runs:
        home = home_of(run)
        if home is None:
            continue
        out[home].append(''.join(c['text'] for c in run))
    return {n: re.sub(r'\s+', ' ', ' '.join(v)).strip() for n, v in out.items()}


def detect_amount_columns(page, n_expected, min_x=0):
    """Find amount columns by clustering the RIGHT edges of numeric tokens.

    Figures are right-aligned, so their right edges cluster tightly while
    their left edges vary with digit count.
    """
    edges = []
    for w in page.extract_words():
        if w['x0'] < min_x:
            continue
        t = w['text'].replace(' ', '')
        if NUM.match(t) or t in DASH:
            edges.append(w['x1'])
    if not edges:
        return []
    edges.sort()
    clusters, cur = [], [edges[0]]
    for e in edges[1:]:
        if e - cur[-1] <= 12:
            cur.append(e)
        else:
            clusters.append(cur)
            cur = [e]
    clusters.append(cur)
    # amounts sit at the right of the table: keep the rightmost n_expected
    # clusters that have real density, then order them left to right
    clusters = [c for c in clusters if len(c) >= 3] or clusters
    clusters.sort(key=lambda c: sum(c) / len(c))
    keep = clusters[-n_expected:]
    return [sum(c) / len(c) for c in keep]


def detect_text_columns(page):
    """Read column starts off the header row. Returns [(lo, hi, name), ...].

    Header labels are matched against the CHARACTER stream, not extract_words:
    these PDFs often render header text letter-spaced ("L o c a t i o n"), so
    no word ever equals "Location" and word matching silently misses columns.
    """
    for top, chars in line_groups(page):
        flat = ''.join(c['text'] for c in sorted(chars, key=lambda c: c['x0']))
        squashed = flat.replace(' ', '').lower()
        # must be the real header row, not the page title which also ends
        # with "... Capital Expenditure by Project"
        if not ('projectname' in squashed or 'projectdescription' in squashed):
            continue
        if 'capitalexpenditureby' in squashed:
            continue
        # The header straddles two or three baselines. Scan each baseline on
        # its own: merging them and sorting by x interleaves the characters
        # of stacked cells ("Location" + "Description" -> "LDoecsactriiopn").
        baselines = [(t, cs) for t, cs in line_groups(page)
                     if abs(t - top) <= 6]
        found, taken = [], set()
        for _, cs in baselines:
            row = sorted([c for c in cs if c['text'].strip()],
                         key=lambda c: c['x0'])
            text = ''.join(c['text'] for c in row)
            xs = [c['x0'] for c in row]
            low = text.lower()
            for name, labels in HEADER_KEYS:
                if name in taken:
                    continue
                for label in labels:
                    key = label.split()[0].lower()
                    i = low.find(key)
                    if i != -1 and i < len(xs):
                        found.append((xs[i], name))
                        taken.add(name)
                        break
        # de-duplicate on x, keep leftmost name per position
        seen, uniq = set(), []
        for x, name in sorted(found):
            if name in seen:
                continue
            seen.add(name)
            uniq.append((x, name))
        if len(uniq) >= 2:
            cols = []
            for i, (x, name) in enumerate(uniq):
                hi = uniq[i + 1][0] - 2 if i + 1 < len(uniq) else x + 400
                cols.append((x - 6, hi, name))
            return cols
    return None


def parse_pages(spec):
    """Accepts "326-335,338-347,349" or [68, 101]; returns 0-based indices."""
    if isinstance(spec, (list, tuple)):
        if len(spec) == 2 and all(isinstance(x, int) for x in spec):
            return list(range(spec[0] - 1, spec[1]))
        spec = ','.join(str(x) for x in spec)
    out = []
    for part in str(spec).split(','):
        part = part.strip()
        if not part:
            continue
        if '-' in part:
            a, b = part.split('-')
            out.extend(range(int(a) - 1, int(b)))
        else:
            out.append(int(part) - 1)
    return sorted(set(out))


def find_section(pdf, cfg):
    """Pages of the capital-project table: config first, else detect."""
    if cfg.get('pages'):
        pp = parse_pages(cfg['pages'])
        return pp[0], pp[-1]
    start = end = None
    marker = cfg.get('section_marker', 'Capital Expenditure by Project')
    for i, p in enumerate(pdf.pages):
        head = (p.extract_text() or '').split('\n')[0]
        if start is None:
            if marker in head:
                start = i
        elif marker not in head and 'Approved Budget -' in head:
            end = i - 1
            break
    if start is None:
        return None, None
    return start, (end if end is not None else len(pdf.pages) - 1)


def parse_amount(v):
    v = v.replace(' ', '')
    if v in DASH:
        return 0.0
    try:
        return float(v.replace(',', ''))
    except ValueError:
        return None


def extract(pdf_path, cfg):
    amount_names = cfg['amount_columns']
    rows, skipped = [], 0

    with pdfplumber.open(pdf_path) as pdf:
        start, end = find_section(pdf, cfg)
        if start is None:
            raise SystemExit(f"{cfg['slug']}: capital-project section not found")
        print(f"  section pages {start + 1}-{end + 1}")

        page_list = (parse_pages(cfg['pages']) if cfg.get('pages')
                     else list(range(start, end + 1)))

        mda_current = None  # for mda_from_headings: carries across page breaks
        text_cols = None
        for i in page_list[:6]:
            text_cols = detect_text_columns(pdf.pages[i])
            if text_cols:
                print("  columns: " + ", ".join(
                    f"{n}@{int(lo)}" for lo, _, n in text_cols))
                break
        if not text_cols:
            raise SystemExit(f"{cfg['slug']}: could not read a header row")

        for i in page_list:
            page = pdf.pages[i]
            if cfg.get('clip_to_page'):
                # Per-state option: some documents place one huge sheet across
                # pages, so each page's content stream carries rows that render
                # outside its box (and again on the neighbouring pages). Only
                # what is inside the page box is on that page.
                page = page.crop((0, 0, page.width, page.height), strict=False)
            centres = detect_amount_columns(page, len(amount_names))
            if not centres:
                skipped += 1
                continue
            text_end = min(centres) - 55
            if len(centres) < len(amount_names):
                skipped += 1
                continue

            groups = line_groups(page)
            tops = [g[0] for g in groups]
            runs_mode = cfg.get('cell_mode') == 'runs'
            heading_mda = cfg.get('mda_from_headings', False)

            # Assign every numeric word to exactly ONE line (its nearest top)
            # and to one column (nearest right edge). Assigning by range would
            # truncate wide right-aligned figures; assigning by tolerance would
            # let one figure be claimed by two adjacent lines.
            per_line = collections.defaultdict(dict)
            if runs_mode:
                tokens = [tok for _, chars in groups for tok in numeric_runs(chars)]
            else:
                tokens = page.extract_words()
            for w in tokens:
                t = w['text'].replace(' ', '')
                if not (NUM.match(t) or t in DASH - {''}):
                    continue
                if w['x1'] < text_end:
                    continue
                top = min(tops, key=lambda tp: abs(tp - w['top']))
                col = min(range(len(centres)), key=lambda k: abs(centres[k] - w['x1']))
                per_line[top][col] = t

            lines = []
            for top, chars in groups:
                amts = per_line.get(top, {})
                body = [c for c in chars if c['x0'] < text_end]
                if runs_mode:
                    fields = cells_by_runs(body, text_cols)
                else:
                    fields = {n: text_at(chars, lo, min(hi, text_end))
                              for lo, hi, n in text_cols}
                lines.append({'top': top, 'amts': amts, 'f': fields,
                              'raw': text_at(body, -1e9, 1e9)})

            # Per-state option mda_from_headings: the administrative unit is a
            # heading line ("011100100100 OFFICE OF THE EXECUTIVE GOVERNOR")
            # above its projects rather than a column. Carry it forward and
            # keep the heading out of the wrapped-text pass.
            if heading_mda:
                for l in lines:
                    m = re.match(r'^(\d{12})\s*(\S.*)$', l['raw'])
                    if not l['amts'] and m:
                        mda_current = f"{m.group(1)} - {m.group(2).strip()}"
                        l['heading'] = True
                    l['mda_heading'] = mda_current

            anchors = [n for n, l in enumerate(lines) if l['amts']]
            if not anchors:
                continue

            # Wrapped text belongs to whichever row it sits closest to.
            extra = collections.defaultdict(list)
            for n, l in enumerate(lines):
                if l['amts'] or not any(l['f'].values()) or l.get('heading'):
                    continue
                txt = ' '.join(v for v in l['f'].values() if v)
                if any(k in txt for k in ('Project Name', 'Project Description',
                                          'Code and', 'Approved Budget')):
                    continue
                near = min(anchors, key=lambda a: abs(lines[a]['top'] - l['top']))
                extra[near].append((l['top'], l['f']))

            for a in anchors:
                l = lines[a]
                parts = sorted(extra[a] + [(l['top'], l['f'])], key=lambda t: t[0])
                rec = {}
                for _, _, name in text_cols:
                    rec[name] = re.sub(r'\s+', ' ', ' '.join(
                        p[1][name] for p in parts if p[1].get(name)).strip())
                if heading_mda and l.get('mda_heading'):
                    rec['mda'] = l['mda_heading']
                if not rec.get('project'):
                    continue
                # Narrow totals filter only: a real project can legitimately
                # begin with "Total" ("Total renovation of the deputy
                # governor's office"), so never match on the prefix alone.
                low = rec['project'].lower().strip(' .')
                cells = {rec[n].lower().strip(' .') for _, _, n in text_cols if rec.get(n)}
                if 'total capital expenditure' in low or (cells & {
                        'total', 'grand total', 'subtotal', 'sub total'}):
                    continue
                for k, name in enumerate(amount_names):
                    rec[name] = parse_amount(l['amts'].get(k, '-'))
                rec['source_page'] = i + 1
                rec['page_y_top'] = round(l['top'] / float(page.height), 5)
                rec['page_y_bottom'] = round(
                    (l['top'] + 11) / float(page.height), 5)
                rows.append(rec)

    if skipped:
        print(f"  note: {skipped} pages had no readable amount grid")
    return pd.DataFrame(rows)


def split_codes(df):
    for col, width in (('mda', 12), ('economic', 8), ('function', 5),
                       ('location', 8), ('program', 14)):
        if col not in df.columns:
            continue
        flat = df[col].fillna('').map(lambda s: re.sub(r'\s', '', str(s)))
        df[f'{col}_code'] = flat.str.extract(rf'(\d{{{width}}})', expand=False).fillna('')
        df[f'{col}_name'] = df[col].fillna('').map(
            lambda s: re.sub(r'^\s*[\d\s]+-\s*', '', str(s)).strip())
        df.drop(columns=[col], inplace=True)
    return df


def inspect(pdf_path, cfg):
    """Report what the detector sees, so amount_columns can be set correctly.

    Column COUNT varies by state (some carry 2024 actuals, some carry climate
    tagging columns), so it must be confirmed per state rather than assumed.
    """
    with pdfplumber.open(pdf_path) as pdf:
        start, end = find_section(pdf, cfg)
        if start is None:
            print("  section not found")
            return
        pages = (parse_pages(cfg['pages']) if cfg.get('pages')
                 else list(range(start, end + 1)))
        print(f"  pages: {len(pages)} (first {pages[0]+1}, last {pages[-1]+1})")
        for i in pages[:3]:
            page = pdf.pages[i]
            cols = detect_text_columns(page)
            edges = detect_amount_columns(page, 12)
            print(f"  p{i+1}: text columns = "
                  + (", ".join(n for _, _, n in cols) if cols else "NONE"))
            print(f"       numeric column right-edges = "
                  + ", ".join(f"{e:.0f}" for e in edges))
            head = (page.extract_text() or "").split("\n")
            for line in head[:4]:
                print(f"       | {line[:110]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--config', default='states.config.json')
    ap.add_argument('--state')
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--docs', default='.')
    ap.add_argument('--out', default='out')
    ap.add_argument('--inspect', action='store_true',
                    help='report detected columns without extracting')
    args = ap.parse_args()

    cfg_all = json.load(open(args.config))
    targets = cfg_all if args.all else [c for c in cfg_all if c['slug'] == args.state]
    if not targets:
        raise SystemExit(f"no config entry for {args.state}")

    Path(args.out).mkdir(parents=True, exist_ok=True)
    report = []

    for cfg in targets:
        if cfg.get('skip'):
            print(f"\n{cfg['slug']}: skipped ({cfg.get('skip')})")
            continue
        path = Path(args.docs) / cfg['file']
        if not path.exists():
            print(f"\n{cfg['slug']}: file not found at {path}")
            continue

        print(f"\n{cfg['slug']} — {path.name}")
        if args.inspect:
            inspect(path, cfg)
            continue
        try:
            df = extract(path, cfg)
        except SystemExit as e:
            print(f"  FAILED: {e}")
            report.append((cfg['slug'], 0, None, 'extraction failed'))
            continue

        df = split_codes(df)
        if 'mda_code' in df:
            df['mda_code'] = df['mda_code'].replace('', pd.NA).ffill()
            df['mda_name'] = df['mda_name'].replace('', pd.NA).ffill()
        df = df.fillna('')

        key = cfg['reconcile_column']
        total = pd.to_numeric(df[key], errors='coerce').fillna(0).sum()
        official = cfg.get('official_total')
        status = 'no official total supplied'
        if official:
            diff = total - official
            status = 'OK' if abs(diff) <= 1 else f'MISMATCH by {diff:,.2f}'
            print(f"  rows {len(df):,} | {key} {total:,.2f} vs official "
                  f"{official:,.2f} → {status}")
        else:
            print(f"  rows {len(df):,} | {key} {total:,.2f} ({status})")

        out = Path(args.out) / f"{cfg['slug']}-{cfg['year']}-capital.csv"
        df.to_csv(out, index=False)
        print(f"  wrote {out}")
        report.append((cfg['slug'], len(df), total, status))

    print("\n" + "=" * 72)
    for slug, n, total, status in report:
        t = f"{total:,.2f}" if total else "-"
        print(f"{slug:<14} {n:>7,} rows  {t:>22}  {status}")


if __name__ == '__main__':
    main()
