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
  updatePackageReferenceSection,
  updatePBXFrameworksBuildPhaseFiles,
  updateProjectFile,
} = require('../xcodeproj-utils');

// Mock child_process module
jest.mock('child_process');

// Mock xcodeproj-core-utils module
jest.mock('../xcodeproj-core-utils', () => ({
  generateXcodeObjectId: jest.fn(),
  printFilesForBuildPhase: jest.fn(),
  printPBXBuildFile: jest.fn(),
  printXCLocalSwiftPackageReference: jest.fn(),
  printXCSwiftPackageProductDependency: jest.fn(),
  addMissingSections: jest.fn(),
}));

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

describe('updateProjectFile', () => {
  let mockPrintPBXBuildFile;
  let mockPrintXCLocalSwiftPackageReference;
  let mockPrintXCSwiftPackageProductDependency;
  let mockAddMissingSections;

  beforeEach(() => {
    // Setup mocks for the print functions
    const xcodeprjCoreUtils = require('../xcodeproj-core-utils');
    mockPrintPBXBuildFile = xcodeprjCoreUtils.printPBXBuildFile;
    mockPrintXCLocalSwiftPackageReference =
      xcodeprjCoreUtils.printXCLocalSwiftPackageReference;
    mockPrintXCSwiftPackageProductDependency =
      xcodeprjCoreUtils.printXCSwiftPackageProductDependency;
    mockAddMissingSections = xcodeprjCoreUtils.addMissingSections;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should update existing sections with new content from objectsByIsa', () => {
    // Setup
    const textualProject = `{
  objects = {
/* Begin PBXBuildFile section */
    A1B2C3D4 /* OldBuildFile */ = {isa = PBXBuildFile; fileRef = E5F6A7B8;};
    B2C3D4E5 /* AnotherOldBuildFile */ = {isa = PBXBuildFile; fileRef = F6A7B8C9;};
/* End PBXBuildFile section */

/* Begin XCLocalSwiftPackageReference section */
    C3D4E5F6 /* OldPackageReference */ = {isa = XCLocalSwiftPackageReference; relativePath = "../OldPackage";};
/* End XCLocalSwiftPackageReference section */

/* Begin XCSwiftPackageProductDependency section */
    D4E5F6A7 /* OldProductDependency */ = {isa = XCSwiftPackageProductDependency; productName = OldProduct;};
/* End XCSwiftPackageProductDependency section */
  };
}`;

    const xcodeProjectJSON = {
      objects: {
        NEW_BUILD_FILE_1: {
          isa: 'PBXBuildFile',
          fileRef: 'FILE_REF_1',
        },
        NEW_BUILD_FILE_2: {
          isa: 'PBXBuildFile',
          fileRef: 'FILE_REF_2',
        },
        NEW_PACKAGE_REF_1: {
          isa: 'XCLocalSwiftPackageReference',
          relativePath: '../NewPackage1',
        },
        NEW_PACKAGE_REF_2: {
          isa: 'XCLocalSwiftPackageReference',
          relativePath: '../NewPackage2',
        },
        NEW_PRODUCT_DEPENDENCY_1: {
          isa: 'XCSwiftPackageProductDependency',
          productName: 'NewProduct1',
        },
        NEW_PRODUCT_DEPENDENCY_2: {
          isa: 'XCSwiftPackageProductDependency',
          productName: 'NewProduct2',
        },
      },
    };

    const objectsByIsa = {
      PBXBuildFile: {
        NEW_BUILD_FILE_1: xcodeProjectJSON.objects.NEW_BUILD_FILE_1,
        NEW_BUILD_FILE_2: xcodeProjectJSON.objects.NEW_BUILD_FILE_2,
      },
      XCLocalSwiftPackageReference: {
        NEW_PACKAGE_REF_1: xcodeProjectJSON.objects.NEW_PACKAGE_REF_1,
        NEW_PACKAGE_REF_2: xcodeProjectJSON.objects.NEW_PACKAGE_REF_2,
      },
      XCSwiftPackageProductDependency: {
        NEW_PRODUCT_DEPENDENCY_1:
          xcodeProjectJSON.objects.NEW_PRODUCT_DEPENDENCY_1,
        NEW_PRODUCT_DEPENDENCY_2:
          xcodeProjectJSON.objects.NEW_PRODUCT_DEPENDENCY_2,
      },
    };

    // Mock the print functions to return distinctive content
    mockPrintPBXBuildFile
      .mockReturnValueOnce(
        '\t\tNEW_BUILD_FILE_1 /* BuildFile1 */ = {isa = PBXBuildFile;};\n',
      )
      .mockReturnValueOnce(
        '\t\tNEW_BUILD_FILE_2 /* BuildFile2 */ = {isa = PBXBuildFile;};\n',
      );

    mockPrintXCLocalSwiftPackageReference
      .mockReturnValueOnce(
        '\t\tNEW_PACKAGE_REF_1 /* Package1 */ = {isa = XCLocalSwiftPackageReference;};\n',
      )
      .mockReturnValueOnce(
        '\t\tNEW_PACKAGE_REF_2 /* Package2 */ = {isa = XCLocalSwiftPackageReference;};\n',
      );

    mockPrintXCSwiftPackageProductDependency
      .mockReturnValueOnce(
        '\t\tNEW_PRODUCT_DEPENDENCY_1 /* Product1 */ = {isa = XCSwiftPackageProductDependency;};\n',
      )
      .mockReturnValueOnce(
        '\t\tNEW_PRODUCT_DEPENDENCY_2 /* Product2 */ = {isa = XCSwiftPackageProductDependency;};\n',
      );

    // Execute
    const result = updateProjectFile(
      textualProject,
      xcodeProjectJSON,
      objectsByIsa,
    );

    // Assert
    expect(mockPrintPBXBuildFile).toHaveBeenCalledTimes(2);
    expect(mockPrintPBXBuildFile).toHaveBeenCalledWith(
      'NEW_BUILD_FILE_1',
      xcodeProjectJSON.objects.NEW_BUILD_FILE_1,
      xcodeProjectJSON.objects,
    );
    expect(mockPrintPBXBuildFile).toHaveBeenCalledWith(
      'NEW_BUILD_FILE_2',
      xcodeProjectJSON.objects.NEW_BUILD_FILE_2,
      xcodeProjectJSON.objects,
    );

    expect(mockPrintXCLocalSwiftPackageReference).toHaveBeenCalledTimes(2);
    expect(mockPrintXCLocalSwiftPackageReference).toHaveBeenCalledWith(
      'NEW_PACKAGE_REF_1',
      xcodeProjectJSON.objects.NEW_PACKAGE_REF_1,
      xcodeProjectJSON.objects,
    );
    expect(mockPrintXCLocalSwiftPackageReference).toHaveBeenCalledWith(
      'NEW_PACKAGE_REF_2',
      xcodeProjectJSON.objects.NEW_PACKAGE_REF_2,
      xcodeProjectJSON.objects,
    );

    expect(mockPrintXCSwiftPackageProductDependency).toHaveBeenCalledTimes(2);
    expect(mockPrintXCSwiftPackageProductDependency).toHaveBeenCalledWith(
      'NEW_PRODUCT_DEPENDENCY_1',
      xcodeProjectJSON.objects.NEW_PRODUCT_DEPENDENCY_1,
      xcodeProjectJSON.objects,
    );
    expect(mockPrintXCSwiftPackageProductDependency).toHaveBeenCalledWith(
      'NEW_PRODUCT_DEPENDENCY_2',
      xcodeProjectJSON.objects.NEW_PRODUCT_DEPENDENCY_2,
      xcodeProjectJSON.objects,
    );

    expect(mockAddMissingSections).not.toHaveBeenCalled();

    // Check that the sections were replaced with new content
    expect(result).toContain('NEW_BUILD_FILE_1 /* BuildFile1 */');
    expect(result).toContain('NEW_BUILD_FILE_2 /* BuildFile2 */');
    expect(result).toContain('NEW_PACKAGE_REF_1 /* Package1 */');
    expect(result).toContain('NEW_PACKAGE_REF_2 /* Package2 */');
    expect(result).toContain('NEW_PRODUCT_DEPENDENCY_1 /* Product1 */');
    expect(result).toContain('NEW_PRODUCT_DEPENDENCY_2 /* Product2 */');

    // Check that old content was removed
    expect(result).not.toContain('A1B2C3D4 /* OldBuildFile */');
    expect(result).not.toContain('C3D4E5F6 /* OldPackageReference */');
    expect(result).not.toContain('D4E5F6A7 /* OldProductDependency */');
  });

  it('should add missing sections when they do not exist in the textual project', () => {
    // Setup
    const textualProject = `{
  objects = {
/* Begin PBXProject section */
    A1B2C3D4 /* Project object */ = {
      isa = PBXProject;
      name = MyProject;
    };
/* End PBXProject section */
  };
  rootObject = A1B2C3D4;
}`;

    const xcodeProjectJSON = {
      objects: {
        NEW_BUILD_FILE_1: {
          isa: 'PBXBuildFile',
          fileRef: 'FILE_REF_1',
        },
        NEW_PACKAGE_REF_1: {
          isa: 'XCLocalSwiftPackageReference',
          relativePath: '../NewPackage',
        },
        NEW_PRODUCT_DEPENDENCY_1: {
          isa: 'XCSwiftPackageProductDependency',
          productName: 'NewProduct',
        },
      },
    };

    const objectsByIsa = {
      PBXBuildFile: {
        NEW_BUILD_FILE_1: xcodeProjectJSON.objects.NEW_BUILD_FILE_1,
      },
      XCLocalSwiftPackageReference: {
        NEW_PACKAGE_REF_1: xcodeProjectJSON.objects.NEW_PACKAGE_REF_1,
      },
      XCSwiftPackageProductDependency: {
        NEW_PRODUCT_DEPENDENCY_1:
          xcodeProjectJSON.objects.NEW_PRODUCT_DEPENDENCY_1,
      },
    };

    // Mock the print functions
    mockPrintPBXBuildFile.mockReturnValueOnce(
      '\t\tNEW_BUILD_FILE_1 /* BuildFile */ = {isa = PBXBuildFile;};\n',
    );
    mockPrintXCLocalSwiftPackageReference.mockReturnValueOnce(
      '\t\tNEW_PACKAGE_REF_1 /* Package */ = {isa = XCLocalSwiftPackageReference;};\n',
    );
    mockPrintXCSwiftPackageProductDependency.mockReturnValueOnce(
      '\t\tNEW_PRODUCT_DEPENDENCY_1 /* Product */ = {isa = XCSwiftPackageProductDependency;};\n',
    );

    // Mock addMissingSections to return a modified textual project
    mockAddMissingSections.mockReturnValue('MODIFIED_TEXTUAL_PROJECT');

    // Execute
    const result = updateProjectFile(
      textualProject,
      xcodeProjectJSON,
      objectsByIsa,
    );

    // Assert
    expect(mockAddMissingSections).toHaveBeenCalledTimes(1);

    const expectedSectionsToAdd = [
      {
        sectionType: 'PBXBuildFile',
        replacementText:
          '/* Begin PBXBuildFile section */\n\t\tNEW_BUILD_FILE_1 /* BuildFile */ = {isa = PBXBuildFile;};\n/* End PBXBuildFile section */\n',
      },
      {
        sectionType: 'XCLocalSwiftPackageReference',
        replacementText:
          '/* Begin XCLocalSwiftPackageReference section */\n\t\tNEW_PACKAGE_REF_1 /* Package */ = {isa = XCLocalSwiftPackageReference;};\n/* End XCLocalSwiftPackageReference section */\n',
      },
      {
        sectionType: 'XCSwiftPackageProductDependency',
        replacementText:
          '/* Begin XCSwiftPackageProductDependency section */\n\t\tNEW_PRODUCT_DEPENDENCY_1 /* Product */ = {isa = XCSwiftPackageProductDependency;};\n/* End XCSwiftPackageProductDependency section */\n',
      },
    ];

    expect(mockAddMissingSections).toHaveBeenCalledWith(
      textualProject,
      expectedSectionsToAdd,
    );

    expect(result).toBe('MODIFIED_TEXTUAL_PROJECT');
  });

  it('should handle mix of existing and missing sections', () => {
    // Setup
    const textualProject = `{
  objects = {
/* Begin PBXBuildFile section */
    OLD_BUILD_FILE /* Old file */ = {isa = PBXBuildFile;};
/* End PBXBuildFile section */

/* Begin PBXProject section */
    A1B2C3D4 /* Project object */ = {
      isa = PBXProject;
      name = MyProject;
    };
/* End PBXProject section */
  };
}`;

    const xcodeProjectJSON = {
      objects: {
        NEW_BUILD_FILE_1: {
          isa: 'PBXBuildFile',
          fileRef: 'FILE_REF_1',
        },
        NEW_PACKAGE_REF_1: {
          isa: 'XCLocalSwiftPackageReference',
          relativePath: '../NewPackage',
        },
      },
    };

    const objectsByIsa = {
      PBXBuildFile: {
        NEW_BUILD_FILE_1: xcodeProjectJSON.objects.NEW_BUILD_FILE_1,
      },
      XCLocalSwiftPackageReference: {
        NEW_PACKAGE_REF_1: xcodeProjectJSON.objects.NEW_PACKAGE_REF_1,
      },
    };

    // Mock the print functions
    mockPrintPBXBuildFile.mockReturnValueOnce(
      '\t\tNEW_BUILD_FILE_1 /* BuildFile */ = {isa = PBXBuildFile;};\n',
    );
    mockPrintXCLocalSwiftPackageReference.mockReturnValueOnce(
      '\t\tNEW_PACKAGE_REF_1 /* Package */ = {isa = XCLocalSwiftPackageReference;};\n',
    );

    // Mock addMissingSections
    mockAddMissingSections.mockImplementation(
      (project, sectionsToAdd) => project + '_WITH_MISSING_SECTIONS',
    );

    // Execute
    const result = updateProjectFile(
      textualProject,
      xcodeProjectJSON,
      objectsByIsa,
    );

    // Assert
    // PBXBuildFile should be updated in place (existing section)
    expect(mockPrintPBXBuildFile).toHaveBeenCalledTimes(1);
    expect(mockPrintXCLocalSwiftPackageReference).toHaveBeenCalledTimes(1);

    // addMissingSections should be called only for the missing section
    expect(mockAddMissingSections).toHaveBeenCalledTimes(1);
    const expectedSectionsToAdd = [
      {
        sectionType: 'XCLocalSwiftPackageReference',
        replacementText:
          '/* Begin XCLocalSwiftPackageReference section */\n\t\tNEW_PACKAGE_REF_1 /* Package */ = {isa = XCLocalSwiftPackageReference;};\n/* End XCLocalSwiftPackageReference section */\n',
      },
    ];

    expect(mockAddMissingSections).toHaveBeenCalledWith(
      expect.stringContaining('NEW_BUILD_FILE_1 /* BuildFile */'),
      expectedSectionsToAdd,
    );

    expect(result).toContain('_WITH_MISSING_SECTIONS');
  });
});

