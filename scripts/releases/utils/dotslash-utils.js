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

const {promises: fs} = require('fs');
const {parse, modify, applyEdits} = require('jsonc-parser');
const signedsource = require('signedsource');
const dotslash = require('@motizilberman/dotslash');
const execFile = require('util').promisify(require('child_process').execFile);
const os = require('os');
const path = require('path');

/*::
type DotSlashProvider = {
  type?: 'http',
  url: string,
} | {
  type: 'github-release',
  repo: string,
  tag: string,
  name: string,
};

type DotSlashPlatformSpec = {
  providers: DotSlashProvider[],
  hash: 'blake3' | 'sha256',
  digest: string,
  size: number,
  ...
}

type JSONCFormattingOptions = {
  tabSize?: number,
  insertSpaces?: boolean,
  eol?: string,
};

type DotSlashProvidersTransformFn = (
  providers: $ReadOnlyArray<DotSlashProvider>,
  suggestedFilename: string,
  artifactInfo: $ReadOnlyArray<{
    hash: 'blake3' | 'sha256',
    digest: string,
    size: number,
  }>
) => ?$ReadOnlyArray<DotSlashProvider>;
*/

const DEFAULT_FORMATTING_OPTIONS /*: $ReadOnly<JSONCFormattingOptions> */ = {
  tabSize: 4,
  insertSpaces: true,
  eol: '\n',
};

function sanitizeFileNameComponent(
  fileNameComponent /*: string */,
) /*: string */ {
  return fileNameComponent.replace(/[^a-zA-Z0-9.]/g, '.');
}

function splitShebangFromContents(
  contents /*: string */,
) /*: [?string, string] */ {
  const shebangMatch = contents.match(/^#!.*\n/);
  const shebang = shebangMatch ? shebangMatch[0] : null;
  const contentsWithoutShebang = shebang
    ? contents.substring(shebang.length)
    : contents;
  return [shebang, contentsWithoutShebang];
}

/**
 * Process a DotSlash file and call a callback with the providers for each platform.
 * The callback can return a new providers array to update the file.
 * The function will preserve formatting and comments in the file (except any comments
 * that are within the providers array).
 */
async function processDotSlashFileInPlace(
  filename /*: string */,
  transformProviders /*: DotSlashProvidersTransformFn */,
  formattingOptions /*: $ReadOnly<JSONCFormattingOptions> */ = DEFAULT_FORMATTING_OPTIONS,
) /*: Promise<void> */ {
  // Validate the file using `dotslash` itself so we can be reasonably sure that it conforms
  // to the expected format.
  await validateAndParseDotSlashFile(filename);

  const originalContents = await fs.readFile(filename, 'utf-8');
  const [shebang, originalContentsJson] =
    splitShebangFromContents(originalContents);
  const json = parse(originalContentsJson);
  let intermediateContentsJson = originalContentsJson;
  for (const [platform, platformSpec] of Object.entries(json.platforms) /*::
   as $ReadOnlyArray<[string, DotSlashPlatformSpec]>
  */) {
    const providers = platformSpec.providers;
    const suggestedFilename =
      `${sanitizeFileNameComponent(json.name)}-${platform}` +
      (platformSpec.format ? `.${platformSpec.format}` : '');
    const {hash, digest, size} = platformSpec;
    const newProviders =
      transformProviders(providers, suggestedFilename, {hash, digest, size}) ??
      providers;
    if (newProviders !== providers) {
      const edits = modify(
        intermediateContentsJson,
        ['platforms', platform, 'providers'],
        newProviders,
        {
          formattingOptions,
        },
      );
      intermediateContentsJson = applyEdits(intermediateContentsJson, edits);
    }
  }
  if (originalContentsJson !== intermediateContentsJson) {
    await fs.writeFile(filename, shebang + intermediateContentsJson);
    // Validate the modified file to make sure we haven't broken it.
    await validateAndParseDotSlashFile(filename);
  }
}

async function validateAndParseDotSlashFile(filename /*: string */) /*: any */ {
  const {stdout} = await execFile(dotslash, ['--', 'parse', filename]);
  return JSON.parse(stdout);
}

async function dangerouslyResignGeneratedFile(
  filename /*: string */,
) /*: Promise<void> */ {
  const GENERATED = '@' + 'generated';
  const PATTERN = new RegExp(`${GENERATED} (?:SignedSource<<([a-f0-9]{32})>>)`);
  const originalContents = await fs.readFile(filename, 'utf-8');

  const newContents = signedsource.signFile(
    originalContents.replace(PATTERN, signedsource.getSigningToken()),
  );
  await fs.writeFile(filename, newContents);
}

async function validateDotSlashArtifactData(
  data /*: Buffer */,
  platformSpec /*: $ReadOnly<{
    digest: string,
    hash: 'blake3' | 'sha256',
    size: number,
    ...
  }> */,
) /*: Promise<void> */ {
  const {digest: expectedDigest, hash, size} = platformSpec;
  if (data.length !== size) {
    throw new Error(`size mismatch: expected ${size}, got ${data.length}`);
  }
  const hashFunction = hash === 'blake3' ? 'b3sum' : 'sha256';

  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'validate-artifact-hash-'),
  );
  try {
    const tempFile = path.join(tempDir, 'data');
    await fs.writeFile(tempFile, data);
    const {stdout} = await execFile(dotslash, ['--', hashFunction, tempFile]);
    const actualDigest = stdout.trim();
    if (actualDigest !== expectedDigest) {
      throw new Error(
        `${hash} mismatch: expected ${expectedDigest}, got ${actualDigest}`,
      );
    }
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true});
  }
}

module.exports = {
  DEFAULT_FORMATTING_OPTIONS,
  processDotSlashFileInPlace,
  dangerouslyResignGeneratedFile,
  validateAndParseDotSlashFile,
  validateDotSlashArtifactData,
};
