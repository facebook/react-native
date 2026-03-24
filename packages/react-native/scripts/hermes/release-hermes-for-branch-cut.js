#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {
  updateHermesCompilerVersionInDependencies,
  updateHermesRuntimeDependenciesVersions,
} = require('../../../../scripts/releases/utils/hermes-utils');
const {setHermesTag} = require('./hermes-utils');
const {execSync} = require('child_process');
const fs = require('fs');
// $FlowFixMe[untyped-import]
const inquirer = require('inquirer');
const os = require('os');
const path = require('path');
const {exit} = require('shelljs');
const yargs = require('yargs');

const argv = yargs
  .option('dry-run', {
    alias: 'd',
    describe:
      'Run without making external changes (no branch creation, no workflow triggers, no PRs)',
    type: 'boolean',
    default: false,
  })
  .help().argv;

// $FlowFixMe[prop-missing]
const DRY_RUN = argv['dry-run'];

const HERMES_REPO_PATH = path.join(os.homedir(), 'git', 'hermes');
const HERMES_LEGACY_BRANCH = 'main';
const HERMES_LEGACY_LABEL = 'Hermes Legacy';
const HERMES_V1_BRANCH = '250829098.0.0-stable';
const HERMES_V1_LABEL = 'Hermes V1';
const RN_REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

