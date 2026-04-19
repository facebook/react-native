/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PATCH_FILE_PATH = path.join(__dirname, 'hermes-v1.patch');

function getLatestHermesV1Version() {
  const npmString = "npm view hermes-compiler@latest-v1 version";

  try {
    const result = execSync(npmString, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return result;
  } catch (error) {
    throw new Error(`Failed to get package version for hermes-compiler@latest-v1`);
  }
}

function setHermesV1VersionInPatch(version) {
  if (!fs.existsSync(PATCH_FILE_PATH)) {
    throw new Error(`Patch file not found at path: ${PATCH_FILE_PATH}`);
  }

  let patchContent = fs.readFileSync(PATCH_FILE_PATH, 'utf8');
  const updatedContent = patchContent.replaceAll(
    "$HERMES_V1_VERSION",
    version
  );
  fs.writeFileSync(PATCH_FILE_PATH, updatedContent, 'utf8');
}

setHermesV1VersionInPatch(getLatestHermesV1Version());
