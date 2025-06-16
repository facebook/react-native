/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script crawls through a React Native application's dependencies and invokes the codegen
 * for any libraries that require it.
 * To enable codegen support, the library should include a config in the codegenConfig key
 * in a package.json file.
 */

const utils = require('./codegen-utils');
const generateSpecsCLIExecutor = require('./generate-specs-cli-executor');
const {execSync} = require('child_process');
const fs = require('fs');
const glob = require('glob');
const os = require('os');
const path = require('path');

const REACT_NATIVE_REPOSITORY_ROOT = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
);
const REACT_NATIVE_PACKAGE_ROOT_FOLDER = path.join(__dirname, '..', '..');
const CODEGEN_REPO_PATH = `${REACT_NATIVE_REPOSITORY_ROOT}/packages/react-native-codegen`;
const RNCORE_CONFIGS = {
  ios: path.join(REACT_NATIVE_PACKAGE_ROOT_FOLDER, 'ReactCommon'),
  android: path.join(
    REACT_NATIVE_PACKAGE_ROOT_FOLDER,
    'ReactAndroid',
    'build',
    'generated',
    'source',
    'codegen',
  ),
};
const CORE_LIBRARIES_WITH_OUTPUT_FOLDER = {
  rncore: RNCORE_CONFIGS,
  FBReactNativeSpec: {
    ios: path.join(
      REACT_NATIVE_PACKAGE_ROOT_FOLDER,
      'React',
      'FBReactNativeSpec',
    ),
    android: path.join(
      REACT_NATIVE_PACKAGE_ROOT_FOLDER,
      'ReactAndroid',
      'build',
      'generated',
      'source',
      'codegen',
    ),
  },
};

const packageJsonPath = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'package.json',
);
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
const REACT_NATIVE = packageJson.name;

const TEMPLATES_FOLDER_PATH = path.join(
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  'scripts',
  'codegen',
  'templates',
);

const MODULES_PROTOCOLS_H_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTModulesConformingToProtocolsProviderH.template',
);

const MODULES_PROTOCOLS_MM_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTModulesConformingToProtocolsProviderMM.template',
);

const THIRD_PARTY_COMPONENTS_H_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTThirdPartyComponentsProviderH.template',
);

const THIRD_PARTY_COMPONENTS_MM_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTThirdPartyComponentsProviderMM.template',
);

const MODULE_PROVIDERS_H_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTModuleProvidersH.template',
);

const MODULE_PROVIDERS_MM_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTModuleProvidersMM.template',
);

const APP_DEPENDENCY_PROVIDER_H_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTAppDependencyProviderH.template',
);

const APP_DEPENDENCY_PROVIDER_MM_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTAppDependencyProviderMM.template',
);

const APP_DEPENDENCY_PROVIDER_PODSPEC_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'ReactAppDependencyProvider.podspec.template',
);

const REACT_CODEGEN_PODSPEC_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'ReactCodegen.podspec.template',
);

const codegenLog = (text, info = false) => {
  // ANSI escape codes for colors and formatting
  const reset = '\x1b[0m';
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const bold = '\x1b[1m';

  const color = info ? yellow : '';
  console.log(`${cyan}${bold}[Codegen]${reset} ${color}${text}${reset}`);
};

// HELPERS

function pkgJsonIncludesGeneratedCode(pkgJson) {
  return pkgJson.codegenConfig && pkgJson.codegenConfig.includesGeneratedCode;
}

function isReactNativeCoreLibrary(libraryName) {
  return libraryName in CORE_LIBRARIES_WITH_OUTPUT_FOLDER;
}

function readPkgJsonInDirectory(dir) {
  const pkgJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    throw `[Codegen] Error: ${pkgJsonPath} does not exist.`;
  }
  return JSON.parse(fs.readFileSync(pkgJsonPath));
}

function printDeprecationWarningIfNeeded(dependency) {
  if (dependency === REACT_NATIVE) {
    return;
  }
  codegenLog(`CodegenConfig Deprecated Setup for ${dependency}.
    The configuration file still contains the codegen in the libraries array.
    If possible, replace it with a single object.
  `);
  codegenLog(`BEFORE:
    {
      // ...
      "codegenConfig": {
        "libraries": [
          {
            "name": "libName1",
            "type": "all|components|modules",
            "jsSrcsRoot": "libName1/js"
          },
          {
            "name": "libName2",
            "type": "all|components|modules",
            "jsSrcsRoot": "libName2/src"
          }
        ]
      }
    }

    AFTER:
    {
      "codegenConfig": {
        "name": "libraries",
        "type": "all",
        "jsSrcsRoot": "."
      }
    }
  `);
}

