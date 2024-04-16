# cocoapods-deintegrate

A CocoaPods plugin to remove and deintegrate CocoaPods from your project.
Removing all traces of CocoaPods from an Xcode project.

## Installation

```bash
$ [sudo] gem install cocoapods-deintegrate
```

## Usage

Running `pod deintegrate` will deintegrate your Xcode project from
CocoaPods. Before running you should ensure you have a backup of your project.

```bash
$ pod deintegrate
Deintegrating Palaver.xcodeproj
Deintegrating target Palaver
Deleted 1 'Copy Pods Resources' build phases.
Deleted 1 'Check Pods Manifest.lock' build phases.
Removing Pod libraries from build phase:
- libPods-Palaver.a
Deleting Pod file references from project
- libPods-Palaver.a
- libPods-PalaverTests.a
- Pods-Palaver.debug.xcconfig
- Pods-Palaver.release.xcconfig
- Pods-Palaver.ad hoc.xcconfig
- Pods-PalaverTests.debug.xcconfig
- Pods-PalaverTests.release.xcconfig
- Pods-PalaverTests.ad hoc.xcconfig
Deleted 1 `Pod` groups from project.
Deintegrating target PalaverTests
Deleted 1 'Copy Pods Resources' build phases.
Deleted 1 'Check Pods Manifest.lock' build phases.

Project has been deintegrated. No traces of CocoaPods left in project.
Note: The workspace referencing the Pods project still remains.
```

The only things that will remains are as follows:

- Podfile, Podfile.lock
- Workspace

### Credits

This CocoaPods plugin was created by [Kyle Fuller](http://kylefuller.co.uk/)
([@kylefuller](https://twitter.com/kylefuller)).

### License

cocoapods-deintegrate is released under the MIT license. See [LICENSE](LICENSE).

