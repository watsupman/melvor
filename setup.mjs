export async function setup(ctx) {
  await ctx.gameData.addPackage('data/gamemode.json');
  ctx.onCharacterLoaded(ctx => {
    // Modify or hook into game objects to influence offline calculations
    if (game.currentGamemode.localID == "ByReleaseMode") {
      setLevelCapIncrease();
      addDungeonRequirementToAreas("melvorAoD");
      ctx.patch(Mining, 'renderRockUnlock').replace(replaceRenderRockUnlock);
    }
  });
}

// Function to add a dungeon requirement to all areas in a given namespace map
function addDungeonRequirementToAreas(area) {
  game.combatAreas.namespaceMaps.get(area).entries().forEach(([key, combatArea]) => {
    const requirementData = {
      dungeonID: 'melvorTotH:Throne_of_the_Herald',
      count: 1
    };
    
      const requirement = new DungeonRequirement(requirementData, game);
      combatArea._entryRequirements.push(requirement);
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
    // Modify the dungeon requirement
    // let requirementSet = impendingDarknessSet.requirementSets.get(0);
    // if (requirementSet && requirementSet.requirements && requirementSet.requirements.length > 0) {
    //   impendingDarknessSet.requirementSets.get(0).requirements[0].dungeon = game.dungeons.getObjectByID('melvorF:Impending_Darkness');
    // }
  }
}

function replaceRenderRockUnlock(original) {
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
          if (rock._namespace.name == "melvorAoD") {
            console.log("The namespace of rock is: ", rock._namespace.name);
            rockMenu.setLockedContainer(rock);
            rockMenu.setLocked();
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
