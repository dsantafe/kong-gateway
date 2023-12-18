# [Install Kong Gateway on Docker](https://docs.konghq.com/gateway/latest/install/docker/)
## Prepare the database

1. Create a custom Docker network to allow the containers to discover and communicate with each other:
```shell
docker network create kong-net
```
You can name this network anything you want. We use kong-net as an example throughout this guide.

2. Start a PostgreSQL container:
```shell
docker run -d --name kong-database \
  --network=kong-net \
  -p 5432:5432 \
  -e "POSTGRES_USER=kong" \
  -e "POSTGRES_DB=kong" \
  -e "POSTGRES_PASSWORD=kongpass" \
  postgres:13
```

3. Prepare the Kong database:
```shell
docker run --rm --network=kong-net \
 -e "KONG_DATABASE=postgres" \
 -e "KONG_PG_HOST=kong-database" \
 -e "KONG_PG_PASSWORD=kongpass" \
 -e "KONG_PASSWORD=test" \
kong/kong-gateway:3.3.1.0 kong migrations bootstrap
```

4. Run the following command to start a container with Kong Gateway:
```shell
docker run -d --name kong-gateway \
 --network=kong-net \
 -e "KONG_DATABASE=postgres" \
 -e "KONG_PG_HOST=kong-database" \
 -e "KONG_PG_USER=kong" \
 -e "KONG_PG_PASSWORD=kongpass" \
 -e "KONG_PROXY_ACCESS_LOG=logs/access.log" \
 -e "KONG_ADMIN_ACCESS_LOG=logs/access.log" \
 -e "KONG_PROXY_ERROR_LOG=logs/error.log" \
 -e "KONG_ADMIN_ERROR_LOG=logs/error.log" \
 -e "KONG_ADMIN_LISTEN=0.0.0.0:8001" \
 -e "KONG_ADMIN_GUI_URL=http://localhost:8002" \
 -p 8000:8000 \
 -p 8443:8443 \
 -p 8001:8001 \
 -p 8444:8444 \
 -p 8002:8002 \
 -p 8445:8445 \
 -p 8003:8003 \
 -p 8004:8004 \
 kong/kong-gateway:3.3.0.0
```

5. Verify your installation:
Access the /services endpoint using the Admin API:
```shell
curl -i -X GET --url http://localhost:8001/services
```
You should receive a 200 status code.

6. Verify that Kong Manager is running by accessing it using the URL specified in KONG_ADMIN_GUI_URL:
```shell
http://localhost:8002
```

7. Install a client to connect PostgreSQL container
```shell
docker run -d --name pgadmin4 \
  --network=kong-net \
  -p 8080:80 \
  -e 'PGADMIN_DEFAULT_EMAIL=admin@admin.com' \
  -e 'PGADMIN_DEFAULT_PASSWORD=Qwer1234!' \
  -d dpage/pgadmin4
```

------

# Build your own Docker images (Ubuntu)

1. Create a Dockerfile, Build your image:
```shell
docker build -t kong-gateway .
```

## Kong in Docker Compose
Kong Gateway can be deployed in different ways. This Docker Compose file provides support for running Kong

```shell
$ docker compose -p kong-gateway --env-file .env.dev up -d
```

------

