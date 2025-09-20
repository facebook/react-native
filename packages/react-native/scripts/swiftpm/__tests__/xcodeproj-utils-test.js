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
  addLocalSwiftPM,
  convertXcodeProjectToJSON,
  deintegrateSwiftPM,
  printFilesForBuildPhase,
  printPBXBuildFile,
  printXCLocalSwiftPackageReference,
  printXCSwiftPackageProductDependency,
} = require('../xcodeproj-utils');

// Mock child_process module
jest.mock('child_process');

// Mock xcodeproj-core-utils module
jest.mock('../xcodeproj-core-utils');

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

describe('printPBXBuildFile', () => {
  it('should format PBXBuildFile with productRef correctly', () => {
    // Setup
    const objectId = 'BUILDFILE123';
    const objectData = {
      isa: 'PBXBuildFile',
      productRef: 'PRODUCT456',
    };
    const allObjects = {
      PRODUCT456: {
        isa: 'XCSwiftPackageProductDependency',
        productName: 'Alamofire',
      },
    };

    // Execute
    const result = printPBXBuildFile(objectId, objectData, allObjects);

    // Assert
    expect(result).toBe(
      '\t\tBUILDFILE123 /* Alamofire in Frameworks */ = {isa = PBXBuildFile; productRef = PRODUCT456 /* Alamofire */; };\n',
    );
  });

  it('should format PBXBuildFile with fileRef correctly', () => {
    // Setup
    const objectId = 'BUILDFILE789';
    const objectData = {
      isa: 'PBXBuildFile',
      fileRef: 'FILEREF123',
    };
    const allObjects = {
      FILEREF123: {
        isa: 'PBXFileReference',
        name: 'MyFramework.framework',
      },
      FRAMEWORKS_PHASE: {
        isa: 'PBXFrameworksBuildPhase',
        files: ['BUILDFILE789'],
      },
    };

    // Execute
    const result = printPBXBuildFile(objectId, objectData, allObjects);

    // Assert
    expect(result).toBe(
      '\t\tBUILDFILE789 /* MyFramework.framework in Frameworks */ = {isa = PBXBuildFile; fileRef = FILEREF123 /* MyFramework.framework */; };\n',
    );
  });

  it('should use file path when name is not available', () => {
    // Setup
    const objectId = 'BUILDFILE789';
    const objectData = {
      isa: 'PBXBuildFile',
      fileRef: 'FILEREF456',
    };
    const allObjects = {
      FILEREF456: {
        isa: 'PBXFileReference',
        path: 'path/to/MyLib.framework',
      },
      SOURCES_PHASE: {
        isa: 'PBXSourcesBuildPhase',
        files: ['BUILDFILE789'],
      },
    };

    // Execute
    const result = printPBXBuildFile(objectId, objectData, allObjects);

    // Assert
    expect(result).toBe(
      '\t\tBUILDFILE789 /* path/to/MyLib.framework in Sources */ = {isa = PBXBuildFile; fileRef = FILEREF456 /* path/to/MyLib.framework */; };\n',
    );
  });

  it('should identify different build phase types correctly', () => {
    // Setup
    const objectId = 'BUILDFILE999';
    const objectData = {
      isa: 'PBXBuildFile',
      fileRef: 'FILEREF999',
    };
    const allObjects = {
      FILEREF999: {
        isa: 'PBXFileReference',
        name: 'Script.sh',
      },
      SHELL_PHASE: {
        isa: 'PBXShellScriptBuildPhase',
        files: ['BUILDFILE999'],
      },
    };

    // Execute
    const result = printPBXBuildFile(objectId, objectData, allObjects);

    // Assert
    expect(result).toBe(
      '\t\tBUILDFILE999 /* Script.sh in ShellScript */ = {isa = PBXBuildFile; fileRef = FILEREF999 /* Script.sh */; };\n',
    );
  });
});

