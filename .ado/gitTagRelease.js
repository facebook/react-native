// @ts-check
// Used to apply the package updates: the git tag for the published release.

const execSync = require("child_process").execSync;
const {publishBranchName, gatherVersionInfo} = require('./versionUtils');

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

  const {releaseVersion} = gatherVersionInfo()

  const tempPublishBranch = `publish-temp-${Date.now()}`;
  exec(`git checkout -b ${tempPublishBranch}`);

  exec(`git add .`);
  exec(`git commit -m "Applying package update to ${releaseVersion} ***NO_CI***"`);
  exec(`git tag v${releaseVersion}`);
  exec(`git push origin HEAD:${tempPublishBranch} --follow-tags --verbose`);
  exec(`git push origin tag v${releaseVersion}`);

  exec(`git checkout ${publishBranchName}`);
  exec(`git pull origin ${publishBranchName}`);
  exec(`git merge ${tempPublishBranch} --no-edit`);
  exec(
    `git push origin HEAD:${publishBranchName} --follow-tags --verbose`
  );
  exec(`git branch -d ${tempPublishBranch}`);
  exec(`git push origin --delete -d ${tempPublishBranch}`);  
}

doPublish();