/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {execSync, spawn} = require('child_process');
const fs = require('fs');
const {promisify} = require('util');
const glob = require('glob');
const ini = require('ini');
const path = require('path');
const {styleText} = require('util');

const CONFIG_PATH = path.join(__dirname, './public-api.conf');
const GLOB_PROJECT_ROOT = path.resolve(path.join(__dirname, '../../'));

// Promisify glob for better async handling
const globAsync = promisify(glob);

// Cache for file operations
const fileCache = new Map();
const fileTypeCache = new Map();

// Parallel processing configuration
const CONCURRENT_WORKERS = Math.max(1, require('os').cpus().length - 1);

const log = {
  info: (...args) => console.info(...args),
  msg: (...args) => console.log(...args),
};

const CPP_IS_PRIVATE = /\n private:([\s\S]*?)(?= public:| protected:|};)/g;
const CPP_FORWARD_DECLARATION = /(?:^|\n)?\s*(@?class|struct|@protocol) [^{ ]+;/g;

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
*/

class FileProcessor {
  constructor(clang, clangFormat) {
    this.clang = clang;
    this.clangFormat = clangFormat;
    this.platformCommand = process.platform === 'darwin' ? 'file -b -I' : 'file -b -i';
  }

  async getFileType(filePath) {
    if (fileTypeCache.has(filePath)) {
      return fileTypeCache.get(filePath);
    }

    try {
      const raw = execSync(`${this.platformCommand} ${filePath}`).toString().trim();
      let fileType;
      
      if (raw.startsWith('text/x-c++')) fileType = 'cpp';
      else if (raw.startsWith('text/x-c')) fileType = 'c';
      else if (raw.startsWith('text/x-objective-c')) fileType = 'objective-c';
      else fileType = 'unknown';

      fileTypeCache.set(filePath, fileType);
      return fileType;
    } catch (error) {
      return 'unknown';
    }
  }

  async processFile(filename) {
    const filetype = await this.getFileType(filename);
    
    if (filetype === 'unknown') {
      return { filename, filetype, content: null };
    }

    try {
      const CPP20 = '202002L';
      const sourceFileContents = execSync(
        `${this.clang} -E -P -D__cplusplus=${CPP20} -nostdinc -nostdlibinc -nostdinc++ -nostdlib++ ${filename} 2> /dev/null | ${this.clangFormat}`,
        { encoding: 'utf-8' }
      ).toString().trim();

      let cleaned = sourceFileContents;
      if (filetype === 'cpp' || filetype === 'c') {
        cleaned = cleaned.replace(CPP_IS_PRIVATE, '');
      }

      return { filename, filetype, content: cleaned };
    } catch (error) {
      return { filename, filetype, content: null };
    }
  }
}

class DependencyOptimizer {
  constructor() {
    this.contentMap = new Map();
    this.dependencyGraph = new Map();
  }

  addFile(filename, content) {
    if (!content) return;
    this.contentMap.set(filename, content);
  }

  optimize() {
    const files = Array.from(this.contentMap.entries());
    let substitutions = 0;
    let trimmedLines = 0;

    // Sort by content length (largest first) for more efficient matching
    files.sort((a, b) => b[1].length - a[1].length);

    for (let i = 0; i < files.length; i++) {
      const [src, ref] = files[i];
      if (!ref) continue;

      for (let j = i + 1; j < files.length; j++) {
        const [key, value] = files[j];
        if (!value || key === src) continue;

        if (value.includes(ref)) {
          const linesBefore = (value.match(/\n/g) || []).length;
          const trimmed = value.replaceAll(ref, `/// @dep {${src}}`);
          const linesAfter = (trimmed.match(/\n/g) || []).length;
          
          trimmedLines += linesBefore - linesAfter;
          substitutions++;
          
          this.contentMap.set(key, trimmed);
          files[j][1] = trimmed; // Update the sorted array
        }
      }
    }

    return { substitutions, trimmedLines };
  }

  getContent(filename) {
    return this.contentMap.get(filename);
  }
}

async function loadConfig(configPath = CONFIG_PATH) {
  const raw = ini.parse(fs.readFileSync(configPath, 'utf8'));
  return {
    include: Object.keys(raw.include),
    exclude: Object.keys(raw.exclude),
    settings: raw.settings,
  };
}

async function checkDependencies(...commands) {
  const results = await Promise.all(
    commands.map(async (command) => {
      try {
        const output = execSync(`${command} --version`).toString().trim();
        const match = /(\d+\.\d+\.\d+)/.exec(output);
        return { command, found: true, version: match ? match[1] : '' };
      } catch (error) {
        return { command, found: false, version: '' };
      }
    })
  );

  let allFound = true;
  results.forEach(({ command, found, version }) => {
    const output = found 
      ? styleText('green', `✅ ${version}`)
      : styleText('red', '🚨 not found');
    log.info(`🔍 ${command} → ${output}`);
    if (!found) allFound = false;
  });

  return allFound;
}

function wrapWithFileReference(source, filePath) {
  return `\n/// @src {${filePath}}:\n${source}`;
}

async function processFilesInParallel(files, processor) {
  const batches = [];
  const batchSize = Math.ceil(files.length / CONCURRENT_WORKERS);
  
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize));
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      const batchResults = [];
      for (const file of batch) {
        batchResults.push(await processor.processFile(file));
      }
      return batchResults;
    })
  );

  return results.flat();
}

