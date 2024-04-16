#frozen_string_literal: false
unless defined?(::JSON::JSON_LOADED) and ::JSON::JSON_LOADED
  require 'json'
end
require 'date'

class DateTime

  # See #as_json.
  def self.json_create(object)
    args = object.values_at('y', 'm', 'd', 'H', 'M', 'S')
    of_a, of_b = object['of'].split('/')
    if of_b and of_b != '0'
      args << Rational(of_a.to_i, of_b.to_i)
    else
      args << of_a
    end
    args << object['sg']
    civil(*args)
  end

  alias start sg unless method_defined?(:start)

  # Methods <tt>DateTime#as_json</tt> and +DateTime.json_create+ may be used
  # to serialize and deserialize a \DateTime object;
  # see Marshal[https://docs.ruby-lang.org/en/master/Marshal.html].
  #
  # \Method <tt>DateTime#as_json</tt> serializes +self+,
  # returning a 2-element hash representing +self+:
  #
  #   require 'json/add/datetime'
  #   x = DateTime.now.as_json
  #   # => {"json_class"=>"DateTime", "y"=>2023, "m"=>11, "d"=>21, "sg"=>2299161.0}
  #
  # \Method +JSON.create+ deserializes such a hash, returning a \DateTime object:
  #
  #   DateTime.json_create(x) # BUG? Raises Date::Error "invalid date"
  #
  def as_json(*)
    {
      JSON.create_id => self.class.name,
      'y' => year,
      'm' => month,
      'd' => day,
      'H' => hour,
      'M' => min,
      'S' => sec,
      'of' => offset.to_s,
      'sg' => start,
    }
  end

  # Returns a JSON string representing +self+:
  #
  #   require 'json/add/datetime'
  #   puts DateTime.now.to_json
  #
  # Output:
  #
  #   {"json_class":"DateTime","y":2023,"m":11,"d":21,"sg":2299161.0}
  #
  def to_json(*args)
    as_json.to_json(*args)
  end
end


