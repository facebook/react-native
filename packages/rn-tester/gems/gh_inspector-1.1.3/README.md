# The Issues Inspector

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'gh_inspector'
```

And then execute:

    $ bundle

## Usage

#### The Inspector

To get started using The Issues Inspector, you will need to
create an inspector instance. This class is main public API for querying issues.

#### Getting Started

Create an instance of `GhInspector::Inspector`, you can then ask it to search
based on your raised exception, or as a direct query yourself.

``` ruby
require 'gh_inspector'
inspector = GhInspector::Inspector.new "orta", "eigen"
# Either use an error:
inspector.search_exception an_error, ArtsyUI.new
# Or use a specific query:
inspector.search_query "Someone set us up the bomb"
```

By default this would output:

```
Looking for related issues on CocoaPods/CocoaPods...

  - undefined method `to_ary' for #<Pod::Specification name="iVersion">Did you mean? to_query
    https://github.com/CocoaPods/CocoaPods/issues/4748 [closed] [1 comment]

  - NoMethodError - undefined method `to_ary' for Pod EAIntroView
    https://github.com/CocoaPods/CocoaPods/issues/4391 [closed] [15 comments]

  - Do a search on GitHub for issues relating to a crash?
    https://github.com/CocoaPods/CocoaPods/issues/4391 [open] [3 comments]

and 10 more at:
https://github.com/CocoaPods/CocoaPods/search?q=undefined+method+%60to_ary%27&type=Issues
```
#### Presenting Your Report 

The default user interface for the inspector, its public API should be
considered the protocol for other classes wanting to provide a user interface.

Your custom objects will be verified at runtime that they conform to the protocol.

You can see the default implementation at
[lib/evidence.rb](/orta/gh-issues-inspector/tree/master/lib/evidence.rb).

Both `search_query` and `search_exception` take your custom delegate as a 2nd optional parameter.

``` ruby
require 'gh_inspector'
inspector = GhInspector::Inspector.new "orta", "eigen"
inspector.search_exception an_error, ArtsyUI.new
```

or

``` ruby
require 'gh_inspector'
inspector = GhInspector::Inspector.new "fastlane", "fastlane"
inspector.search_query "Someone set us up the bomb", FastlaneUI.new
```

Protocol for custom objects:

 - `inspector_started_query(query, inspector)` - Called just as the investigation has begun.
 - `inspector_successfully_recieved_report(report, inspector)` - Deprecated: Please use `inspector_successfully_received_report` instead.
 - `inspector_successfully_received_report(report, inspector)` - Called once the inspector has received a report with more than one issue.
 - `inspector_recieved_empty_report(report, inspector)` - Deprecated: Please use `inspector_received_empty_report` instead.
 - `inspector_received_empty_report(report, inspector)` - Called once the report has been received, but when there are no issues found.
 - `inspector_could_not_create_report(error, query, inspector)` - Called when there have been networking issues in creating the report.

## Development

After checking out the repo, run `bin/setup` to install dependencies. Then, run `bundle exec rake spec` to run the tests. You can also run `bin/console` for an interactive prompt that will allow you to experiment.

The usage section of this README is generated from inline documentation inside the classes, to update it run `bundle exec rake readme`.

To install this gem onto your local machine, run `bundle exec rake install`. To release a new version, update the version number in `version.rb`, and then run `bundle exec rake release`, which will create a git tag for the version, push git commits and tags, and push the `.gem` file to [rubygems.org](https://rubygems.org).

## Vision

I don't expect this project to grow too much, there's space around improving the search query for an exception, mainly. Other than that the project is effectively done and just needs some production usage to iron out any kinks. This project is well tested, and has zero dependencies.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/orta/gh-issues-inspector.
