/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const {integrateSwiftPackagesInXcode} = require('../update-xcodeproject');
const fs = require('fs');
const path = require('path');

// Mock fs module
jest.mock('fs');

// Mock xcodeproj-utils module
jest.mock('../xcodeproj-utils', () => ({
  addLocalSwiftPM: jest.fn(),
  convertXcodeProjectToJSON: jest.fn(),
  deintegrateSwiftPM: jest.fn(),
  updateXcodeProject: jest.fn(),
}));

describe('integrateSwiftPackagesInXcode', () => {
  let mockConvertXcodeProjectToJSON;
  let mockDeintegrateSwiftPM;
  let mockAddLocalSwiftPM;
  let mockUpdateXcodeProject;
  let mockExistsSync;
  let mockWriteFileSync;

  beforeEach(() => {
    // Setup mocks
    const xcodeprjUtils = require('../xcodeproj-utils');
    mockConvertXcodeProjectToJSON = xcodeprjUtils.convertXcodeProjectToJSON;
    mockDeintegrateSwiftPM = xcodeprjUtils.deintegrateSwiftPM;
    mockAddLocalSwiftPM = xcodeprjUtils.addLocalSwiftPM;
    mockUpdateXcodeProject = xcodeprjUtils.updateXcodeProject;

    mockExistsSync = fs.existsSync;
    mockWriteFileSync = fs.writeFileSync;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should integrate single Swift package into Xcode project', () => {
    // Setup
    const xcodeProjectPath = '/path/to/MyApp.xcodeproj';
    const packageSwiftObjects = [
      {
        relativePath: '../MyPackage',
        targets: ['MyLibrary'],
      },
    ];
    const appTargetName = 'MyApp';

    const mockXcodeProject = {
      objects: {
        PROJECT1: {
          isa: 'PBXProject',
        },
      },
    };

    const mockUpdatedProjectContent = 'UPDATED_PROJECT_CONTENT';

    mockExistsSync.mockReturnValue(true);
    mockConvertXcodeProjectToJSON.mockReturnValue(mockXcodeProject);
    mockUpdateXcodeProject.mockReturnValue(mockUpdatedProjectContent);

    // Execute
    integrateSwiftPackagesInXcode(
      xcodeProjectPath,
      packageSwiftObjects,
      appTargetName,
    );

    // Assert
    expect(mockExistsSync).toHaveBeenCalledWith(
      path.join(xcodeProjectPath, 'project.pbxproj'),
    );
    expect(mockConvertXcodeProjectToJSON).toHaveBeenCalledWith(
      path.join(xcodeProjectPath, 'project.pbxproj'),
    );
    expect(mockDeintegrateSwiftPM).toHaveBeenCalledWith(mockXcodeProject);
    expect(mockAddLocalSwiftPM).toHaveBeenCalledTimes(1);
    expect(mockAddLocalSwiftPM).toHaveBeenCalledWith(
      '../MyPackage',
      ['MyLibrary'],
      mockXcodeProject,
      appTargetName,
    );
    expect(mockUpdateXcodeProject).toHaveBeenCalledWith(
      mockXcodeProject,
      path.join(xcodeProjectPath, 'project.pbxproj'),
    );
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      path.join(xcodeProjectPath, 'project.pbxproj'),
      mockUpdatedProjectContent,
    );
  });

  it('should integrate multiple Swift packages into Xcode project', () => {
    // Setup
    const xcodeProjectPath = '/path/to/MyApp.xcodeproj';
    const packageSwiftObjects = [
      {
        relativePath: '../Package1',
        targets: ['Library1'],
      },
      {
        relativePath: '../Package2',
        targets: ['Library2A', 'Library2B'],
      },
      {
        relativePath: '../Package3',
        targets: ['Library3'],
      },
    ];
    const appTargetName = 'MyApp';

    const mockXcodeProject = {
      objects: {
        PROJECT1: {
          isa: 'PBXProject',
        },
      },
    };

    const mockUpdatedProjectContent = 'UPDATED_PROJECT_CONTENT';

    mockExistsSync.mockReturnValue(true);
    mockConvertXcodeProjectToJSON.mockReturnValue(mockXcodeProject);
    mockUpdateXcodeProject.mockReturnValue(mockUpdatedProjectContent);

    // Execute
    integrateSwiftPackagesInXcode(
      xcodeProjectPath,
      packageSwiftObjects,
      appTargetName,
    );

    // Assert
    expect(mockAddLocalSwiftPM).toHaveBeenCalledTimes(3);
    expect(mockAddLocalSwiftPM).toHaveBeenNthCalledWith(
      1,
      '../Package1',
      ['Library1'],
      mockXcodeProject,
      appTargetName,
    );
    expect(mockAddLocalSwiftPM).toHaveBeenNthCalledWith(
      2,
      '../Package2',
      ['Library2A', 'Library2B'],
      mockXcodeProject,
      appTargetName,
    );
    expect(mockAddLocalSwiftPM).toHaveBeenNthCalledWith(
      3,
      '../Package3',
      ['Library3'],
      mockXcodeProject,
      appTargetName,
    );
  });

  it('should handle empty package list without errors', () => {
    // Setup
    const xcodeProjectPath = '/path/to/MyApp.xcodeproj';
    const packageSwiftObjects = [];
    const appTargetName = 'MyApp';

    const mockXcodeProject = {
      objects: {
        PROJECT1: {
          isa: 'PBXProject',
        },
      },
    };

    const mockUpdatedProjectContent = 'UPDATED_PROJECT_CONTENT';

    mockExistsSync.mockReturnValue(true);
    mockConvertXcodeProjectToJSON.mockReturnValue(mockXcodeProject);
    mockUpdateXcodeProject.mockReturnValue(mockUpdatedProjectContent);

    // Execute
    integrateSwiftPackagesInXcode(
      xcodeProjectPath,
      packageSwiftObjects,
      appTargetName,
    );

    // Assert
    expect(mockDeintegrateSwiftPM).toHaveBeenCalledWith(mockXcodeProject);
    expect(mockAddLocalSwiftPM).not.toHaveBeenCalled();
    expect(mockUpdateXcodeProject).toHaveBeenCalledWith(
      mockXcodeProject,
      path.join(xcodeProjectPath, 'project.pbxproj'),
    );
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      path.join(xcodeProjectPath, 'project.pbxproj'),
      mockUpdatedProjectContent,
    );
  });

  it('should throw error when project.pbxproj file does not exist', () => {
    // Setup
    const xcodeProjectPath = '/path/to/NonExistent.xcodeproj';
    const packageSwiftObjects = [
      {
        relativePath: '../MyPackage',
        targets: ['MyLibrary'],
      },
    ];
    const appTargetName = 'MyApp';

    mockExistsSync.mockReturnValue(false);

    // Execute & Assert
    expect(() =>
      integrateSwiftPackagesInXcode(
        xcodeProjectPath,
        packageSwiftObjects,
        appTargetName,
      ),
    ).toThrow(
      'Project file not found: /path/to/NonExistent.xcodeproj/project.pbxproj',
    );

    expect(mockExistsSync).toHaveBeenCalledWith(
      '/path/to/NonExistent.xcodeproj/project.pbxproj',
    );
    expect(mockConvertXcodeProjectToJSON).not.toHaveBeenCalled();
    expect(mockDeintegrateSwiftPM).not.toHaveBeenCalled();
    expect(mockAddLocalSwiftPM).not.toHaveBeenCalled();
    expect(mockUpdateXcodeProject).not.toHaveBeenCalled();
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('should handle package with multiple targets correctly', () => {
    // Setup
    const xcodeProjectPath = '/path/to/MyApp.xcodeproj';
    const packageSwiftObjects = [
      {
        relativePath: '../MultiTargetPackage',
        targets: ['Core', 'Extensions', 'Utils', 'TestHelpers'],
      },
    ];
    const appTargetName = 'MyApp';

    const mockXcodeProject = {
      objects: {
        PROJECT1: {
          isa: 'PBXProject',
        },
      },
    };

    const mockUpdatedProjectContent = 'UPDATED_PROJECT_CONTENT';

    mockExistsSync.mockReturnValue(true);
    mockConvertXcodeProjectToJSON.mockReturnValue(mockXcodeProject);
    mockUpdateXcodeProject.mockReturnValue(mockUpdatedProjectContent);

    // Execute
    integrateSwiftPackagesInXcode(
      xcodeProjectPath,
      packageSwiftObjects,
      appTargetName,
    );

    // Assert
    expect(mockAddLocalSwiftPM).toHaveBeenCalledTimes(1);
    expect(mockAddLocalSwiftPM).toHaveBeenCalledWith(
      '../MultiTargetPackage',
      ['Core', 'Extensions', 'Utils', 'TestHelpers'],
      mockXcodeProject,
      appTargetName,
    );
  });
});
