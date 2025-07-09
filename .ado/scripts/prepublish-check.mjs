// @ts-check
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as util from "node:util";

const NX_CONFIG_FILE = "nx.json";

const NPM_DEFEAULT_REGISTRY = "https://registry.npmjs.org/"
const NPM_TAG_NEXT = "next";
const NPM_TAG_NIGHTLY = "nightly";
const RNMACOS_LATEST = "react-native-macos@latest";
const RNMACOS_NEXT = "react-native-macos@next";

/**
 * @typedef {import("nx/src/command-line/release/version").ReleaseVersionGeneratorSchema} ReleaseVersionGeneratorSchema;
 * @typedef {{
 *   defaultBase: string;
 *   release: {
 *     version: {
 *       generatorOptions: ReleaseVersionGeneratorSchema;
 *     };
 *   };
 * }} NxConfig;
 * @typedef {{
 *   "mock-branch"?: string;
 *   "skip-auth"?: boolean;
 *   tag?: string;
 *   update?: boolean;
 *   verbose?: boolean;
 * }} Options;
 * @typedef {{
 *   npmTag: string;
 *   prerelease?: string;
 *   isNewTag?: boolean;
 * }} TagInfo;
 */

/**
 * Exports a variable, `publish_react_native_macos`, to signal that we want to
 * enable publishing on Azure Pipelines.
 *
 * Note that pipelines need to read this variable separately and do the actual
 * work to publish bits.
 */
function enablePublishingOnAzurePipelines() {
  console.log(`##vso[task.setvariable variable=publish_react_native_macos]1`);
}

/**
 * Logs an error message to the console.
 * @param {string} message
 */
function error(message) {
  console.error("❌", message);
}

/**
 * Logs an informational message to the console.
 * @param {string} message
 */
function info(message) {
  console.log("ℹ️", message);
}

/**
 * Returns whether the given branch is considered main branch.
 * @param {string} branch
 */
function isMainBranch(branch) {
  // There is currently no good way to consistently get the main branch. We
  // hardcode the value for now.
  return branch === "main";
}

/**
 * Returns whether the given branch is considered a stable branch.
 * @param {string} branch
 */
function isStableBranch(branch) {
  return /^\d+\.\d+-stable$/.test(branch);
}

/**
 * Loads Nx configuration.
 * @param {string} configFile
 * @returns {NxConfig}
 */
function loadNxConfig(configFile) {
  const nx = fs.readFileSync(configFile, { encoding: "utf-8" });
  return JSON.parse(nx);
}

function verifyNpmAuth(registry = NPM_DEFEAULT_REGISTRY) {
  const npmErrorRegex = /npm error code (\w+)/;
  const spawnOptions = {
    stdio: /** @type {const} */ ("pipe"),
    shell: true,
    windowsVerbatimArguments: true,
  };

  const whoamiArgs = ["whoami", "--registry", registry];
  const whoami = spawnSync("npm", whoamiArgs, spawnOptions);
  if (whoami.status !== 0) {
    const error = whoami.stderr.toString();
    const m = error.match(npmErrorRegex);
    const errorCode = m && m[1];
    switch (errorCode) {
      case "EINVALIDNPMTOKEN":
        throw new Error(`Invalid auth token for npm registry: ${registry}`);
      case "ENEEDAUTH":
        throw new Error(`Missing auth token for npm registry: ${registry}`);
      default:
        throw new Error(error);
    }
  }

  const tokenArgs = ["token", "list", "--registry", registry];
  const token = spawnSync("npm", tokenArgs, spawnOptions);
  if (token.status !== 0) {
    const error = token.stderr.toString();
    const m = error.match(npmErrorRegex);
    const errorCode = m && m[1];
    
    // E403 means the token doesn't have permission to list tokens, but that's
    // not required for publishing. Only fail for other error codes.
    if (errorCode === "E403") {
      info(`Token verification skipped: token doesn't have permission to list tokens (${errorCode})`);
    } else {
      throw new Error(m ? `Auth token for '${registry}' returned error code ${errorCode}` : error);
    }
  }
}

