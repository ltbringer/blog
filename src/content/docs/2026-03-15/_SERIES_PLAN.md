# Blog Series Framework: Building Micrograd in Rust

## Context
A multi-part devlog series documenting the process of porting Karpathy's micrograd from Python to Rust. Targeted at developers who know some Python ML and are curious about Rust's ownership model, or Rustaceans curious about autograd internals. Focuses on the *decisions and tradeoffs* made during the port — not a tutorial, not a translation guide.

## Series Structure (restructuring in progress)

Part 1 covers engine.rs holistically. Remaining parts will be restructured as writing progresses.

```
Part 1:  Engine.rs — What do we need to implement backprop?
Part 2+: TBD (neural net, retrospective — to be restructured)
```

---

## Part 1: What did I learn rebuilding micrograd in Rust — Engine.rs

**Goal:** Cover engine.rs holistically, organized around the question: "What do we need to implement backprop?"

### TOC
1. Recursive typing — moving values behind pointers (Rc, RefCell, Box)
2. Weight updates and gradient motion → backprop
3. To implement backprop we need a few components:
   1. Means to create a DAG
   2. Means to perform operations (+, -, *, /, relu, tanh) between DAG nodes
   3. Backprop gradients
      - Kahn's topological sort
      - Function closures to store gradients during forward pass
   4. Forward pass — implementing the closure on operations to process gradients
4. Supporting reflections: Node ⊕ f32 or f32 ⊕ Node — simple expressions like `w*x+b = c`
5. Demonstrate:
   1. Gradient flow between simple expressions (`w*x+b = c`, with diagram: `w → [×] → [+] → c` where `n` feeds `×` and `b` feeds `+`)
   2. Forward pass and weight updates
   3. Backward pass and gradient flow

### Source Material
| Topic | Files |
|-------|-------|
| Value/ValueInner definition | `src/engine.rs` lines 8–35 |
| PartialEq, Eq, Hash impls | `src/engine.rs` lines 37–49 |
| Default, new, From impls | `src/engine.rs` lines 53–89 |
| Add, Sub, Mul, Div impls | `src/engine.rs` lines 92–193 |
| binary_ops! macro | `src/engine.rs` lines 28–43 |
| impl_op_with_f32! macro | `src/engine.rs` lines 184–208 |
| HasChildren impl for Value | `src/engine.rs` lines 51–58 |
| backprop | `src/engine.rs` lines 72–81 |
| HasChildren, Dag traits | `src/topo.rs` lines 4–10 |
| get_indegrees | `src/topo.rs` lines 12–31 |
| sort (Kahn's algorithm) | `src/topo.rs` lines 44–68 |
| Python micrograd (comparison) | [micrograd/engine.py](https://github.com/karpathy/micrograd/blob/master/micrograd/engine.py) |

### Questions to answer
- In Python, `Value` is one class with `self._prev`. Why can't Rust do the same?
- What does `Rc::ptr_eq` give you that field-by-field comparison doesn't?
- What's the cost of `RefCell` vs compile-time borrows?
- Why does Rust need 3 `impl Add` blocks where Python needs 2 (`__add__` + `__radd__`)?
- Why can't the backward closure borrow `self` and `rhs` instead of cloning?
- What happens if you accidentally use `=` instead of `+=` for gradient accumulation?
- Why return `Vec<Self>` from `children()` instead of `&Vec<Self>`?
- What does the blanket impl buy you over explicit `impl Dag for Value {}`?
- Could you detect cycles using Kahn's? How?

---

## Part 2+: To Be Restructured

> **Note:** The following parts are drafts from the original outline. They will be restructured as writing progresses.

### Part (draft): Neural Net Layer

**Goal:** Building `Neuron`, `Layer`, `MLP` on top of `Value`. Where Python's dynamism helps and where Rust's types force better design.

### TOC
1. `Neuron`: weights (random init), bias, activation
2. `Layer`: a `Vec<Neuron>`, fan-in from previous layer
3. `MLP`: a `Vec<Layer>`, forward pass chains layers
4. The `parameters()` pattern: collecting all `Value`s for gradient descent
5. Training loop: forward → loss → backward → update → zero grad
6. Random initialization: `rand` 0.8, uniform distribution
7. Comparison: Python micrograd's `Module` base class vs Rust's trait approach

### Source Material
| Topic | Files |
|-------|-------|
| Neuron, Layer, MLP | `src/nn.rs` (to be implemented) |
| Python nn module (comparison) | [micrograd/nn.py](https://github.com/karpathy/micrograd/blob/master/micrograd/nn.py) |

### Questions to answer
- How do you collect parameters across nested structs without a base class?
- Should `Neuron` own its weights or share them?
- How does the training loop differ when you can't just `for p in parameters: p.data -= lr * p.grad`?

---

### Part (draft): Retrospective

**Goal:** What this project taught about the difference between Python and Rust thinking. Not "Rust is better" — what each language's constraints reveal.

### TOC
1. Things Rust forced me to understand that Python hid:
   - Ownership of graph nodes (who is responsible for cleanup?)
   - The difference between "same node" and "equal node" (pointer identity vs value equality)
   - When data is on the stack vs heap and why it matters
   - Borrow lifetimes vs garbage collection
2. Things Python made easier:
   - No type ceremony for closures
   - Dynamic dispatch by default
   - No fighting the borrow checker during prototyping
3. Surprising wins from the Rust port:
   - Generic topo sort reusable beyond autograd
   - Macros reducing operator boilerplate below Python's line count
   - `Rc<RefCell>` → `Arc<RwLock>` as a mechanical path to parallelism
4. What I'd do differently next time
5. The P2 roadmap: concurrent forward/backward passes

### Source Material
| Topic | Files |
|-------|-------|
| Full engine | `src/engine.rs` |
| Full topo sort | `src/topo.rs` |
| Python micrograd (comparison) | [micrograd/](https://github.com/karpathy/micrograd/tree/master/micrograd) |

---

## Cross-cutting Themes to Highlight Across Posts

1. **The `Rc<RefCell>` → `Arc<RwLock>` upgrade path**: mentioned in Part 1, paid off in Part 5
2. **Trait-based polymorphism vs class inheritance**: `HasChildren` + `Dag` vs Python's duck typing
3. **Macros vs metaprogramming**: Rust's compile-time code generation vs Python's runtime dunder methods
4. **The clone tax**: when cloning is cheap (Rc) vs expensive (Vec), and how it shapes API design

---

## Rubric (for rating drafts)

| Criterion | Weight | What "great" looks like |
|-----------|--------|------------------------|
| **Technical accuracy** | 25% | Code snippets match the actual repo. Gradient math is correct. Rust concepts explained precisely. |
| **Learning narrative** | 30% | Reads as a journey — shows the wrong attempts, the compiler errors, the "aha" moments. Not a polished tutorial. |
| **Dual-audience value** | 20% | Pythonistas learn Rust patterns, Rustaceans learn autograd. Neither audience is alienated. |
| **Depth over breadth** | 15% | Each post goes deep on 2-3 concepts rather than shallow on 10. |
| **Honesty** | 10% | Admits what was hard, what's still not understood, what was done with help. |
