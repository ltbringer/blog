---
date: 2020-04-28
title: "Text classification conflicts and hierarchical models"
cover: "https://unsplash.it/1152/300/?random?BirchintheRoses"
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

In [15]: tfm = tv.fit_transform(sentences) 

In [16]: vocabulary = tv.vocabulary_ 

In [17]: len(vocabulary)                                                                                                                                                 
Out[17]: 5092

In [18]: vocabulary_set = set(vocabulary) 

In [19]: def make_label_maps():
     ...:     label_vocab_map = {}
     ...:     for label, content in label_group.items():
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
     ...:                     correlation.append((f"{alabel} and {otherlabel}", score)) 
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
('directions and uber', 47)                            ('directions and traffic', 47)                          ('todo_list and reminder', 47)
('pay_bill and balance', 47)                           ('routing and direct_deposit', 46)                      ('pin_change and account_blocked', 46)
('uber and traffic', 46)                               ('accept_reservations and confirm_reservation', 46)     ('accept_reservations and restaurant_reservation', 46)
('book_flight and timezone', 46)                       ('international_fees and travel_alert', 46)             ('calories and ingredients_list', 46)
('car_rental and restaurant_suggestion', 45)           ('pin_change and balance', 45)                          ('calories and food_last', 45)
('calories and cook_time', 45)                         ('redeem_rewards and credit_limit', 45)                 ('plug_type and travel_notification', 45)
('apr and expiration_date', 45)                        ('travel_notification and vaccines', 45)                ('lost_luggage and flight_status', 44)
('pin_change and pay_bill', 44)                        ('rewards_balance and expiration_date', 44)             ('international_fees and credit_limit', 44)
('calendar_update and book_hotel', 44)                 ('traffic and distance', 44)                            ('plug_type and travel_alert', 44)
('pto_request_status and application_status', 44)      ('calendar and todo_list', 43)                          ('nutrition_info and cook_time', 43)
('direct_deposit and pin_change', 43)                  ('accept_reservations and cancel_reservation', 43)      ('book_flight and travel_notification', 43)
('international_fees and plug_type', 43)               ('redeem_rewards and new_card', 43)                     ('travel_alert and travel_notification', 43)
('credit_limit and expiration_date', 43)               ('distance and book_hotel', 43)                         ('new_card and application_status', 43)
('calendar and book_flight', 42)                       ('calendar and book_hotel', 42)                         ('report_fraud and credit_limit', 42)
('routing and transfer', 42)                           ('rewards_balance and credit_limit_change', 42)         ('uber and book_hotel', 42)
('book_flight and travel_suggestion', 42)              ('freeze_account and balance', 42)                      ('restaurant_reservation and book_hotel', 42)
('bill_due and transactions', 42)                      ('apr and application_status', 42)                      ('order_checks and pay_bill', 41)
('report_fraud and account_blocked', 41)               ('report_fraud and apr', 41)                            ('report_fraud and report_lost_card', 41)
('routing and pin_change', 41)                         ('direct_deposit and balance', 41)                      ('rewards_balance and application_status', 41)
('accept_reservations and how_busy', 41)               ('flight_status and book_flight', 41)                   ('book_flight and pto_request', 41)
('confirm_reservation and restaurant_reviews', 41)     ('recipe and food_last', 41)                            ('redeem_rewards and transactions', 41)
('plug_type and vaccines', 41)                         ('spending_history and transactions', 41)               ('bill_due and min_payment', 41)
('credit_limit and interest_rate', 41)                 ('balance and transfer', 41)                            ('transactions and apr', 41)
('interest_rate and apr', 41)
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

In [31]: from collections import Counter                                                                                                                                 

In [32]: blacklist_ctr = Counter(blacklist)

In [33]: blacklist_ctr.most_common(10)                                                                                                                                   Out[33]: 
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
In [34]: filter_vocab = set([w[0] for w in blacklist_ctr.most_common(500)]])

