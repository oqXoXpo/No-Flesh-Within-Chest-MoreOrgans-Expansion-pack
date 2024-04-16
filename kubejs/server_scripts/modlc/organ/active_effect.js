// priority: 10
const playerAttributeMap = new Map();

/**
 * 全局函数，用于更新玩家的激活效果状态
 * @param {Internal.Player} player 
 */

global.updatePlayerActiveStatus = player => {
    let typeMap = getPlayerChestCavityTypeMap(player);
    let uuid = String(player.getUuid());
    let attributeMap = new Map();
    $ChestCavityUtil.evaluateChestCavity(player.getChestCavityInstance())
    player.persistentData.putInt(resourceCountMax, defaultResourceMax)
    // 激活状态根据Tag区分并遍历可以用于激活的器官方法
    if (typeMap.has('kubejs:active')) {
        typeMap.get('kubejs:active').forEach(organ => {
            organActiveStrategies[organ.id](player, organ, attributeMap)
        })
    }
    let onlySet = new Set()
    if (typeMap.has('kubejs:active_only')) {
        typeMap.get('kubejs:active_only').forEach(organ => {
            if (!onlySet.has(organ.id)) {
                onlySet.add(organ.id)
                organActiveOnlyStrategies[organ.id](player, organ, attributeMap)
            }
        })
    }
    playerAttributeMap.set(uuid, attributeMap);
    attributeMap.forEach((value, key, map) => {
        player.modifyAttribute(global.ATTRIBUTE_MAP[key].key, key, value, global.ATTRIBUTE_MAP[key].operation);
    })
    let maxResourceCount = player.persistentData.getInt(resourceCountMax) ?? defaultResourceMax
    updateResourceMaxCount(player, maxResourceCount)
}

/**
 * 获取玩家属性表
 * @param {Internal.Player} player 
 * @returns {Map}
 */

function getPlayerAttributeMap(player) {
    let uuid = String(player.getUuid());
    if (playerAttributeMap.has(uuid)) {
        return playerAttributeMap.get(uuid);
    }
    return new Map();
}

/**
 * 设置玩家属性表
 * @param {Internal.player} player 
 * @param {Map} attriMap 
 */
function setPlayerAttributeMap(player, attriMap) {
    let uuid = String(player.getUuid());
    playerAttributeMap.set(uuid, attriMap)
}


/**
 * 清除玩家所有已经添加的属性
 * @param {Internal.Player} player 
 * @returns
 */
function clearAllActivedModify(player) {
    let attributeMap = getPlayerAttributeMap(player)
    attributeMap.forEach((value, key, map) => {
        player.removeAttribute(global.ATTRIBUTE_MAP[key].key, global.ATTRIBUTE_MAP[key].name);
    })
    player.persistentData.putInt(resourceCountMax, defaultResourceMax)
}

/**
 * 清除玩家所有已经添加的属性
 * @param {Map} attributeMap
 * @param {attribute} attribute
 * @param {number} modifyValue
 * @returns
 */
function attributeMapValueAddition(attributeMap, attribute, modifyValue) {
    if (attributeMap.has(attribute.name)) {
        modifyValue = modifyValue + attributeMap.get(attribute.name)
    }
    attributeMap.set(attribute.name, modifyValue)
}


/**
 * 器官激活策略
 * @constant
 * @type {Object<string,function(Internal.Player, organ, Map):void>}
 */
