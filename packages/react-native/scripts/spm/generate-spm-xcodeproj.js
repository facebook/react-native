/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/*:: import type {GenerateXcodeprojArgs} from './spm-types'; */

/**
 * generate-spm-xcodeproj.js – Generates a <AppName>-SPM.xcodeproj that uses
 * the SPM Package.swift as its dependency source. This provides proper code
 * signing, asset handling, and device deployment that a bare SPM executable
 * target cannot provide.
 *
 * Usage:
 *   node generate-spm-xcodeproj.js [options]
 *
 * Options:
 *   --app-root <path>            Path to the app directory (default: cwd)
 *   --react-native-root <path>   Path to react-native package root
 *   --app-name <name>            App name (default: from package.json)
 *   --source-path <path>         Path to app source relative to app-root
 *   --ios-version <ver>          Minimum iOS version (default: 15)
 *   --bundle-identifier <id>     Bundle identifier (default: com.facebook.<AppName>)
 *   --entry-file <path>          JS entry file relative to app root (default: package.json "main" or index.js)
 */

const {findSourcePath} = require('./generate-spm-package');
const {
  fileTypeForExtension,
  generateUUID,
  quoteIfNeeded,
  scanProjectFiles,
  serializePbxproj,
} = require('./spm-pbxproj');
const {findProjectRoot, makeLogger, toSwiftName} = require('./spm-utils');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const {log} = makeLogger('generate-spm-xcodeproj');

function parseArgs(argv /*: Array<string> */) /*: GenerateXcodeprojArgs */ {
  const parsed = yargs(argv)
    .version(false)
    .option('app-root', {
      type: 'string',
      default: process.cwd(),
      describe: 'Path to the app directory',
    })
    .option('react-native-root', {
      type: 'string',
      describe: 'Path to react-native package root',
    })
    .option('app-name', {
      type: 'string',
      describe: 'App name (default: from package.json)',
    })
    .option('source-path', {
      type: 'string',
      describe: 'Path to app source relative to app-root',
    })
    .option('ios-version', {
      type: 'string',
      default: '15',
      describe: 'Minimum iOS version',
    })
    .option('bundle-identifier', {
      type: 'string',
      describe: 'Bundle identifier (default: com.facebook.<AppName>)',
    })
    .option('entry-file', {
      type: 'string',
      describe: 'JS entry file relative to app root (default: index.js)',
    })
    .usage(
      'Usage: $0 [options]\n\nGenerates a <AppName>-SPM.xcodeproj for a React Native app using SPM.',
    )
    .help()
    .parseSync();

  return {
    appRoot: parsed['app-root'],
    reactNativeRoot: parsed['react-native-root'] ?? null,
    appName: parsed['app-name'] ?? null,
    sourcePath: parsed['source-path'] ?? null,
    iosVersion: parsed['ios-version'],
    bundleIdentifier: parsed['bundle-identifier'] ?? null,
    entryFile: parsed['entry-file'] ?? null,
  };
}

// ---------------------------------------------------------------------------
// UUID helper – all UUIDs are deterministic from project + section + id
// ---------------------------------------------------------------------------

function uuid(projectName /*: string */, section /*: string */, id /*: string */) /*: string */ {
  return generateUUID(`${projectName}:${section}:${id}`);
}

// ---------------------------------------------------------------------------
// SPM product dependencies
// ---------------------------------------------------------------------------

// Maps each SPM product to its sub-package path (relative to app root).
// The xcodeproj must reference each sub-package directly so Xcode can
// resolve the product dependencies — SPM doesn't expose transitive products.
const SPM_PRODUCT_PACKAGES /*: Array<{product: string, packagePath: string, packageName: string}> */ = [
  {product: 'ReactNative', packagePath: 'build/xcframeworks', packageName: 'ReactNative'},
  {product: 'ReactNativeDependencies', packagePath: 'build/xcframeworks', packageName: 'ReactNative'},
  {product: 'hermes-engine', packagePath: 'build/xcframeworks', packageName: 'ReactNative'},
  {product: 'Autolinked', packagePath: 'autolinked', packageName: 'Autolinked'},
  {product: 'ReactCodegen', packagePath: 'build/generated/ios', packageName: 'React-GeneratedCode'},
  {product: 'ReactAppDependencyProvider', packagePath: 'build/generated/ios', packageName: 'React-GeneratedCode'},
];

const SPM_PRODUCTS = SPM_PRODUCT_PACKAGES.map(p => p.product);

// ---------------------------------------------------------------------------
// pbxproj generator
// ---------------------------------------------------------------------------

