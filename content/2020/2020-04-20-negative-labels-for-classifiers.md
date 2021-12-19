---
date: 2020-04-20
title: "Negative labels for classification"
cover: "https://picsum.photos/seed/seed_n/1500/300"
categories:
    - experiments
tags:
    - machine learning
---
Solving a classification problem has a standard approach to it. Acquire lots of labelled data. Hand it to a simple neural network and watch gradient descent do the work. But this is not enough, at least not when real world gets involved. There are data points with signals too feeble to picked without human intervention. One of those cases is **negation**.

> Okay, I'll turn the lights on. <cite>robots</cite>

> I don't want to turn the **** lights on! <cite>Paying customer</cite>

> Sure, almost done. <cite>robots</cite>

## Background
The questions we must ask to handle queries are: 

- "What is the subject of the conversation?"
- "What is the intention of the speaker?"

These questions have answers in *verbs* and *nouns*, the solutions for these become *Intent Classification* and *Entity Recognition*. Reducing the sentence so recklessly only asks yet another question. 

If it meant the same to strip a sentence of everything that is not statistically dominant, why would humans converse with it? As feature engineers, we try to reduce a sentence into its bare minimum form. Pulling out signal from the noise. A lack of a rigorous approach makes it hard to justify which reductions are appropriate, also, are these reductions appropriate for the set of all sentences? even if these sentences strictly belong to the business requirement? Are business requirements as strict as they should be to answer these questions?

Maybe, noise is not meant to be stripped off even if it represents a minority. Maybe the noise is the information we have with no means to understand it.

*to be continued...*