const organActiveStrategies = {
    'kubejs:rose_quartz_heart': function (player, organ, attributeMap) {
        let typeMap = getPlayerChestCavityTypeMap(player);
        if (typeMap.has('kubejs:machine')) {
            let value = typeMap.get('kubejs:machine').length * 2
            attributeMapValueAddition(attributeMap, global.HEALTH_UP, value)
        }

        if (typeMap.has('kubejs:rose')) {
            let value = typeMap.get('kubejs:rose').length * 1
            attributeMapValueAddition(attributeMap, global.ATTACK_UP, value)
        }
    },
    'kubejs:revolution_cable': function (player, organ, attributeMap) {
        let typeMap = getPlayerChestCavityTypeMap(player);
        if (typeMap.has('kubejs:revolution')) {
            let value = typeMap.get('kubejs:revolution').length * 1
            attributeMapValueAddition(attributeMap, global.HEALTH_UP, value)
        }
    },
    'kubejs:magic_vision': function (player, organ, attributeMap) {
        attributeMapValueAddition(attributeMap, global.SPELL_POWER, 0.15)
    },
    'kubejs:love_between_lava_and_ice': function (player, organ, attributeMap) {
        let itemMap = getPlayerChestCavityItemMap(player);
        if (itemMap.has('minecraft:blue_ice')) {
            let iceMulti = itemMap.get('minecraft:blue_ice').length * 0.2
            attributeMapValueAddition(attributeMap, global.ICE_SPELL_POWER, iceMulti)
        }
        if (itemMap.has('minecraft:magma_block')) {
            let fireMulti = itemMap.get('minecraft:magma_block').length * 0.2
            attributeMapValueAddition(attributeMap, global.FIRE_SPELL_POWER, fireMulti)
        }
    },
    'kubejs:stomach_tumor': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        let pos = organ.Slot
        let count = 0
        eightDirectionList.forEach(direction => {
            let currentPos = lookPos(direction, pos)
            if (posMap.has(currentPos) && posMap.get(currentPos).id == organ.id) {
                count++
            }
        })
        if (count > 2) {
            attributeMapValueAddition(attributeMap, global.HEALTH_UP, 8)
        }
    },
    'kubejs:leviathan_rib': function (player, organ, attributeMap) {
        attributeMapValueAddition(attributeMap, global.ARMOR_TOUGHNESS, 2)
    },
    'kubejs:holy_eyeball': function (player, organ, attributeMap) {
        attributeMapValueAddition(attributeMap, global.CRITICAL_HIT, 0.05)
        attributeMapValueAddition(attributeMap, global.HOLY_SPELL_DAMAGE, 0.3)
    },
    'kubejs:holy_grenade': function (player, organ, attributeMap) {
        attributeMapValueAddition(attributeMap, global.HOLY_SPELL_DAMAGE, 0.3)
    },
    'kubejs:hamimelon_organ': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        let pos = organ.Slot
        let count = 0
        eightDirectionList.forEach(direction => {
            let currentPos = lookPos(direction, pos)
            if (posMap.has(currentPos) && Item.of(posMap.get(currentPos).id).hasTag('kubejs:food')) {
                count++
            }
        })
        if (count > 0) {
            attributeMapValueAddition(attributeMap, global.HEALTH_UP, 2 * count)
        }
    },
    'kubejs:mini_slime': function (player, organ, attributeMap) {
        let pos = organ.Slot
        let rowOffset = Math.abs(Math.floor(pos / 9) - 1)
        let lineOffset = Math.abs(pos % 9 - 4)
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, 2 * (lineOffset + rowOffset))
    },
    'kubejs:desire_of_midas': function (player, organ, attributeMap) {
        let maxCount = player.persistentData.getInt(resourceCountMax) ?? defaultResourceMax
        player.persistentData.putInt(resourceCountMax, maxCount + 100)
    },
    'kubejs:redstone_furnace': function (player, organ, attributeMap) {
        let maxCount = player.persistentData.getInt(resourceCountMax) ?? defaultResourceMax
        player.persistentData.putInt(resourceCountMax, maxCount + 100)
    },
    'kubejs:vulcan_furnace': function (player, organ, attributeMap) {
        let maxCount = player.persistentData.getInt(resourceCountMax) ?? defaultResourceMax
        player.persistentData.putInt(resourceCountMax, maxCount + 100)
    },
    'kubejs:aesegull_rib_right': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        let pos = organ.Slot
        // 取对称位置坐标
        let opPos = getOppoPos(pos)
        if (posMap.has(opPos) && posMap.get(opPos).id == 'kubejs:aesegull_rib_left') {
            attributeMapValueAddition(attributeMap, global.ARMOR, 3)
        }
    },
    'kubejs:aesegull_rib_left': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        let pos = organ.Slot
        // 取对称位置坐标
        let opPos = getOppoPos(pos)
        if (posMap.has(opPos) && posMap.get(opPos).id == 'kubejs:aesegull_rib_right') {
            attributeMapValueAddition(attributeMap, global.ARMOR_TOUGHNESS, 3)
        }
    },
    'kubejs:mockery': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        let pos = organ.Slot
        let opPos = getOppoPos(pos)
        if (posMap.has(opPos) && posMap.get(opPos).id == 'kubejs:sarcasm') {
            attributeMapValueAddition(attributeMap, global.ATTACK_UP_MULTI_BASE, 0.05)
        }
    },
    'kubejs:sarcasm': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        let pos = organ.Slot
        let opPos = getOppoPos(pos)
        if (posMap.has(opPos) && posMap.get(opPos).id == 'kubejs:mockery') {
            attributeMapValueAddition(attributeMap, global.ARMOR_MULTI_BASE, 0.1)
        }
    },
    'kubejs:blood_moon_wand': function (player, organ, attributeMap) {
        attributeMapValueAddition(attributeMap, global.BLOOD_SPELL_DAMAGE, 0.3)
    },
    'kubejs:huge_lung': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        if (checkBox22OrganSame(posMap, organ)) { return }
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, -5)
    },
    'kubejs:huge_muscle': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        if (checkBox22OrganSame(posMap, organ)) { return }
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, -5)
    },
    'kubejs:huge_heart': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        if (checkBox22OrganSame(posMap, organ)) { return }
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, -10)
    },
    'kubejs:huge_intestine': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        if (checkBox22OrganSame(posMap, organ)) { return }
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, -5)
    },
    'kubejs:huge_rib': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        if (checkBox22OrganSame(posMap, organ)) { return }
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, -5)
    },
    'kubejs:huge_spine': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        if (checkBox22OrganSame(posMap, organ)) { return }
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, -5)
    },
    'kubejs:huge_spleen': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        if (checkBox22OrganSame(posMap, organ)) { return }
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, -5)
    },
    'kubejs:huge_stomach': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        if (checkBox22OrganSame(posMap, organ)) { return }
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, -5)
    },
    'kubejs:huge_kidney': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        if (checkBox22OrganSame(posMap, organ)) { return }
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, -5)
    },
    'kubejs:huge_liver': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        if (checkBox22OrganSame(posMap, organ)) { return }
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, -5)
    },
    'kubejs:huge_appendix': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        if (checkBox22OrganSame(posMap, organ)) { return }
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, -5)
    },
    'kubejs:bad_ink': function (player, organ, attributeMap) {
        let typeMap = getPlayerChestCavityTypeMap(player);
        if (typeMap.has('kubejs:magic')) {
            let value = typeMap.get('kubejs:magic').length * 30
            attributeMapValueAddition(attributeMap, global.MAX_MANA, value)
        }
    },
    'kubejs:chicken_kidney': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        let pos = organ.Slot
        let opPos = getOppoPos(pos)
        if (posMap.has(opPos) && posMap.get(opPos).id == 'kubejs:chicken_kidney') {
            attributeMapValueAddition(attributeMap, global.LUCK, 3)
        }
    },
    'kubejs:chicken_lung': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        let pos = organ.Slot
        let opPos = getOppoPos(pos)
        let chickenStripCounter = 0
        fourDirectionList.forEach(direction => {
            let currentPos = lookPos(direction, pos)
            if (posMap.has(currentPos) && posMap.get(currentPos).id == 'kubejs:chicken_strip') {
                chickenStripCounter++
            }
        })
        if (chickenStripCounter < 3) {
            return
        }
        if (posMap.has(opPos) && posMap.get(opPos).id == 'kubejs:chicken_lung') {
            attributeMapValueAddition(attributeMap, global.LUCK_MULTI_BASE, 0.1)
        }
    }
};

