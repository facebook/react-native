from bs4 import BeautifulSoup
import os
import re
import shlex
import shutil
from subprocess import Popen, PIPE, STDOUT
import sys
import wget
from urllib.request import urlopen
import glob
import zipfile
import time
import sys      
import logging
import xml.etree.ElementTree as ET
import json

# Note: This list of repo needs to be kept current manually.
maven_repos = ["https://repo1.maven.org/maven2/", "https://jcenter.bintray.com/"]

desired_sdk = os.getenv("ANDROID_SDK_ROOT")
if not desired_sdk:
    logging.error("Envrionment variable ANDROID_SDK_ROOT must be set.")
    exit(-1)

if os.getenv("ANDROID_NDK"):
    desired_ndk = os.getenv("ANDROID_NDK")
elif os.path.exists(os.path.join(desired_sdk, "ndk-bundle")):
    desired_ndk = os.path.join(desired_sdk, "ndk-bundle")
elif os.path.exists(os.path.join(desired_sdk, "ndk")):
    desired_ndk = os.path.join(desired_sdk, "ndk")
else:
    logging.error("Envrionment variable ANDROID_NDK must be set.")
    exit(-1)

desired_jdk = os.getenv("JAVA_HOME")
if not desired_jdk:  
    logging.error("Envrionment variable JAVA_HOME must be set.")
    exit(-1)


def create_folder(folder_path):
    """Create folder if it does not exist

        Parameters
        ----------
        folder_path : str
            folder path to be checked
    """
    if not os.path.exists(folder_path):
        try:
            os.makedirs(folder_path)
        except Exception as inst:
            logging.error("Error while creating directory: " + inst)

def list_dependencies(react_native_dir, output_file_path):
    """ Write all gradle dependencies to file
    """
    os.chdir(react_native_dir)
    env = dict(os.environ)
    env['ANDROID_SDK_ROOT']=desired_sdk
    env['ANDROID_NDK']=desired_ndk
    env['JAVA_HOME']=desired_jdk

    logging.debug("desired_jdk:" + desired_jdk)
    
    gradle_command = "./gradlew :ReactAndroid:dependencies --configuration api"
    with open(output_file_path, "w+") as output_file:
        try:
            process = Popen(shlex.split(gradle_command), stdout=output_file, stderr=PIPE, env=env)
            output, err = process.communicate()
            if err:
                logging.error("Dependency enumeration failed !")
                logging.error(err)
                exit(1)
            exit_code = process.wait()
            if exit_code < 0:
                logging.error("Dependency enumeration failed with error code: " + exit_code + " !")
                exit(1)
        except Exception as e:
            logging.error("Dependency enumeration failed with exception: " + str(e))
            exit(1)
    

def parse_dependencies(filepath):
    """ Parse gradle dependencies and return list

            Parameters
            -----------
            filepath : str
                    file containing gradle dependency list

            Returns
            -----------
            dependency_list : list
                    list of dependecies in maven format
    """
    infile = open(filepath, "r")
    dependency_list = []

    dependency_regex = "[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+"
    omit_dependency_delim = "(*)"
    for line in infile:
        if line.endswith(omit_dependency_delim):
            continue

        regex_matches = re.search(dependency_regex, line)
        if regex_matches != None:
            dependency = regex_matches.group(0)
            if dependency not in dependency_list:
                dependency_list.append(dependency)
            logging.info("Identified library: " + line)
        else:
            logging.info("Ignored entry: " + line)

    return dependency_list


def create_dependency_folder_structure(dependency_dir_maven, dependency):
    """ Takes dependency in maven format and creates 
            folder structure required for download.
            Returns the path where it should be downloaded
            Parameters
            ----------
            dependency : str
                    name in maven format
            Returns
            ----------
            path : str
                    folder depth path where dependencies 
                    will be downloaded
    """
    group_id, artifact, version = dependency.split(":")

    folder_chain = []
    for group in group_id.split("."):
        folder_chain.append(group)

    folder_chain.append(artifact)
    folder_chain.append(version)

    parent_dir = dependency_dir_maven
    for folder in folder_chain:
        child_dir = os.path.join(parent_dir, folder)
        create_folder(child_dir)
        parent_dir = child_dir

    return parent_dir


