"""Download small CC0 photographic PBR sets ON GITHUB ACTIONS, never on the phone.
All successful sources and SHA256 digests are recorded for reproducibility.
No API keys or third-party trackers are used.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib, json, time, urllib.request, urllib.error

ROOT = Path('public/assets')
ROOT.mkdir(parents=True, exist_ok=True)
HEADERS = {'User-Agent': 'TingyuGarden/1.0 (CC0 educational architectural visualization)'}

def fetch(url, dest=None):
    if dest and dest.exists() and dest.stat().st_size > 1000:
        return dest.read_bytes()
    err = None
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=50) as r:
                data = r.read()
            if dest:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
            return data
        except Exception as e:
            err = e
            time.sleep(1 + i)
    raise err

SETS = {
    'wood': ['wood_floor_worn', 'dark_wood', 'wooden_planks'],
    'plaster': ['plastered_wall_02', 'plastered_wall_04', 'white_plaster_rough_01'],
    'stone': ['rock_boulder_dry', 'rock_face', 'aerial_rocks_02'],
    'earth': ['forest_ground_04', 'brown_mud_leaves_01', 'forest_ground_01'],
    'paving': ['slate_floor', 'slate_floor_02', 'stone_floor'],
    'bark': ['bark_willow', 'bark_brown_02', 'bark_brown_01'],
}

def material(item):
    alias, choices = item
    for asset in choices:
        try:
            files = json.loads(fetch(f'https://api.polyhaven.com/files/{asset}'))
            result = {'asset': asset, 'source': f'https://polyhaven.com/a/{asset}', 'license': 'CC0', 'maps': {}}
            for channel in ['diff', 'nor_gl', 'rough']:
                variations = files.get({'diff': 'Diffuse', 'rough': 'Rough'}.get(channel, channel), files.get(channel, {}))
                formats = variations.get('1k', variations.get('2k', {}))
                entry = formats.get('jpg') or formats.get('png')
                if not entry:
                    continue
                ext = 'jpg' if 'jpg' in formats else 'png'
                relative = f'materials/{alias}/{asset}/{channel}.{ext}'
                raw = fetch(entry['url'], ROOT / relative)
                result['maps'][channel] = {'file': relative, 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)}
            if 'diff' in result['maps']:
                print(f'PBR {alias}: {asset}, {len(result["maps"])} maps', flush=True)
                return alias, result
        except Exception as e:
            print(f'Fallback {alias}/{asset}: {type(e).__name__}', flush=True)
    print(f'NOTICE: {alias} uses authored procedural fallback', flush=True)
    return alias, {'procedural': True}

manifest = {'materials': dict(ThreadPoolExecutor(max_workers=3).map(material, SETS.items())), 'environment': None}
for hdri in ['misty_pines', 'kloofendal_48d_partly_cloudy_puresky']:
    try:
        files = json.loads(fetch(f'https://api.polyhaven.com/files/{hdri}'))
        entry = files['hdri']['1k']['hdr']
        raw = fetch(entry['url'], ROOT / 'environment.hdr')
        manifest['environment'] = {'asset': hdri, 'file': 'environment.hdr', 'source': f'https://polyhaven.com/a/{hdri}', 'license': 'CC0', 'sha256': hashlib.sha256(raw).hexdigest()}
        print(f'ENV {hdri}: {len(raw)} bytes', flush=True)
        break
    except Exception as e:
        print(f'Environment fallback: {type(e).__name__}', flush=True)
(ROOT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
print('Manifest written. Photographic sets:', sum('maps' in m for m in manifest['materials'].values()))