describe('printFilesForBuildPhase', () => {
  it('should format build file with productRef correctly', () => {
    // Setup
    const objectId = 'BUILDFILE123';
    const objectData = {
      isa: 'PBXBuildFile',
      productRef: 'PRODUCT456',
    };
    const allObjects = {
      PRODUCT456: {
        isa: 'XCSwiftPackageProductDependency',
        productName: 'Alamofire',
      },
    };

    // Execute
    const result = printFilesForBuildPhase(objectId, objectData, allObjects);

    // Assert
    expect(result).toBe(
      '\t\t\t\tBUILDFILE123 /* Alamofire in Frameworks */,\n',
    );
  });

  it('should format build file with fileRef correctly', () => {
    // Setup
    const objectId = 'BUILDFILE789';
    const objectData = {
      isa: 'PBXBuildFile',
      fileRef: 'FILEREF123',
    };
    const allObjects = {
      FILEREF123: {
        isa: 'PBXFileReference',
        name: 'MyFramework.framework',
      },
    };

    // Execute
    const result = printFilesForBuildPhase(objectId, objectData, allObjects);

    // Assert
    expect(result).toBe(
      '\t\t\t\tBUILDFILE789 /* MyFramework.framework in Frameworks */,\n',
    );
  });

  it('should use file path when name is not available', () => {
    // Setup
    const objectId = 'BUILDFILE789';
    const objectData = {
      isa: 'PBXBuildFile',
      fileRef: 'FILEREF456',
    };
    const allObjects = {
      FILEREF456: {
        isa: 'PBXFileReference',
        path: 'path/to/MyLib.framework',
      },
    };

    // Execute
    const result = printFilesForBuildPhase(objectId, objectData, allObjects);

    // Assert
    expect(result).toBe(
      '\t\t\t\tBUILDFILE789 /* path/to/MyLib.framework in Frameworks */,\n',
    );
  });
});

describe('printXCLocalSwiftPackageReference', () => {
  it('should format XCLocalSwiftPackageReference correctly', () => {
    // Setup
    const objectId = 'PACKAGE123';
    const objectData = {
      isa: 'XCLocalSwiftPackageReference',
      relativePath: '../MySwiftPackage',
    };
    const allObjects = {};

    // Execute
    const result = printXCLocalSwiftPackageReference(
      objectId,
      objectData,
      allObjects,
    );

    // Assert
    const expected = `\t\tPACKAGE123 /* XCLocalSwiftPackageReference "../MySwiftPackage" */ = {
\t\t\tisa = XCLocalSwiftPackageReference;
\t\t\trelativePath = ../MySwiftPackage;
\t\t};
`;
    expect(result).toBe(expected);
  });

  it('should escape path with quotes when it contains spaces', () => {
    // Setup
    const objectId = 'PACKAGE456';
    const objectData = {
      isa: 'XCLocalSwiftPackageReference',
      relativePath: '../My Swift Package',
    };
    const allObjects = {};

    // Execute
    const result = printXCLocalSwiftPackageReference(
      objectId,
      objectData,
      allObjects,
    );

    // Assert
    const expected = `\t\tPACKAGE456 /* XCLocalSwiftPackageReference "../My Swift Package" */ = {
\t\t\tisa = XCLocalSwiftPackageReference;
\t\t\trelativePath = "../My Swift Package";
\t\t};
`;
    expect(result).toBe(expected);
  });

  it('should handle absolute path', () => {
    // Setup
    const objectId = 'PACKAGE999';
    const objectData = {
      isa: 'XCLocalSwiftPackageReference',
      relativePath: '/absolute/path/to/package',
    };
    const allObjects = {};

    // Execute
    const result = printXCLocalSwiftPackageReference(
      objectId,
      objectData,
      allObjects,
    );

    // Assert
    const expected = `\t\tPACKAGE999 /* XCLocalSwiftPackageReference "/absolute/path/to/package" */ = {
\t\t\tisa = XCLocalSwiftPackageReference;
\t\t\trelativePath = /absolute/path/to/package;
\t\t};
`;
    expect(result).toBe(expected);
  });
});

describe('printXCSwiftPackageProductDependency', () => {
  it('should format XCSwiftPackageProductDependency correctly', () => {
    // Setup
    const objectId = 'PRODUCT123';
    const objectData = {
      isa: 'XCSwiftPackageProductDependency',
      productName: 'Alamofire',
    };
    const allObjects = {};

    // Execute
    const result = printXCSwiftPackageProductDependency(
      objectId,
      objectData,
      allObjects,
    );

    // Assert
    const expected = `\t\tPRODUCT123 /* Alamofire */ = {
\t\t\tisa = XCSwiftPackageProductDependency;
\t\t\tproductName = Alamofire;
\t\t};
`;
    expect(result).toBe(expected);
  });
});