async function releaseHermesForBranchCut() /*: Promise<void> */ {
  if (DRY_RUN) {
    console.log('🏃 DRY RUN MODE - No external changes will be made\n');
  }

  // Step 1: Validate environment
  if (!isGhInstalled()) {
    console.error(
      '❌ Error: GitHub CLI (gh) is not installed. Please install it first: https://cli.github.com/',
    );
    exit(1);
  }

  const rnBranch = getCurrentBranch(RN_REPO_ROOT);

  if (!rnBranch.endsWith('-stable')) {
    console.error(
      `❌ Error: Must be on a stable branch (e.g., 0.79-stable). Current branch: ${rnBranch}`,
    );
    exit(1);
  }

  if (hasUncommittedChanges(RN_REPO_ROOT)) {
    console.error(
      '❌ Error: You have uncommitted changes in the React Native repo. Please commit or stash them first.',
    );
    exit(1);
  }

  const {confirmStart} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmStart',
    message: `You are about to release Hermes for branch "${rnBranch}". Continue?`,
  });

  if (!confirmStart) {
    console.log('Aborting.');
    exit(0);
  }

  console.log('\n🚀 Starting Hermes branch cut workflow...\n');
  console.log(`📍 Current RN branch: ${rnBranch}`);

  // Step 2: Setup Hermes repo
  await ensureHermesRepo();

  if (hasUncommittedChanges(HERMES_REPO_PATH)) {
    console.error(
      '❌ Error: You have uncommitted changes in the Hermes repo. Please commit or stash them first.',
    );
    exit(1);
  }

  // Step 3: Get versions from Hermes
  console.log('\n📥 Fetching Hermes versions...');

  const legacyHermesVersion = fetchHermesVersion(
    HERMES_LEGACY_BRANCH,
    HERMES_LEGACY_LABEL,
  );
  const v1HermesVersion = fetchHermesVersion(HERMES_V1_BRANCH, HERMES_V1_LABEL);

  console.log('');
  const {confirmVersions} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmVersions',
    message: `Double-check the Hermes versions above. Do you want to proceed?`,
  });

  if (!confirmVersions) {
    console.log('Aborting.');
    exit(0);
  }

  // Step 4: Create release branch in Hermes
  const releaseBranch = `release-v${legacyHermesVersion}`;
  console.log('\n🌿 Creating release branch for legacy Hermes...');
  execInRepo(`git checkout ${HERMES_LEGACY_BRANCH}`, HERMES_REPO_PATH, {
    silent: true,
  });

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create and push branch: ${releaseBranch}`);
  } else {
    execInRepo(`git checkout -b ${releaseBranch}`, HERMES_REPO_PATH);
    execInRepo(`git push -u origin ${releaseBranch}`, HERMES_REPO_PATH);
    console.log(`✅ Created and pushed branch: ${releaseBranch}`);
  }

  // Step 5: Trigger GitHub workflows
  console.log('\n🔄 Triggering GitHub workflows...');

  const legacyWorkflowUrl = `https://github.com/facebook/hermes/actions/workflows/rn-build-hermes.yml?query=branch%3A${releaseBranch}`;
  const v1WorkflowUrl = `https://github.com/facebook/hermes/actions/workflows/rn-build-hermes.yml?query=branch%3A${HERMES_V1_BRANCH}`;

  if (DRY_RUN) {
    console.log(
      `  [DRY RUN] Would trigger workflow for ${releaseBranch} with release_type=Release`,
    );
    console.log(
      `  [DRY RUN] Would trigger workflow for ${HERMES_V1_BRANCH} with release_type=Release`,
    );
  } else {
    console.log(`  Triggering workflow for ${releaseBranch}...`);
    execSync(
      `gh workflow run rn-build-hermes.yml -R facebook/hermes -f branch=${releaseBranch} -f release_type=Release`,
      {stdio: 'inherit'},
    );
    console.log(`    → ${legacyWorkflowUrl}`);

    console.log(`  Triggering workflow for ${HERMES_V1_BRANCH}...`);
    execSync(
      `gh workflow run rn-build-hermes.yml -R facebook/hermes -f branch=${HERMES_V1_BRANCH} -f release_type=Release`,
      {stdio: 'inherit'},
    );
    console.log(`    → ${v1WorkflowUrl}`);

    console.log('✅ Workflows triggered successfully.');
  }

  // Step 6: Update RN repo and create commit
  console.log('\n⬆️ Bump Hermes version in RN release branch...');

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would set Hermes tags:`);
    console.log(`    - .hermesversion: ${releaseBranch}`);
    console.log(`    - .hermesv1version: ${HERMES_V1_BRANCH}`);
    console.log(
      `  [DRY RUN] Would update hermes-compiler dependency to ${v1HermesVersion}`,
    );
    console.log(`  [DRY RUN] Would update version.properties:`);
    console.log(`    - HERMES_VERSION_NAME: ${legacyHermesVersion}`);
    console.log(`    - HERMES_V1_VERSION_NAME: ${v1HermesVersion}`);
    console.log('  [DRY RUN] Would create commit: "Bump hermes version"');
  } else {
    await setHermesTag(releaseBranch, HERMES_V1_BRANCH);
    await updateHermesCompilerVersionInDependencies(v1HermesVersion);
    await updateHermesRuntimeDependenciesVersions(
      legacyHermesVersion,
      v1HermesVersion,
    );
    execInRepo('git add .', RN_REPO_ROOT);
    execInRepo('git commit -m "Bump hermes version"', RN_REPO_ROOT);
    console.log('✅ Commit created (not pushed yet).');
  }

  // Step 7: Bump Hermes versions for next release (PRs)
  const newLegacyVersion = createHermesBumpPR({
    currentVersion: legacyHermesVersion,
    baseBranch: HERMES_LEGACY_BRANCH,
    bumpVersion: bumpMinorVersion,
    label: HERMES_LEGACY_LABEL,
    rnBranch,
  });

  const newV1Version = createHermesBumpPR({
    currentVersion: v1HermesVersion,
    baseBranch: HERMES_V1_BRANCH,
    bumpVersion: bumpPatchVersion,
    label: HERMES_V1_LABEL,
    rnBranch,
  });

  // Step 9: Bump RN main (PR)
  console.log('\n📝 Creating PR to bump Hermes V1 version on RN main...');
  const rnBumpBranch = `bump-hermes-v1-${newV1Version}`;

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create branch ${rnBumpBranch} on RN main`);
    console.log(
      `  [DRY RUN] Would update HERMES_V1_VERSION_NAME to ${newV1Version}`,
    );
    console.log(
      `  [DRY RUN] Would create PR: "Bump hermes version for RN release ${rnBranch}" → main`,
    );
  } else {
    execInRepo('git checkout main', RN_REPO_ROOT, {silent: true});
    execInRepo('git pull', RN_REPO_ROOT, {silent: true});
    execInRepo(`git checkout -b ${rnBumpBranch}`, RN_REPO_ROOT, {silent: true});

    const versionPropertiesPath = path.join(
      RN_REPO_ROOT,
      'packages',
      'react-native',
      'sdks',
      'hermes-engine',
      'version.properties',
    );
    updateVersionProperties(
      versionPropertiesPath,
      'HERMES_V1_VERSION_NAME',
      newV1Version,
    );
    execInRepo(
      'git add packages/react-native/sdks/hermes-engine/version.properties',
      RN_REPO_ROOT,
    );
    execInRepo(
      `git commit -m "Bump hermes v1 version to ${newV1Version}"`,
      RN_REPO_ROOT,
    );
    execInRepo(`git push -u origin ${rnBumpBranch}`, RN_REPO_ROOT);
    execSync(
      `gh pr create --title "Bump hermes version for RN release ${rnBranch}" --body "Bumps HERMES_V1_VERSION_NAME to ${newV1Version} for the next release." --base main`,
      {stdio: 'inherit', cwd: RN_REPO_ROOT},
    );
    console.log(`✅ Created PR for RN main Hermes V1 bump (${newV1Version})`);
  }

  // Step 10: Return to stable branch and show summary
  if (!DRY_RUN) {
    execInRepo(`git checkout ${rnBranch}`, RN_REPO_ROOT, {silent: true});
  }

  if (DRY_RUN) {
    console.log(`
✅ Dry run completed! Here's what would happen:

1. Create release branch: ${releaseBranch}
2. Trigger workflows on ${releaseBranch} and ${HERMES_V1_BRANCH}
3. Update RN repo with Hermes versions and create commit
4. Create PR to bump Hermes legacy to ${newLegacyVersion}
5. Create PR to bump Hermes V1 to ${newV1Version}
6. Create PR to bump RN main HERMES_V1_VERSION_NAME to ${newV1Version}

Workflow URLs (when created):
  • Legacy Hermes: ${legacyWorkflowUrl}
  • Hermes V1: ${v1WorkflowUrl}

⚠️  IMPORTANT: Do NOT push the RN release branch until the workflows complete.
`);
  } else {
    console.log(`
✅ Branch cut workflow completed!

Monitor the workflows here:
  • Legacy Hermes: ${legacyWorkflowUrl}
  • Hermes V1: ${v1WorkflowUrl}

⚠️  IMPORTANT: Do NOT push the RN release branch until the workflows complete.
`);
  }
}

