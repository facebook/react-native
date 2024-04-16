#frozen_string_literal: false
unless defined?(::JSON::JSON_LOADED) and ::JSON::JSON_LOADED
  require 'json'
end
begin
  require 'bigdecimal'
rescue LoadError
end

class BigDecimal

  # See #as_json.
  def self.json_create(object)
    BigDecimal._load object['b']
  end

  # Methods <tt>BigDecimal#as_json</tt> and +BigDecimal.json_create+ may be used
  # to serialize and deserialize a \BigDecimal object;
  # see Marshal[https://docs.ruby-lang.org/en/master/Marshal.html].
  #
  # \Method <tt>BigDecimal#as_json</tt> serializes +self+,
  # returning a 2-element hash representing +self+:
  #
  #   require 'json/add/bigdecimal'
  #   x = BigDecimal(2).as_json             # => {"json_class"=>"BigDecimal", "b"=>"27:0.2e1"}
  #   y = BigDecimal(2.0, 4).as_json        # => {"json_class"=>"BigDecimal", "b"=>"36:0.2e1"}
  #   z = BigDecimal(Complex(2, 0)).as_json # => {"json_class"=>"BigDecimal", "b"=>"27:0.2e1"}
  #
  # \Method +JSON.create+ deserializes such a hash, returning a \BigDecimal object:
  #
  #   BigDecimal.json_create(x) # => 0.2e1
  #   BigDecimal.json_create(y) # => 0.2e1
  #   BigDecimal.json_create(z) # => 0.2e1
  #
  def as_json(*)
    {
      JSON.create_id => self.class.name,
      'b'            => _dump,
    }
  end

  # Returns a JSON string representing +self+:
  #
  #   require 'json/add/bigdecimal'
  #   puts BigDecimal(2).to_json
  #   puts BigDecimal(2.0, 4).to_json
  #   puts BigDecimal(Complex(2, 0)).to_json
  #
  # Output:
  #
  #   {"json_class":"BigDecimal","b":"27:0.2e1"}
  #   {"json_class":"BigDecimal","b":"36:0.2e1"}
  #   {"json_class":"BigDecimal","b":"27:0.2e1"}
  #
  def to_json(*args)
    as_json.to_json(*args)
  end
end if defined?(::BigDecimal)
