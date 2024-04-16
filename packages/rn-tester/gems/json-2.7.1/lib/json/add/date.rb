#frozen_string_literal: false
unless defined?(::JSON::JSON_LOADED) and ::JSON::JSON_LOADED
  require 'json'
end
require 'date'

class Date

  # See #as_json.
  def self.json_create(object)
    civil(*object.values_at('y', 'm', 'd', 'sg'))
  end

  alias start sg unless method_defined?(:start)

  # Methods <tt>Date#as_json</tt> and +Date.json_create+ may be used
  # to serialize and deserialize a \Date object;
  # see Marshal[https://docs.ruby-lang.org/en/master/Marshal.html].
  #
  # \Method <tt>Date#as_json</tt> serializes +self+,
  # returning a 2-element hash representing +self+:
  #
  #   require 'json/add/date'
  #   x = Date.today.as_json
  #   # => {"json_class"=>"Date", "y"=>2023, "m"=>11, "d"=>21, "sg"=>2299161.0}
  #
  # \Method +JSON.create+ deserializes such a hash, returning a \Date object:
  #
  #   Date.json_create(x)
  #   # => #<Date: 2023-11-21 ((2460270j,0s,0n),+0s,2299161j)>
  #
  def as_json(*)
    {
      JSON.create_id => self.class.name,
      'y' => year,
      'm' => month,
      'd' => day,
      'sg' => start,
    }
  end

  # Returns a JSON string representing +self+:
  #
  #   require 'json/add/date'
  #   puts Date.today.to_json
  #
  # Output:
  #
  #   {"json_class":"Date","y":2023,"m":11,"d":21,"sg":2299161.0}
  #
  def to_json(*args)
    as_json.to_json(*args)
  end
end
