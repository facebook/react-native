# Xcodeproj

[![Build Status](https://github.com/CocoaPods/Xcodeproj/workflows/Specs/badge.svg)](https://github.com/CocoaPods/Xcodeproj/actions/workflows/Specs.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/40ae104586c859d3581e/maintainability)](https://codeclimate.com/github/CocoaPods/Xcodeproj/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/40ae104586c859d3581e/test_coverage)](https://codeclimate.com/github/CocoaPods/Xcodeproj/test_coverage)

Xcodeproj lets you create and modify Xcode projects from [Ruby][ruby].
Script boring management tasks or build Xcode-friendly libraries. Also includes
support for Xcode workspaces (`.xcworkspace`), configuration files (`.xcconfig`) and
Xcode Scheme files (`.xcscheme`).

It is used in [CocoaPods](https://github.com/CocoaPods/CocoaPods) to create a
collection of supplemental libraries or frameworks, for all platforms Xcode supports.

The API reference can be found [here](http://www.rubydoc.info/gems/xcodeproj).

## Installing Xcodeproj

Xcodeproj itself installs through RubyGems, the Ruby package manager. Install it
by performing the following command:

    $ [sudo] gem install xcodeproj

## Quickstart

To begin editing an xcodeproj file start by opening it as an Xcodeproj with:

```ruby
require 'xcodeproj'
project_path = '/your_path/your_project.xcodeproj'
project = Xcodeproj::Project.open(project_path)
```

#### Some Small Examples To Get You Started

> Look through all targets

```ruby
project.targets.each do |target|
  puts target.name
end
```

> Get all source files for a target

```ruby
target = project.targets.first
files = target.source_build_phase.files.to_a.map do |pbx_build_file|
	pbx_build_file.file_ref.real_path.to_s

end.select do |path|
  path.end_with?(".m", ".mm", ".swift")

end.select do |path|
  File.exists?(path)
end
```

> Set a specific build configuration to all targets

```ruby
project.targets.each do |target|
  target.build_configurations.each do |config|
    config.build_settings['MY_CUSTOM_FLAG'] ||= 'TRUE'
  end
end
project.save
```

## Command Line Tool

Installing the Xcodeproj gem will also install a command-line tool `xcodeproj` which you can
use to generate project diffs, target diffs, output all configurations and show a YAML representation.

For more information consult `xcodeproj --help`.

## Collaborate

All Xcodeproj development happens on [GitHub][xcodeproj]. Contributing patches
is really easy and gratifying.

Follow [@CocoaPods][twitter] to get up to date information about what's
going on in the CocoaPods world.


## LICENSE

These works are available under the MIT license. See the [LICENSE][license] file
for more info.

[twitter]: http://twitter.com/CocoaPods
[ruby]: http://www.ruby-lang.org/en/
[xcodeproj]: https://github.com/cocoapods/xcodeproj
[tickets]: https://github.com/cocoapods/xcodeproj/issues
[license]: LICENSE
