/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {execSync} = require('child_process');
const fs = require('fs');
const glob = require('glob');
const ini = require('ini');
const path = require('path');
const {styleText} = require('util');

const CONFIG_PATH = path.join(__dirname, './public-api.conf');
const GLOB_PROJECT_ROOT = path.resolve(path.join(__dirname, '../../'));

const log = {
  // $FlowFixMe[unclear-type]
  info: (...args /*: Array<any>*/) => console.info(...args),
  // $FlowFixMe[unclear-type]
  msg: (...args /*: Array<any>*/) => console.log(...args),
};

const CPP_IS_PRIVATE = /\n private:([\s\S]*?)(?= public:| protected:|};)/g;
const CPP_FORWARD_DECLARATION =
  /(?:^|\n)?\s*(@?class|struct|@protocol) [^{ ]+;/g;

// $FlowFixMe[prop-missing]
const isTTY = process.stdout.isTTY;

/*::
type Config = {
  include: string[],
  exclude: string[],
  settings: {
    output: string,
    clang?: string,
    'clang-format'?: string,
  },
};

type ParsedConfig = {
  include: {[string]: boolean},
  exclude: {[string]: boolean},
  settings: Config['settings'],
}
*/

function loadConfig(configPath /*: string*/ = CONFIG_PATH) /* : Config */ {
  // prettier-ignore
  const raw = ini.parse/*::<ParsedConfig>*/(fs.readFileSync(configPath, 'utf8'));
  return {
    include: Object.keys(raw.include),
    exclude: Object.keys(raw.exclude),
    settings: raw.settings,
  };
}

function checkDependencies(
  ...commands /*: $ReadOnlyArray<string> */
) /*: boolean*/ {
  let ok = true;
  for (const command of commands) {
    let found = true;
    let version = '';
    try {
      const output = execSync(`${command} --version`).toString().trim();
      const match = /(\d+\.\d+\.\d+)/.exec(output);
      if (match) {
        version = match[1];
      }
    } catch (e) {
      if (!/command not found/.test(e.message)) {
        // Guard against unexpected errors
        log.info(e);
      }
      found = false;
      ok = false;
    }
    const output = found
      ? styleText('green', `✅ ${version}`)
      : styleText('red', '🚨 not found');
    log.info(`🔍 ${command} → ${output}`);
  }
  return ok;
}

/*::
enum FileType {
  CPP = 'cpp',
  C = 'c',
  OBJC = 'objective-c',
  UNKNOWN = 'unknown',
}
*/
const FileType = {
  CPP: 'cpp',
  C: 'c',
  OBJC: 'objective-c',
  UNKNOWN: 'unknown',
};

function getFileType(filePath /*: string*/) /*: FileType */ {
  let platformCommand = 'file -b -i';
  if (process.platform === 'darwin') {
    platformCommand = 'file -b -I';
  }

  const raw = execSync(`${platformCommand} ${filePath}`).toString().trim();
  switch (true) {
    case raw.startsWith('text/x-c++'):
      return FileType.CPP;
    case raw.startsWith('text/x-c'):
      return FileType.C;
    case raw.startsWith('text/x-objective-c'):
      return FileType.OBJC;
    default:
      return FileType.UNKNOWN;
  }
}

function trimCPPNoise(
  sourcePath /*: string*/,
  filetype /*: FileType */,
  clang /*: string*/,
  clangFormat /*: string */,
) /*: ?string */ {
  // This is the simplest possible way to parse preprocessor directives and normaize the output. We should investigate using
  // clang's LibTooling API to do this with more control over what we output.
  if (filetype === FileType.UNKNOWN) {
    return;
  }
  // src: https://en.cppreference.com/w/cpp/preprocessor/replace#Predefined_macros.
  //
  // I think we should only be define this without a specific version. It affects the preprocessor beyond simply gating code.
  // This means we're forever going to introduce massive changes to the outputted API file that aren't meaningful for capturing
  // user introduced API changes. This will affect our revision control commit logs.
  const CPP20 = '202002L';

  // Strip comments, runs the preprocessor and removes formatting noise. The downside of this approach is it can be extremely
  // noisy if the preprocessor is able to resolve imports. This isn't the case the majority of the time.
  let sourceFileContents = execSync(
    `${clang} -E -P -D__cplusplus=${CPP20} -nostdinc -nostdlibinc -nostdinc++ -nostdlib++ ${sourcePath} 2> /dev/null | ${clangFormat}`,
    {encoding: 'utf-8'},
  )
    .toString()
    .trim();

  // The second pass isn't very robust, but it's good enough for now.
  if (filetype === FileType.CPP || filetype === FileType.C) {
    sourceFileContents = sourceFileContents.replace(CPP_IS_PRIVATE, '');
  }

  return sourceFileContents;
}

function wrapWithFileReference(
  source /*: string*/,
  filePath /*: string*/,
) /*: string*/ {
  return `\n/// @src {${filePath}}:\n${source}`;
}

function main() {
  const config = loadConfig();

  // Check dependencies
  const clang = config.settings.clang ?? 'clang';
  const clangFormat = config.settings['clang-format'] ?? 'clang-format';

  if (!checkDependencies(clang, clangFormat)) {
    process.exitCode = 1;
    return;
  }

  let start = performance.now();

  let files /*: string[]*/ = [];
  for (const searchGlob of config.include) {
    // glob 7 doesn't support searchGlob as a string[]
    files = files.concat(
      glob.sync(searchGlob, {
        ignore: config.exclude,
        root: GLOB_PROJECT_ROOT,
      }),
    );
  }
  files = Array.from(new Set(files));

  // Sort the files to make the output deterministic
  files.sort();

  log.info(
    `📚 Indexing header files took ${(performance.now() - start).toFixed(0)}ms`,
  );

  // Write the output to a file. We lean on revision control to track changes.
  const outputFile = path.join(GLOB_PROJECT_ROOT, config.settings.output);
  try {
    fs.unlinkSync(outputFile);
    log.info(`🔥 ${outputFile} already exists, deleting...`);
  } catch {
    log.info(`✅ ${outputFile} doesn't exist, creating...`);
  }

  log.info(`Processing API (${files.length} files):\n`);

  start = performance.now();

  const CURSOR_TO_BEGINNING = '\x1b[0G';
  const CURSOR_CLEAR_LINE = '\x1b[2K';

  const cache /*: {[filename: string]: ?string}*/ = {};
  const filetypes /*: {[filename: string]: FileType}*/ = {};

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const percentage = `${((i / files.length) * 100).toFixed(0)}% (${((performance.now() - start) / 1000).toFixed(0)}s)`;
    let updated = `${percentage} → ${filename}`;
    if (isTTY) {
      // $FlowFixMe[prop-missing]
      const columns = process.stdout.columns;
      if (updated.length >= columns) {
        updated = `${percentage} → `;
        updated = `${updated}${filename.slice(0, columns - updated.length)}`;
      }
      process.stdout.write(
        `${CURSOR_CLEAR_LINE}${CURSOR_TO_BEGINNING}${updated}`,
      );
    } else {
      updated = `${filename}`;
      log.msg(updated);
    }

    filetypes[filename] = getFileType(filename);
    cache[filename] = trimCPPNoise(
      filename,
      filetypes[filename],
      clang,
      clangFormat,
    );
  }
  if (isTTY) {
    process.stdout.write('\n');
  }
  log.info('🧹 cleaning up preprocessor noise...');

  start = performance.now();

  // O(n^2)... but it's fine for now given we're processing ~ 1000 files
  let trimmed_lines = 0;
  let substitutions = 0;
  for (const [src, ref] of Object.entries(cache)) {
    if (ref == null || ref.length === 0) {
      continue;
    }
    for (const [key, value] of Object.entries(cache)) {
      if (key === src || value == null || value.length === 0) {
        continue;
      }
      if (value.includes(ref)) {
        const lines = value.match(/\n/g)?.length ?? 0;
        const trimmed = value.replaceAll(ref, `/// @dep {${src}}`);

        trimmed_lines += lines - (trimmed.match(/\n/g)?.length ?? 0);
        substitutions++;

        cache[key] = trimmed;
      }
    }
  }
  log.info(
    `🧹 cleaned up ${substitutions} (${trimmed_lines} lines saved) dependencies in ${((performance.now() - start) / 100).toFixed(0)}ms`,
  );
  log.info(`💾 saving ${files.length} parsed header files to ${outputFile}`);

  fs.appendFileSync(
    outputFile,
    `/*
 * This file is generated, do not edit.
 * ${'@' + 'generated'}
 *
 * @file_count ${files.length}
 * @generate-command: node tools/api/public-api.js
 */

`,
  );

  for (const filename of files) {
    let cleaned = cache[filename] ?? '';
    const filetype = filetypes[filename] ?? FileType.UNKNOWN;

    if (filetype !== FileType.UNKNOWN) {
      // Remove forward declarations at the late stage avoid dirtying when we deduplicate all the imports
      cleaned = cleaned.replace(CPP_FORWARD_DECLARATION, '');
    }
    // Cache output so we can clean up more noise
    fs.appendFileSync(
      outputFile,
      wrapWithFileReference(cleaned, filename) + '\n',
    );
  }

  log.info(styleText('bold', '✅ Done!'));
}

main();
