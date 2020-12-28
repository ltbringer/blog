---
date: 2020-12-28
title: "Building a linked list in rust"
cover: "https://unsplash.it/1152/300/?random?BirchintheRoses"
categories:
  - experiments
tags:
  - programming
---

I got myself a copy of [Rust in Action](https://www.manning.com/books/rust-in-action?query=rust%20in%20action), it has been a nice read so far. I have followed the amazing [rust-lang book](https://doc.rust-lang.org/book/) as well but I still got [Rust in Action](https://www.manning.com/books/rust-in-action?query=rust%20in%20action) since the table of contents seemed interesting.

```
1 Introducing Rust
2 Language Foundations
3 Compound Data Types
4 Lifetimes, Ownership and Borrowing
5 Data in Depth
6 Memory
7 Files & Storage
8 Networking
9 Time and Time Keeping
10 Processes, Threads and Containers
11 Kernel
12 Signals, Interrupts and Exceptions
```

I had a hard time wrapping my head around the Ownership concept. So I gave that a peek and found this (section: 4.3 - What is an Owner? Does it Have any Responsibilities?):

> An implication of this system is that values may not outlive their owner. This kind of situation can make data structures built with references, such as trees and graphs, feel slightly bureaucratic. If the root node of a tree is the owner of the whole tree, it can’t be removed without taking ownership into account.

I remember trying a linked-list implementation and move semantics not working out for me.

To give you a taste, this fairly simple definition of a Node is not safe.

```rust
struct Node {
    value: u32,
    next: Node,
}

fn main() {
    println!("Let's build a linked list!");
}
```

The compiler says:

> Recursive type `Node` has infinite type.

Additionally, the compiler also suggests use of `Box<Node>` instead of `Node`. Ok? but what's a `Box`?

> A pointer type for heap allocation.
>
> - [source](https://doc.rust-lang.org/std/boxed/struct.Box.html)
