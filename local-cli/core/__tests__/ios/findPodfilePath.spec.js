'use strict';

jest.mock('fs');

const findPodfilePath = require('../../ios/findPodfilePath');
const fs = require('fs');
const projects = require('../../__fixtures__/projects');
const ios = require('../../__fixtures__/ios');

describe('ios::findPodfilePath', () => {
  it('returns null if there is no Podfile', () => {
    fs.__setMockFilesystem(ios.valid);
    expect(findPodfilePath('')).toBeNull();
  });

  it('returns Podfile path if it exists', () => {
    fs.__setMockFilesystem(projects.withPods);
    expect(findPodfilePath('/ios')).toContain('Podfile');
  });
});
