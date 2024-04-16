#frozen_string_literal: false
unless defined?(::JSON::JSON_LOADED) and ::JSON::JSON_LOADED
  require 'json'
end

class Rational

  # See #as_json.
  def self.json_create(object)
    Rational(object['n'], object['d'])
  end

  # Methods <tt>Rational#as_json</tt> and +Rational.json_create+ may be used
  # to serialize and deserialize a \Rational object;
  # see Marshal[https://docs.ruby-lang.org/en/master/Marshal.html].
  #
  # \Method <tt>Rational#as_json</tt> serializes +self+,
  # returning a 2-element hash representing +self+:
  #
  #   require 'json/add/rational'
  #   x = Rational(2, 3).as_json
  #   # => {"json_class"=>"Rational", "n"=>2, "d"=>3}
  #
  # \Method +JSON.create+ deserializes such a hash, returning a \Rational object:
  #
  #   Rational.json_create(x)
  #   # => (2/3)
  #
  def as_json(*)
    {
      JSON.create_id => self.class.name,
      'n'            => numerator,
      'd'            => denominator,
    }
  end

  # Returns a JSON string representing +self+:
  #
  #   require 'json/add/rational'
  #   puts Rational(2, 3).to_json
  #
  # Output:
  #
  #   {"json_class":"Rational","n":2,"d":3}
  #
  def to_json(*args)
    as_json.to_json(*args)
  end
end
