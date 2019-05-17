const axios = require('axios')
const { promisify } = require('es6-promisify')
const imageHash = promisify(require('image-hash').imageHash)
const pokedex = require('../data/pokedex.json')
const config = require('../data/config.json')

class Pokehasher {
    constructor(delays) {
        this.sendAllowed = true
        this.isActive = false
        this.delays = delays
        this.discordUrl = null
        this.activeTimeout = null
        this.latestPokemon = null
    }

    static async findPokemon(imgUrl) {
        const hash = await imageHash(imgUrl, 16, true)
        for (const pokemon of pokedex)
            if (pokemon.hash === hash) return pokemon.name

        const notFoundError = new Error('Unable to find Pokemon.')
        notFoundError.info = { hash, imgUrl }
        throw notFoundError
    }

    updateChannelId(url) {
        if (!url.includes('discord'))
            throw new Error('This only works on Discord.')
        if (!url.includes('channels')) throw new Error('No channel selected.')

        const [id] = url.split('/').slice(-1) // get last item of array
        console.info('channel id changed:', id)

        this.discordUrl = `https://discordapp.com/api/v6/channels/${id}/messages`
    }

    sendMessage(message, debug = false) {
        if (debug) return console.log('Debug:', message)
        if (!this.sendAllowed) return

        setTimeout(() => {
            axios.post(
                this.discordUrl,
                { content: message },
                {
                    headers: {
                        authorization: config.token,
                        'Content-Type': 'application/json'
                    }
                }
            )
        }, this.delay)
    }

    preventSpam(duration) {
        if (!this.sendAllowed) return

        this.sendAllowed = false
        console.info(`Spam prevention started for ${duration / 1000} seconds.`)

        setTimeout(() => {
            this.sendAllowed = true
            console.info('Spam prevention finished.')
        }, duration)
    }

    toggleActive() {
        if (this.isActive) {
            this.isActive = false
            chrome.browserAction.setIcon({
                path: '../icons/icon32dull.png'
            })
        } else {
            this.isActive = true
            chrome.browserAction.setIcon({ path: '../icons/icon32.png' })
        }

        console.info('Active:', this.isActive)
    }

    tempDisable(duration) {
        if (this.activeTimeout) clearTimeout(this.activeTimeout)
        this.activeTimeout = setTimeout(() => {
            this.toggleActive()
        }, duration)

        if (!this.isActive) return
        console.info('Temporarily disabled while switching channels')
        this.toggleActive()
    }
}

module.exports = Pokehasher
