module Concurrent

  # Various classes within allows for +nil+ values to be stored,
  # so a special +NULL+ token is required to indicate the "nil-ness".
  # @!visibility private
  NULL = ::Object.new

end
