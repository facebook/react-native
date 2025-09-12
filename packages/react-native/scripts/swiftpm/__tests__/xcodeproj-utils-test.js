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

const {
  convertXcodeProjectToJSON,
  deintegrateSwiftPM,
  generateXcodeObjectId,
} = require('../xcodeproj-utils');

// Mock child_process module
jest.mock('child_process');

// Mock crypto module
jest.mock('crypto');

describe('generateXcodeObjectId', () => {
  let mockCrypto;

  beforeEach(() => {
    // Setup mock
    mockCrypto = require('crypto');

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should generate a 24-character uppercase hexadecimal string', () => {
    // Setup - Mock crypto.randomBytes to return predictable data
    mockCrypto.randomBytes.mockReturnValue(
      Buffer.from([
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67,
      ]),
    );

    // Execute
    const result = generateXcodeObjectId();

    // Assert
    expect(result).toBe('0123456789ABCDEF01234567');
    expect(result).toHaveLength(24);
    expect(result).toMatch(/^[0-9A-F]+$/);
  });

  it('should call crypto.randomBytes with 12 bytes', () => {
    // Setup
    mockCrypto.randomBytes.mockReturnValue(
      Buffer.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
    );

    // Execute
    generateXcodeObjectId();

    // Assert
    expect(mockCrypto.randomBytes).toHaveBeenCalledWith(12);
    expect(mockCrypto.randomBytes).toHaveBeenCalledTimes(1);
  });

  it('should convert to uppercase hexadecimal', () => {
    // Setup - Mock with bytes that would produce lowercase hex
    mockCrypto.randomBytes.mockReturnValue(
      Buffer.from([
        0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x11,
      ]),
    );

    // Execute
    const result = generateXcodeObjectId();

    // Assert
    expect(result).toBe('ABCDEF123456789ABCDEF011');
    expect(result).not.toMatch(/[a-z]/); // Should not contain lowercase letters
  });

  it('should return a string type', () => {
    // Setup
    mockCrypto.randomBytes.mockReturnValue(
      Buffer.from([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
      ]),
    );

    // Execute
    const result = generateXcodeObjectId();

    // Assert
    expect(typeof result).toBe('string');
  });

  it('should not contain any non-hexadecimal characters', () => {
    // Setup
    mockCrypto.randomBytes.mockReturnValue(
      Buffer.from([
        0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x11, 0x22, 0x33, 0x44,
      ]),
    );

    // Execute
    const result = generateXcodeObjectId();

    // Assert
    expect(result).toMatch(/^[0-9A-F]{24}$/);
    expect(result).not.toMatch(/[G-Z]/); // Should not contain letters beyond F
    expect(result).not.toMatch(/[a-z]/); // Should not contain lowercase letters
    expect(result).not.toMatch(/[\s\-_]/); // Should not contain whitespace or special chars
  });

  it('should handle crypto.randomBytes errors gracefully', () => {
    // Setup
    mockCrypto.randomBytes.mockImplementation(() => {
      throw new Error('Crypto error');
    });

    // Execute & Assert
    expect(() => generateXcodeObjectId()).toThrow('Crypto error');
  });
});

