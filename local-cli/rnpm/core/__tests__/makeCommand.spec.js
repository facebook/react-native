var spawnError = false;

jest.setMock('child_process', {
  spawn: () => ({
    on: (ev, cb) => cb(spawnError),
  }),
});
jest.dontMock('../src/makeCommand');

const makeCommand = require('../src/makeCommand');

describe('makeCommand', () => {
  const command = makeCommand('echo');

  it('should generate a function around shell command', () => {
    expect(typeof command).toBe('function');
  });

  it('should throw an error if there\'s no callback provided', () => {
    expect(command).toThrow();
  });

  it('should invoke a callback after command execution', () => {
    const spy = jest.genMockFunction();
    command(spy);

    expect(spy.mock.calls.length).toBe(1);
  });

  it('should throw an error if spawn ended up with error', () => {
    spawnError = true;
    const cb = jest.genMockFunction();
    expect(() => command(cb)).toThrow();
  });
});
