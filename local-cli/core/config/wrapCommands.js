const makeCommand = require('../makeCommand');

module.exports = function wrapCommands(commands) {
  const mappedCommands = {};
  Object.keys(commands || []).forEach((k) =>
    mappedCommands[k] = makeCommand(commands[k])
  );
  return mappedCommands;
};
