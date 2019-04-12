# abb-speedtest

A CLI tool for running https://speed.aussiebroadband.com.au  in a headless environment

Chrome is required as a main dependencie as I'm using [puppeteer-core](https://github.com/GoogleChrome/puppeteer) and it requires it preinstalled.


**Setup**

Clone & Install dependencies
```
git clone https://github.com/lukealford/abb-speedtest-cli.git
npm install -g
```


## Basic usage

Run using `abb-speedtest`


```
-----------Results-----------
Date: 4/12/2019 6:10:06 pm
Server Melbourne
Ping 29 ms
Jitter 4 ms
Download 47.5 Mbps
Upload 17.5 Mbps
-----------------------------

```

## Options


```
Usage: abb-speedtest [options]

Runs a speedtest using speed.aussiebroadband.com.au

Options:
  -V, --version            output the version number
  -j, --json [optional]    return json
  -c, --csv [optional]     return csv format
  -s, --save [optional]    saves format to user\Documents\abb-speedtests
  -o, --output [optional]  overwrites output location
  -h, --help               output usage information

```


### Dependencies

```json

    "chrome-launcher": "^0.10.5",
    "commander": "^2.20.0",
    "puppeteer-core": "^1.14.0",
    "request": "^2.88.0",
    "store": "^2.0.12"

```
