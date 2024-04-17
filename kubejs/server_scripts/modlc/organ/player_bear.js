// priority: 9
//优先级要小于官方
//引用官方策略
var Bear1 = Object.assign(organPlayerBearStrategies, moorganPlayerBearStrategies);
var Bear2 = Object.assign(organPlayerBearOnlyStrategies, moorganPlayerBearOnlyStrategies);

/**
 * 玩家承受伤害处理策略
 * @constant
 * @type {Object<string,function(Internal.LivingHurtEvent, organ, EntityHurtCustomModel):void>}
 */
const moorganPlayerBearStrategies = {
    
};


/**
 * 玩家承受伤害唯一处理策略
 * @constant
 * @type {Object<string,function(Internal.LivingHurtEvent, organ, EntityHurtCustomModel):void>}
 */
const moorganPlayerBearOnlyStrategies = {
    
};
