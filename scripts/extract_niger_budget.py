import os, re, json, collections, pandas as pd, pdfplumber

PDF = os.environ.get('PDF', '/mnt/user-data/uploads/dataset_NIGER_STATE_APPROVED_BUDGET_FOR_THE_YEAR_2026.pdf')
LOOKUP = os.environ.get('LOOKUP', '/home/claude/lookup.json')
OUT = os.environ.get('OUT', '/home/claude/v3.csv')
NUM = re.compile(r'^-?[\d,]+\.\d{2}$')
lookup = json.load(open(LOOKUP))

COLS = [(45,170,'project'),(170,260,'mda'),(260,350,'economic'),(350,430,'function'),(430,487,'location')]
AMTS = [(487,545,'amt_2024_actual'),(545,597,'amt_2025_revised'),
        (597,646,'amt_2025_perf_jan_sep'),(646,780,'amt_2026_approved')]

def cell(chars, lo, hi):
    cs = sorted([c for c in chars if lo <= c['x0'] < hi], key=lambda c: c['x0'])
    return re.sub(r'\s+', ' ', ''.join(c['text'] for c in cs)).strip()

def parse(v):
    v = v.replace(' ', '')
    if v in ('-', ''): return 0.0
    try: return float(v.replace(',', ''))
    except: return None

rows = []
with pdfplumber.open(PDF) as pdf:
    start = end = None
    for i, p in enumerate(pdf.pages):
        head = (p.extract_text() or '').split('\n')[0]
        if start is None:
            if 'Capital Expenditure by Project' in head and 'Basic Education' not in head:
                start = i
        elif 'Niger State Government 2026 Approved Budget -' in head and 'Capital Expenditure by Project' not in head:
            end = i - 1; break
    if end is None: end = len(pdf.pages) - 1

    for i in range(start, end+1):
        page = pdf.pages[i]
        groups = collections.defaultdict(list)
        for c in page.chars:
            groups[round(c['top'] * 2) / 2].append(c)
        merged = []
        for k in sorted(groups):
            if merged and k - merged[-1][0] <= 1.5:
                merged[-1][1].extend(groups[k])
            else:
                merged.append([k, list(groups[k])])

        # classify every line on the page first
        lines = []
        for top, chars in merged:
            vals = {n: cell(chars, lo, hi) for lo, hi, n in AMTS}
            money = any(v and (NUM.match(v.replace(' ','')) or v.strip() == '-') for v in vals.values())
            fields = {n: cell(chars, lo, hi) for lo, hi, n in COLS}
            bottom = max(c['bottom'] for c in chars)
            lines.append({'top': top, 'bottom': bottom, 'money': money, 'vals': vals, 'f': fields})

        anchors = [n for n, l in enumerate(lines) if l['money']]
        if not anchors: continue

        # assign each non-anchor line to its VERTICALLY NEAREST anchor
        extra = collections.defaultdict(list)
        for n, l in enumerate(lines):
            if l['money']: continue
            if not any(l['f'].values()): continue
            if 'Project Name' in l['f'].get('project','') or 'Code and' in l['f'].get('economic',''): continue
            if 'Approved Budget -' in l['f'].get('project',''): continue
            nearest = min(anchors, key=lambda a: abs(lines[a]['top'] - l['top']))
            extra[nearest].append((l['top'], l['f'], l['bottom']))

        for a in anchors:
            l = lines[a]
            parts = sorted(extra[a] + [(l['top'], l['f'], l['bottom'])], key=lambda t: t[0])
            rec = {}
            for k in ('project','mda','economic','function','location'):
                rec[k] = re.sub(r'\s+', ' ', ' '.join(p[1][k] for p in parts if p[1][k]).strip())
            if 'total capital expenditure' in rec['project'].lower(): continue
            for n in l['vals']: rec[n] = parse(l['vals'][n])
            rec['source_page'] = i + 1
            # Vertical extent of the row on its page, as fractions of page
            # height (0 = top), so the source viewer can draw a highlight band
            # at any render size.
            rec['page_y_top'] = round(min(p[0] for p in parts) / page.height, 4)
            rec['page_y_bottom'] = round(max(p[2] for p in parts) / page.height, 4)
            rows.append(rec)

df = pd.DataFrame(rows)

def codeof(s, w):
    m = re.search(r'\d{%d}' % w, re.sub(r'\s', '', str(s)))
    return m.group(0) if m else ''

for col, (cc, dc, w) in {'mda':('mda_code','mda_name',12), 'economic':('econ_code','econ_name',8),
                         'function':('func_code','func_name',5), 'location':('lga_code','lga_name',8)}.items():
    df[cc] = df[col].apply(lambda s: codeof(s, w))
    inline = df[col].apply(lambda s: re.sub(r'^\s*[\d\s]+-\s*', '', str(s)).strip())
    df[dc] = [lookup.get(c, '') or v for c, v in zip(df[cc], inline)]

df['project'] = df['project'].str.replace(r'\s+', ' ', regex=True).str.strip()
df = df[['project','mda_code','mda_name','lga_code','lga_name','econ_code','econ_name','func_code','func_name',
         'amt_2024_actual','amt_2025_revised','amt_2025_perf_jan_sep','amt_2026_approved','source_page',
         'page_y_top','page_y_bottom']]
df['mda_code'] = df['mda_code'].replace('', pd.NA).ffill()
df['mda_name'] = df['mda_name'].replace('', pd.NA).ffill()
df = df.fillna('')

df.to_csv(OUT, index=False)
print('rows:', len(df))
print('2026 sum: {:,.2f}  official: 783,694,704,491.00'.format(df.amt_2026_approved.sum()))
bleed = df.project.str.match(r'^(services|the state|e\.t\.c\.|and |of |in |for )', case=False, na=False)
print('leading-fragment names:', int(bleed.sum()))
print()
print(df[(df.lga_name=='BIDA') & df.func_name.str.contains('HEALTH|HOSPITAL',na=False)][['project','amt_2026_approved','source_page']].to_string())
