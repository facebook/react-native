class MemoryCache
  attr_reader :memory

  def initialize
    @memory = {}
  end

  def get(request)
    memory[request]
  end

  def set(request, response)
    memory[request] = response
  end
end
