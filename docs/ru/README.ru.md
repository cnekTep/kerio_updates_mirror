<div align="center">

# Kerio updates mirror

### Локальное зеркало обновлений Kerio Control и Kerio Connect.

[English](../../README.md) · **Русский**
</div>

## Disclaimer

Тестирование работоспособности проводилось на следующих версиях ПО:

- **Ubuntu**: 24.04.1
- **Kerio Connect**: 10.0.6.8504
- **Kerio Control**: 9.4.5.8526

## Установка и использование

### Установка Docker и Docker Compose

Для работы требуется Docker и Docker Compose. Установите их, следуя инструкциям:

1. Установите дополнительные пакеты:
    ```bash
    sudo apt install curl software-properties-common ca-certificates apt-transport-https -y
    ```
2. Импортируйте GPG-ключ Docker:
    ```bash
    wget -O- https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor | sudo tee /etc/apt/keyrings/docker.gpg > /dev/null
    ```
3. Добавьте репозиторий Docker:
    ```bash
    echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu noble stable"| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    ```
4. Обновите индекс пакетов:
    ```bash
    sudo apt update
    ```
5. Установите Docker:
    ```bash
    sudo apt install docker-ce -y
    ```
6. Установите Docker Compose:
    ```bash
    sudo apt install docker-compose -y
    ```

### Запуск зеркала из готовых Docker-образов

1. [Скачайте Docker-образы.](https://t.me/my_store_files_bot?start=kerio_updates_mirror)
2. Загрузите образы из архивов:
    ```bash
    sudo docker load -i tor_v1.1.2.tar
    ```
   ```bash
   sudo docker load -i mirrorkc_v1.2.1.tar
   ```
3. Скачайте репозиторий и запустите ```docker-compose```:
    ```bash
    sudo docker-compose up -d
    ```

### Запуск зеркала из исходного кода

1. Скачайте репозиторий.
2. Запустите ```docker-compose```:
   ```bash
    sudo docker-compose up -d
    ```

### Обновление Kerio Connect при помощи зеркала обновлений

[Документация по настройке](./kerio_connect.md)

- Антивирус будет обновляться автоматически и будет работать anti-spam.

### Обновление Kerio Control при помощи зеркала обновлений

[Документация по настройке](./kerio_control.md)

- Антивирус будет обновляться автоматически.
- Скачивание новых BlockList's (Предотвращение вторжения) происходит автоматически (примерно каждые 8 часов).

### Дополнительно

- Мосты для соединения с TOR, находятся в файле: ```_tor/config/bridges.config```.
    - Если в файле docker-compose.yml установлен параметр ```USE_CHECK_TOR=true```, то будет выполняться фоновая
      проверка доступности сети Internet через TOR, и в случае недоступности TOR-мосты будут обновляться автоматически.
    - Получить новые мосты можно на [официальном сайте](https://bridges.torproject.org) или
      через [Telegram-бота](https://t.me/GetBridgesBot).
- Посмотреть логи и установить дополнительные настройки: ```http://IP_СЕРВЕРА_KERIO_CONNECT:9980/logsmkc.php```