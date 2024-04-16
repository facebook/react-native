require 'fileutils'
Dir['test*.rb'].each do |f|
  n = File.basename(f, '.rb')
  n.sub! 'test_', ''
  n += '_spec.rb'
  puts f
  puts n
  FileUtils.cp f, n
end
