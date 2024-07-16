export async function setup(ctx) {
  await ctx.gameData.addPackage('data/gamemode.json');
  ctx.onCharacterLoaded(ctx => {
    // Modify or hook into game objects to influence offline calculations
    if (game.currentGamemode.localID === "ByReleaseMode") {
      mod.api.mythCombatSimulator?.registerNamespace('byRelease');
      preventMeteorite();
      checkAoDLock(ctx);
      // const target = "melvorD:MummaChicken";
      // ctx.patch(CombatManager, "onEnemyDeath").after(patchOnEnemyDeath(ctx, target));
    }
  });
}

function checkAoDLock(ctx) {
  setLevelCapIncrease();
  
  // const dungeon_ID = 'melvorTotH:Throne_of_the_Herald';
  const dungeon_ID = 'melvorTotH:Throne_of_the_Herald';
  const dungeonReq = game.dungeons.getObjectByID(dungeon_ID);
  var hasDungeon = game.combat.dungeonCompletion.has(dungeonReq);
  const requirementData = {
    dungeonID: dungeon_ID,
    count: 1
  };
  
  addDungeonRequirementToAreas(dungeonReq, requirementData);
  preventAoDAuroras(dungeonReq, requirementData);
  if (!hasDungeon) {
    ctx.patch(Mining, 'renderRockUnlock').replace(replaceRenderRockUnlock(dungeon_ID));
    ctx.patch(Astrology, 'renderVisibleConstellations').replace(replaceRenderVisibleConstellations(dungeon_ID));
  }
}

function preventMeteorite() {
  const dungeon_ID = 'melvorF:Impending_Darkness';
  const dungeonReq = game.dungeons.getObjectByID(dungeon_ID);
  var hasDungeon = game.combat.dungeonCompletion.has(dungeonReq);
  game.astrology.actions.registeredObjects.forEach((constellation) => {
    constellation.canLocateMeteorite = hasDungeon;
  });
}

// Function to add a dungeon requirement to all areas in a given namespace map
function addDungeonRequirementToAreas(dungeonReq, requirementData) {
  var hasDungeon = game.combat.dungeonCompletion.has(dungeonReq);
  const requirement = new DungeonRequirement(requirementData, game);
  game.combatAreas.namespaceMaps.get("melvorAoD").forEach((combatArea, key) => {
    const index = combatArea._entryRequirements.findIndex(req => req.dungeonID === requirementData.dungeonID);

    if (!hasDungeon && index === -1) {
      // Requirement is not present, and dungeon is not completed, so add it
      combatArea._entryRequirements.push(requirement);
    } else if (hasDungeon && index !== -1) {
      // Dungeon is completed and requirement exists, so remove it
      combatArea._entryRequirements.splice(index, 1);
    }
  });
}

function preventAoDAuroras(dungeonReq, requirementData) {
  var hasDungeon = game.combat.dungeonCompletion.has(dungeonReq);
  const requirement = new DungeonRequirement(requirementData, game);
  game.auroraSpells.namespaceMaps.get("melvorAoD").forEach((spell, key) => {
    const index = spell.requirements.findIndex(req => req.dungeonID === requirementData.dungeonID);

    if (!hasDungeon && index === -1) {
      // Requirement is not present, and dungeon is not completed, so add it
      spell.requirements.push(requirement);
    } else if (hasDungeon && index !== -1) {
      // Dungeon is completed and requirement exists, so remove it
      spell.requirements.splice(index, 1);
    }
  });
}

// Sets the automatic skill cap increase from completing Impending Darkness to 120
function setLevelCapIncrease() {
  const impendingDarknessSet = game.skillLevelCapIncreases.namespaceMaps.get('melvorAoD').get('ImpendingDarknessSet100');
  if (impendingDarknessSet) {
    // Iterate over the setIncreases array to update each skill value
    impendingDarknessSet.setIncreases.forEach(skillIncrease => {
      skillIncrease.value = 120;  // Updating the value to 120
    });
  }
}

function replaceRenderRockUnlock(dungeonReq) {
  return function(original) {

    if (!this.renderQueue.rockUnlock)
      return;
    this.actions.forEach((rock)=>{
        const rockMenu = rockMenus.get(rock);
        if (rockMenu === undefined)
            return;
        if (rock.level > this.level || rock.abyssalLevel > this.abyssalLevel || (rock.shopItemPurchased !== undefined && !this.game.shop.isUpgradePurchased(rock.shopItemPurchased))) {
            rockMenu.setLockedContainer(rock);
            rockMenu.setLocked();
        } else {
            if (rock._namespace.name === "melvorAoD") {
              const hasDungeon = game.combat.dungeonCompletion.has(dungeonReq);
              if (!hasDungeon) {
                rockMenu.setLockedContainer(rock);
                rockMenu.setLocked();
              }
            } else {
              rockMenu.setUnlocked();
            }
        }
        if (rock.totalMasteryRequired > 0) {
            if (this.totalCurrentMasteryLevel > rock.totalMasteryRequired) {
                rockMenu.hideRequirement();
            } else {
                rockMenu.setRequirement(templateLangString('MENU_TEXT_DRAGON_ORE_REQ', {
                    level: numberWithCommas(rock.totalMasteryRequired)
                }));
            }
        }
    }
    );
    this.renderQueue.rockUnlock = false;
  }
}

function replaceRenderVisibleConstellations(dungeonReq) {
  return function(original) {
    if (!this.renderQueue.visibleConstellations)
      return;
    var hasDungeon = game.combat.dungeonCompletion.has(dungeonReq);
    if (this.exploredConstellation === undefined) {
        let lowestLocked;
        this.actions.forEach((constellation)=>{
            const menu = astrologyMenus.constellations.get(constellation);
            const isInRealm = constellation.realm === this.currentRealm;
            const isAoD = constellation._namespace.name === "melvorAoD";
            const isUnlocked = this.level >= constellation.level && (constellation.abyssalLevel < 1 || this.abyssalLevel >= constellation.abyssalLevel);
            if (isInRealm && !isUnlocked) {
                if (lowestLocked === undefined || lowestLocked.level > constellation.level || lowestLocked.abyssalLevel > constellation.abyssalLevel)
                  if (!isAoD || (isAoD && hasDungeon)) {
                    lowestLocked = constellation;
                  }  
            }
            if (menu === undefined)
                return;
            if (isInRealm && isUnlocked && (!isAoD || (isAoD && hasDungeon))) {
                showElement(menu);
            } else {
                hideElement(menu);
            }
        }
        );
        if (lowestLocked === undefined) {
            hideElement(astrologyMenus.locked);
        } else {
            astrologyMenus.locked.setConstellation(lowestLocked, this);
            showElement(astrologyMenus.locked);
        }
        hideElement(astrologyMenus.explorePanel);
    } else {
        this.actions.forEach((constellation)=>{
            const isAoD = constellation._namespace.name === "melvorAoD";
            const menu = astrologyMenus.constellations.get(constellation);
            if (menu === undefined)
                return;
            if (constellation !== this.exploredConstellation) {
                hideElement(menu);
            } else {
              if (!isAoD || (isAoD && hasDungeon)) {
                showElement(menu);
                menu.setExplored();
              }
            }
        }
        );
        hideElement(astrologyMenus.locked);
        showElement(astrologyMenus.explorePanel);
        astrologyMenus.explorePanel.setConstellation(this.exploredConstellation);
    }
    this.renderQueue.visibleConstellations = false;
  }
}

