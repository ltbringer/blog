---
date: 2020-04-25
title: "Regular expressions and efficiency"
cover: "https://unsplash.it/1152/300/?random?BirchintheRoses"
categories:
    - programming
tags:
    - rust
    - python
    - optimization
    - machine learning
---
To start our study, we will use this [dataset](https://github.com/clinc/oos-eval/blob/master/data/data_full.json) from [this repository](https://github.com/clinc/oos-eval).
An introductory analysis shows:

```python
# CLINIC 150
In [1]: import json                                                                               


In [2]: with open("voice_commands/data_full.json", "r") as f: 
   ...:     data = json.load(f) 
   ...:                                                                                           

In [3]: len(data)                                                                                 
Out[3]: 6

In [4]: import pydash as py_                                                                      
In [5]: flat_items = py_.flatten(data.values())                                                   

In [6]: len(flat_items)                                                                           
Out[6]: 23700

In [7]: flat_items[0]                                                                             
Out[7]: ['set a warning for when my bank account starts running low', 'oos']

In [8]: data.keys()                                                                              
Out[8]: dict_keys(['oos_val', 'val', 'train', 'oos_test', 'test', 'oos_train'])

In [9]: data["oos_val"][0]                                                                       
Out[9]: ['set a warning for when my bank account starts running low', 'oos']

In [10]: data["val"][0]                                                                           
Out[10]: ['in spanish, meet me tomorrow is said how', 'translate']
```
Now, let's look at the training data a little bit to see what we have.

```python
# CLINIC150
In [16]: import random

In [17]: import copy

In [18]: training_data = copy.deepcopy(data["train"]) # To avoid mutating the reference.

In [22]: sentence, tags = zip(*training_data)

In [23]: labels = set(labels)

In [24]: len(set(labels)), len(training_data)  # Coincidence?
Out[24]: 150, 15000
```

This data-set seems to have a lot of diversity and the labels hint at conflicting vocabularies, this should be fun.
We have 7 types of change intents:

```python
# change intents
 'change_accent',
 'change_ai_name',
 'change_language',
 'change_speed',
 'change_user_name',
 'change_volume',
```
and 3 types of intents that have credit as keyword:

```python
# credit labels
 'credit_limit',
 'credit_limit_change',
 'credit_score',

```
These are just preliminary, eye-balled labels. There could be more than this but for our study we need either of them to have around 5-6k data points. Let's check that out.

Turns out the data-set is eerily balanced all labels have 100 data points each. So we'll work with the 900 that we get from `%change%` intents.
```python
{'change_accent',
 'change_ai_name',
 'change_language',
 'change_speed',
 'change_user_name',
 'change_volume',
 'credit_limit_change',
 'exchange_rate',
 'insurance_change',
 'oil_change_how',
 'oil_change_when',
 'pin_change',
 'tire_change'}
```
A random view of the sentences before we can proceed with the next few steps:

1. i wanna `change` your name to audrey
2. please respond to me in spanish
3. when do you think i should `change` my oil
4. can you swap to male voice
5. how long is an oil `change` good for
6. when does my oil need some changing
7. hey, speak slowly
8. i want you to speak to me faster
9. can you use a different accent
10. could you slow down your speech
11. what oil do i need and how is it `change`d
12. i want to use spanish as my language
13. could i please `change` your name to alicia
14. please `change` my name
15. i need for you to `change` your accent to the male british one
16. give me instructions on how to `change` my oil
17. i gotta `change` your name to remy
18. hey, stop talking like you're a stretch taped
19. can you find instructions on how to `change` oil in a car
20. i need to `change` your name to ben

11/20 sentences have the keyword, Seems like a good feature. Let's write a couple of regular expressions to see how well it goes.
```python
patterns = [
   r"change.*name",  
   r"change.*oil",  
   r"swap.*accent",  
   r"need.*change", 
   r"please.*change", 
   r"i need to.*change", 
   r"limit.*change", 
   r"change.*pin", 
   r"change.*tires?", 
   r"change.*credit limit", 
   r"language.*change", 
   r"change language", 
   r"pin.*change", 
   r"speed.*change", 
   r"change.*accent", 
   r"credit.*change", 
   r"insurance.*change", 
   r"oil.*change", 
   r"change.*speed", 
   r"how.*change", 
   r"when.*change", 
   r"why.*change"
]
```
We have 21 patterns just for change, let's scan our 15k strong dataset to see how bad are these features for picking `change_*` intents. 
Since we didn't target all patterns possible, it's okay to miss a lot out of 900, but it would be bad to match a lot with other intents.
Let's see how that goes.
```python
def match_change(items, patterns): 
    matches = [] 
    scores = [] 
    for item in items: 
        for pattern in patterns: 
            sentence = item[0] 
            match = re.search(pattern, sentence) 
            if match: 
                matches.append(item) 
                scores.append((match.end() - match.start())) 
    return matches, scores
```
We have an $O(n^{2})$ here, we could skip at the first match to get to $O(n\log{n})$, but we would like to use the span of the pattern to judge if we should go forward.
```python
# - Profiling code
In [17]: %time matches, scores = match_change(training_data, patterns)                            
CPU times: user 200 ms, sys: 0 ns, total: 200 ms
Wall time: 200 ms
```
That is very slow. **200ms** for just 21 patterns? we haven't even covered 100s of intents and this is just one pre-processing step. We will probably be building more features
like _pos-tags_, _tfidf vectors_ maybe we will use _word2vec_? or use the scores we just obtained to tune out the false positives and then the model inference. Production systems
must cater to patience range of human beings to qualify as good products.

Sure this also depends on the type of work. A batch-process that delivers results on e-mail after a while may be allowed to take that much time.
Here we are looking at the data of a smart-home device. Devices that should answer within **2-3 seconds**, already lose some time to accommodate for user speech (silence-detection),
usually getting nothing more than a second's leeway for replying back which has more things to compute than just the `intent`. It has to probably call an API, embed words into a 
response template and then convert that text to speech. All under **1s**. Can we afford to have a single step of pre-processing take **200ms**?

## Hammers and Pickaxes
Let's try to identify what is making things slow. We'll use `snakeviz` and `cProfile` for that.

```
pip install snakeviz
```
and inspect around the function to see what can we do about it.
```python
In [19]: import cProfile                                                                          

In [20]: pr = cProfile.Profile()                                                                  

In [21]: def monitor(): 
    ...:     pr.enable() 
    ...:     matches, scores = match_change(training_data, patterns) 
    ...:     pr.disable() 
    ...:     pr.dump_stats("program.prof") 
    
In [22]: monitor()
```
The profiler saves the inspection results in `program.prof` this can be used by snakeviz to give helpful visualizations.
```
snakeviz /path/to/program.prof
```
I see this plot on my machine:
![Fig. Icicle plot of program performance](./images/pattern_experiment_icicle.png)

According to this we spend 201ms for `re.search` and 71ms for `re.compile`. Let's try to pre-compile our patterns and check the results.