// Reading Libraries
function extractLibrariesFromConfigurationArray(configFile, dependencyPath) {
  return configFile.codegenConfig.libraries.map(config => {
    return {
      name: config.name,
      config,
      libraryPath: dependencyPath,
    };
  });
}

function extractLibrariesFromJSON(configFile, dependencyPath) {
  if (configFile.codegenConfig == null) {
    return [];
  }
  codegenLog(`Found ${configFile.name}`);
  if (configFile.codegenConfig.libraries == null) {
    const config = configFile.codegenConfig;
    return [
      {
        name: configFile.name,
        config,
        libraryPath: dependencyPath,
      },
    ];
  } else {
    printDeprecationWarningIfNeeded(configFile.name);
    return extractLibrariesFromConfigurationArray(configFile, dependencyPath);
  }
}

const APPLE_PLATFORMS = ['ios', 'macos', 'tvos', 'visionos'];

// Cocoapods specific platform keys
function getCocoaPodsPlatformKey(platformName) {
  if (platformName === 'macos') {
    return 'osx';
  }
  return platformName;
}

function extractSupportedApplePlatforms(dependency, dependencyPath) {
  codegenLog('Searching for podspec in the project dependencies.', true);
  const podspecs = glob.sync('*.podspec', {cwd: dependencyPath});

  if (podspecs.length === 0) {
    return;
  }

  // Take the first podspec found
  const podspec = fs.readFileSync(
    path.join(dependencyPath, podspecs[0]),
    'utf8',
  );

  /**
   * Podspec can have platforms defined in two ways:
   * 1. `spec.platforms = { :ios => "11.0", :tvos => "11.0" }`
   * 2. `s.ios.deployment_target = "11.0"`
   *    `s.tvos.deployment_target = "11.0"`
   */
  const supportedPlatforms = podspec
    .split('\n')
    .filter(
      line => line.includes('platform') || line.includes('deployment_target'),
    )
    .join('');

  // Generate a map of supported platforms { [platform]: true/false }
  const supportedPlatformsMap = APPLE_PLATFORMS.reduce(
    (acc, platform) => ({
      ...acc,
      [platform]: supportedPlatforms.includes(
        getCocoaPodsPlatformKey(platform),
      ),
    }),
    {},
  );

  const supportedPlatformsList = Object.keys(supportedPlatformsMap).filter(
    key => supportedPlatformsMap[key],
  );

  if (supportedPlatformsList.length > 0) {
    codegenLog(
      `Supported Apple platforms: ${supportedPlatformsList.join(
        ', ',
      )} for ${dependency}`,
    );
  }

  return supportedPlatformsMap;
}

function findExternalLibraries(pkgJson, projectRoot) {
  const dependencies = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
    ...pkgJson.peerDependencies,
  };
  // Determine which of these are codegen-enabled libraries
  codegenLog(
    'Searching for codegen-enabled libraries in the project dependencies.',
    true,
  );
  // Handle third-party libraries
  return Object.keys(dependencies).flatMap(dependency => {
    let configFilePath = '';
    try {
      configFilePath = require.resolve(path.join(dependency, 'package.json'), {
        paths: [projectRoot],
      });
    } catch (e) {
      // require.resolve fails if the dependency is a local node module.
      if (
        dependencies[dependency].startsWith('.') || // handles relative paths
        dependencies[dependency].startsWith('/') // handles absolute paths
      ) {
        configFilePath = path.join(
          projectRoot,
          pkgJson.dependencies[dependency],
          'package.json',
        );
      } else {
        return [];
      }
    }
    const configFile = JSON.parse(fs.readFileSync(configFilePath));
    const codegenConfigFileDir = path.dirname(configFilePath);
    return extractLibrariesFromJSON(configFile, codegenConfigFileDir);
  });
}

function findLibrariesFromReactNativeConfig(projectRoot, rnConfig) {
  codegenLog(
    `Searching for codegen-enabled libraries in react-native.config.js`,
    true,
  );

  if (!rnConfig.dependencies) {
    return [];
  }
  return Object.keys(rnConfig.dependencies).flatMap(name => {
    const dependencyConfig = rnConfig.dependencies[name];

    if (!dependencyConfig.root) {
      return [];
    }
    const codegenConfigFileDir = path.resolve(
      projectRoot,
      dependencyConfig.root,
    );
    let configFile;
    try {
      configFile = readPkgJsonInDirectory(codegenConfigFileDir);
    } catch {
      return [];
    }

    return extractLibrariesFromJSON(configFile, codegenConfigFileDir);
  });
}

/**
 * Finds all disabled libraries by platform based the react native config.
 *
 * This is needed when selectively disabling libraries in react-native.config.js since codegen should exclude those libraries as well.
 */
