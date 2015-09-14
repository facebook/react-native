'use strict';

jest.dontMock('../swift-bridge');

var swiftBridge = require('../swift-bridge');
var path = require.requireActual('path');
var fs = require.requireActual('fs');

jest.setMock('path', {
  join: function(path1, path2) {
    if (path2 === 'node_modules/react-native') {
      return path1;
    }
    return path.join(path1, path2);
  }
});

describe('swift-bridge', function() {
  var originalLog;
  var originalExit;
  var outFile = 'out.file';

  beforeEach(function() {
    originalLog = console.log;
    originalExit = process.exit;

    console.log = jest.genMockFunction();
    process.exit = jest.genMockFunction();
  });

  afterEach(function() {
    console.log = originalLog;
    process.exit = originalExit;
    try {
      fs.unlinkSync(outFile);
    } catch(e) {}
  });

  it('displays usage instructions when help flag is set', function() {
    swiftBridge.init(['--help']);

    expect(console.log).toBeCalled();
    expect(process.exit).toBeCalled();
    expect(console.log.mock.calls[0][0]).toContain('Usage: react-native swift-bridge');
  });

  it('displays usage instructions when project name is not passed in', function() {
    swiftBridge.init([]);

    expect(console.log).toBeCalled();
    expect(process.exit).toBeCalled();
    expect(console.log.mock.calls[0][0]).toContain('No project name was passed in');
    expect(console.log.mock.calls[1][0]).toContain('Usage: react-native swift-bridge');
  });

  it('displays usage instructions when a flag but no project name is passed in', function() {
    swiftBridge.init(['--any']);

    expect(console.log).toBeCalled();
    expect(process.exit).toBeCalled();
    expect(console.log.mock.calls[0][0]).toContain('No project name was passed in');
    expect(console.log.mock.calls[1][0]).toContain('Usage: react-native swift-bridge');
  });

  it('displays usage instructions --out flag but no project name is passed in', function() {
    swiftBridge.init(['--out', outFile]);

    expect(console.log).toBeCalled();
    expect(process.exit).toBeCalled();
    expect(console.log.mock.calls[0][0]).toContain('No project name was passed in');
    expect(console.log.mock.calls[1][0]).toContain('Usage: react-native swift-bridge');
  });

  it('spits out output to console', function() {
    swiftBridge.init(['RCTImage']);

    expect(console.log).toBeCalled();
    expect(console.log.mock.calls[0][0]).toContain('#import');
  });

  it('spits out output to output file', function() {
    swiftBridge.init(['--out', outFile, 'RCTImage']);

    expect(fs.readFileSync(outFile)).toContain('#import');
    expect(console.log.mock.calls.length).toBe(0);
  });
});
