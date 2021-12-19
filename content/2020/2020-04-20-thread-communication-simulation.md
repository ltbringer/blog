---
date: 2020-04-20
title: "Thread Communication simulation"
cover: "https://picsum.photos/seed/seed_n/1500/300"
categories:
    - programming
tags:
    - scala
    - parallel
---
Let's say we have: 

1. A buffer of limited size.
2. A couple of producers.
3. A couple of consumers.

What happens when producers try to fill the buffer while consumers are simultaneously trying to read the buffer. We want to understand `deadlocks`, `livelocks` and what should be done for a normal operation.

```scala
/**  main.scala **/
import scala.collection.mutable
import scala.util.Random

object Main extends App {
   class Consumer(id: Int, buffer: mutable.Queue[Int]) extends Thread {
    /**
     * Since Thread already has access to Runnable
     * We can override run.
     */
    override def run(): Unit = {
      val random = new Random()
      while(true) {
        buffer.synchronized {
          while (buffer.isEmpty) {
            println(s"[consumer:$id] buffer empty | waiting.")
            buffer.wait()
          }
          val x = buffer.dequeue()
          println(s"[consumer:$id] picked $x from the buffer")
          buffer.notify()
        }
        Thread.sleep(random.nextInt(250))
      }
    }
  }

    class Producer(id: Int, buffer: mutable.Queue[Int], capacity: Int) extends Thread {
    override def run(): Unit = {
      val random = new Random()
      var i = 0

      while(true) {
        buffer.synchronized {
          while (buffer.size == capacity) {
            println(s"[producer:$id]: buffer is full | waiting.")
            buffer.wait()
          }
          println(s"[producer:$id] producing $i")
          buffer.enqueue(i)
          buffer.notify()
          i += 1
        }
        Thread.sleep(random.nextInt(500))
      }
    }
  }

  def multiProdCons(nConsumers:Int, nProducers: Int, capacity: Int): Unit = {
    val buffer: mutable.Queue[Int] = new mutable.Queue[Int]
    (1 to nConsumers).foreach(i => new Consumer(i, buffer).start())
    (1 to nProducers).foreach(i => new Producer(i, buffer, capacity).start())
  }

  multiProdCons(3, 3, 4)
}

```

The detail is in the wait over `while(buffer.isEmpty)` in the implementation of `Consumer` so if the current `thread` is active, and `buffer` is not empty, only then is a `consumer` allowed to read off the `buffer.

## Deadlock Example

```scala
case class Friend(name: String) {
    def bow(other: Friend) = {
       this.synchronized {
          println(s"$this: bowing down to $other")
          other.rise(this)
          println(s"$this: Rise since $other has risen.")
       }
    }
    
    def rise(other: Friend) = {
        this.synchronized {
            println(s"$this: rising before $other.")
        }
    }
    
    var side = "right"
    def switchSide(): Unit = {
        if (side == "right") side = "left"
        else side = "right"
    }
    
    def pass(other: Friend): Unit = {
        while (this.side == other.side) {
            println(s"$this: feel free to pass")
            switchSide()
            Thread.sleep(1000)
        }
    }
}

val bob = Friend("Bob")
val alice = Friend("Alice")

new Thread(() => bob.bow(alice)).start()
new Thread(() => alice.bow(bob)).start()
```
When we run the above, we get the output as:

```shell
$
Friend(Bob): bowing to Friend(Alice)
Friend(Alice): bowing to Friend(Bob)
```
But nothing else happens, because both call the `other.rise(...)` method which calls their synchronized expression, causing both to wait for the other to `println(...)` first. The first instance of friend that runs locks the other and _vice-versa_. This is a Deadlock, where (two) threads cannot proceed because they are waiting on each other to release their locks.

## Livelock example

```scala
/** main.scala **/
val jerry = Friend("Jerry")
val tom = Friend("Tom")

new Thread(() => jerry.pass(tom)).start()
new Thread(() => tom.pass(jerry)).start()
```
The output of this looks like an infinite loop condition, this is a live-lock. A situation where none of the threads are block but are not able to proceed because they yield to the other threads.
```shell
$
Friend(Jerry): feel free to pass
Friend(Tom): feel free to pass
Friend(Tom): feel free to pass
Friend(Jerry): feel free to pass
Friend(Tom): feel free to pass
...
```
_fin._