function findDisabledLibrariesByPlatform(reactNativeConfig, platform) {
  const dependencies = reactNativeConfig.dependencies ?? {};

  return Object.keys(dependencies).filter(
    dependency => dependencies[dependency].platforms?.[platform] === null,
  );
}

function findProjectRootLibraries(pkgJson, projectRoot) {
  codegenLog('Searching for codegen-enabled libraries in the app.', true);

  if (pkgJson.codegenConfig == null) {
    codegenLog(
      'The "codegenConfig" field is not defined in package.json. Assuming there is nothing to generate at the app level.',
      true,
    );
    return [];
  }

  if (typeof pkgJson.codegenConfig !== 'object') {
    throw 'The "codegenConfig" field must be an Object.';
  }

  return extractLibrariesFromJSON(pkgJson, projectRoot);
}

// CodeGen
function buildCodegenIfNeeded() {
  if (!fs.existsSync(CODEGEN_REPO_PATH)) {
    return;
  }
  // Assuming we are working in the react-native repo. We might need to build the codegen.
  // This will become unnecessary once we start using Babel Register for the codegen package.
  const libPath = path.join(CODEGEN_REPO_PATH, 'lib');
  if (fs.existsSync(libPath) && fs.readdirSync(libPath).length > 0) {
    return;
  }
  codegenLog('Building react-native-codegen package.', true);
  execSync('yarn install', {
    cwd: CODEGEN_REPO_PATH,
    stdio: 'inherit',
  });
  execSync('yarn build', {
    cwd: CODEGEN_REPO_PATH,
    stdio: 'inherit',
  });
}

function readOutputDirFromPkgJson(pkgJson, platform) {
  const codegenConfig = pkgJson.codegenConfig;
  if (codegenConfig == null || typeof codegenConfig !== 'object') {
    return null;
  }
  const outputDir = codegenConfig.outputDir;
  if (outputDir == null) {
    return null;
  }
  if (typeof outputDir === 'string') {
    return outputDir;
  }
  if (typeof outputDir === 'object') {
    return outputDir[platform];
  }
  return null;
}

function defaultOutputPathForAndroid(baseOutputPath) {
  return path.join(
    baseOutputPath,
    'android',
    'app',
    'build',
    'generated',
    'source',
    'codegen',
  );
}

function defaultOutputPathForIOS(baseOutputPath) {
  return path.join(baseOutputPath, 'build', 'generated', 'ios');
}

function computeOutputPath(projectRoot, baseOutputPath, pkgJson, platform) {
  if (baseOutputPath == null) {
    const outputDirFromPkgJson = readOutputDirFromPkgJson(pkgJson, platform);
    if (outputDirFromPkgJson != null) {
      baseOutputPath = path.join(projectRoot, outputDirFromPkgJson);
    } else {
      baseOutputPath = projectRoot;
    }
  }
  if (pkgJsonIncludesGeneratedCode(pkgJson)) {
    // Don't create nested directories for libraries to make importing generated headers easier.
    return baseOutputPath;
  }
  if (platform === 'android') {
    return defaultOutputPathForAndroid(baseOutputPath);
  }
  if (platform === 'ios') {
    return defaultOutputPathForIOS(baseOutputPath);
  }
  return baseOutputPath;
}

function reactNativeCoreLibraryOutputPath(libraryName, platform) {
  return CORE_LIBRARIES_WITH_OUTPUT_FOLDER[libraryName]
    ? CORE_LIBRARIES_WITH_OUTPUT_FOLDER[libraryName][platform]
    : null;
}

function generateSchemaInfo(library, platform) {
  const pathToJavaScriptSources = path.join(
    library.libraryPath,
    library.config.jsSrcsDir,
  );
  codegenLog(`Processing ${library.config.name}`);

  const supportedApplePlatforms = extractSupportedApplePlatforms(
    library.config.name,
    library.libraryPath,
  );

  // Generate one schema for the entire library...
  return {
    library: library,
    supportedApplePlatforms,
    schema: utils
      .getCombineJSToSchema()
      .combineSchemasInFileList(
        [pathToJavaScriptSources],
        platform,
        /NativeSampleTurboModule/,
      ),
  };
}

function shouldSkipGenerationForRncore(schemaInfo, platform) {
  if (platform !== 'ios' || schemaInfo.library.config.name !== 'rncore') {
    return false;
  }
  const rncoreOutputPath = CORE_LIBRARIES_WITH_OUTPUT_FOLDER.rncore.ios;
  const rncoreAbsolutePath = path.resolve(rncoreOutputPath);
  return (
    rncoreAbsolutePath.includes('node_modules') &&
    fs.existsSync(rncoreAbsolutePath) &&
    fs.readdirSync(rncoreAbsolutePath).length > 0
  );
}