In [35]: vocabulary = [word for word in vocabulary_ if (word) >= 3 and word not in filter_vocab]
```
We still have **41983** words in vocabulary but a lot of common words are removed. We could also do this using `TfidfVectorizer`'s `max_df` param.

```python
# Let's modify our correlation function to show the diff vocab as well

In [36]: correlation = sorted(create_label_correlation(10), key=lambda el: el[2], reverse=True)

In [37]: len(correlation)           
Out[38]: 200

In [39]: def create_label_correlation(st=10): 
     ...:     correlation = [] 
     ...:     for i in tqdm(range(len(labels))): 
     ...:         alabel = labels[i] 
     ...:         for j in range(i, len(labels)): 
     ...:             otherlabel = labels[j] 
     ...:             if alabel != otherlabel: 
     ...:                 corr = len(label_vocab_map[alabel].intersection(label_vocab_map[otherlabel])) 
     ...:                 diff = len(label_vocab_map[alabel].symmetric_difference(label_vocab_map[otherlabel])) 
     ...:                 if score > st: 
     ...:                     correlation.append((alabel, otherlabel, corr, diff)) 
     ...:     return correlation

In [40]: print(tabulate(py_.chunk(correlation, 3)))

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
('ingredient_substitution', 'recipe', 25, 582)           ('nutrition_info', 'cook_time', 24, 322)                    ('recipe', 'food_last', 24, 450)
('distance', 'book_hotel', 24, 480)                      ('rewards_balance', 'redeem_rewards', 23, 229)              ('directions', 'book_hotel', 23, 485)
('confirm_reservation', 'restaurant_reviews', 23, 369)   ('traffic', 'distance', 23, 374)                            ('travel_suggestion', 'restaurant_suggestion', 23, 330)
('book_hotel', 'restaurant_suggestion', 23, 496)         ('lost_luggage', 'flight_status', 22, 237)                  ('book_flight', 'timezone', 22, 379)
('travel_notification', 'vaccines', 22, 225)             ('lost_luggage', 'book_flight', 21, 421)                    ('carry_on', 'flight_status', 21, 264)
('uber', 'book_hotel', 21, 466)                          ('book_flight', 'distance', 21, 474)                        ('shopping_list_update', 'ingredient_substitution', 21, 467)
('shopping_list_update', 'calories', 21, 361)            ('how_busy', 'confirm_reservation', 21, 328)                ('calendar_update', 'book_hotel', 21, 497)
('travel_alert', 'vaccines', 21, 216)                    ('ingredients_list', 'food_last', 21, 358)                  ('todo_list_update', 'calendar_update', 20, 399)
('credit_limit_change', 'transfer', 20, 237)             ('nutrition_info', 'ingredient_substitution', 19, 444)      ('shopping_list', 'shopping_list_update', 19, 242)
('order', 'shopping_list_update', 19, 294)               ('accept_reservations', 'how_busy', 19, 417)                ('accept_reservations', 'cancel_reservation', 19, 387)
('ingredient_substitution', 'food_last', 19, 454)        ('pto_request', 'travel_notification', 19, 244)             ('plug_type', 'travel_notification', 19, 294)
('pto_request_status', 'application_status', 19, 160)    ('order_checks', 'routing', 18, 238)                        ('change_user_name', 'change_ai_name', 18, 150)
('directions', 'traffic', 18, 387)                       ('book_flight', 'restaurant_suggestion', 18, 494)           ('shopping_list_update', 'food_last', 18, 339)
('international_fees', 'travel_alert', 18, 281)          ('plug_type', 'vaccines', 18, 267)                          ('todo_list', 'reminder', 18, 198)
('nutrition_info', 'shopping_list_update', 17, 331)      ('routing', 'balance', 17, 259)                             ('flight_status', 'book_flight', 17, 382)
('how_busy', 'restaurant_reservation', 17, 321)          ('international_fees', 'plug_type', 17, 328)                ('confirm_reservation', 'schedule_meeting', 17, 263)
('freeze_account', 'balance', 17, 218)                   ('ingredient_substitution', 'ingredients_list', 17, 500)    ('plug_type', 'travel_alert', 17, 287)
('restaurant_reservation', 'schedule_meeting', 17, 248)  ('restaurant_reservation', 'book_hotel', 17, 464)           ('spending_history', 'transactions', 17, 234)
('travel_alert', 'travel_notification', 17, 253)         ('balance', 'interest_rate', 17, 236)                       ('oos', 'fun_fact', 17, 584)
('calendar', 'book_hotel', 16, 406)                      ('car_rental', 'pto_request', 16, 296)                      ('routing', 'transfer', 16, 245)
('pin_change', 'account_blocked', 16, 199)               ('uber', 'book_flight', 16, 464)                            ('book_flight', 'travel_notification', 16, 416)
('how_busy', 'cancel_reservation', 16, 274)              ('bill_due', 'min_payment', 16, 119)                        ('calendar', 'pto_request', 15, 230)
('order_checks', 'interest_rate', 15, 221)               ('car_rental', 'travel_notification', 15, 314)              ('todo_list_update', 'reminder', 15, 259)
('book_flight', 'calendar_update', 15, 497)              ('international_fees', 'timezone', 15, 273)                 ('international_fees', 'credit_limit', 15, 226)
('confirm_reservation', 'book_hotel', 15, 483)           ('calendar_update', 'pto_request', 15, 331)                 ('bill_due', 'bill_balance', 15, 120)
('credit_limit', 'apr', 15, 140)                         ('translate', 'change_language', 14, 218)                   ('international_visa', 'international_fees', 14, 302)
('international_visa', 'timezone', 14, 247)              ('car_rental', 'distance', 14, 384)                         ('uber', 'restaurant_reservation', 14, 356)
('yes', 'no', 14, 75)                                    ('book_flight', 'confirm_reservation', 14, 473)             ('how_busy', 'distance', 14, 357)
('ingredient_substitution', 'cook_time', 14, 486)        ('restaurant_reviews', 'restaurant_reservation', 14, 372)   ('restaurant_reviews', 'book_hotel', 14, 496)
('plug_type', 'timezone', 14, 279)                       ('calculator', 'credit_limit_change', 14, 299)              ('travel_alert', 'timezone', 14, 234)
('timezone', 'distance', 14, 313)                        ('timezone', 'book_hotel', 14, 407)                         ('timezone', 'travel_notification', 14, 245)
('balance', 'transfer', 14, 258)                         ('replacement_card_duration', 'report_lost_card', 14, 193)  ('book_hotel', 'travel_notification', 14, 432)
('calendar', 'book_flight', 13, 400)                     ('share_location', 'text', 13, 353)                         ('car_rental', 'calendar_update', 13, 397)
('todo_list_update', 'shopping_list_update', 13, 381)    ('routing', 'interest_rate', 13, 235)                       ('change_user_name', 'make_call', 13, 161)
('pin_change', 'balance', 13, 247)                       ('rewards_balance', 'credit_limit', 13, 202)                ('schedule_maintenance', 'last_maintenance', 13, 145)
('book_flight', 'travel_suggestion', 13, 418)            ('book_flight', 'restaurant_reservation', 13, 460)          ('international_fees', 'travel_notification', 13, 302)
('damaged_card', 'replacement_card_duration', 13, 287)   ('traffic', 'weather', 13, 328)                             ('restaurant_reviews', 'cancel_reservation', 13, 325)
('account_blocked', 'balance', 13, 234)                  ('new_card', 'application_status', 13, 186)                 ('translate', 'meal_suggestion', 12, 287)
('share_location', 'change_ai_name', 12, 262)            ('exchange_rate', 'credit_limit_change', 12, 263)           ('text', 'make_call', 12, 280)
('insurance', 'insurance_change', 12, 262)               ('car_rental', 'confirm_reservation', 12, 373)              ('shopping_list', 'calories', 12, 267)
('routing', 'direct_deposit', 12, 233)                   ('routing', 'pin_change', 12, 240)                          ('rewards_balance', 'credit_limit_change', 12, 269)
('uber', 'confirm_reservation', 12, 375)                 ('international_fees', 'vaccines', 12, 275)                 ('card_declined', 'spending_history', 12, 280)
('time', 'timezone', 12, 220)                            ('calculator', 'transfer', 12, 296)                         ('meal_suggestion', 'travel_suggestion', 12, 279)
('meal_suggestion', 'vaccines', 12, 254)                 ('calendar', 'car_rental', 11, 300)                         ('calendar', 'confirm_reservation', 11, 307)
('exchange_rate', 'calculator', 11, 308)                 ('order_checks', 'direct_deposit', 11, 225)                 ('order_checks', 'balance', 11, 261)
('report_fraud', 'report_lost_card', 11, 243)            ('car_rental', 'uber', 11, 370)                             ('todo_list_update', 'reminder_update', 11, 300)
('carry_on', 'distance', 11, 384)                        ('update_playlist', 'oos', 11, 666)                         ('uber', 'oos', 11, 604)
('flight_status', 'distance', 11, 312)                   ('book_flight', 'oos', 11, 706)                             ('international_fees', 'credit_limit_change', 11, 299)
('confirm_reservation', 'pto_request', 11, 313)          ('confirm_reservation', 'make_call', 11, 286)               ('recipe', 'restaurant_reviews', 11, 510)
('redeem_rewards', 'apr', 11, 195)                       ('restaurant_reviews', 'restaurant_suggestion', 11, 422)    ('todo_list', 'reminder_update', 11, 245)
('pay_bill', 'balance', 11, 207)                         ('travel_suggestion', 'fun_fact', 11, 312)                  ('travel_suggestion', 'travel_notification', 11, 272)
('travel_suggestion', 'vaccines', 11, 243)               ('restaurant_reservation', 'distance', 11, 382)             ('reminder', 'reminder_update', 11, 167)
('distance', 'replacement_card_duration', 11, 325)       ('distance', 'cancel_reservation', 11, 333)
-------------------------------------------------------  ----------------------------------------------------------  ------------------------------------------------------------
```

That looks decent. We have all these overlapping labels but all of them seem to have sufficient vocab to distinguish from each other on a _one-on-one_ basis.

We can also create unique vocab for each label like so:

```python
In [41]: def create_label_vocab(): 
     ...:     label_vocab = [] 
     ...:     for i in tqdm(range(len(labels))): 
     ...:         alabel = labels[i] 
     ...:         vocab = copy.deepcopy(label_vocab_map[alabel]) 
     ...:         for j in range(i, len(labels)): 
     ...:             otherlabel = labels[j] 
     ...:             if alabel != otherlabel: 
     ...:                 vocab = vocab.difference(label_vocab_map[otherlabel]) 
     ...:         if vocab: 
     ...:             label_vocab.append((alabel, len(vocab))) 
     ...:     return label_vocab 

