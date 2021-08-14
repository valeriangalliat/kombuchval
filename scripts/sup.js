const fs = require('fs').promises
const path = process.argv[2]

function diff (now, since) {
  const totalHours = (now - since) / 1000 / 60 / 60
  const days = Math.floor(totalHours / 24)
  const hours = Math.round(totalHours % 24)

  return { days, hours }
}

function format (days, hours) {
  if (days < 1) {
    return hours === 1 ? '1 hour' : `${hours} hours`
  }

  return (days === 1 ? '1 day, ' : `${days} days, `) + format(0, hours)
}

async function main () {
  const data = await fs.readFile(path, 'utf8')
  const lines = data.split('\n')
  const meta = {}

  for (const line of lines) {
    if (line.startsWith('* ')) {
      const [_, key, value] = line.split('**')
      meta[key.slice(0, -1).toLowerCase()] = value.trim() || null
    }
  }

  const now = Date.now()
  let since
  let status = 'nothing to do!'

  if (!meta.fermenting) {
    since = 'brewing'
  } else if (!meta.bottling) {
    since = 'fermenting'
  } else if (!meta.chilling) {
    since = 'bottling'
  } else {
    return
  }

  const { days, hours } = diff(now, Date.parse(meta[since]))

  switch (since) {
    case 'brewing':
      if (days > 0 || hours >= 8) {
        status = 'ready to ferment'
      }

      break
    case 'fermenting':
      if (days > 8) {
        status = 'bottle soon?'
      }

      break
    case 'bottling':
      if (days > 2) {
        status = 'chill soon'
      }

      break
  }

  console.log(`${format(days, hours)} since ${since}, ${status}`)
}

main()
