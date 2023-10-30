/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * This script is meant to be used only in CircleCI to compute which tests we should execute
 * based on the files modified by the commit.
 */

const {execSync} = require('child_process');
const fs = require('fs');
const yargs = require('yargs');

/**
 * Check whether the filename is a JS/TS file and not in the script folder
 */
function isJSChange(name) {
  const isJS =
    name.endsWith('.js') ||
    name.endsWith('.jsx') ||
    name.endsWith('.ts') ||
    name.endsWith('.tsx');
  const notAScript = name.indexOf('scripts/') < 0;
  return isJS && notAScript;
}

function isIOS(name) {
  return (
    name.indexOf('React/') > -1 ||
    name.endsWith('.rb') ||
    name.endsWith('.podspec')
  );
}

/**
 * This maps some high level pipelines to some conditions.
 * If those conditions are true, we are going to run the associated pipeline in CI.
 * So, for example, is the commit the CI is analyzing only contains changes in the React/ folder or changes to ruby files
 * the RUN_IOS flag will be turned on and we will run only the CI suite for iOS tests.
 *
 * This mapping is not final and we can update it with more pipelines or we can update the filter condition in the future.
 */
const mapping = [
  {
    name: 'RUN_IOS',
    filterFN: name => isIOS(name),
  },
  {
    name: 'RUN_ANDROID',
    filterFN: name => name.indexOf('ReactAndroid/') > -1,
  },
  {
    name: 'RUN_E2E',
    filterFN: name => name.indexOf('rn-tester-e2e/') > -1,
  },
  {
    name: 'RUN_JS',
    filterFN: name => isJSChange(name),
  },
  {
    name: 'SKIP',
    filterFN: name => name.endsWith('.md'),
  },
];

// ===== //
// Yargs //
// ===== //

const createConfigsOption = {
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
};

const filterJobsOptions = {
  output_path: {
    alias: 'o',
    ddescribe: 'The output path for the configurations',
    default: '/tmp/circleci',
  },
};

yargs
  .command(
    'create-configs',
    'Creates the circleci config from its files',
    createConfigsOption,
    argv => createConfigs(argv.input_path, argv.output_path, argv.config_file),
  )
  .command(
    'filter-jobs',
    'Filters the jobs based on the list of chaged files in the PR',
    filterJobsOptions,
    argv => filterJobs(argv.output_path),
  )
  .demandCommand()
  .strict()
  .help().argv;

// ============== //
//  GITHUB UTILS  //
// ============== //

function _getFilesFromGit() {
  try {
    execSync('git fetch');
    const commonCommit = String(
      execSync('git merge-base HEAD origin/HEAD '),
    ).trim();
    return String(execSync(`git diff --name-only HEAD ${commonCommit}`))
      .trim()
      .split('\n');
  } catch (error) {
    console.error(error);
    return [];
  }
}

function _shouldRunE2E() {
  try {
    const gitCommand = 'git log -1 --pretty=format:"%B" | head -n 1';
    const commitMessage = String(execSync(gitCommand)).trim();
    console.log(`commitMessage: ${commitMessage}`);
    return commitMessage.includes('#run-e2e-tests');
  } catch (error) {
    console.error(error);
    return false;
  }
}

function _computeAndSavePipelineParameters(
  pipelineType,
  outputPath,
  shouldRunE2E,
) {
  fs.mkdirSync(outputPath, {recursive: true});
  const filePath = `${outputPath}/pipeline_config.json`;

  if (pipelineType === 'SKIP') {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    return;
  }

  console.log(`Should run e2e? ${shouldRunE2E}`);
  if (pipelineType === 'ALL') {
    fs.writeFileSync(
      filePath,
      JSON.stringify({run_all: true, run_e2e: shouldRunE2E}, null, 2),
    );
    return;
  }

  const params = {
    run_all: false,
    run_ios: pipelineType === 'RUN_IOS',
    run_android: pipelineType === 'RUN_ANDROID',
    run_js: pipelineType === 'RUN_JS',
    run_e2e: shouldRunE2E,
  };

  const stringifiedParams = JSON.stringify(params, null, 2);
  fs.writeFileSync(filePath, stringifiedParams);
  console.info(`Generated params:\n${stringifiedParams}`);
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

function filterJobs(outputPath) {
  const fileList = _getFilesFromGit();

  if (fileList.length === 0) {
    _computeAndSavePipelineParameters('SKIP', outputPath);
    return;
  }

  const shouldRunE2E = _shouldRunE2E();

  for (const filter of mapping) {
    const found = fileList.every(filter.filterFN);
    if (found) {
      _computeAndSavePipelineParameters(filter.name, outputPath, shouldRunE2E);
      return;
    }
  }
  _computeAndSavePipelineParameters('ALL', outputPath, shouldRunE2E);
}
