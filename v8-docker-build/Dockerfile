############################################################
# Dockerfile to build V8  container images
# Based on Ubuntu
############################################################
# Set the base image to Ubuntu
FROM mcr.microsoft.com/mirror/docker/library/ubuntu:22.04
# File Author / Maintainer
MAINTAINER Example prmis@microsoft.com
################## BEGIN INSTALLATION ######################
# Update Image 
RUN apt-get update
RUN apt-get install -y sudo 
RUN apt-get install -y apt-utils 
RUN useradd -m docker && echo "docker:docker" | chpasswd && adduser docker sudo
RUN echo "docker ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
user docker
# Update depedency of V8 
RUN sudo apt-get install -y \
				lsb-core \
				git \
				python \
				lbzip2 \
				curl 	\
				wget	\
				xz-utils \
				zip
RUN sudo echo ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true | sudo debconf-set-selections
WORKDIR /home/docker
# Get depot_tool
RUN git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
ENV PATH /home/docker/depot_tools:"$PATH"
RUN echo $PATH
# Fetch V8 code 
RUN fetch v8
RUN echo "target_os= ['android']">>.gclient
RUN gclient sync
RUN sudo echo ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true | sudo debconf-set-selections
# Update V8 depedency
RUN echo y | sudo /home/docker/v8/build/install-build-deps-android.sh
WORKDIR /home/docker/v8
ARG CACHEBUST=1
# checkour required V8 Branch
RUN git checkout -b 6.7.1
RUN gclient sync
#ARG CACHEBUST=1
# Generate arguments  for specific platform 
RUN python ./tools/dev/v8gen.py arm.release -vv
RUN rm  out.gn/arm.release/args.gn
# Copy arguments  file based on user input file  
COPY ./args_arm.gn out.gn/arm.release/args.gn
RUN cp -rf out.gn/arm.release out.gn/x86.release
RUN rm  out.gn/x86.release/args.gn
COPY ./args_x86.gn out.gn/x86.release/args.gn
# Display final argument for build  
RUN ls -al out.gn/arm.release/
RUN ls -al out.gn/x86.release/
RUN cat out.gn/arm.release/args.gn
RUN cat out.gn/x86.release/args.gn
RUN sudo chmod 777 out.gn/arm.release/args.gn
RUN touch out.gn/arm.release/args.gn
RUN sudo chmod 777 out.gn/x86.release/args.gn
RUN touch out.gn/x86.release/args.gn
# Build the V8 liblary  
RUN ninja -C out.gn/arm.release -t clean 
RUN ninja -C out.gn/arm.release
RUN ninja -C out.gn/x86.release -t clean 
RUN ninja -C out.gn/x86.release  
# Copy and prepare zip file of include and build so files 
RUN rm -rf target
RUN mkdir -p target
RUN mkdir -p target/arm
RUN mkdir -p target/x86
RUN ls -al out.gn/arm.release
RUN cp -rf out.gn/arm.release/*.so ./target/arm
RUN cp -rf out.gn/x86.release/*.so ./target/x86
RUN cp -rf include ./target
RUN zip -r v8.zip target
RUN ls -al /home/docker/v8/v8.zip
#End of docker Command








