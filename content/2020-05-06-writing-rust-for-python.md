---
date: 2020-05-04
title: "Taking Rust code to Python land"
cover: "https://unsplash.it/1152/300/?random?BirchintheRoses"
categories:
    - programming
tags:
    - rust
    - python
    - pyo3
    - maturin
---
There are plenty of cases where an algorithm in python doesn't cut the speed benchmarks, or sometimes there is a strong need for that low level control. Porting code to `cython`, `c` or `c++` have proven to give serious speed boosts. I recently needed to do [something similar](https://ltbringer.github.io/blog/regular-expressions-and-efficiency), a use-case where speed was of utmost importance. 

I picked rust because of its different take on memory management. This means the allocations and freeing memory are not left up to the developer to forget or remember. This alone leads to security flaws, segmentation faults, memory leaks and while there is tooling available to find and fix these issues, they still take significant amount of time to get done. The native unicode support, the `vector` type which is friendly for providing inputs of unbounded length, advanced type system, helpful error messages were couple of features that made it an attractive option.


## Ingredients

- An installation of Rust.
- A virtual environment running python 3.5 and above.
- A blob of [pyo3](https://github.com/PyO3/pyo3).
- An algorithm to port.
- Dedication as per taste.
- Leave it to [maturin](https://github.com/PyO3/maturin).

We'll take two cases for now. If I find more cases not covered by these generalizations, I'll add them here.

1. Porting a function.
2. Porting a state-ful object.

The first is possibly a case where, say your python code has an $$O(n^3)$$ complexity (there is a possibility to optimize the algorithm by re-thinking the data structure) and it would help to squeeze out some statically typed goodness.

The second case is where you would instantiate a class object, maybe this reads a file? parses the strings and builds a data structure that assists many operations? We will be using Rust's `struct` for supporting this feature.
