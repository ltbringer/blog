import React from 'react'
import { Link } from 'gatsby'
import styles from './PostsListing.module.scss'
import PostTags from '../components/PostTags'
import postStyles from '../components/PostTags.module.scss'
import { randomInt } from '../utils/random'

const PostListing = ({ postEdges }) => {
  const getPostList = () => {
    const postList = []
    postEdges.forEach((postEdge, i) => {
      postList.push({
        path: postEdge.node.fields.slug,
        tags: postEdge.node.frontmatter.tags,
        categories: postEdge.node.frontmatter.categories,
        cover: postEdge.node.frontmatter.cover.replace(/seed_n/, i + randomInt(100, 200)),
        title: postEdge.node.frontmatter.title,
        date: postEdge.node.fields.date,
        excerpt: postEdge.node.excerpt,
        timeToRead: postEdge.node.timeToRead
      })
    })
    return postList
  }

  const postList = getPostList()
  return (
    <div className={styles.articleList}>
      {/* Your post list here. */
      postList.map(post => (
        <Link to={post.path} key={post.title}>
          <article className={styles.articleBox}>
            <div className={styles.right}>
              <h3>{post.title}</h3>
              <img src={post.cover} />
              <div className={styles.meta}>
                {post.date} &mdash; <span>{post.categories.join(' / ')}</span>{' '}
                &mdash; {post.timeToRead} Min Read{' '}
              </div>
              <p>{post.excerpt}</p>
              <div className={postStyles.postMeta}>
                <PostTags tags={post.tags} />
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  )
}

export default PostListing