# Enable the Plugin
- [Plugins in Other Languages Javascript](https://docs.konghq.com/gateway/latest/plugin-development/pluginserver/javascript/)
- [Building a Kong Gateway Plugin with JavaScript](https://konghq.com/blog/kong-gateway-plugin-javascript)
```shell
git clone https://github.com/Kong/docker-kong-js-pdk
cd kong-js-pdk-dev
docker-compose build
```

## 1. Create a Service
```shell
curl -X POST \
--url "http://localhost:8001/services" \
--data "name=example-service" \
--data "url=https://mockbin.org"
```
As our file name was clacks.js, our plugin will be called clacks. Let’s enable the plugin in the definition now:

## 2. Create a Route
```shell
curl -X POST \
--url "http://localhost:8001/services/example-service/routes" \
--data "name=example-service" \
--data "paths[]=/"
```

## 3. Adding clacks Plugin
```shell
curl -X POST \
--url http://localhost:8001/services/example-service/plugins/ \
--data "name=clacks"
```

The docker-compose.yml file forwards the API gateway port to our local machine. That means we can make requests to localhost:8000 to test our service.
```shell
curl -I localhost:8000
```

------

# [Basic Authentication](https://docs.konghq.com/hub/kong-inc/basic-auth/)

## 1. Create a Consumer
You need to associate a credential to an existing Consumer object. To create a Consumer, you can execute the following request:
```shell
curl -X POST \
--url "http://localhost:8001/consumers/" \
--data "username=demo"
```

## 2. Create a Credential
```shell
curl -X POST \
--url http://localhost:8001/consumers/demo/basic-auth \
--data "username=demo@gmail.com" \
--data "password=7ca86aef7868477"
```

## 3. Securing resources in Kong, Adding basic-auth plugin in Kong
### 3.1. Create a Service
```shell
curl -X POST \
--url http://localhost:8001/services \
--data "name=someresource-v1" \
--data "url=https://basicauth-az204.azurewebsites.net/WeatherForecast"
```

### 3.2. Create a Route
```shell
curl -X POST \
--url http://localhost:8001/services/someresource-v1/routes \
--data "name=someresource-v1" \
--data "paths[]=/api/v1/someresource"
```

### 3.3. Adding basic-auth plugin
```shell
curl -X POST \
--url http://localhost:8001/services/someresource-v1/plugins \
--data "name=basic-auth"  \
--data "config.hide_credentials=false"
```

### 3.4. BasicAuth.WebApi
- [Source](https://github.com/dsantafe/BasicAuth)
- [Swagger](https://basicauth-az204.azurewebsites.net/swagger)

```shell
curl -X 'POST' \
  'https://basicauth-az204.azurewebsites.net/api/Users/Create' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "displayName": "demo",
  "userName": "c0de77dd-adc7-4a25-ad0d-d89b4a69ca00",
  "email": "demo@gmail.com",
  "password": "7ca86aef7868477",
  "createdDate": "2023-07-14T03:10:55.705Z"
}'
```

### 3.5. Consume Service
http://localhost:8000/api/v1/someresource (GET)
- Authorization: Basic ZGVtb0BnbWFpbC5jb206N2NhODZhZWY3ODY4NDc3
- Username: demo@gmail.com
- Password: 7ca86aef7868477

------

# [OAuth 2.0 Authentication](https://docs.konghq.com/hub/kong-inc/oauth2/)

A Consumer can have many credentials.
## 1. Create an Application
Then you can finally provision new OAuth 2.0 credentials (also called “OAuth applications”) by making the following HTTP request:
```shell
curl -X POST \
--url "http://localhost:8001/consumers/demo/oauth2/" \
--data "name=demo|oauth2" \
--data "client_id=demo@gmail.com" \
--data "client_secret=7ca86aef7868477" \
--data "hash_secret=true"
```

# OAuth 2.0 Flows
## 1. Create a Service
Define a service object in kong and use your api server as upstream.
```shell
curl -X POST \
--url "http://localhost:8001/services" \
--data "name=oauth2" \
--data "url=https://docs.konghq.com/"
```

## 2. Create a Route
Next we will create a path /oauth2/token to access our service.
```shell
curl -X POST \
--url "http://localhost:8001/services/oauth2/routes" \
--data "name=oauth2" \
--data "paths[]=/oauth2/token"
```

## 3. Enable Oauth2 Plugin
This plugin will be enabled on the service and I am also using my own provision_key . If you don’t define this parameter, kong will generate one for you. I am also enabling all 4 grants for the demonstration purposes. You should only enable the grant that you will use.
```shell
curl -X POST \
--url "http://localhost:8001/services/oauth2/plugins/" \
--data "name=oauth2" \
--data "config.scopes[]=all" \
--data "config.mandatory_scope=true" \
--data "config.provision_key=bBEouj1MfVo5kvpPWDxGPTafXE6cL9O6" \
--data "config.enable_client_credentials=true" \
--data "config.global_credentials=true"
```

##  4. Securing resources in Kong, Adding oauth2 plugin in Kong
### 4.1. Create a Service
```shell
curl -X POST \
--url http://localhost:8001/services \
--data "name=someresource-v2" \
--data "url=https://basicauth-az204.azurewebsites.net/WeatherForecast"
```

### 4.2. Create a Route
```shell
curl -X POST \
--url http://localhost:8001/services/someresource-v2/routes \
--data "name=someresource-v2" \
--data "paths[]=/api/v2/someresource"
```

### 4.3. Adding oauth2 plugin
```shell
curl -X POST \
--url http://localhost:8001/services/someresource-v2/plugins/ \
--data "name=oauth2" \
--data "config.scopes[]=all" \
--data "config.mandatory_scope=true" \
--data "config.provision_key=bBEouj1MfVo5kvpPWDxGPTafXE6cL9O6" \
--data "config.enable_client_credentials=true" \
--data "config.global_credentials=true"
```

### 4.4. Adding transform-token-to-basic plugin
```shell
curl -X POST \
--url http://localhost:8001/services/someresource-v2/plugins \
--data "name=transform-token-to-basic" \
--data "config.db_name=kong" \
--data "config.db_host=kong-database" \
--data "config.db_username=kong" \
--data "config.db_password=kongpass" \
--data "config.db_port=5432"
```

### 4.5. Adding record to consumer_info table for credential transformation 
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; // PostgreSQL UUID
INSERT INTO public.consumers_info(id, consumer_id, api_user, api_password)
VALUES (uuid_generate_v1(), 
		(SELECT id FROM public.consumers WHERE username = 'demo'), 
		'demo@gmail.com', 
		encode('7ca86aef7868477'::bytea, 'base64')); // Postgresql base64 encode
```

### 4.6. Consume Service
https://localhost:8443/oauth2/token (POST)
```json
Request: 
{
    "grant_type": "client_credentials",
    "client_id": "demo@gmail.com",
    "client_secret": "7ca86aef7868477",
    "scope": "all"
}
Response:
{
    "expires_in": 7200,
    "token_type": "bearer",
    "access_token": "6dO9boggYaBK4EvqekH1ZVGFfaAIWQ1D"
}
```

http://localhost:8000/api/v2/someresource (GET)
- Authorization: Bearer 6dO9boggYaBK4EvqekH1ZVGFfaAIWQ1D

------

# [Upgrade Kong Gateway 3.x.x](https://docs.konghq.com/gateway/latest/upgrade/)
## Migration steps
Upgrade to major, minor, and patch Kong Gateway releases using the `kong migrations` commands.

The following steps guide you through the migration process.
```shell
kong migrations up [-c configuration_file]
kong migrations finish [-c configuration_file]
```

Run the following command
```shell
docker run --rm \
-e "KONG_DATABASE=postgres" \
-e "KONG_PG_HOST=kong-database" \
-e "KONG_PG_USER=kong" \
-e "KONG_PG_PASSWORD=kongpass" \
-e "KONG_PG_PORT=5432" \
-e "KONG_PG_DATABASE=kong" \
#-e "KONG_PG_SSL=true" \
kong/kong-gateway:3.3.1.0 kong migrations up [-c configuration_file]

docker run --rm \
-e "KONG_DATABASE=postgres" \
-e "KONG_PG_HOST=kong-database" \
-e "KONG_PG_USER=kong" \
-e "KONG_PG_PASSWORD=kongpass" \
-e "KONG_PG_PORT=5432" \
-e "KONG_PG_DATABASE=kong" \
#-e "KONG_PG_SSL=true" \
kong/kong-gateway:3.3.1.0 kong migrations finish [-c configuration_file]
```