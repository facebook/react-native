import {
  traverseDirectory,
  writeFile,
  getRelativePath,
  lookUpRelativePath,
  initDirectory,
  resolvePath,
  copyFile2,
  getFileNameExtension,
} from './fs_utils';
import {diffFiles} from './patch_utils';
import {log} from './logger';
import {isFileText, isFileBinary} from './file_type_utils';
import {compareFiles} from './file_compare';
import {cleanRepoSync} from './git_utils';

import {IDiffCommandOptions, DiffReposFuncType} from './types';

const diffRepos: DiffReposFuncType = (
  dirtyRepoAbsPath: string,
  baseRepoAbsPath: string,
  options: IDiffCommandOptions,
) => {
  log.info('diffRepos', `dirtyRepoAbsPath: ${dirtyRepoAbsPath}`);
  log.info('diffRepos', `baseRepoAbsPath: ${baseRepoAbsPath}`);
  log.info('diffRepos', `options.patchName: ${options.patchName}`);
  log.info('diffRepos', `options.whitelistDirs: ${options.whitelistDirs}`);
  log.info('diffRepos', `options.blacklistDirs: ${options.blacklistDirs}`);
  log.info('diffRepos', `options.blacklistExts: ${options.blacklistExts}`);
  log.info('diffRepos', `options.gitExecutable: ${options.gitExecutable}`);
  log.info('diffRepos', `options.cleanupRepos: ${options.cleanupRepos}`);

  log.info('diffRepos', `options.diffExecutable: ${options.diffExecutable}`);
  log.info(
    'diffRepos',
    `options.cleanupExistingPatches: ${options.cleanupExistingPatches}`,
  );

  const patchStorePath = resolvePath(dirtyRepoAbsPath, options.patchName);

  // Where we write the patches ..
  // const bothPath = resolvePath(patchStorePath, 'both');
  // const forkOnlyPath = resolvePath(patchStorePath, 'fork-only');

  // Init output directory
  // initDirectory(bothPath);
  // initDirectory(forkOnlyPath);
  initDirectory(patchStorePath);

  if (options.cleanupRepos) {
    cleanRepoSync(options.baseFork, options.gitExecutable);
    cleanRepoSync(options.dirtyFork, options.gitExecutable);
  }

  const callbackFile = (dirtyRepoFileAbsPath: string) => {
    const forkFileRelativePath = getRelativePath(
      dirtyRepoFileAbsPath,
      dirtyRepoAbsPath,
    );

    const fileNameExtension = getFileNameExtension(dirtyRepoFileAbsPath);
    if (options.blacklistExts.includes(fileNameExtension)) {
      log.info(
        'diffRNFork',
        `Ignoring {dirtyRepoFileAbsPath} based on file name extension.`,
      );
      return;
    }
    const callbackOnHit = (fbRepoFileAbsPath: string) => {
      const callbackOnDiffCreated = (patch: string) => {
        writeFile(patchStorePath, forkFileRelativePath, `${patch}`, '');
      };
      const callbackOnError = (error: string) => {
        log.error('diffRNFork', error);
      };
      const callbackOnBinaryFilesCompare = (same: boolean) => {
        if (!same) {
          copyFile2(patchStorePath, forkFileRelativePath, dirtyRepoFileAbsPath);
        } else {
          log.info(
            'diffRNFork',
            `Skip copying identical binary files: ${forkFileRelativePath}`,
          );
        }
      };
      const callbackOnBinaryFilesCompareError = (result: string) => {
        log.error('diffRNFork', `callbackOnBinaryFilesCompareError: ${result}`);
      };

      const handleBinaryFileInFork = () => {
        compareFiles(
          fbRepoFileAbsPath,
          dirtyRepoFileAbsPath,
          callbackOnBinaryFilesCompare,
          callbackOnBinaryFilesCompareError,
        );
      };
      // If it's a binary file we copy it as is to the patches folder.
      if (isFileBinary(dirtyRepoFileAbsPath)) {
        handleBinaryFileInFork();
      } else {
        diffFiles(
          fbRepoFileAbsPath,
          false /* new file*/,
          dirtyRepoFileAbsPath,
          callbackOnDiffCreated,
          callbackOnError,
          options.diffExecutable,
        );
      }
    };

    const callbackOnMiss = (fbRepoFileAbsPath: string) => {
      const callbackOnDiffCreated = (patch: string) => {
        writeFile(patchStorePath, forkFileRelativePath, `${patch}`, '');
      };
      const callbackOnError = (error: string) => {
        log.error('diffRNFork', error);
      };
      const handleBinaryFileInFork = () => {
        copyFile2(patchStorePath, forkFileRelativePath, dirtyRepoFileAbsPath);
      };
      if (isFileBinary(dirtyRepoFileAbsPath)) {
        handleBinaryFileInFork();
      } else {
        diffFiles(
          fbRepoFileAbsPath,
          true /* new file*/,
          dirtyRepoFileAbsPath,
          callbackOnDiffCreated,
          callbackOnError,
          options.diffExecutable,
        );
      }
    };

    lookUpRelativePath(
      baseRepoAbsPath,
      forkFileRelativePath,
      callbackOnHit,
      callbackOnMiss,
    );
  };

  const callbackDirectory = (path: string) => {};

  /*
  Pseudo-code
  1. Traverse through the fork rep
  2. For each file look for the same file in the base repo
  3. If the file is found in the base repo, then create and write the patch file to the patches directory , keeping the same directory hierarchy.
  4. If the file is not found in the base repo, then also create and write the patch file in the patch directory, keeping the same directory hierarchy.
  5. If the file is a binary file, we don't try to diff it, instead just copy the binary file to that patch directory.

  Please note that we currently don't traverse the base reporitory, assuming that all the files in the base repository are present in the fork also. Essentially, we expect the patches to be only additions.
  */

  if (options.whitelistDirs.length === 0) {
    traverseDirectory(
      dirtyRepoAbsPath,
      '.',
      callbackFile,
      callbackDirectory,
      options.blacklistDirs,
    );
  } else {
    options.whitelistDirs.forEach(dir => {
      if (
        options.blacklistDirs.includes(
          dir.startsWith('.\\') ? dir.substr(2) : dir,
        )
      ) {
        log.info(
          'diffRNFork',
          `${dir} is present in both whitelist as well as blacklist. Ignoring it.`,
        );
      } else {
        traverseDirectory(
          dirtyRepoAbsPath,
          dir,
          callbackFile,
          callbackDirectory,
          options.blacklistDirs,
        );
      }
    });
  }
};

export default diffRepos;
