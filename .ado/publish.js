// Used to publish this fork of react-native
// Publish it as an attached tar asset to the GitHub release for general consumption, since we can't publish this to the npmjs npm feed

const fs = require("fs");
const path = require("path");
const execSync = require("child_process").execSync;

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
  const publishBranchName = process.env.publishBranchName;

  const tempPublishBranch = `publish-${Date.now()}`;

  const pkgJsonPath = path.resolve(__dirname, "../package.json");
  let pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));

  let releaseVersion = pkgJson.version;

  const versionGroups = /(.*-microsoft\.)([0-9]*)/.exec(releaseVersion);
  if (versionGroups) {
    releaseVersion = versionGroups[1] + (parseInt(versionGroups[2]) + 1);
  } else {
    if (releaseVersion.indexOf("-") === -1) {
      releaseVersion = releaseVersion + "-microsoft.0";
    } else {
      console.log("Invalid version to publish");
      exit(1);
    }
  }

  pkgJson.version = releaseVersion;
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
  console.log(`Updating package.json to version ${releaseVersion}`);

  exec(`git checkout -b ${tempPublishBranch}`);

  exec(`git add ${pkgJsonPath}`);
  exec(`git commit -m "Applying package update to ${releaseVersion}`);
  exec(`git tag v${releaseVersion}`);
  exec(`git push origin HEAD:${tempPublishBranch} --follow-tags --verbose`);
  exec(`git push origin tag v${releaseVersion}`);

  // -------- Generating Android Artifacts with JavaDoc
  exec("gradlew installArchives");

  // undo uncommenting javadoc setting
  exec("git checkout ReactAndroid/gradle.properties");

  // Configure npm to publish to internal feed
  const npmrcPath = path.resolve(__dirname, "../.npmrc");
  const npmrcContents = `registry=https:${
    process.env.publishnpmfeed
  }/registry/\nalways-auth=true`;
  console.log(`Creating ${npmrcPath} for publishing:`);
  console.log(npmrcContents);
  fs.writeFileSync(npmrcPath, npmrcContents);

  exec(`npm publish`);
  exec(`del ${npmrcPath}`);

  // Push tar to GitHub releases
  exec(`npm pack`);

  const npmTarPath = path.resolve(
    __dirname,
    `../react-native-${releaseVersion}.tgz`
  );
  const assetUpdateUrl = `https://uploads.github.com/repos/Microsoft/react-native/releases/{id}/assets?name=react-native-${releaseVersion}.tgz`;
  const authHeader =
    "Basic " + new Buffer(":" + process.env.githubToken).toString("base64");
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

        var formattedResponse = JSON.parse(body);

        if (formattedResponse.errors) {
          process.exitCode = 1;
          console.error(formattedResponse.errors);
          throw formattedResponse.errors;
        }

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
      url: "https://api.github.com/repos/Microsoft/react-native/releases",
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