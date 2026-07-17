import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflowPath = new URL('../../.github/workflows/deploy.yml', import.meta.url);
const gitignorePath = new URL('../../.gitignore', import.meta.url);

describe('GitHub Pages deployment workflow', () => {
  it('uses the approved trigger, permissions, runtime, and action versions', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('pages: write');
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('actions/checkout@v7');
    expect(workflow).toContain('withastro/action@v6');
    expect(workflow).toContain('node-version: 24');
    expect(workflow).toContain('actions/deploy-pages@v5');
    expect(workflow).toContain('name: github-pages');
  });

  it('does not ignore nested portfolio asset directories', () => {
    const gitignore = readFileSync(gitignorePath, 'utf8');

    expect(gitignore).toContain('/work/');
    expect(gitignore).not.toMatch(/^work\/$/m);
  });
});