describe('addLocalSwiftPM', () => {
  let mockGenerateXcodeObjectId;

  beforeEach(() => {
    // Setup mock for generateXcodeObjectId
    const xcodeprjCoreUtils = require('../xcodeproj-core-utils');
    mockGenerateXcodeObjectId = xcodeprjCoreUtils.generateXcodeObjectId;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should add local SwiftPM package with single product to Xcode project', () => {
    // Setup
    let idCounter = 0;
    mockGenerateXcodeObjectId.mockImplementation(() => {
      idCounter++;
      return `GENERATED_ID_${idCounter}`;
    });

    const xcodeProject = {
      objects: {
        PROJECT1: {
          isa: 'PBXProject',
          packageReferences: [],
        },
        TARGET1: {
          isa: 'PBXNativeTarget',
          name: 'MyApp',
          buildPhases: ['FRAMEWORKS_PHASE1'],
        },
        FRAMEWORKS_PHASE1: {
          isa: 'PBXFrameworksBuildPhase',
          files: [],
        },
      },
    };

    const relativePath = '../MySwiftPackage';
    const productNames = ['MyLibrary'];
    const targetName = 'MyApp';

    // Execute
    addLocalSwiftPM(relativePath, productNames, xcodeProject, targetName);

    // Assert
    expect(mockGenerateXcodeObjectId).toHaveBeenCalledTimes(3);

    expect(xcodeProject.objects).toEqual({
      PROJECT1: {
        isa: 'PBXProject',
        packageReferences: ['GENERATED_ID_1'],
      },
      TARGET1: {
        isa: 'PBXNativeTarget',
        name: 'MyApp',
        buildPhases: ['FRAMEWORKS_PHASE1'],
      },
      FRAMEWORKS_PHASE1: {
        isa: 'PBXFrameworksBuildPhase',
        files: ['GENERATED_ID_3'],
      },
      GENERATED_ID_1: {
        isa: 'XCLocalSwiftPackageReference',
        relativePath: '../MySwiftPackage',
      },
      GENERATED_ID_2: {
        isa: 'XCSwiftPackageProductDependency',
        productName: 'MyLibrary',
      },
      GENERATED_ID_3: {
        isa: 'PBXBuildFile',
        productRef: 'GENERATED_ID_2',
      },
    });
  });

  it('should add local SwiftPM package with multiple products to Xcode project', () => {
    // Setup
    let idCounter = 0;
    mockGenerateXcodeObjectId.mockImplementation(() => {
      idCounter++;
      return `GENERATED_ID_${idCounter}`;
    });

    const xcodeProject = {
      objects: {
        PROJECT1: {
          isa: 'PBXProject',
          packageReferences: [],
        },
        TARGET1: {
          isa: 'PBXNativeTarget',
          name: 'MyApp',
          buildPhases: ['FRAMEWORKS_PHASE1'],
        },
        FRAMEWORKS_PHASE1: {
          isa: 'PBXFrameworksBuildPhase',
          files: [],
        },
      },
    };

    const relativePath = '../MySwiftPackage';
    const productNames = ['Library1', 'Library2', 'Library3'];
    const targetName = 'MyApp';

    // Execute
    addLocalSwiftPM(relativePath, productNames, xcodeProject, targetName);

    // Assert
    expect(mockGenerateXcodeObjectId).toHaveBeenCalledTimes(7); // 1 package ref + 3 products + 3 build files

    expect(xcodeProject.objects).toEqual({
      PROJECT1: {
        isa: 'PBXProject',
        packageReferences: ['GENERATED_ID_1'],
      },
      TARGET1: {
        isa: 'PBXNativeTarget',
        name: 'MyApp',
        buildPhases: ['FRAMEWORKS_PHASE1'],
      },
      FRAMEWORKS_PHASE1: {
        isa: 'PBXFrameworksBuildPhase',
        files: ['GENERATED_ID_3', 'GENERATED_ID_5', 'GENERATED_ID_7'],
      },
      GENERATED_ID_1: {
        isa: 'XCLocalSwiftPackageReference',
        relativePath: '../MySwiftPackage',
      },
      GENERATED_ID_2: {
        isa: 'XCSwiftPackageProductDependency',
        productName: 'Library1',
      },
      GENERATED_ID_3: {
        isa: 'PBXBuildFile',
        productRef: 'GENERATED_ID_2',
      },
      GENERATED_ID_4: {
        isa: 'XCSwiftPackageProductDependency',
        productName: 'Library2',
      },
      GENERATED_ID_5: {
        isa: 'PBXBuildFile',
        productRef: 'GENERATED_ID_4',
      },
      GENERATED_ID_6: {
        isa: 'XCSwiftPackageProductDependency',
        productName: 'Library3',
      },
      GENERATED_ID_7: {
        isa: 'PBXBuildFile',
        productRef: 'GENERATED_ID_6',
      },
    });
  });

  it('should create packageReferences array if it does not exist', () => {
    // Setup
    let idCounter = 0;
    mockGenerateXcodeObjectId.mockImplementation(() => {
      idCounter++;
      return `GENERATED_ID_${idCounter}`;
    });

    const xcodeProject = {
      objects: {
        PROJECT1: {
          isa: 'PBXProject',
          // No packageReferences property
        },
        TARGET1: {
          isa: 'PBXNativeTarget',
          name: 'MyApp',
          buildPhases: ['FRAMEWORKS_PHASE1'],
        },
        FRAMEWORKS_PHASE1: {
          isa: 'PBXFrameworksBuildPhase',
          files: [],
        },
      },
    };

    const relativePath = '../MySwiftPackage';
    const productNames = ['MyLibrary'];
    const targetName = 'MyApp';

    // Execute
    addLocalSwiftPM(relativePath, productNames, xcodeProject, targetName);

    // Assert
    expect(xcodeProject.objects.PROJECT1.packageReferences).toEqual([
      'GENERATED_ID_1',
    ]);
  });

  it('should create files array in build phase if it does not exist', () => {
    // Setup
    let idCounter = 0;
    mockGenerateXcodeObjectId.mockImplementation(() => {
      idCounter++;
      return `GENERATED_ID_${idCounter}`;
    });

    const xcodeProject = {
      objects: {
        PROJECT1: {
          isa: 'PBXProject',
          packageReferences: [],
        },
        TARGET1: {
          isa: 'PBXNativeTarget',
          name: 'MyApp',
          buildPhases: ['FRAMEWORKS_PHASE1'],
        },
        FRAMEWORKS_PHASE1: {
          isa: 'PBXFrameworksBuildPhase',
          // No files property
        },
      },
    };

    const relativePath = '../MySwiftPackage';
    const productNames = ['MyLibrary'];
    const targetName = 'MyApp';

    // Execute
    addLocalSwiftPM(relativePath, productNames, xcodeProject, targetName);

    // Assert
    expect(xcodeProject.objects.FRAMEWORKS_PHASE1.files).toEqual([
      'GENERATED_ID_3',
    ]);
  });

  it('should add to existing packageReferences and files arrays', () => {
    // Setup
    let idCounter = 0;
    mockGenerateXcodeObjectId.mockImplementation(() => {
      idCounter++;
      return `GENERATED_ID_${idCounter}`;
    });

    const xcodeProject = {
      objects: {
        PROJECT1: {
          isa: 'PBXProject',
          packageReferences: ['EXISTING_PACKAGE1'],
        },
        TARGET1: {
          isa: 'PBXNativeTarget',
          name: 'MyApp',
          buildPhases: ['FRAMEWORKS_PHASE1'],
        },
        FRAMEWORKS_PHASE1: {
          isa: 'PBXFrameworksBuildPhase',
          files: ['EXISTING_FILE1'],
        },
      },
    };

    const relativePath = '../MySwiftPackage';
    const productNames = ['MyLibrary'];
    const targetName = 'MyApp';

    // Execute
    addLocalSwiftPM(relativePath, productNames, xcodeProject, targetName);

    // Assert
    expect(xcodeProject.objects.PROJECT1.packageReferences).toEqual([
      'EXISTING_PACKAGE1',
      'GENERATED_ID_1',
    ]);
    expect(xcodeProject.objects.FRAMEWORKS_PHASE1.files).toEqual([
      'EXISTING_FILE1',
      'GENERATED_ID_3',
    ]);
  });

  it('should handle target with specific name', () => {
    // Setup
    let idCounter = 0;
    mockGenerateXcodeObjectId.mockImplementation(() => {
      idCounter++;
      return `GENERATED_ID_${idCounter}`;
    });

    const xcodeProject = {
      objects: {
        PROJECT1: {
          isa: 'PBXProject',
          packageReferences: [],
        },
        TARGET1: {
          isa: 'PBXNativeTarget',
          name: 'WrongTarget',
          buildPhases: ['FRAMEWORKS_PHASE1'],
        },
        TARGET2: {
          isa: 'PBXNativeTarget',
          name: 'CorrectTarget',
          buildPhases: ['FRAMEWORKS_PHASE2'],
        },
        FRAMEWORKS_PHASE1: {
          isa: 'PBXFrameworksBuildPhase',
          files: [],
        },
        FRAMEWORKS_PHASE2: {
          isa: 'PBXFrameworksBuildPhase',
          files: [],
        },
      },
    };

    const relativePath = '../MySwiftPackage';
    const productNames = ['MyLibrary'];
    const targetName = 'CorrectTarget';

    // Execute
    addLocalSwiftPM(relativePath, productNames, xcodeProject, targetName);

    // Assert - Only the correct target should be modified
    expect(xcodeProject.objects.FRAMEWORKS_PHASE1.files).toEqual([]);
    expect(xcodeProject.objects.FRAMEWORKS_PHASE2.files).toEqual([
      'GENERATED_ID_3',
    ]);
  });
});
