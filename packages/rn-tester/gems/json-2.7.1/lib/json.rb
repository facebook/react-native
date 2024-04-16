#frozen_string_literal: false
require 'json/common'

##
# = JavaScript \Object Notation (\JSON)
#
# \JSON is a lightweight data-interchange format.
#
# A \JSON value is one of the following:
# - Double-quoted text:  <tt>"foo"</tt>.
# - Number:  +1+, +1.0+, +2.0e2+.
# - Boolean:  +true+, +false+.
# - Null: +null+.
# - \Array: an ordered list of values, enclosed by square brackets:
#     ["foo", 1, 1.0, 2.0e2, true, false, null]
#
# - \Object: a collection of name/value pairs, enclosed by curly braces;
#   each name is double-quoted text;
#   the values may be any \JSON values:
#     {"a": "foo", "b": 1, "c": 1.0, "d": 2.0e2, "e": true, "f": false, "g": null}
#
# A \JSON array or object may contain nested arrays, objects, and scalars
# to any depth:
#   {"foo": {"bar": 1, "baz": 2}, "bat": [0, 1, 2]}
#   [{"foo": 0, "bar": 1}, ["baz", 2]]
#
# == Using \Module \JSON
#
# To make module \JSON available in your code, begin with:
#   require 'json'
#
# All examples here assume that this has been done.
#
# === Parsing \JSON
#
# You can parse a \String containing \JSON data using
# either of two methods:
# - <tt>JSON.parse(source, opts)</tt>
# - <tt>JSON.parse!(source, opts)</tt>
#
# where
# - +source+ is a Ruby object.
# - +opts+ is a \Hash object containing options
#   that control both input allowed and output formatting.
#
# The difference between the two methods
# is that JSON.parse! omits some checks
# and may not be safe for some +source+ data;
# use it only for data from trusted sources.
# Use the safer method JSON.parse for less trusted sources.
#
# ==== Parsing \JSON Arrays
#
# When +source+ is a \JSON array, JSON.parse by default returns a Ruby \Array:
#   json = '["foo", 1, 1.0, 2.0e2, true, false, null]'
#   ruby = JSON.parse(json)
#   ruby # => ["foo", 1, 1.0, 200.0, true, false, nil]
#   ruby.class # => Array
#
# The \JSON array may contain nested arrays, objects, and scalars
# to any depth:
#   json = '[{"foo": 0, "bar": 1}, ["baz", 2]]'
#   JSON.parse(json) # => [{"foo"=>0, "bar"=>1}, ["baz", 2]]
#
# ==== Parsing \JSON \Objects
#
# When the source is a \JSON object, JSON.parse by default returns a Ruby \Hash:
#   json = '{"a": "foo", "b": 1, "c": 1.0, "d": 2.0e2, "e": true, "f": false, "g": null}'
#   ruby = JSON.parse(json)
#   ruby # => {"a"=>"foo", "b"=>1, "c"=>1.0, "d"=>200.0, "e"=>true, "f"=>false, "g"=>nil}
#   ruby.class # => Hash
#
# The \JSON object may contain nested arrays, objects, and scalars
# to any depth:
#   json = '{"foo": {"bar": 1, "baz": 2}, "bat": [0, 1, 2]}'
#   JSON.parse(json) # => {"foo"=>{"bar"=>1, "baz"=>2}, "bat"=>[0, 1, 2]}
#
# ==== Parsing \JSON Scalars
#
# When the source is a \JSON scalar (not an array or object),
# JSON.parse returns a Ruby scalar.
#
# \String:
#   ruby = JSON.parse('"foo"')
#   ruby # => 'foo'
#   ruby.class # => String
# \Integer:
#   ruby = JSON.parse('1')
#   ruby # => 1
#   ruby.class # => Integer
# \Float:
#   ruby = JSON.parse('1.0')
#   ruby # => 1.0
#   ruby.class # => Float
#   ruby = JSON.parse('2.0e2')
#   ruby # => 200
#   ruby.class # => Float
# Boolean:
#   ruby = JSON.parse('true')
#   ruby # => true
#   ruby.class # => TrueClass
#   ruby = JSON.parse('false')
#   ruby # => false
#   ruby.class # => FalseClass
# Null:
#   ruby = JSON.parse('null')
#   ruby # => nil
#   ruby.class # => NilClass
#
# ==== Parsing Options
#
# ====== Input Options
#
# Option +max_nesting+ (\Integer) specifies the maximum nesting depth allowed;
# defaults to +100+; specify +false+ to disable depth checking.
#
# With the default, +false+:
#   source = '[0, [1, [2, [3]]]]'
#   ruby = JSON.parse(source)
#   ruby # => [0, [1, [2, [3]]]]
# Too deep:
#   # Raises JSON::NestingError (nesting of 2 is too deep):
#   JSON.parse(source, {max_nesting: 1})
# Bad value:
#   # Raises TypeError (wrong argument type Symbol (expected Fixnum)):
#   JSON.parse(source, {max_nesting: :foo})
#
# ---
#
# Option +allow_nan+ (boolean) specifies whether to allow
# NaN, Infinity, and MinusInfinity in +source+;
# defaults to +false+.
#
# With the default, +false+:
#   # Raises JSON::ParserError (225: unexpected token at '[NaN]'):
#   JSON.parse('[NaN]')
#   # Raises JSON::ParserError (232: unexpected token at '[Infinity]'):
#   JSON.parse('[Infinity]')
#   # Raises JSON::ParserError (248: unexpected token at '[-Infinity]'):
#   JSON.parse('[-Infinity]')
# Allow:
#   source = '[NaN, Infinity, -Infinity]'
#   ruby = JSON.parse(source, {allow_nan: true})
#   ruby # => [NaN, Infinity, -Infinity]
#
# ====== Output Options
#
# Option +symbolize_names+ (boolean) specifies whether returned \Hash keys
# should be Symbols;
# defaults to +false+ (use Strings).
#
# With the default, +false+:
#   source = '{"a": "foo", "b": 1.0, "c": true, "d": false, "e": null}'
#   ruby = JSON.parse(source)
#   ruby # => {"a"=>"foo", "b"=>1.0, "c"=>true, "d"=>false, "e"=>nil}
# Use Symbols:
#   ruby = JSON.parse(source, {symbolize_names: true})
#   ruby # => {:a=>"foo", :b=>1.0, :c=>true, :d=>false, :e=>nil}
#
# ---
#
# Option +object_class+ (\Class) specifies the Ruby class to be used
# for each \JSON object;
# defaults to \Hash.
#
# With the default, \Hash:
#   source = '{"a": "foo", "b": 1.0, "c": true, "d": false, "e": null}'
#   ruby = JSON.parse(source)
#   ruby.class # => Hash
# Use class \OpenStruct:
#   ruby = JSON.parse(source, {object_class: OpenStruct})
#   ruby # => #<OpenStruct a="foo", b=1.0, c=true, d=false, e=nil>
#
# ---
#
# Option +array_class+ (\Class) specifies the Ruby class to be used
# for each \JSON array;
# defaults to \Array.
#
# With the default, \Array:
#   source = '["foo", 1.0, true, false, null]'
#   ruby = JSON.parse(source)
#   ruby.class # => Array
# Use class \Set:
#   ruby = JSON.parse(source, {array_class: Set})
#   ruby # => #<Set: {"foo", 1.0, true, false, nil}>
#
# ---
#
# Option +create_additions+ (boolean) specifies whether to use \JSON additions in parsing.
# See {\JSON Additions}[#module-JSON-label-JSON+Additions].
#
# === Generating \JSON
#
# To generate a Ruby \String containing \JSON data,
# use method <tt>JSON.generate(source, opts)</tt>, where
# - +source+ is a Ruby object.
# - +opts+ is a \Hash object containing options
#   that control both input allowed and output formatting.
#
# ==== Generating \JSON from Arrays
#
# When the source is a Ruby \Array, JSON.generate returns
# a \String containing a \JSON array:
#   ruby = [0, 's', :foo]
#   json = JSON.generate(ruby)
#   json # => '[0,"s","foo"]'
#
# The Ruby \Array array may contain nested arrays, hashes, and scalars
# to any depth:
#   ruby = [0, [1, 2], {foo: 3, bar: 4}]
#   json = JSON.generate(ruby)
#   json # => '[0,[1,2],{"foo":3,"bar":4}]'
#
# ==== Generating \JSON from Hashes
#
# When the source is a Ruby \Hash, JSON.generate returns
# a \String containing a \JSON object:
#   ruby = {foo: 0, bar: 's', baz: :bat}
#   json = JSON.generate(ruby)
#   json # => '{"foo":0,"bar":"s","baz":"bat"}'
#
# The Ruby \Hash array may contain nested arrays, hashes, and scalars
# to any depth:
#   ruby = {foo: [0, 1], bar: {baz: 2, bat: 3}, bam: :bad}
#   json = JSON.generate(ruby)
#   json # => '{"foo":[0,1],"bar":{"baz":2,"bat":3},"bam":"bad"}'
#
# ==== Generating \JSON from Other Objects
#
# When the source is neither an \Array nor a \Hash,
# the generated \JSON data depends on the class of the source.
#
# When the source is a Ruby \Integer or \Float, JSON.generate returns
# a \String containing a \JSON number:
#   JSON.generate(42) # => '42'
#   JSON.generate(0.42) # => '0.42'
#
# When the source is a Ruby \String, JSON.generate returns
# a \String containing a \JSON string (with double-quotes):
#   JSON.generate('A string') # => '"A string"'
#
# When the source is +true+, +false+ or +nil+, JSON.generate returns
# a \String containing the corresponding \JSON token:
#   JSON.generate(true) # => 'true'
#   JSON.generate(false) # => 'false'
#   JSON.generate(nil) # => 'null'
#
# When the source is none of the above, JSON.generate returns
# a \String containing a \JSON string representation of the source:
#   JSON.generate(:foo) # => '"foo"'
#   JSON.generate(Complex(0, 0)) # => '"0+0i"'
#   JSON.generate(Dir.new('.')) # => '"#<Dir>"'
#
# ==== Generating Options
#
# ====== Input Options
#
# Option +allow_nan+ (boolean) specifies whether
# +NaN+, +Infinity+, and <tt>-Infinity</tt> may be generated;
# defaults to +false+.
#
# With the default, +false+:
#   # Raises JSON::GeneratorError (920: NaN not allowed in JSON):
#   JSON.generate(JSON::NaN)
#   # Raises JSON::GeneratorError (917: Infinity not allowed in JSON):
#   JSON.generate(JSON::Infinity)
#   # Raises JSON::GeneratorError (917: -Infinity not allowed in JSON):
#   JSON.generate(JSON::MinusInfinity)
#
# Allow:
#   ruby = [Float::NaN, Float::Infinity, Float::MinusInfinity]
#   JSON.generate(ruby, allow_nan: true) # => '[NaN,Infinity,-Infinity]'
#
# ---
#
# Option +max_nesting+ (\Integer) specifies the maximum nesting depth
# in +obj+; defaults to +100+.
#
# With the default, +100+:
#   obj = [[[[[[0]]]]]]
#   JSON.generate(obj) # => '[[[[[[0]]]]]]'
#
# Too deep:
#   # Raises JSON::NestingError (nesting of 2 is too deep):
#   JSON.generate(obj, max_nesting: 2)
#
# ====== Escaping Options
#
# Options +script_safe+ (boolean) specifies wether <tt>'\u2028'</tt>, <tt>'\u2029'</tt>
# and <tt>'/'</tt> should be escaped as to make the JSON object safe to interpolate in script
# tags.
#
# Options +ascii_only+ (boolean) specifies wether all characters outside the ASCII range
# should be escaped.
#
# ====== Output Options
#
# The default formatting options generate the most compact
# \JSON data, all on one line and with no whitespace.
#
# You can use these formatting options to generate
# \JSON data in a more open format, using whitespace.
# See also JSON.pretty_generate.
#
# - Option +array_nl+ (\String) specifies a string (usually a newline)
#   to be inserted after each \JSON array; defaults to the empty \String, <tt>''</tt>.
# - Option +object_nl+ (\String) specifies a string (usually a newline)
#   to be inserted after each \JSON object; defaults to the empty \String, <tt>''</tt>.
# - Option +indent+ (\String) specifies the string (usually spaces) to be
#   used for indentation; defaults to the empty \String, <tt>''</tt>;
#   defaults to the empty \String, <tt>''</tt>;
#   has no effect unless options +array_nl+ or +object_nl+ specify newlines.
# - Option +space+ (\String) specifies a string (usually a space) to be
#   inserted after the colon in each \JSON object's pair;
#   defaults to the empty \String, <tt>''</tt>.
# - Option +space_before+ (\String) specifies a string (usually a space) to be
#   inserted before the colon in each \JSON object's pair;
#   defaults to the empty \String, <tt>''</tt>.
#
# In this example, +obj+ is used first to generate the shortest
# \JSON data (no whitespace), then again with all formatting options
# specified:
#
#   obj = {foo: [:bar, :baz], bat: {bam: 0, bad: 1}}
#   json = JSON.generate(obj)
#   puts 'Compact:', json
#   opts = {
#     array_nl: "\n",
#     object_nl: "\n",
#     indent: '  ',
#     space_before: ' ',
#     space: ' '
#   }
#   puts 'Open:', JSON.generate(obj, opts)
#
# Output:
#   Compact:
#   {"foo":["bar","baz"],"bat":{"bam":0,"bad":1}}
#   Open:
#   {
#     "foo" : [
#       "bar",
#       "baz"
#   ],
#     "bat" : {
#       "bam" : 0,
#       "bad" : 1
#     }
#   }
#
# == \JSON Additions
#
# When you "round trip" a non-\String object from Ruby to \JSON and back,
# you have a new \String, instead of the object you began with:
#   ruby0 = Range.new(0, 2)
#   json = JSON.generate(ruby0)
#   json # => '0..2"'
#   ruby1 = JSON.parse(json)
#   ruby1 # => '0..2'
#   ruby1.class # => String
#
# You can use \JSON _additions_ to preserve the original object.
# The addition is an extension of a ruby class, so that:
# - \JSON.generate stores more information in the \JSON string.
# - \JSON.parse, called with option +create_additions+,
#   uses that information to create a proper Ruby object.
#
# This example shows a \Range being generated into \JSON
# and parsed back into Ruby, both without and with
# the addition for \Range:
#   ruby = Range.new(0, 2)
#   # This passage does not use the addition for Range.
#   json0 = JSON.generate(ruby)
#   ruby0 = JSON.parse(json0)
#   # This passage uses the addition for Range.
#   require 'json/add/range'
#   json1 = JSON.generate(ruby)
#   ruby1 = JSON.parse(json1, create_additions: true)
#   # Make a nice display.
#   display = <<EOT
#   Generated JSON:
#     Without addition:  #{json0} (#{json0.class})
#     With addition:     #{json1} (#{json1.class})
#   Parsed JSON:
#     Without addition:  #{ruby0.inspect} (#{ruby0.class})
#     With addition:     #{ruby1.inspect} (#{ruby1.class})
#   EOT
#   puts display
#
# This output shows the different results:
#   Generated JSON:
#     Without addition:  "0..2" (String)
#     With addition:     {"json_class":"Range","a":[0,2,false]} (String)
#   Parsed JSON:
#     Without addition:  "0..2" (String)
#     With addition:     0..2 (Range)
#
# The \JSON module includes additions for certain classes.
# You can also craft custom additions.
# See {Custom \JSON Additions}[#module-JSON-label-Custom+JSON+Additions].
#
# === Built-in Additions
#
# The \JSON module includes additions for certain classes.
# To use an addition, +require+ its source:
# - BigDecimal: <tt>require 'json/add/bigdecimal'</tt>
# - Complex: <tt>require 'json/add/complex'</tt>
# - Date: <tt>require 'json/add/date'</tt>
# - DateTime: <tt>require 'json/add/date_time'</tt>
# - Exception: <tt>require 'json/add/exception'</tt>
# - OpenStruct: <tt>require 'json/add/ostruct'</tt>
# - Range: <tt>require 'json/add/range'</tt>
# - Rational: <tt>require 'json/add/rational'</tt>
# - Regexp: <tt>require 'json/add/regexp'</tt>
# - Set: <tt>require 'json/add/set'</tt>
# - Struct: <tt>require 'json/add/struct'</tt>
# - Symbol: <tt>require 'json/add/symbol'</tt>
# - Time: <tt>require 'json/add/time'</tt>
#
# To reduce punctuation clutter, the examples below
# show the generated \JSON via +puts+, rather than the usual +inspect+,
#
# \BigDecimal:
#   require 'json/add/bigdecimal'
#   ruby0 = BigDecimal(0) # 0.0
#   json = JSON.generate(ruby0) # {"json_class":"BigDecimal","b":"27:0.0"}
#   ruby1 = JSON.parse(json, create_additions: true) # 0.0
#   ruby1.class # => BigDecimal
#
# \Complex:
#   require 'json/add/complex'
#   ruby0 = Complex(1+0i) # 1+0i
#   json = JSON.generate(ruby0) # {"json_class":"Complex","r":1,"i":0}
#   ruby1 = JSON.parse(json, create_additions: true) # 1+0i
#   ruby1.class # Complex
#
# \Date:
#   require 'json/add/date'
#   ruby0 = Date.today # 2020-05-02
#   json = JSON.generate(ruby0) # {"json_class":"Date","y":2020,"m":5,"d":2,"sg":2299161.0}
#   ruby1 = JSON.parse(json, create_additions: true) # 2020-05-02
#   ruby1.class # Date
#
# \DateTime:
#   require 'json/add/date_time'
#   ruby0 = DateTime.now # 2020-05-02T10:38:13-05:00
#   json = JSON.generate(ruby0) # {"json_class":"DateTime","y":2020,"m":5,"d":2,"H":10,"M":38,"S":13,"of":"-5/24","sg":2299161.0}
#   ruby1 = JSON.parse(json, create_additions: true) # 2020-05-02T10:38:13-05:00
#   ruby1.class # DateTime
#
# \Exception (and its subclasses including \RuntimeError):
#   require 'json/add/exception'
#   ruby0 = Exception.new('A message') # A message
#   json = JSON.generate(ruby0) # {"json_class":"Exception","m":"A message","b":null}
#   ruby1 = JSON.parse(json, create_additions: true) # A message
#   ruby1.class # Exception
#   ruby0 = RuntimeError.new('Another message') # Another message
#   json = JSON.generate(ruby0) # {"json_class":"RuntimeError","m":"Another message","b":null}
#   ruby1 = JSON.parse(json, create_additions: true) # Another message
#   ruby1.class # RuntimeError
#
# \OpenStruct:
#   require 'json/add/ostruct'
#   ruby0 = OpenStruct.new(name: 'Matz', language: 'Ruby') # #<OpenStruct name="Matz", language="Ruby">
#   json = JSON.generate(ruby0) # {"json_class":"OpenStruct","t":{"name":"Matz","language":"Ruby"}}
#   ruby1 = JSON.parse(json, create_additions: true) # #<OpenStruct name="Matz", language="Ruby">
#   ruby1.class # OpenStruct
#
# \Range:
#   require 'json/add/range'
#   ruby0 = Range.new(0, 2) # 0..2
#   json = JSON.generate(ruby0) # {"json_class":"Range","a":[0,2,false]}
#   ruby1 = JSON.parse(json, create_additions: true) # 0..2
#   ruby1.class # Range
#
# \Rational:
#   require 'json/add/rational'
#   ruby0 = Rational(1, 3) # 1/3
#   json = JSON.generate(ruby0) # {"json_class":"Rational","n":1,"d":3}
#   ruby1 = JSON.parse(json, create_additions: true) # 1/3
#   ruby1.class # Rational
#
# \Regexp:
#   require 'json/add/regexp'
#   ruby0 = Regexp.new('foo') # (?-mix:foo)
#   json = JSON.generate(ruby0) # {"json_class":"Regexp","o":0,"s":"foo"}
#   ruby1 = JSON.parse(json, create_additions: true) # (?-mix:foo)
#   ruby1.class # Regexp
#
# \Set:
#   require 'json/add/set'
#   ruby0 = Set.new([0, 1, 2]) # #<Set: {0, 1, 2}>
#   json = JSON.generate(ruby0) # {"json_class":"Set","a":[0,1,2]}
#   ruby1 = JSON.parse(json, create_additions: true) # #<Set: {0, 1, 2}>
#   ruby1.class # Set
#
# \Struct:
#   require 'json/add/struct'
#   Customer = Struct.new(:name, :address) # Customer
#   ruby0 = Customer.new("Dave", "123 Main") # #<struct Customer name="Dave", address="123 Main">
#   json = JSON.generate(ruby0) # {"json_class":"Customer","v":["Dave","123 Main"]}
#   ruby1 = JSON.parse(json, create_additions: true) # #<struct Customer name="Dave", address="123 Main">
#   ruby1.class # Customer
#
# \Symbol:
#   require 'json/add/symbol'
#   ruby0 = :foo # foo
#   json = JSON.generate(ruby0) # {"json_class":"Symbol","s":"foo"}
#   ruby1 = JSON.parse(json, create_additions: true) # foo
#   ruby1.class # Symbol
#
# \Time:
#   require 'json/add/time'
#   ruby0 = Time.now # 2020-05-02 11:28:26 -0500
#   json = JSON.generate(ruby0) # {"json_class":"Time","s":1588436906,"n":840560000}
#   ruby1 = JSON.parse(json, create_additions: true) # 2020-05-02 11:28:26 -0500
#   ruby1.class # Time
#
#
# === Custom \JSON Additions
#
# In addition to the \JSON additions provided,
# you can craft \JSON additions of your own,
# either for Ruby built-in classes or for user-defined classes.
#
# Here's a user-defined class +Foo+:
#   class Foo
#     attr_accessor :bar, :baz
#     def initialize(bar, baz)
#       self.bar = bar
#       self.baz = baz
#     end
#   end
#
# Here's the \JSON addition for it:
#   # Extend class Foo with JSON addition.
#   class Foo
#     # Serialize Foo object with its class name and arguments
#     def to_json(*args)
#       {
#         JSON.create_id  => self.class.name,
#         'a'             => [ bar, baz ]
#       }.to_json(*args)
#     end
#     # Deserialize JSON string by constructing new Foo object with arguments.
#     def self.json_create(object)
#       new(*object['a'])
#     end
#   end
#
# Demonstration:
#   require 'json'
#   # This Foo object has no custom addition.
#   foo0 = Foo.new(0, 1)
#   json0 = JSON.generate(foo0)
#   obj0 = JSON.parse(json0)
#   # Lood the custom addition.
#   require_relative 'foo_addition'
#   # This foo has the custom addition.
#   foo1 = Foo.new(0, 1)
#   json1 = JSON.generate(foo1)
#   obj1 = JSON.parse(json1, create_additions: true)
#   #   Make a nice display.
#   display = <<EOT
#   Generated JSON:
#     Without custom addition:  #{json0} (#{json0.class})
#     With custom addition:     #{json1} (#{json1.class})
#   Parsed JSON:
#     Without custom addition:  #{obj0.inspect} (#{obj0.class})
#     With custom addition:     #{obj1.inspect} (#{obj1.class})
#   EOT
#   puts display
#
# Output:
#
#   Generated JSON:
#     Without custom addition:  "#<Foo:0x0000000006534e80>" (String)
#     With custom addition:     {"json_class":"Foo","a":[0,1]} (String)
#   Parsed JSON:
#     Without custom addition:  "#<Foo:0x0000000006534e80>" (String)
#     With custom addition:     #<Foo:0x0000000006473bb8 @bar=0, @baz=1> (Foo)
#
module JSON
  require 'json/version'

  begin
    require 'json/ext'
  rescue LoadError
    require 'json/pure'
  end
end
