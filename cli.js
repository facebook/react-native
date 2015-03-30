/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var uuid = require('node-uuid');

function printUsage() {
  console.log([
    'Usage: react-native <command>',
    '',
    'Commands:',
    '  start: starts the webserver',
    '  link: link the target library the current project',
  ].join('\n'));
  process.exit(1);
}

function run() {
  var args = process.argv.slice(2);
  if (args.length === 0) {
    printUsage();
  }

  switch (args[0]) {
  case 'start':
    spawn('sh', [
      path.resolve(__dirname, 'packager', 'packager.sh'),
      '--projectRoots',
      process.cwd(),
    ], {stdio: 'inherit'});
    break;
  case 'link':
    if (!args[1]) {
      console.error('Usage: react-native link <path>');
      return;
    }
    link(args[1]);
    break;
  default:
    console.error('Command `%s` unrecognized', args[0]);
    printUsage();
  }
  // Here goes any cli commands we need to
}

function init(root, projectName) {
  spawn(path.resolve(__dirname, 'init.sh'), [projectName], {stdio:'inherit'});
}

function link(libraryPath) {
  libraryPath = path.relative(process.cwd(), path.resolve(process.cwd(), libraryPath));
  var packagePath = path.resolve(libraryPath, 'package.json');
  var pkg = require(packagePath);
  var name = pkg['react-native'].xcodeproj;
  var targetName = pkg['react-native'].target || name;
  var hash = getHash();
  var xcodeprojName = name + '.xcodeproj';
  var staticLibraryPath = pkg['react-native'].staticLibrary || 'lib' + name + '.a';
  var pbxprojPath = path.resolve(process.cwd(), libraryPath,
                                 xcodeprojName, 'project.pbxproj')

  readProject(pbxprojPath, function (err, pbxproj) {
    if (err) throw err;

    var projectID = pbxproj.rootObject;
    var project = pbxproj.objects[projectID];
    var targets = project.targets.map(function (id) {
      return pbxproj.objects[id];
    }).filter(function (target) {
      return target.name === targetName;
    });

    console.assert(targets.length === 1,
                  'More than one target found', targets);

    var target = targets[0];

    console.assert(target.productType === 'com.apple.product-type.library.static',
                   'Target is not a static library, found:', target.productType);

    // Leave it on top since other sections depend on it.
    var PBXReferenceProxyHash = getHash();
    var PBXFileReferenceHash = getHash();

    var PBXBuildFileHash = getHash();
    var PBXBuildFile = {
      isa: 'PBXBuildFile',
      fileRef: PBXReferenceProxyHash,
    };

    var PBXContainerItemProxyHash = getHash();
    var PBXContainerItemProxy = {
      isa: 'PBXContainerItemProxy',
      containerPortal: PBXFileReferenceHash,
      proxyType: 2,
      remoteGlobalIDString: target.productReference,
      remoteInfo: name,
    };

    var PBXFileReference = {
      isa: 'PBXFileReference',
      lastKnownFileType: 'wrapper.pb-project',
      name: xcodeprojName,
      path: path.join(libraryPath, xcodeprojName),
      sourceTree: '<group>',
    };

    var PBXFrameworksBuildPhase = PBXBuildFileHash;

    var PBXGroupHash = getHash();
    var PBXGroup = {
      isa: 'PBXGroup',
      children: [
        PBXReferenceProxyHash,
      ],
      name: 'Products',
      sourceTree: '<group>',
    };

    var LibrariesHash = PBXFileReferenceHash;

    var ProjectReferece = {
      ProductGroup: PBXGroupHash,
      ProjectRef: PBXFileReferenceHash
    };

    var PBXReferenceProxy = {
      isa: 'PBXReferenceProxy',
      fileType: 'archive.ar',
      paht: staticLibraryPath,
      remoteRef: PBXContainerItemProxyHash,
      sourceTree: 'BUILT_PRODUCTS_DIR',
    };

    var HeadersPath = '$(SRCROOT)/' + libraryPath;

    var sourcePkg = require(path.resolve(
      process.cwd(),
      './package.json'
    ));
    var sourceXcodeprojName = sourcePkg['react-native'].xcodeproj;
    var sourcePbxprojPath = path.resolve(
      process.cwd(),
      sourceXcodeprojName + '.xcodeproj',
      'project.pbxproj'
    );

    readProject(sourcePbxprojPath, function (err, sourcePbxproj) {
      if (err) throw err;
      var sourceRootID = sourcePbxproj.rootObject;
      var PBXProject = sourcePbxproj.objects[sourceRootID];

      PBXProject.projectReferences.push(
        ProjectReferece
      );

      PBXProject.targets.forEach(function (targetHash) {
        var target = sourcePbxproj.objects[targetHash];
        target.buildPhases.forEach(function (buildPhaseHash) {
          var buildPhase = sourcePbxproj.objects[buildPhaseHash];
          if (buildPhase.isa === 'PBXFrameworksBuildPhase') {
            buildPhase.files.push(PBXBuildFileHash);
          }
        })
      });

      var buildConfigurationList = sourcePbxproj.objects[PBXProject.buildConfigurationList];
      buildConfigurationList.buildConfigurations.forEach(function (buildConfigurationHash) {
        var buildConfiguration = sourcePbxproj.objects[buildConfigurationHash];
        buildConfiguration.buildSettings.HEADER_SEARCH_PATHS.push(
          HeadersPath
        );
      });

      var mainGroup = sourcePbxproj.objects[PBXProject.mainGroup];
      mainGroup.children.forEach(function (childHash) {
        var child = sourcePbxproj.objects[childHash];
        if (child.name === 'Libraries') {
          child.children.push(PBXFileReferenceHash);
        }
      });

      sourcePbxproj.objects[PBXBuildFileHash] = PBXBuildFile;
      sourcePbxproj.objects[PBXContainerItemProxyHash] = PBXContainerItemProxy;
      sourcePbxproj.objects[PBXFileReferenceHash] = PBXFileReference;
      sourcePbxproj.objects[PBXGroupHash] = PBXGroup;
      sourcePbxproj.objects[PBXReferenceProxyHash] = PBXReferenceProxy;

      var output = OldPlist.stringify(sourcePbxproj);
      fs.writeFileSync(sourcePbxprojPath, output);
    });
  });
}