async function main() {
  const config = await loadConfig();
  const clang = config.settings.clang ?? 'clang';
  const clangFormat = config.settings['clang-format'] ?? 'clang-format';

  if (!await checkDependencies(clang, clangFormat)) {
    process.exitCode = 1;
    return;
  }

  let start = performance.now();

  // Use Promise.all for parallel glob searching
  const fileSets = await Promise.all(
    config.include.map(searchGlob => 
      globAsync(searchGlob, {
        ignore: config.exclude,
        root: GLOB_PROJECT_ROOT,
      })
    )
  );

  let files = Array.from(new Set(fileSets.flat()));
  files.sort();

  log.info(`📚 Indexing ${files.length} header files took ${(performance.now() - start).toFixed(0)}ms`);

  const outputFile = path.join(GLOB_PROJECT_ROOT, config.settings.output);
  
  try {
    fs.unlinkSync(outputFile);
    log.info(`🔥 ${outputFile} already exists, deleting...`);
  } catch {
    log.info(`✅ ${outputFile} doesn't exist, creating...`);
  }

  log.info(`Processing API (${files.length} files):\n`);
  start = performance.now();

  const processor = new FileProcessor(clang, clangFormat);
  const optimizer = new DependencyOptimizer();

  // Process files in parallel batches
  const processedFiles = await processFilesInParallel(files, processor);
  
  // Populate optimizer and remove forward declarations
  processedFiles.forEach(({ filename, filetype, content }) => {
    let cleaned = content;
    if (filetype !== 'unknown' && cleaned) {
      cleaned = cleaned.replace(CPP_FORWARD_DECLARATION, '');
    }
    optimizer.addFile(filename, cleaned);
  });

  log.info(`🔄 Optimizing dependencies...`);
  const optimizationStart = performance.now();
  const { substitutions, trimmedLines } = optimizer.optimize();
  log.info(`🧹 Cleaned up ${substitutions} dependencies (${trimmedLines} lines saved) in ${((performance.now() - optimizationStart) / 100).toFixed(0)}ms`);

  log.info(`💾 Saving ${files.length} parsed header files to ${outputFile}`);

  // Write output in single operation
  const outputContent = [
    `/*\n * This file is generated, do not edit.\n * ${'@' + 'generated'}\n *\n * @file_count ${files.length}\n * @generate-command: node tools/api/public-api.js\n */\n\n`,
    ...files.map(filename => {
      const content = optimizer.getContent(filename);
      return content ? wrapWithFileReference(content, filename) + '\n' : '';
    })
  ].join('');

  fs.writeFileSync(outputFile, outputContent);

  const totalTime = (performance.now() - start) / 1000;
  log.info(styleText('bold', `✅ Done! Total time: ${totalTime.toFixed(2)}s`));
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

main();