describe('convertXcodeProjectToJSON', () => {
  let mockExecSync;

  beforeEach(() => {
    // Setup mock
    const childProcess = require('child_process');
    mockExecSync = childProcess.execSync;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should convert valid project file to JSON object', () => {
    // Setup
    const projectPath = '/path/to/project.pbxproj';
    const mockJsonOutput =
      '{"objects": {"123": {"isa": "PBXProject"}}, "archiveVersion": 1}';
    const expectedResult = {
      objects: {
        '123': {
          isa: 'PBXProject',
        },
      },
      archiveVersion: 1,
    };

    mockExecSync.mockReturnValue(mockJsonOutput);

    // Execute
    const result = convertXcodeProjectToJSON(projectPath);

    // Assert
    expect(result).toEqual(expectedResult);
    expect(mockExecSync).toHaveBeenCalledWith(
      'plutil -convert json -o - "/path/to/project.pbxproj"',
      {encoding: 'utf8'},
    );
    expect(mockExecSync).toHaveBeenCalledTimes(1);
  });

  it('should throw error when JSON parsing fails', () => {
    // Setup
    const projectPath = '/path/to/project.pbxproj';
    const invalidJsonOutput = '{"invalid": json}';

    mockExecSync.mockReturnValue(invalidJsonOutput);

    // Execute & Assert
    expect(() => convertXcodeProjectToJSON(projectPath)).toThrow();
    expect(mockExecSync).toHaveBeenCalledWith(
      'plutil -convert json -o - "/path/to/project.pbxproj"',
      {encoding: 'utf8'},
    );
  });

  it('should handle empty JSON object', () => {
    // Setup
    const projectPath = '/path/to/project.pbxproj';
    const mockJsonOutput = '{}';
    const expectedResult = {};

    mockExecSync.mockReturnValue(mockJsonOutput);

    // Execute
    const result = convertXcodeProjectToJSON(projectPath);

    // Assert
    expect(result).toEqual(expectedResult);
  });
});

