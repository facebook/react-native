#frozen_string_literal: false
unless defined?(::JSON::JSON_LOADED) and ::JSON::JSON_LOADED
  require 'json'
end

class Exception

  # See #as_json.
  def self.json_create(object)
    result = new(object['m'])
    result.set_backtrace object['b']
    result
  end

  # Methods <tt>Exception#as_json</tt> and +Exception.json_create+ may be used
  # to serialize and deserialize a \Exception object;
  # see Marshal[https://docs.ruby-lang.org/en/master/Marshal.html].
  #
  # \Method <tt>Exception#as_json</tt> serializes +self+,
  # returning a 2-element hash representing +self+:
  #
  #   require 'json/add/exception'
  #   x = Exception.new('Foo').as_json # => {"json_class"=>"Exception", "m"=>"Foo", "b"=>nil}
  #
  # \Method +JSON.create+ deserializes such a hash, returning a \Exception object:
  #
  #   Exception.json_create(x) # => #<Exception: Foo>
  #
  def as_json(*)
    {
      JSON.create_id => self.class.name,
      'm'            => message,
      'b'            => backtrace,
    }
  end

  # Returns a JSON string representing +self+:
  #
  #   require 'json/add/exception'
  #   puts Exception.new('Foo').to_json
  #
  # Output:
  #
  #   {"json_class":"Exception","m":"Foo","b":null}
  #
  def to_json(*args)
    as_json.to_json(*args)
  end
end
