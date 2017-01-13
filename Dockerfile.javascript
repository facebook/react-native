FROM library/node:6.9.2

# set default environment variables
ENV YARN_VERSION=0.16.0

# install dependencies
RUN apt-get update && apt-get install ocaml libelf-dev -y

# add code
RUN mkdir /app
ADD . /app
WORKDIR /app

RUN npm install yarn@$YARN_VERSION -g
RUN yarn install --ignore-engines --pure-lockfile

WORKDIR website
RUN yarn install --ignore-engines --ignore-platform --pure-lockfile

WORKDIR /app
