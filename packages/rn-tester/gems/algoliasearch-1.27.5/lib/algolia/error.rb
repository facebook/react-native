module Algolia

  # Base exception class for errors thrown by the Algolia
  # client library. AlgoliaError will be raised by any
  # network operation if Algolia.init() has not been called.
  class AlgoliaError < StandardError #Exception ... why? A:http://www.skorks.com/2009/09/ruby-exceptions-and-exception-handling/
  end

  # An exception class raised when the REST API returns an error.
  # The error code and message will be parsed out of the HTTP response,
  # which is also included in the response attribute.
  class AlgoliaProtocolError < AlgoliaError
    attr_accessor :code
    attr_accessor :message

    def initialize(code, message)
      self.code = code
      self.message = message
      super("#{self.code}: #{self.message}")
    end
  end

  # An exception class raised when the given object was not found.
  class AlgoliaObjectNotFoundError < AlgoliaError
  end

  # An exception class raised when the validUntil parameter is not found
  class ValidUntilNotFoundError < AlgoliaError
  end

end
