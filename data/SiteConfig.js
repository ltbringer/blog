const config = {
  siteTitle: 'ltbringer/blog', // Site title.
  siteTitleShort: 'ltbringer', // Short site title for homescreen (PWA). Preferably should be under 12 characters to prevent truncation.
  siteTitleAlt: 'ltbringer/blog', // Alternative site title for SEO.
  siteLogo: '/logos/logo-1024.png', // Logo used for SEO and manifest.
  siteUrl: 'https://ltbringer.github.io', // Domain of your website without pathPrefix.
  pathPrefix: '/blog', // Prefixes all links. For cases when deployed to example.github.io/gatsby-advanced-starter/.
  siteDescription:
    'Programming|Art|Readings|Experiments.', // Website description used for RSS feeds/meta description tag.
  siteRss: '/rss.xml', // Path to the RSS file.
  siteFBAppID: '', // FB Application ID for using app insights
  googleAnalyticsID: '', // GA tracking ID.
  dateFromFormat: 'YYYY-MM-DD', // Date format used in the frontmatter.
  dateFormat: 'DD/MM/YYYY', // Date format for display.
  userName: 'Amresh Venugopal', // Username to display in the author segment.
  userEmail: 'oilyfood@protonmail.com', // Email used for RSS feed's author segment
  userTwitter: 'amreshVenugopal', // Optionally renders "Follow Me" in the Bio segment.
  userGitHub: 'ltbringer', // Optionally renders "Follow Me" in the Bio segment.
  userLocation: 'Bengaluru, India', // User location to display in the author segment.
  userAvatar: 'https://en.gravatar.com/userimage/98336504/0b970a90b5c7b72a55ac285fa3711195.jpg', // User avatar to display in the author segment.
  userDescription: "", // User description to display in the author segment.
  copyright: 'Copyright © 2020. All rights reserved.', // Copyright string for the footer of the website and RSS feed.
  themeColor: '#c62828', // Used for setting manifest and progress theme colors.
  backgroundColor: 'red' // Used for setting manifest background color.
}

// Validate

// Make sure pathPrefix is empty if not needed
if (config.pathPrefix === '/') {
  config.pathPrefix = ''
} else {
  // Make sure pathPrefix only contains the first forward slash
  config.pathPrefix = `/${config.pathPrefix.replace(/^\/|\/$/g, '')}`
}

// Make sure siteUrl doesn't have an ending forward slash
if (config.siteUrl.substr(-1) === '/')
  config.siteUrl = config.siteUrl.slice(0, -1)

// Make sure siteRss has a starting forward slash
// if (config.siteRss && config.siteRss[0] !== "/")
//   config.siteRss = `/${config.siteRss}`;

module.exports = config
