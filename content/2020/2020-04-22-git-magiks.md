---
date: 2020-04-22
title: "Git log exclude dirs and authors"
cover: "https://picsum.photos/seed/seed_n/500/300"
categories:
    - programming
tags:
    - git
---
Recently I was working on a project where I had to port features from a growing but to-be-marked legacy system. My `git` kung fu hasn't evolved much since I started using it and problems like these seem to be a huge bookkeeping effort.

## Backstory
Assume a repository, any would do. Here we have a certain _dir path_ which gets majority of the commits. I want to get logs between period A (this is when a new repository was born to handle everything but have a lighter code base) to period B (say, today's date). I have a certain `dir` that I can ignore as it doesn't align with the objectives of the new repository.

`git log` accepts a `pathspec` form to exclude directories. Which means you can do:

```shell
git log -p repo_dir ':!repo_dir/path/to/exclude_dir'
```

At this point I could also see the features I have added. I wanted to skip those too. Turns out there is a neat argument for that too.

```shell
git log -p --author='^((?!authorname).*)$' repo_dir ':!repo_dir/path/to/exclude_dir'
```

