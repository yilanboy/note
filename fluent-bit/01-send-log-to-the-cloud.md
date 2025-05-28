---
layout: default
parent: Fluent Bit
nav_order: 1
---

# Send Your Container Log to the Cloud

## Background

In cloud network generation 2, we use Docker to run the FRRouting service.

That comes with a problem:

**If VM crash, we lose all the logs**.

## How to Send Logs to the Cloud?

- Docker can use different type of logging driver, default is `json-file`.

  ```bash
  # Check the default logging driver
  docker info --format '{{.LoggingDriver}}'
  ```

- Except `json-file`, Docker also support `awslogs`, `fluentd`, `journald`, `syslog`, etc.

- Based on `syslog` driver, we can use Fluent Bit to send logs to the cloud.

## What is Fluent Bit?

Fluent Bit is a lightweight and high-performance log processor and forwarder.

## Data Pipeline

Fluent Bit has multiple plugins, including **input**, **output**, **parser**,and **filter** plugins.

A input plugin collects logs from a source, and then sends them to an output plugin. This process is called a **pipeline**.

## Input Plugins

One of the most important features of Fluent Bit is its input plugins.

Fluent Bit can collect logs from different sources, such as:

- Syslog
- Files
- HTTP
- And 40 more...

## Syslog Input Plugin

Fluent Bit can collect logs from syslog.

```yaml
pipeline:
  inputs:
    - name: syslog
      mode: udp # use UDP can decouple log driver and others container
      listen: 0.0.0.0
      port: 5140
      parser: logfmt # Syslog must be specify a parser
      buffer_chunk_size: 1M
      buffer_max_size: 6M
      tag: docker-syslog-driver
```

## Parsers Plugins

Fluent Bit can parse logs from different formats.

There is no built-in parser for FRRouting logs, but we can use the `regex` parser to parse the logs.

```text
[PARSER]
    Name frr
    Format regex
    Regex (?<time>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) (?<log>.*)
    Time_Key time
    Time_Format %Y/%m/%d %H:%M:%S
```

## Output Plugins

Fluent Bit can send logs to different destinations, such as:

- AWS S3
- Azure Storage Account
- Elasticsearch
- And 40 more...

## S3 Output Plugin

Fluent Bit can send logs to AWS S3.

```yaml
outputs:
  - name: s3
    match: "*" # All inputs will be sent to S3
    bucket: log-collection
    region: us-west-2
    total_file_size: 1M
    upload_timeout: 1m
    s3_key_format: /${HOSTNAME}/$TAG/%Y/%m/%d/%H-%M-%S-$UUID.json
    s3_key_format_tag_delimiters: .-
```

## Demo

- Send docker logs to AWS S3
- Send docker logs to Azure Storage Account
  - How to customize the path on Azure Storage Account
