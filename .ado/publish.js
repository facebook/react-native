// @ts-check
// Used to publish this fork of react-native
// Publish it as an attached tar asset to the GitHub release for general consumption, since we can't publish this to the npmjs npm feed

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

  const tempPublishBranch = `publish-temp-${Date.now()}`;
  exec(`git checkout -b ${tempPublishBranch}`);

  exec(`git config --global user.email "53619745+rnbot@users.noreply.github.com"`);
  exec(`git config --global user.name "React-Native Bot"`);

  exec(`git add ${pkgJsonPath}`);
  exec(`git commit -m "Applying package update to ${releaseVersion} ***NO_CI***`);
  exec(`git tag v${releaseVersion}`);
  exec(`git push origin HEAD:${tempPublishBranch} --follow-tags --verbose`);
  exec(`git push origin tag v${releaseVersion}`);

  const onlyTagSource = !!branchVersionSuffix;
  if (!onlyTagSource) {
    // -------- Generating Android Artifacts with JavaDoc
    exec("gradlew installArchives");

    // undo uncommenting javadoc setting
    exec("git checkout ReactAndroid/gradle.properties");
  }

  // Push tar to GitHub releases
  exec(`npm pack`);

  const npmTarFileName = `react-native-${releaseVersion}.tgz`;
  const npmTarPath = path.resolve(__dirname, '..', npmTarFileName);
  const finalTarPath = path.join(process.env.BUILD_STAGINGDIRECTORY, 'final', npmTarFileName);
  console.log(`Copying tar file ${npmTarPath} to: ${finalTarPath}`)
  fs.copyFileSync(npmTarPath, finalTarPath);

  const assetUpdateUrl = `https://uploads.github.com/repos/microsoft/react-native/releases/{id}/assets?name=react-native-${releaseVersion}.tgz`;
  const authHeader =
    "Basic " + new Buffer(":" + process.env.SYSTEM_ACCESSTOKEN).toString("base64");
  const userAgent = "Microsoft-React-Native-Release-Agent";

  let uploadReleaseAssetUrl = "";
  exec("npm install request@^2.69.0 --no-save");

  const request = require("request");

  const uploadTarBallToRelease = function() {
    request.post(
      {
        url: uploadReleaseAssetUrl,
        headers: {
          "User-Agent": userAgent,
          Authorization: authHeader,
          "Content-Type": "application/octet-stream"
        },
        formData: {
          file: fs.createReadStream(npmTarPath)
        }
      },
      function(err, res, body) {
        if (err) {
          console.error(err);
          process.exitCode = 1;
          throw err;
        }

        console.log('Response: ' + body);


        exec(`del ${npmTarPath}`);
        exec(`git checkout ${publishBranchName}`);
        exec(`git pull origin ${publishBranchName}`);
        exec(`git merge ${tempPublishBranch} --no-edit`);
        exec(
          `git push origin HEAD:${publishBranchName} --follow-tags --verbose`
        );
        exec(`git branch -d ${tempPublishBranch}`);
        exec(`git push origin --delete -d ${tempPublishBranch}`);
      }
    );
  };

  const createReleaseRequestBody = {
    tag_name: `v${releaseVersion}`,
    target_commitish: tempPublishBranch,
    name: `v${releaseVersion}`,
    body: `v${releaseVersion}`,
    draft: false,
    prerelease: true
  };
  console.log('createReleaseRequestBody: ' + JSON.stringify(createReleaseRequestBody, null, 2));

  request.post(
    {
      url: "https://api.github.com/repos/microsoft/react-native/releases",
      headers: {
        "User-Agent": userAgent,
        Authorization: authHeader
      },
      json: true,
      body: createReleaseRequestBody
    },
    function(err, res, body) {
      if (err) {
        console.log(err);
        throw new Error("Error fetching release id.");
      }

      console.log("Created GitHub Release: " + JSON.stringify(body, null, 2));
      uploadReleaseAssetUrl = assetUpdateUrl.replace(/{id}/, body.id);
      uploadTarBallToRelease();
    }
  );
}

doPublish();