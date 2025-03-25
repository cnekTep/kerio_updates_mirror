<div align="center">

# Kerio updates mirror

### Local updates mirror for Kerio Control and Kerio Connect.

**English** · [Русский](./docs/ru/README.ru.md)
</div>

## Disclaimer

Performance testing was carried out on the following software versions:

- **Ubuntu**: 24.04.1
- **Kerio Connect**: 10.0.6.8504
- **Kerio Control**: 9.4.5.8526

## Installation and usage

### Installing Docker and Docker Compose

Docker and Docker Compose are required for work. Install them following the instructions:

1. Install additional packages:
    ```bash
    sudo apt install curl software-properties-common ca-certificates apt-transport-https -y
    ```
2. Import the Docker GPG key:
    ```bash
    wget -O- https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor | sudo tee /etc/apt/keyrings/docker.gpg > /dev/null
    ```
3. Add a Docker repository:
    ```bash
    echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu noble stable"| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    ```
4. Update the package index:
    ```bash
    sudo apt update
    ```
5. Install Docker:
    ```bash
    sudo apt install docker-ce -y
    ```
6. Install Docker Compose:
    ```bash
    sudo apt install docker-compose -y
    ```

### Launching a mirror from ready-made Docker images

1. [Download Docker images.](https://t.me/my_store_files_bot?start=kerio_updates_mirror)
2. Download images from the archives:
    ```bash
    sudo docker load -i tor_v1.1.2.tar
    ```
   ```bash
   sudo docker load -i mirrorkc_v1.2.1.tar
   ```
3. Download the repository and run ```docker-compose```:
    ```bash
    sudo docker-compose up -d
    ```

### Launching a mirror from source code

1. Download the repository.
2. Run ```docker-compose```:
   ```bash
    sudo docker-compose up -d
    ```

### Updating Kerio Connect using the update mirror

[Configuration Guide](docs/en/kerio_connect.md)

- Antivirus will be updated automatically and anti-spam will work.

### Updating Kerio Control using the update mirror

[Configuration Guide](docs/en/kerio_control.md)

- The antivirus will be updated automatically.
- New BlockList's (Intrusion Prevention) are downloaded automatically (approximately every 8 hours).

### Additionally

- Bridges for connecting to TOR are in the file: ```_tor/config/bridges.config```.
    - If the ```USE_CHECK_TOR=true``` parameter is set in the docker-compose.yml file, then a background check of
      Internet availability via TOR will be performed, and in case of unavailability, TOR bridges will be updated
      automatically.
    - You can get new bridges on the [official website](https://bridges.torproject.org) or via
      a [Telegram bot](https://t.me/GetBridgesBot).
- View logs and set additional settings: ```http://IP_SERVER_KERIO_CONNECT:9980/logsmkc.php```