function shouldSkipGenerationForFBReactNativeSpec(schemaInfo, platform) {
  if (
    platform !== 'ios' ||
    schemaInfo.library.config.name !== 'FBReactNativeSpec'
  ) {
    return false;
  }

  const fbReactNativeSpecOutputPath =
    CORE_LIBRARIES_WITH_OUTPUT_FOLDER.FBReactNativeSpec.ios;
  const fbReactNativeSpecAbsolutePath = path.resolve(
    fbReactNativeSpecOutputPath,
  );
  return (
    fbReactNativeSpecAbsolutePath.includes('node_modules') &&
    fs.existsSync(fbReactNativeSpecAbsolutePath) &&
    fs.readdirSync(fbReactNativeSpecAbsolutePath).length > 0
  );
}

function generateCode(outputPath, schemaInfo, includesGeneratedCode, platform) {
  if (shouldSkipGenerationForRncore(schemaInfo, platform)) {
    codegenLog(
      '[Codegen - rncore] Skipping iOS code generation for rncore as it has been generated already.',
      true,
    );
    return;
  }

  if (shouldSkipGenerationForFBReactNativeSpec(schemaInfo, platform)) {
    codegenLog(
      '[Codegen - FBReactNativeSpec] Skipping iOS code generation for FBReactNativeSpec as it has been generated already.',
      true,
    );
    return;
  }

  const libraryName = schemaInfo.library.config.name;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), libraryName));
  const tmpOutputDir = path.join(tmpDir, 'out');
  fs.mkdirSync(tmpOutputDir, {recursive: true});

  codegenLog(`Generating Native Code for ${libraryName} - ${platform}`);
  const useLocalIncludePaths = includesGeneratedCode;
  generateSpecsCLIExecutor.generateSpecFromInMemorySchema(
    platform,
    schemaInfo.schema,
    tmpOutputDir,
    libraryName,
    'com.facebook.fbreact.specs',
    schemaInfo.library.config.type,
    useLocalIncludePaths,
  );

  // Finally, copy artifacts to the final output directory.
  const outputDir =
    reactNativeCoreLibraryOutputPath(libraryName, platform) ?? outputPath;
  fs.mkdirSync(outputDir, {recursive: true});
  fs.cpSync(tmpOutputDir, outputDir, {recursive: true});
  codegenLog(`Generated artifacts: ${outputDir}`);
}

function generateSchemaInfos(libraries) {
  return libraries.map(generateSchemaInfo);
}

function generateNativeCode(
  outputPath,
  schemaInfos,
  includesGeneratedCode,
  platform,
) {
  return schemaInfos.map(schemaInfo => {
    generateCode(outputPath, schemaInfo, includesGeneratedCode, platform);
  });
}

function mustGenerateNativeCode(includeLibraryPath, schemaInfo) {
  // If library's 'codegenConfig' sets 'includesGeneratedCode' to 'true',
  // then we assume that native code is shipped with the library,
  // and we don't need to generate it.
  return (
    schemaInfo.library.libraryPath === includeLibraryPath ||
    !schemaInfo.library.config.includesGeneratedCode
  );
}

function findCodegenEnabledLibraries(pkgJson, projectRoot, reactNativeConfig) {
  const projectLibraries = findProjectRootLibraries(pkgJson, projectRoot);
  if (pkgJsonIncludesGeneratedCode(pkgJson)) {
    return projectLibraries;
  } else {
    return [
      ...projectLibraries,
      ...findExternalLibraries(pkgJson, projectRoot),
      ...findLibrariesFromReactNativeConfig(projectRoot, reactNativeConfig),
    ];
  }
}

function readReactNativeConfig(projectRoot) {
  const rnConfigFilePath = path.resolve(projectRoot, 'react-native.config.js');

  if (!fs.existsSync(rnConfigFilePath)) {
    return {};
  }

  return require(rnConfigFilePath);
}

