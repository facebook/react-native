#!/usr/bin/env node
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

 'use strict';

 /**
  * This script bumps a new version for open source releases.
  * It updates the version in json/gradle files and makes sure they are consistent between each other
  * After changing the files it makes a commit and tags it.
  * All you have to do is push changes to remote and CI will make a new build.
  */
 const fs = require('fs');
 const {cat, echo, exec, exit, sed} = require('shelljs');
 const yargs = require('yargs');
 const {parseVersion} = require('./version-utils');

 let argv = yargs
   .option('r', {
     alias: 'remote',
     default: 'origin',
   })
   .option('p', { // [MacOS: Used during RNM's publish pipelines
    alias: 'rnmpublish',
    type: 'boolean',
    default: false,
  })
   .option('n', {
     alias: 'nightly',
     type: 'boolean',
     default: false,
   })
   .option('a', { // TODO(macOS GH#774): See note below
     alias: 'autogenerate-version-number',
     type: 'boolean',
     default: false,
   })
   .option('v', {
     alias: 'to-version',
     type: 'string',
   })
   .option('l', {
     alias: 'latest',
     type: 'boolean',
     default: false,
   }).argv;

 const autogenerateVersionNumber = argv.autogenerateVersionNumber;
 const nightlyBuild = argv.nightly;
 let version = argv.toVersion;

 if (!version) {
   // TODO(macOS GH#774): Some of our calls to bump-oss-version.js still depend on an automatically generated version number
   if (nightlyBuild && autogenerateVersionNumber) {
     const currentCommit = exec('git rev-parse HEAD', {
       silent: true,
     }).stdout.trim();
     version = `0.0.0-${currentCommit.slice(0, 9)}`;
   } else {
     echo(
       'You must specify a version using -v',
     );
     exit(1);
   }
 }

 let branch;
 if (!nightlyBuild) {
   // Check we are in release branch, e.g. 0.33-stable
   if (process.env.BUILD_SOURCEBRANCH) {
     console.log(`BUILD_SOURCEBRANCH: ${process.env.BUILD_SOURCEBRANCH}`);
     branch = process.env.BUILD_SOURCEBRANCH.match(/refs\/heads\/(.*)/)[1];
     console.log(`Identified branch: ${branch}`);
   } else {
     branch = exec('git symbolic-ref --short HEAD', {
       silent: true,
     }).stdout.trim();
   }

   if (branch.indexOf('-stable') === -1) {
     echo('You must be in 0.XX-stable branch to bump a version');
     exit(1);
   }

   // e.g. 0.33
   let versionMajor = branch.slice(0, branch.indexOf('-stable'));

   // - check that argument version matches branch
   // e.g. 0.33.1 or 0.33.0-rc4
   if (version.indexOf(versionMajor) !== 0) {
     echo(
       `You must specify a version tag like 0.${versionMajor}.[X]-rc[Y] to bump a version`,
     );
     exit(1);
   }
 }

 let major,
   minor,
   patch,
   prerelease = -1;
 try {
   ({major, minor, patch, prerelease} = parseVersion(version));
 } catch (e) {
   echo(e.message);
   exit(1);
 }

 fs.writeFileSync(
   'ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.java',
   cat('scripts/versiontemplates/ReactNativeVersion.java.template')
     .replace('${major}', major)
     .replace('${minor}', minor)
     .replace('${patch}', patch)
     .replace(
       '${prerelease}',
       prerelease !== undefined ? `"${prerelease}"` : 'null',
     ),
   'utf-8',
 );

 fs.writeFileSync(
   'React/Base/RCTVersion.m',
   cat('scripts/versiontemplates/RCTVersion.m.template')
     .replace('${major}', `@(${major})`)
     .replace('${minor}', `@(${minor})`)
     .replace('${patch}', `@(${patch})`)
     .replace(
       '${prerelease}',
       prerelease !== undefined ? `@"${prerelease}"` : '[NSNull null]',
     ),
   'utf-8',
 );

 fs.writeFileSync(
   'ReactCommon/cxxreact/ReactNativeVersion.h',
   cat('scripts/versiontemplates/ReactNativeVersion.h.template')
     .replace('${major}', major)
     .replace('${minor}', minor)
     .replace('${patch}', patch)
     .replace(
       '${prerelease}',
       prerelease !== undefined ? `"${prerelease}"` : '""',
     ),
   'utf-8',
 );

 fs.writeFileSync(
   'Libraries/Core/ReactNativeVersion.js',
   cat('scripts/versiontemplates/ReactNativeVersion.js.template')
     .replace('${major}', major)
     .replace('${minor}', minor)
     .replace('${patch}', patch)
     .replace(
       '${prerelease}',
       prerelease !== undefined ? `'${prerelease}'` : 'null',
     ),
   'utf-8',
 );

 let packageJson = JSON.parse(cat('package.json'));
 packageJson.version = version;

 // [MacOS - We do this seperately in a non-destructive way as part of our publish steps
