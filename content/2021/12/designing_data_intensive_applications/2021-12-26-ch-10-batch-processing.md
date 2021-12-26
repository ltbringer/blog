---
date: 2021-12-26
title: "Ch-10 Batch Processing With Unix Tools Part 2"
cover: "https://picsum.photos/seed/seed_n/1500/300"
categories:
    - readings
tags:
    - engineering
    - designing-data-intensive-applications
---

## Reducing side-joins and grouping

In a relational database setting data is usually normalized for faster queries. It is common for a record to have references to other records.
Coalescing such data is usually achieved by the means of a `JOIN` operation. Another alternative is to denormalize data. 

It can be expected that a database query is indexed, reducing the time it takes to fetch the records. MapReduce jobs don't have a concept of indexing.
This leads to a full table-scan a very costly operation. 

We see a common pattern in data processing:

| entity |  id |            log           |
|:------:|:---:|:------------------------:|
| user   | 105 |      clicked button      |
| user   | 296 |   viewed profile of 134  |
| user   | 105 | login via email campaign |
| user   | 101 |     changed settings     |
| user   | 800 |   searched for keyword   |
| ...    | ... |           ...            |

| user_id |      email      | date-of-birth |
|:-------:|:---------------:|:-------------:|
| 101     | beth@foo.com    |   1991-05-12  |
| 105     | opa@kor.ea      |   1998-10-11  |
| 296     | singh@bar.co.in |   1995-03-23  |
| 800     | potato@onion.gg |   1971-08-07  |
|  ...    |      ...        |       ...     |


To aggregate records we would have to perform a join on the `user_id` field. Joining one by one would reduce the throughput, 
cache efficiency would depend on data distribution, running a large number of these queries in parallel would overwhelm the database.

- To achieve a good throughput the computation should be local to a machine.
- We don't want to query a remote database since the results would be non-deterministic in that case.
- We copy the database (a backup).
- Load it in a distributed file system like HDFS.
- Use `MapReduce` to aggregate the data.