function generateCustomURLHandlers(libraries, outputDir) {
  const customImageURLLoaderClasses = libraries
    .flatMap(
      library =>
        library?.config?.ios?.modulesConformingToProtocol?.RCTImageURLLoader,
    )
    .filter(Boolean)
    .map(className => `@"${className}"`)
    .join(',\n\t\t\t');

  const customImageDataDecoderClasses = libraries
    .flatMap(
      library =>
        library?.config?.ios?.modulesConformingToProtocol?.RCTImageDataDecoder,
    )
    .filter(Boolean)
    .map(className => `@"${className}"`)
    .join(',\n\t\t\t');

  const customURLHandlerClasses = libraries
    .flatMap(
      library =>
        library?.config?.ios?.modulesConformingToProtocol?.RCTURLRequestHandler,
    )
    .filter(Boolean)
    .map(className => `@"${className}"`)
    .join(',\n\t\t\t');

  const template = fs.readFileSync(MODULES_PROTOCOLS_MM_TEMPLATE_PATH, 'utf8');
  const finalMMFile = template
    .replace(/{imageURLLoaderClassNames}/, customImageURLLoaderClasses)
    .replace(/{imageDataDecoderClassNames}/, customImageDataDecoderClasses)
    .replace(/{requestHandlersClassNames}/, customURLHandlerClasses);

  fs.mkdirSync(outputDir, {recursive: true});

  fs.writeFileSync(
    path.join(outputDir, 'RCTModulesConformingToProtocolsProvider.mm'),
    finalMMFile,
  );

  const templateH = fs.readFileSync(MODULES_PROTOCOLS_H_TEMPLATE_PATH, 'utf8');
  fs.writeFileSync(
    path.join(outputDir, 'RCTModulesConformingToProtocolsProvider.h'),
    templateH,
  );
}

function generateAppDependencyProvider(outputDir) {
  fs.mkdirSync(outputDir, {recursive: true});
  codegenLog('Generating RCTAppDependencyProvider');

  const templateH = fs.readFileSync(
    APP_DEPENDENCY_PROVIDER_H_TEMPLATE_PATH,
    'utf8',
  );
  const finalPathH = path.join(outputDir, 'RCTAppDependencyProvider.h');
  fs.writeFileSync(finalPathH, templateH);
  codegenLog(`Generated artifact: ${finalPathH}`);

  const templateMM = fs.readFileSync(
    APP_DEPENDENCY_PROVIDER_MM_TEMPLATE_PATH,
    'utf8',
  );
  const finalPathMM = path.join(outputDir, 'RCTAppDependencyProvider.mm');
  fs.writeFileSync(finalPathMM, templateMM);
  codegenLog(`Generated artifact: ${finalPathMM}`);

  // Generate the podspec file
  const templatePodspec = fs
    .readFileSync(APP_DEPENDENCY_PROVIDER_PODSPEC_TEMPLATE_PATH, 'utf8')
    .replace(/{react-native-version}/, packageJson.version)
    .replace(/{react-native-licence}/, packageJson.license);
  const finalPathPodspec = path.join(
    outputDir,
    'ReactAppDependencyProvider.podspec',
  );
  fs.writeFileSync(finalPathPodspec, templatePodspec);
  codegenLog(`Generated podspec: ${finalPathPodspec}`);
}

function generateRCTModuleProviders(
  projectRoot,
  pkgJson,
  libraries,
  outputDir,
) {
  fs.mkdirSync(outputDir, {recursive: true});
  // Generate Header File
  codegenLog('Generating RCTModulesProvider.h');
  const templateH = fs.readFileSync(MODULE_PROVIDERS_H_TEMPLATE_PATH, 'utf8');
  const finalPathH = path.join(outputDir, 'RCTModuleProviders.h');
  fs.writeFileSync(finalPathH, templateH);
  codegenLog(`Generated artifact: ${finalPathH}`);

  codegenLog('Generating RCTModuleProviders.mm');
  let modulesInLibraries = {};

  let app = pkgJson.codegenConfig
    ? {config: pkgJson.codegenConfig, libraryPath: projectRoot}
    : null;
  libraries
    .concat(app)
    .filter(Boolean)
    .forEach(({config, libraryPath}) => {
      if (
        isReactNativeCoreLibrary(config.name) ||
        config.type === 'components'
      ) {
        return;
      }

      const libraryName = JSON.parse(
        fs.readFileSync(path.join(libraryPath, 'package.json')),
      ).name;
      if (config.ios?.modulesProvider) {
        modulesInLibraries[libraryName] = Object.keys(
          config.ios?.modulesProvider,
        ).map(moduleName => {
          return {
            moduleName,
            className: config.ios?.modulesProvider[moduleName],
          };
        });
      }
    });

  const modulesMapping = Object.keys(modulesInLibraries)
    .flatMap(library => {
      const modules = modulesInLibraries[library];
      return modules.map(({moduleName, className}) => {
        return `\t\t\t@"${moduleName}": @"${className}", // ${library}`;
      });
    })
    .join('\n');

  // Generate implementation file
  const templateMM = fs
    .readFileSync(MODULE_PROVIDERS_MM_TEMPLATE_PATH, 'utf8')
    .replace(/{moduleMapping}/, modulesMapping);
  const finalPathMM = path.join(outputDir, 'RCTModuleProviders.mm');
  fs.writeFileSync(finalPathMM, templateMM);
  codegenLog(`Generated artifact: ${finalPathMM}`);
}