//  delete packageJson.workspaces;
//  delete packageJson.private;

 // Copy dependencies over from repo-config/package.json
//  const repoConfigJson = JSON.parse(cat('repo-config/package.json'));
//  packageJson.devDependencies = {...packageJson.devDependencies, ...repoConfigJson.dependencies};
//  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2), 'utf-8');
// macOS]

 // Change ReactAndroid/gradle.properties
 if (
   sed(
     '-i',
     /^VERSION_NAME=.*/,
     `VERSION_NAME=${version}`,
     'ReactAndroid/gradle.properties',
   ).code
 ) {
   echo("Couldn't update version for Gradle");
   exit(1);
 }

 // Change react-native version in the template's package.json
 exec(`node scripts/set-rn-template-version.js ${version}`);

 // Verify that files changed, we just do a git diff and check how many times version is added across files
 const filesToValidate = [
   'package.json',
   'ReactAndroid/gradle.properties',
   'template/package.json',
 ];
 let numberOfChangedLinesWithNewVersion = exec(
   `git diff -U0 ${filesToValidate.join(' ')}| grep '^[+]' | grep -c ${version} `,
   {silent: true},
 ).stdout.trim();

 // Release builds should commit the version bumps, and create tags.
 // Nightly builds do not need to do that.
 if (!nightlyBuild) {
   if (+numberOfChangedLinesWithNewVersion !== filesToValidate.length) {
     echo(
       `Failed to update all the files: [${filesToValidate.join(', ')}] must have versions in them`,
     );
     echo('Fix the issue, revert and try again');
     exec('git diff');
     exit(1);
   }

   // [macOS we run this script when publishing react-native-macos and when publishing react-native microsoft fork
   // The react-native publish build runs on an agent without cocopods - so we cannot update the podfile.lock
   if (require('../package.json').name !== 'react-native-macos') {
     exit(0);
   }

   // Update Podfile.lock only on release builds, not nightlies.
   // Nightly builds don't need it as the main branch will already be up-to-date.
   echo('Updating RNTester Podfile.lock...');
   if (exec('. scripts/update_podfile_lock.sh && update_pods').code) {
     echo('Failed to update RNTester Podfile.lock.');
     echo('Fix the issue, revert and try again.');
     exit(1);
   }

   // [macOS we run this script when publishing react-native-macos and when publishing react-native microsoft fork
   // We have seperate logic to tag and commit changes.  -- If we used the rest of the logic we'd end up with two publish jobs
   // competing and conflicting to tag / commit the changes.
   if (argv.rnmpublish) {
     exit(0);
   }

   // Make commit [0.21.0-rc] Bump version numbers
   if (exec(`git commit -a -m "[${version}] Bump version numbers"`).code) {
     echo('failed to commit');
     exit(1);
   }

   // Add tag v0.21.0-rc
   if (exec(`git tag v${version}`).code) {
     echo(
       `failed to tag the commit with v${version}, are you sure this release wasn't made earlier?`,
     );
     echo('You may want to rollback the last commit');
     echo('git reset --hard HEAD~1');
     exit(1);
   }

   // Push newly created tag
   let remote = argv.remote;
   exec(`git push ${remote} v${version}`);

   // Tag latest if doing stable release.
   // This will also tag npm release as `latest`
   if (prerelease == null && argv.latest) {
     exec('git tag -d latest');
     exec(`git push ${remote} :latest`);
     exec('git tag latest');
     exec(`git push ${remote} latest`);
   }

   exec(`git push ${remote} ${branch} --follow-tags`);

 }

 exit(0);
