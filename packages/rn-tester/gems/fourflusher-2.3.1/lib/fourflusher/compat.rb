module Fourflusher
  class Config
    def self.instance
      @instance || new
    end

    def verbose?
      false
    end
  end

  class Informative < StandardError
  end

  class UI
    def self.indentation_level
      0
    end

    def self.message(message)
      print(message)
    end
  end
end