function generateRCTThirdPartyComponents(libraries, outputDir) {
  fs.mkdirSync(outputDir, {recursive: true});
  // Generate Header File
  codegenLog('Generating RCTThirdPartyComponentsProvider.h');
  const templateH = fs.readFileSync(
    THIRD_PARTY_COMPONENTS_H_TEMPLATE_PATH,
    'utf8',
  );
  const finalPathH = path.join(outputDir, 'RCTThirdPartyComponentsProvider.h');
  fs.writeFileSync(finalPathH, templateH);
  codegenLog(`Generated artifact: ${finalPathH}`);

  codegenLog('Generating RCTThirdPartyComponentsProvider.mm');
  let componentsInLibraries = {};
  libraries.forEach(({config, libraryPath}) => {
    if (isReactNativeCoreLibrary(config.name) || config.type === 'modules') {
      return;
    }

    const libraryName = JSON.parse(
      fs.readFileSync(path.join(libraryPath, 'package.json')),
    ).name;
    if (config.ios?.componentProvider) {
      componentsInLibraries[libraryName] = Object.keys(
        config.ios?.componentProvider,
      ).map(componentName => {
        return {
          componentName,
          className: config.ios?.componentProvider[componentName],
        };
      });
      return;
    }
    codegenLog(`Crawling ${libraryName} library for components`);
    // crawl all files and subdirectories for file with the ".mm" extension
    const files = findFilesWithExtension(libraryPath, '.mm');

    const componentsMapping = files
      .flatMap(file => findRCTComponentViewProtocolClass(file))
      .filter(Boolean);

    if (componentsMapping.length !== 0) {
      codegenLog(
        `[DEPRECATED] ${libraryName} should add the 'ios.componentProvider' property in their codegenConfig`,
        true,
      );
    }

    componentsInLibraries[libraryName] = componentsMapping;
  });

  const thirdPartyComponentsMapping = Object.keys(componentsInLibraries)
    .flatMap(library => {
      const components = componentsInLibraries[library];
      return components.map(({componentName, className}) => {
        return `\t\t\t@"${componentName}": NSClassFromString(@"${className}"), // ${library}`;
      });
    })
    .join('\n');
  // Generate implementation file
  const templateMM = fs
    .readFileSync(THIRD_PARTY_COMPONENTS_MM_TEMPLATE_PATH, 'utf8')
    .replace(/{thirdPartyComponentsMapping}/, thirdPartyComponentsMapping);
  const finalPathMM = path.join(
    outputDir,
    'RCTThirdPartyComponentsProvider.mm',
  );
  fs.writeFileSync(finalPathMM, templateMM);
  codegenLog(`Generated artifact: ${finalPathMM}`);
}

// Given a path, return the paths of all the files with extension .mm in
// the path dir and all its subdirectories.
function findFilesWithExtension(filePath, extension) {
  const files = [];
  const dir = fs.readdirSync(filePath);
  dir.forEach(file => {
    const absolutePath = path.join(filePath, file);
    // Exclude files provided by react-native
    if (absolutePath.includes(`${path.sep}react-native${path.sep}`)) {
      return null;
    }

    // Skip hidden folders, that starts with `.` but allow `.pnpm`
    if (
      absolutePath.includes(`${path.sep}.`) &&
      !absolutePath.includes(`${path.sep}.pnpm`)
    ) {
      return null;
    }

    if (
      fs.existsSync(absolutePath) &&
      fs.statSync(absolutePath).isDirectory()
    ) {
      files.push(...findFilesWithExtension(absolutePath, extension));
    } else if (file.endsWith(extension)) {
      files.push(absolutePath);
    }
  });
  return files;
}

