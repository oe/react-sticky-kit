#!/usr/bin/env tsx
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

function run(cmd: string, opts: Record<string, unknown> = {}) {
  try {
    return execSync(cmd, { stdio: 'inherit', ...opts });
  } catch (e: unknown) {
    console.error(`Error: Failed to run command "${cmd}"`, e);
    process.exit(1);
  }
}

function getPkgJson() {
  const pkgPath = path.resolve(__dirname, '../package.json');
  return {
    path: pkgPath,
    json: JSON.parse(fs.readFileSync(pkgPath, 'utf8')),
  };
}

function isGitClean() {
  try {
    const status = execSync('git status --porcelain').toString().trim();
    return status === '';
  } catch {
    return false;
  }
}

function bumpVersion(version: string, type: string) {
  const [major, minor, patch] = version.split('.').map(Number);
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

async function main() {
  if (!isGitClean()) {
    console.error('Error: Please commit or stash your changes before publishing.');
    process.exit(1);
  }

  const { path: pkgPath, json: pkg } = getPkgJson();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(res => rl.question(q, res));
  const type = (await ask('Select release type (patch/minor/major): ')).trim();
  if (!['patch', 'minor', 'major'].includes(type)) {
    console.error('Invalid release type.');
    process.exit(1);
  }
  const newVersion = bumpVersion(pkg.version, type);
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  rl.close();

  run('pnpm build');
  run('git add .');
  run(`git commit -m "chore: release v${newVersion}"`);
  run('git push');
  run('npm publish');
  run(`git tag v${newVersion}`);
  run('git push --tags');
  console.log(`\nRelease v${newVersion} published!`);
}

main();
