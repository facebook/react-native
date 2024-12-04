// @ts-check
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as util from "node:util";

const ADO_PUBLISH_PIPELINE = ".ado/templates/npm-publish.yml";
const NX_CONFIG_FILE = "nx.json";

const NPM_TAG_NEXT = "next";
const NPM_TAG_NIGHTLY = "nightly";

/**
 * @typedef {typeof import("../../nx.json")} NxConfig
 * @typedef {{ tag?: string; update?: boolean; }} Options
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
 * Returns the currently checked out branch. Note that this function prefers
 * predefined CI environment variables over local clone.
 * @returns {string}
 */
function getCurrentBranch() {
  // https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml#build-variables-devops-services
  const adoSourceBranchName = process.env["BUILD_SOURCEBRANCHNAME"];
  if (adoSourceBranchName) {
    return adoSourceBranchName.replace(/^refs\/heads\//, "");
  }

  // Depending on how the repo was cloned, HEAD may not exist. We only use this
  // method as fallback.
  const { stdout } = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  return stdout.toString().trim();
}

/**
 * Returns the latest published version of `react-native-macos` from npm.
 * @returns {number}
 */
function getLatestVersion() {
  const { stdout } = spawnSync("npm", ["view", "react-native-macos@latest", "version"]);
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
 * @returns {{ npmTag: string; prerelease?: string; }}
 */
function getTagForStableBranch(branch, { tag }) {
  if (!isStableBranch(branch)) {
    throw new Error("Expected a stable branch");
  }

  const latestVersion = getLatestVersion();
  const currentVersion = versionToNumber(branch);

  // Patching latest version
  if (currentVersion === latestVersion) {
    return { npmTag: "latest" };
  }

  // Patching an older stable version
  if (currentVersion < latestVersion) {
    return { npmTag: "v" + branch };
  }

  // Publishing a new latest version
  if (tag === "latest") {
    return { npmTag: tag };
  }

  // Publishing a release candidate
  return { npmTag: NPM_TAG_NEXT, prerelease: "rc" };
}

/**
 * Verifies the configuration and enables publishing on CI.
 * @param {NxConfig} config
 * @param {string} currentBranch
 * @param {string} tag
 * @param {string} [prerelease]
 * @returns {asserts config is NxConfig["release"]}
 */
function enablePublishing(config, currentBranch, tag, prerelease) {
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
  const { currentVersionResolverMetadata, preid } = release.version.generatorOptions;
  if (preid !== prerelease) {
    errors.push(`'release.version.generatorOptions.preid' must be set to '${prerelease || ""}'`);
    if (prerelease) {
      release.version.generatorOptions.preid = prerelease;
    } else {
      // @ts-expect-error `preid` is optional
      release.version.generatorOptions.preid = undefined;
    }
  }

  // What the published version should be tagged as e.g., "latest" or "nightly".
  if (currentVersionResolverMetadata.tag !== tag) {
    errors.push(`'release.version.generatorOptions.currentVersionResolverMetadata.tag' must be set to '${tag}'`);
    release.version.generatorOptions.currentVersionResolverMetadata.tag = tag;
  }

  if (errors.length > 0) {
    errors.forEach(error);
    throw new Error("Nx Release is not correctly configured for the current branch");
  }

  enablePublishingOnAzurePipelines();
}

/**
 * @param {string} file
 * @param {string} tag
 * @returns {boolean}
 */
function verifyPublishPipeline(file, tag) {
  const data = fs.readFileSync(file, { encoding: "utf-8" });
  const m = data.match(/publishTag: '(\w*?)'/);
  if (!m) {
    error(`${file}: Could not find npm publish tag`);
    return false;
  }

  if (m[1] !== tag) {
    error(`${file}: 'publishTag' needs to be set to '${tag}'`);
    return false;
  }

  return true;
}

/**
 * @param {Options} options
 * @returns {number}
 */
function main(options) {
  const branch = getCurrentBranch();
  if (!branch) {
    error("Could not get current branch");
    return 1;
  }

  if (!verifyPublishPipeline(ADO_PUBLISH_PIPELINE, options.tag || NPM_TAG_NEXT)) {
    return 1;
  }

  const config = loadNxConfig(NX_CONFIG_FILE);
  try {
    if (isMainBranch(branch)) {
      enablePublishing(config, branch, NPM_TAG_NIGHTLY, NPM_TAG_NIGHTLY);
    } else if (isStableBranch(branch)) {
      const { npmTag, prerelease } = getTagForStableBranch(branch, options);
      enablePublishing(config, branch, npmTag, prerelease);
    }
  } catch (e) {
    if (options.update) {
      const fd = fs.openSync(NX_CONFIG_FILE, "w");
      fs.writeSync(fd, JSON.stringify(config, undefined, 2));
      fs.writeSync(fd, "\n");
      fs.closeSync(fd)
    } else {
      console.error(`${e}`);
    }
    return 1;
  }

  return 0;
}

const { values } = util.parseArgs({
  args: process.argv.slice(2),
  options: {
    tag: {
      type: "string",
      default: NPM_TAG_NEXT,
    },
    update: {
      type: "boolean",
      default: false,
    },
  },
  strict: true,
});

process.exitCode = main(values);
