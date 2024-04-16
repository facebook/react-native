#frozen_string_literal: false
unless defined?(::JSON::JSON_LOADED) and ::JSON::JSON_LOADED
  require 'json'
end
require 'ostruct'

class OpenStruct

  # See #as_json.
  def self.json_create(object)
    new(object['t'] || object[:t])
  end

  # Methods <tt>OpenStruct#as_json</tt> and +OpenStruct.json_create+ may be used
  # to serialize and deserialize a \OpenStruct object;
  # see Marshal[https://docs.ruby-lang.org/en/master/Marshal.html].
  #
  # \Method <tt>OpenStruct#as_json</tt> serializes +self+,
  # returning a 2-element hash representing +self+:
  #
  #   require 'json/add/ostruct'
  #   x = OpenStruct.new('name' => 'Rowdy', :age => nil).as_json
  #   # => {"json_class"=>"OpenStruct", "t"=>{:name=>'Rowdy', :age=>nil}}
  #
  # \Method +JSON.create+ deserializes such a hash, returning a \OpenStruct object:
  #
  #   OpenStruct.json_create(x)
  #   # => #<OpenStruct name='Rowdy', age=nil>
  #
  def as_json(*)
    klass = self.class.name
    klass.to_s.empty? and raise JSON::JSONError, "Only named structs are supported!"
    {
      JSON.create_id => klass,
      't'            => table,
    }
  end

  # Returns a JSON string representing +self+:
  #
  #   require 'json/add/ostruct'
  #   puts OpenStruct.new('name' => 'Rowdy', :age => nil).to_json
  #
  # Output:
  #
  #   {"json_class":"OpenStruct","t":{'name':'Rowdy',"age":null}}
  #
  def to_json(*args)
    as_json.to_json(*args)
  end
end
