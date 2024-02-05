export async function setup(ctx) {
    await ctx.gameData.addPackage('data/gamemode.json');
    console.log('Hello From My Mod! Now with onload');
    ctx.onCharacterSelectionLoaded(async ctx => {
        // Build or modify character selection UI elements
        console.log('Selection has loaded');
    });
    ctx.onCharacterLoaded(async ctx => {
        if (game.skillUnlocks.length < 2) {
            sidebar.category('Non-Combat').remove()
            sidebar.category('Passive').remove()
        }
        game.settings.continueIfBankFull = false

        console.log(`Character is now ready`);
    });
    ctx.onInterfaceReady(async ctx => {
        console.log(`Interface is ready`);
        
    });

    ctx.patch(Bank, 'sellItemOnClick').replace(function(o,item,quantity) {
        console.log(`No selling allowed`)
        return
    })

    ctx.patch(Bank, 'toggleItemLock').replace(function(o,bankItem) {
        if (this.lockedItems.has(bankItem.item)) {
            return
        } else {
            this.lockedItems.add(bankItem.item);
        }
        bankTabMenu.updateItemLockBorder(bankItem, this.game.settings.useDefaultBankBorders);
        if (bankItem === this.selectedBankItem) {
            bankSideBarMenu.setItemLocked(bankItem.locked);
        }
    })

    ctx.patch(Bank, 'setLockOfAllItems').replace(function(o,locked) {
        this.items.forEach((bankItem)=>{
            if (bankItem.locked !== true)
                this.toggleItemLock(bankItem);
        }
        );
    })

    ctx.patch(Settings, `continueIfBankFull`).replace(function(o) {
        return false
    })

    ctx.patch(Bank, 'addItem').replace(function(o,item, quantity, logLost, found, ignoreSpace=false, notify=true, itemSource='Game.Unknown') {
        var _a, _b;
        if (quantity <= 0)
            throw new Error(`Tried to add negative or zero quantity to bank.`);
        let success = false;
        let bankItem = this.items.get(item);
        if (bankItem !== undefined) {
            bankItem.quantity += quantity;
            success = true;
        } else if (this.occupiedSlots < this.maximumSlots || ignoreSpace) {
            const tab = this.getItemDefaultTab(item);
            bankItem = new BankItem(this,item,quantity,tab,this.itemsByTab[tab].length);
            this.items.set(item, bankItem);
            this.itemsByTab[tab].push(bankItem);
            this.toggleItemLock(bankItem);
            if (this.game.settings.bankSortOrder === 5 && !this.customSortOrder.includes(item))
                this.storeCustomSortOrder();
            success = true;
            this.renderQueue.bankSearch = true;
            this.newItemsAdded = true;
            if (bankItem.tabPosition === 0)
                this.renderQueue.tabIcons.add(tab);
        }
        if (success) {
            if (found) {
                const newItem = this.game.stats.itemFindCount(item) === 0;
                this.game.stats.Items.add(item, ItemStats.TimesFound, quantity);
                if (newItem) {
                    this.game.completion.updateItem(item);
                    this.glowingItems.add(item);
                    if (item instanceof EquipmentItem)
                        this.game.minibar.addItemOnDiscovery(item);
                    this.game.renderQueue.birthdayEventProgress = true;
                }
            }
            if (!loadingOfflineProgress)
                this.game.telemetry.createItemGainedEvent(item, quantity, itemSource);
            this.renderQueue.items.add(item);
            (_a = this.game.archaeology) === null || _a === void 0 ? void 0 : _a.renderQueue.museumArtefacts.add(item);
            this.queueQuantityUpdates(item);
            if (notify)
                this.game.combat.notifications.add({
                    type: 'Item',
                    args: [item, quantity],
                });
            this.game.combat.player.updateConditionals('BankItem', true, true);
        } else {
            if (notify)
                this.game.combat.notifications.add({
                    type: 'BankFull',
                    args: [],
                });
            if (logLost) {
                this.lostItems.set(item, ((_b = this.lostItems.get(item)) !== null && _b !== void 0 ? _b : 0) + quantity);
            }
        }
        return success;
    })

    
    const skillIDs = ['melvorD:Woodcutting', // 7
                            'melvorD:Fishing',     // 8
                            'melvorD:Firemaking',  // 9
                            'melvorD:Cooking',     // 10
                            'melvorD:Mining',      // 11
                            'melvorD:Smithing',    // 12
                            'melvorD:Thieving',    // 13
                            'melvorD:Fletching',   // 14
                            'melvorD:Crafting',    // 15
                            'melvorD:Runecrafting',// 16
                            'melvorD:Herblore',    // 17
                            'melvorD:Agility',     // 18
                            'melvorD:Summoning',   // 19
                            'melvorD:Astrology'    // 20
    ]
}