// Given a filepath, read the file and look for a string that starts with 'Class<RCTComponentViewProtocol> '
// and ends with 'Cls(void)'. Return the string between the two.
function findRCTComponentViewProtocolClass(filepath) {
  const fileContent = fs.readFileSync(filepath, 'utf8');
  const regex = /Class<RCTComponentViewProtocol> (.*)Cls\(/;
  const match = fileContent.match(regex);
  if (match) {
    const componentName = match[1];

    // split the file by \n
    // remove all the lines before the one that matches the regex above
    // find the first return statement after that that ends with .class
    // return what's between return and `.class`
    const lines = fileContent.split('\n');
    const signatureIndex = lines.findIndex(line => regex.test(line));
    const returnRegex = /return (.*)\.class/;
    const classNameMatch = String(lines.slice(signatureIndex)).match(
      returnRegex,
    );
    if (classNameMatch) {
      const className = classNameMatch[1];
      codegenLog(`Match found ${componentName} -> ${className}`);
      return {
        componentName,
        className,
      };
    }

    console.warn(
      `Could not find class name for component ${componentName}. Register it manually`,
    );
    return null;
  }
  return null;
}

// It removes all the empty files and empty folders
// it finds, starting from `filepath`, recursively.
//
// This function is needed since, after aligning the codegen between
// iOS and Android, we have to create empty folders in advance and
// we don't know whether they will be populated up until the end of the process.
//
// @parameter filepath: the root path from which we want to remove the empty files and folders.
function cleanupEmptyFilesAndFolders(filepath) {
  const stats = fs.statSync(filepath);

  if (stats.isFile() && stats.size === 0) {
    fs.rmSync(filepath);
    return;
  } else if (stats.isFile()) {
    return;
  }

  const dirContent = fs.readdirSync(filepath);
  dirContent.forEach(contentPath =>
    cleanupEmptyFilesAndFolders(path.join(filepath, contentPath)),
  );

  // The original folder may be filled with empty folders
  // if that the case, we would also like to remove the parent.
  // Hence, we need to read the folder again.
  const newContent = fs.readdirSync(filepath);
  if (newContent.length === 0) {
    fs.rmdirSync(filepath);
    return;
  }
}

function generateRNCoreComponentsIOS(projectRoot /*: string */) /*: void*/ {
  const ios = 'ios';
  buildCodegenIfNeeded();
  const pkgJson = readPkgJsonInDirectory(projectRoot);
  const rncoreLib = findProjectRootLibraries(pkgJson, projectRoot).filter(
    library => library.config.name === 'rncore',
  )[0];
  if (!rncoreLib) {
    throw new Error(
      "[Codegen] Can't find rncore library. Failed to generate rncore artifacts",
    );
  }
  const rncoreSchemaInfo = generateSchemaInfo(rncoreLib, ios);
  generateCode('', rncoreSchemaInfo, false, ios);
}

function generateFBReactNativeSpecIOS(projectRoot /*: string */) /*: void*/ {
  const ios = 'ios';
  buildCodegenIfNeeded();
  const pkgJson = readPkgJsonInDirectory(projectRoot);
  const fbReactNativeSpecLib = findProjectRootLibraries(
    pkgJson,
    projectRoot,
  ).filter(library => library.config.name === 'FBReactNativeSpec')[0];
  if (!fbReactNativeSpecLib) {
    throw new Error(
      "[Codegen] Can't find FBReactNativeSpec library. Failed to generate rncore artifacts",
    );
  }
  const fbReactNativeSchemaInfo = generateSchemaInfo(fbReactNativeSpecLib, ios);
  generateCode('', fbReactNativeSchemaInfo, false, ios);
}

function generateReactCodegenPodspec(
  appPath,
  appPkgJson,
  outputPath,
  baseOutputPath,
) {
  const inputFiles = getInputFiles(appPath, appPkgJson);
  const codegenScript = codegenScripts(appPath, baseOutputPath);
  const template = fs.readFileSync(REACT_CODEGEN_PODSPEC_TEMPLATE_PATH, 'utf8');
  const finalPodspec = template
    .replace(/{react-native-version}/, packageJson.version)
    .replace(/{input-files}/, inputFiles)
    .replace(/{codegen-script}/, codegenScript);
  const finalPathPodspec = path.join(outputPath, 'ReactCodegen.podspec');
  fs.writeFileSync(finalPathPodspec, finalPodspec);
  codegenLog(`Generated podspec: ${finalPathPodspec}`);
}

function getInputFiles(appPath, appPkgJSon) {
  const jsSrcsDir = appPkgJSon.codegenConfig?.jsSrcsDir;
  if (!jsSrcsDir) {
    return '[]';
  }

  const xcodeproj = String(
    execSync(`find ${appPath} -type d -name "*.xcodeproj"`),
  )
    .trim()
    .split('\n')
    .filter(
      projectPath =>
        !projectPath.includes('/Pods/') && // exclude Pods/Pods.xcodeproj
        !projectPath.includes('/node_modules/'), // exclude all the xcodeproj in node_modules of libraries
    )[0];
  const jsFiles = '-name "Native*.js" -or -name "*NativeComponent.js"';
  const tsFiles = '-name "Native*.ts" -or -name "*NativeComponent.ts"';
  const findCommand = `find ${path.join(appPath, jsSrcsDir)} -type f \\( ${jsFiles} -or ${tsFiles} \\)`;
  const list = String(execSync(findCommand))
    .trim()
    .split('\n')
    .sort()
    .map(filepath => `"\${PODS_ROOT}/${path.relative(xcodeproj, filepath)}"`)
    .join(',\n');
  return `[${list}]`;
}

function codegenScripts(appPath, outputPath) {
  const relativeAppPath = path.relative(outputPath, appPath);
  return `<<-SCRIPT
pushd "$PODS_ROOT/../" > /dev/null
RCT_SCRIPT_POD_INSTALLATION_ROOT=$(pwd)
popd >/dev/null

export RCT_SCRIPT_RN_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT/${path.relative(outputPath, REACT_NATIVE_PACKAGE_ROOT_FOLDER)}"
export RCT_SCRIPT_APP_PATH="$RCT_SCRIPT_POD_INSTALLATION_ROOT/${relativeAppPath.length === 0 ? '.' : relativeAppPath}"
export RCT_SCRIPT_OUTPUT_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT"
export RCT_SCRIPT_TYPE="withCodegenDiscovery"

SCRIPT_PHASES_SCRIPT="$RCT_SCRIPT_RN_DIR/scripts/react_native_pods_utils/script_phases.sh"
WITH_ENVIRONMENT="$RCT_SCRIPT_RN_DIR/scripts/xcode/with-environment.sh"
/bin/sh -c "$WITH_ENVIRONMENT $SCRIPT_PHASES_SCRIPT"
SCRIPT`;
}

// Execute

/**
 * This function is the entry point for the codegen. It:
 * - reads the package json
 * - extracts the libraries
 * - setups the CLI to generate the code
 * - generate the code
 *
 * @parameter projectRoot: the directory with the app source code, where the package.json lives.
 * @parameter baseOutputPath: the base output path for the CodeGen.
 * @parameter targetPlatform: the target platform. Supported values: 'android', 'ios', 'all'.
 * @parameter source: the source that is invoking codegen. Supported values: 'app', 'library'.
 * @throws If it can't find a config file for react-native.
 * @throws If it can't find a CodeGen configuration in the file.
 * @throws If it can't find a cli for the CodeGen.
 */
function execute(projectRoot, targetPlatform, baseOutputPath, source) {
  try {
    codegenLog(`Analyzing ${path.join(projectRoot, 'package.json')}`);

    const supportedPlatforms = ['android', 'ios'];
    if (
      targetPlatform !== 'all' &&
      !supportedPlatforms.includes(targetPlatform)
    ) {
      throw new Error(
        `Invalid target platform: ${targetPlatform}. Supported values are: ${supportedPlatforms.join(
          ', ',
        )}, all`,
      );
    }

    const pkgJson = readPkgJsonInDirectory(projectRoot);

    buildCodegenIfNeeded();

    const reactNativeConfig = readReactNativeConfig(projectRoot);
    const codegenEnabledLibraries = findCodegenEnabledLibraries(
      pkgJson,
      projectRoot,
      reactNativeConfig,
    );

    if (codegenEnabledLibraries.length === 0) {
      codegenLog('No codegen-enabled libraries found.', true);
      return;
    }

    let platforms =
      targetPlatform === 'all' ? supportedPlatforms : [targetPlatform];

    for (const platform of platforms) {
      const disabledLibraries = findDisabledLibrariesByPlatform(
        reactNativeConfig,
        platform,
      );

      const libraries = codegenEnabledLibraries.filter(
        ({name}) => !disabledLibraries.includes(name),
      );

      if (!libraries.length) {
        continue;
      }

      const outputPath = computeOutputPath(
        projectRoot,
        baseOutputPath,
        pkgJson,
        platform,
      );

      const schemaInfos = generateSchemaInfos(libraries);
      generateNativeCode(
        outputPath,
        schemaInfos.filter(schemaInfo =>
          mustGenerateNativeCode(projectRoot, schemaInfo),
        ),
        pkgJsonIncludesGeneratedCode(pkgJson),
        platform,
      );

      if (source === 'app' && platform !== 'android') {
        // These components are only required by apps, not by libraries. They are also Apple specific.
        generateRCTThirdPartyComponents(libraries, outputPath);
        generateRCTModuleProviders(projectRoot, pkgJson, libraries, outputPath);
        generateCustomURLHandlers(libraries, outputPath);
        generateAppDependencyProvider(outputPath);
        generateReactCodegenPodspec(
          projectRoot,
          pkgJson,
          outputPath,
          baseOutputPath,
        );
      }

      cleanupEmptyFilesAndFolders(outputPath);
    }
  } catch (err) {
    codegenLog(err);
    process.exitCode = 1;
  }

  codegenLog('Done.', true);
  return;
}

module.exports = {
  execute,
  generateRNCoreComponentsIOS,
  generateFBReactNativeSpecIOS,
  // exported for testing purposes only:
  _extractLibrariesFromJSON: extractLibrariesFromJSON,
  _cleanupEmptyFilesAndFolders: cleanupEmptyFilesAndFolders,
  _extractSupportedApplePlatforms: extractSupportedApplePlatforms,
};
