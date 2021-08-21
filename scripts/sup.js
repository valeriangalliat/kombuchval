const fs = require('fs').promises
const batches = process.argv.slice(2)

function diff (now, since) {
  const totalHours = (now - since) / 1000 / 60 / 60
  const days = Math.floor(totalHours / 24)
  const hours = Math.round(totalHours % 24)

  return { days, hours }
}

function format ({ days, hours }) {
  if (days < 1) {
    return hours === 1 ? '1 hour' : `${hours} hours`
  }

  return (days === 1 ? '1 day, ' : `${days} days, `) + format({ days: 0, hours })
}

async function processBatch (path) {
  const data = await fs.readFile(path, 'utf8')
  const lines = data.split('\n')
  const meta = {}

  for (const line of lines) {
    if (line.startsWith('* ')) {
      const [, key, value] = line.split('**')
      meta[key.slice(0, -1).toLowerCase()] = value.trim() || null
    }
  }

  const now = Date.now()
  let currentState
  let nextState

  if (!meta.fermenting) {
    currentState = 'brewing'
  } else if (!meta.bottling) {
    currentState = 'fermenting'
  } else if (!meta.chilling) {
    currentState = 'bottling'
  } else {
    return
  }

  const { days, hours } = diff(now, Date.parse(meta[currentState]))

  switch (currentState) {
    case 'brewing':
      if (days > 0 || hours >= 8) {
        nextState = 'fermenting'
      }

      break
    case 'fermenting':
      if (days > 8) {
        nextState = 'bottling'
      }

      break
    case 'bottling':
      if (days > 2) {
        nextState = 'chilling'
      }

      break
  }

  return {
    path,
    meta,
    diff: { days, hours },
    currentState,
    nextState
  }
}

async function main () {
  const buckets = {
    fermenting: [],
    bottling: [],
    chilling: []
  }

  const suggestion = {
    fermenting: 'ready to ferment',
    bottling: 'bottle soon?',
    chilling: 'chil soon',
    undefined: 'nothing to do!'
  }

  for (const path of batches) {
    const status = await processBatch(path)

    console.log(`${status.path}: [${status.meta.color}] ${format(status.diff)} since ${status.currentState}, ${suggestion[status.nextState]}`)
  }
}

main()
