// @ts-check
// Create a tar asset for publishing to the Office feed

const fs = require("fs");
const path = require("path");
const execSync = require("child_process").execSync;
const {pkgJsonPath, publishBranchName, gatherVersionInfo} = require('./versionUtils');

function exec(command) {
  try {
    console.log(`Running command: ${command}`);
    return execSync(command, {
      stdio: "inherit"
    });
  } catch (err) {
    process.exitCode = 1;
    console.log(`Failure running: ${command}`);
    throw err;
  }
}

function doPublish() {
  console.log(`Target branch to publish to: ${publishBranchName}`);

  const {releaseVersion, branchVersionSuffix} = gatherVersionInfo()

  const onlyTagSource = !!branchVersionSuffix;
  if (!onlyTagSource) {
    // -------- Generating Android Artifacts with JavaDoc
    exec(path.join(process.env.BUILD_STAGINGDIRECTORY,"gradlew") + " installArchives");

    // undo uncommenting javadoc setting
    exec("git checkout ReactAndroid/gradle.properties");
  }

  // Create tar file
  exec(`npm pack`);

  const npmTarFileName = `react-native-${releaseVersion}.tgz`;
  const npmTarPath = path.resolve(__dirname, '..', npmTarFileName);
  const finalTarPath = path.join(process.env.BUILD_STAGINGDIRECTORY, 'final', npmTarFileName);
  console.log(`Copying tar file ${npmTarPath} to: ${finalTarPath}`)
  fs.copyFileSync(npmTarPath, finalTarPath);
}

doPublish();