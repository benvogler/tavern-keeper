import { DataTypes } from 'sequelize';

export function User(sequelize) {
    return sequelize.define('User', {
        discordId: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
};