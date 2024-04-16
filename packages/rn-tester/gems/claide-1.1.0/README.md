# Hi, I’m Claide, your command-line tool aide.

[![Build Status](https://img.shields.io/github/workflow/status/CocoaPods/claide/ci)](https://github.com/CocoaPods/claide/actions)
[![Gem Version](https://img.shields.io/gem/v/claide)](https://rubygems.org/gems/claide)

I was born out of a need for a _simple_ option and command parser, while still
providing an API that allows you to quickly create a full featured command-line
interface.

## Install

```
$ [sudo] gem install claide
```


## Usage

For full documentation, on the API of CLAide, visit [rubydoc.info][docs].


### Argument handling

At its core, a library, such as myself, needs to parse the parameters specified
by the user.

Working with parameters is done through the `CLAide::ARGV` class. It takes an
array of parameters and parses them as either flags, options, or arguments.

| Parameter              | Description                                        |
| :---:                  | :---:                                              |
| `--milk`, `--no-milk`  | A boolean ‘flag’, which may be negated.            |
| `--sweetener=honey`    | An ‘option’ consists of a key, a ‘=’, and a value. |
| `tea`                  | An ‘argument’ is just a value.                     |


Accessing flags, options, and arguments, with the following methods, will also
remove the parameter from the remaining unprocessed parameters.

```ruby
argv = CLAide::ARGV.new(['tea', '--no-milk', '--sweetener=honey'])
argv.shift_argument      # => 'tea'
argv.shift_argument      # => nil
argv.flag?('milk')       # => false
argv.flag?('milk')       # => nil
argv.option('sweetener') # => 'honey'
argv.option('sweetener') # => nil
```


In case the requested flag or option is not present, `nil` is returned. You can
specify a default value to be used as the optional second method parameter:

```ruby
argv = CLAide::ARGV.new(['tea'])
argv.flag?('milk', true)         # => true
argv.option('sweetener', 'sugar') # => 'sugar'
```


Unlike flags and options, accessing all of the arguments can be done in either
a preserving or mutating way:

```ruby
argv = CLAide::ARGV.new(['tea', 'coffee'])
argv.arguments  # => ['tea', 'coffee']
argv.arguments! # => ['tea', 'coffee']
argv.arguments  # => []
```


### Command handling

Commands are actions that a tool can perform. Every command is represented by
its own command class.

Commands may be nested, in which case they inherit from the ‘super command’
class. Some of these nested commands may not actually perform any work
themselves, but are rather used as ‘super commands’ _only_, in which case they
are ‘abtract commands’.

Running commands is typically done through the `CLAide::Command.run(argv)`
method, which performs the following three steps:

1. Parses the given parameters, finds the command class matching the parameters,
   and instantiates it with the remaining parameters.  It’s each nested command
   class’ responsibility to remove the parameters it handles from the remaining
   parameters, _before_ calling the `super` implementation.

2. Asks the command instance to validate its parameters, but only _after_
   calling the `super` implementation.  The `super` implementation will show a
   help banner in case the `--help` flag is specified, not all parameters were
   removed from the parameter list, or the command is an abstract command.

3. Calls the `run` method on the command instance, where it may do its work.

4. Catches _any_ uncaught exception and shows it to user in a meaningful way.
   * A `Help` exception triggers a help banner to be shown for the command.
   * A exception that includes the `InformativeError` module will show _only_
     the message, unless disabled with the `--verbose` flag; and in red,
     depending on the color configuration.
   * Any other type of exception will be passed to `Command.report_error(error)`
     for custom error reporting (such as the one in [CocoaPods][report-error]).

In case you want to call commands from _inside_ other commands, you should use
the `CLAide::Command.parse(argv)` method to retrieve an instance of the command
and call `run` on it. Unless you are using user-supplied parameters, there
should not be a need to validate the parameters.

See the [example][example] for a illustration of how to define commands.


[docs]: http://www.rubydoc.info/github/CocoaPods/CLAide/index
[example]: https://github.com/CocoaPods/CLAide/blob/master/examples/make.rb
[report-error]: https://github.com/CocoaPods/CocoaPods/blob/054fe5c861d932219ec40a91c0439a7cfc3a420c/lib/cocoapods/command.rb#L36
