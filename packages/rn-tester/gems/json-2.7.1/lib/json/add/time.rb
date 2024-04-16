#frozen_string_literal: false
unless defined?(::JSON::JSON_LOADED) and ::JSON::JSON_LOADED
  require 'json'
end

class Time

  # See #as_json.
  def self.json_create(object)
    if usec = object.delete('u') # used to be tv_usec -> tv_nsec
      object['n'] = usec * 1000
    end
    if method_defined?(:tv_nsec)
      at(object['s'], Rational(object['n'], 1000))
    else
      at(object['s'], object['n'] / 1000)
    end
  end

  # Methods <tt>Time#as_json</tt> and +Time.json_create+ may be used
  # to serialize and deserialize a \Time object;
  # see Marshal[https://docs.ruby-lang.org/en/master/Marshal.html].
  #
  # \Method <tt>Time#as_json</tt> serializes +self+,
  # returning a 2-element hash representing +self+:
  #
  #   require 'json/add/time'
  #   x = Time.now.as_json
  #   # => {"json_class"=>"Time", "s"=>1700931656, "n"=>472846644}
  #
  # \Method +JSON.create+ deserializes such a hash, returning a \Time object:
  #
  #    Time.json_create(x)
  #    # => 2023-11-25 11:00:56.472846644 -0600
  #
  def as_json(*)
    nanoseconds = [ tv_usec * 1000 ]
    respond_to?(:tv_nsec) and nanoseconds << tv_nsec
    nanoseconds = nanoseconds.max
    {
      JSON.create_id => self.class.name,
      's'            => tv_sec,
      'n'            => nanoseconds,
    }
  end

  # Returns a JSON string representing +self+:
  #
  #   require 'json/add/time'
  #   puts Time.now.to_json
  #
  # Output:
  #
  #   {"json_class":"Time","s":1700931678,"n":980650786}
  #
  def to_json(*args)
    as_json.to_json(*args)
  end
end