function generatePbxproj(opts /*: {
  appName: string,
  sourcePath: string,
  iosVersion: string,
  bundleIdentifier: string,
  reactNativePath: string,
  files: {sources: Array<string>, headers: Array<string>, resources: Array<string>, plists: Array<string>},
  hasPrivacyInfo: boolean,
  entryFile?: string,
} */) /*: string */ {
  const {appName, sourcePath, iosVersion, bundleIdentifier, reactNativePath, files, hasPrivacyInfo} = opts;
  const entryFile = opts.entryFile ?? 'index.js';

  // Well-known UUIDs
  const projectUUID = uuid(appName, 'PBXProject', 'root');
  const mainGroupUUID = uuid(appName, 'PBXGroup', 'mainGroup');
  const sourcesGroupUUID = uuid(appName, 'PBXGroup', 'sourcesGroup');
  const productsGroupUUID = uuid(appName, 'PBXGroup', 'Products');
  const targetUUID = uuid(appName, 'PBXNativeTarget', appName);
  const productRefUUID = uuid(appName, 'PBXFileReference', `${appName}.app`);
  const sourcesBuildPhaseUUID = uuid(appName, 'PBXSourcesBuildPhase', 'Sources');
  const resourcesBuildPhaseUUID = uuid(appName, 'PBXResourcesBuildPhase', 'Resources');
  const frameworksBuildPhaseUUID = uuid(appName, 'PBXFrameworksBuildPhase', 'Frameworks');
  const bundleScriptUUID = uuid(appName, 'PBXShellScriptBuildPhase', 'BundleJS');

  const projectConfigListUUID = uuid(appName, 'XCConfigurationList', 'project');
  const targetConfigListUUID = uuid(appName, 'XCConfigurationList', 'target');
  const projectDebugConfigUUID = uuid(appName, 'XCBuildConfiguration', 'project:Debug');
  const projectReleaseConfigUUID = uuid(appName, 'XCBuildConfiguration', 'project:Release');
  const targetDebugConfigUUID = uuid(appName, 'XCBuildConfiguration', 'target:Debug');
  const targetReleaseConfigUUID = uuid(appName, 'XCBuildConfiguration', 'target:Release');
  // Build unique sub-package references (deduplicated by path)
  const uniquePackages /*: Array<{packagePath: string, packageName: string}> */ = [];
  const seenPaths = new Set/*:: <string> */();
  for (const entry of SPM_PRODUCT_PACKAGES) {
    if (!seenPaths.has(entry.packagePath)) {
      seenPaths.add(entry.packagePath);
      uniquePackages.push({packagePath: entry.packagePath, packageName: entry.packageName});
    }
  }
  const localPkgRefUUIDs = uniquePackages.map(pkg =>
    uuid(appName, 'XCLocalSwiftPackageReference', pkg.packagePath),
  );

  /*:: type PbxEntry = {uuid: string, comment: string, fields: {[string]: string}}; */

  const buildFileEntries /*: Array<PbxEntry> */ = [];
  const fileRefEntries /*: Array<PbxEntry> */ = [];
  const sourcesBuildFileUUIDs /*: Array<{uuid: string, comment: string}> */ = [];
  const resourcesBuildFileUUIDs /*: Array<{uuid: string, comment: string}> */ = [];
  const sourcesGroupChildren /*: Array<{uuid: string, comment: string}> */ = [];

  // Process source files
  for (const file of files.sources) {
    const fileName = path.basename(file);
    const ext = path.extname(file);
    const fileRefId = uuid(appName, 'PBXFileReference', file);
    const buildFileId = uuid(appName, 'PBXBuildFile', `src:${file}`);

    fileRefEntries.push({
      uuid: fileRefId,
      comment: fileName,
      fields: {
        isa: 'PBXFileReference',
        lastKnownFileType: quoteIfNeeded(fileTypeForExtension(ext)),
        path: quoteIfNeeded(file),
        sourceTree: quoteIfNeeded('<group>'),
      },
    });

    buildFileEntries.push({
      uuid: buildFileId,
      comment: `${fileName} in Sources`,
      fields: {
        isa: 'PBXBuildFile',
        fileRef: `${fileRefId} /* ${fileName} */`,
      },
    });

    sourcesBuildFileUUIDs.push({uuid: buildFileId, comment: `${fileName} in Sources`});
    sourcesGroupChildren.push({uuid: fileRefId, comment: fileName});
  }

  // Process header files
  for (const file of files.headers) {
    const fileName = path.basename(file);
    const ext = path.extname(file);
    const fileRefId = uuid(appName, 'PBXFileReference', file);

    fileRefEntries.push({
      uuid: fileRefId,
      comment: fileName,
      fields: {
        isa: 'PBXFileReference',
        lastKnownFileType: quoteIfNeeded(fileTypeForExtension(ext)),
        path: quoteIfNeeded(file),
        sourceTree: quoteIfNeeded('<group>'),
      },
    });

    sourcesGroupChildren.push({uuid: fileRefId, comment: fileName});
  }

  // Process resource files
  for (const file of files.resources) {
    const fileName = path.basename(file);
    const ext = path.extname(file);
    const fileRefId = uuid(appName, 'PBXFileReference', file);
    const buildFileId = uuid(appName, 'PBXBuildFile', `res:${file}`);

    fileRefEntries.push({
      uuid: fileRefId,
      comment: fileName,
      fields: {
        isa: 'PBXFileReference',
        lastKnownFileType: quoteIfNeeded(fileTypeForExtension(ext)),
        path: quoteIfNeeded(file),
        sourceTree: quoteIfNeeded('<group>'),
      },
    });

    buildFileEntries.push({
      uuid: buildFileId,
      comment: `${fileName} in Resources`,
      fields: {
        isa: 'PBXBuildFile',
        fileRef: `${fileRefId} /* ${fileName} */`,
      },
    });

    resourcesBuildFileUUIDs.push({uuid: buildFileId, comment: `${fileName} in Resources`});
    sourcesGroupChildren.push({uuid: fileRefId, comment: fileName});
  }

  // Process Info.plist (file reference only, no build phase)
  for (const file of files.plists) {
    const fileName = path.basename(file);
    const ext = path.extname(file);
    const fileRefId = uuid(appName, 'PBXFileReference', file);

    fileRefEntries.push({
      uuid: fileRefId,
      comment: fileName,
      fields: {
        isa: 'PBXFileReference',
        lastKnownFileType: quoteIfNeeded(fileTypeForExtension(ext)),
        path: quoteIfNeeded(file),
        sourceTree: quoteIfNeeded('<group>'),
      },
    });

    sourcesGroupChildren.push({uuid: fileRefId, comment: fileName});
  }

  // PrivacyInfo.xcprivacy (lives at app root, outside source dir)
  const privacyInfoFileRefUUID = uuid(appName, 'PBXFileReference', 'PrivacyInfo.xcprivacy');
  const privacyInfoBuildFileUUID = uuid(appName, 'PBXBuildFile', 'res:PrivacyInfo.xcprivacy');
  if (hasPrivacyInfo) {
    fileRefEntries.push({
      uuid: privacyInfoFileRefUUID,
      comment: 'PrivacyInfo.xcprivacy',
      fields: {
        isa: 'PBXFileReference',
        lastKnownFileType: quoteIfNeeded(fileTypeForExtension('.xcprivacy')),
        path: 'PrivacyInfo.xcprivacy',
        sourceTree: quoteIfNeeded('<group>'),
      },
    });
    buildFileEntries.push({
      uuid: privacyInfoBuildFileUUID,
      comment: 'PrivacyInfo.xcprivacy in Resources',
      fields: {
        isa: 'PBXBuildFile',
        fileRef: `${privacyInfoFileRefUUID} /* PrivacyInfo.xcprivacy */`,
      },
    });
    resourcesBuildFileUUIDs.push({
      uuid: privacyInfoBuildFileUUID,
      comment: 'PrivacyInfo.xcprivacy in Resources',
    });
  }

  // Product file reference
  fileRefEntries.push({
    uuid: productRefUUID,
    comment: `${appName}.app`,
    fields: {
      isa: 'PBXFileReference',
      explicitFileType: quoteIfNeeded('wrapper.application'),
      includeInIndex: '0',
      path: quoteIfNeeded(`${appName}.app`),
      sourceTree: 'BUILT_PRODUCTS_DIR',
    },
  });

  // SPM package product dependencies
  const spmDepEntries /*: Array<PbxEntry> */ = [];
  const spmDepUUIDs /*: Array<string> */ = [];
  for (const entry of SPM_PRODUCT_PACKAGES) {
    const {product, packagePath} = entry;
    const depUUID = uuid(appName, 'XCSwiftPackageProductDependency', product);
    spmDepUUIDs.push(depUUID);

    // Also need a build file for each SPM product dependency
    const spmBuildFileId = uuid(appName, 'PBXBuildFile', `spm:${product}`);
    buildFileEntries.push({
      uuid: spmBuildFileId,
      comment: `${product} in Frameworks`,
      fields: {
        isa: 'PBXBuildFile',
        productRef: `${depUUID} /* ${product} */`,
      },
    });

    // Link this product dependency to its sub-package reference
    const pkgRefUUID = uuid(appName, 'XCLocalSwiftPackageReference', packagePath);
    spmDepEntries.push({
      uuid: depUUID,
      comment: product,
      fields: {
        isa: 'XCSwiftPackageProductDependency',
        package: `${pkgRefUUID} /* XCLocalSwiftPackageReference "${packagePath}" */`,
        productName: quoteIfNeeded(product),
      },
    });
  }

  // Build script: Bundle JS
  const bundleJSScript = `set -e

export PROJECT_ROOT="$SRCROOT"
export ENTRY_FILE="$SRCROOT/${entryFile}"

WITH_ENVIRONMENT="${reactNativePath}/scripts/xcode/with-environment.sh"
REACT_NATIVE_XCODE="${reactNativePath}/scripts/react-native-xcode.sh"

/bin/sh -c "$WITH_ENVIRONMENT $REACT_NATIVE_XCODE"
`;

  // --- Assemble sections ---
  /*:: type SectionMap = {[string]: Array<PbxEntry>}; */
  const sections /*: SectionMap */ = {};

  // PBXBuildFile
  sections.PBXBuildFile = buildFileEntries;

  // PBXFileReference
  sections.PBXFileReference = fileRefEntries;

  // PBXFrameworksBuildPhase
  const frameworkBuildFileUUIDs = spmDepUUIDs.map(depUUID => {
    const product = SPM_PRODUCTS[spmDepUUIDs.indexOf(depUUID)];
    return uuid(appName, 'PBXBuildFile', `spm:${product}`);
  });
  sections.PBXFrameworksBuildPhase = [
    {
      uuid: frameworksBuildPhaseUUID,
      comment: 'Frameworks',
      fields: {
        isa: 'PBXFrameworksBuildPhase',
        buildActionMask: '2147483647',
        files: `(\n${frameworkBuildFileUUIDs.map(id => `\t\t\t\t${id},\n`).join('')}\t\t\t)`,
        runOnlyForDeploymentPostprocessing: '0',
      },
    },
  ];

  // PBXGroup
  const mainGroupChildren = [
    `${sourcesGroupUUID} /* ${sourcePath} */`,
  ];
  if (hasPrivacyInfo) {
    mainGroupChildren.push(`${privacyInfoFileRefUUID} /* PrivacyInfo.xcprivacy */`);
  }
  mainGroupChildren.push(`${productsGroupUUID} /* Products */`);

  sections.PBXGroup = [
    {
      uuid: mainGroupUUID,
      comment: '',
      fields: {
        isa: 'PBXGroup',
        children: `(\n${mainGroupChildren.map(c => `\t\t\t\t${c},\n`).join('')}\t\t\t)`,
        sourceTree: quoteIfNeeded('<group>'),
      },
    },
    {
      uuid: sourcesGroupUUID,
      comment: sourcePath,
      fields: {
        isa: 'PBXGroup',
        children: `(\n${sourcesGroupChildren.map(c => `\t\t\t\t${c.uuid} /* ${c.comment} */,\n`).join('')}\t\t\t)`,
        path: quoteIfNeeded(sourcePath),
        sourceTree: quoteIfNeeded('<group>'),
      },
    },
    {
      uuid: productsGroupUUID,
      comment: 'Products',
      fields: {
        isa: 'PBXGroup',
        children: `(\n\t\t\t\t${productRefUUID} /* ${appName}.app */,\n\t\t\t)`,
        name: 'Products',
        sourceTree: quoteIfNeeded('<group>'),
      },
    },
  ];

  // PBXNativeTarget
  const syncAutolinkingScriptUUID = uuid(appName, 'PBXShellScriptBuildPhase', 'SyncAutolinking');
  const vfsScriptUUID = uuid(appName, 'PBXShellScriptBuildPhase', 'PrepareVFS');
  const buildPhasesList = [
    `${syncAutolinkingScriptUUID} /* Sync SPM Autolinking */`,
    `${vfsScriptUUID} /* Prepare VFS Overlay */`,
    `${sourcesBuildPhaseUUID} /* Sources */`,
    `${frameworksBuildPhaseUUID} /* Frameworks */`,
    `${resourcesBuildPhaseUUID} /* Resources */`,
    `${bundleScriptUUID} /* Build JS Bundle */`,
  ];
  sections.PBXNativeTarget = [
    {
      uuid: targetUUID,
      comment: appName,
      fields: {
        isa: 'PBXNativeTarget',
        buildConfigurationList: `${targetConfigListUUID} /* Build configuration list for PBXNativeTarget "${appName}" */`,
        buildPhases: `(\n${buildPhasesList.map(p => `\t\t\t\t${p},\n`).join('')}\t\t\t)`,
        buildRules: '(\n\t\t\t)',
        dependencies: '(\n\t\t\t)',
        name: quoteIfNeeded(appName),
        packageProductDependencies: `(\n${spmDepUUIDs.map(id => `\t\t\t\t${id},\n`).join('')}\t\t\t)`,
        productName: quoteIfNeeded(appName),
        productReference: `${productRefUUID} /* ${appName}.app */`,
        productType: quoteIfNeeded('com.apple.product-type.application'),
      },
    },
  ];

  // PBXProject
  sections.PBXProject = [
    {
      uuid: projectUUID,
      comment: 'Project object',
      fields: {
        isa: 'PBXProject',
        attributes: `{\n\t\t\t\tBuildIndependentTargetsInParallel = 1;\n\t\t\t\tLastUpgradeCheck = 1600;\n\t\t\t}`,
        buildConfigurationList: `${projectConfigListUUID} /* Build configuration list for PBXProject "${appName}" */`,
        mainGroup: mainGroupUUID,
        packageReferences: `(\n${localPkgRefUUIDs.map((id, i) => `\t\t\t\t${id} /* XCLocalSwiftPackageReference "${uniquePackages[i].packagePath}" */,\n`).join('')}\t\t\t)`,
        productRefGroup: `${productsGroupUUID} /* Products */`,
        projectDirPath: quoteIfNeeded(''),
        projectRoot: quoteIfNeeded(''),
        targets: `(\n\t\t\t\t${targetUUID} /* ${appName} */,\n\t\t\t)`,
      },
    },
  ];

  // PBXResourcesBuildPhase
  sections.PBXResourcesBuildPhase = [
    {
      uuid: resourcesBuildPhaseUUID,
      comment: 'Resources',
      fields: {
        isa: 'PBXResourcesBuildPhase',
        buildActionMask: '2147483647',
        files: `(\n${resourcesBuildFileUUIDs.map(r => `\t\t\t\t${r.uuid} /* ${r.comment} */,\n`).join('')}\t\t\t)`,
        runOnlyForDeploymentPostprocessing: '0',
      },
    },
  ];

  // PBXShellScriptBuildPhase

  // Prepare VFS overlay: rewrite the root to use the SRCROOT-relative path.
  // The VFS template resolves symlinks to the xcframework cache path, but the xcodeproj
  // HEADER_SEARCH_PATHS use $(SRCROOT)/build/xcframeworks/React.xcframework/Headers (symlink).
  // When clang searches for headers via -I paths during module compilation, the VFS must
  // match those paths. We rewrite the root name (line 4) to the local symlink path.
  const prepareVfsScript = `set -euo pipefail
SRC_VFS="$SRCROOT/build/xcframeworks/React-VFS.yaml"
DST_VFS="$DERIVED_FILE_DIR/React-VFS.yaml"

if [ ! -f "$SRC_VFS" ]; then
  echo "warning: VFS overlay not found at $SRC_VFS"
  exit 0
fi

LOCAL_HEADERS="$SRCROOT/build/xcframeworks/React.xcframework/Headers"
sed "4s|.*|  - name: '$LOCAL_HEADERS'|" "$SRC_VFS" > "$DST_VFS"
`;

  // Sync SPM Autolinking: timestamp check + conditional node re-run
  const syncAutolinkingScript = `set -euo pipefail

STAMP="$SRCROOT/autolinked/.spm-sync-stamp"
STALE=0

# Check 0: xcframework artifacts missing (fresh clone)
if [ ! -f "$SRCROOT/build/xcframeworks/artifacts.json" ] || \\
   [ ! -d "$SRCROOT/build/xcframeworks/React.xcframework" ]; then
  STALE=1
fi

# Find project root (where package.json lives — may be parent of SRCROOT)
PROJECT_ROOT="$SRCROOT"
if [ ! -f "$PROJECT_ROOT/package.json" ] && [ -f "$PROJECT_ROOT/../package.json" ]; then
  PROJECT_ROOT="$SRCROOT/.."
fi

# Check 1: dependency inputs (covers app projects after any package manager install)
for INPUT in \\
  "$PROJECT_ROOT/package.json" \\
  "$PROJECT_ROOT/react-native.config.js"; do
  if [ -f "$INPUT" ] && [ "$INPUT" -nt "$STAMP" ]; then
    STALE=1
    break
  fi
done

# Check node_modules mtime (works with npm, yarn, pnpm, bun — any package manager)
if [ "$STALE" -eq 0 ]; then
  # In monorepos, node_modules may be hoisted to the repo root
  NM_DIR="$SRCROOT/node_modules"
  if [ ! -d "$NM_DIR" ]; then
    NM_DIR="$SRCROOT/../node_modules"
  fi
  if [ -d "$NM_DIR" ] && [ "$NM_DIR" -nt "$STAMP" ]; then
    STALE=1
  fi
fi

# Check 2: codegen spec files changed via git (covers monorepo after git pull)
if [ "$STALE" -eq 0 ] && [ -f "$STAMP" ]; then
  STAMP_TIME=$(stat -f %m "$STAMP" 2>/dev/null || stat -c %Y "$STAMP" 2>/dev/null || echo 0)
  LATEST_SPEC_COMMIT=$(git -C "$SRCROOT" log -1 --format=%ct -- '*.js' '*.ts' 2>/dev/null || echo 0)
  if [ "$LATEST_SPEC_COMMIT" -gt "$STAMP_TIME" ]; then
    STALE=1
  fi
fi

if [ ! -f "$STAMP" ]; then
  STALE=1
fi

if [ "$STALE" -eq 0 ]; then
  exit 0
fi

echo "SPM sync inputs changed — re-syncing (codegen + autolinking)..."

WITH_ENVIRONMENT="${reactNativePath}/scripts/xcode/with-environment.sh"
SYNC_SCRIPT="${reactNativePath}/scripts/spm/sync-spm-autolinking.js"

if [ -f "$WITH_ENVIRONMENT" ]; then
  # with-environment.sh references PODS_ROOT and $1, which may be unset.
  # Temporarily disable nounset to avoid failures when sourcing.
  export PODS_ROOT="\${PODS_ROOT:-$SRCROOT}"
  set +u
  . "$WITH_ENVIRONMENT"
  set -u
fi

if command -v node >/dev/null 2>&1; then
  node "$SYNC_SCRIPT" --app-root "$SRCROOT" --react-native-root "$SRCROOT/${reactNativePath}" || {
    echo "warning: SPM sync failed — build may use stale codegen/autolinking"
    exit 0
  }
else
  echo "warning: node not found — skipping SPM sync"
  exit 0
fi
`;

  sections.PBXShellScriptBuildPhase = [
    {
      uuid: syncAutolinkingScriptUUID,
      comment: 'Sync SPM Autolinking',
      fields: {
        isa: 'PBXShellScriptBuildPhase',
        buildActionMask: '2147483647',
        files: '(\n\t\t\t)',
        inputFileListPaths: '(\n\t\t\t)',
        inputPaths: '(\n\t\t\t)',
        name: quoteIfNeeded('Sync SPM Autolinking'),
        outputFileListPaths: '(\n\t\t\t)',
        outputPaths: '(\n\t\t\t)',
        runOnlyForDeploymentPostprocessing: '0',
        shellPath: '/bin/sh',
        shellScript: quoteIfNeeded(syncAutolinkingScript),
      },
    },
    {
      uuid: vfsScriptUUID,
      comment: 'Prepare VFS Overlay',
      fields: {
        isa: 'PBXShellScriptBuildPhase',
        buildActionMask: '2147483647',
        files: '(\n\t\t\t)',
        inputFileListPaths: '(\n\t\t\t)',
        inputPaths: `(\n\t\t\t\t"$(SRCROOT)/build/xcframeworks/React-VFS.yaml",\n\t\t\t)`,
        name: quoteIfNeeded('Prepare VFS Overlay'),
        outputFileListPaths: '(\n\t\t\t)',
        outputPaths: `(\n\t\t\t\t"$(DERIVED_FILE_DIR)/React-VFS.yaml",\n\t\t\t)`,
        runOnlyForDeploymentPostprocessing: '0',
        shellPath: '/bin/sh',
        shellScript: quoteIfNeeded(prepareVfsScript),
      },
    },
    {
      uuid: bundleScriptUUID,
      comment: 'Build JS Bundle',
      fields: {
        isa: 'PBXShellScriptBuildPhase',
        buildActionMask: '2147483647',
        files: '(\n\t\t\t)',
        inputFileListPaths: '(\n\t\t\t)',
        inputPaths: '(\n\t\t\t)',
        name: quoteIfNeeded('Build JS Bundle'),
        outputFileListPaths: '(\n\t\t\t)',
        outputPaths: '(\n\t\t\t)',
        runOnlyForDeploymentPostprocessing: '0',
        shellPath: '/bin/sh',
        shellScript: quoteIfNeeded(bundleJSScript),
      },
    },
  ];

  // PBXSourcesBuildPhase
  sections.PBXSourcesBuildPhase = [
    {
      uuid: sourcesBuildPhaseUUID,
      comment: 'Sources',
      fields: {
        isa: 'PBXSourcesBuildPhase',
        buildActionMask: '2147483647',
        files: `(\n${sourcesBuildFileUUIDs.map(s => `\t\t\t\t${s.uuid} /* ${s.comment} */,\n`).join('')}\t\t\t)`,
        runOnlyForDeploymentPostprocessing: '0',
      },
    },
  ];

  // XCBuildConfiguration
  const debugProjectSettings = `{\n\t\t\t\tALWAYS_SEARCH_USER_PATHS = NO;\n\t\t\t\tCLANG_CXX_LANGUAGE_STANDARD = "c++20";\n\t\t\t\tCLANG_ENABLE_MODULES = YES;\n\t\t\t\tCLANG_ENABLE_OBJC_ARC = YES;\n\t\t\t\tCOPY_PHASE_STRIP = NO;\n\t\t\t\tDEBUG_INFORMATION_FORMAT = dwarf;\n\t\t\t\tENABLE_STRICT_OBJC_MSGSEND = YES;\n\t\t\t\tENABLE_TESTABILITY = YES;\n\t\t\t\tGCC_DYNAMIC_NO_PIC = NO;\n\t\t\t\tGCC_NO_COMMON_BLOCKS = YES;\n\t\t\t\tGCC_OPTIMIZATION_LEVEL = 0;\n\t\t\t\tGCC_PREPROCESSOR_DEFINITIONS = (\n\t\t\t\t\t"DEBUG=1",\n\t\t\t\t\t"$(inherited)",\n\t\t\t\t);\n\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = ${iosVersion};\n\t\t\t\tMTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;\n\t\t\t\tONLY_ACTIVE_ARCH = YES;\n\t\t\t\tSDKROOT = iphoneos;\n\t\t\t\tSUPPORTED_PLATFORMS = "iphoneos iphonesimulator";\n\t\t\t\tSUPPORTS_MACCATALYST = NO;\n\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;\n\t\t\t\t\t\t\t\tSWIFT_OPTIMIZATION_LEVEL = "-Onone";\n\t\t\t\tSWIFT_VERSION = 5.0;\n\t\t\t}`;

  const releaseProjectSettings = `{\n\t\t\t\tALWAYS_SEARCH_USER_PATHS = NO;\n\t\t\t\tCLANG_CXX_LANGUAGE_STANDARD = "c++20";\n\t\t\t\tCLANG_ENABLE_MODULES = YES;\n\t\t\t\tCLANG_ENABLE_OBJC_ARC = YES;\n\t\t\t\tCOPY_PHASE_STRIP = YES;\n\t\t\t\tDEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";\n\t\t\t\tENABLE_NS_ASSERTIONS = NO;\n\t\t\t\tENABLE_STRICT_OBJC_MSGSEND = YES;\n\t\t\t\tGCC_NO_COMMON_BLOCKS = YES;\n\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = ${iosVersion};\n\t\t\t\tSDKROOT = iphoneos;\n\t\t\t\tSUPPORTED_PLATFORMS = "iphoneos iphonesimulator";\n\t\t\t\tSUPPORTS_MACCATALYST = NO;\n\t\t\t\tSWIFT_COMPILATION_MODE = wholemodule;\n\t\t\t\t\t\t\t\tSWIFT_OPTIMIZATION_LEVEL = "-O";\n\t\t\t\tSWIFT_VERSION = 5.0;\n\t\t\t\tVALIDATE_PRODUCT = YES;\n\t\t\t}`;

  // Find Info.plist path
  const infoPlistFile = files.plists.find(p => path.basename(p) === 'Info.plist');
  const infoPlistSetting = infoPlistFile != null
    ? `"$(SRCROOT)/${sourcePath}/${infoPlistFile}"`
    : `"$(SRCROOT)/${sourcePath}/Info.plist"`;

  const targetBuildSettings = (isDebug /*: boolean */) => {
    const vfsOverlay = '$(DERIVED_FILE_DIR)/React-VFS.yaml';
    const lines = [
      `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon`,
      `CLANG_CXX_LANGUAGE_STANDARD = "c++20"`,
      `DEVELOPMENT_TEAM = ""`,
      `HEADER_SEARCH_PATHS = (\n\t\t\t\t\t"$(inherited)",\n\t\t\t\t\t"$(SRCROOT)/build/xcframeworks/React.xcframework/Headers",\n\t\t\t\t\t"$(SRCROOT)/build/xcframeworks/React.xcframework/Headers/React_RCTAppDelegate",\n\t\t\t\t\t"$(SRCROOT)/build/xcframeworks/ReactNativeDependencies.xcframework/Headers",\n\t\t\t\t\t"$(SRCROOT)/autolinked/sources",\n\t\t\t\t)`,
      `INFOPLIST_FILE = ${infoPlistSetting}`,
      `IPHONEOS_DEPLOYMENT_TARGET = ${iosVersion}`,
      `LD_RUNPATH_SEARCH_PATHS = (\n\t\t\t\t\t/usr/lib/swift,\n\t\t\t\t\t"$(inherited)",\n\t\t\t\t\t"@executable_path/Frameworks",\n\t\t\t\t)`,
      // VFS overlay for stable header identity across all compilation (including clang modules)
      `OTHER_CFLAGS = (\n\t\t\t\t\t"$(inherited)",\n\t\t\t\t\t"-ivfsoverlay",\n\t\t\t\t\t"${vfsOverlay}",\n\t\t\t\t)`,
      `OTHER_LDFLAGS = (\n\t\t\t\t\t"$(inherited)",\n\t\t\t\t\t"-ObjC",\n\t\t\t\t)`,
      // Pass VFS overlay to Swift's embedded clang for module compilation.
      // Also pass the React framework module map from the resolved build products
      // so Swift can find the React_RCTAppDelegate secondary module (SPM binary
      // targets only auto-expose the primary module matching the framework name).
      `OTHER_SWIFT_FLAGS = (\n\t\t\t\t\t"$(inherited)",\n\t\t\t\t\t"-Xcc",\n\t\t\t\t\t"-ivfsoverlay",\n\t\t\t\t\t"-Xcc",\n\t\t\t\t\t"${vfsOverlay}",\n\t\t\t\t\t"-Xcc",\n\t\t\t\t\t"-fmodule-map-file=$(BUILT_PRODUCTS_DIR)/React.framework/Modules/module.modulemap",\n\t\t\t\t)`,
      `PRODUCT_BUNDLE_IDENTIFIER = ${quoteIfNeeded(bundleIdentifier)}`,
      `PRODUCT_NAME = ${quoteIfNeeded(appName)}`,
      `REACT_NATIVE_PATH = ${quoteIfNeeded(reactNativePath)}`,
      `SWIFT_VERSION = 5.0`,
      `TARGETED_DEVICE_FAMILY = "1,2"`,
    ];
    if (isDebug) {
      lines.push(`SWIFT_OPTIMIZATION_LEVEL = "-Onone"`);
    }
    return `{\n${lines.map(l => `\t\t\t\t${l};`).join('\n')}\n\t\t\t}`;
  };

  sections.XCBuildConfiguration = [
    {
      uuid: projectDebugConfigUUID,
      comment: 'Debug',
      fields: {
        isa: 'XCBuildConfiguration',
        buildSettings: debugProjectSettings,
        name: 'Debug',
      },
    },
    {
      uuid: projectReleaseConfigUUID,
      comment: 'Release',
      fields: {
        isa: 'XCBuildConfiguration',
        buildSettings: releaseProjectSettings,
        name: 'Release',
      },
    },
    {
      uuid: targetDebugConfigUUID,
      comment: 'Debug',
      fields: {
        isa: 'XCBuildConfiguration',
        buildSettings: targetBuildSettings(true),
        name: 'Debug',
      },
    },
    {
      uuid: targetReleaseConfigUUID,
      comment: 'Release',
      fields: {
        isa: 'XCBuildConfiguration',
        buildSettings: targetBuildSettings(false),
        name: 'Release',
      },
    },
  ];

  // XCConfigurationList
  sections.XCConfigurationList = [
    {
      uuid: projectConfigListUUID,
      comment: `Build configuration list for PBXProject "${appName}"`,
      fields: {
        isa: 'XCConfigurationList',
        buildConfigurations: `(\n\t\t\t\t${projectDebugConfigUUID} /* Debug */,\n\t\t\t\t${projectReleaseConfigUUID} /* Release */,\n\t\t\t)`,
        defaultConfigurationIsVisible: '0',
        defaultConfigurationName: 'Release',
      },
    },
    {
      uuid: targetConfigListUUID,
      comment: `Build configuration list for PBXNativeTarget "${appName}"`,
      fields: {
        isa: 'XCConfigurationList',
        buildConfigurations: `(\n\t\t\t\t${targetDebugConfigUUID} /* Debug */,\n\t\t\t\t${targetReleaseConfigUUID} /* Release */,\n\t\t\t)`,
        defaultConfigurationIsVisible: '0',
        defaultConfigurationName: 'Release',
      },
    },
  ];

  // XCLocalSwiftPackageReference
  sections.XCLocalSwiftPackageReference = [
    ...uniquePackages.map((pkg, i) => ({
      uuid: localPkgRefUUIDs[i],
      comment: `XCLocalSwiftPackageReference "${pkg.packagePath}"`,
      fields: {
        isa: 'XCLocalSwiftPackageReference',
        relativePath: quoteIfNeeded(pkg.packagePath),
      },
    })),
  ];

  // XCSwiftPackageProductDependency
  sections.XCSwiftPackageProductDependency = spmDepEntries;

  return serializePbxproj('1', '77', projectUUID, sections);
}

