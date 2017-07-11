'use strict';

const findPodspecName = require('../../ios/findPodspecName');
const mockFS = require('mock-fs');
const projects = require('../../__fixtures__/projects');
const ios = require('../../__fixtures__/ios');

describe('ios::findPodspecName', () => {
  it('returns null if there is not podspec file', () => {
    mockFS(projects.flat);
    expect(findPodspecName('')).toBeNull();
  });

  it('returns podspec name if only one exists', () => {
    mockFS(ios.pod);
    expect(findPodspecName('')).toBe('TestPod');
  });

  it('returns podspec name that match packet directory', () => {
    mockFS({
      user: {
        PacketName: {
          'Another.podspec': 'empty',
          'PacketName.podspec': 'empty'
        }
      }
    });
    expect(findPodspecName('user/PacketName')).toBe('PacketName');
  });

  it('returns first podspec name if not match in directory', () => {
    mockFS({
      user: {
        packet: {
          'Another.podspec': 'empty',
          'PacketName.podspec': 'empty'
        }
      }
    });
    expect(findPodspecName('user/packet')).toBe('Another');
  });

  afterEach(() => {
    mockFS.restore();
  });

});