// Helper functions

function createHermesBumpPR(
  params /*: {
  currentVersion: string,
  baseBranch: string,
  bumpVersion: (version: string) => string,
  label: string,
  rnBranch: string,
} */,
) /*: string */ {
  const {currentVersion, baseBranch, bumpVersion, label, rnBranch} = params;
  const newVersion = bumpVersion(currentVersion);
  const bumpBranch = `bump-hermes-${newVersion}`;

  console.log(`\n📝 Creating PR to bump ${label} version...`);

  if (DRY_RUN) {
    console.log(
      `  [DRY RUN] Would create branch ${bumpBranch} on Hermes ${baseBranch}`,
    );
    console.log(
      `  [DRY RUN] Would bump hermes-compiler version to ${newVersion}`,
    );
    console.log(
      `  [DRY RUN] Would create PR: "Bump hermes version for RN release ${rnBranch}" → ${baseBranch}`,
    );
  } else {
    execInRepo(`git checkout ${baseBranch}`, HERMES_REPO_PATH, {
      silent: true,
    });
    execInRepo(`git checkout -b ${bumpBranch}`, HERMES_REPO_PATH, {
      silent: true,
    });
    updatePackageJsonVersion(HERMES_REPO_PATH, newVersion);
    execInRepo('git add npm/hermes-compiler/package.json', HERMES_REPO_PATH);
    execInRepo(
      `git commit -m "Bump hermes version to ${newVersion}"`,
      HERMES_REPO_PATH,
    );
    execInRepo(`git push -u origin ${bumpBranch}`, HERMES_REPO_PATH);
    execSync(
      `gh pr create -R facebook/hermes --title "Bump hermes version for RN release ${rnBranch}" --body "Bumps hermes-compiler version to ${newVersion} for the next release." --base ${baseBranch}`,
      {stdio: 'inherit'},
    );
    console.log(`✅ Created PR for ${label} bump (${newVersion})`);
  }

  return newVersion;
}

