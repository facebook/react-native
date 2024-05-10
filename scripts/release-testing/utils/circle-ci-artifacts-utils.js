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

const chalk = require('chalk');
const fetch = require('node-fetch');
const {exec} = require('shelljs');

let circleCIHeaders;
let jobs;
let baseTemporaryPath;

/*::
type Job = {
  job_number: number,
  id: string,
  name: string,
  type: 'build' | 'approval',
  status:
    | 'success'
    | 'running'
    | 'not_run'
    | 'failed'
    | 'retried'
    | 'queued'
    | 'not_running'
    | 'infrastructure_fail'
    | 'timedout'
    | 'on_hold'
    | 'terminated-unknown'
    | 'blocked'
    | 'canceled'
    | 'unauthorized',
  ...
};

type Workflow = {
  pipeline_id: string,
  id: string,
  name: string,
  project_slug: string,
  status:
    | 'success'
    | 'running'
    | 'not_run'
    | 'failed'
    | 'error'
    | 'failing'
    | 'on_hold'
    | 'canceled'
    | 'unauthorized',
  pipeline_number: number,
  ...
};

type Artifact = {
  path: string,
  node_index: number,
  url: string,
  ...
};

type Pipeline = {
  id: string,
  number: number,
  vcs: {
    revision: string,
    commit?: {
      subject: string,
      ...
    },
    ...
  },
  ...
}
*/

async function initialize(
  circleCIToken /*: string */,
  baseTempPath /*: string */,
  branchName /*: string */,
  useLastSuccessfulPipeline /*: boolean */ = false,
) {
  console.info('Getting CircleCI information');
  circleCIHeaders = {'Circle-Token': circleCIToken};
  baseTemporaryPath = baseTempPath;
  exec(`mkdir -p ${baseTemporaryPath}`);
  const pipeline = await (
    useLastSuccessfulPipeline ? _getLastSuccessfulPipeline : _getLatestPipeline
  )(branchName);
  const testsWorkflow = await _getTestsWorkflow(pipeline.id);
  const jobsResults = await _getCircleCIJobs(testsWorkflow.id);

  jobs = jobsResults.flatMap(j => j);
}

function baseTmpPath() /*: string */ {
  return baseTemporaryPath;
}

async function _getLatestPipeline(
  branchName /*: string */,
) /*: Promise<Pipeline> */ {
  return (await _fetchPipelinesForBranch(branchName))[0];
}

async function _getLastSuccessfulPipeline(
  branchName /*: string */,
) /*: Promise<Pipeline> */ {
  const PIPELINE_SEARCH_LIMIT = 5;
  const latestPipelines = (await _fetchPipelinesForBranch(branchName)).slice(
    0,
    PIPELINE_SEARCH_LIMIT,
  );

  for (const pipeline of latestPipelines) {
    // $FlowIgnore[prop-missing] Conflicting .flowconfig in Meta's monorepo
    const response = await fetch(
      `https://circleci.com/api/v2/pipeline/${pipeline.id}/workflow`,
      {method: 'GET', headers: circleCIHeaders},
    );

    const {items} = await response.json();

    const success = items.every(w => w.status === 'success');

    if (success) {
      if (pipeline.id !== latestPipelines[0].id) {
        console.warn(
          chalk.yellow(
            `Using last successful pipeline at revision ${pipeline.vcs.revision} (${pipeline.vcs.commit?.subject ?? 'unknown'})`,
          ),
        );
      }

      return pipeline;
    }
  }

  throw new Error(
    `Found no successful pipelines on this branch for the last ${PIPELINE_SEARCH_LIMIT} pipelines.`,
  );
}

async function _fetchPipelinesForBranch(
  branchName /*: string */,
) /*: Promise<Array<Pipeline>> */ {
  const qs = new URLSearchParams({branch: branchName}).toString();
  const url =
    'https://circleci.com/api/v2/project/gh/facebook/react-native/pipeline?' +
    qs;
  const options = {
    method: 'GET',
    headers: circleCIHeaders,
  };

  // $FlowIgnore[prop-missing] Conflicting .flowconfig in Meta's monorepo
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(response);
  }

  const responseJSON = await response
    // eslint-disable-next-line func-call-spacing
    .json /*::<{items: Array<Pipeline>}>*/
    ();
  const items = responseJSON.items;

  if (!items || items.length === 0) {
    throw new Error(
      'No pipelines found on this branch. Make sure that the CI has run at least once, successfully',
    );
  }

  return items;
}

