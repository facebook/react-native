# Ruby I18n

[![Gem Version](https://badge.fury.io/rb/i18n.svg)](https://badge.fury.io/rb/i18n)
[![Build Status](https://github.com/ruby-i18n/i18n/workflows/Ruby/badge.svg)](https://github.com/ruby-i18n/i18n/actions?query=workflow%3ARuby)

Ruby internationalization and localization (i18n) solution.

Currently maintained by @radar.

## Usage

### Rails

You will most commonly use this library within a Rails app.

We support Rails versions from 6.0 and up.

[See the Rails Guide](https://guides.rubyonrails.org/i18n.html) for an example of its usage.

### Ruby (without Rails)

We support Ruby versions from 3.0 and up.

If you want to use this library without Rails, you can simply add `i18n` to your `Gemfile`:

```ruby
gem 'i18n'
```

Then configure I18n with some translations, and a default locale:

```ruby
I18n.load_path += Dir[File.expand_path("config/locales") + "/*.yml"]
I18n.default_locale = :en # (note that `en` is already the default!)
```

A simple translation file in your project might live at `config/locales/en.yml` and look like:

```yml
en:
  test: "This is a test"
```

You can then access this translation by doing:

```ruby
I18n.t(:test)
```

You can switch locales in your project by setting `I18n.locale` to a different value:

```ruby
I18n.locale = :de
I18n.t(:test) # => "Dies ist ein Test"
```

## Features

* Translation and localization
* Interpolation of values to translations
* Pluralization (CLDR compatible)
* Customizable transliteration to ASCII
* Flexible defaults
* Bulk lookup
* Lambdas as translation data
* Custom key/scope separator
* Custom exception handlers
* Extensible architecture with a swappable backend

## Pluggable Features

* Cache
* Pluralization: lambda pluralizers stored as translation data
* Locale fallbacks, RFC4647 compliant (optionally: RFC4646 locale validation)
* [Gettext support](https://github.com/ruby-i18n/i18n/wiki/Gettext)
* Translation metadata

## Alternative Backend

* Chain
* ActiveRecord (optionally: ActiveRecord::Missing and ActiveRecord::StoreProcs)
* KeyValue (uses active_support/json and cannot store procs)

For more information and lots of resources see [the 'Resources' page on the wiki](https://github.com/ruby-i18n/i18n/wiki/Resources).

## Tests

You can run tests both with

* `rake test` or just `rake`
* run any test file directly, e.g. `ruby -Ilib:test test/api/simple_test.rb`

You can run all tests against all Gemfiles with

* `ruby test/run_all.rb`

The structure of the test suite is a bit unusual as it uses modules to reuse
particular tests in different test cases.

The reason for this is that we need to enforce the I18n API across various
combinations of extensions. E.g. the Simple backend alone needs to support
the same API as any combination of feature and/or optimization modules included
to the Simple backend. We test this by reusing the same API definition (implemented
as test methods) in test cases with different setups.

You can find the test cases that enforce the API in test/api. And you can find
the API definition test methods in test/api/tests.

All other test cases (e.g. as defined in test/backend, test/core_ext) etc.
follow the usual test setup and should be easy to grok.

## More Documentation

Additional documentation can be found here: https://github.com/ruby-i18n/i18n/wiki

## Contributors

* @radar
* @carlosantoniodasilva
* @josevalim
* @knapo
* @tigrish
* [and many more](https://github.com/ruby-i18n/i18n/graphs/contributors)

## License

MIT License. See the included MIT-LICENSE file.
