---
layout: default
parent: AWS
nav_order: 2
---

# Egress Only Gateway

Egress only gateway 是 VPC 的一個 component，可以讓 VPC 內的 instance 連線到 internet，但是不允許 internet 連線到 VPC 內的 instance。有點像 NAT gateway。

## 使用 Terraform 建立 Egress Only Gateway

首先建立一個 VPC 與 subnet，這個 VPC 會有一個 ipv6 的 CIDR block。

> AWS 的 ipv6 不提供 private address，所以只能使用 public address。

```hcl
resource "aws_vpc" "main" {
  cidr_block                       = "10.0.0.0/16"
  assign_generated_ipv6_cidr_block = true
  # https://docs.aws.amazon.com/zh_tw/vpc/latest/userguide/vpc-dns.html
  enable_dns_hostnames             = true
  enable_dns_support               = true

  tags = {
    Name = "main"
  }
}

resource "aws_subnet" "egress_only" {
  vpc_id                          = aws_vpc.main.id
  availability_zone               = data.aws_availability_zones.available.names[0]
  cidr_block                      = "10.0.0.0/24"
  ipv6_cidr_block                 = cidrsubnet(aws_vpc.main.ipv6_cidr_block, 8, 1)
  assign_ipv6_address_on_creation = true

  tags = {
    Name = "egress_only"
  }
}
```

Terraform 中的 `cidrsubnet` 函式可以用來計算子網路的 CIDR block，它的定義如下：

```hcl
cidrsubnet(prefix, newbits, netnum)
```

**prefix**: 為符合規範的 CIDR block notation，例如 `10.0.0.0/16`

**newbits**: 增加 mask 的值，假設設定為 8，如果 prefix 的 mask 是 `/16`，那麼計算出來的子網路的 mask 就是 `/24` (16+8)。

**netnum**: 網段的索引，從 0 開始。根據前一個例子，如果設定為 1，那麼計算出來的子網路的 CIDR block 就是 `10.0.1.0/24`，如果設定為 2，那麼計算出來的子網路的 CIDR block 就是 `10.0.2.0/24`。

官方有提供範例，可以自己使用 `terraform console` 測試一下。

```shell
> cidrsubnet("172.16.0.0/12", 4, 2)
172.18.0.0/16
> cidrsubnet("10.1.2.0/24", 4, 15)
10.1.2.240/28
> cidrsubnet("fd00:fd12:3456:7890::/56", 16, 162)
fd00:fd12:3456:7800:a200::/72
```

接下來建立一個 egress only gateway，並且將它綁定到 VPC 上。

```hcl
resource "aws_egress_only_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main"
  }
}
```

建立一個 route table，並且將它與 subnet 綁定。

```hcl
resource "aws_route_table" "egress_only" {
  vpc_id = aws_vpc.main.id

  route {
    ipv6_cidr_block = "::/0"
    gateway_id      = aws_egress_only_internet_gateway.main.id
  }

  tags = {
    Name = "egress_only"
  }
}

resource "aws_route_table_association" "egress_only" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}
```

最後建立一個 instance，並且將它放到 subnet 中。

```hcl
resource "aws_instance" "main" {
  ami                    = "ami-0c55b159cbfafe1f0"
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.egress_only_for_ipv6.id]
  subnet_id              = aws_subnet.main.id

  tags = {
    Name = "main"
  }
}

resource "aws_security_group" "egress_only_for_ipv6" {
  name   = "egress only for ipv6"
  vpc_id = aws_vpc.main.id

  # ipv6 egress
  egress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    ipv6_cidr_blocks = [
      "::/0",
    ]
  }
}
```

## 參考資料

- [Enable outbound IPv6 traffic using an egress-only internet gateway](https://docs.aws.amazon.com/vpc/latest/userguide/egress-only-internet-gateway.html)
- [cidrsubnet Function](https://developer.hashicorp.com/terraform/language/functions/cidrsubnet)
- [小信豬的原始部落 - AWS SOA 學習筆記 - VPC(Virtual Private Cloud)](https://godleon.github.io/blog/AWS/AWS-SOA-VPC/)