async function _getSpecificWorkflow(
  pipelineId /*: string */,
  workflowName /*: string */,
) {
  const url = `https://circleci.com/api/v2/pipeline/${pipelineId}/workflow`;
  const options = {
    method: 'GET',
    headers: circleCIHeaders,
  };

  // $FlowIgnore[prop-missing] Conflicting .flowconfig in Meta's monorepo
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(response);
  }

  const body = await response.json();
  let workflow = body.items.find(w => w.name === workflowName);
  _throwIfWorkflowNotFound(workflow, workflowName);
  return workflow;
}

function _throwIfWorkflowNotFound(workflow /*: string */, name /*: string */) {
  if (!workflow) {
    throw new Error(
      `Can't find a workflow named ${name}. Please check whether that workflow has started.`,
    );
  }
}

async function _getTestsWorkflow(pipelineId /*: string */) {
  return _getSpecificWorkflow(pipelineId, 'tests');
}

async function _getCircleCIJobs(
  workflowId /*: string */,
) /*: Promise<Array<Job>> */ {
  const url = `https://circleci.com/api/v2/workflow/${workflowId}/job`;
  const options = {
    method: 'GET',
    headers: circleCIHeaders,
  };
  // $FlowIgnore[prop-missing] Conflicting .flowconfig in Meta's monorepo
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(response);
  }

  const body = await response
    // eslint-disable-next-line func-call-spacing
    .json /*::<{items: Array<Job>}>*/
    ();
  return body.items;
}

async function _getJobsArtifacts(
  jobNumber /*: number */,
) /*: Promise<Array<Artifact>> */ {
  const url = `https://circleci.com/api/v2/project/gh/facebook/react-native/${jobNumber}/artifacts`;
  const options = {
    method: 'GET',
    headers: circleCIHeaders,
  };

  // $FlowIgnore[prop-missing] Conflicting .flowconfig in Meta's monorepo
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(response);
  }

  const body = await response
    // eslint-disable-next-line func-call-spacing
    .json /*::<{items: Array<Artifact>}>*/
    ();
  return body.items;
}

async function _findUrlForJob(
  jobName /*: string */,
  artifactPath /*: string */,
) /*: Promise<string> */ {
  const job = jobs.find(j => j.name === jobName);
  if (job == null) {
    throw new Error(
      `Can't find a job with name ${jobName}. Please verify that it has been executed and that all its dependencies completed successfully.`,
    );
  }

  if (job.status !== 'success') {
    throw new Error(
      `The job ${job.name} status is ${job.status}. We need a 'success' status to proceed with the testing.`,
    );
  }

  const artifacts = await _getJobsArtifacts(job.job_number);
  let artifact = artifacts.find(a => a.path.indexOf(artifactPath) > -1);
  if (artifact == null) {
    throw new Error(`I could not find the artifact with path ${artifactPath}`);
  }
  return artifact.url;
}

async function artifactURLHermesDebug() /*: Promise<string> */ {
  return _findUrlForJob('build_hermes_macos-Debug', 'hermes-ios-debug.tar.gz');
}

async function artifactURLForMavenLocal() /*: Promise<string> */ {
  return _findUrlForJob('build_npm_package', 'maven-local.zip');
}

async function artifactURLForReactNative() /*: Promise<string> */ {
  let shortCommit = exec('git rev-parse HEAD', {silent: true})
    .toString()
    .trim()
    .slice(0, 9);
  return _findUrlForJob(
    'build_npm_package',
    `react-native-1000.0.0-${shortCommit}.tgz`,
  );
}

async function artifactURLForHermesRNTesterAPK(
  emulatorArch /*: string */,
) /*: Promise<string> */ {
  return _findUrlForJob(
    'test_android',
    `rntester-apk/hermes/debug/app-hermes-${emulatorArch}-debug.apk`,
  );
}

async function artifactURLForJSCRNTesterAPK(
  emulatorArch /*: string */,
) /*: Promise<string> */ {
  return _findUrlForJob(
    'test_android',
    `rntester-apk/jsc/debug/app-jsc-${emulatorArch}-debug.apk`,
  );
}

function downloadArtifact(
  artifactURL /*: string */,
  destination /*: string */,
) {
  exec(`rm -rf ${destination}`);
  exec(`curl ${artifactURL} -Lo ${destination}`);
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
