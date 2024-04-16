#frozen_string_literal: false
unless defined?(::JSON::JSON_LOADED) and ::JSON::JSON_LOADED
  require 'json'
end

class Struct

  # See #as_json.
  def self.json_create(object)
    new(*object['v'])
  end

  # Methods <tt>Struct#as_json</tt> and +Struct.json_create+ may be used
  # to serialize and deserialize a \Struct object;
  # see Marshal[https://docs.ruby-lang.org/en/master/Marshal.html].
  #
  # \Method <tt>Struct#as_json</tt> serializes +self+,
  # returning a 2-element hash representing +self+:
  #
  #   require 'json/add/struct'
  #   Customer = Struct.new('Customer', :name, :address, :zip)
  #   x = Struct::Customer.new.as_json
  #   # => {"json_class"=>"Struct::Customer", "v"=>[nil, nil, nil]}
  #
  # \Method +JSON.create+ deserializes such a hash, returning a \Struct object:
  #
  #   Struct::Customer.json_create(x)
  #   # => #<struct Struct::Customer name=nil, address=nil, zip=nil>
  #
  def as_json(*)
    klass = self.class.name
    klass.to_s.empty? and raise JSON::JSONError, "Only named structs are supported!"
    {
      JSON.create_id => klass,
      'v'            => values,
    }
  end

  # Returns a JSON string representing +self+:
  #
  #   require 'json/add/struct'
  #   Customer = Struct.new('Customer', :name, :address, :zip)
  #   puts Struct::Customer.new.to_json
  #
  # Output:
  #
  #   {"json_class":"Struct","t":{'name':'Rowdy',"age":null}}
  #
  def to_json(*args)
    as_json.to_json(*args)
  end
end
