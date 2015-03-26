#!/usr/bin/env ruby

def cp(src, dest, app_name)
  if File.directory?(src)
    Dir.mkdir(dest) unless Dir.exists?(dest)
  else
    content = File.read(src)
      .gsub("SampleApp", app_name)
      .gsub("Examples/#{app_name}/", "")
      .gsub("../../Libraries/", "node_modules/react-native/Libraries/")
      .gsub("../../React/", "node_modules/react-native/React/")
    File.write(dest, content)
  end
end

def main(dest, app_name)
  source = File.expand_path("../Examples/SampleApp", __FILE__)
  files = Dir.chdir(source) { Dir["**/*"] }
    .reject { |file| file["project.xcworkspace"] || file["xcuserdata"] }
    .each { |file|
      new_file = file.gsub("SampleApp", app_name)
      cp File.join(source, file), File.join(dest, new_file), app_name
    }
end

if ARGV.count == 0
  puts "Usage: #{__FILE__} <ProjectNameInCamelCase>"
  puts ""
  puts "This script will bootstrap new React Native app in current folder"
else
  app_name = ARGV.first
  dest = Dir.pwd
  puts "Setting up new React Native app in #{dest}"
  puts ""

  main(dest, app_name)

  puts "Next steps:"
  puts ""
  puts "   Open #{File.join(dest, app_name)}.xcodeproj in Xcode"
  puts "   Hit Run button"
  puts ""
end

