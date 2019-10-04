const { promisify } = require('util')
const fs = require('fs')
const imageHash = promisify(require('image-hash').imageHash)
const pokedex = require('./data/pokedex.json')

async function addOne(name, url) {
    const hash = await imageHash(url, 16, true)

    pokedex.push({ name, hash })

    fs.writeFileSync('./data/pokedex.json', JSON.stringify(pokedex), 'utf8')

    console.log(`
Added:
${name}
${hash}`)
}

async function updateOne(name, url) {
    let [found] = pokedex.filter(pokemon => {
        return pokemon.name == name.toLowerCase()
    })

    if (!found) throw new Error('No pokemon with that name.')

    const hash = await imageHash(url, 16, true)
    found.hash = hash

    fs.writeFileSync('./data/pokedex.json', JSON.stringify(pokedex), 'utf8')
    console.log(`
Updated:
${name}
${hash}`)
}

function removeOne(name) {
    const pokedex = require('./data/pokedex.json')
    let newDex = pokedex.filter(pokemon => {
        return pokemon.name != name.toLowerCase()
    })

    fs.writeFileSync('./data/pokedex.json', JSON.stringify(newDex), 'utf8')
    console.log(`
Removed:
${name}`)
}

function checkDuplicateHashes() {
    const arr = []
    let count = 0
    for (const pokemon of pokedex) {
        if (!arr.includes(pokemon.hash)) {
            arr.push(pokemon.hash)
        } else {
            console.log(`Duplicate found: ${pokemon.name}`)
            count += 1
        }
    }

    console.log('Total duplicates:', count)
}

const args = process.argv

if (args.includes('-a')) {
    addOne(args[3], args[4]).catch(console.error)
}

if (args.includes('-u')) {
    updateOne(args[3], args[4]).catch(console.error)
}

if (args.includes('-r')) {
    let [, , , ...toDelete] = args
    console.log(toDelete)
    toDelete.forEach(pokemon => removeOne(pokemon))
}

if (args.includes('-c')) {
    checkDuplicateHashes()
}

if (args[2] == '-h' || args[2] == '--help' || args.length < 3)
    console.log(`
Commands:
    -a <name> <url>: add a pokemon
    -u <name> <url>: update an existing pokemon
    -c: check for duplications`)
