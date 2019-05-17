const axios = require('axios')
const { imageHash } = require('image-hash')
const pokedex = require('../data/pokedex.json')
const config = require('../data/config.json')

let isActive = false
let latestPokemon
let discordUrl
let waitTimer
const delays = [1000, 1500]

// Updates "discordUrl" from link
function updateChannelId(url) {
    const splitUrl = url.split('/')
    const id = splitUrl[splitUrl.length - 1]

    console.info('channel id changed:', id)

    discordUrl = `https://discordapp.com/api/v6/channels/${id}/messages`
}

// Send message to discord
function sendMessage(message, delay) {
    setTimeout(() => {
        axios.post(
            discordUrl,
            { content: message },
            {
                headers: {
                    authorization: config.token,
                    'Content-Type': 'application/json'
                }
            }
        )
    }, delay)
}

// Find Pokemon
function findPokemon(url) {
    return new Promise((resolve, reject) => {
        imageHash(url, 16, true, (err, hash) => {
            if (err) reject(err)

            for (const pokemon of pokedex)
                if (pokemon.hash === hash) return resolve(pokemon.name)

            reject({ hash, url })
        })
    })
}

// Toggle script
function toggleActive() {
    if (isActive) {
        isActive = false
        chrome.browserAction.setIcon({
            path: 'icons/icon32dull.png'
        })
    } else {
        isActive = true
        chrome.browserAction.setIcon({ path: 'icons/icon32.png' })
    }

    console.log('Active:', isActive)
}

// On Pokemon spawn
chrome.webRequest.onBeforeRequest.addListener(
    req => {
        if (
            req.url.includes('PokecordSpawn.jpg') &&
            req.url !== latestPokemon &&
            discordUrl &&
            isActive
        ) {
            [latestPokemon] = req.url.split('?')

            findPokemon(latestPokemon)
                .then(found =>
                    sendMessage(
                        `p!catch ${found}`,
                        delays[Math.floor(Math.random() * delays.length)]
                    )
                )
                .catch(data => console.log('Not Found.', data))
        }
    },
    { urls: ['<all_urls>'] }
)

// On channel swap
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url) {
        if (changeInfo.url.includes('discord')) {
            clearTimeout(waitTimer)
            if (isActive) {
                isActive = false
                chrome.browserAction.setIcon({
                    path: 'icons/icon32dull.png'
                })
                console.info('Temporary disable while switching channels')

                waitTimer = setTimeout(() => {
                    toggleActive()
                }, 5000)
            }

            updateChannelId(changeInfo.url)
        }
    }
})

// On icon press
chrome.browserAction.onClicked.addListener(() => {
    toggleActive()

    chrome.tabs.query({ active: true }, tabs => {
        updateChannelId(tabs[0].url)
    })
})
