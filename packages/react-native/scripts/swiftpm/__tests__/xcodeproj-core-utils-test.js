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
  addMissingSections,
  generateXcodeObjectId,
  printFilesForBuildPhase,
  printPBXBuildFile,
  printXCLocalSwiftPackageReference,
  printXCSwiftPackageProductDependency,
} = require('../xcodeproj-core-utils');

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

describe('addMissingSections', () => {
  it('should add multiple sections in the correct order', () => {
    // Setup
    const textualProject = `{
	objects = {
		EXISTING123 /* Some existing object */ = {
			isa = PBXProject;
		};
	};
	rootObject = ROOTOBJ123;
}`;
    const sectionsToAdd = [
      {
        sectionType: 'XCSwiftPackageProductDependency',
        replacementText: `
/* Begin XCSwiftPackageProductDependency section */
		PRODUCT123 /* Library */ = {
			isa = XCSwiftPackageProductDependency;
			productName = Library;
		};
/* End XCSwiftPackageProductDependency section */`,
      },
      {
        sectionType: 'PBXBuildFile',
        replacementText: `
/* Begin PBXBuildFile section */
		BUILDFILE123 /* Library in Frameworks */ = {isa = PBXBuildFile; productRef = PRODUCT123 /* Library */; };
/* End PBXBuildFile section */`,
      },
      {
        sectionType: 'XCLocalSwiftPackageReference',
        replacementText: `
/* Begin XCLocalSwiftPackageReference section */
		PACKAGE123 /* XCLocalSwiftPackageReference "../MyPackage" */ = {
			isa = XCLocalSwiftPackageReference;
			relativePath = ../MyPackage;
		};
/* End XCLocalSwiftPackageReference section */`,
      },
    ];

    // Execute
    const result = addMissingSections(textualProject, sectionsToAdd);

    // Assert - Check that sections are in the correct order: PBXBuildFile, XCLocalSwiftPackageReference, XCSwiftPackageProductDependency
    const pbxBuildFileIndex = result.indexOf(
      '/* Begin PBXBuildFile section */',
    );
    const xcLocalIndex = result.indexOf(
      '/* Begin XCLocalSwiftPackageReference section */',
    );
    const xcProductIndex = result.indexOf(
      '/* Begin XCSwiftPackageProductDependency section */',
    );

    expect(pbxBuildFileIndex).toBeLessThan(xcLocalIndex);
    expect(xcLocalIndex).toBeLessThan(xcProductIndex);
    expect(xcProductIndex).toBeLessThan(result.indexOf('rootObject ='));
  });

  it('should handle empty sections array', () => {
    // Setup
    const textualProject = `{
	objects = {
		EXISTING123 /* Some existing object */ = {
			isa = PBXProject;
		};
	};
	rootObject = ROOTOBJ123;
}`;
    const sectionsToAdd = [];

    // Execute
    const result = addMissingSections(textualProject, sectionsToAdd);

    // Assert - Should return the original project unchanged
    expect(result).toBe(textualProject);
  });

  it('should find insertion point after objects opening brace for PBXBuildFile', () => {
    // Setup
    const textualProject = `{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 56;
	objects = {
		EXISTING_OBJ /* PBXProject */ = {
			isa = PBXProject;
		};
	};
	rootObject = ROOTOBJ;
}`;
    const sectionsToAdd = [
      {
        sectionType: 'PBXBuildFile',
        replacementText: '\t\t/* PBXBuildFile section */',
      },
    ];

    // Execute
    const result = addMissingSections(textualProject, sectionsToAdd);

    // Assert - PBXBuildFile section should be inserted right after "objects = {"
    const lines = result.split('\n');
    const objectsLineIndex = lines.findIndex(line =>
      line.includes('objects = {'),
    );
    const pbxSectionLineIndex = lines.findIndex(line =>
      line.includes('/* PBXBuildFile section */'),
    );

    expect(pbxSectionLineIndex).toBe(objectsLineIndex + 1);
  });

  it('should find insertion point before rootObject for other section types', () => {
    // Setup
    const textualProject = `{
	objects = {
		EXISTING_OBJ /* PBXProject */ = {
			isa = PBXProject;
		};
	};
	rootObject = ROOTOBJ;
}`;
    const sectionsToAdd = [
      {
        sectionType: 'XCLocalSwiftPackageReference',
        replacementText: '\t/* XCLocalSwiftPackageReference section */',
      },
    ];

    // Execute
    const result = addMissingSections(textualProject, sectionsToAdd);

    // Assert - Section should be inserted before rootObject line
    const lines = result.split('\n');
    const rootObjectLineIndex = lines.findIndex(line =>
      line.includes('rootObject ='),
    );
    const sectionLineIndex = lines.findIndex(line =>
      line.includes('/* XCLocalSwiftPackageReference section */'),
    );

    expect(sectionLineIndex).toBe(rootObjectLineIndex - 2);
  });

  it('should update insertion index correctly when adding multiple sections', () => {
    // Setup
    const textualProject = `{
	objects = {
		EXISTING_OBJ = {isa = PBXProject;};
	};
	rootObject = ROOTOBJ;
}`;
    const sectionsToAdd = [
      {
        sectionType: 'PBXBuildFile',
        replacementText: `/* Begin PBXBuildFile section */
/* End PBXBuildFile section */`,
      },
      {
        sectionType: 'XCLocalSwiftPackageReference',
        replacementText: `/* Begin XCLocalSwiftPackageReference section */
/* End XCLocalSwiftPackageReference section */`,
      },
    ];

    // Execute
    const result = addMissingSections(textualProject, sectionsToAdd);

    // Assert - Both sections should be present and in correct order
    expect(result).toContain('/* Begin PBXBuildFile section */');
    expect(result).toContain(
      '/* Begin XCLocalSwiftPackageReference section */',
    );

    const pbxIndex = result.indexOf('/* Begin PBXBuildFile section */');
    const xcLocalIndex = result.indexOf(
      '/* Begin XCLocalSwiftPackageReference section */',
    );
    const rootIndex = result.indexOf('rootObject =');

    expect(pbxIndex).toBeLessThan(xcLocalIndex);
    expect(xcLocalIndex).toBeLessThan(rootIndex);
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
