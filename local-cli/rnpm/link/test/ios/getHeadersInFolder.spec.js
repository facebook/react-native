const chai = require('chai');
const expect = chai.expect;
const getHeadersInFolder = require('../../src/ios/getHeadersInFolder');
const mock = require('mock-fs');

describe('ios::getHeadersInFolder', () => {

  it('should return an array of all headers in given folder', () => {
    mock({
      'FileA.h': '',
      'FileB.h': '',
    });

    const foundHeaders = getHeadersInFolder(process.cwd());

    expect(foundHeaders.length).to.equals(2);

    getHeadersInFolder(process.cwd()).forEach(headerPath => {
      expect(headerPath).to.contain(process.cwd());
    });
  });

  it('should ignore all headers in Pods, Examples & node_modules', () => {
    mock({
      'FileA.h': '',
      'FileB.h': '',
      Pods: {
        'FileC.h': '',
      },
      Examples: {
        'FileD.h': '',
      },
      node_modules: {
        'FileE.h': '',
      },
    });

    expect(getHeadersInFolder(process.cwd()).length).to.equals(2);
  });

  afterEach(() => {
    mock.restore();
  });

});
