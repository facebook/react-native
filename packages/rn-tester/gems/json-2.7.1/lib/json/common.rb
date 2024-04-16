#frozen_string_literal: false
require 'json/version'
require 'json/generic_object'

module JSON
  NOT_SET = Object.new.freeze
  private_constant :NOT_SET

  class << self
    # :call-seq:
    #   JSON[object] -> new_array or new_string
    #
    # If +object+ is a \String,
    # calls JSON.parse with +object+ and +opts+ (see method #parse):
    #   json = '[0, 1, null]'
    #   JSON[json]# => [0, 1, nil]
    #
    # Otherwise, calls JSON.generate with +object+ and +opts+ (see method #generate):
    #   ruby = [0, 1, nil]
    #   JSON[ruby] # => '[0,1,null]'
    def [](object, opts = {})
      if object.respond_to? :to_str
        JSON.parse(object.to_str, opts)
      else
        JSON.generate(object, opts)
      end
    end

    # Returns the JSON parser class that is used by JSON. This is either
    # JSON::Ext::Parser or JSON::Pure::Parser:
    #   JSON.parser # => JSON::Ext::Parser
    attr_reader :parser

    # Set the JSON parser class _parser_ to be used by JSON.
    def parser=(parser) # :nodoc:
      @parser = parser
      remove_const :Parser if const_defined?(:Parser, false)
      const_set :Parser, parser
    end

    # Return the constant located at _path_. The format of _path_ has to be
    # either ::A::B::C or A::B::C. In any case, A has to be located at the top
    # level (absolute namespace path?). If there doesn't exist a constant at
    # the given path, an ArgumentError is raised.
    def deep_const_get(path) # :nodoc:
      path.to_s.split(/::/).inject(Object) do |p, c|
        case
        when c.empty?                  then p
        when p.const_defined?(c, true) then p.const_get(c)
        else
          begin
            p.const_missing(c)
          rescue NameError => e
            raise ArgumentError, "can't get const #{path}: #{e}"
          end
        end
      end
    end

    # Set the module _generator_ to be used by JSON.
    def generator=(generator) # :nodoc:
      old, $VERBOSE = $VERBOSE, nil
      @generator = generator
      generator_methods = generator::GeneratorMethods
      for const in generator_methods.constants
        klass = deep_const_get(const)
        modul = generator_methods.const_get(const)
        klass.class_eval do
          instance_methods(false).each do |m|
            m.to_s == 'to_json' and remove_method m
          end
          include modul
        end
      end
      self.state = generator::State
      const_set :State, self.state
      const_set :SAFE_STATE_PROTOTYPE, State.new # for JRuby
      const_set :FAST_STATE_PROTOTYPE, create_fast_state
      const_set :PRETTY_STATE_PROTOTYPE, create_pretty_state
    ensure
      $VERBOSE = old
    end

    def create_fast_state
      State.new(
        :indent         => '',
        :space          => '',
        :object_nl      => "",
        :array_nl       => "",
        :max_nesting    => false
      )
    end

    def create_pretty_state
      State.new(
        :indent         => '  ',
        :space          => ' ',
        :object_nl      => "\n",
        :array_nl       => "\n"
      )
    end

    # Returns the JSON generator module that is used by JSON. This is
    # either JSON::Ext::Generator or JSON::Pure::Generator:
    #   JSON.generator # => JSON::Ext::Generator
    attr_reader :generator

    # Sets or Returns the JSON generator state class that is used by JSON. This is
    # either JSON::Ext::Generator::State or JSON::Pure::Generator::State:
    #   JSON.state # => JSON::Ext::Generator::State
    attr_accessor :state
  end

  DEFAULT_CREATE_ID = 'json_class'.freeze
  private_constant :DEFAULT_CREATE_ID

  CREATE_ID_TLS_KEY = "JSON.create_id".freeze
  private_constant :CREATE_ID_TLS_KEY

  # Sets create identifier, which is used to decide if the _json_create_
  # hook of a class should be called; initial value is +json_class+:
  #   JSON.create_id # => 'json_class'
  def self.create_id=(new_value)
    Thread.current[CREATE_ID_TLS_KEY] = new_value.dup.freeze
  end

  # Returns the current create identifier.
  # See also JSON.create_id=.
  def self.create_id
    Thread.current[CREATE_ID_TLS_KEY] || DEFAULT_CREATE_ID
  end

  NaN           = 0.0/0

  Infinity      = 1.0/0

  MinusInfinity = -Infinity

  # The base exception for JSON errors.
  class JSONError < StandardError
    def self.wrap(exception)
      obj = new("Wrapped(#{exception.class}): #{exception.message.inspect}")
      obj.set_backtrace exception.backtrace
      obj
    end
  end

  # This exception is raised if a parser error occurs.
  class ParserError < JSONError; end

  # This exception is raised if the nesting of parsed data structures is too
  # deep.
  class NestingError < ParserError; end

  # :stopdoc:
  class CircularDatastructure < NestingError; end
  # :startdoc:

  # This exception is raised if a generator or unparser error occurs.
  class GeneratorError < JSONError; end
  # For backwards compatibility
  UnparserError = GeneratorError # :nodoc:

  # This exception is raised if the required unicode support is missing on the
  # system. Usually this means that the iconv library is not installed.
  class MissingUnicodeSupport < JSONError; end

  module_function

  # :call-seq:
  #   JSON.parse(source, opts) -> object
  #
  # Returns the Ruby objects created by parsing the given +source+.
  #
  # Argument +source+ contains the \String to be parsed.
  #
  # Argument +opts+, if given, contains a \Hash of options for the parsing.
  # See {Parsing Options}[#module-JSON-label-Parsing+Options].
  #
  # ---
  #
  # When +source+ is a \JSON array, returns a Ruby \Array:
  #   source = '["foo", 1.0, true, false, null]'
  #   ruby = JSON.parse(source)
  #   ruby # => ["foo", 1.0, true, false, nil]
  #   ruby.class # => Array
  #
  # When +source+ is a \JSON object, returns a Ruby \Hash:
  #   source = '{"a": "foo", "b": 1.0, "c": true, "d": false, "e": null}'
  #   ruby = JSON.parse(source)
  #   ruby # => {"a"=>"foo", "b"=>1.0, "c"=>true, "d"=>false, "e"=>nil}
  #   ruby.class # => Hash
  #
  # For examples of parsing for all \JSON data types, see
  # {Parsing \JSON}[#module-JSON-label-Parsing+JSON].
  #
  # Parses nested JSON objects:
  #   source = <<-EOT
  #   {
  #   "name": "Dave",
  #     "age" :40,
  #     "hats": [
  #       "Cattleman's",
  #       "Panama",
  #       "Tophat"
  #     ]
  #   }
  #   EOT
  #   ruby = JSON.parse(source)
  #   ruby # => {"name"=>"Dave", "age"=>40, "hats"=>["Cattleman's", "Panama", "Tophat"]}
  #
  # ---
  #
  # Raises an exception if +source+ is not valid JSON:
  #   # Raises JSON::ParserError (783: unexpected token at ''):
  #   JSON.parse('')
  #
  def parse(source, opts = {})
    Parser.new(source, **(opts||{})).parse
  end

  # :call-seq:
  #   JSON.parse!(source, opts) -> object
  #
  # Calls
  #   parse(source, opts)
  # with +source+ and possibly modified +opts+.
  #
  # Differences from JSON.parse:
  # - Option +max_nesting+, if not provided, defaults to +false+,
  #   which disables checking for nesting depth.
  # - Option +allow_nan+, if not provided, defaults to +true+.
  def parse!(source, opts = {})
    opts = {
      :max_nesting  => false,
      :allow_nan    => true
    }.merge(opts)
    Parser.new(source, **(opts||{})).parse
  end

  # :call-seq:
  #   JSON.load_file(path, opts={}) -> object
  #
  # Calls:
  #   parse(File.read(path), opts)
  #
  # See method #parse.
  def load_file(filespec, opts = {})
    parse(File.read(filespec), opts)
  end

  # :call-seq:
  #   JSON.load_file!(path, opts = {})
  #
  # Calls:
  #   JSON.parse!(File.read(path, opts))
  #
  # See method #parse!
  def load_file!(filespec, opts = {})
    parse!(File.read(filespec), opts)
  end

  # :call-seq:
  #   JSON.generate(obj, opts = nil) -> new_string
  #
  # Returns a \String containing the generated \JSON data.
  #
  # See also JSON.fast_generate, JSON.pretty_generate.
  #
  # Argument +obj+ is the Ruby object to be converted to \JSON.
  #
  # Argument +opts+, if given, contains a \Hash of options for the generation.
  # See {Generating Options}[#module-JSON-label-Generating+Options].
  #
  # ---
  #
  # When +obj+ is an \Array, returns a \String containing a \JSON array:
  #   obj = ["foo", 1.0, true, false, nil]
  #   json = JSON.generate(obj)
  #   json # => '["foo",1.0,true,false,null]'
  #
  # When +obj+ is a \Hash, returns a \String containing a \JSON object:
  #   obj = {foo: 0, bar: 's', baz: :bat}
  #   json = JSON.generate(obj)
  #   json # => '{"foo":0,"bar":"s","baz":"bat"}'
  #
  # For examples of generating from other Ruby objects, see
  # {Generating \JSON from Other Objects}[#module-JSON-label-Generating+JSON+from+Other+Objects].
  #
  # ---
  #
  # Raises an exception if any formatting option is not a \String.
  #
  # Raises an exception if +obj+ contains circular references:
  #   a = []; b = []; a.push(b); b.push(a)
  #   # Raises JSON::NestingError (nesting of 100 is too deep):
  #   JSON.generate(a)
  #
  def generate(obj, opts = nil)
    if State === opts
      state = opts
    else
      state = State.new(opts)
    end
    state.generate(obj)
  end

  # :stopdoc:
  # I want to deprecate these later, so I'll first be silent about them, and
  # later delete them.
  alias unparse generate
  module_function :unparse
  # :startdoc:

  # :call-seq:
  #   JSON.fast_generate(obj, opts) -> new_string
  #
  # Arguments +obj+ and +opts+ here are the same as
  # arguments +obj+ and +opts+ in JSON.generate.
  #
  # By default, generates \JSON data without checking
  # for circular references in +obj+ (option +max_nesting+ set to +false+, disabled).
  #
  # Raises an exception if +obj+ contains circular references:
  #   a = []; b = []; a.push(b); b.push(a)
  #   # Raises SystemStackError (stack level too deep):
  #   JSON.fast_generate(a)
  def fast_generate(obj, opts = nil)
    if State === opts
      state = opts
    else
      state = JSON.create_fast_state.configure(opts)
    end
    state.generate(obj)
  end

  # :stopdoc:
  # I want to deprecate these later, so I'll first be silent about them, and later delete them.
  alias fast_unparse fast_generate
  module_function :fast_unparse
  # :startdoc:

  # :call-seq:
  #   JSON.pretty_generate(obj, opts = nil) -> new_string
  #
  # Arguments +obj+ and +opts+ here are the same as
  # arguments +obj+ and +opts+ in JSON.generate.
  #
  # Default options are:
  #   {
  #     indent: '  ',   # Two spaces
  #     space: ' ',     # One space
  #     array_nl: "\n", # Newline
  #     object_nl: "\n" # Newline
  #   }
  #
  # Example:
  #   obj = {foo: [:bar, :baz], bat: {bam: 0, bad: 1}}
  #   json = JSON.pretty_generate(obj)
  #   puts json
  # Output:
  #   {
  #     "foo": [
  #       "bar",
  #       "baz"
  #     ],
  #     "bat": {
  #       "bam": 0,
  #       "bad": 1
  #     }
  #   }
  #
  def pretty_generate(obj, opts = nil)
    if State === opts
      state, opts = opts, nil
    else
      state = JSON.create_pretty_state
    end
    if opts
      if opts.respond_to? :to_hash
        opts = opts.to_hash
      elsif opts.respond_to? :to_h
        opts = opts.to_h
      else
        raise TypeError, "can't convert #{opts.class} into Hash"
      end
      state.configure(opts)
    end
    state.generate(obj)
  end

  # :stopdoc:
  # I want to deprecate these later, so I'll first be silent about them, and later delete them.
  alias pretty_unparse pretty_generate
  module_function :pretty_unparse
  # :startdoc:

  class << self
    # Sets or returns default options for the JSON.load method.
    # Initially:
    #   opts = JSON.load_default_options
    #   opts # => {:max_nesting=>false, :allow_nan=>true, :allow_blank=>true, :create_additions=>true}
    attr_accessor :load_default_options
  end
  self.load_default_options = {
    :max_nesting      => false,
    :allow_nan        => true,
    :allow_blank       => true,
    :create_additions => true,
  }

  # :call-seq:
  #   JSON.load(source, proc = nil, options = {}) -> object
  #
  # Returns the Ruby objects created by parsing the given +source+.
  #
  # - Argument +source+ must be, or be convertible to, a \String:
  #   - If +source+ responds to instance method +to_str+,
  #     <tt>source.to_str</tt> becomes the source.
  #   - If +source+ responds to instance method +to_io+,
  #     <tt>source.to_io.read</tt> becomes the source.
  #   - If +source+ responds to instance method +read+,
  #     <tt>source.read</tt> becomes the source.
  #   - If both of the following are true, source becomes the \String <tt>'null'</tt>:
  #     - Option +allow_blank+ specifies a truthy value.
  #     - The source, as defined above, is +nil+ or the empty \String <tt>''</tt>.
  #   - Otherwise, +source+ remains the source.
  # - Argument +proc+, if given, must be a \Proc that accepts one argument.
  #   It will be called recursively with each result (depth-first order).
  #   See details below.
  #   BEWARE: This method is meant to serialise data from trusted user input,
  #   like from your own database server or clients under your control, it could
  #   be dangerous to allow untrusted users to pass JSON sources into it.
  # - Argument +opts+, if given, contains a \Hash of options for the parsing.
  #   See {Parsing Options}[#module-JSON-label-Parsing+Options].
  #   The default options can be changed via method JSON.load_default_options=.
  #
  # ---
  #
  # When no +proc+ is given, modifies +source+ as above and returns the result of
  # <tt>parse(source, opts)</tt>;  see #parse.
  #
  # Source for following examples:
  #   source = <<-EOT
  #   {
  #   "name": "Dave",
  #     "age" :40,
  #     "hats": [
  #       "Cattleman's",
  #       "Panama",
  #       "Tophat"
  #     ]
  #   }
  #   EOT
  #
  # Load a \String:
  #   ruby = JSON.load(source)
  #   ruby # => {"name"=>"Dave", "age"=>40, "hats"=>["Cattleman's", "Panama", "Tophat"]}
  #
  # Load an \IO object:
  #   require 'stringio'
  #   object = JSON.load(StringIO.new(source))
  #   object # => {"name"=>"Dave", "age"=>40, "hats"=>["Cattleman's", "Panama", "Tophat"]}
  #
  # Load a \File object:
  #   path = 't.json'
  #   File.write(path, source)
  #   File.open(path) do |file|
  #     JSON.load(file)
  #   end # => {"name"=>"Dave", "age"=>40, "hats"=>["Cattleman's", "Panama", "Tophat"]}
  #
  # ---
  #
  # When +proc+ is given:
  # - Modifies +source+ as above.
  # - Gets the +result+ from calling <tt>parse(source, opts)</tt>.
  # - Recursively calls <tt>proc(result)</tt>.
  # - Returns the final result.
  #
  # Example:
  #   require 'json'
  #
  #   # Some classes for the example.
  #   class Base
  #     def initialize(attributes)
  #       @attributes = attributes
  #     end
  #   end
  #   class User    < Base; end
  #   class Account < Base; end
  #   class Admin   < Base; end
  #   # The JSON source.
  #   json = <<-EOF
  #   {
  #     "users": [
  #         {"type": "User", "username": "jane", "email": "jane@example.com"},
  #         {"type": "User", "username": "john", "email": "john@example.com"}
  #     ],
  #     "accounts": [
  #         {"account": {"type": "Account", "paid": true, "account_id": "1234"}},
  #         {"account": {"type": "Account", "paid": false, "account_id": "1235"}}
  #     ],
  #     "admins": {"type": "Admin", "password": "0wn3d"}
  #   }
  #   EOF
  #   # Deserializer method.
  #   def deserialize_obj(obj, safe_types = %w(User Account Admin))
  #     type = obj.is_a?(Hash) && obj["type"]
  #     safe_types.include?(type) ? Object.const_get(type).new(obj) : obj
  #   end
  #   # Call to JSON.load
  #   ruby = JSON.load(json, proc {|obj|
  #     case obj
  #     when Hash
  #       obj.each {|k, v| obj[k] = deserialize_obj v }
  #     when Array
  #       obj.map! {|v| deserialize_obj v }
  #     end
  #   })
  #   pp ruby
  # Output:
  #   {"users"=>
  #      [#<User:0x00000000064c4c98
  #        @attributes=
  #          {"type"=>"User", "username"=>"jane", "email"=>"jane@example.com"}>,
  #        #<User:0x00000000064c4bd0
  #        @attributes=
  #          {"type"=>"User", "username"=>"john", "email"=>"john@example.com"}>],
  #    "accounts"=>
  #      [{"account"=>
  #          #<Account:0x00000000064c4928
  #          @attributes={"type"=>"Account", "paid"=>true, "account_id"=>"1234"}>},
  #       {"account"=>
  #          #<Account:0x00000000064c4680
  #          @attributes={"type"=>"Account", "paid"=>false, "account_id"=>"1235"}>}],
  #    "admins"=>
  #      #<Admin:0x00000000064c41f8
  #      @attributes={"type"=>"Admin", "password"=>"0wn3d"}>}
  #
  def load(source, proc = nil, options = {})
    opts = load_default_options.merge options
    if source.respond_to? :to_str
      source = source.to_str
    elsif source.respond_to? :to_io
      source = source.to_io.read
    elsif source.respond_to?(:read)
      source = source.read
    end
    if opts[:allow_blank] && (source.nil? || source.empty?)
      source = 'null'
    end
    result = parse(source, opts)
    recurse_proc(result, &proc) if proc
    result
  end

  # Recursively calls passed _Proc_ if the parsed data structure is an _Array_ or _Hash_
  def recurse_proc(result, &proc) # :nodoc:
    case result
    when Array
      result.each { |x| recurse_proc x, &proc }
      proc.call result
    when Hash
      result.each { |x, y| recurse_proc x, &proc; recurse_proc y, &proc }
      proc.call result
    else
      proc.call result
    end
  end

  alias restore load
  module_function :restore

  class << self
    # Sets or returns the default options for the JSON.dump method.
    # Initially:
    #   opts = JSON.dump_default_options
    #   opts # => {:max_nesting=>false, :allow_nan=>true, :script_safe=>false}
    attr_accessor :dump_default_options
  end
  self.dump_default_options = {
    :max_nesting => false,
    :allow_nan   => true,
    :script_safe => false,
  }

  # :call-seq:
  #   JSON.dump(obj, io = nil, limit = nil)
  #
  # Dumps +obj+ as a \JSON string, i.e. calls generate on the object and returns the result.
  #
  # The default options can be changed via method JSON.dump_default_options.
  #
  # - Argument +io+, if given, should respond to method +write+;
  #   the \JSON \String is written to +io+, and +io+ is returned.
  #   If +io+ is not given, the \JSON \String is returned.
  # - Argument +limit+, if given, is passed to JSON.generate as option +max_nesting+.
  #
  # ---
  #
  # When argument +io+ is not given, returns the \JSON \String generated from +obj+:
  #   obj = {foo: [0, 1], bar: {baz: 2, bat: 3}, bam: :bad}
  #   json = JSON.dump(obj)
  #   json # => "{\"foo\":[0,1],\"bar\":{\"baz\":2,\"bat\":3},\"bam\":\"bad\"}"
  #
  # When argument +io+ is given, writes the \JSON \String to +io+ and returns +io+:
  #   path = 't.json'
  #   File.open(path, 'w') do |file|
  #     JSON.dump(obj, file)
  #   end # => #<File:t.json (closed)>
  #   puts File.read(path)
  # Output:
  #   {"foo":[0,1],"bar":{"baz":2,"bat":3},"bam":"bad"}
  def dump(obj, anIO = nil, limit = nil, kwargs = nil)
    io_limit_opt = [anIO, limit, kwargs].compact
    kwargs = io_limit_opt.pop if io_limit_opt.last.is_a?(Hash)
    anIO, limit = io_limit_opt
    if anIO.respond_to?(:to_io)
      anIO = anIO.to_io
    elsif limit.nil? && !anIO.respond_to?(:write)
      anIO, limit = nil, anIO
    end
    opts = JSON.dump_default_options
    opts = opts.merge(:max_nesting => limit) if limit
    opts = merge_dump_options(opts, **kwargs) if kwargs
    result = generate(obj, opts)
    if anIO
      anIO.write result
      anIO
    else
      result
    end
  rescue JSON::NestingError
    raise ArgumentError, "exceed depth limit"
  end

  # Encodes string using String.encode.
  def self.iconv(to, from, string)
    string.encode(to, from)
  end

  def merge_dump_options(opts, strict: NOT_SET)
    opts = opts.merge(strict: strict) if NOT_SET != strict
    opts
  end

  class << self
    private :merge_dump_options
  end
