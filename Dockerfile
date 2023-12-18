FROM kong/kong-gateway:3.3.1.0
USER root
RUN apt-get update \
    && apt-get install --yes nodejs \
    && apt-get install --yes npm \
    && npm install -g kong-pdk
COPY /plugins /usr/local/kong/js-plugins
WORKDIR /usr/local/kong/js-plugins
RUN npm install