# Base64

The Base64 module provides for the encoding (`#encode64`, `#strict_encode64`,
`#urlsafe_encode64`) and decoding (`#decode64`, `#strict_decode64`,
`#urlsafe_decode64`) of binary data using a Base64 representation.

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'base64'
```

And then execute:

    $ bundle install

Or install it yourself as:

    $ gem install base64

## Usage

A simple encoding and decoding.

```ruby
require "base64"

enc   = Base64.encode64('Send reinforcements')
                    # -> "U2VuZCByZWluZm9yY2VtZW50cw==\n"
plain = Base64.decode64(enc)
                    # -> "Send reinforcements"
```

The purpose of using base64 to encode data is that it translates any
binary data into purely printable characters.

## Development

After checking out the repo, run `bin/setup` to install dependencies. Then, run `rake test` to run the tests. You can also run `bin/console` for an interactive prompt that will allow you to experiment.

To install this gem onto your local machine, run `bundle exec rake install`. To release a new version, update the version number in `version.rb`, and then run `bundle exec rake release`, which will create a git tag for the version, push git commits and tags, and push the `.gem` file to [rubygems.org](https://rubygems.org).

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/ruby/base64.

