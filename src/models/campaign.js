import { DataTypes } from 'sequelize';

export function Campaign(sequelize) {
    return sequelize.define('Campaign', {
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        label: {
            type: DataTypes.STRING,
            allowNull: false
        },
        color: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
};