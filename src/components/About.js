import React from 'react'
import styles from './About.module.scss'
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
      I am a self taught developer and as my profession I build software that assists machine learning projects. That is fun sometimes, actually it is fun all those times when I can let loose and anything goes to solve the task at hand. I have taught myself javascript and python. I also keep myself open to affairs with other languages and on that front I am learning Rust, Scala and Scheme.</p>
    <p>Apart from programming languages, I find natural languages interesting, the way so much can be conveyed using sounds and symbols to a trained mind, which bears no meaning for the untrained. I also like how languages have an aspect of psychology to them. I have heard the elderly say "it feels like home...", "seemed trustworthy...", "I knew I don't have to worry..." all because someone spoke to them in their native tongue. You can conjure inspiration, faith, courage, deciet, sadness, anger with symbols and sounds but you can't teach it to a machine. It was a bother until I decided to put myself in the machines' shoes. I learned languages aren't easy to learn, and I am a human being.</p>
    <p>I see programming as a means to talk to machines. It saddens me a little because it's relegated to the status of <span style={{"fontStyle": "italic"}}>just a job</span>, and <span style={{"fontStyle": "italic"}}>there is nothing special about it.</span> While all this can really be depressing to go on, luckily I find my inspiration in Biology. The leeway a Doctor gets is far stricter on top of which resides conscience. They don't get to "Oh I forgot about that open valve, I'll patch tomorrow." but more than that the inspiration comes from the discoveries about the body and the mind leave me in pure awe of nature. Is all life coincidence? a self replicating, self healing compound called DNA just happened to form froth on rocks? and from there we move on to complex features like senses, perception, control, motion, emotion, practice, immunity, intelligence and instincts.</p>
    <p>A few have tried an attempt at the origin. A lot has been found and understood. A lot still remains.</p>
    <blockquote><span style={{"fontStyle": "italic"}}><a href="https://www.youtube.com/watch?v=IyLgrKRdMg8">Perhaps the archives are incomplete.</a></span><br/>
    </blockquote>
    <img src="https://images.pexels.com/photos/1582782/pexels-photo-1582782.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"/>
  </>
)

export default About
