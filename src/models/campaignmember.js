import { DataTypes } from 'sequelize';

export function CampaignMember(sequelize) {
    return sequelize.define('CampaignMember', {
        isDM: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    });
};