import {spawn, spawnSync} from 'child_process';
import {log} from './logger';

export function cleanRepoSync(path: string, gitExecutable: string) {
  const gitArgs = ['clean', '-fdx'];
  const gitClean = spawnSync(gitExecutable, gitArgs, {cwd: path});
  if (gitClean.error) {
    log.error('cleanRepoSync', `Failed with error : ${gitClean.error}`);
  }
}
