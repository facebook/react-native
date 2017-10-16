'use strict';

jest.mock('fs');

const findPodspecName = require('../../ios/findPodspecName');
const fs = require('fs');
const projects = require('../../__fixtures__/projects');
const ios = require('../../__fixtures__/ios');

describe('ios::findPodspecName', () => {
  it('returns null if there is not podspec file', () => {
    fs.__setMockFilesystem(projects.flat);
    expect(findPodspecName('')).toBeNull();
  });

  it('returns podspec name if only one exists', () => {
    fs.__setMockFilesystem(ios.pod);
    expect(findPodspecName('/')).toBe('TestPod');
  });

  it('returns podspec name that match packet directory', () => {
    fs.__setMockFilesystem({
      user: {
        PacketName: {
          'Another.podspec': 'empty',
          'PacketName.podspec': 'empty'
        }
      }
    });
    expect(findPodspecName('/user/PacketName')).toBe('PacketName');
  });

  it('returns first podspec name if not match in directory', () => {
    fs.__setMockFilesystem({
      user: {
        packet: {
          'Another.podspec': 'empty',
          'PacketName.podspec': 'empty'
        }
      }
    });
    expect(findPodspecName('/user/packet')).toBe('Another');
  });
});
