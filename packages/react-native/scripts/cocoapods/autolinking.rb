# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'
require 'pathname'
require 'cocoapods'
require_relative '../react_native_pods.rb'

# Your project will have to depend on the @react-native-community/cli if you use this method
# for listing React native modules.
def list_native_modules!()
  (cli_bin, status) = Pod::Executable.capture_command("node", ["-p",  "require('@react-native-community/cli').bin"])

  if status.exitstatus > 0
    Pod::UI.warn "Can't find the node dependency '@react-native-community/cli'", [
        "In order to autolink using Cocoapods, this framework uses @react-native-community/cli to discover React Native native modules",
        "Please either add it: yarn add -D @react-native-community/cli or consult your framework's documentation."
    ]
  end

  json = Pod::Executable.execute_command("node", [cli_bin.strip, "config"]).strip
  config = JSON.parse(json)

  # TODO: this is a hack, we're hard coding here.
  project_root = Pathname.new(File.join(config["root"],"ios"))
  packages = config["dependencies"]
  found_pods = []

  packages.each do |package_name, package|
    next unless package_config = package["platforms"]["ios"]

    podspec_path = package_config["podspecPath"]
    configurations = package_config["configurations"]

    # Add a warning to the queue and continue to the next dependency if the podspec_path is nil/empty
    if podspec_path.nil? || podspec_path.empty?
      Pod::UI.warn("list_native_modules! skipped the react-native dependency '#{package["name"]}'. No podspec file was found.",
        [
          "Check to see if there is an updated version that contains the necessary podspec file",
          "Contact the library maintainers or send them a PR to add a podspec. The react-native-webview podspec is a good example of a package.json driven podspec. See https://github.com/react-native-community/react-native-webview/blob/master/react-native-webview.podspec",
          "If necessary, you can disable autolinking for the dependency and link it manually. See https://github.com/react-native-community/cli/blob/main/docs/autolinking.md#how-can-i-disable-autolinking-for-unsupported-library"
        ])
    end
    next if podspec_path.nil? || podspec_path.empty?

    spec = Pod::Specification.from_file(podspec_path)

    # Skip pods that do not support the platform of the current target.
    if platform = current_target_definition.platform
      next unless spec.supported_on_platform?(platform.name)
    else
      # TODO: In a future RN version we should update the Podfile template and
      #       enable this assertion.
      #
      # raise Pod::Informative, "Cannot invoke `!` before defining the supported `platform`"
    end

    podspec_dir_path = Pathname.new(File.dirname(podspec_path))

    relative_path = podspec_dir_path.relative_path_from project_root

    # pod spec.name, :path => relative_path.to_path, :configurations => configurations

    found_pods.push({
      "name": name,
      "path": relative_path.to_path,
      "configurations": configurations
    })
  end

  if found_pods.size > 0
    pods = found_pods.map { |p| p.name }.sort.to_sentence
    Pod::UI.puts "Found #{found_pods.size} #{"module".pluralize(found_pods.size)} for target `#{current_target_definition.name}`"
  end

  absolute_react_native_path = Pathname.new(config["reactNativePath"])

  {
    "ios_packages": found_pods,
    "project_root_path": project_root.to_s,
    "react_native_path": absolute_react_native_path.relative_path_from(project_root).to_s
  }
end

def link_native_modules!(config)
  Pod::UI.puts "link_native_modules! #{config}"

  if !(
    config[:ios_packages].is_a? Array and
    config[:project_root_path].is_a? String and
    config[:react_native_path].is_a? String
  )
    Pod::UI.warn("link_native_modules! has been called with a malformed 'config' parameter",
      [
        "This is the config argument passed: #{config.inspect}",
      ]);
    exit(1)
  end

  project_root = config[:project_root_path]

  packages = config[:ios_packages]
  found_pods = []

  packages.each do |package_name, package|
    next unless package_config = package["platforms"]["ios"]

    podspec_path = package_config["podspecPath"]
    configurations = package_config["configurations"]

    # Add a warning to the queue and continue to the next dependency if the podspec_path is nil/empty
    if podspec_path.nil? || podspec_path.empty?
      Pod::UI.warn("use_native_modules! skipped the react-native dependency '#{package["name"]}'. No podspec file was found.",
        [
          "Check to see if there is an updated version that contains the necessary podspec file",
          "Contact the library maintainers or send them a PR to add a podspec. The react-native-webview podspec is a good example of a package.json driven podspec. See https://github.com/react-native-community/react-native-webview/blob/master/react-native-webview.podspec",
          "If necessary, you can disable autolinking for the dependency and link it manually. See https://github.com/react-native-community/cli/blob/main/docs/autolinking.md#how-can-i-disable-autolinking-for-unsupported-library"
        ])
    end
    next if podspec_path.nil? || podspec_path.empty?

    spec = Pod::Specification.from_file(podspec_path)

    # Skip pods that do not support the platform of the current target.
    if platform = current_target_definition.platform
      next unless spec.supported_on_platform?(platform.name)
    else
      # TODO: In a future RN version we should update the Podfile template and
      #       enable this assertion.
      #
      # raise Pod::Informative, "Cannot invoke `use_native_modules!` before defining the supported `platform`"
    end

    # We want to do a look up inside the current CocoaPods target
    # to see if it's already included, this:
    #   1. Gives you the chance to define it beforehand
    #   2. Ensures CocoaPods won't explode if it's included twice
    #
    this_target = current_target_definition
    existing_deps = current_target_definition.dependencies

    # Skip dependencies that the user already activated themselves.
    next if existing_deps.find do |existing_dep|
      existing_dep.name.split('/').first == spec.name
    end

    podspec_dir_path = Pathname.new(File.dirname(podspec_path))

    relative_path = podspec_dir_path.relative_path_from project_root
    pod spec.name, :path => relative_path.to_path, :configurations => configurations
    if package_config["scriptPhases"] && !this_target.abstract?
      # Can be either an object, or an array of objects
      Array(package_config["scriptPhases"]).each do |phase|
        # see https://www.rubydoc.info/gems/cocoapods-core/Pod/Podfile/DSL#script_phase-instance_method
        # for the full object keys
        Pod::UI.puts "Adding a custom script phase for Pod #{spec.name}: #{phase["name"] || 'No name specified.'}"

        # Support passing in a path relative to the root of the package
        if phase["path"]
          phase["script"] = File.read(File.expand_path(phase["path"], package["root"]))
          phase.delete("path")
        end

        # Support converting the execution position into a symbol
        if phase["execution_position"]
          phase["execution_position"] = phase["execution_position"].to_sym
        end

        phase = Hash[phase.map { |k, v| [k.to_sym, v] }]
        script_phase phase
      end
    end

    found_pods.push spec
  end

  if found_pods.size > 0
    pods = found_pods.map { |p| p.name }.sort.to_sentence
    Pod::UI.puts "Auto-linking React Native #{"module".pluralize(found_pods.size)} for target `#{current_target_definition.name}`: #{pods}"
  end

  absolute_react_native_path = Pathname.new(config[:react_native_path]).realpath

  { :reactNativePath => absolute_react_native_path.relative_path_from(project_root).to_s }
end

# Legacy interface. Your project will have to depend on the @react-native-community/cli.
def use_native_modules!()
  link_native_modules! list_native_modules!()
end