/**
 * Returns a numerical value for a given version string.
 * @param {string} version
 * @returns {number}
 */
function versionToNumber(version) {
  const [major, minor] = version.split("-")[0].split(".");
  return Number(major) * 1000 + Number(minor);
}

/**
 * Returns the target branch name. If not targetting any branches (e.g., when
 * executing this script locally), `undefined` is returned.
 * @returns {string | undefined}
 */
function getTargetBranch() {
  // https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml#build-variables-devops-services
  const adoTargetBranchName = process.env["SYSTEM_PULLREQUEST_TARGETBRANCH"];
  return adoTargetBranchName?.replace(/^refs\/heads\//, "");
}

/**
 * Returns the current branch name. In a pull request, the target branch name is
 * returned.
 * @param {Options} options
 * @returns {string}
 */
function getCurrentBranch(options) {
  const adoTargetBranchName = getTargetBranch();
  if (adoTargetBranchName) {
    return adoTargetBranchName;
  }

  // https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml#build-variables-devops-services
  const adoSourceBranchName = process.env["BUILD_SOURCEBRANCHNAME"];
  if (adoSourceBranchName) {
    return adoSourceBranchName.replace(/^refs\/heads\//, "");
  }

  const { "mock-branch": mockBranch } = options;
  if (mockBranch) {
    return mockBranch;
  }

  // Depending on how the repo was cloned, HEAD may not exist. We only use this
  // method as fallback.
  const { stdout } = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  return stdout.toString().trim();
}

/**
 * Returns the latest published version of `react-native-macos` from npm.
 * @param {"latest" | "next"} tag
 * @returns {number}
 */
function getPublishedVersion(tag) {
  const { stdout } = spawnSync("npm", ["view", `react-native-macos@${tag}`, "version"]);
  return versionToNumber(stdout.toString().trim());
}

/**
 * Returns the npm tag and prerelease identifier for the specified branch.
 *
 * @privateRemarks
 * Note that the current implementation treats minor versions as major. If
 * upstream ever decides to change the versioning scheme, we will need to make
 * changes accordingly.
 *
 * @param {string} branch
 * @param {Options} options
 * @param {typeof info} log
 * @returns {TagInfo}
 */
function getTagForStableBranch(branch, { tag }, log) {
  if (!isStableBranch(branch)) {
    throw new Error("Expected a stable branch");
  }

  const latestVersion = getPublishedVersion("latest");
  const currentVersion = versionToNumber(branch);

  log(`${RNMACOS_LATEST}: ${latestVersion}`);
  log(`Current version: ${currentVersion}`);

  // Patching latest version
  if (currentVersion === latestVersion) {
    const npmTag = "latest";
    log(`Expected npm tag: ${npmTag}`);
    return { npmTag };
  }

  // Demoting or patching an older stable version
  if (currentVersion < latestVersion) {
    const npmTag = "v" + branch;
    log(`Expected npm tag: ${npmTag}`);
    // If we're demoting a branch, we will need to create a new tag. This will
    // make Nx trip if we don't specify a fallback. In all other scenarios, the
    // tags should exist and therefore prefer it to fail.
    return { npmTag, isNewTag: true };
  }

  // Publishing a new latest version
  if (tag === "latest") {
    log(`Expected npm tag: ${tag}`);
    return { npmTag: tag };
  }

  // Publishing a release candidate
  const nextVersion = getPublishedVersion("next");
  log(`${RNMACOS_NEXT}: ${nextVersion}`);
  log(`Expected npm tag: ${NPM_TAG_NEXT}`);

  if (currentVersion < nextVersion) {
    throw new Error(`Current version cannot be a release candidate because it is too old: ${currentVersion} < ${nextVersion}`);
  }

  return { npmTag: NPM_TAG_NEXT, prerelease: "rc" };
}

/**
 * Verifies the configuration and enables publishing on CI.
 * @param {NxConfig} config
 * @param {string} currentBranch
 * @param {TagInfo} tag
 * @param {Options} options
 * @returns {asserts config is NxConfig["release"]}
 */
function enablePublishing(config, currentBranch, { npmTag: tag, prerelease, isNewTag }, options) {
  /** @type {string[]} */
  const errors = [];

  const { defaultBase, release } = config;

  // `defaultBase` determines what we diff against when looking for tags or
  // released version and must therefore be set to either the main branch or one
  // of the stable branches.
  if (currentBranch !== defaultBase) {
    errors.push(`'defaultBase' must be set to '${currentBranch}'`);
    config.defaultBase = currentBranch;
  }

  // Determines whether we need to add "nightly" or "rc" to the version string.
  const { generatorOptions } = release.version;
  if (generatorOptions.preid !== prerelease) {
    if (prerelease) {
      errors.push(`'release.version.generatorOptions.preid' must be set to '${prerelease}'`);
      generatorOptions.preid = prerelease;
    } else {
      errors.push(`'release.version.generatorOptions.preid' must be removed`);
      generatorOptions.preid = undefined;
    }
  }

  // What the published version should be tagged as e.g., "latest" or "nightly".
  const { currentVersionResolverMetadata } = generatorOptions;
  if (currentVersionResolverMetadata?.tag !== tag) {
    errors.push(`'release.version.generatorOptions.currentVersionResolverMetadata.tag' must be set to '${tag}'`);
    generatorOptions.currentVersionResolverMetadata ??= {};
    generatorOptions.currentVersionResolverMetadata.tag = tag;
  }

  // If we're demoting a branch, we will need to create a new tag. This will
  // make Nx trip if we don't specify a fallback. In all other scenarios, the
  // tags should exist and therefore prefer it to fail.
  if (isNewTag) {
    if (generatorOptions.fallbackCurrentVersionResolver !== "disk") {
      errors.push("'release.version.generatorOptions.fallbackCurrentVersionResolver' must be set to 'disk'");
      generatorOptions.fallbackCurrentVersionResolver = "disk";
    }
  } else if (typeof generatorOptions.fallbackCurrentVersionResolver === "string") {
    errors.push("'release.version.generatorOptions.fallbackCurrentVersionResolver' must be removed");
    generatorOptions.fallbackCurrentVersionResolver = undefined;
  }

  if (errors.length > 0) {
    errors.forEach(error);
    throw new Error("Nx Release is not correctly configured for the current branch");
  }

  if (options["skip-auth"]) {
    info("Skipped npm auth validation");
  } else {
    verifyNpmAuth();
  }

  // Don't enable publishing in PRs
  if (!getTargetBranch()) {
    enablePublishingOnAzurePipelines();
  }
}

/**
 * @param {Options} options
 * @returns {number}
 */
function main(options) {
  const branch = getCurrentBranch(options);
  if (!branch) {
    error("Could not get current branch");
    return 1;
  }

  const logger = options.verbose ? info : () => undefined;

  const config = loadNxConfig(NX_CONFIG_FILE);
  try {
    if (isMainBranch(branch)) {
      const info = { npmTag: NPM_TAG_NIGHTLY, prerelease: NPM_TAG_NIGHTLY };
      enablePublishing(config, branch, info, options);
    } else if (isStableBranch(branch)) {
      const tag = getTagForStableBranch(branch, options, logger);
      enablePublishing(config, branch, tag, options);
    }
  } catch (e) {
    if (options.update) {
      const fd = fs.openSync(NX_CONFIG_FILE, "w");
      fs.writeSync(fd, JSON.stringify(config, undefined, 2));
      fs.writeSync(fd, "\n");
      fs.closeSync(fd)
    } else {
      error(`${e.message}`);
    }
    return 1;
  }

  return 0;
}

const { values } = util.parseArgs({
  args: process.argv.slice(2),
  options: {
    "mock-branch": {
      type: "string",
    },
    "skip-auth": {
      type: "boolean",
      default: false,
    },
    tag: {
      type: "string",
      default: NPM_TAG_NEXT,
    },
    update: {
      type: "boolean",
      default: false,
    },
    verbose: {
      type: "boolean",
      default: false,
    },
  },
  strict: true,
});

process.exitCode = main(values);
