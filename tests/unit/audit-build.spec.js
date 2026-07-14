import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const auditScript = path.resolve('scripts/audit-build.mjs');

function runAudit(html, prepare) {
  const base = mkdtempSync(path.join(tmpdir(), 'portfolio-audit-'));
  const root = path.join(base, 'dist');
  mkdirSync(root);
  writeFileSync(path.join(root, 'index.html'), html);
  prepare?.(base);

  try {
    return spawnSync(process.execPath, [auditScript], {
      encoding: 'utf8',
      env: { ...process.env, AUDIT_DIR: root },
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

function runDefaultAudit(sourceDirectory) {
  const base = mkdtempSync(path.join(tmpdir(), 'portfolio-audit-default-'));
  for (const directory of ['dist', 'src', 'public']) mkdirSync(path.join(base, directory));
  writeFileSync(path.join(base, 'dist', 'index.html'), '<p>safe</p>');
  const sample = ['BEGIN ', 'RSA ', 'PRIVATE ', 'KEY'].join('');
  writeFileSync(path.join(base, sourceDirectory, sourceDirectory === 'src' ? 'sample.ts' : 'sample.svg'), sample);
  const env = { ...process.env };
  delete env.AUDIT_DIR;

  try {
    return spawnSync(process.execPath, [auditScript], { cwd: base, encoding: 'utf8', env });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

describe('build audit', () => {
  it('reports a broken root-relative link', () => {
    const result = runAudit('<a href="/missing/">broken</a>');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('broken link /missing/');
  });

  it('rejects a root-relative link that escapes the audit root', () => {
    const result = runAudit('<a href="/../outside.html">escape</a>', (base) => {
      writeFileSync(path.join(base, 'outside.html'), 'outside audit root');
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('invalid internal link /../outside.html');
  });

  it('ignores protocol-relative external links', () => {
    const result = runAudit('<a href="//cdn.example.test/app.css">external</a>');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Build audit passed: 1 HTML files checked.');
  });

  it.each([
    { name: 'numeric marker', sample: ['0423', '1613'].join('') },
    { name: 'home-directory path', sample: ['/Us', 'ers/example/file'].join('') },
    { name: 'key assignment', sample: ['API', '_KEY', ' = example'].join('') },
    { name: 'token prefix', sample: ['s', 'k', '-', 'example'].join('') },
    { name: 'private-key header', sample: ['BEGIN ', 'PRIVATE ', 'KEY'].join('') },
    { name: 'encrypted private-key header', sample: ['BEGIN ', 'ENCRYPTED ', 'PRIVATE ', 'KEY'].join('') },
    { name: 'DSA private-key header', sample: ['BEGIN ', 'DSA ', 'PRIVATE ', 'KEY'].join('') },
    { name: 'RSA private-key header', sample: ['BEGIN ', 'RSA ', 'PRIVATE ', 'KEY'].join('') },
    { name: 'OpenSSH private-key header', sample: ['BEGIN ', 'OPENSSH ', 'PRIVATE ', 'KEY'].join('') },
  ])('reports the $name sensitive category', ({ sample }) => {
    const result = runAudit('<p>' + sample + '</p>');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('sensitive match');
  });

  it('scans publishable non-HTML text assets for sensitive content', () => {
    const sample = ['BEGIN ', 'EC ', 'PRIVATE ', 'KEY'].join('');
    const result = runAudit('<p>safe</p>', (base) => {
      writeFileSync(path.join(base, 'dist', 'styles.css'), `/* ${sample} */`);
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('styles.css: sensitive match');
  });

  it.each(['src', 'public'])('scans %s text during a normal audit', (directory) => {
    const result = runDefaultAudit(directory);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(directory + '/sample.');
  });

  it('keeps AUDIT_DIR scans scoped to the controlled fixture', () => {
    const result = runAudit('<p>safe</p>', (base) => {
      mkdirSync(path.join(base, 'src'));
      const sample = ['BEGIN ', 'OPENSSH ', 'PRIVATE ', 'KEY'].join('');
      writeFileSync(path.join(base, 'src', 'sample.ts'), sample);
    });

    expect(result.status).toBe(0);
  });
});
