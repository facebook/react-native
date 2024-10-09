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

const {execSync: exec} = require('child_process');
const fetch = require('node-fetch');

/*::
type CIHeaders = {
  Authorization: string,
  Accept: string,
  'X-GitHub-Api-Version': string
}

type WorkflowRun = {
  id: number,
  name: string,
  run_number: number,
  status: string,
  workflow_id: number,
  url: string,
  created_at: string,
};


type Artifact = {
  id: number,
  name: string,
  url: string,
  archive_download_url: string,
}

type WorkflowRuns = {
  total_count: number,
  workflow_runs: Array<WorkflowRun>,
}

type Artifacts = {
  total_count: number,
  artifacts: Array<Artifact>,
}
*/

let token;
let ciHeaders;
let artifacts;
let branch;
let baseTemporaryPath;

const reactNativeRepo = 'https://api.github.com/repos/facebook/react-native/';
const reactNativeActionsURL = `${reactNativeRepo}actions/runs`;

async function _getActionRunsOnBranch() /*: Promise<WorkflowRuns> */ {
  const url = `${reactNativeActionsURL}?branch=${branch}`;
  const options = {
    method: 'GET',
    headers: ciHeaders,
  };

  // $FlowIgnore[prop-missing] Conflicting .flowconfig in Meta's monorepo
  // $FlowIgnore[incompatible-call]
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(JSON.stringify(await response.json()));
  }

  const body = await response
    // eslint-disable-next-line func-call-spacing
    .json /*::<WorkflowRuns>*/
    ();
  return body;
}

async function _getArtifacts(run_id /*: number */) /*: Promise<Artifacts> */ {
  const url = `${reactNativeActionsURL}/${run_id}/artifacts`;
  const options = {
    method: 'GET',
    headers: ciHeaders,
  };

  // $FlowIgnore[prop-missing] Conflicting .flowconfig in Meta's monorepo
  // $FlowIgnore[incompatible-call]
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(JSON.stringify(await response.json()));
  }

  const body = await response
    // eslint-disable-next-line func-call-spacing
    .json /*::<Artifacts>*/
    ();
  return body;
}

// === Public Interface === //
async function initialize(
  ciToken /*: string */,
  baseTempPath /*: string */,
  branchName /*: string */,
  useLastSuccessfulPipeline /*: boolean */ = false,
) {
  console.info('Getting GHA information');
  baseTemporaryPath = baseTempPath;
  exec(`mkdir -p ${baseTemporaryPath}`);

  branch = branchName;

  token = ciToken;
  ciHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const testAllWorkflow = (await _getActionRunsOnBranch()).workflow_runs
    .filter(w => w.name === 'Test All')
    .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))[0];

  artifacts = await _getArtifacts(testAllWorkflow.id);
}

function downloadArtifact(
  artifactURL /*: string */,
  destination /*: string */,
) {
  exec(`rm -rf ${destination}`);

  const command = `curl ${artifactURL} \
    -Lo ${destination} \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${token}" \
    -H "X-GitHub-Api-Version: 2022-11-28"`;

  exec(command, {stdio: 'inherit'});
}

async function artifactURLForJSCRNTesterAPK(
  emulatorArch /*: string */,
) /*: Promise<string> */ {
  const url = artifacts.artifacts.filter(a => a.name === 'rntester-apk')[0]
    .archive_download_url;
  return Promise.resolve(url);
}

async function artifactURLForHermesRNTesterAPK(
  emulatorArch /*: string */,
) /*: Promise<string> */ {
  const url = artifacts.artifacts.filter(a => a.name === 'rntester-apk')[0]
    .archive_download_url;
  return Promise.resolve(url);
}

async function artifactURLForMavenLocal() /*: Promise<string> */ {
  const url = artifacts.artifacts.filter(a => a.name === 'maven-local')[0]
    .archive_download_url;
  return Promise.resolve(url);
}

async function artifactURLHermesDebug() /*: Promise<string> */ {
  const url = artifacts.artifacts.filter(
    a => a.name === 'hermes-darwin-bin-Debug',
  )[0].archive_download_url;
  return Promise.resolve(url);
}

async function artifactURLForReactNative() /*: Promise<string> */ {
  const url = artifacts.artifacts.filter(
    a => a.name === 'react-native-package',
  )[0].archive_download_url;
  return Promise.resolve(url);
}

function baseTmpPath() /*: string */ {
  return baseTemporaryPath;
}

module.exports = {
  initialize,
  downloadArtifact,
  artifactURLForJSCRNTesterAPK,
  artifactURLForHermesRNTesterAPK,
  artifactURLForMavenLocal,
  artifactURLHermesDebug,
  artifactURLForReactNative,
  baseTmpPath,
};