In [42]: print(tabulate(py_.chunk(sorted(label_vocab, key=lambda el: el[1], reverse=True), 3)))              
----------------------------------  ----------------------------  --------------------------------
('oos', 359)                        ('book_hotel', 260)           ('ingredient_substitution', 242)
('restaurant_suggestion', 230)      ('play_music', 208)           ('cook_time', 195)
('recipe', 189)                     ('accept_reservations', 181)  ('book_flight', 173)
('update_playlist', 172)            ('fun_fact', 168)             ('insurance_change', 164)
('ingredients_list', 156)           ('spelling', 154)             ('restaurant_reviews', 151)
('calendar_update', 149)            ('calculator', 147)           ('definition', 141)
('distance', 136)                   ('transfer', 128)             ('plug_type', 127)
('cancel_reservation', 127)         ('food_last', 126)            ('shopping_list_update', 123)
('traffic', 123)                    ('travel_notification', 122)  ('calories', 120)
('text', 119)                       ('weather', 119)              ('todo_list_update', 116)
('damaged_card', 116)               ('international_fees', 113)   ('directions', 110)
('share_location', 109)             ('vaccines', 107)             ('report_fraud', 105)
('carry_on', 104)                   ('meal_suggestion', 104)      ('application_status', 103)
('replacement_card_duration', 103)  ('exchange_rate', 102)        ('balance', 100)
('credit_limit_change', 99)         ('how_busy', 98)              ('todo_list', 96)
('restaurant_reservation', 95)      ('card_declined', 94)         ('uber', 93)
('reminder_update', 91)             ('spending_history', 90)      ('gas_type', 90)
('rewards_balance', 89)             ('change_ai_name', 89)        ('report_lost_card', 89)
('car_rental', 88)                  ('confirm_reservation', 88)   ('travel_alert', 87)
('routing', 86)                     ('transactions', 85)          ('measurement_conversion', 85)
('interest_rate', 83)               ('timezone', 82)              ('tire_pressure', 81)
('expiration_date', 80)             ('improve_credit_score', 79)  ('lost_luggage', 78)
('time', 78)                        ('min_payment', 77)           ('income', 77)
('international_visa', 76)          ('direct_deposit', 76)        ('pto_request', 75)
('redeem_rewards', 75)              ('change_speed', 75)          ('translate', 74)
('travel_suggestion', 74)           ('flight_status', 72)         ('nutrition_info', 71)
('meeting_schedule', 71)            ('order', 71)                 ('make_call', 71)
('schedule_meeting', 71)            ('jump_start', 69)            ('tell_joke', 69)
('order_checks', 68)                ('pin_change', 67)            ('goodbye', 67)
('whisper_mode', 67)                ('rollover_401k', 66)         ('bill_balance', 66)
('apr', 65)                         ('account_blocked', 63)       ('new_card', 59)
('who_made_you', 56)                ('change_language', 55)       ('change_accent', 55)
('order_status', 54)                ('mpg', 53)                   ('last_maintenance', 52)
('schedule_maintenance', 51)        ('calendar', 50)              ('reset_settings', 50)
('meaning_of_life', 48)             ('current_location', 48)      ('smart_home', 47)
('pto_balance', 47)                 ('insurance', 46)             ('freeze_account', 46)
('pto_request_status', 46)          ('w2', 45)                    ('timer', 45)
('taxes', 44)                       ('cancel', 43)                ('no', 43)
('how_old_are_you', 43)             ('tire_change', 42)           ('shopping_list', 42)
('reminder', 42)                    ('sync_device', 41)           ('greeting', 40)
('thank_you', 40)                   ('pto_used', 40)              ('next_holiday', 39)
('oil_change_how', 39)              ('roll_dice', 39)             ('flip_coin', 37)
('pay_bill', 37)                    ('where_are_you_from', 37)    ('change_user_name', 36)
('date', 36)                        ('alarm', 35)                 ('do_you_have_pets', 35)
('bill_due', 35)                    ('credit_score', 34)          ('change_volume', 34)
('what_are_your_hobbies', 34)       ('gas', 32)                   ('next_song', 31)
('oil_change_when', 29)             ('credit_limit', 29)          ('yes', 26)
('payday', 26)                      ('maybe', 25)                 ('are_you_a_bot', 24)
('what_song', 23)                   ('what_can_i_ask_you', 19)    ('find_phone', 18)
('repeat', 18)                      ('who_do_you_work_for', 10)   ('user_name', 9)
('what_is_your_name', 7)
----------------------------------  ----------------------------  --------------------------------
```
We have a good idea about the vocab that defines a vocab well. Let's see a few examples.

Now let's think about a target sentence, we can build `(1, 3)` ngrams and check if they lie in our filtered vocabulary. Words that don't exist, will get replaced with an `OOV` token.

```python
from nltk.utils import everygrams

def transform(sentence, vocabulary_set, max_ngram=3):
    # preproc (lower case, punctuations, numbers etc)
    transform = []
    for w in everygrams(sentence.split(" "), max_len=max_ngram):
        word = " ".join(w)
        if word in vocabulary_set:
            transform.append(word)
        else:
            transform.append("OOV")
    return transform
```

