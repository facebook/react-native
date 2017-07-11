'use strict';

const findPodfilePath = require('../../ios/findPodfilePath');
const mockFS = require('mock-fs');
const projects = require('../../__fixtures__/projects');
const ios = require('../../__fixtures__/ios');

describe('ios::findPodfilePath', () => {
  it('returns null if there is no Podfile', () => {
    mockFS(ios.valid);
    expect(findPodfilePath('')).toBeNull()
  });

  it('returns Podfile path if it exists', () => {
    mockFS(projects.withPods);
    expect(findPodfilePath('ios')).toContain('Podfile');
  });

  afterEach(() => {
    mockFS.restore();
  });

});
