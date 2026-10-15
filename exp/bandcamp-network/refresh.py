"""Refresh public release metadata; no login or audio downloads."""
import concurrent.futures, datetime, html, json, re, urllib.request
from pathlib import Path
BASE = 'https://guidewire.bandcamp.com'
def fetch(url):
    import subprocess
    return subprocess.check_output(['curl', '--fail', '--silent', '--show-error', '--location', '--max-time', '30', url], text=True)

def refresh():
    page = fetch(BASE + '/music')
    items = []
    for block in re.findall(r'<li data-item-id=.*?</li>', page, re.S):
        path = re.search(r'href="(/(?:album|track)/[^"]+)"', block)
        title = re.search(r'<p class="title">(.*?)</p>', block, re.S)
        art = re.search(r'(?:data-original|src)="(https://f\d.bcbits.com/img/[^"]+)"', block)
        if path and title and art:
            items.append({'title':html.unescape(title[1]).strip(), 'url':BASE + path[1], 'art':art[1]})
    if not items:
        raise RuntimeError('No releases found; existing snapshot preserved')
    def enrich(item):
        source = fetch(item['url'])
        metadata = re.search(r'<script type="application/ld\+json">(.*?)</script>', source, re.S)
        info = json.loads(metadata[1]) if metadata else {}
        raw_date = info.get('datePublished', '')
        from email.utils import parsedate_to_datetime
        item['date'] = parsedate_to_datetime(raw_date).date().isoformat() if raw_date else ''
        item['tags'] = list(dict.fromkeys(html.unescape(re.sub('<.*?>', '', t)).strip() for t in re.findall(r'<a[^>]*class="tag"[^>]*>(.*?)</a>', source, re.S)))
        return item
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        items = list(pool.map(enrich, items))
    output = {'artist':'Guidewire', 'source':BASE + '/music', 'fetched':datetime.date.today().isoformat(), 'releases':items}
    Path(__file__).with_name('collection.json').write_text(json.dumps(output, indent=2) + '\n')
    print(f'Saved {len(items)} public releases')
if __name__ == '__main__':
    refresh()
