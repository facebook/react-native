const path = require('path');
const fs = require('fs');
const glob = require('glob');
const findAndroidAppFolder = require('./findAndroidAppFolder');
const findManifest = require('./findManifest');
const readManifest = require('./readManifest');
const findPackageClassName = require('./findPackageClassName');

const getPackageName = (manifest) => manifest.attr.package;

/**
 * Gets android project config by analyzing given folder and taking some
 * defaults specified by user into consideration
 */
exports.projectConfig = function projectConfigAndroid(folder, userConfig) {
  const src = userConfig.sourceDir || findAndroidAppFolder(folder);

  if (!src) {
    return null;
  }

  const sourceDir = path.join(folder, src);
  const isFlat = sourceDir.indexOf('app') === -1;
  const manifestPath = findManifest(sourceDir);

  if (!manifestPath) {
    return null;
  }

  const manifest = readManifest(manifestPath);

  const packageName = userConfig.packageName || getPackageName(manifest);
  const packageFolder = userConfig.packageFolder ||
    packageName.replace(/\./g, path.sep);

  // variable misnomer - Actually set to application path for 0.29+
  let mainActivityPath = null;

  mainActivityPath = path.join(
    sourceDir,
    userConfig.mainActivityPath || `src/main/java/${packageFolder}/MainActivity.java`
  );

  // If MainApplication.java exists, use that instead
  const mainApplicationPath = path.join(
    sourceDir,
    userConfig.mainApplicationPath || `src/main/java/${packageFolder}/MainApplication.java`
  );

  fs.accessSync(mainApplicationPath, fs.F_OK, function(err) {
    if (!err) {
      // point at application instead
      mainActivityPath = mainApplicationPath;
    }
  });


  const stringsPath = path.join(
    sourceDir,
    userConfig.stringsPath || 'src/main/res/values/strings.xml'
  );

  const settingsGradlePath = path.join(
    folder,
    'android',
    userConfig.settingsGradlePath || 'settings.gradle'
  );

  const assetsPath = path.join(
    sourceDir,
    userConfig.assetsPath || 'src/main/assets'
  );

  const buildGradlePath = path.join(
    sourceDir,
    userConfig.buildGradlePath || 'build.gradle'
  );

  return {
    sourceDir,
    isFlat,
    folder,
    stringsPath,
    manifestPath,
    buildGradlePath,
    settingsGradlePath,
    assetsPath,
    mainActivityPath,
  };
};

/**
 * Same as projectConfigAndroid except it returns
 * different config that applies to packages only
 */
exports.dependencyConfig = function dependencyConfigAndroid(folder, userConfig) {
  const src = userConfig.sourceDir || findAndroidAppFolder(folder);

  if (!src) {
    return null;
  }

  const sourceDir = path.join(folder, src);
  const manifestPath = findManifest(sourceDir);

  if (!manifestPath) {
    return null;
  }

  const manifest = readManifest(manifestPath);
  const packageName = userConfig.packageName || getPackageName(manifest);
  const packageClassName = findPackageClassName(sourceDir);

  /**
   * This module has no package to export
   */
  if (!packageClassName) {
    return null;
  }

  const packageImportPath = userConfig.packageImportPath ||
    `import ${packageName}.${packageClassName};`;

  const packageInstance = userConfig.packageInstance ||
    `new ${packageClassName}()`;

  return { sourceDir, folder, manifest, packageImportPath, packageInstance };
};
