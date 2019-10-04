const Pokehasher = require('./pokehasher')

const delays = [1000, 1000, 1250]
const pokehash = new Pokehasher(delays)

// On Pokemon spawn
chrome.webRequest.onBeforeRequest.addListener(
    req => {
        if (
            req.url.includes('PokecordSpawn.jpg') &&
            pokehash.discordUrl &&
            pokehash.isActive &&
            pokehash.latestPokemon !== req.url.split('?')[0]
        ) {
            [pokehash.latestPokemon] = req.url.split('?')
            Pokehasher.findPokemon(pokehash.latestPokemon)
                .then(found => {
                    pokehash.sendMessage(`p!catch ${found}`)
                    pokehash.preventSpam(5000)
                })
                .catch(console.error)
        }
    },
    { urls: ['<all_urls>'] }
)

// On channel swap
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (
        changeInfo.url &&
        changeInfo.url.includes('discord') &&
        changeInfo.url.includes('channels')
    ) {
        pokehash.tempDisable(10000)
        pokehash.updateChannelId(changeInfo.url)
    }
})

// On icon press
chrome.browserAction.onClicked.addListener(() => {
    if (pokehash.isActive) return pokehash.toggleActive()

    chrome.tabs.query({ active: true }, tabs => {
        const url = tabs[0].url
        try {
            pokehash.updateChannelId(url)
            pokehash.toggleActive()
        } catch (error) {
            console.error(error.message)
        }
    })
})
