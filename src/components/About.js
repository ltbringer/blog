import React from 'react'
import styles from './Bio.module.scss'
import config from '../../data/SiteConfig'

const About = () => (
  <>
    <img
      className={styles.avatar}
      src={config.userAvatar}
      alt={config.userName}
    />
    <h3 style={{"margin-bottom": "0.2rem"}}>{config.userName} | {config.userLocation}</h3>
    <h4 style={{"margin-top":"0.2rem", "margin-bottom": "1rem"}}>{config.userEmail}</h4>
    <p>
      {config.userDescription}
      {` `}
    </p>
  </>
)

export default About
