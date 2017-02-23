/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const copyProjectTemplateAndReplace = require('./copyProjectTemplateAndReplace');
const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

/**
 * Templates released as part of react-native in local-cli/templates.
 * It's also possible to use templates from npm.
 */
const builtInTemplates = {
  navigation: 'HelloNavigation',
};

function listTemplatesAndExit(newProjectName, options) {
  if (options.template === true) {
    // Just listing templates using 'react-native init --template'.
    // Not creating a new app.
    // Print available templates and exit.
    const templateKeys = Object.keys(builtInTemplates);
    if (templateKeys.length === 0) {
      // Just a guard, should never happen as long builtInTemplates
      // above is defined correctly :)
      console.log(
        'There are no templates available besides ' +
        'the default "Hello World" one.'
      );
    } else {
      console.log(
        'The available templates are:\n' +
        templateKeys.join('\n') +
        '\nYou can use these to create an app based on a template, for example: ' +
        'you could run: ' +
        'react-native init ' + newProjectName + ' --template ' + templateKeys[0]
      );
    }
    // Exit 'react-native init'
    return true;
  }
  // Continue 'react-native init'
  return false;
}

/**
 * @param newProjectName For example 'AwesomeApp'.
 * @param templateKey Template to use, for example 'navigation'.
 * @param yarnVersion Version of yarn available on the system, or null if
 *                    yarn is not available. For example '0.18.1'.
 */
function createProjectFromTemplate(destPath, newProjectName, templateKey, yarnVersion) {
  // Expand the basic 'HelloWorld' template
  copyProjectTemplateAndReplace(
    path.resolve('node_modules', 'react-native', 'local-cli', 'templates', 'HelloWorld'),
    destPath,
    newProjectName
  );

  if (templateKey === undefined) {
    // No specific template, use just the HelloWorld template above
    return;
  }

  // Keep the files from the 'HelloWorld' template, and overwrite some of them
  // with the specified project template.
  // The 'HelloWorld' template contains the native files (these are used by
  // all templates) and every other template only contains additional JS code.
  // Reason:
  // This way we don't have to duplicate the native files in every template.
  // If we duplicated them we'd make RN larger and risk that people would
  // forget to maintain all the copies so they would go out of sync.
  const builtInTemplateName = builtInTemplates[templateKey];
  if (builtInTemplateName) {
    // templateKey is e.g. 'navigation',
    // use the built-in local-cli/templates/HelloNavigation folder
    createFromBuiltInTemplate(builtInTemplateName, destPath, newProjectName, yarnVersion);
  } else {
    // templateKey is e.g. 'ignite',
    // use the template react-native-template-ignite from npm
    createFromNpmTemplate(templateKey, destPath, newProjectName, yarnVersion);
  }
}

// (We might want to get rid of built-in templates in the future -
// publish them to npm and install from there.)
function createFromBuiltInTemplate(templateName, destPath, newProjectName, yarnVersion) {
  const templatePath = path.resolve(
    'node_modules', 'react-native', 'local-cli', 'templates', templateName
  );
  copyProjectTemplateAndReplace(
    templatePath,
    destPath,
    newProjectName,
  );
  installTemplateDependencies(templatePath, yarnVersion);
}

function createFromNpmTemplate(templateName, destPath, newProjectName, yarnVersion) {
  const packageName = 'react-native-template-' + templateName;
  // Check if the template exists
  console.log(`Fetching template ${packageName} from npm...`);
  try {
    if (yarnVersion) {
      execSync(`yarn info ${packageName}`);
    } else {
      execSync(`npm info ${packageName}`);
    }
  } catch (err) {
    throw new Error(`The template ${packageName} was not found on npm:\n` + err.message);
  }
  const templatePath = path.resolve(
    'node_modules', packageName
  );
  try {
    if (yarnVersion) {
      execSync(`yarn add ${packageName} --ignore-scripts`, {stdio: 'inherit'});
    } else {
      execSync(`npm install ${packageName} --save --save-exact --ignore-scripts`, {stdio: 'inherit'});
    }
    // TODO debug this, package.json is getting overwritten
    console.log('====== installed template in ' + templatePath);
    console.log('====== copyProjectTemplateAndReplace ', { templatePath, destPath, newProjectName });
    copyProjectTemplateAndReplace(
      templatePath,
      destPath,
      newProjectName,
    );
  } finally {
    // Clean up the temp files
    try {
      if (yarnVersion) {
        execSync(`yarn remove ${packageName} --ignore-scripts`);
      } else {
        execSync(`npm uninstall ${packageName} --ignore-scripts`);
      }
    } catch (err) {
      console.warn(
        `Failed to clean up template temp files in node_modules/${packageName}. ` +
        'This is not a critical error, you can work on your app.'
      );
    }
  }
  installTemplateDependencies(templatePath, yarnVersion);
}

function installTemplateDependencies(templatePath, yarnVersion) {
  // dependencies.json is a special file that lists additional dependencies
  // that are required by this template
  const dependenciesJsonPath = path.resolve(
    templatePath, 'dependencies.json'
  );
  if (!fs.existsSync(dependenciesJsonPath)) {
    return;
  }
  console.log('Adding dependencies for the project...');
  let dependencies;
  try {
    dependencies = JSON.parse(fs.readFileSync(dependenciesJsonPath));
  } catch (err) {
    throw new Error(
      'Could not parse the template\'s dependencies.json: ' + err.message
    );
  }
  for (let depName in dependencies) {
    const depVersion = dependencies[depName];
    const depToInstall = depName + '@' + depVersion;
    console.log('Adding ' + depToInstall + '...');
    if (yarnVersion) {
      execSync(`yarn add ${depToInstall}`, {stdio: 'inherit'});
    } else {
      execSync(`npm install ${depToInstall} --save --save-exact`, {stdio: 'inherit'});
    }
  }
  execSync('react-native link');
}

module.exports = {
  listTemplatesAndExit,
  createProjectFromTemplate,
};
