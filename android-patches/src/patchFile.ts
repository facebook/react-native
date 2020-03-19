import {
  traverseDirectory,
  writeFile,
  getRelativePath,
  lookUpRelativePath,
  initDirectory,
  resolvePath,
  copyFile,
  copyFileOverwrite,
  copyFile2Overwrite,
} from './fs_utils';
import {log} from './logger';
import {applyPatchTool, applyPatchEmbedded} from './patch_utils';
import {IPatchFileCommandOptions, PatchFileFuncType} from './types';

function applyPatch(
  targetPath: string,
  patchPath: string,
  options: IPatchFileCommandOptions,
  callback: (result: string) => void,
  errorcallback: (error: string) => void,
) {
  log.info(
    'patchFile',
    `Applying ${patchPath} on ${targetPath} with options ${options}`,
  );
  if (options.embeddedPatcher) {
    const sucess = applyPatchEmbedded({
      patchFilePath: patchPath,
      targetFilePathOverride: targetPath,
      reverse: options.reverse,
    });
    if (!sucess)
      log.error('patchFile', `Applying ${patchPath} on ${targetPath} failed.`);
  } else {
    applyPatchTool(
      targetPath,
      patchPath,
      (result: string) => {
        log.info('patchFile', result);
      },
      (result: string) => {
        log.error('patchFile', result);
      },
      options.patchExecutable,
      options.reverse,
    );
  }
}

const patchFile: PatchFileFuncType = (
  targetFileAbsPath: string,
  patchFileAbsPath: string,
  options: IPatchFileCommandOptions,
) => {
  log.info('patchFile', `targetFileAbsPath: ${targetFileAbsPath}`);
  log.info('patchFile', `patchFileAbsPath: ${patchFileAbsPath}`);
  log.info('patchFile', `enbeddedPatcher?: ${options.embeddedPatcher}`);
  log.info('patchFile', `options.reverse: ${options.reverse}`);
  log.info('patchFile', `options.patchExecutable: ${options.patchExecutable}`);

  applyPatch(
    targetFileAbsPath,
    patchFileAbsPath,
    options,
    (result: string) => {
      log.info('patchFile', result);
    },
    (result: string) => {
      log.error('patchFile', result);
    },
  );
};

export default patchFile;
