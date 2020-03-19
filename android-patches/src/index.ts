import diffRepos from './diffRepos';
import patchRepo from './patchRepo';
import patchFile from './patchFile';
import { initCli } from './cli';
import { log } from './logger';

const onCompletion = () => {
  // Check whether there were any errors .. and set the exit code if so.
  const errorsCallback = (errors: string[]) => {
    if (errors.length > 0) {
      process.exitCode = -1;
      // Not needed as we configure winston to do this.
      // errors.forEach(error => {
      //   process.stderr.write(error + '\n');
      // });
    }
  };

  log.queryErrors(errorsCallback);
};

initCli(diffRepos, patchRepo, patchFile, onCompletion);