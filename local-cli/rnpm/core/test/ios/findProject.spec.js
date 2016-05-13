jest.autoMockOff();

const findProject = require('../../src/config/ios/findProject');
const mockFs = require('mock-fs');
const projects = require('../fixtures/projects');
const ios = require('../fixtures/ios');
const userConfig = {};

describe('ios::findProject', () => {
  it('should return path to xcodeproj if found', () => {
    mockFs(projects.flat);
    expect(findProject('')).not.toBe(null);
  });

  it('should return null if there\'re no projects', () => {
    mockFs({ testDir: projects });
    expect(findProject('')).toBe(null);
  });

  it('should return ios project regardless of its name', () => {
    mockFs({ ios: ios.validTestName });
    expect(findProject('')).not.toBe(null);
  });

  it('should ignore node_modules', () => {
    mockFs({ node_modules: projects.flat });
    expect(findProject('')).toBe(null);
  });

  it('should ignore Pods', () => {
    mockFs({ Pods: projects.flat });
    expect(findProject('')).toBe(null);
  });

  it('should ignore Pods inside `ios` folder', () => {
    mockFs({
      ios: {
        Pods: projects.flat,
        DemoApp: projects.flat.ios,
      },
    });
    expect(findProject('')).toBe('ios/DemoApp/demoProject.xcodeproj');
  });

  it('should ignore xcodeproj from example folders', () => {
    mockFs({
      examples: projects.flat,
      Examples: projects.flat,
      example: projects.flat,
      KeychainExample: projects.flat,
      Zpp: projects.flat,
    });

    expect(findProject('').toLowerCase()).not.toContain('example');
  });

  it('should ignore xcodeproj from sample folders', () => {
    mockFs({
      samples: projects.flat,
      Samples: projects.flat,
      sample: projects.flat,
      KeychainSample: projects.flat,
      Zpp: projects.flat,
    });

    expect(findProject('').toLowerCase()).not.toContain('sample');
  });

  it('should ignore xcodeproj from test folders at any level', () => {
    mockFs({
      test: projects.flat,
      IntegrationTests: projects.flat,
      tests: projects.flat,
      Zpp: {
        tests: projects.flat,
        src: projects.flat,
      },
    });

    expect(findProject('').toLowerCase()).not.toContain('test');
  });

  afterEach(mockFs.restore);
});
