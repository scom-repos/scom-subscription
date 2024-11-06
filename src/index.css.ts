import { Styles } from "@ijstech/components";

export const inputStyle = Styles.style({
  $nest: {
    '> input': {
      textAlign: 'right'
    }
  }
})

export const linkStyle = Styles.style({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'block',
  cursor: 'pointer',
  $nest: {
    '*': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      width: '100%',
    },
  }
})