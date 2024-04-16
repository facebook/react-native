# Nanaimo

Nanaimo is a simple library that implements ASCII Plist serialization and
deserialization, entirely with native Ruby code (and zero dependencies). It
also comes with out-of-the-box support for serializing Xcode projects (complete
with annotations) and XML plists.

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'nanaimo'
```

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install nanaimo

## Usage

```ruby
require 'nanaimo'

# parse a native ruby object from an ascii plist file
project_hash = Nanaimo::Reader
  .from_file("App.xcodeproj/project.pbxproj")
  .parse!
  .as_ruby

# change that object
project_hash['...'] = '...'

# re-serialize it
ascii_plist_string = Nanaimo::Writer.new(project_hash).write
```

## Development

After checking out the repo, run `bin/setup` to install dependencies. Then, run `rake spec` to run the tests. You can also run `bin/console` for an interactive prompt that will allow you to experiment.

To install this gem onto your local machine, run `bundle exec rake install`. To release a new version, update the version number in `version.rb`, and then run `bundle exec rake release`, which will create a git tag for the version, push git commits and tags, and push the `.gem` file to [rubygems.org](https://rubygems.org).

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/CocoaPods/nanaimo. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.


## License

The gem is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).
