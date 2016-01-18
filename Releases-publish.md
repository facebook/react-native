## Publish a release (same steps for an rc version, 0.x.0)

Publish to Maven Central (Note: **We could get rid of this whole section by publishing binaries to npm instead**):
  - Log into Sonatype and go to [Staging upload](https://oss.sonatype.org/#staging-upload). You'll need to get permissions for this by filing a ticket explaining you're a core contributor to React Native. [Example ticket](https://issues.sonatype.org/browse/OSSRH-11885).
  - Select Artifact(s) with a POM (to publish to a local Maven repo for testing run `./gradlew :ReactAndroid:installArchives`)
  - Add all files: .aar, sources jar, javadoc jar, .asc for everything (including the POM file)
  - Wait a few hours until you see the version has propagated to [JCenter](https://bintray.com/bintray/jcenter/com.facebook.react%3Areact-native/view)

To release to npm:

(You need to be a maintainer of the repo. For admins, here's the command to promote someone)

```
npm owner add <user> react-native
```

```
git tag v0.version_you_are_releasing.0-rc 0.version_you_are_releasing-stable # don't forget the `v` at the beginning!
git push --tags
```

- Publish to npm

```
npm set registry https://registry.npmjs.org/
npm publish
# *Only* when doing a non-rc release:
# npm dist-tag add react-native@0.non_rc_version.0 latest
```
- Upgrade tags to a release by going to https://github.com/facebook/react-native/tags
- Click "Add Notes to release"
- Click Publish