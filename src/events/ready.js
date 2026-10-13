const { Events, ChannelType } = require('discord.js');
const { generateInviteUrl } = require('../utils/inviteUrl');
const deployCommands = require('../utils/commandDeployer');
const logger = require('../utils/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        logger.info(`Bot ready as ${client.user.tag}`);

        await deployCommands(client);

        await client.lavalink.init({ ...client.user });
        logger.info('Lavalink initialized');

        const inviteUrl = generateInviteUrl(client.user.id);
        logger.info(`Invite URL: ${inviteUrl}`);

        client.user.setActivity(null);

        // Reconnect to the configured voice channel after startup.
        const guildId = process.env.VOICE_GUILD_ID;
        const voiceChannelId = process.env.VOICE_CHANNEL_ID;
        const textChannelId = process.env.VOICE_TEXT_CHANNEL_ID;

        if (!guildId || !voiceChannelId || !textChannelId) {
            logger.warn(
                'Auto voice connection skipped: VOICE_GUILD_ID, VOICE_CHANNEL_ID, or VOICE_TEXT_CHANNEL_ID is missing.'
            );
            return;
        }

        try {
            const guild = await client.guilds.fetch(guildId);
            const voiceChannel = await guild.channels.fetch(voiceChannelId);
            const textChannel = await guild.channels.fetch(textChannelId);

            if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
                logger.error('Auto voice connection failed: configured voice channel was not found or is not a voice channel.');
                return;
            }

            if (!textChannel || !textChannel.isTextBased()) {
                logger.error('Auto voice connection failed: configured text channel was not found or is not a text channel.');
                return;
            }

            let player = client.lavalink.getPlayer(guildId);

            if (!player) {
                player = client.lavalink.createPlayer({
                    guildId,
                    voiceChannelId,
                    textChannelId,
                    selfDeaf: true,
                    selfMute: false,
                    volume: 80,
                });
            }

            if (!player.connected) {
                await player.connect();
            }

            logger.info(`Auto voice connection requested for channel ${voiceChannel.name}`);
        } catch (error) {
            logger.error('Auto voice connection failed:', error);
        }
    },
};

