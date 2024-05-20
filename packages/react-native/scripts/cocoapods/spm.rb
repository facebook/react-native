
$rn_spm_dependencies_by_pod = {}

class SPM
  def self.dependency(pod_spec, url:, requirement:,  products:)
    $rn_spm_dependencies_by_pod[pod_spec.name] ||= []
    $rn_spm_dependencies_by_pod[pod_spec.name] << { url: url, requirement: requirement, products: products}
  end

  def self.apply(installer)
    project = installer.pods_project

    log 'Cleaning old SPM dependencies from Pods project'
    clean_spm_dependencies_from_target(project)
    log 'Adding SPM dependencies to Pods project'
    $rn_spm_dependencies_by_pod.each do |pod_name, dependencies|
      dependencies.each do |spm_spec|
        log "Adding SPM dependency on product #{spm_spec[:products]}"
        add_spm_to_target(
          project,
          project.targets.find { |t| t.name == pod_name},
          spm_spec[:url],
          spm_spec[:requirement],
          spm_spec[:products]
        )
        log " Adding workaround for Swift package not found issue"
        target = project.targets.find { |t| t.name == pod_name}
        target.build_configurations.each do |config|
          target.build_settings(config.name)['SWIFT_INCLUDE_PATHS'] ||= ['$(inherited)']
          search_path = '${SYMROOT}/${CONFIGURATION}${EFFECTIVE_PLATFORM_NAME}/'
          unless target.build_settings(config.name)['SWIFT_INCLUDE_PATHS'].include?(search_path)
            target.build_settings(config.name)['SWIFT_INCLUDE_PATHS'].push(search_path)
          end
        end
      end
    end
  end

  private

  def self.log(msg)
    puts "[SPM] #{msg}"
  end

  def self.clean_spm_dependencies_from_target(project)
    project.root_object.package_references.delete_if { |pkg| pkg.class == Xcodeproj::Project::Object::XCRemoteSwiftPackageReference }
  end

  def self.add_spm_to_target(project, target, url, requirement, products)
    pkg_class = Xcodeproj::Project::Object::XCRemoteSwiftPackageReference
    ref_class = Xcodeproj::Project::Object::XCSwiftPackageProductDependency
    pkg = project.root_object.package_references.find { |p| p.class == pkg_class && p.repositoryURL == url }
    if !pkg
      pkg = project.new(pkg_class)
      pkg.repositoryURL = url
      pkg.requirement = requirement
      log(" Requirement: #{requirement}")
      project.root_object.package_references << pkg
    end
    products.each do |product_name|
      ref = target.package_product_dependencies.find do |r| 
        r.class == ref_class && r.package == pkg && r.product_name == product_name 
      end
      next if ref

      log(" Adding product dependency #{product_name} to #{target.name}")
      ref = project.new(ref_class)
      ref.package = pkg
      ref.product_name = product_name
      target.package_product_dependencies << ref
    end
  end
end