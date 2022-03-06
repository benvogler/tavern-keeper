export async function countcampaigns(interaction) {

    await interaction.deferReply({ephemeral: true});

    const { guild } = interaction;
    const memberIds = [];
    const dmIds = [];
    await guild.members.fetch(null, {force: true})
    const roles = await guild.roles.fetch(null, {force: true});
    const playerRoles = roles.filter(role => role.name.endsWith(' Players'));
    const dmRoles = roles.filter(role => role.name.endsWith(' DM'));
    let campaignCount = 0;

    playerRoles.forEach(role => {
        const members = role.members.filter(member => !memberIds.includes(member.id));
        memberIds.push(...members.map(member => member.id));
        campaignCount++;
    });

    dmRoles.forEach(role => {
        const dms = role.members.filter(member => !dmIds.includes(member.id));
        dmIds.push(...dms.map(member => member.id));
    });

    const dmCount = dmIds.length;
    const memberCount = memberIds.filter(memberId => !dmIds.includes(memberId)).length;

    await interaction.editReply({
        ephemeral: true,
        content: `Let's see... According to the job board, there's currently:\n${campaignCount} campaigns being run by ${dmCount} DMs, with ${memberCount} unique players`
    });
}