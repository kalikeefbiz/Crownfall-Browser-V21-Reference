import {withoutControlledFeel} from './controlled-feel-seams.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const seams = JSON.parse(fs.readFileSync(new URL('./m92-presentation-seams.json', import.meta.url)));
// Undo ONLY exact reviewed presentation edits. Any additional edit still fails the
// original historical byte-for-byte protection assertions.
export function withoutM92Presentation(source, file) {
 source=withoutControlledFeel(source,file);
  for (const [before, after] of [...(seams['src/' + file + '.js'] || [])].reverse()) {
    assert.equal(source.split(after).length - 1, 1, 'Exact M9.2 seam: ' + file);
    source = source.replace(after, before);
  }
  return source;
}