describe('deintegrateSwiftPM', () => {
  let consoleLogSpy;

  beforeEach(() => {
    // Mock console.log to avoid output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should handle empty project without errors', () => {
    // Setup
    const emptyProject = {
      objects: {},
    };

    // Execute
    expect(() => deintegrateSwiftPM(emptyProject)).not.toThrow();

    // Assert
    expect(emptyProject.objects).toEqual({});
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✓ Removed 0 SwiftPM-related objects from Xcode project',
    );
  });

  it('should handle project with no SwiftPM dependencies', () => {
    // Setup
    const projectWithoutSwiftPM = {
      objects: {
        TARGET1: {
          isa: 'PBXNativeTarget',
          buildPhases: ['BUILDPHASE1'],
        },
        BUILDPHASE1: {
          isa: 'PBXFrameworksBuildPhase',
          files: ['FILE1'],
        },
        FILE1: {
          isa: 'PBXBuildFile',
          fileRef: 'FILEREF1',
        },
        FILEREF1: {
          isa: 'PBXFileReference',
          path: 'some_library.framework',
        },
        PROJECT1: {
          isa: 'PBXProject',
          packageReferences: [],
        },
      },
    };

    const originalObjects = JSON.parse(
      JSON.stringify(projectWithoutSwiftPM.objects),
    );

    // Execute
    deintegrateSwiftPM(projectWithoutSwiftPM);

    // Assert - No objects should be removed
    expect(projectWithoutSwiftPM.objects).toEqual(originalObjects);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✓ Removed 0 SwiftPM-related objects from Xcode project',
    );
  });

  it('should remove XCSwiftPackageProductDependency and related objects', () => {
    // Setup
    const projectWithSwiftPM = {
      objects: {
        TARGET1: {
          isa: 'PBXNativeTarget',
          buildPhases: ['BUILDPHASE1'],
        },
        BUILDPHASE1: {
          isa: 'PBXFrameworksBuildPhase',
          files: ['BUILDFILE1', 'BUILDFILE2'],
        },
        BUILDFILE1: {
          isa: 'PBXBuildFile',
          productRef: 'SWIFTPACKAGE1',
        },
        BUILDFILE2: {
          isa: 'PBXBuildFile',
          fileRef: 'NORMALFILE1',
        },
        SWIFTPACKAGE1: {
          isa: 'XCSwiftPackageProductDependency',
          packageName: 'SomeSwiftPackage',
        },
        NORMALFILE1: {
          isa: 'PBXFileReference',
          path: 'normal_file.framework',
        },
        PROJECT1: {
          isa: 'PBXProject',
          packageReferences: ['PACKAGEREF1'],
        },
        PACKAGEREF1: {
          isa: 'XCLocalSwiftPackageReference',
          relativePath: '../SomeSwiftPackage',
        },
      },
    };

    // Execute
    deintegrateSwiftPM(projectWithSwiftPM);

    // Assert
    expect(projectWithSwiftPM.objects).toEqual({
      TARGET1: {
        isa: 'PBXNativeTarget',
        buildPhases: ['BUILDPHASE1'],
      },
      BUILDPHASE1: {
        isa: 'PBXFrameworksBuildPhase',
        files: ['BUILDFILE2'],
      },
      BUILDFILE2: {
        isa: 'PBXBuildFile',
        fileRef: 'NORMALFILE1',
      },
      NORMALFILE1: {
        isa: 'PBXFileReference',
        path: 'normal_file.framework',
      },
      PROJECT1: {
        isa: 'PBXProject',
        packageReferences: [],
      },
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✓ Removed 3 SwiftPM-related objects from Xcode project',
    );
  });

  it('should handle multiple targets with SwiftPM dependencies', () => {
    // Setup
    const projectWithMultipleTargets = {
      objects: {
        TARGET1: {
          isa: 'PBXNativeTarget',
          buildPhases: ['BUILDPHASE1'],
        },
        TARGET2: {
          isa: 'PBXNativeTarget',
          buildPhases: ['BUILDPHASE2'],
        },
        BUILDPHASE1: {
          isa: 'PBXFrameworksBuildPhase',
          files: ['BUILDFILE1'],
        },
        BUILDPHASE2: {
          isa: 'PBXFrameworksBuildPhase',
          files: ['BUILDFILE2'],
        },
        BUILDFILE1: {
          isa: 'PBXBuildFile',
          productRef: 'SWIFTPACKAGE1',
        },
        BUILDFILE2: {
          isa: 'PBXBuildFile',
          productRef: 'SWIFTPACKAGE2',
        },
        SWIFTPACKAGE1: {
          isa: 'XCSwiftPackageProductDependency',
          packageName: 'Package1',
        },
        SWIFTPACKAGE2: {
          isa: 'XCSwiftPackageProductDependency',
          packageName: 'Package2',
        },
        PROJECT1: {
          isa: 'PBXProject',
          packageReferences: ['PACKAGEREF1', 'PACKAGEREF2'],
        },
        PACKAGEREF1: {
          isa: 'XCLocalSwiftPackageReference',
          relativePath: '../Package1',
        },
        PACKAGEREF2: {
          isa: 'XCLocalSwiftPackageReference',
          relativePath: '../Package2',
        },
      },
    };

    // Execute
    deintegrateSwiftPM(projectWithMultipleTargets);

    // Assert
    expect(projectWithMultipleTargets.objects).toEqual({
      TARGET1: {
        isa: 'PBXNativeTarget',
        buildPhases: ['BUILDPHASE1'],
      },
      TARGET2: {
        isa: 'PBXNativeTarget',
        buildPhases: ['BUILDPHASE2'],
      },
      BUILDPHASE1: {
        isa: 'PBXFrameworksBuildPhase',
        files: [],
      },
      BUILDPHASE2: {
        isa: 'PBXFrameworksBuildPhase',
        files: [],
      },
      PROJECT1: {
        isa: 'PBXProject',
        packageReferences: [],
      },
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✓ Removed 6 SwiftPM-related objects from Xcode project',
    );
  });

  it('should preserve non-SwiftPM package references', () => {
    // Setup
    const projectWithMixedPackages = {
      objects: {
        PROJECT1: {
          isa: 'PBXProject',
          packageReferences: ['LOCALPACKAGE1', 'REMOTEPACKAGE1'],
        },
        LOCALPACKAGE1: {
          isa: 'XCLocalSwiftPackageReference',
          relativePath: '../LocalPackage',
        },
        REMOTEPACKAGE1: {
          isa: 'XCRemoteSwiftPackageReference',
          repositoryURL: 'https://github.com/example/package.git',
        },
      },
    };

    // Execute
    deintegrateSwiftPM(projectWithMixedPackages);

    // Assert
    expect(projectWithMixedPackages.objects).toEqual({
      PROJECT1: {
        isa: 'PBXProject',
        packageReferences: ['REMOTEPACKAGE1'],
      },
      REMOTEPACKAGE1: {
        isa: 'XCRemoteSwiftPackageReference',
        repositoryURL: 'https://github.com/example/package.git',
      },
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✓ Removed 1 SwiftPM-related objects from Xcode project',
    );
  });

  it('should handle missing referenced objects gracefully', () => {
    // Setup - Project with references to non-existent objects
    const projectWithMissingRefs = {
      objects: {
        TARGET1: {
          isa: 'PBXNativeTarget',
          buildPhases: ['MISSING_BUILDPHASE'],
        },
        BUILDPHASE1: {
          isa: 'PBXFrameworksBuildPhase',
          files: ['MISSING_BUILDFILE'],
        },
        BUILDFILE1: {
          isa: 'PBXBuildFile',
          productRef: 'MISSING_PRODUCT',
        },
        PROJECT1: {
          isa: 'PBXProject',
          packageReferences: ['MISSING_PACKAGE'],
        },
      },
    };

    const originalObjects = JSON.parse(
      JSON.stringify(projectWithMissingRefs.objects),
    );

    // Execute
    expect(() => deintegrateSwiftPM(projectWithMissingRefs)).not.toThrow();

    // Assert - No changes should be made to existing objects
    expect(projectWithMissingRefs.objects).toEqual(originalObjects);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✓ Removed 0 SwiftPM-related objects from Xcode project',
    );
  });

  it('should handle non-PBXFrameworksBuildPhase build phases', () => {
    // Setup
    const projectWithMixedBuildPhases = {
      objects: {
        TARGET1: {
          isa: 'PBXNativeTarget',
          buildPhases: ['SOURCES_PHASE', 'FRAMEWORKS_PHASE'],
        },
        SOURCES_PHASE: {
          isa: 'PBXSourcesBuildPhase',
          files: ['SOURCE_FILE1'],
        },
        FRAMEWORKS_PHASE: {
          isa: 'PBXFrameworksBuildPhase',
          files: ['BUILDFILE1'],
        },
        SOURCE_FILE1: {
          isa: 'PBXBuildFile',
          fileRef: 'SOURCE_REF1',
        },
        BUILDFILE1: {
          isa: 'PBXBuildFile',
          productRef: 'SWIFTPACKAGE1',
        },
        SOURCE_REF1: {
          isa: 'PBXFileReference',
          path: 'source.swift',
        },
        SWIFTPACKAGE1: {
          isa: 'XCSwiftPackageProductDependency',
          packageName: 'Package1',
        },
        PROJECT1: {
          isa: 'PBXProject',
          packageReferences: [],
        },
      },
    };

    // Execute
    deintegrateSwiftPM(projectWithMixedBuildPhases);

    // Assert - Only frameworks build phase should be affected
    expect(projectWithMixedBuildPhases.objects).toEqual({
      TARGET1: {
        isa: 'PBXNativeTarget',
        buildPhases: ['SOURCES_PHASE', 'FRAMEWORKS_PHASE'],
      },
      SOURCES_PHASE: {
        isa: 'PBXSourcesBuildPhase',
        files: ['SOURCE_FILE1'],
      },
      FRAMEWORKS_PHASE: {
        isa: 'PBXFrameworksBuildPhase',
        files: [],
      },
      SOURCE_FILE1: {
        isa: 'PBXBuildFile',
        fileRef: 'SOURCE_REF1',
      },
      SOURCE_REF1: {
        isa: 'PBXFileReference',
        path: 'source.swift',
      },
      PROJECT1: {
        isa: 'PBXProject',
        packageReferences: [],
      },
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✓ Removed 2 SwiftPM-related objects from Xcode project',
    );
  });
});
