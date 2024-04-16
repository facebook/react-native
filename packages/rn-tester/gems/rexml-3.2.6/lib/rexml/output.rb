# frozen_string_literal: false
require_relative 'encoding'

module REXML
  class Output
    include Encoding

    attr_reader :encoding

    def initialize real_IO, encd="iso-8859-1"
      @output = real_IO
      self.encoding = encd

      @to_utf = encoding != 'UTF-8'

      if encoding == "UTF-16"
        @output << "\ufeff".encode("UTF-16BE")
        self.encoding = "UTF-16BE"
      end
    end

    def <<( content )
      @output << (@to_utf ? self.encode(content) : content)
    end

    def to_s
      "Output[#{encoding}]"
    end
  end
end
