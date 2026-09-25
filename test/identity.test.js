import { expect, test } from 'bun:test';
import pkg from '../package.json';
import { checkPrereleaseVersion } from '../scripts/check-metadata.js';

test('the distribution identifies the fork and its runtime', () => {
  expect(pkg.name).toBe('@dkylepeppers-alt/story-toolkit');
  expect(pkg.engines.node).toBe('>=22');
  expect(JSON.stringify(pkg.repository)).toContain('dkylepeppers-alt/story-skills');
});

test('the product release is reserved and development uses prereleases', () => {
  expect(pkg.version).toMatch(/^1\.0\.0-.+/);
  expect(pkg.packageManager).toBe('bun@1.3.14');
  expect(checkPrereleaseVersion([], '1.0.0-rc.0')).toEqual([]);
  expect(checkPrereleaseVersion([], '1.0.0').join('\n')).toContain('1.0.0 prerelease');
});
