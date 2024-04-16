# frozen_string_literal: true

class String
  # Enables more predictable duck-typing on String-like classes. See <tt>Object#acts_like?</tt>.
  def acts_like_string?
    true
  end
end
