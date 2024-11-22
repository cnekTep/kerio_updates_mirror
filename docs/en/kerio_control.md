# Configuring Kerio Control updates via local mirror

## 1. Configuring the Kerio Connect Server
To make the update mirror work correctly, you need to perform several steps on the Kerio Connect server.

* ### Adding rules to iptables

To redirect traffic to a Docker container with a local update mirror, add the following rules to iptables:

1. Redirecting traffic from port 443 to the mirror address:
   ```bash
   sudo iptables -t nat -A PREROUTING -p tcp -d <IP_KERIO_CONTROL> --dport 443 -j DNAT --to-destination 172.222.0.10:443
   ```

2. Allowing traffic from the Kerio Control server to the mirror:
    ```bash
   sudo iptables -A FORWARD -p tcp -s <IP_KERIO_CONTROL> -d 172.222.0.10 --dport 443 -j ACCEPT
   ```

> Such pairs of rules should be added for each Kerio Control server that will use the local update mirror.

* ### Saving rules after reboot

To ensure that the added iptables rules do not disappear after reboot, install and configure the iptables-persistent package:

- Installing the package:
   ```bash
   sudo apt install iptables-persistent -y
   ```

- If the package is already installed, update the current rules:
    ```bash
   sudo dpkg-reconfigure iptables-persistent
   ```

## 2. Configuring Kerio Control Server
Configure the Kerio Control server to use a local update mirror.

* ### Adding update hosts to local DNS

To properly route update requests, add the following entries to the local DNS configuration (Configuration → DNS → Local DNS lookup):

| IP-address   | Host names              | Description |
|--------------|-------------------------|-------------|
| 172.222.0.10 | bdupdate.kerio.com      | mkc         |
| 172.222.0.10 | wf-activation.kerio.com | mkc         |
| 172.222.0.10 | prod-update.kerio.com   | mkc         |
| 172.222.0.10 | ids-update.kerio.com    | mkc         |


* ### Adding a static route

To ensure communication with the update mirror, add a static route to the routing table (Configuration → Routing Table → Static routes):

| Parameter  | Value                      |
|------------|----------------------------|
| Route name | mkc                        |
| Network    | 172.222.0.10               |
| Mask       | 255.255.255.255            |
| Interface  | <select_LAN_interface>     |
| Gateway    | <IP_address_Kerio_Connect> |
| Metric     | 1                          |