function fetchHermesVersion(
  branch /*: string */,
  label /*: string */,
) /*: string */ {
  execInRepo(`git checkout ${branch}`, HERMES_REPO_PATH, {silent: true});
  execInRepo('git pull', HERMES_REPO_PATH, {silent: true});
  const version = getHermesVersionFromPackageJson(HERMES_REPO_PATH);
  console.log(`  ${label} version (${branch}): ${version}`);
  return version;
}

function getCurrentBranch(repoPath /*: string */) /*: string */ {
  return execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: repoPath,
    encoding: 'utf8',
  }).trim();
}

function hasUncommittedChanges(repoPath /*: string */) /*: boolean */ {
  const status = execSync('git status --porcelain', {
    cwd: repoPath,
    encoding: 'utf8',
  }).trim();
  return status.length > 0;
}

function isGhInstalled() /*: boolean */ {
  try {
    execSync('gh --version', {stdio: ['pipe', 'pipe', 'pipe']});
    return true;
  } catch {
    return false;
  }
}

function execInRepo(
  command /*: string */,
  repoPath /*: string */,
  options /*: {silent?: boolean} */ = {},
) /*: string */ {
  const result = execSync(command, {
    cwd: repoPath,
    encoding: 'utf8',
    stdio: options.silent === true ? ['pipe', 'pipe', 'pipe'] : 'inherit',
  });
  return typeof result === 'string' ? result.trim() : '';
}

function getHermesVersionFromPackageJson(repoPath /*: string */) /*: string */ {
  const packageJsonPath = path.join(
    repoPath,
    'npm',
    'hermes-compiler',
    'package.json',
  );
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function bumpMinorVersion(version /*: string */) /*: string */ {
  const parts = version.split('.');
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  return `${major}.${minor + 1}.0`;
}

function bumpPatchVersion(version /*: string */) /*: string */ {
  const parts = version.split('.');
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  const patch = parseInt(parts[2], 10);
  return `${major}.${minor}.${patch + 1}`;
}

function updatePackageJsonVersion(
  repoPath /*: string */,
  newVersion /*: string */,
) {
  const packageJsonPath = path.join(
    repoPath,
    'npm',
    'hermes-compiler',
    'package.json',
  );
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
  );
}

function updateVersionProperties(
  filePath /*: string */,
  key /*: string */,
  newVersion /*: string */,
) {
  let content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp(`^${key}=.*$`, 'm');
  content = content.replace(regex, `${key}=${newVersion}`);
  fs.writeFileSync(filePath, content);
}

async function ensureHermesRepo() /*: Promise<void> */ {
  if (!fs.existsSync(HERMES_REPO_PATH)) {
    console.log(`\n📦 Cloning Hermes repo to ${HERMES_REPO_PATH}...`);
    const parentDir = path.dirname(HERMES_REPO_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, {recursive: true});
    }
    execSync(`gh repo clone facebook/hermes ${HERMES_REPO_PATH}`, {
      stdio: 'inherit',
    });
    console.log('✅ Hermes repo cloned successfully.');
  } else {
    console.log(`✅ Hermes repo found at ${HERMES_REPO_PATH}`);
  }
}

void releaseHermesForBranchCut().then(() => {
  exit(0);
});