def try_download_dependency(download_dir, relative_url, file_type, dependency, repo_url):
    logging.debug("Attempting to download " + dependency)
    download_url = repo_url + relative_url
    
    try:
        html_source = urlopen(download_url).read()
        soup = BeautifulSoup(html_source, "html.parser")
        for link in soup.find_all('a'):
            if file_type in link['href']:
                file_name = link['href']
                if not os.path.exists(os.path.join(download_dir, file_name)):
                    wget.download(download_url + "/" + file_name, download_dir)
                    logging.info("Downloaded " + file_name)
                
        return True # either the file exists (previously downloaded) or the download succeeded (i.e. without exception).

    except Exception as inst:
        logging.info("Exception while downloading: " + str(inst))
        return False

    return False

def get_office_platform(platform):
    switcher = {'arm64-v8a':'droidarm64', 'armeabi-v7a':'droidarm', 'x86':'droidx86','x86_64':'droidx64'}
    return switcher.get(platform,"")

def extract_so(original_file_root, native_dir, original_file_name):
    logging.info("Attempting to extract native libraries from " + original_file_name)
    archive_filename_without_ext, archive_file_extension = os.path.splitext(original_file_name)
    original_file_path = os.path.join(original_file_root, original_file_name)
    zip_filepath = os.path.join(original_file_root, original_file_name + ".zip")
    shutil.move(original_file_path, zip_filepath)

    # Extract the archive
    with zipfile.ZipFile(zip_filepath) as zip_file:
        zip_target_folder = os.path.join(original_file_root, archive_filename_without_ext)
        zip_file.extractall(zip_target_folder)
                
    # Extract native libraries.
    for candidate_so_root, dirsi, candidate_so_files in os.walk(zip_target_folder):
                    for candidate_so_file in candidate_so_files:
                        if candidate_so_file.endswith(".so"):
                            logging.info("Found native library " + candidate_so_file)
                            so_path = os.path.join(candidate_so_root, candidate_so_file)
                            
                            lib_platform = os.path.basename(candidate_so_root)
                            lib_office_platform = get_office_platform(lib_platform)
                            if not lib_office_platform:
                                logging.error("Invalid platform for native library: " + candidate_so_file)
                                exit(1)

                            so_target_dir = os.path.join(native_dir, lib_office_platform)
                            create_folder(so_target_dir)
                            shutil.move(so_path, so_target_dir)

    # Re-zip back to original file name.
    new_zip_filepath = os.path.join(original_file_root, archive_filename_without_ext + "_rezipped.zip")
    with zipfile.ZipFile(new_zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for rootz, dirsz, filesz in os.walk(zip_target_folder):
            for filez in filesz:
                dest_path = os.path.join(rootz, filez)
                # rel_path = os.path.relpath(dest_path, os.path.join(zip_target_folder, '..'))
                rel_path = os.path.relpath(dest_path, zip_target_folder)
                zip_file.write(dest_path, rel_path)

    # Rename the rezipped file to original file name.
    shutil.move(new_zip_filepath, os.path.join(original_file_root, original_file_name))
    
    # Remove the originally renamed archive and extracted folder.
    shutil.rmtree(zip_target_folder)
    os.remove(zip_filepath)

def extract_sos(maven_dir, native_dir):
    logging.debug("Attempting to extract native libraries")

    for original_file_root, dirs, original_files in os.walk(maven_dir):
        for original_file_name in original_files:
            archive_filename_without_ext, archive_file_extension = os.path.splitext(original_file_name)
            if(archive_file_extension in ['.jar', '.aar']):
                extract_so(original_file_root, native_dir, original_file_name)



def download_dependencies(dependency_dir_maven, dependency_list):
    """Creates the directory structure 
       and downloads the maven dependecies
       and saves it in the same format

       Parameters
       -----------
            dependency_list : list
                    list of dependencies in maven format
    """
    parent_list = []
    for dependency in dependency_list:
        download_dir = create_dependency_folder_structure(dependency_dir_maven, dependency)
        relative_dir = os.path.relpath(download_dir, dependency_dir_maven)
        relative_url = relative_dir.replace("\\", "/")

        group_id, artifact, version = dependency.split(":")
        file_type = artifact + "-" + version + "."
        dependency_pom_path = os.path.join(download_dir, file_type + "pom")

        succeeded = False
        for repo_url in maven_repos:
            succeeded = try_download_dependency(download_dir, relative_url, file_type, dependency, repo_url)
            if (succeeded):
                break
        
        if not succeeded:
            logging.error("[ERROR downloading ] " + relative_url + " from the listed maven repos.")
            logging.error("Attempting to pull from local sdk")
            succeeded = copy_deps_from_local_sdk(download_dir, relative_dir)    

        if not succeeded:
            logging.error("[Failed to download ] " + dependency)
        else:
            additional_dependency_list = get_dependency_node_dep_list_from_pom(dependency_pom_path)
            for additional_dependency in additional_dependency_list:
                if (additional_dependency not in dependency_list):
                    dependency_list.append(additional_dependency)

            parent_dependency_list = get_parent_node_dep_list_from_pom(dependency_pom_path)
            for parent_dependency in parent_dependency_list:
                if ((parent_dependency not in parent_list) and (parent_dependency not in dependency_list)):
                    parent_list.append(parent_dependency)

    for dependency in parent_list:
        download_dir = create_dependency_folder_structure(dependency_dir_maven, dependency)
        relative_dir = os.path.relpath(download_dir, dependency_dir_maven)
        relative_url = relative_dir.replace("\\", "/")

        group_id, artifact, version = dependency.split(":")
        file_type = artifact + "-" + version + "."
        dependency_pom_path = os.path.join(download_dir, file_type + "pom")

        succeeded = False
        for repo_url in maven_repos:
            succeeded = try_download_dependency(download_dir, relative_url, file_type, dependency, repo_url)
            if (succeeded):
                break
        
        if not succeeded:
            logging.error("[ERROR downloading ] " + relative_url + " from the listed maven repos.")
            logging.error("Attempting to pull from local sdk")
            succeeded = copy_deps_from_local_sdk(download_dir, relative_dir)    

        if not succeeded:
            logging.error("[Failed to download ] " + dependency)

        # Don't recurse down for parent dependencies

def get_dependency_node_dep_list_from_pom(pom_file_path):
    """Reads a pom file and gets parent node deps.
            Parent node deps are not resolved by gradle deps,
            hence resolving them as well.
            Parameters
            ---------------
            pom_file_path : str
                    pom file to be parsed
            Returns
            --------------
                    parent_dependency_list : list
                            List of parent node dependencies 
    """
    namespace = "http://maven.apache.org/POM/4.0.0"

    if not os.path.exists(pom_file_path):
    	logging.info("POM file " + pom_file_path + " does not exist")
    	logging.info("Continuing...")
    	return []

    dependency_dependency_list = []
    tree = ET.parse(pom_file_path)
    for dependency in tree.getroot().findall('.//{http://maven.apache.org/POM/4.0.0}dependency'):
        groupId = dependency.find('.//{http://maven.apache.org/POM/4.0.0}groupId')
        artifactId = dependency.find('.//{http://maven.apache.org/POM/4.0.0}artifactId')
        version = dependency.find('.//{http://maven.apache.org/POM/4.0.0}version')
        scope = dependency.find('.//{http://maven.apache.org/POM/4.0.0}scope')
        
        if groupId is None or artifactId is None or version is None:
            break

        if(scope is None or scope.text in ['compile', 'runtime']):
            if scope is not None:
                logging.info("[" + scope.text + "]")
            logging.info(groupId.text + ":" + artifactId.text + ":" + version.text)
            dependency_dependency_list.append(":".join([groupId.text, artifactId.text, version.text]))

    return dependency_dependency_list



def get_parent_node_dep_list_from_pom(pom_file_path):
    """Reads a pom file and gets parent node deps.
            Parent node deps are not resolved by gradle deps,
            hence resolving them as well.
            Parameters
            ---------------
            pom_file_path : str
                    pom file to be parsed
            Returns
            --------------
                    parent_dependency_list : list
                            List of parent node dependencies 
    """
    namespace = "http://maven.apache.org/POM/4.0.0"

    if not os.path.exists(pom_file_path):
    	logging.info("POM file " + pom_file_path + " does not exist")
    	logging.info("Continuing...")
    	return []

    parent_dependency_list = []
    tree = ET.parse(pom_file_path)
    # TODO: Share code with last block
    for dependency in tree.getroot().findall('.//{http://maven.apache.org/POM/4.0.0}parent'):
        groupId = dependency.find('.//{http://maven.apache.org/POM/4.0.0}groupId')
        artifactId = dependency.find('.//{http://maven.apache.org/POM/4.0.0}artifactId')
        version = dependency.find('.//{http://maven.apache.org/POM/4.0.0}version')
        scope = dependency.find('.//{http://maven.apache.org/POM/4.0.0}scope')
        
        if groupId is None or artifactId is None or version is None:
            break

        if(scope is None or scope.text in ['compile', 'runtime']):
            if scope is not None:
                logging.info("[" + scope.text + "]")
            logging.info(groupId.text + ":" + artifactId.text + ":" + version.text)
            parent_dependency_list.append(":".join([groupId.text, artifactId.text, version.text]))

    # pom_file_content = open(pom_file_path, "r").read()
    # soup = BeautifulSoup(pom_file_content, "html.parser")
    # parents = soup.find_all("parent")

    # parent_dependency_list = []
    # for parent in parents:
    #     groupId = artifactId = version = ""
    #     if (parent.find("groupid") is None or
    #             parent.find("artifactid") is None or
    #             parent.find("version") is None):
    #         continue
    #     groupId = parent.find("groupid").text
    #     artifactId = parent.find("artifactid").text
    #     version = parent.find("version").text
    #     parent_dependency_list.append(":".join([groupId, artifactId, version]))

    return parent_dependency_list


def copy_deps_from_local_sdk(target_dir, relative_dir):
    """ Copies dependency files from nuget cache sdk
            to target directory in this case download dependency directory
            Parameters
            --------------
            target_dir : str
                    directory created for download of dependency
            relative_dir : str
                    maven directory structure of dependency
    """

#    nugetcache_path = os.environ['NugetMachineInstallRoot']
#    if not os.path.exists(nugetcache_path):
#        logging.info("Nuget cache does not exist. Continuing.")
#        return False

#    desired_sdk_path = os.path.join(nugetcache_path, desired_sdk)
#    if not os.path.exists(desired_sdk_path):
#        logging.info("Desired android sdk " + desired_sdk + " not found in nuget cache. Continuing.")
#        return False

    source_dir = os.path.join(
        desired_sdk, "extras", "android", "m2repository")
    source_dir = os.path.join(source_dir, relative_dir)
    if not os.path.exists(source_dir):
        logging.info("Dependecy not present in nuget cache android sdk. Continuing.")
        return False

    src_files = os.listdir(source_dir)
    for file_name in src_files:
        src_file = os.path.join(source_dir, file_name)
        if os.path.isfile(src_file):
            if not os.path.exists(os.path.join(target_dir, file_name)):
                shutil.copy(src_file, target_dir)
                logging.info("Copied file : " + file_name)
            else:
                logging.info(file_name + " already present")
            return True
        
    return False


def parse_and_download_dependencies(dependency_dir_maven, dependency_list_filepath):
    """ Parse and download gradle dependencies

            Parameters
            -----------
            filepath : str
                    file containing gradle dependency list
    """
    dependency_list = parse_dependencies(dependency_list_filepath)
    download_dependencies(dependency_dir_maven, dependency_list)

def ensure_output_dir(output_dir_path):
    # Move out if already exists.
    if os.path.exists(output_dir_path):
        logging.debug(output_dir_path + " exists ! Trying to move it.")
        output_dir_path_copy = output_dir_path + '-' + time.strftime("%Y%m%d-%H%M%S")
        shutil.move(output_dir_path, output_dir_path_copy )

    # If it still exists, fail the execution.
    if os.path.exists(output_dir_path):
        logging.error("Unable to cleanup existing dependency directory: " + output_dir_path)
        logging.error("Move it away manually and rerun the script.")   
        exit(1)

    # Create a fresh directory for output.
    create_folder(output_dir_path)

def main():
    if len(sys.argv) == 2:
        react_native_dir = sys.argv[1]
    else:
        react_native_dir = os.getcwd()

    # Some smoke checks to ensure that we have a valid react-native checkout.
    packageJsonFile = os.path.join(react_native_dir, "package.json")
    with open(packageJsonFile) as packageJsonText:
        packageJson = json.load(packageJsonText)
        if(packageJson[u'name'] != u'react-native' and packageJson[u'name'] != u'react-native-macos'):
            logging.info("Not a valid RN repo path!")
            exit(-1)

    if (not os.path.join(react_native_dir, "ReactAndroid", "build.gradle")):
        logging.info("Not a valid RN repo path!")
        exit(-1)
   
    dependency_dir_root = os.path.join(react_native_dir, "android", "dependencies")
    dependency_dir_maven = os.path.join(dependency_dir_root, "cross", "cross", "x-none", "maven")
    dependency_dir_native = dependency_dir_root
    dependency_dir_hermes = os.path.join(dependency_dir_root, "hermes")
    dependency_list_file_path = os.path.join(dependency_dir_root, "gradle_dependencies.txt")
    log_file_path = os.path.join(react_native_dir, "android", "log_" + time.strftime("%Y%m%d-%H%M%S") + ".txt" )

    if(not os.path.exists(os.path.join(react_native_dir, "android"))):
        os.mkdir(os.path.join(react_native_dir, "android"))

    logging.basicConfig(level = logging.DEBUG, filename = log_file_path)
    logging.info("react_native_dir: " + react_native_dir)
    logging.info("Maven dependency path: " + dependency_dir_maven)
    logging.info("Native dependency path: " + dependency_dir_native)
    logging.info("Dependency list file path: " + dependency_list_file_path)

    # Ensure we have an output directory
    ensure_output_dir(dependency_dir_root)  
    
    # List gradle dependencies to file.
    list_dependencies(react_native_dir, dependency_list_file_path)
    
    # download dependencies to maven root
    parse_and_download_dependencies(dependency_dir_maven, dependency_list_file_path)

    # Extract the native libraries from maven packages
    extract_sos(dependency_dir_maven, dependency_dir_native)

    # Copy and extract hermes.
    dependency_dir_hermes_android_aar_path = os.path.join(dependency_dir_hermes, "android")
    hermes_engine_node_modules_path = os.path.join(react_native_dir, "node_modules", "hermes-engine")
    shutil.copytree(os.path.join(hermes_engine_node_modules_path, "android"), dependency_dir_hermes_android_aar_path)
    shutil.copytree(os.path.join(hermes_engine_node_modules_path, "linux64-bin"), os.path.join(dependency_dir_hermes, "linux64-bin"))
    shutil.copytree(os.path.join(hermes_engine_node_modules_path, "win64-bin"), os.path.join(dependency_dir_hermes, "win64-bin"))
    shutil.copytree(os.path.join(hermes_engine_node_modules_path, "osx-bin"), os.path.join(dependency_dir_hermes, "osx-bin"))
    shutil.copy(os.path.join(hermes_engine_node_modules_path, "package.json"), dependency_dir_hermes)

    dependency_dir_hermes_android_native_debug = os.path.join(dependency_dir_hermes_android_aar_path, "debug")
    dependency_dir_hermes_android_native_release = os.path.join(dependency_dir_hermes_android_aar_path, "ship")
    extract_so(dependency_dir_hermes_android_aar_path, dependency_dir_hermes_android_native_debug, "hermes-debug.aar")
    extract_so(dependency_dir_hermes_android_aar_path, dependency_dir_hermes_android_native_debug, "hermes-cppruntime-debug.aar")

    extract_so(dependency_dir_hermes_android_aar_path, dependency_dir_hermes_android_native_release, "hermes-release.aar")
    extract_so(dependency_dir_hermes_android_aar_path, dependency_dir_hermes_android_native_release, "hermes-cppruntime-release.aar")
 
    # Copy log file into the dependency root folder.
    shutil.copy(log_file_path, os.path.join(dependency_dir_root))

    with open(log_file_path, "r") as fin:
        print(fin.read())

if __name__ == '__main__':
    main()
