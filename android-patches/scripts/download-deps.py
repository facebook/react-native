from bs4 import BeautifulSoup
import os
import re
import shlex
import shutil
from subprocess import Popen, PIPE
import sys
import wget
import urllib2
import glob


if len(sys.argv) != 2:
    print "Please provide RN repo path as argument"
    sys.exit()

root_dir = sys.argv[1]
dependency_dir = os.path.join(root_dir, "android_dependencies_downloaded2")
dependency_list_file_path = os.path.join(
    root_dir, "gradle_dependency_list.txt"
    )
# maven_repo_url = "http://central.maven.org/maven2/"
maven_repo_url = "https://repo1.maven.org/maven2/"
# desired_ndk = "androidndk.12.2.0"
desired_sdk = "androidsdk.29.0.1"
# desired_jdk = "jdk.1.8.2"


def create_folder(folder_path):
    """Create folder if it does not exist

        Parameters
        ----------
        folder_path : str
            folder path to be checked
    """
    if not os.path.exists(folder_path):
        print('Trying to create ' + folder_path)
        os.makedirs(folder_path)


def set_env_variables():
    """
    Sets the NDK, SDK, JAVA_HOME, ANDROID_HOME vars
    if they are not set
   """
    if 'NugetMachineInstallRoot' not in os.environ:
        print "Nuget cache not defined, do you have an office enlistment in this machine?"
        sys.exit()

    nugetcache_path = os.environ['NugetMachineInstallRoot']
    # desired_ndk_path = os.path.join(nugetcache_path, desired_ndk)
    # desired_sdk_path = os.path.join(nugetcache_path, desired_sdk)
    # desired_jdk_path = os.path.join(nugetcache_path, desired_jdk, "x64")#
    
    #set_env_variable("ANDROID_NDK", desired_ndk_path)
    #set_env_variable("ANDOIRD_SDK", desired_sdk_path)
    #set_env_variable("ANDROID_HOME", desired_sdk_path)
    #set_env_variable("JAVA_HOME", desired_jdk_path)

    set_env_variable("ANDROID_NDK", "E:\\devtools\\android-ndk-r17c")
    set_env_variable("ANDOIRD_SDK", "D:\\nugetcache\\androidsdk.29.0.1")
    set_env_variable("ANDROID_HOME", "D:\\nugetcache\\androidsdk.29.0.1")
    set_env_variable("JAVA_HOME", "D:\\nugetcache\\jdk.1.8.3\\x64")


def set_env_variable(key, value):
    """Set env variable given key and value
            Parameters
            -------------
            key : str
                    enivronment key name
            value : str
                    desired value for key
    """
    os.environ[key] = value


def list_dependencies():
    """ Write all gradle dependencies to file
    """
    os.chdir(root_dir)

# Note: Likely we need a union of releaseCompileClasspath & releaseRuntimeClasspath & debugCompileClasspath & debugRuntimeClasspath
    gradle_command = "gradlew.bat ReactAndroid:dependencies --configuration releaseCompileClasspath"
    gradle_command = gradle_command + " > " + \
        "\"" + dependency_list_file_path + "\""
    command_args = shlex.split(gradle_command)
    process = Popen(command_args, stdout=PIPE)
    (output, err) = process.communicate()
    exit_code = process.wait()


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

    dependency_regex = "\S+:\S+:\S+"
    omit_dependency_delim = "(*)"
    for line in infile:
        if line.endswith(omit_dependency_delim):
            continue

        regex_matches = re.search(dependency_regex, line)
        if regex_matches != None:
            dependency = regex_matches.group(0)
            if dependency not in dependency_list:
                dependency_list.append(dependency)

    return dependency_list


def create_dependency_folder_structure(dependency):
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

    parent_dir = dependency_dir
    for folder in folder_chain:
        child_dir = os.path.join(parent_dir, folder)
        create_folder(child_dir)
        parent_dir = child_dir

    return parent_dir


def download_dependencies(dependency_list):
    """Creates the directory structure 
       and downloads the maven dependecies
       and saves it in the same format

       Parameters
       -----------
            dependency_list : list
                    list of dependencies in maven format
    """
    for dependency in dependency_list:
        download_dir = create_dependency_folder_structure(dependency)
        relative_dir = os.path.relpath(download_dir, dependency_dir)
        relative_url = relative_dir.replace("\\", "/")
        download_url = maven_repo_url + relative_url

        group_id, artifact, version = dependency.split(":")
        file_type = artifact + "-" + version + "."
        dependency_pom_path = os.path.join(download_dir, file_type + "pom")

        try:
            html_source = urllib2.urlopen(download_url).read()
        except:
            print "[ERROR downloading ] " + download_url
            print "Attempting to pull from local sdk"
            copy_deps_from_local_sdk(download_dir, relative_dir)
            dependency_list.extend(
                get_parent_node_dep_list_from_pom(dependency_pom_path)
            )
            continue

        soup = BeautifulSoup(html_source, "html.parser")
        for link in soup.find_all('a'):
            if file_type in link['href']:
                file_name = link['href']
                if not os.path.exists(os.path.join(download_dir, file_name)):
                    wget.download(download_url + "/" + file_name, download_dir)
                    print "Downloaded " + file_name

        dependency_list.extend(
            get_parent_node_dep_list_from_pom(dependency_pom_path)
        )


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
    	print "POM file " + pom_file_path + " does not exist"
    	print "Continuing..."
    	return []
    pom_file_content = open(pom_file_path, "r").read()
    soup = BeautifulSoup(pom_file_content, "html.parser")
    parents = soup.find_all("parent")

    parent_dependency_list = []
    for parent in parents:
        groupId = artifactId = version = ""
        if (parent.find("groupid") is None or
                parent.find("artifactid") is None or
                parent.find("version") is None):
            continue
        groupId = parent.find("groupid").text
        artifactId = parent.find("artifactid").text
        version = parent.find("version").text
        parent_dependency_list.append(":".join([groupId, artifactId, version]))

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

    nugetcache_path = os.environ['NugetMachineInstallRoot']
    if not os.path.exists(nugetcache_path):
        print "Nuget cache does not exist. Continuing."
        return
    desired_sdk_path = os.path.join(nugetcache_path, desired_sdk)
    if not os.path.exists(desired_sdk_path):
        print "Desired android sdk " + desired_sdk + " not found in nuget cache. Continuing."
        return

    source_dir = os.path.join(
        desired_sdk_path, "extras", "android", "m2repository")
    source_dir = os.path.join(source_dir, relative_dir)
    if not os.path.exists(source_dir):
        print "Dependecy not present in nuget cache android sdk. Continuing."
        return

    src_files = os.listdir(source_dir)
    for file_name in src_files:
        src_file = os.path.join(source_dir, file_name)
        if os.path.isfile(src_file):
            if not os.path.exists(os.path.join(target_dir, file_name)):
                shutil.copy(src_file, target_dir)
                print "Copied file : " + file_name
            else:
                print file_name + " already present"


def parse_and_download_dependencies(filepath):
    """ Parse and download gradle dependencies

            Parameters
            -----------
            filepath : str
                    file containing gradle dependency list
    """
    dependency_list = parse_dependencies(filepath)
    download_dependencies(dependency_list)


def main():
    create_folder(dependency_dir)
    set_env_variables()
    list_dependencies()
    parse_and_download_dependencies(dependency_list_file_path)

if __name__ == '__main__':
    main()
