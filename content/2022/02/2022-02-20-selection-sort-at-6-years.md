---
date: 2022-02-20
title: "Selection sort after 6 years of experience."
cover: "https://picsum.photos/seed/seed_n/1500/300"
categories:
    - programming
---

# Selection Sort

I have been focusing on programming challenges recently and noticed the commonly available material on the internet.
There is a great focus on completion, efficiency, in some cases attempts to test but rare is the readability.

An example of this will be picked in the selection [sort algorithm](https://www.geeksforgeeks.org/selection-sort/). [^source]

```python

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

This works but I dislike this solution isn't human readable. I remember mugging up the sequence of instructions
in my school days. I'll try these simple exercises periodically to see how well I can communicate over the years.

```python

def argmax(array):
    return max(range(len(array)), key=lambda el: array[el])


def swap_idx(array, idx1, idx2):
    array[idx1], array[idx2] = array[idx2], array[idx1]


def selection_sort(array):
    i = 0
    array_size = len(array)

    while array_size - i > 0:
        largest_idx = argmax(array[:array_size - i])
        current_last_index = araay_size - i - 1
        swap_idx(array, largest_idx, current_last_index)
        i += 1
    return array
```

IMO this does a better job of conveying what the algorithm is expected to do.

- Pick the largest/smallest element in the array.
- Swap it with the element at last/first available position.
- Reduce the range of motion by 1.

I still dislike the presence of `while` and the iteration variable `i` it is evident in my last point _"Reduce the range of motion by 1"_
that I can't explain the idea well.

[^source]: I picked the top search result at the time of this writing.