end

module ::Kernel
  private

  # Outputs _objs_ to STDOUT as JSON strings in the shortest form, that is in
  # one line.
  def j(*objs)
    objs.each do |obj|
      puts JSON::generate(obj, :allow_nan => true, :max_nesting => false)
    end
    nil
  end

  # Outputs _objs_ to STDOUT as JSON strings in a pretty format, with
  # indentation and over many lines.
  def jj(*objs)
    objs.each do |obj|
      puts JSON::pretty_generate(obj, :allow_nan => true, :max_nesting => false)
    end
    nil
  end

  # If _object_ is string-like, parse the string and return the parsed result as
  # a Ruby data structure. Otherwise, generate a JSON text from the Ruby data
  # structure object and return it.
  #
  # The _opts_ argument is passed through to generate/parse respectively. See
  # generate and parse for their documentation.
  def JSON(object, *args)
    if object.respond_to? :to_str
      JSON.parse(object.to_str, args.first)
    else
      JSON.generate(object, args.first)
    end
  end
end

# Extends any Class to include _json_creatable?_ method.
class ::Class
  # Returns true if this class can be used to create an instance
  # from a serialised JSON string. The class has to implement a class
  # method _json_create_ that expects a hash as first parameter. The hash
  # should include the required data.
  def json_creatable?
    respond_to?(:json_create)
  end
end
