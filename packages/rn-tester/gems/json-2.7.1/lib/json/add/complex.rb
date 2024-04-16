#frozen_string_literal: false
unless defined?(::JSON::JSON_LOADED) and ::JSON::JSON_LOADED
  require 'json'
end

class Complex

  # See #as_json.
  def self.json_create(object)
    Complex(object['r'], object['i'])
  end

  # Methods <tt>Complex#as_json</tt> and +Complex.json_create+ may be used
  # to serialize and deserialize a \Complex object;
  # see Marshal[https://docs.ruby-lang.org/en/master/Marshal.html].
  #
  # \Method <tt>Complex#as_json</tt> serializes +self+,
  # returning a 2-element hash representing +self+:
  #
  #   require 'json/add/complex'
  #   x = Complex(2).as_json      # => {"json_class"=>"Complex", "r"=>2, "i"=>0}
  #   y = Complex(2.0, 4).as_json # => {"json_class"=>"Complex", "r"=>2.0, "i"=>4}
  #
  # \Method +JSON.create+ deserializes such a hash, returning a \Complex object:
  #
  #   Complex.json_create(x) # => (2+0i)
  #   Complex.json_create(y) # => (2.0+4i)
  #
  def as_json(*)
    {
      JSON.create_id => self.class.name,
      'r'            => real,
      'i'            => imag,
    }
  end

  # Returns a JSON string representing +self+:
  #
  #   require 'json/add/complex'
  #   puts Complex(2).to_json
  #   puts Complex(2.0, 4).to_json
  #
  # Output:
  #
  #   {"json_class":"Complex","r":2,"i":0}
  #   {"json_class":"Complex","r":2.0,"i":4}
  #
  def to_json(*args)
    as_json.to_json(*args)
  end
end
