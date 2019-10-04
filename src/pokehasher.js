const axios = require('axios')
const { promisify } = require('es6-promisify')
const imageHash = promisify(require('image-hash').imageHash)
const pokedex = require('../data/pokedex.json')
const config = require('../data/config.json')

class Pokehasher {
    constructor(delays, debug = false) {
        this.sendAllowed = true
        this.isActive = false
        this.debug = debug
        this.delays = delays
        this.discordUrl = null
        this.activeTimeout = null
        this.latestPokemon = null

        console.info('Debug mode:', this.debug)
    }

    static async findPokemon(imgUrl) {
        const hash = await imageHash(imgUrl, 16, true)
        for (const pokemon of pokedex)
            if (pokemon.hash === hash) return pokemon.name

        throw new Error(
            `Unable to find Pokemon.
            hash: ${hash}
            url: ${imgUrl}`
        )
    }

    randomDelay() {
        return this.delays[Math.floor(Math.random() * this.delays.length)]
    }

    updateChannelId(url) {
        if (!url.includes('discord'))
            throw new Error('This only works on Discord.')
        if (!url.includes('channels')) throw new Error('No channel selected.')

        const [id] = url.split('/').slice(-1) // get last item of array
        console.info('channel id changed:', id)

        this.discordUrl = `https://discordapp.com/api/v6/channels/${id}/messages`
    }

    sendMessage(message) {
        if (this.debug) return console.log('Debug:', message)
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
        }, this.randomDelay())
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
        if (!this.isActive) return

        if (this.activeTimeout) clearTimeout(this.activeTimeout)
        this.activeTimeout = setTimeout(() => {
            this.toggleActive()
        }, duration)

        console.info('Temporarily disabled while switching channels')
        this.toggleActive()
    }
}

module.exports = Pokehasher
