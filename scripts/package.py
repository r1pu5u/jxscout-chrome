"""Build a deterministic, dependency-free unpacked-extension archive."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import json
root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'extension/manifest.json').read_text())
assert manifest['manifest_version'] == 3
out = root / 'dist'
out.mkdir(exist_ok=True)
path = out / 'jxscout-chrome.zip'
with ZipFile(path, 'w', ZIP_DEFLATED) as archive:
    for source in sorted((root / 'extension').iterdir()):
        if source.is_file():
            info = ZipInfo(source.name, (2026, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, source.read_bytes())
print(path)
