#frozen_string_literal: false
unless defined?(::JSON::JSON_LOADED) and ::JSON::JSON_LOADED
  require 'json'
end

class Regexp

  # See #as_json.
  def self.json_create(object)
    new(object['s'], object['o'])
  end

  # Methods <tt>Regexp#as_json</tt> and +Regexp.json_create+ may be used
  # to serialize and deserialize a \Regexp object;
  # see Marshal[https://docs.ruby-lang.org/en/master/Marshal.html].
  #
  # \Method <tt>Regexp#as_json</tt> serializes +self+,
  # returning a 2-element hash representing +self+:
  #
  #   require 'json/add/regexp'
  #   x = /foo/.as_json
  #   # => {"json_class"=>"Regexp", "o"=>0, "s"=>"foo"}
  #
  # \Method +JSON.create+ deserializes such a hash, returning a \Regexp object:
  #
  #   Regexp.json_create(x) # => /foo/
  #
  def as_json(*)
    {
      JSON.create_id => self.class.name,
      'o'            => options,
      's'            => source,
    }
  end

  # Returns a JSON string representing +self+:
  #
  #   require 'json/add/regexp'
  #   puts /foo/.to_json
  #
  # Output:
  #
  #    {"json_class":"Regexp","o":0,"s":"foo"}
  #
  def to_json(*args)
    as_json.to_json(*args)
  end
end
