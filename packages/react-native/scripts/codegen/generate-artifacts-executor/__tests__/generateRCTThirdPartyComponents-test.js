// @flow
const { _generateComponentRegistry } = require('../generateRCTThirdPartyComponents');

describe('_generateComponentRegistry', () => {
  it('returns an empty string when componentsInLibraries is undefined', () => {
    const componentsInLibraries = undefined;
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual("");
  });

  it('returns an empty string when componentsInLibraries is null', () => {
    const componentsInLibraries = null;
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual("");
  });

  it('returns an empty string when componentsInLibraries is an empty object', () => {
    const componentsInLibraries = {};
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual("");
  });

  it('returns an empty string when both componentsInLibraries and componentsSupportedApplePlatforms are empty', () => {
    const componentsInLibraries = {};
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual("");
  });

  it('returns an empty string when componentsInLibraries contains an empty array for a library', () => {
    const componentsInLibraries = {
      "my-library": [],
    };
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual("");
  });

  it('returns a string for a single component in a library', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'MyComponent',
          className: 'MyComponentClass',
        },
      ],
    };
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual("		@\"MyComponent\": NSClassFromString(@\"MyComponentClass\"), // my-library");
  });

  it('returns a string for multiple components in a single library', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'MyComponent',
          className: 'MyComponentClass',
        },
        {
          componentName: 'MyComponent2',
          className: 'MyComponentClass2',
        },
      ],
    };
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual(
      "		@\"MyComponent\": NSClassFromString(@\"MyComponentClass\"), // my-library\n" +
      "		@\"MyComponent2\": NSClassFromString(@\"MyComponentClass2\"), // my-library"
    );
  });

  it('returns a string for components in multiple libraries', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'MyComponent',
          className: 'MyComponentClass',
        },
      ],
      "my-library2": [
        {
          componentName: 'MyComponent2',
          className: 'MyComponentClass2',
        },
      ],
    };
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual(
      "		@\"MyComponent\": NSClassFromString(@\"MyComponentClass\"), // my-library\n" +
      "		@\"MyComponent2\": NSClassFromString(@\"MyComponentClass2\"), // my-library2"
    );
  });

  it('returns a string for a single library when another library is empty', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'MyComponent',
          className: 'MyComponentClass',
        },
      ],
      "my-library2": [],
    };
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual(
      "		@\"MyComponent\": NSClassFromString(@\"MyComponentClass\"), // my-library"
    );
  });

  it('returns a string with platform-specific macros for a single library', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'MyComponent',
          className: 'MyComponentClass',
        },
      ],
    };
    const componentsSupportedApplePlatforms = {
      "my-library": {
        ios: true,
        tvos: false,
        macos: false,
        visionos: false,
      },
    };
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual(
      "#if !TARGET_OS_TV && !TARGET_OS_OSX && !TARGET_OS_VISION\n" +
      "		@\"MyComponent\": NSClassFromString(@\"MyComponentClass\"), // my-library\n" +
      "#endif"
    );
  });

  it('returns a string with platform-specific macros for multiple components in a library', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'MyComponent',
          className: 'MyComponentClass',
        },
        {
          componentName: 'MyComponent2',
          className: 'MyComponentClass2',
        },
        {
          componentName: 'MyComponent3',
          className: 'MyComponentClass3',
        },
      ],
    };
    const componentsSupportedApplePlatforms = {
      "my-library": {
        ios: false,
        tvos: true,
        macos: false,
        visionos: false,
      },
    };
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual(
      "#if !TARGET_OS_IOS && !TARGET_OS_OSX && !TARGET_OS_VISION\n" +
      "		@\"MyComponent\": NSClassFromString(@\"MyComponentClass\"), // my-library\n" +
      "		@\"MyComponent2\": NSClassFromString(@\"MyComponentClass2\"), // my-library\n" +
      "		@\"MyComponent3\": NSClassFromString(@\"MyComponentClass3\"), // my-library\n" +
      "#endif"
    );
  });

  it('returns a string with platform-specific macros sandwiched between components from multiple libraries', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'MyComponent',
          className: 'MyComponentClass',
        },
      ],
      "my-library2": [
        {
          componentName: 'MyComponent2',
          className: 'MyComponentClass2',
        },
        {
          componentName: 'MyComponent3',
          className: 'MyComponentClass3',
        },
      ],
      "my-library3": [
        {
          componentName: 'MyComponent4',
          className: 'MyComponentClass4',
        },
      ],
    };
    const componentsSupportedApplePlatforms = {
      "my-library2": {
        ios: false,
        tvos: true,
        macos: true,
        visionos: true,
      },
    };
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual(
      "		@\"MyComponent\": NSClassFromString(@\"MyComponentClass\"), // my-library\n" +
      "#if !TARGET_OS_IOS\n" +
      "		@\"MyComponent2\": NSClassFromString(@\"MyComponentClass2\"), // my-library2\n" +
      "		@\"MyComponent3\": NSClassFromString(@\"MyComponentClass3\"), // my-library2\n" +
      "#endif\n" +
      "		@\"MyComponent4\": NSClassFromString(@\"MyComponentClass4\"), // my-library3"
    );
  });

  it('returns a string when componentsSupportedApplePlatforms is undefined', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'MyComponent',
          className: 'MyComponentClass',
        },
      ],
    };
    const componentsSupportedApplePlatforms = undefined;
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual("		@\"MyComponent\": NSClassFromString(@\"MyComponentClass\"), // my-library");
  });

  it('returns a string when componentsSupportedApplePlatforms is null', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'MyComponent',
          className: 'MyComponentClass',
        },
      ],
    };
    const componentsSupportedApplePlatforms = null;
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual("		@\"MyComponent\": NSClassFromString(@\"MyComponentClass\"), // my-library");
  });

  it('handles a library with mixed valid and invalid components', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'ValidComponent',
          className: 'ValidComponentClass',
        },
        {
          componentName: null, // Invalid component
          className: 'InvalidComponentClass',
        },
      ],
    };
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual(
      "		@\"ValidComponent\": NSClassFromString(@\"ValidComponentClass\"), // my-library"
    );
  });

  it('handles a library with no className for a component', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'ComponentWithoutClass',
          className: null,
        },
      ],
    };
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual("");
  });

  it('handles platform-specific macros when all platforms are true', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'MyComponent',
          className: 'MyComponentClass',
        },
      ],
    };
    const componentsSupportedApplePlatforms = {
      "my-library": {
        ios: true,
        tvos: true,
        macos: true,
        visionos: true,
      },
    };
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual(
      "		@\"MyComponent\": NSClassFromString(@\"MyComponentClass\"), // my-library"
    );
  });

  it('handles a library with components having special characters in names', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'My-Component',
          className: 'MyComponentClass',
        },
        {
          componentName: 'My_Component',
          className: 'MyComponentClass2',
        },
      ],
    };
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual(
      "		@\"My-Component\": NSClassFromString(@\"MyComponentClass\"), // my-library\n" +
      "		@\"My_Component\": NSClassFromString(@\"MyComponentClass2\"), // my-library"
    );
  });

  it('handles a library with components having numeric names', () => {
    const componentsInLibraries = {
      "my-library": [
        {
          componentName: 'Component123',
          className: 'ComponentClass123',
        },
      ],
    };
    const componentsSupportedApplePlatforms = {};
    const result = _generateComponentRegistry(componentsInLibraries, componentsSupportedApplePlatforms);
    expect(result).toEqual(
      "		@\"Component123\": NSClassFromString(@\"ComponentClass123\"), // my-library"
    );
  });
});
