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
      I am a self taught developer and as my profession I build software that assists machine learning projects. That is fun sometimes, actually it is fun all those times when I can let loose and anything-goes to solve the task at hand. I've taught myself javascript and python a few years ago. I also keep myself open to affairs with other languages and on that front I am learning Rust, Scala and Scheme.</p>
    <p>Apart from programming languages, I find natural languages interesting, the way so much can be conveyed using sounds and symbols to a trained mind, which bears no meaning for the untrained. I also like how languages have an aspect of psychology to them. I have heard the elderly say "it feels like home...", "seemed trustworthy...", "I knew I don't have to worry..." all because someone spoke to them in their native tongue. You can conjure inspiration, faith, courage, deciet, sadness, anger with symbols and sounds but you can't teach it to a machine. It was a bother until I decided to put myself in the machines' shoes. I learned languages aren't easy to learn, and I am a human being.</p>
    <p>A lot of my inspiration comes from the discoveries about the body and the mind. They leave me in pure awe of and respect for nature. Is all life coincidence? a self replicating, self healing compound called DNA just happened to form froth on rocks? and from there we move on to complex features like perception, control, emotion, immunity, intelligence and instincts. All of this happened without any reason?</p>
    <p>The concept of life and death leave me at a loss for expression. I find it particularly difficult to behave when someone passes away. Events like that sprouted some seeds in childhood that have reared their heads now when I am 27. Death felt fair at times. <span style={{"fontStyle": "italic"}}>The old wither today so the young could blossom tomorrow.</span> But there were times where it felt wasteful that years of experience, knowledge, memories, emotions ...a consciousness, that will be no more. The best one can do now is live within books. <span style={{"fontStyle": "italic"}}>Let your life forever be a part of a curious mind.</span> Then again, there is only so much you can write. Good material takes years of work. There seems to be no better way for a child other than to start with knowing nothing, even reading has to be learned.</p>

    <p>I have read that the secret to the success of human race is tied to this emptiness of mental space and also language but it's possibly related. A human child is born without connections fully formed in the brain. While a new-born horse can gallop within hours of being born. The human child stays majorly helpless for years. The emptiness allows survival, a choice to learn the environment, against being born with knowledge enough to last a lifetime. Nature has already tried passing information to children it doesn't seem to work as good as the emptiness of the human child. I wonder if something can be done here, a middle path that nature is yet to unlock? I know little about the origin, little even from the standard of books. So I try to learn how is it that we think? why is it that we feel? what makes us <span style={{"fontStyle": "italic"}}>us</span>?</p>

    <p>
      There aren't any easy answers to these questions but would the answers be useful? If we knew what makes us conscious, could we challenge the hand of nature? Could we rewrite the origin?</p>

    <p> A few have tried an attempt at the origin. A little has been found and understood, a lot still remains.</p>
    <blockquote><span style={{"fontStyle": "italic"}}><a href="https://www.youtube.com/watch?v=IyLgrKRdMg8">Perhaps the archives are incomplete.</a></span><br/>
    </blockquote>
    <img src="https://images.pexels.com/photos/1582782/pexels-photo-1582782.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"/>
  </>
)

export default About