/**
 * 器官激活唯一策略
 * @constant
 * @type {Object<string,function(Internal.Player, organ, Map):void>}
 */
const organActiveOnlyStrategies = {
    'kubejs:telescopic_arm': function (player, organ, attributeMap) {
        attributeMapValueAddition(attributeMap, global.REACH_DISTANCE, 1.5)
    },
    'kubejs:telescopic_tool_arm': function (player, organ, attributeMap) {
        attributeMapValueAddition(attributeMap, global.REACH_DISTANCE, 2.5)
    },
    'kubejs:telescopic_attack_arm': function (player, organ, attributeMap) {
        attributeMapValueAddition(attributeMap, global.ATTACK_RANGE, 1.5)
    },
    'kubejs:nether_star_shard': function (player, organ, attributeMap) {
        attributeMapValueAddition(attributeMap, global.CRITICAL_HIT, 0.1)
    },
    'kubejs:wrath_shard': function (player, organ, attributeMap) {
        if (checkSevenSins(player, organ)) {
            attributeMapValueAddition(attributeMap, global.CRITICAL_HIT, -0.5)
            attributeMapValueAddition(attributeMap, global.CRITICAL_DAMAGE, 3.5)
        } else {
            attributeMapValueAddition(attributeMap, global.CRITICAL_HIT, -0.8)
            attributeMapValueAddition(attributeMap, global.CRITICAL_DAMAGE, 3)
        }
    },
    'kubejs:sloth_shard': function (player, organ, attributeMap) {
        if (checkSevenSins(player, organ)) {
            attributeMapValueAddition(attributeMap, global.KNOCKBACK_RESISTANCE, 0.9)
            attributeMapValueAddition(attributeMap, global.ARMOR_TOUGHNESS, 15)
        } else {
            attributeMapValueAddition(attributeMap, global.KNOCKBACK_RESISTANCE, 0.8)
        }
    },
    'kubejs:envy_shard': function (player, organ, attributeMap) {
        if (checkSevenSins(player, organ)) {
            attributeMapValueAddition(attributeMap, global.CRITICAL_DAMAGE, 1.5)
            attributeMapValueAddition(attributeMap, global.ATTACK_UP_MULTI_BASE, 0.25)
        } else {
            attributeMapValueAddition(attributeMap, global.CRITICAL_DAMAGE, 1)
        }
    },
    'kubejs:gluttony_shard': function (player, organ, attributeMap) {
        if (checkSevenSins(player, organ)) {
            attributeMapValueAddition(attributeMap, global.REGENERATION, 0.8)
            attributeMapValueAddition(attributeMap, global.HEALTH_UP, 30)
        } else {
            attributeMapValueAddition(attributeMap, global.REGENERATION, 0.5)
        }
    },
    'kubejs:lust_shard': function (player, organ, attributeMap) {
        if (checkSevenSins(player, organ)) {
            attributeMapValueAddition(attributeMap, global.MAX_MANA, 200)
            attributeMapValueAddition(attributeMap, global.SPELL_POWER, 0.5)
        } else {
            attributeMapValueAddition(attributeMap, global.MAX_MANA, 100)
        }
    },
    'kubejs:pride_shard': function (player, organ, attributeMap) {
        if (checkSevenSins(player, organ)) {
            attributeMapValueAddition(attributeMap, global.SUMMON_DAMAGE, 0.5)
            attributeMapValueAddition(attributeMap, global.MANA_REGEN, 0.5)
        } else {
            attributeMapValueAddition(attributeMap, global.SUMMON_DAMAGE, 0.3)
        }
    },
    'kubejs:infinity_force': function (player, organ, attributeMap) {
        if (organ.tag?.forgeTimes) {
            let value = organ.tag.forgeTimes * 1
            attributeMapValueAddition(attributeMap, global.ATTACK_UP, value)
        }
    },
    'kubejs:redstone_chipset': function (player, organ, attributeMap) {
        let typeMap = getPlayerChestCavityTypeMap(player);
        if (typeMap.has('kubejs:machine')) {
            let value = Math.max(typeMap.get('kubejs:machine').length * 0.02, 0.2)
            attributeMapValueAddition(attributeMap, global.CRITICAL_HIT, value)
        }
        attributeMapValueAddition(attributeMap, global.CRITICAL_DAMAGE, 0.3)
    },
    'kubejs:king_of_stomach': function (player, organ, attributeMap) {
        let posMap = getPlayerChestCavityPosMap(player);
        let healthUp = 0
        let attackUp = 0
        let manaUp = 0
        let onlySet = new Set()
        posMap.forEach((value, key) => {
            if (value) {
                let foodPro = Item.of(value.id).getFoodProperties(player)
                if (foodPro) {
                    let nutrition = foodPro.getNutrition()
                    let staturation = foodPro.getSaturationModifier() * nutrition
                    if (!onlySet.has(value.id)) {
                        healthUp = healthUp + nutrition / 2
                        attackUp = attackUp + staturation / 4
                        onlySet.add(value.id)
                        if (foodPro.getEffects().length) {
                            manaUp = manaUp + foodPro.getEffects().length * 20
                        }
                    }
                    healthUp = healthUp + nutrition / 12
                    attackUp = attackUp + staturation / 16
                } else {
                    healthUp = healthUp - 4
                    attackUp = attackUp - 2
                }
            }
        })
        attributeMapValueAddition(attributeMap, global.HEALTH_UP, Math.floor(healthUp))
        attributeMapValueAddition(attributeMap, global.ATTACK_UP, attackUp)
        attributeMapValueAddition(attributeMap, global.MAX_MANA, Math.floor(manaUp))
    },
    'kubejs:chicken_heart': function (player, organ, attributeMap) {
        let typeMap = getPlayerChestCavityTypeMap(player);
        if (typeMap.has('kubejs:food')) {
            let value = typeMap.get('kubejs:food').length
            attributeMapValueAddition(attributeMap, global.LUCK, value)
        }
    },
    'kubejs:prismarine_crown': function (player, organ, attributeMap) {
        let playerChestInstance = player.getChestCavityInstance()
        playerChestInstance.organScores.forEach((key, value) => {
            if (value < 0) {
                playerChestInstance.organScores.put(key, new $Float(1))
            }
        })
    },
    'kubejs:fish_in_chest': function (player, organ, attributeMap) {
        let typeMap = getPlayerChestCavityTypeMap(player);
        let playerChestInstance = player.getChestCavityInstance()
        let organCount = 2
        if (typeMap.has('kubejs:organ')) {
            organCount = typeMap.get('kubejs:organ').length * 1
        }
        let amplifier = 27 / organCount - 1
        playerChestInstance.organScores.forEach((key, value) => {
            playerChestInstance.organScores.put(key, new $Float(value * amplifier))
        })
    },
    'kubejs:aegis': function (player, organ, attributeMap) {
        let armorval = player.getChestCavityInstance().organScores.get(new ResourceLocation('chestcavity', 'defense')) * 0.5
        attributeMapValueAddition(attributeMap, global.ARMOR, Math.max(0, Math.min(30, Math.floor(armorval))))
    },
    'kubejs:whale_lung': function (player, organ, attributeMap) {
        let instance = player.getChestCavityInstance()
        let breathCapacity = instance.organScores.getOrDefault(new ResourceLocation('chestcavity', 'breath_capacity'), 0) * 1.5
        instance.organScores.put(new ResourceLocation('chestcavity', 'breath_capacity'), new $Float(breathCapacity))
    },
}


function checkBox22OrganSame(posMap, organ) {
    let pos = organ.Slot
    for (let i = 0; i < box22DirectionList.length; i++) {
        let flag = true
        let directionList = box22DirectionList[i]
        for (let j = 0; j < directionList.length; j++) {
            let currentPos = lookPos(directionList[j], pos)
            if (!(posMap.has(currentPos) && posMap.get(currentPos).id == organ.id)) {
                flag = false
                break
            }
        }
        if (flag) {
            return true
        }
    }
    return false
}


function checkSevenSins(player, organ) {
    let itemMap = getPlayerChestCavityItemMap(player)
    if (itemMap.has('kubejs:wrath_shard')
        && itemMap.has('kubejs:sloth_shard')
        && itemMap.has('kubejs:envy_shard')
        && itemMap.has('kubejs:gluttony_shard')
        && itemMap.has('kubejs:greed_shard')
        && itemMap.has('kubejs:lust_shard')
        && itemMap.has('kubejs:pride_shard')) {
        return true
    }
    return false
}