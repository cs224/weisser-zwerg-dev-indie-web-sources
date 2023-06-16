---
layout: "layouts/post-with-toc.njk"
title: "Find Version Tag for Latest Docker Image"
description: "If you use docker tags like latest you sometimes want to know which version tag it corresponds to."
creationdate: 2023-06-16
keywords: docker,docker-hub,skopeo,regctl
date: 2023-06-16
tags: ['post']
draft: false
---

## Rational

If you’ve ever used Docker, you’ve probably used the `latest` Docker image tag. Sometimes you read recommendations that you should not do this,
because it can cause problems down the road. But there may be good reasons for doing this. For example, I am running [Home
Assistant](https://www.home-assistant.io/) via the image reference `ghcr.io/home-assistant/home-assistant:stable`, so that I can update[^imgupd] the
image when a new version becomes available. For [Home Assistant](https://www.home-assistant.io/) there are other ways to find out which current verion
is running, but just to make the point that using tags like `latest` has its valid use cases.

The problems start to appear after some time passes (let's say some months) and the `latest` tag does not correspond to the current latest version tag
any longer and you would like to know which version you currently have running. You might want to do that so that you can estimate the probability for
upgrade issues or for figuring out a valid upgrade path. Or you might want to do it after the fact after you ran into problems after the upgrade and
you would like to know which tag to use to to roll back to your previous working version.

There are several pieces of information out there on how to to this reverse mapping, but none of them are satisfactory. Here are only two that I
looked at:

* [Find Version Tag for Latest Docker Image](https://ryandaniels.ca/blog/find-version-tag-latest-docker-image/)
* [How do I check if my local docker image is outdated, without pushing from somewhere else?](https://stackoverflow.com/questions/42137511/how-do-i-check-if-my-local-docker-image-is-outdated-without-pushing-from-somewh/64309017)

For the impatient readers among you looking at the following [Jupyter notebook](https://nbviewer.org/gist/cs224/b67f985f9c807c4b4c6ab6dea4bbf41d)
might provide all the information you need.

## Getting started

I've created a [Jupyter Notebook](https://jupyter.org) that does the job. It calls the external command
[regctl](https://github.com/regclient/regclient) that you will need to install first.


## Find the version tag that corresponds to your local docker image

For this example I am using the Home Assistant `stable` image:

```python
image = 'ghcr.io/home-assistant/home-assistant:stable'
image_base = 'ghcr.io/home-assistant/home-assistant'
```

The first step consists of getting the available tags for your `image_base`:

```python
def get_image_tags(image_ref, pattern=r'^.*$'):
    cmd = f'regctl tag ls {image_ref}'
    cmd = [itm for itm in cmd.split(' ') if itm != '']
    result = run_cmd(cmd).strip()
    result = result.split('\n')
    result = [r for r in result if re.match(pattern, r)]
    return result
```

The output might contain a lot of tags that you are not really interested in:

```python
get_image_tags(image_base)[-50:]

['2023.6.0.dev20230530',
 '2023.6.0.dev20230531',
 '2023.6.0b0',
 '2023.6.0b1',
 ...
 '2023.6.0b5',
 '2023.6.0b6',
 '2023.6.1',
 '2023.6.2',
 '2023.7.0.dev20230601',
 '2023.7.0.dev20230602',
 ...
 '2023.7.0.dev20230615',
 '2023.7.0.dev20230616',
 'beta',
 'dev',
 'latest',
 'rc',
 'stable']
```

Therefore, it may make sense that you filter the tag list via a regex pattern like:

```python
get_image_tags(image_base, pattern=r'^\d\d\d\d\.\d+\.\d+$')[-50:]
['2022.8.1',
 '2022.8.2',
 ...
 '2023.6.0',
 '2023.6.1',
 '2023.6.2']
```

The other reason why it makes sense to filter the tags is that the next step is a slow process as it needs to call the docker registry API iteratively
several times.

Once you have that you can generate the digest overview:

```python
ldf = generate_docker_image_overview(image_base, tag_pattern=r'^\d\d\d\d\.\d+\.\d+$', tag_limit=10)
```

You can see the output at the bottom of the [notebook](https://nbviewer.org/gist/cs224/b67f985f9c807c4b4c6ab6dea4bbf41d).

You may store this output as an excel for later use, too.

Once you have this digest overview you need to find out which digest your local docker image is using. You can do this via `docker image ls --digests`
on the machine where your docker image is running. The output may look as follows:

```sh
docker image ls --digests

REPOSITORY                              TAG          DIGEST                                                                    IMAGE ID       CREATED        SIZE
ghcr.io/home-assistant/home-assistant   stable       sha256:d1dadb8e6ae23c76875c24b72c7af85cbf0e35fd0f6fbfdb27f6ec56741bb7b9   b47dfdcdb2f9   7 days ago     1.75GB
```

Finally you take a part of the digest and look for it in your digest overview:

```python
repo_digest_part = 'd1dadb8e6'
ldf[ldf['digest'].str.contains(repo_digest_part)]
```

And you receive the answer in the `tag` column of the pandas dataframe: `2023.6.1`.

## Conclusion

I agree with many authors that you should avoid using tags like `latest` if you can, but sometimes you can't. In those cases the above procedure might
come in handy if you need to later find out which image you have running.

Please leave comments and suggestions below if you have any.

## Footnotes

[^imgupd]: There are tools like [Watchtower](https://containrrr.dev/watchtower/) or [Diun](https://crazymax.dev/diun) that may support you with the
    docker image update process.
