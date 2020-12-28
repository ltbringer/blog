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

Hmm.. okay let's try some code.

```rust
// Somewhere within src/main.rs

struct Node {
    value: u32,
    next: Option<Box<Node>>,
}

fn main() {
    let mut node1 = Node {
        value: 1,
        next: None,
    };

    let node2 = Node {
        value: 2,
        next: None,
    };

    node1.next = Some(Box::new(node2));

    println!("{:?}", node1);
}
```

The `next` property on `Node` contains an `Optional` `Box` of `Node` type. We use `Option` because initially a list would have only one item and that means the `next` property
should point to nothing. `Option<T>` type means either expect type `T` or `None`.

We create `node1` and `node2`, initialize their `next` to `None` for starters, and then

```rust
    node1.next = Some(Box::new(node2));
```

- `Some(...)` is a way to offer a value when `Option<T>` is expected.
- `Box::new(...)` allocates memory in the heap for `node2`.
- `node2` looks like `{ value: 2, next: None }`, nothing special.

_hmm..._ We are not passing our `Node` instances to functions yet, I anticipate the [`Ownership`](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html) of nodes would cause the compiler to complain once we start creating, updating, deleting nodes.
