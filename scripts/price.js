const fs = require('fs').promises

const path = process.argv[2]
const containerMl = Number(process.argv[3])

const pricePerKg = {
  orangePekoe: 1651,
  peppermint: 5000,
  sugar: 150,
  yerbaMate: 3083
}

const kgUnits = {
  g: 1000
}

const recipeMlUnits = {
  gallon: 3500 // After removing SCOBY
}

const pricePerContainer = {
  500: 400,
  750: 500,
  1000: 600, // Boston would be 500
  1893: 800 // Clear would be 700
}

async function main () {
  const data = await fs.readFile(path, 'utf8')
  const lines = data.split('\n')
  const ingredients = []
  let recipeSizeMl

  for (const line of lines) {
    if (line.startsWith('* ')) {
      const [, quantity, unit, ...rest] = line.split(' ')
      let name = rest[0]

      for (const part of rest.slice(1)) {
        name += part.slice(0, 1).toUpperCase() + part.slice(1)
      }

      ingredients.push({
        name,
        quantity: Number(quantity),
        unit
      })
    } else if (line.startsWith('## ') && line.includes('Ingredients')) {
      const [quantity, unit] = line.split('(').pop().split(')').shift().split(' ')

      if (!(unit in recipeMlUnits)) {
        throw new Error(`Unknown recipe batch size unit: ${unit}`)
      }

      recipeSizeMl = Number(quantity) * recipeMlUnits[unit]
    }
  }

  if (!recipeSizeMl) {
    throw new Error('Could not identify recipe batch size')
  }

  const batchPrice = ingredients.reduce((total, { name, quantity, unit }) => {
    if (!(name in pricePerKg)) {
      throw new Error(`Unknown ingredient: ${name}`)
    }

    if (!(unit in kgUnits)) {
      throw new Error(`Unknown unit: ${unit}`)
    }

    const price = pricePerKg[name] * quantity / kgUnits[unit]

    return total + price
  }, 0)

  const markupPricePerGallon = 2000
  const totalBatchPrice = ((recipeMlUnits.gallon / recipeSizeMl) * markupPricePerGallon) + batchPrice
  const basePrice = (containerMl / recipeSizeMl) * totalBatchPrice

  let discount = 0

  if (containerMl < 1000) {
    discount = -12.5 / (containerMl / 1000)
  } else {
    discount = Math.min(20, 5 * ((containerMl - 1000) / 1000))
  }

  const finalPrice = basePrice - ((discount / 100) * basePrice)

  function _ (number) {
    return (number / 100).toFixed(2)
  }

  const roundedPrice = (Math.round((finalPrice / 100) * 2) / 2).toFixed(2)
  const deposit = pricePerContainer[containerMl]

  console.log(`Base price: ${_(basePrice)}
Container discount: ${discount}%
Final price: ${_(finalPrice)}
Rounded price: ${roundedPrice}
Deposit suggestion: ${_(deposit)}`)
}

main()