var OldPlist = {
  stringify: function (object, level) {
    var HEADER = '// !$*UTF8*$!\n';
    var INDENT_SIZE = 2;

    function indent(str, level) {
      var _indent = '';
      level *= INDENT_SIZE;
      while (level--) {
        _indent += ' ';
      }
      return _indent + str;
    }

    function _stringify(object, level) {
      if (Array.isArray(object)) {
        return '(\n' + _stringifyArray(object, level + 1) + '\n' + indent(')', level);
      } else if (typeof object === 'object') {
        return '{\n' + _stringifyObject(object, level + 1) + '\n' + indent('}', level);
      } else {
        return _stringifyString(''+object);
      }
    }

    function _stringifyObject(object, level) {
      return Object.keys(object).map(function (key) {
        return indent(_stringifyString(key) + ' = ' + _stringify(object[key], level) + ';', level);
      }).join('\n');
    }

    function _stringifyString(str) {
      return !str || /\W/.test(str) ? '"' + str + '"' : str;
    }

    function _stringifyArray(array, level) {
      return array.map(function (value) {
        return indent(_stringify(value, level), level);
      }).join(',\n');
    }

    return HEADER + _stringify(object, 0);
  }
};

function readProject(pbxprojPath, callback) {
  var plutil = spawn('plutil', [
    '-convert',
    'json',
    '-o',
    '-',
    pbxprojPath
  ]);

  var data = '';
  var error = '';
  plutil.stdout.on('data', function (d) {
    data += d.toString();
  });

  plutil.stderr.on('data', function (d) {
    error += d.toString();
  });

  plutil.on('close', function (code) {
    callback(
      error && new Error(error),
      data && JSON.parse(data)
    );
  });
}

function getHash() {
  return uuid.v4().split('-').slice(1).join('').toUpperCase();
}

module.exports = {
  run: run,
  init: init,
};
