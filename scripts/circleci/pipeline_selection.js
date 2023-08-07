/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = require('fs');
const yargs = require('yargs');
const util = require('util');
const asyncRequest = require('request');
const request = util.promisify(asyncRequest);

const argv = yargs
  .command('create-configs', 'Creates the circleci config from its files', {
    input_path: {
      alias: 'i',
      describe: 'The path to the folder where the Config parts are located',
      default: '.circleci/configurations',
    },
    output_path: {
      alias: 'o',
      describe: 'The path where the `generated_config.yml` will be created',
      default: '.circleci',
    },
    config_file: {
      alias: 'c',
      describe: 'The configuration file with the parameter to set',
      default: '/tmp/circleci/pipeline_config.json',
    },
  })
  .command(
    'filter-jobs',
    'Filters the jobs based on the list of chaged files in the PR',
    {
      github_token: {
        alias: 't',
        describe: 'The token to perform query to github',
      },
      commit_sha: {
        alias: 's',
        describe: 'The SHA of the commit',
      },
      username: {
        alias: 'u',
        describe: 'The username of the person creating the PR',
      },
      output_path: {
        alias: 'o',
        ddescribe: 'The output path for the configurations',
        default: '/tmp/circleci',
      },
    },
  )
  .demandCommand()
  .help().argv;

// ============== //
//  GITHUB UTILS  //
// ============== //

function _githubHeaders(githubToken, username) {
  return {
    Authorization: `token ${githubToken}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': `${username}`,
  };
}

function _queryOptions(url, githubToken, username) {
  return {
    method: 'GET',
    url: url,
    headers: _githubHeaders(githubToken, username),
  };
}

async function _performRequest(options) {
  const response = await request(options);
  if (response.error) {
    throw new Error(error);
  }
  return JSON.parse(response.body);
}

async function _getFilesFromCommit(githubToken, commitSha, username) {
  const url = `https://api.github.com/repos/facebook/react-native/commits/${commitSha}`;
  const options = _queryOptions(url, githubToken, username);
  const body = await _performRequest(options);

  return body.files.map(f => f.filename);
}

const mapping = {
  RUN_IOS: name => name.indexOf('React/') > -1 || name.endsWith('.rb'),
  RUN_ANDROID: name => name.indexOf('ReactAndroid/') > -1,
  RUN_JS: name => {
    const isJS = name.endsWith('.js') || name.endsWith('.jsx');
    const notAScript = name.indexOf('scripts/') < 0;
    return notAScript && isJS;
  },
  RUN_E2E: name => name.indexOf('rn-tester-e2e/') > -1,
  SKIP: name => name.endsWith('.md'),
};

async function _computeParameters(pipelineType, outputPath) {
  if (pipelineType === 'SKIP') {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    return;
  }
  fs.mkdirSync(outputPath, {recursive: true});
  const filePath = `${outputPath}/pipeline_config.json`;
  if (pipelineType === 'ALL') {
    fs.writeFileSync(filePath, JSON.stringify({run_all: true}, null, 2));
    return;
  }

  const params = {
    run_all: false,
    run_ios: _shouldRunTests(pipelineType, 'RUN_IOS'),
    run_android: _shouldRunTests(pipelineType, 'RUN_ANDROID'),
    run_js: _shouldRunTests(pipelineType, 'RUN_JS'),
    run_e2e: _shouldRunTests(pipelineType, 'RUN_E2E'),
  };

  fs.writeFileSync(filePath, JSON.stringify(params, null, 2));
}

// ============== //
//    COMMANDS    //
// ============== //

function createConfigs(inputPath, outputPath, configFile) {
  // Order is important!
  const baseConfigFiles = [
    'top_level.yml',
    'executors.yml',
    'commands.yml',
    'jobs.yml',
    'workflows.yml',
  ];

  const baseFolder = 'test_workflows';
  const testConfigs = {
    run_ios: ['testIOS.yml'],
    run_android: ['testAndroid.yml'],
    run_e2e: ['testE2E.yml'],
    run_all: ['testE2E.yml', 'testJS.yml', 'testAll.yml'],
    run_js: ['testJS.yml'],
  };

  if (!fs.existsSync(configFile)) {
    throw new Error(`Config file: ${configFile} does not exists`);
  }

  const jsonParams = JSON.parse(fs.readFileSync(configFile));
  let configurationPartsFiles = baseConfigFiles;

  for (const [key, shouldTest] of Object.entries(jsonParams)) {
    if (shouldTest) {
      const mappedFiles = testConfigs[key].map(f => `${baseFolder}/${f}`);
      configurationPartsFiles = configurationPartsFiles.concat(mappedFiles);
    }
  }
  console.log(configurationPartsFiles);
  let configParts = [];
  configurationPartsFiles.forEach(yamlPart => {
    const fileContent = fs.readFileSync(`${inputPath}/${yamlPart}`);
    configParts.push(fileContent);
  });
  console.info(`writing to: ${outputPath}/generated_config.yml`);
  fs.writeFileSync(
    `${outputPath}/generated_config.yml`,
    configParts.join('\n'),
  );
}

async function filterJobs(githubToken, commitSha, username, outputPath) {
  const fileList = await _getFilesFromCommit(githubToken, commitSha, username);

  for (const [check, filterFunction] of Object.entries(mapping)) {
    const found = fileList.every(filterFunction);
    if (found) {
      await _computeParameters(check, outputPath);
      return;
    }
  }
  await _computeParameters('ALL', outputPath);
}

async function main() {
  const command = argv._[0];
  if (command === 'create-configs') {
    createConfigs(argv.input_path, argv.output_path, argv.config_file);
  } else if (command === 'filter-jobs') {
    await filterJobs(
      argv.github_token,
      argv.commit_sha,
      argv.username,
      argv.output_path,
    );
  }
}

// ============== //
//      MAIN      //
// ============== //

main();