describe('updatePackageReferenceSection', () => {
  it('should update existing packageReferences section with new content', () => {
    // Setup
    const textualProject = `{
	objects = {
    /* Begin PBXProject section */
		AB123456 /* Project object */ = {
			isa = PBXProject;
			mainGroup = EF789012 /* Main group */;
			packageReferences = (
				CD345678 /* Old package reference */,
				EF901234 /* Another old package reference */,
			);
			projectDirPath = "";
		};
    /* End PBXProject section */
	};
}`;

    const xcodeProjectJSON = {
      objects: {
        AB123456: {
          isa: 'PBXProject',
          packageReferences: ['A1B2C3D4', 'E5F6A7B8'],
        },
        A1B2C3D4: {
          isa: 'XCLocalSwiftPackageReference',
          relativePath: '../NewPackage1',
        },
        E5F6A7B8: {
          isa: 'XCLocalSwiftPackageReference',
          relativePath: '../NewPackage2',
        },
      },
    };

    const objectsByIsa = {};

    // Execute
    const result = updatePackageReferenceSection(
      textualProject,
      xcodeProjectJSON,
      objectsByIsa,
    );

    // Assert
    expect(result).toContain('packageReferences = (');
    expect(result).toContain(
      'A1B2C3D4 /* XCLocalSwiftPackageReference "../NewPackage1" */,',
    );
    expect(result).toContain(
      'E5F6A7B8 /* XCLocalSwiftPackageReference "../NewPackage2" */,',
    );
    expect(result).not.toContain('CD345678 /* Old package reference */');
    expect(result).not.toContain(
      'EF901234 /* Another old package reference */',
    );
  });

  it('should insert packageReferences property in alphabetical order when missing', () => {
    // Setup
    const textualProject = `{
	objects = {
    /* Begin PBXProject section */
		A1B2C3D4 /* Project object */ = {
			isa = PBXProject;
			mainGroup = EF789012 /* Main group */;
			projectDirPath = "";
			targets = (
				F1E2D3C4 /* Target */,
			);
		};
    /* End PBXProject section */
	};
}`;

    const xcodeProjectJSON = {
      objects: {
        A1B2C3D4: {
          isa: 'PBXProject',
          packageReferences: ['E5F6A7B8'],
        },
        E5F6A7B8: {
          isa: 'XCLocalSwiftPackageReference',
          relativePath: '../MyPackage',
        },
      },
    };

    const objectsByIsa = {};

    // Execute
    const result = updatePackageReferenceSection(
      textualProject,
      xcodeProjectJSON,
      objectsByIsa,
    );

    // Assert - packageReferences should be inserted before projectDirPath
    const lines = result.split('\n');
    const packageReferencesLineIndex = lines.findIndex(line =>
      line.includes('packageReferences = ('),
    );
    const projectDirPathLineIndex = lines.findIndex(line =>
      line.includes('projectDirPath = "'),
    );

    expect(packageReferencesLineIndex).toBeGreaterThan(-1);
    expect(packageReferencesLineIndex).toBeLessThan(projectDirPathLineIndex);
    expect(result).toContain(
      'E5F6A7B8 /* XCLocalSwiftPackageReference "../MyPackage" */,',
    );
  });

  it('should preserve content outside PBXProject sections', () => {
    // Setup
    const textualProject = `{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 56;
	objects = {
		F1E2D3C4 /* Some other object */ = {
			isa = PBXFileReference;
			path = "SomeFile.swift";
		};

/* Begin PBXProject section */
		A1B2C3D4 /* Project object */ = {
			isa = PBXProject;
			packageReferences = (
				CD345678 /* Old package */,
			);
			projectDirPath = "";
		};
/* End PBXProject section */

		E5F6A7B8 /* Another object */ = {
			isa = PBXNativeTarget;
			name = "MyTarget";
		};
	};
	rootObject = A1B2C3D4;
}`;

    const xcodeProjectJSON = {
      objects: {
        A1B2C3D4: {
          isa: 'PBXProject',
          packageReferences: ['B1C2D3E4'],
        },
        B1C2D3E4: {
          isa: 'XCLocalSwiftPackageReference',
          relativePath: '../NewPackage',
        },
      },
    };

    const objectsByIsa = {};

    // Execute
    const result = updatePackageReferenceSection(
      textualProject,
      xcodeProjectJSON,
      objectsByIsa,
    );

    // Assert - All other content should be preserved
    expect(result).toContain('archiveVersion = 1;');
    expect(result).toContain('objectVersion = 56;');
    expect(result).toContain('F1E2D3C4 /* Some other object */ = {');
    expect(result).toContain('E5F6A7B8 /* Another object */ = {');
    expect(result).toContain('rootObject = A1B2C3D4;');
    expect(result).toContain(
      'B1C2D3E4 /* XCLocalSwiftPackageReference "../NewPackage" */,',
    );
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

describe('updatePBXFrameworksBuildPhaseFiles', () => {
  let mockPrintFilesForBuildPhase;

  beforeEach(() => {
    // Setup mock for printFilesForBuildPhase
    const xcodeprjCoreUtils = require('../xcodeproj-core-utils');
    mockPrintFilesForBuildPhase = xcodeprjCoreUtils.printFilesForBuildPhase;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should update files in PBXFrameworksBuildPhase section correctly', () => {
    // Setup
    const textualProject = `{
\tobjects = {
\t\tA1B2C3D4 /* Some existing object */ = {
\t\t\tisa = PBXProject;
\t\t};

/* Begin PBXFrameworksBuildPhase section */
\t\tE5F6A7B8 /* Frameworks */ = {
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t\tC9D0E1F2 /* OldLibrary in Frameworks */,
\t\t\t\tA3B4C5D6 /* AnotherLibrary in Frameworks */,
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};
/* End PBXFrameworksBuildPhase section */

\t\tA7B8C9D0 /* Other object */ = {
\t\t\tisa = PBXNativeTarget;
\t\t};
\t};
\trootObject = C3D4E5F6;
}`;

    const xcodeProjectJSON = {
      objects: {
        E5F6A7B8: {
          isa: 'PBXFrameworksBuildPhase',
          files: ['F7E8D9C0', 'B1A2F3E4'],
        },
        F7E8D9C0: {
          isa: 'PBXBuildFile',
          productRef: 'D5C6B7A8',
        },
        B1A2F3E4: {
          isa: 'PBXBuildFile',
          productRef: 'E9F0A1B2',
        },
        D5C6B7A8: {
          isa: 'XCSwiftPackageProductDependency',
          productName: 'NewLibrary1',
        },
        E9F0A1B2: {
          isa: 'XCSwiftPackageProductDependency',
          productName: 'NewLibrary2',
        },
      },
    };

    mockPrintFilesForBuildPhase
      .mockReturnValueOnce(
        '\t\t\t\tF7E8D9C0 /* NewLibrary1 in Frameworks */,\n',
      )
      .mockReturnValueOnce(
        '\t\t\t\tB1A2F3E4 /* NewLibrary2 in Frameworks */,\n',
      );

    // Execute
    const result = updatePBXFrameworksBuildPhaseFiles(
      textualProject,
      xcodeProjectJSON,
    );

    // Assert
    expect(mockPrintFilesForBuildPhase).toHaveBeenCalledTimes(2);
    expect(mockPrintFilesForBuildPhase).toHaveBeenCalledWith(
      'F7E8D9C0',
      xcodeProjectJSON.objects.F7E8D9C0,
      xcodeProjectJSON.objects,
    );
    expect(mockPrintFilesForBuildPhase).toHaveBeenCalledWith(
      'B1A2F3E4',
      xcodeProjectJSON.objects.B1A2F3E4,
      xcodeProjectJSON.objects,
    );

    // Check that the old files are replaced with new files
    expect(result).toContain('F7E8D9C0 /* NewLibrary1 in Frameworks */');
    expect(result).toContain('B1A2F3E4 /* NewLibrary2 in Frameworks */');
    expect(result).not.toContain('C9D0E1F2 /* OldLibrary in Frameworks */');
    expect(result).not.toContain('A3B4C5D6 /* AnotherLibrary in Frameworks */');
  });

  it('should handle multiple PBXFrameworksBuildPhase sections', () => {
    // Setup
    const textualProject = `{
\tobjects = {
/* Begin PBXFrameworksBuildPhase section */
\t\tE5F6A7B8 /* Frameworks */ = {
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tfiles = (
\t\t\t\tC9D0E1F2 /* OldLibrary in Frameworks */,
\t\t\t);
\t\t};
\t\tD9C0B1A2 /* Frameworks */ = {
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tfiles = (
\t\t\t\tA3B4C5D6 /* AnotherOldLibrary in Frameworks */,
\t\t\t);
\t\t};
/* End PBXFrameworksBuildPhase section */
\t};
}`;

    const xcodeProjectJSON = {
      objects: {
        E5F6A7B8: {
          isa: 'PBXFrameworksBuildPhase',
          files: ['F7E8D9C0'],
        },
        D9C0B1A2: {
          isa: 'PBXFrameworksBuildPhase',
          files: ['B1A2F3E4'],
        },
        F7E8D9C0: {
          isa: 'PBXBuildFile',
          productRef: 'D5C6B7A8',
        },
        B1A2F3E4: {
          isa: 'PBXBuildFile',
          productRef: 'E9F0A1B2',
        },
        D5C6B7A8: {
          isa: 'XCSwiftPackageProductDependency',
          productName: 'NewLibrary1',
        },
        E9F0A1B2: {
          isa: 'XCSwiftPackageProductDependency',
          productName: 'NewLibrary2',
        },
      },
    };

    mockPrintFilesForBuildPhase
      .mockReturnValueOnce(
        '\t\t\t\tF7E8D9C0 /* NewLibrary1 in Frameworks */,\n',
      )
      .mockReturnValueOnce(
        '\t\t\t\tB1A2F3E4 /* NewLibrary2 in Frameworks */,\n',
      );

    // Execute
    const result = updatePBXFrameworksBuildPhaseFiles(
      textualProject,
      xcodeProjectJSON,
    );

    // Assert
    expect(mockPrintFilesForBuildPhase).toHaveBeenCalledTimes(2);
    expect(result).toContain('F7E8D9C0 /* NewLibrary1 in Frameworks */');
    expect(result).toContain('B1A2F3E4 /* NewLibrary2 in Frameworks */');
    expect(result).not.toContain('C9D0E1F2 /* OldLibrary in Frameworks */');
    expect(result).not.toContain(
      'A3B4C5D6 /* AnotherOldLibrary in Frameworks */',
    );
  });

  it('should skip non-existent build file objects', () => {
    // Setup
    const textualProject = `{
\tobjects = {
/* Begin PBXFrameworksBuildPhase section */
\t\tE5F6A7B8 /* Frameworks */ = {
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tfiles = (
\t\t\t\tC9D0E1F2 /* OldLibrary in Frameworks */,
\t\t\t);
\t\t};
/* End PBXFrameworksBuildPhase section */
\t};
}`;

    const xcodeProjectJSON = {
      objects: {
        E5F6A7B8: {
          isa: 'PBXFrameworksBuildPhase',
          files: ['E3F4A5B6', 'C7D8E9F0'],
        },
        E3F4A5B6: {
          isa: 'PBXBuildFile',
          productRef: 'D5C6B7A8',
        },
        D5C6B7A8: {
          isa: 'XCSwiftPackageProductDependency',
          productName: 'ExistingLibrary',
        },
        // C7D8E9F0 is not in objects
      },
    };

    mockPrintFilesForBuildPhase.mockReturnValueOnce(
      '\t\t\t\tE3F4A5B6 /* ExistingLibrary in Frameworks */,\n',
    );

    // Execute
    const result = updatePBXFrameworksBuildPhaseFiles(
      textualProject,
      xcodeProjectJSON,
    );

    // Assert
    expect(mockPrintFilesForBuildPhase).toHaveBeenCalledTimes(1);
    expect(mockPrintFilesForBuildPhase).toHaveBeenCalledWith(
      'E3F4A5B6',
      xcodeProjectJSON.objects.E3F4A5B6,
      xcodeProjectJSON.objects,
    );
    expect(result).toContain('E3F4A5B6 /* ExistingLibrary in Frameworks */');
  });

  it('should handle empty files array in PBXFrameworksBuildPhase', () => {
    // Setup
    const textualProject = `{
\tobjects = {
/* Begin PBXFrameworksBuildPhase section */
\t\tE5F6A7B8 /* Frameworks */ = {
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tfiles = (
\t\t\t);
\t\t};
/* End PBXFrameworksBuildPhase section */
\t};
}`;

    const xcodeProjectJSON = {
      objects: {
        E5F6A7B8: {
          isa: 'PBXFrameworksBuildPhase',
          files: [],
        },
      },
    };

    // Execute
    const result = updatePBXFrameworksBuildPhaseFiles(
      textualProject,
      xcodeProjectJSON,
    );

    // Assert
    expect(mockPrintFilesForBuildPhase).not.toHaveBeenCalled();
    expect(result).toContain('files = (\n\t\t\t);');
  });

  it('should preserve content outside PBXFrameworksBuildPhase sections', () => {
    // Setup
    const textualProject = `{
\tarchiveVersion = 1;
\tclasses = {
\t};
\tobjects = {
\t\tF1E2D3C4 /* Project object */ = {
\t\t\tisa = PBXProject;
\t\t\tname = MyProject;
\t\t};

/* Begin PBXFrameworksBuildPhase section */
\t\tE5F6A7B8 /* Frameworks */ = {
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tfiles = (
\t\t\t\tC9D0E1F2 /* OldLibrary in Frameworks */,
\t\t\t);
\t\t};
/* End PBXFrameworksBuildPhase section */

\t\tB5A6F7E8 /* Target object */ = {
\t\t\tisa = PBXNativeTarget;
\t\t\tname = MyTarget;
\t\t};
\t};
\trootObject = F1E2D3C4;
}`;

    const xcodeProjectJSON = {
      objects: {
        E5F6A7B8: {
          isa: 'PBXFrameworksBuildPhase',
          files: ['F7E8D9C0'],
        },
        F7E8D9C0: {
          isa: 'PBXBuildFile',
          productRef: 'D5C6B7A8',
        },
        D5C6B7A8: {
          isa: 'XCSwiftPackageProductDependency',
          productName: 'NewLibrary',
        },
      },
    };

    mockPrintFilesForBuildPhase.mockReturnValueOnce(
      '\t\t\t\tF7E8D9C0 /* NewLibrary in Frameworks */,\n',
    );

    // Execute
    const result = updatePBXFrameworksBuildPhaseFiles(
      textualProject,
      xcodeProjectJSON,
    );

    // Assert
    expect(result).toContain('archiveVersion = 1;');
    expect(result).toContain('F1E2D3C4 /* Project object */ = {');
    expect(result).toContain('B5A6F7E8 /* Target object */ = {');
    expect(result).toContain('rootObject = F1E2D3C4;');
    expect(result).toContain('F7E8D9C0 /* NewLibrary in Frameworks */');
    expect(result).not.toContain('C9D0E1F2 /* OldLibrary in Frameworks */');
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
