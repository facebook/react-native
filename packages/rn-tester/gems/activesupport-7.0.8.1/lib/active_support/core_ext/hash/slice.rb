# frozen_string_literal: true

class Hash
  # Replaces the hash with only the given keys.
  # Returns a hash containing the removed key/value pairs.
  #
  #   hash = { a: 1, b: 2, c: 3, d: 4 }
  #   hash.slice!(:a, :b)  # => {:c=>3, :d=>4}
  #   hash                 # => {:a=>1, :b=>2}
  def slice!(*keys)
    omit = slice(*self.keys - keys)
    hash = slice(*keys)
    hash.default      = default
    hash.default_proc = default_proc if default_proc
    replace(hash)
    omit
  end

  # Removes and returns the key/value pairs matching the given keys.
  #
  #   hash = { a: 1, b: 2, c: 3, d: 4 }
  #   hash.extract!(:a, :b) # => {:a=>1, :b=>2}
  #   hash                  # => {:c=>3, :d=>4}
  def extract!(*keys)
    keys.each_with_object(self.class.new) { |key, result| result[key] = delete(key) if has_key?(key) }
  end
end
