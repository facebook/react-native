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

const {findXcodeProjectDirectory} = require('../prepare-app-utils');

// Mock child_process module
jest.mock('child_process');

describe('findXcodeProjectDirectory', () => {
  let mockExecSync;

  beforeEach(() => {
    // Setup mock
    const childProcess = require('child_process');
    mockExecSync = childProcess.execSync;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should find Xcode project directory successfully', () => {
    // Setup
    const appPath = '/path/to/app';
    const xcodeProjectName = 'MyApp.xcodeproj';
    const mockResult = '/path/to/app/ios/MyApp.xcodeproj';

    mockExecSync.mockReturnValue(mockResult + '\n');

    // Execute
    const result = findXcodeProjectDirectory(appPath, xcodeProjectName);

    // Assert
    expect(result).toBe('/path/to/app/ios');
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${appPath}" -name "${xcodeProjectName}" -type d -print`,
      {encoding: 'utf8'},
    );
    expect(mockExecSync).toHaveBeenCalledTimes(1);
  });

  it('should find Xcode project in nested subdirectory', () => {
    // Setup
    const appPath = '/Users/developer/ReactNativeApp';
    const xcodeProjectName = 'ReactNativeApp.xcodeproj';
    const mockResult =
      '/Users/developer/ReactNativeApp/ios/sub/ReactNativeApp.xcodeproj';

    mockExecSync.mockReturnValue(mockResult + '\n');

    // Execute
    const result = findXcodeProjectDirectory(appPath, xcodeProjectName);

    // Assert
    expect(result).toBe('/Users/developer/ReactNativeApp/ios/sub');
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${appPath}" -name "${xcodeProjectName}" -type d -print`,
      {encoding: 'utf8'},
    );
  });

  it('should handle project found at root level', () => {
    // Setup
    const appPath = '/path/to/project';
    const xcodeProjectName = 'RootProject.xcodeproj';
    const mockResult = '/path/to/project/RootProject.xcodeproj';

    mockExecSync.mockReturnValue(mockResult + '\n');

    // Execute
    const result = findXcodeProjectDirectory(appPath, xcodeProjectName);

    // Assert
    expect(result).toBe('/path/to/project');
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${appPath}" -name "${xcodeProjectName}" -type d -print`,
      {encoding: 'utf8'},
    );
  });

  it('should handle paths with spaces in directory names', () => {
    // Setup
    const appPath = '/path/to/my app';
    const xcodeProjectName = 'My App.xcodeproj';
    const mockResult = '/path/to/my app/ios folder/My App.xcodeproj';

    mockExecSync.mockReturnValue(mockResult + '\n');

    // Execute
    const result = findXcodeProjectDirectory(appPath, xcodeProjectName);

    // Assert
    expect(result).toBe('/path/to/my app/ios folder');
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${appPath}" -name "${xcodeProjectName}" -type d -print`,
      {encoding: 'utf8'},
    );
  });

  it('should throw error when Xcode project is not found', () => {
    // Setup
    const appPath = '/path/to/app';
    const xcodeProjectName = 'NonExistent.xcodeproj';

    mockExecSync.mockReturnValue('');

    // Execute & Assert
    expect(() => findXcodeProjectDirectory(appPath, xcodeProjectName)).toThrow(
      `Xcode project 'NonExistent.xcodeproj' not found in '/path/to/app' or its subdirectories`,
    );

    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${appPath}" -name "${xcodeProjectName}" -type d -print`,
      {encoding: 'utf8'},
    );
  });

  it('should throw error when find command returns only whitespace', () => {
    // Setup
    const appPath = '/path/to/app';
    const xcodeProjectName = 'Missing.xcodeproj';

    mockExecSync.mockReturnValue('   \n   \t   ');

    // Execute & Assert
    expect(() => findXcodeProjectDirectory(appPath, xcodeProjectName)).toThrow(
      `Xcode project 'Missing.xcodeproj' not found in '/path/to/app' or its subdirectories`,
    );
  });

  it('should properly escape quotes in app path', () => {
    // Setup
    const appPath = '/path/to/app with "quotes"';
    const xcodeProjectName = 'MyApp.xcodeproj';
    const mockResult = '/path/to/app with "quotes"/ios/MyApp.xcodeproj';

    mockExecSync.mockReturnValue(mockResult + '\n');

    // Execute
    const result = findXcodeProjectDirectory(appPath, xcodeProjectName);

    // Assert
    expect(result).toBe('/path/to/app with "quotes"/ios');
    expect(mockExecSync).toHaveBeenCalledWith(
      `find "${appPath}" -name "${xcodeProjectName}" -type d -print`,
      {encoding: 'utf8'},
    );
  });
});
