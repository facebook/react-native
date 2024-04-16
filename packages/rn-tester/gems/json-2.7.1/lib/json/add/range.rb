#frozen_string_literal: false
unless defined?(::JSON::JSON_LOADED) and ::JSON::JSON_LOADED
  require 'json'
end

class Range

  # See #as_json.
  def self.json_create(object)
    new(*object['a'])
  end

  # Methods <tt>Range#as_json</tt> and +Range.json_create+ may be used
  # to serialize and deserialize a \Range object;
  # see Marshal[https://docs.ruby-lang.org/en/master/Marshal.html].
  #
  # \Method <tt>Range#as_json</tt> serializes +self+,
  # returning a 2-element hash representing +self+:
  #
  #   require 'json/add/range'
  #   x = (1..4).as_json     # => {"json_class"=>"Range", "a"=>[1, 4, false]}
  #   y = (1...4).as_json    # => {"json_class"=>"Range", "a"=>[1, 4, true]}
  #   z = ('a'..'d').as_json # => {"json_class"=>"Range", "a"=>["a", "d", false]}
  #
  # \Method +JSON.create+ deserializes such a hash, returning a \Range object:
  #
  #   Range.json_create(x) # => 1..4
  #   Range.json_create(y) # => 1...4
  #   Range.json_create(z) # => "a".."d"
  #
  def as_json(*)
    {
      JSON.create_id  => self.class.name,
      'a'             => [ first, last, exclude_end? ]
    }
  end

  # Returns a JSON string representing +self+:
  #
  #   require 'json/add/range'
  #   puts (1..4).to_json
  #   puts (1...4).to_json
  #   puts ('a'..'d').to_json
  #
  # Output:
  #
  #   {"json_class":"Range","a":[1,4,false]}
  #   {"json_class":"Range","a":[1,4,true]}
  #   {"json_class":"Range","a":["a","d",false]}
  #
  def to_json(*args)
    as_json.to_json(*args)
  end
end
