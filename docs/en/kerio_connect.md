# Configuring Kerio Connect updates via local mirror

In the Kerio Connect mail server settings, set an intermediate HTTP server (
```Configuration → Advanced Options → HTTP Proxy```):

### Configuration for a Linux server with Kerio Connect installed and Docker containers hosted on the same server

If the server is running Linux and Kerio Connect and Docker containers are running at the same time on it, then you should use the following parameters:

```
- Address: 172.222.0.5
- Port: 8118
```

### Configuration for a Windows server or a distributed environment using Kerio Connect and Docker containers hosted on separate servers

If the server is running Windows or uses a distributed infrastructure (Kerio Connect and Docker containers are hosted on different servers):

> In the docker-compose.yml file, uncomment the lines responsible for forwarding port 8118.

```
- Address: <IP_address_server_with_Docker_containers>
- Port: 8118
```