import Typography from "typography"
import fairyGatesTheme from 'typography-theme-stow-lake'

const typography = new Typography(fairyGatesTheme)
typography.options.googleFonts = [
    {"name": "Playfair Display", "styles": ["700"]},
    {"name": "Crimson Text", "styles": ["400", "400i", "700"]},
    {"name": "Roboto Mono", "styles": ["400", "400i", "700"]}
]
// Hot reload typography in development.
if (process.env.NODE_ENV !== `production`) {
  typography.injectStyles()
}

// Export helper functions
export const { scale, rhythm, options } = typography
export default typography
