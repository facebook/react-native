# frozen_string_literal: true

require "securerandom"

module SecureRandom
  BASE58_ALPHABET = ("0".."9").to_a + ("A".."Z").to_a + ("a".."z").to_a - ["0", "O", "I", "l"]
  BASE36_ALPHABET = ("0".."9").to_a + ("a".."z").to_a

  # SecureRandom.base58 generates a random base58 string.
  #
  # The argument _n_ specifies the length of the random string to be generated.
  #
  # If _n_ is not specified or is +nil+, 16 is assumed. It may be larger in the future.
  #
  # The result may contain alphanumeric characters except 0, O, I, and l.
  #
  #   p SecureRandom.base58 # => "4kUgL2pdQMSCQtjE"
  #   p SecureRandom.base58(24) # => "77TMHrHJFvFDwodq8w7Ev2m7"
  def self.base58(n = 16)
    SecureRandom.random_bytes(n).unpack("C*").map do |byte|
      idx = byte % 64
      idx = SecureRandom.random_number(58) if idx >= 58
      BASE58_ALPHABET[idx]
    end.join
  end

  # SecureRandom.base36 generates a random base36 string in lowercase.
  #
  # The argument _n_ specifies the length of the random string to be generated.
  #
  # If _n_ is not specified or is +nil+, 16 is assumed. It may be larger in the future.
  # This method can be used over +base58+ if a deterministic case key is necessary.
  #
  # The result will contain alphanumeric characters in lowercase.
  #
  #   p SecureRandom.base36 # => "4kugl2pdqmscqtje"
  #   p SecureRandom.base36(24) # => "77tmhrhjfvfdwodq8w7ev2m7"
  def self.base36(n = 16)
    SecureRandom.random_bytes(n).unpack("C*").map do |byte|
      idx = byte % 64
      idx = SecureRandom.random_number(36) if idx >= 36
      BASE36_ALPHABET[idx]
    end.join
  end
end
