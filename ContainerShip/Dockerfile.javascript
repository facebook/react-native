FROM library/node:6.9.2

ENV YARN_VERSION=0.27.5

# install dependencies
RUN apt-get update && apt-get install ocaml libelf-dev -y
RUN npm install yarn@$YARN_VERSION -g

# add code
RUN mkdir /app
ADD . /app

WORKDIR /app
RUN yarn install --ignore-engines

WORKDIR website
RUN yarn install --ignore-engines --ignore-platform

WORKDIR /app
