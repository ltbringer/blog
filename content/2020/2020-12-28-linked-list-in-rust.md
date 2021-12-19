---
date: 2020-12-28
title: "Building a linked list in rust"
cover: "https://picsum.photos/seed/seed_n/1500/300"
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

Additionally, the compiler also suggests use of `Box<Node>` instead of `Node`. But what's a `Box`?

> A pointer type for heap allocation.
> [[source](https://doc.rust-lang.org/std/boxed/struct.Box.html)]

Let's try initializing nodes and assign the second node as the next of the previous.

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

Running

```shell
cargo build
./target/debug/rust_tutorial
```

_hmm..._ We are not passing our `Node` instances to functions yet, I anticipate the [`Ownership`](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html) of nodes would cause the compiler to complain once we start creating, updating, deleting nodes.

We'll now try creating nodes by implementing a `new` method on the `Node` and add another node by implementing and using an `add` method.

```rust
// Somewhere within src/main.rs

#[derive(Debug)]
struct Node {
    value: u32,
    next: Option<Box<Node>>,
}

impl Node {
    fn add(&mut self, node: Node) {
        self.next = Some(Box::new(node));
    }

    fn new(value: u32) -> Node {
        Node { value, next: None }
    }
}

fn main() {
    let mut root = Node::new(1);
    root.add(Node::new(2));
    println!("{:?}", root);
}

// prints: Node { value: 1, next: Some(Node { value: 2, next: None }) }
```

It doesn't seem that bad? There was a minor gotcha though. Try to spot the difference.

```rust
// returns Node
fn new(value: u32) -> Node {
    Node { value, next: None }
}

// returns ()
fn new(value: u32) -> Node {
    Node { value, next: None };
}
```

Luckily, the rust compiler warned me well in advance so I could squint and figure it out without having to google. Alternatively, `return Node { ... }` works fine too.

The `add(...)` method:

- Requires a mutable reference to root.
- Sets the `next` property to a given `Optional<Box<Node>>`.

---

Let's try to add a bunch of new items next.

```rust
#[derive(Debug)]
struct Node {
    value: u32,
    next: Option<Box<Node>>,
}

impl Node {
    fn add(&mut self, node: Node) {
        self.next = Some(Box::new(node));
    }

    fn new(value: u32) -> Node {
        Node { value, next: None }
    }
}

fn main() {
    let mut root = Node::new(1);

    for number in 1..5 {
        root.add(Node::new(number));
    }
    println!("{:?}", root);
}

// prints: Node { value: 1, next: Some(Node { value: 4, next: None }) }
```

Welp that was bad! We added all the items to the root, effectively replacing everything!

```rust
impl Node {
  fn add(&mut self, node: Node) {
    let node_ = Box::new(node);
    let mut node_added = false;
    let mut next_node = &mut self.next;

    while let Some(older_node) = &mut next_node { #
      println!("An older node - {:?}", older_node);

      node_added = match older_node.next {
        None => {
          older_node.next = Some(node_.clone());
          true
        }
        _ => {
          next_node = older_node.next; # expected mutable reference found Option
          false
        }
      };
    }

    println!("Node added - {}", node_added);

    if !node_added {
      self.next = Some(node_.clone());
    }
  }
```

The `add(...)` implementation is painful here, because of the error in the comments.

```rust
next_node = &mut older_node.next; # cannot assign to next_node because it is borrowed
```

So we can't use the same reference for navigating and writing.

```rust
#[derive(Debug)]
struct Node<'a> {
  value: u32,
  next: Option<&'a mut Box<Node<'a>>>,
}

impl<'a> Node<'a> {
  fn new(value: u32) -> Node<'a> {
    Node { value, next: None }
  }
}

#[derive(Debug)]
struct LinkedList<'a> {
  root: Option<&'a mut Box<Node<'a>>>,
}

impl<'a> LinkedList<'a> {
  fn new(node: Option<&'a mut Box<Node<'a>>>) -> LinkedList<'a> {
    LinkedList { root: node }
  }

  fn push(&mut self, node: Option<&'a mut Box<Node<'a>>>) {
    let maybe_node = &mut self.root;

    loop {
      match maybe_node {
        Some(tail_node) => {
          if tail_node.next.is_none() {
            tail_node.next = node;
            *maybe_node = node;
            break;
          }
        }
        _ => (),
      }
    }
  }
}

fn main() {
  let mut node = Node::new(0);
  let mut boxed_node = Box::new(node);
  let mut linked_list = LinkedList::new(Some(&mut boxed_node));

  for number in 1..5 {
    node = Node::new(number);
    linked_list.push(Some(Box::new(node)));
  }
  println!("{:?}", linked_list);
}
```

After a long day of struggle, I have an implementation that doesn't compile. The reasons are pointers; the way I have used them in c++ are not identical in their usage over here in Rust.

I went over to stackoverflow to get some [help](https://stackoverflow.com/questions/65493710/how-does-ownership-of-variables-work-between-iterations/65495662?noredirect=1#comment115794305_65495662). That didn't quite work as expected. The answer submitted also doesn't compile.

> "I am trying to learn rust and thought of implementing a linked list as a practice problem" you fell victim to one of the classic blunders. The most famous is never create a self-referencing data structure, but only sightly less well known this: [never think linked lists are a beginner-level data structure in rust](https://rust-unofficial.github.io/too-many-lists/). – Masklinn

☝️ Is one of the comments on the question.

I was suggested to take a look at [`RC`](https://doc.rust-lang.org/std/rc/struct.Rc.html). Overall it was disappointing to not be able to do something.

I tried to come up with some simpler plans and found a nice set of repositories to try out in a separate session:

1. [Rustlings](https://github.com/rust-lang/rustlings)
2. [24 days of rust](https://siciarz.net/tag/24%20days%20of%20rust/)
3. [Create a language in Rust](https://createlang.rs/)
4. [PNGme: An Intermediate Rust Project](https://picklenerd.github.io/pngme_book/)
5. [Rust Gym](https://github.com/warycat/rustgym)

I believe creating a language requries a more time than I currently have, other items seem to be relatively easier.
