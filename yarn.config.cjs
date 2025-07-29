// @ts-check

/** @type {import('@yarnpkg/types')} */
const {defineConfig} = require('@yarnpkg/types');

/**
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Context} Context
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Workspace} Workspace
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Dependency} Dependency
 */

/**
 * Enforce that react-native-macos declares a peer dependency on react-native on release branches,
 * except on the main branch, where there is no published version of React Native to align to.
 * @param {Context} context
 */
function expectReactNativePeerDependency({Yarn}) {
    const rnmWorkspace = Yarn.workspace({ident: 'react-native-macos'});
    if (!rnmWorkspace) {
        // Report error on root workspace since react-native-macos doesn't exist
        Yarn.workspace().error('react-native-macos workspace must exist in the monorepo');
        return;
    }

    // Check if react-native-macos version is 1000.0.0 - implying we are on the main branch
    const isMainBranch = rnmWorkspace.manifest.version === '1000.0.0';
    if (!isMainBranch) {
        const rnPeerDependency = rnmWorkspace.pkg.peerDependencies.get('react-native');
        if (!rnPeerDependency) {
            rnmWorkspace.error('react-native-macos must declare a peer dependency on react-native on release branches');
        }
    }
}

/**
 * Enforce that all @react-native/ scoped packages use the same version
 * as the react-native peer dependency declared in react-native-macos.
 * On the main branch, enforce that we use workspace:* for @react-native/ packages.
 * @param {Context} context
 */
function enforceReactNativeVersionConsistency({Yarn}) {
    const rnmWorkspace = Yarn.workspace({ident: 'react-native-macos'});
    if (!rnmWorkspace) {
        // Report error on root workspace since react-native-macos doesn't exist
        Yarn.workspace().error('react-native-macos workspace must exist in the monorepo');
        return;
    }

    // Check if react-native-macos version is 1000.0.0 - implying we are on the main branch
    const isMainBranch = rnmWorkspace.manifest.version === '1000.0.0';
    
    let targetVersion;
    if (isMainBranch) {
        // On main branch, use workspace:* for @react-native/ packages
        targetVersion = 'workspace:*';
    } else {
        const rnPeerDependency = rnmWorkspace.pkg.peerDependencies.get('react-native');
        if (!rnPeerDependency) {
            rnmWorkspace.error('react-native-macos must declare a peer dependency on react-native on release branches');
            return;
        }
        targetVersion = rnPeerDependency;
    }    // Enforce this version on all @react-native/ scoped packages across all workspaces
    for (const dependency of Yarn.dependencies()) {
        if (dependency.ident.startsWith('@react-native/')) {
            // Check if the target package is private (not published)
            const targetWorkspace = Yarn.workspace({ident: dependency.ident});
            const isPrivatePackage = targetWorkspace && targetWorkspace.manifest.private;
            
            if (isPrivatePackage) {
                // Private packages should always use workspace:* since they're not published
                dependency.update('workspace:*');
            } else {
                dependency.update(targetVersion);
            }
        }
    }
}

/**
 * Enforce that all @react-native-macos/ scoped packages use the same version
 * as react-native-macos, but only for non-private packages.
 * @param {Context} context
 */
function enforceReactNativeMacosVersionConsistency({Yarn}) {
    const rnmWorkspace = Yarn.workspace({ident: 'react-native-macos'});
    if (!rnmWorkspace) {
        // Report error on root workspace since react-native-macos doesn't exist
        Yarn.workspace().error('react-native-macos workspace must exist in the monorepo');
        return;
    }

    const targetVersion = rnmWorkspace.manifest.version;
    if (!targetVersion) {
        rnmWorkspace.error('react-native-macos must have a version');
        return;
    }

    // Enforce this version on all non-private @react-native-macos/ scoped packages
    for (const workspace of Yarn.workspaces()) {
        const isReactNativeMacosScoped = workspace.ident && workspace.ident.startsWith('@react-native-macos/');
        const isPrivate = workspace.manifest.private;
        
        if (isReactNativeMacosScoped && !isPrivate) {
            workspace.set('version', targetVersion);
        }
    }
}

module.exports = defineConfig({
  constraints: async ctx => {
    expectReactNativePeerDependency(ctx);
    enforceReactNativeVersionConsistency(ctx);
    enforceReactNativeMacosVersionConsistency(ctx);
  },
});