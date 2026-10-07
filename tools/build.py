"""Dependency-free bundler for this project's deliberately flat ES-module graph."""
from pathlib import Path
import re
import shutil
root = Path(__file__).resolve().parent.parent
order = ['config', 'simulation', 'combat-data', 'riven-data', 'summoners', 'combat-core', 'modifiers', 'advanced-actions', 'returning-weapons', 'combat','match-data','crownfall-rules','match-bots','wilderness','match', 'camera', 'input', 'ability-input', 'combat-view', 'arena-art', 'character-visuals', 'character-renderer', 'renderer', 'ui', 'match-ui', 'hud-presentation', 'combat-feedback', 'control-layout', 'game-ux', 'main']
parts=[]
for name in order:
    source=(root/'src'/f'{name}.js').read_text()
    source=re.sub(r'^import .*?;\s*$', '', source, flags=re.M)
    source=re.sub(r'\bexport (?=const |class |function )','',source)
    parts.append('// '+name+'\n'+source)
html=(root/'index.html').read_text().replace('<link rel="stylesheet" href="style.css">','<style>\n'+(root/'style.css').read_text()+'\n</style>')
html=html.replace('<script type="module" src="src/main.js"></script>','<script>\n(()=>{\n'+ '\n'.join(parts)+'\n})();\n</script>')
(root/'dist').mkdir(exist_ok=True)
(root/'dist'/'index.html').write_text(html)
shutil.copytree(root/'assets', root/'dist'/'assets', dirs_exist_ok=True)
print('Built dist/index.html and approved menu artwork')