# abb-speedtest

A CLI tool for running https://speed.aussiebroadband.com.au  in a headless envoriment


**Setup**

Install dependencies
```
npm install

```


## Basic usage**

Run using `abb-speedtest`


```
-----------Results-----------
Server Melbourne
Ping 29 ms
Jitter 4 ms
Download 47.5 Mbps
Upload 17.5 Mbps
-----------------------------

```

## JSON Output

Use the `-j` flag example `abb-speedtest -j`


```json
{   
    "location": "Melbourne",
    "ping": 26,
    "jitter": 6',
    "download": 47.2,
    "upload": 17.5 
}
```


### Dependencies

```json

    "chrome-launcher": "^0.10.5",
    "commander": "^2.20.0",
    "puppeteer-core": "^1.14.0",
    "request": "^2.88.0",
    "store": "^2.0.12"

```
