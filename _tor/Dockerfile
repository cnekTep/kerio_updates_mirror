# set alpine as the base image of the Dockerfile
FROM alpine:latest

# update the package repository, install Privoxy, Tor and Lyrebird
RUN apk --no-cache --update --upgrade add privoxy tor  lyrebird --repository=https://dl-cdn.alpinelinux.org/alpine/edge/testing

# start Tor and Privoxy
CMD tor & privoxy --no-daemon /etc/privoxy/config