// ---------------------------------------------------------------------------
// xcworkspace generator
// ---------------------------------------------------------------------------

function generateXcworkspaceData(projName /*: string */) /*: string */ {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Workspace
   version = "1.0">
   <FileRef
      location = "self:${projName}.xcodeproj">
   </FileRef>
</Workspace>
`;
}

// ---------------------------------------------------------------------------
// xcscheme generator
// ---------------------------------------------------------------------------

function generateXcscheme(appName /*: string */, targetUUID /*: string */, projName /*: string */) /*: string */ {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1600"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "${targetUUID}"
               BuildableName = "${appName}.app"
               BlueprintName = "${appName}"
               ReferencedContainer = "container:${projName}.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES"
      shouldAutocreateTestPlan = "YES">
   </TestAction>
   <LaunchAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "${targetUUID}"
            BuildableName = "${appName}.app"
            BlueprintName = "${appName}"
            ReferencedContainer = "container:${projName}.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Release"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "${targetUUID}"
            BuildableName = "${appName}.app"
            BlueprintName = "${appName}"
            ReferencedContainer = "container:${projName}.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Debug">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
`;
}

// ---------------------------------------------------------------------------
// Stub Package.swift generation
// ---------------------------------------------------------------------------
// When the xcodeproj is generated, the referenced SPM package directories
// (build/xcframeworks, autolinked, build/generated/ios) may not exist yet.
// Xcode resolves packages before any build phase runs, so we write minimal
// stub Package.swift files to let resolution succeed. The real generators
// (sync-spm-autolinking.js) overwrite these during the first build.

