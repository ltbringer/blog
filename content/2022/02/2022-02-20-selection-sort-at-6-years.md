---
date: 2022-02-20
title: "Selection sort after 6 years of experience."
cover: "https://picsum.photos/seed/seed_n/1500/300"
categories:
    - programming
---

# Selection Sort

I have been focusing on programming challenges recently and noticed the commonly available material on the internet.
There is a great focus on completion, efficiency, in some cases attempts to test but very little focus on readability.
Code is read more often than it is wrote also, it is hard to review instructions meant for machine.

An example of this will be picked in the selection [sort algorithm](https://www.geeksforgeeks.org/selection-sort/)[^selection-sort-source]

```python
# selection_sort.py

def selection_sort(array):
    for i in range(len(array)):
        
        # Find the minimum element in remaining 
        # unsorted array
        min_idx = i
        for j in range(i+1, len(array)):
            if array[min_idx] > array[j]:
                min_idx = j
                
        # Swap the found minimum element with 
        # the first element        
        array[i], array[min_idx] = array[min_idx], array[i]

    return array
```

This works but this solution isn't very readable. I remember mugging up the sequence of instructions
in my school days. If I were to communicate with other developers, I would want them to understand my intent.

```python
# selection_sort.py

def argmax(array):
    return max(range(len(array)), key=lambda el: array[el])


def swap_idx(array, idx1, idx2):
    array[idx1], array[idx2] = array[idx2], array[idx1]


def selection_sort(array):
    i = 0
    array_size = len(array)

    while array_size - i > 0:
        largest_el_idx = argmax(array[:array_size - i])
        current_largest_index = array_size - i - 1
        swap_idx(array, largest_el_idx, current_largest_index)
        i += 1
    return array
```

IMO this does a better job of conveying intent.

- Pick the largest/smallest element in the array.
- Swap it with the element at the largest available index.
- Reduce the largest available index by `i`.

I'm not comfortable with the presence of `while` and the iteration variable `i`. I would like to write something that
is as readable as [haskell's quick-sort implementation](https://mmhaskell.com/blog/2019/5/13/quicksort-with-haskell#slow-quicksort).

```haskell

quicksort1 :: (Ord a) => [a] -> [a]
quicksort1 [] = []
quicksort1 (x:xs) =
  let smallerSorted = quicksort1 [a | a <- xs, a <= x]
      biggerSorted = quicksort1 [a | a <- xs, a > x]
  in  smallerSorted ++ [x] ++ biggerSorted

```

- We set the base case for empty lists.
- For any non-empty list, we pick the first element and partition the rest of the list.
- Set the first element as the pivot.
- Produce two lists from the partition:
    - One with all elements less than the pivot.
    - One with all elements greater than the pivot.
- Return the concatenation of the two lists.

[^selection-sort-source]: I picked the top search result at the time of this writing.
