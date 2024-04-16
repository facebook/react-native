unless defined?(::JSON::JSON_LOADED) and ::JSON::JSON_LOADED
  require 'json'
end
defined?(::Set) or require 'set'

class Set

  # See #as_json.
  def self.json_create(object)
    new object['a']
  end

  # Methods <tt>Set#as_json</tt> and +Set.json_create+ may be used
  # to serialize and deserialize a \Set object;
  # see Marshal[https://docs.ruby-lang.org/en/master/Marshal.html].
  #
  # \Method <tt>Set#as_json</tt> serializes +self+,
  # returning a 2-element hash representing +self+:
  #
  #   require 'json/add/set'
  #   x = Set.new(%w/foo bar baz/).as_json
  #   # => {"json_class"=>"Set", "a"=>["foo", "bar", "baz"]}
  #
  # \Method +JSON.create+ deserializes such a hash, returning a \Set object:
  #
  #   Set.json_create(x) # => #<Set: {"foo", "bar", "baz"}>
  #
  def as_json(*)
    {
      JSON.create_id => self.class.name,
      'a'            => to_a,
    }
  end

  # Returns a JSON string representing +self+:
  #
  #   require 'json/add/set'
  #   puts Set.new(%w/foo bar baz/).to_json
  #
  # Output:
  #
  #   {"json_class":"Set","a":["foo","bar","baz"]}
  #
  def to_json(*args)
    as_json.to_json(*args)
  end
end