/*::
type StubPackageDef = {
  packageName: string,
  products: Array<string>,
};
*/

function generateStubPackageSwift(def /*: StubPackageDef */) /*: string */ {
  const {packageName, products} = def;
  const stubTarget = `${packageName.replace(/[^a-zA-Z0-9]/g, '')}Stub`;
  const productLines = products
    .map(p => `        .library(name: "${p}", targets: ["${stubTarget}"]),`)
    .join('\n');
  return `// swift-tools-version: 5.9
// GENERATED STUB — will be overwritten by sync-spm-autolinking.js during build.
import PackageDescription

let package = Package(
    name: "${packageName}",
    products: [
${productLines}
    ],
    targets: [
        .target(name: "${stubTarget}", path: "_stub", sources: ["Stub.swift"]),
    ]
)
`;
}

/**
 * Ensures each referenced SPM sub-package directory has a valid Package.swift
 * so Xcode can resolve packages before any build phase runs.
 * Skips directories that already contain a Package.swift (from a previous build).
 */
function ensureStubPackages(appRoot /*: string */) /*: void */ {
  // Derive stub definitions from SPM_PRODUCT_PACKAGES
  const byPath = new Map/*:: <string, StubPackageDef> */();
  for (const entry of SPM_PRODUCT_PACKAGES) {
    const existing = byPath.get(entry.packagePath);
    if (existing != null) {
      existing.products.push(entry.product);
    } else {
      byPath.set(entry.packagePath, {
        packageName: entry.packageName,
        products: [entry.product],
      });
    }
  }

  for (const [relPath, def] of byPath) {
    const pkgDir = path.join(appRoot, relPath);
    const pkgSwiftPath = path.join(pkgDir, 'Package.swift');

    if (fs.existsSync(pkgSwiftPath)) {
      continue;
    }

    fs.mkdirSync(pkgDir, {recursive: true});
    fs.writeFileSync(pkgSwiftPath, generateStubPackageSwift(def), 'utf8');

    // Create minimal stub source file required by SPM
    const stubDir = path.join(pkgDir, '_stub');
    fs.mkdirSync(stubDir, {recursive: true});
    const stubSwift = path.join(stubDir, 'Stub.swift');
    if (!fs.existsSync(stubSwift)) {
      fs.writeFileSync(stubSwift, '// Placeholder — replaced during first build.\n', 'utf8');
    }

    log(`Wrote stub Package.swift: ${relPath}/Package.swift`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(argv /*:: ?: Array<string> */) /*: void */ {
  const args = parseArgs(argv ?? process.argv.slice(2));
  const appRoot = path.resolve(args.appRoot);

  // Read app package.json for name derivation.
  // package.json may be in a parent directory (e.g. when appRoot is ios/).
  const projectRoot = findProjectRoot(appRoot);
  const pkgPath = path.join(projectRoot, 'package.json');
  let rawName = path.basename(projectRoot);
  if (fs.existsSync(pkgPath)) {
    // $FlowFixMe[incompatible-type]
    const pkgJson /*: {name?: string} */ = JSON.parse(
      fs.readFileSync(pkgPath, 'utf8'),
    );
    rawName = pkgJson.name ?? rawName;
  }

  // Resolve react-native root
  let rnRoot = args.reactNativeRoot;
  if (rnRoot == null) {
    rnRoot = path.join(appRoot, 'node_modules', 'react-native');
    if (!fs.existsSync(rnRoot)) {
      // Try projectRoot (covers ios/ subdirectory case)
      rnRoot = path.join(projectRoot, 'node_modules', 'react-native');
    }
    if (!fs.existsSync(rnRoot)) {
      // Try monorepo layout
      rnRoot = path.resolve(__dirname, '../..');
    }
  }
  rnRoot = path.resolve(rnRoot);
  const reactNativePath = path.relative(appRoot, rnRoot);

  // Determine source path
  let sourcePath = args.sourcePath;
  if (sourcePath == null) {
    sourcePath = findSourcePath(appRoot, rawName);
  }

  // Derive app name: prefer the source directory name when it's a meaningful
  // app name (e.g. "RNTester", "HelloWorld"), but fall back to package.json name
  // when the source path is a generic directory like "ios", "App", "Sources".
  const genericSourceDirs = new Set(['ios', 'app', 'sources', 'src']);
  const cleanName = rawName.replace(/^@[^/]+\//, '');
  const defaultAppName = toSwiftName(
    sourcePath !== toSwiftName(cleanName) && !genericSourceDirs.has(sourcePath.toLowerCase())
      ? sourcePath
      : cleanName,
  );
  const appName = args.appName ?? defaultAppName;

  const iosVersion = args.iosVersion;
  const bundleIdentifier =
    args.bundleIdentifier ?? `com.meta.${appName}.localDevelopment`;

  log(`App name:          ${appName}`);
  log(`Source path:       ${sourcePath}`);
  log(`Bundle identifier: ${bundleIdentifier}`);
  log(`iOS version:       ${iosVersion}`);

  // Scan source files
  const sourceDir = path.join(appRoot, sourcePath);
  const files = scanProjectFiles(sourceDir);

  // Check for PrivacyInfo.xcprivacy at app root (outside source dir)
  const privacyInfoPath = path.join(appRoot, 'PrivacyInfo.xcprivacy');
  const hasPrivacyInfo = fs.existsSync(privacyInfoPath);

  log(`Sources: ${files.sources.length}, Headers: ${files.headers.length}, Resources: ${files.resources.length}${hasPrivacyInfo ? ' + PrivacyInfo.xcprivacy' : ''}`);

  // Generate project name
  const projName = `${appName}-SPM`;
  const projDir = path.join(appRoot, `${projName}.xcodeproj`);
  const targetUUID = uuid(appName, 'PBXNativeTarget', appName);

  // Determine JS entry file: CLI arg > package.json "main" > "index.js"
  let entryFile = args.entryFile;
  if (entryFile == null && fs.existsSync(pkgPath)) {
    const pkgJson2 /*: {main?: string} */ = JSON.parse(
      fs.readFileSync(pkgPath, 'utf8'),
    );
    if (pkgJson2.main != null) {
      entryFile = pkgJson2.main;
    }
  }

  // Generate pbxproj
  const pbxproj = generatePbxproj({
    appName,
    sourcePath,
    iosVersion,
    bundleIdentifier,
    reactNativePath,
    files,
    hasPrivacyInfo,
    entryFile: entryFile ?? undefined,
  });

  // Write files
  const pbxprojPath = path.join(projDir, 'project.pbxproj');
  const xcworkspacePath = path.join(
    projDir,
    'project.xcworkspace',
    'contents.xcworkspacedata',
  );
  const xcschemePath = path.join(
    projDir,
    'xcshareddata',
    'xcschemes',
    `${appName}.xcscheme`,
  );

  fs.mkdirSync(path.dirname(pbxprojPath), {recursive: true});
  fs.mkdirSync(path.dirname(xcworkspacePath), {recursive: true});
  fs.mkdirSync(path.dirname(xcschemePath), {recursive: true});

  fs.writeFileSync(pbxprojPath, pbxproj, 'utf8');
  fs.writeFileSync(xcworkspacePath, generateXcworkspaceData(projName), 'utf8');
  fs.writeFileSync(xcschemePath, generateXcscheme(appName, targetUUID, projName), 'utf8');

  log(`Generated: ${projName}.xcodeproj/project.pbxproj`);
  log(`Generated: ${projName}.xcodeproj/project.xcworkspace/contents.xcworkspacedata`);
  log(`Generated: ${projName}.xcodeproj/xcshareddata/xcschemes/${appName}.xcscheme`);

  // Ensure stub Package.swift files exist for all referenced SPM sub-packages
  // so Xcode can resolve packages before the first build phase runs.
  ensureStubPackages(appRoot);
}

if (require.main === module) {
  main();
}

module.exports = {main, generatePbxproj, ensureStubPackages};
