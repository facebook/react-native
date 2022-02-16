import {spawn} from 'child_process';

import {log} from './logger';

import {executeEffects} from './patch/apply';
import {reversePatch} from './patch/reverse';
import {readPatch} from './patch/read';

// import {InterfaceCLI, getArgs} from './cli';
// const patchExecutable = getArgs().patchExecutable;
// const diffExecutable = getArgs().diffExecutable;

// Returns patch between files as string
// For our use case, the first path is the FB/base repo and the second path is the dirtry fork.
// For files which doesn't exist in the FB/base repo, the path1IsNew should be set so that we create path for 'new file'
// Return empty string when files are identical
export function diffFiles(
  path1: string,
  path1IsNew: boolean /* TODO :: path2IsNew ? */,
  path2: string,
  callback: (diff: string) => void,
  errorcallback: (error: string) => void,
  diffExecutable: string,
) {
  const diffArgs = [path1, path2, '-u' /*-U 3*/];
  if (path1IsNew) diffArgs.push('--unidirectional-new-file');

  const diff = spawn(diffExecutable, diffArgs);

  diff.stdout.on('data', (data: string) => {
    callback(data);
  });

  diff.stderr.on('data', (data: any) => {
    errorcallback(`${diffExecutable} ${diffArgs} failed with message: ${data}`);
  });

  diff.on('close', (code: any) => {
    log.verbose('Patch', `git child process exited with code ${code}`);
  });
}

export function applyPatchTool(
  targetPath: string,
  patchPath: string,
  callback: (result: string) => void,
  errorcallback: (error: string) => void,
  patchExecutable: string,
  reverse: boolean,
) {
  const patchArgs = ['-i', patchPath, targetPath, '-s'];
  if (reverse) {
    patchArgs.push('-R');
  }

  const patch = spawn(patchExecutable, patchArgs);
  log.info(
    'Patch',
    'Calling C:\\Program Files\\Git\\usr\\bin\\patch.exe ' +
      patchArgs.toString(),
  );

  patch.on('message', (message: string) => {
    callback(`Patch message: ${message}`);
  });

  patch.stdout.on('data', (data: string) => {
    callback(`Patch output: ${data}`);
  });

  patch.stderr.on('data', (data: any) => {
    errorcallback(
      `${patchExecutable} ${patchArgs} failed with message: ${data}`,
    );
  });

  patch.on('close', (code: any) => {
    log.info('Patch', `patch child process exited with code ${code}`);
  });
}

export function applyPatchEmbedded({
  patchFilePath,
  targetFilePathOverride, // Override the target file path in the patch file.
  reverse,
}: {
  patchFilePath: string;
  targetFilePathOverride: string;
  reverse: boolean;
}): boolean {
  const patch = readPatch({patchFilePath});
  try {
    executeEffects(
      reverse ? reversePatch(patch) : patch,
      targetFilePathOverride,
      {
        dryRun: false,
      },
    );
  } catch (e) {
    try {
      executeEffects(
        reverse ? patch : reversePatch(patch),
        targetFilePathOverride,
        {
          dryRun: true,
        },
      );
    } catch (e) {
      log.error('patch_utils', `Applying patch failed: ${e}`);
      return false;
    }
  }

  return true;
}
