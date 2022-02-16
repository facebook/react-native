import {
  traverseDirectory,
  getRelativePath,
  lookUpRelativePath,
  resolvePath,
  copyFile,
  copyFileOverwrite,
} from './fs_utils';
import { log } from './logger';
import { applyPatchTool, applyPatchEmbedded } from './patch_utils';
import { isFileText, isFileBinary } from './file_type_utils';
import { IPatchCommandOptions, PatchRepoFuncType } from './types';

function applyPatch(
  targetPath: string,
  patchPath: string,
  options: IPatchCommandOptions,
  callback: (result: string) => void,
  errorcallback: (error: string) => void,
) {
  log.info('PatchRepo', `Applying ${patchPath} on ${targetPath} `);
  if (options.embeddedPatcher) {
    const sucess = applyPatchEmbedded({
      patchFilePath: patchPath,
      targetFilePathOverride: targetPath,
      reverse: options.reverse,
    });
    if (!sucess)
      log.error('PatchRepo', `Applying ${patchPath} on ${targetPath} failed.`);
  } else {
    applyPatchTool(
      targetPath,
      patchPath,
      (result: string) => {
        log.info('PatchRepo', result);
      },
      (result: string) => {
        log.error('PatchRepo', result);
      },
      options.patchExecutable,
      options.reverse,
    );
  }
}

const patchRepo: PatchRepoFuncType = (
  targetRepoAbsPath: string,
  patchNames: string[],
  options: IPatchCommandOptions,
) => {
  log.info('patchRepo', `targetRepoAbsPath: ${targetRepoAbsPath}`);
  log.info('patchRepo', `patchNames: ${patchNames}`);
  log.info('patchRepo', `options.patchStore: ${options.patchStore}`);
  log.info('patchRepo', `enbeddedPatcher?: ${options.embeddedPatcher}`);
  log.info('patchRepo', `options.reverse: ${options.reverse}`);
  log.info('patchRepo', `options.patchExecutable: ${options.patchExecutable}`);

  log.info('patchRepo', `options.gitExecutable: ${options.gitExecutable}`);
  log.info('patchRepo', `options.cleanupRepos: ${options.cleanupRepos}`);

  const callbackFile = (
    patchFileAbsPath: string,
    patchFileRootAbsPath: string,
  ) => {
    const patchFileRelativePath = getRelativePath(
      patchFileAbsPath,
      patchFileRootAbsPath,
    );

    const callbackOnHit = (hitPatchFileAbsPath: string) => {
      if (!isFileBinary(patchFileAbsPath)) {
        applyPatch(
          hitPatchFileAbsPath,
          patchFileAbsPath,
          options,
          (result: string) => {
            log.info('PatchRepo', result);
          },
          (result: string) => {
            log.error('PatchRepo', result);
          },
        );
      } else {
        // Overwrite the file.
        copyFileOverwrite(patchFileAbsPath, hitPatchFileAbsPath);
      }
    };

    const callbackOnMiss = (missedPatchFileAbsPath: string) => {
      log.warn(
        'PatchRepo',
        `File path with patches (${missedPatchFileAbsPath}) not found in the target repository.`,
      );

      if (isFileBinary(patchFileAbsPath)) {
        // If patch file is binary, we copy anyways.
        copyFile(patchFileAbsPath, missedPatchFileAbsPath);
      } else {
        applyPatch(
          missedPatchFileAbsPath,
          patchFileAbsPath,
          options,
          (result: string) => {
            log.info('PatchRepo', result);
          },
          (result: string) => {
            log.error('PatchRepo', result);
          },
        );
      }
    };

    lookUpRelativePath(
      targetRepoAbsPath,
      patchFileRelativePath,
      callbackOnHit,
      callbackOnMiss,
    );
  };

  const callbackDirectory = (path: string, rootAbsPath: string) => {
    // tslint:disable-next-line:no-console
    // console.log('Directory: ' + path);
  };

  patchNames.forEach(patchName => {
    const patchNameDirAbsPath = resolvePath(options.patchStore, patchName);
    traverseDirectory(
      patchNameDirAbsPath,
      '.',
      callbackFile,
      callbackDirectory,
      [],
    );
  });
};

export default patchRepo;
