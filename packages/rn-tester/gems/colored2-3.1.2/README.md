[![Gem Version](https://badge.fury.io/rb/colored2.svg)](https://badge.fury.io/rb/colored2)
[![Downloads](http://ruby-gem-downloads-badge.herokuapp.com/colored2?type=total)](https://rubygems.org/gems/colored2)
[![Gitter](https://img.shields.io/gitter/room/gitterHQ/gitter.svg)](https://gitter.im/colored2)

[![Build Status](https://travis-ci.org/kigster/colored2.svg?branch=master)](https://travis-ci.org/kigster/colored2)
[![Test Coverage](https://codeclimate.com/github/kigster/colored2/badges/coverage.svg)](https://codeclimate.com/github/kigster/colored2/coverage)
[![Code Climate](https://codeclimate.com/github/kigster/colored2/badges/gpa.svg)](https://codeclimate.com/github/kigster/colored2)
[![Issue Count](https://codeclimate.com/github/kigster/colored2/badges/issue_count.svg)](https://codeclimate.com/github/kigster/colored2)

## Colored2

This is an actively maintained fork of Chris (defunkt) Wanstrath's gem [colored](https://github.com/defunkt/colored), which appears to be no longer supported.

This fork comes with a slightly spruced up syntax, some additional features, and a test suite written in [RSpec](http://rspec.info/).

## Usage

In addition to the simple syntax of the original gem, which affected only the string to the left of the method call, the new "bang" syntax affects a string to the right. If the block or a method argument is provided, the contents is wrapped in the color, and the color is then reset back. 

If no block or argument is provided, the color is left open-ended, and must be explicitly reset – when using the 'bang' notation.

![](doc/colored2-session1.png)

### Complete set of colors:

 * black
 * red
 * green
 * yellow
 * blue
 * magenta
 * cyan
 * white

### Complete Set of Effects

> Note: previous versions used method name `clear` instead of `no_color`, which clashed with many 3rd party frameworks that defined similarly named method in the global namespace.
> This highlights the dangers of introducing so many words into the `String` namespace.

 * no_color
 * bold
 * dark
 * italic
 * underlined
 * reversed 
 * plain
 * normal   
 
## Usage in Other Classes

With this gem you can add color to not just strings, but to any other class. `String` class is automatically decorated as soon as `require 'colored2'` is parsed by the ruby interpreter. Note that future versions may refrain from auto-requiring `colored2/strings`, and rely on explicitly requiring components they need colorized, eg `require 'colored2/numbers'`.

To color numbers, require the following file, which automatically decorates `Integer` and `Float`.  You can also add color methods to the `Object`. Finally, you can add the methods to any custom class by including the `Colored2` Module.

Below is an `IRB` — session that shows a slightly more advanced usage.

![](doc/colored2-session2.png)

##  Additional Helpers

There are several additional helpers tucked onto the `String` class.

 * `#to_bol` (to beginning of the line) will rewind the cursor back to the beginning of the current line.
 * `#to_eol` (to end of line)
 
## Installation

Add this line to your application's Gemfile:


    gem 'colored2'


And then execute:

    $ bundle

Or install it yourself as:

    $ gem install colored2


## Development

To install this gem onto your local machine, run `bundle exec rake install`. To release a new version, update the version number in `version.rb`, and then run `bundle exec rake release`, which will create a git tag for the version, push git commits and tags, and push the `.gem` file to [rubygems.org](https://rubygems.org).

## Contributing

Bug reports and pull requests are welcome on GitHub at [https://github.com/kigster/colored2](https://github.com/kigster/colored2).

## License

The gem is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).
