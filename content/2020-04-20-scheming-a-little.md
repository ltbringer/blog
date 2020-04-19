---
date: 2020-04-2020
title: "Thread Communication simulation"
cover: "https://unsplash.it/1152/300/?random?BirchintheRoses"
categories:
    - programming
tags:
    - scala
    - parallel
---

# Setup
Let's say we have: 

1. A buffer of limited size.
2. A couple of producers.
3. A couple of consumers.

What happens when producers try to fill the buffer while consumers are simultaneously trying to read the buffer. We want to understand `deadlocks`, `livelocks` and what should be done for a normal operation.

<iframe height="900px" width="100%" src="https://repl.it/@amreshvenugopal/DemandingQuestionablePhp?lite=true" scrolling="no" frameborder="no" allowtransparency="true" allowfullscreen="true" sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals"></iframe>

The detail is in the wait over `while(buffer.isEmpty)` in the implementation of `Consumer` so if the current `thread` is active, and `buffer` is not empty, only then is a `consumer` allowed to read off the `buffer`.
