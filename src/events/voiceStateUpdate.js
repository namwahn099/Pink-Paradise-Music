
const { Events } = require('discord.js');
const searchSessions = require('../utils/searchSessions');
const { clearGuildLifecycleTimers } = require('../utils/playerLifecycle');

module.exports = {
    name: Events.VoiceStateUpdate,

    async execute(oldState, newState) {
        const client = oldState.client;
        const botId = client.user.id;

        // Handle the bot itself leaving or being disconnected from voice.
        if (oldState.id !== botId) return;

        // The bot has left the voice channel completely.
        if (oldState.channelId && !newState.channelId) {
            const guildId = oldState.guild.id;

            const player = client.lavalink.getPlayer(guildId);
            clearGuildLifecycleTimers(guildId);

            if (player) player.destroy();

            client.playerController.deletePlayer(guildId);
            searchSessions.cleanupGuildSessions(guildId);

            client.activePlayers.delete(guildId);
            client.autoplayEnabled.delete(guildId);
            client.updatePresence();
        }
    },
};

