module GhInspector
  class ExceptionHound
    attr_accessor :message

    def initialize(error)
      self.message = find_message error
    end

    def find_message(error)
      error.to_s
    end

    def query
      undefined
      simple_nil
      demangle_instances

      message
    end

    private

    def undefined
      self.message = message.gsub "undefined local variable or method", "undefined"
    end

    def simple_nil
      self.message = message.gsub "nil:NilClass", "nil"
    end

    def demangle_instances
      self.message = regex_replace(message, /(#<.*>)/, /#<(.*):/)
    end

    def regex_replace(string, find, replace)
      if string.match find
        full = string.match(find)[0]
        simple = string.match(replace)[1]
        string.gsub full, simple
      else
        string
      end
    end
  end
end
