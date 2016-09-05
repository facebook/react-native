const spawn = require('child_process').spawn;

module.exports = function makeCommand(command) {
  return (cb) => {
    if (!cb) {
      throw new Error(`You missed a callback function for the ${command} command`);
    }

    const args = command.split(' ');
    const cmd = args.shift();

    const commandProcess = spawn(cmd, args, {
      stdio: 'inherit',
      stdin: 'inherit',
    });

    commandProcess.on('close', function prelink(code) {
      if (code) {
        throw new Error(`Error occured during executing "${command}" command`);
      }

      cb();
    });
  };
};
