#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {exec} = require('shelljs');

const util = require('util');
const asyncRequest = require('request');
const request = util.promisify(asyncRequest);

let circleCIHeaders;
let jobs;
let baseTemporaryPath;

async function initialize(circleCIToken, baseTempPath, branchName) {
  console.info('Getting CircleCI information');
  circleCIHeaders = {'Circle-Token': circleCIToken};
  baseTemporaryPath = baseTempPath;
  exec(`mkdir -p ${baseTemporaryPath}`);
  const pipeline = await _getLastCircleCIPipelineID(branchName);
  const testsWorkflow = await _getTestsWorkflow(pipeline.id);
  const jobsResults = await _getCircleCIJobs(testsWorkflow.id);

  jobs = jobsResults.flatMap(j => j);
}

function baseTmpPath() {
  return baseTemporaryPath;
}

async function _getLastCircleCIPipelineID(branchName) {
  const options = {
    method: 'GET',
    url: 'https://circleci.com/api/v2/project/gh/facebook/react-native/pipeline',
    qs: {
      branch: branchName,
    },
    headers: circleCIHeaders,
  };

  const response = await request(options);
  if (response.error) {
    throw new Error(error);
  }

  const items = JSON.parse(response.body).items;

  if (!items || items.length === 0) {
    throw new Error(
      'No pipelines found on this branch. Make sure that the CI has run at least once, successfully',
    );
  }

  const lastPipeline = items[0];
  return {id: lastPipeline.id, number: lastPipeline.number};
}

async function _getSpecificWorkflow(pipelineId, workflowName) {
  const options = {
    method: 'GET',
    url: `https://circleci.com/api/v2/pipeline/${pipelineId}/workflow`,
    headers: circleCIHeaders,
  };
  const response = await request(options);
  if (response.error) {
    throw new Error(error);
  }

  const body = JSON.parse(response.body);
  let workflow = body.items.find(w => w.name === workflowName);
  _throwIfWorkflowNotFound(workflow, workflowName);
  return workflow;
}

function _throwIfWorkflowNotFound(workflow, name) {
  if (!workflow) {
    throw new Error(
      `Can't find a workflow named ${name}. Please check whether that workflow has started.`,
    );
  }
}

async function _getTestsWorkflow(pipelineId) {
  return _getSpecificWorkflow(pipelineId, 'tests');
}

async function _getCircleCIJobs(workflowId) {
  const options = {
    method: 'GET',
    url: `https://circleci.com/api/v2/workflow/${workflowId}/job`,
    headers: circleCIHeaders,
  };
  const response = await request(options);
  if (response.error) {
    throw new Error(error);
  }

  const body = JSON.parse(response.body);
  return body.items;
}

async function _getJobsArtifacts(jobNumber) {
  const options = {
    method: 'GET',
    url: `https://circleci.com/api/v2/project/gh/facebook/react-native/${jobNumber}/artifacts`,
    headers: circleCIHeaders,
  };
  const response = await request(options);
  if (response.error) {
    throw new Error(error);
  }

  const body = JSON.parse(response.body);
  return body.items;
}

async function _findUrlForJob(jobName, artifactPath) {
  const job = jobs.find(j => j.name === jobName);
  _throwIfJobIsNull(job);
  _throwIfJobIsUnsuccessful(job);

  const artifacts = await _getJobsArtifacts(job.job_number);
  return artifacts.find(artifact => artifact.path.indexOf(artifactPath) > -1)
    .url;
}

function _throwIfJobIsNull(job) {
  if (!job) {
    throw new Error(
      `Can't find a job with name ${job.name}. Please verify that it has been executed and that all its dependencies completed successfully.`,
    );
  }
}

function _throwIfJobIsUnsuccessful(job) {
  if (job.status !== 'success') {
    throw new Error(
      `The job ${job.name} status is ${job.status}. We need a 'success' status to proceed with the testing.`,
    );
  }
}

async function artifactURLHermesDebug() {
  return _findUrlForJob('build_hermes_macos-Debug', 'hermes-ios-debug.tar.gz');
}

async function artifactURLForMavenLocal() {
  return _findUrlForJob('build_npm_package', 'maven-local.zip');
}

async function artifactURLForHermesRNTesterAPK(emulatorArch) {
  return _findUrlForJob(
    'test_android',
    `rntester-apk/hermes/debug/app-hermes-${emulatorArch}-debug.apk`,
  );
}

async function artifactURLForJSCRNTesterAPK(emulatorArch) {
  return _findUrlForJob(
    'test_android',
    `rntester-apk/jsc/debug/app-jsc-${emulatorArch}-debug.apk`,
  );
}

function downloadArtifact(artifactURL, destination) {
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
  baseTmpPath,
};
