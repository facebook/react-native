The list of releases with notes can be found at:
https://github.com/facebook/react-native/releases

## Cut a release branch

- Make sure iOS and Android Getting Started flow works on master.
- Publish to Maven Central:
  - Edit `ReactAndroid/gradle.properties`
  - Edit `ReactAndroid/release.gradle` and uncomment Javadoc generation
  - `./gradlew :ReactAndroid:installArchives` (`java -version` should print 1.7 which is currently needed for Javadoc generation)
  - Log into Sonatype and go to [Staging upload](https://oss.sonatype.org/#staging-upload)
  - Select Artifact(s) with a POM (to publish to a local Maven repo for testing run `./gradlew :ReactAndroid:installArchives`)
  - Add all files: .aar, sources jar, javadoc jar, .asc for everything (including the POM file)
- `git checkout -b 0.12-stable`
- In `package.json`, set version to e.g. `0.12.0-rc`.
- In `React.podspec`, set version to e.g. `0.12.0-rc`.
- In `local-cli/generator-android/templates/src/app/build.gradle` update the dependency to e.g. `com.facebook.react:react-native:0.12.+`
- `git push origin 0.12-stable`
- `npm publish`

## Do a release

To release e.g. 0.12 to npm:

(For admins, here's the command to promote someone)

```
npm owner add <user> react-native
```

When you are ready to do a new release.

- Update package.json and React.podspec with the new number

```
git tag v0.6.0-rc 0.6-stable # don't forget the `v` at the beginning!
git push --tags
```

- Publish to GitHub

```
git push git push origin 0.12-stable
```

- Publish to npm

```
npm publish
npm dist-tag add react-native@0.12.0 latest
```

- Publish to CocoaPods (it takes several minutes to validate the podspec)
- Upgrade tags to a release by going to https://github.com/facebook/react-native/tags
- Click "Add Notes to release"
- Click Publish