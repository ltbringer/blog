---
date: 2020-04-28
title: "Text classification conflicts and hierarchical models"
cover: "https://picsum.photos/seed/seed_n/1500/300"
categories:
    - experiments
tags:
    - machine learning
    - python
---

## Pre-requisites
- We will use [this dataset](https://github.com/clinc/oos-eval/blob/master/data/data_full.json) for our study, taken from [this repository](https://github.com/clinc/oos-eval).
- Some experience with Python


## Story
In my experience of building classifiers for commercial applications, the problems I face often apart from:

1. Inadequate data.
2. Noisy data.
3. Incorrectly tagged data.
4. Data with poor representation of the actual problem.

is classification labels with conflicting vocabulary. If you don't know what that means, here are a few examples:

```markdown
# Examples:

| sentences                                                          | tag                  |
|--------------------------------------------------------------------|----------------------|
| No I didn't say play music                                         | oos                  |
| I said play music                                                  | play_music           |
| No I said play music                                               | oos                  |
| What is my credit card balance                                     | credit_card_balance  |
| What is my credit card limit                                       | credit_card_limit    |
| I just paid from my credit card is my transaction confirmed?       | payment_confirmation |
| Is my booking confirmed? I did my transaction with my credit card. | booking_confirmation |
```

If we run classifiers on such a dataset, we may, with a lot of effort get to a certain degree of precision but model's prediction 
will reflect the confusion in the dataset. Keeping the model aside, tagging such data-points has shown us **more than 20% tagging errors** 
as the aspect of general language the taggers understand is not enough to tag business specific labels. This leads to poor model accuracy,
spending more time than necessary on tagging, which translates to frequent train-test-analyse-deploy cycles.

So how do we solve this?

## Hierarchical models
Since the problem here is shared vocabulary, let's try to share the labels as well. A design angle also drops by in this case classifiers generally have a fallback
label with triggers like:

1. Predicted label doesn't cross the threshold. (Threshold too high)
2. Couple of labels cross the threshold with confidence scores close by. (Threshold too low)
3. The fallback label gets predicted.

Since we have data that is sharing vocabulary, it means that predicted labels will also share confidence. Making it hard to cross the threshold.

## Intuition
Let's say we have $$N$$ labels present in our data, we will assess if they can be broadly classified into a set of $$M$$ labels where:

$M \ll N$ 

Let's assume there is just one degree of ascension, i.e. each label in the original data-set has only one generic label (many to one mapping). 
In this case we will train two models, one as usual with data as-is and another with the generalized labels.

## Data analysis
We will explore the [dataset](https://github.com/clinc/oos-eval/blob/master/data/data_full.json) linked above. We will try to see all the labels,
come up with possible generalizations (degree=1).


```python
# - Analyse tags

In [1]: import json

In [2]: import pydash as py_

In [3]: with open("voice_commands/data_full.json", "r") as f:
    ...:     full_data = json.load(f)
    
In [4]: full_data.keys()                                                                           
Out[4]: dict_keys(['oos_val', 'val', 'train', 'oos_test', 'test', 'oos_train'])

In [5]: training_data = full_data["train"] + full_data["oos_train"]

In [6]: label_groups = py_.group_by(training_data, lambda el: el[1])

In [7]: label_dist = {k: len(v) for k, v in label_groups.items()}
```

There are 151 labels, each with 100 data points (a very balanced dataset!). Since the list would make it really long to print, we will use `tabulate`.

```python
# - Pretty print a long list of labels. [horizontally scrollable!]

In [8]: from tabulate import tabulate
In [9]: labels = py_.chunk(list(label_dist.keys()), 6)
In [10]: print(tabulate(labels))
---------------------  --------------------  -------------------------  ------------------  -------------------  ----------------------  ----------------------  -----------------------
accept_reservations    account_blocked       alarm                      application_status  apr                  are_you_a_bot           balance                 bill_balance
bill_due               book_flight           book_hotel                 calculator          calendar             calendar_update         calories                cancel
cancel_reservation     car_rental            card_declined              carry_on            change_accent        change_ai_name          change_language         change_speed
change_user_name       change_volume         confirm_reservation        cook_time           credit_limit         credit_limit_change     credit_score            current_location
damaged_card           date                  definition                 direct_deposit      directions           distance                do_you_have_pets        exchange_rate
expiration_date        find_phone            flight_status              flip_coin           food_last            freeze_account          fun_fact                gas
gas_type               goodbye               greeting                   how_busy            how_old_are_you      improve_credit_score    income                  ingredient_substitution
ingredients_list       insurance             insurance_change           interest_rate       international_fees   international_visa      jump_start              last_maintenance
lost_luggage           make_call             maybe                      meal_suggestion     meaning_of_life      measurement_conversion  meeting_schedule        min_payment
mpg                    new_card              next_holiday               next_song           no                   nutrition_info          oil_change_how          oil_change_when
oos                    order                 order_checks               order_status        pay_bill             payday                  pin_change              play_music
plug_type              pto_balance           pto_request                pto_request_status  pto_used             recipe                  redeem_rewards          reminder
reminder_update        repeat                replacement_card_duration  report_fraud        report_lost_card     reset_settings          restaurant_reservation  restaurant_reviews
restaurant_suggestion  rewards_balance       roll_dice                  rollover_401k       routing              schedule_maintenance    schedule_meeting        share_location
shopping_list          shopping_list_update  smart_home                 spelling            spending_history     sync_device             taxes                   tell_joke
text                   thank_you             time                       timer               timezone             tire_change             tire_pressure           todo_list
todo_list_update       traffic               transactions               transfer            translate            travel_alert            travel_notification     travel_suggestion
uber                   update_playlist       user_name                  vaccines            w2                   weather                 what_are_your_hobbies   what_can_i_ask_you
what_is_your_name      what_song             where_are_you_from         whisper_mode        who_do_you_work_for  who_made_you            yes
---------------------  --------------------  -------------------------  ------------------  -------------------  ----------------------  ----------------------  -----------------------
```
These labels suggest we have a very chatbot-like data. If you want, at this point you can pause reading and try generalizing these labels on your own.

### Programmatic Assessment
There are 151 intents, getting a sense of them would require going through each label, revisit, sometimes even check what a few sentences look like.
That's pretty slow. Let's use some tricks to get there faster. We will first save the vocabulary of our training data, i.e. every unique word and its frequency.
Once that is done, we can check how correlated are these labels with one another.

```python
# - Please don't use the functions here in production!

In [11]: from sklearn.feature_extraction.text import TfidfVectorizer  

In [12]: tfidf = TfidfVectorizer(stop_words="english", lowercase=True) 

In [13]: sentences, labels = zip(*training_data)

In [14]: labels = list(set(labels))

In [15]: tfm = tfidf.fit_transform(sentences) 

In [16]: vocabulary_ = tfidf.vocabulary_ 

In [17]: len(vocabulary_)                                                                                                                                                 
Out[17]: 5092

In [18]: vocabulary_set = set(vocabulary_) 

In [19]: def make_label_maps():
     ...:     label_vocab_map = {}
     ...:     for label, content in label_groups.items():
     ...:         label_vocab_map[label] = set()
     ...:         label_sentences, _ = zip(*content)
     ...:         for word in vocabulary_set:
     ...:             for sentence in label_sentences:
     ...:                 if word in sentence:
     ...:                    label_vocab_map[label].add(word)
     ...:     return label_vocab_map

In [20]: label_vocab_map = make_label_maps()   

In [21]: def create_label_correlation(correlation_threshold=10): 
     ...:     correlation = [] 
     ...:     for i in tqdm(range(len(labels))): 
     ...:         alabel = labels[i] 
     ...:         for j in range(i, len(labels)): 
     ...:             otherlabel = labels[j] 
     ...:             if alabel != otherlabel: 
     ...:                 score = len(label_vocab_map[alabel].intersection(label_vocab_map[otherlabel])) 
     ...:                 if score > correlation_threshold: 
     ...:                     correlation.append((alabel, otherlabel, score)) 
     ...:     return correlation 

In [22]: correlation = sorted(create_label_correlation(), key=lambda el: el[1], reverse=True)

In [23]: len(correlation)                                                                                                                                                
Out[23]: 11325
```

_pardon the murder of functional concepts and poor programming for the sake of speed_

That's a lot of data points to scan through! Let's try that again, let's include `ngram-range=(1,3)` in `TfidfVectorizer(stop_words="english", lowercase=True, ngram_range=(1,3))` and pruning vocabulary off words less than 3 characters. Also, we will use `correlation_threshold=40` `create_label_correlation`.

```python
# - 

In [24]: correlation = sorted(create_label_correlation(40), key=lambda el: el[1], reverse=True)    
100%|███████████████████████████████████████████████████████████| 151/151 [00:00<00:00, 4174.51it/s]

In [25]: len(correlation)                                                                          
Out[26]: 127
```

That's better, let's see what we have here.

```python
# - 

In [27]: correlation_chunked = py_.chunk(correlation, 3)                                                                                                                                 

In [28]: print(tabulate(correlation_chunked))                                                                                                                                            
-----------------------------------------------------  ------------------------------------------------------  ------------------------------------------------------
('recipe and ingredients_list', 85)                    ('confirm_reservation and restaurant_reservation', 80)  ('car_rental and book_flight', 79)
('book_flight and book_hotel', 78)                     ('car_rental and book_hotel', 75)                       ('todo_list_update and todo_list', 71)
('directions and distance', 69)                        ('credit_limit and credit_limit_change', 68)            ('accept_reservations and restaurant_reviews', 66)
('calendar and calendar_update', 64)                   ('rewards_balance and redeem_rewards', 64)              ('nutrition_info and calories', 63)
('restaurant_reservation and cancel_reservation', 61)  ('balance and interest_rate', 61)                       ('carry_on and book_flight', 59)
('freeze_account and account_blocked', 58)             ('meal_suggestion and restaurant_suggestion', 58)       ('order_checks and interest_rate', 57)
('recipe and cook_time', 56)                           ('international_visa and vaccines', 55)                 ('credit_limit and apr', 55)
('international_visa and plug_type', 54)               ('routing and interest_rate', 54)                       ('rewards_balance and credit_limit', 54)
('confirm_reservation and cancel_reservation', 54)     ('ingredients_list and cook_time', 54)                  ('routing and balance', 53)
('uber and distance', 53)                              ('order_checks and routing', 52)                        ('nutrition_info and recipe', 51)
('todo_list_update and calendar_update', 51)           ('lost_luggage and book_flight', 51)                    ('update_playlist and play_music', 51)
('pto_request and book_hotel', 51)                     ('calories and recipe', 51)                             ('food_last and cook_time', 51)
('order_checks and pin_change', 50)                    ('international_visa and travel_alert', 50)             ('international_visa and travel_notification', 50)
('nutrition_info and food_last', 50)                   ('lost_luggage and carry_on', 50)                       ('travel_suggestion and restaurant_suggestion', 50)
('book_hotel and restaurant_suggestion', 50)           ('order_checks and balance', 49)                        ('how_busy and restaurant_reviews', 49)
('redeem_rewards and apr', 49)                         ('account_blocked and balance', 49)                     ('pay_bill and interest_rate', 49)
('expiration_date and application_status', 49)         ('order_checks and direct_deposit', 48)                 ('report_fraud and transactions', 48)
('rewards_balance and apr', 48)                        ('directions and book_hotel', 48)                       ('nutrition_info and ingredients_list', 47)
('report_fraud and redeem_rewards', 47)                ('pin_change and interest_rate', 47)                    ('rewards_balance and balance', 47)
-----------------------------------------------------  ------------------------------------------------------  ------------------------------------------------------
```
We can see from label names that we have a reasonable confusion matter. Let's keep trying to solve for vocab with `len(word) >= 3`.

```python
In [29]: def group_correlations(correlation): 
     ...:     correlated_group = {} 
     ...:     for item in correlation: 
     ...:         if item[0] not in correlated_group and item[1] not in correlated_group: 
     ...:             correlated_group[item[0]] = [(item[0], item[2]), (item[1], item[2])] 
     ...:         elif item[0] in correlated_group: 
     ...:             correlated_group[item[0]].append((item[1], item[2])) 
     ...:         elif item[1] in correlated_group: 
     ...:             correlated_group[item[1]].append((item[0], item[2])) 
     ...:     return correlated_group 

In [30]: correlated_group = group_correlations(correlation) 
```

At this point for each intent we have easy to visualize overlaps but we can do better than this. So far we have only seen correlations, and not the 
differences which could be useful. Let's try to see the most common words in the vocabulary.


```python
In [30]: def create_label_blacklist(): 
     ...:     blacklist = [] 
     ...:     for i in tqdm(range(len(labels))): 
     ...:         alabel = labels[i] 
     ...:         for j in range(i, len(labels)): 
     ...:             otherlabel = labels[j] 
     ...:             if alabel != otherlabel: 
     ...:                 blacklist.extend(list(label_vocab_map[alabel].intersection(label_vocab_map[otherlabel]))) 
     ...:     return blacklist

In [31]: blacklist_ctr = Counter(blacklist)   

In [32]: from collections import Counter                                                                                                                                 

In [33]: blacklist_ctr = Counter(blacklist)

In [34]: blacklist_ctr.most_common(10)                                                                                                                                   Out[33]: 
[('need', 10296),
 ('nee', 10296),
 ('tel', 8385),
 ('tell', 7260),
 ('ate', 7021),
 ('know', 6786),
 ('want', 6670),
 ('like', 6670),
 ('ill', 5995),
 ('let', 4950)]
```

Discard the top 500 words from the vocab.

```python
# - `if x not in ...` works faster on sets and dicts.
In [34]: filter_vocab = set([w[0] for w in blacklist_ctr.most_common(500)])

In [35]: vocabulary = [word for word in vocabulary_ if len(word) >= 3 and word not in filter_vocab]

In [36]: vocabulary_set = set(vocabulary)

In [37]: label_vocab_map = make_label_maps()
```
We still have **41983** words in vocabulary but a lot of common words are removed. We could also do this using `TfidfVectorizer`'s `max_df` param.

```python
# Let's modify our correlation function to show the diff vocab as well

In [38]: correlation = sorted(create_label_correlation(10), key=lambda el: el[2], reverse=True)

In [39]: len(correlation)           
Out[40]: 200

In [41]: def create_label_correlation(threshold=10): 
    ...:     correlation = [] 
    ...:     for i in tqdm(range(len(labels))): 
    ...:         alabel = labels[i] 
    ...:         for j in range(i, len(labels)): 
    ...:             otherlabel = labels[j] 
    ...:             if alabel != otherlabel: 
    ...:                 corr = len(label_vocab_map[alabel].intersection(label_vocab_map[otherlabel])) 
    ...:                 diff = len(label_vocab_map[alabel].symmetric_difference(label_vocab_map[otherlabel])) 
    ...:                 if corr > threshold: 
    ...:                     correlation.append((alabel, otherlabel, corr, diff)) 
    ...:     return correlation

In [42]: print(tabulate(py_.chunk(correlation, 3)))

-------------------------------------------------------  ----------------------------------------------------------  ------------------------------------------------------------
('recipe', 'ingredients_list', 66, 408)                  ('confirm_reservation', 'restaurant_reservation', 60, 269)  ('accept_reservations', 'restaurant_reviews', 46, 408)
('book_flight', 'book_hotel', 43, 524)                   ('recipe', 'cook_time', 42, 436)                            ('car_rental', 'book_flight', 41, 412)
('nutrition_info', 'calories', 40, 296)                  ('todo_list_update', 'todo_list', 40, 287)                  ('update_playlist', 'play_music', 40, 387)
('directions', 'distance', 38, 361)                      ('car_rental', 'book_hotel', 35, 436)                       ('uber', 'distance', 35, 344)
('calendar', 'calendar_update', 33, 289)                 ('restaurant_reservation', 'cancel_reservation', 33, 259)   ('nutrition_info', 'food_last', 32, 284)
('ingredients_list', 'cook_time', 32, 358)               ('carry_on', 'book_flight', 31, 426)                        ('pto_request', 'book_hotel', 31, 382)
('calories', 'recipe', 31, 464)                          ('confirm_reservation', 'cancel_reservation', 30, 280)      ('calories', 'ingredients_list', 30, 368)
('credit_limit', 'credit_limit_change', 30, 159)         ('freeze_account', 'account_blocked', 29, 152)              ('calories', 'cook_time', 29, 350)
('meal_suggestion', 'restaurant_suggestion', 29, 331)    ('nutrition_info', 'ingredients_list', 28, 334)             ('accept_reservations', 'confirm_reservation', 28, 433)
('ingredient_substitution', 'calories', 28, 464)         ('international_visa', 'vaccines', 27, 217)                 ('nutrition_info', 'recipe', 27, 434)
('food_last', 'cook_time', 27, 326)                      ('international_visa', 'plug_type', 26, 282)                ('car_rental', 'restaurant_suggestion', 26, 374)
('uber', 'traffic', 26, 348)                             ('accept_reservations', 'restaurant_reservation', 26, 422)  ('calories', 'food_last', 26, 334)
('international_visa', 'travel_alert', 25, 239)          ('international_visa', 'travel_notification', 25, 250)      ('lost_luggage', 'carry_on', 25, 303)
('directions', 'uber', 25, 367)                          ('book_flight', 'pto_request', 25, 382)                     ('how_busy', 'restaurant_reviews', 25, 331)
...
-------------------------------------------------------  ----------------------------------------------------------  ------------------------------------------------------------
```

That looks decent. We have all these overlapping labels but all of them seem to have sufficient vocab to distinguish from each other on a _one-on-one_ basis.

We can have something even more useful. What if we could see label-level vocabulary? We could know the set of words that only exist for the label.def 


```python
In [51]: def create_label_vocab(): 
     ...:     label_vocab = {} 
     ...:     for i in tqdm(range(len(labels))): 
     ...:         alabel = labels[i] 
     ...:         label_vocab[alabel] = None 
     ...:         vocab = copy.deepcopy(label_vocab_map[alabel]) 
     ...:         for j in range(i, len(labels)): 
     ...:             otherlabel = labels[j] 
     ...:             if alabel != otherlabel: 
     ...:                 vocab = vocab.difference(label_vocab_map[otherlabel]) 
     ...:         if vocab: 
     ...:             label_vocab[alabel] = vocab 
     ...:     return label_vocab 
     ...:      

In [52]: print(tabulate(py_.chunk(sorted([(k, len(v)) for k, v in label_vocab.items()], key=lambda el: el[1], reverse=True), 3))) 
---------------------------------  -------------------------------  --------------------------------
('oos', 370)                       ('book_hotel', 254)              ('ingredient_substitution', 232)
('accept_reservations', 226)       ('update_playlist', 204)         ('recipe', 201)
('play_music', 191)                ('restaurant_suggestion', 187)   ('calculator', 165)
('book_flight', 164)               ('calendar_update', 154)         ('ingredients_list', 154)
('traffic', 154)                   ('insurance_change', 150)        ('calories', 150)
...
---------------------------------  -------------------------------  --------------------------------
```

We can see the set sizes for each of the 151 classes. Let's try a maximum overlap algorithm for our classification task. Here's what it looks like in my head:

1. Break a sentence into a set of ngram tokens (n = [1 - 3]).
2. Search each token in our filtered vocabulary.
3. If a token is not found we will re-label it as OOV.
4. Compare the set of tokens to our labels and take a note of the intersection.
5. Select the maximum overlap of all labels.


```python
In [53]: def get_sentence_ngrams(sentence): 
     ...:     return set([" ".join(token) for token in everygrams(sentence.split(" "), max_len=3)]) 
     ...:   

In [54]: def label_missing_token_oov(tokens, vocab): 
     ...:     return set([token if token in vocab else "OOV" for token in tokens]) 

In [55]: def match_sentence_to_label(sentence, vocab_set, label_vocab): 
     ...:     overlaps = {} 
     ...:     tokens = get_sentence_ngrams(sentence) 
     ...:     tokens = label_missing_token_oov(tokens, vocab_set) 
     ...:     for label, vocab in label_vocab.items(): 
     ...:         overlaps[label] = len(vocab.intersection(tokens)) 
     ...:     return overlaps 

In [56]: label_missing_token_oov(get_sentence_ngrams("peanut butter and jelly"), vocabulary_set)                                   
Out[56]: {'OOV', 'jelly', 'peanut', 'peanut butter'}

In [57]: overlaps = match_sentence_to_label("peanut butter and jelly", vocabulary_set, label_vocab)

In [58]: sorted_overlap = sorted([(k, v) for k, v in overlaps.items() if v], key=lambda el: len(el[1]), reverse=True)                                                    

In [59]: sorted_overlap[:5]                                                                                                                                              
Out[59]: [('shopping_list', {'peanut', 'peanut butter'}), ('calories', {'jelly'})]
```
