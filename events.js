/* ============================================
   IsekaiLife - Events System
   All age-based events, random events, actions
   ============================================ */

GameEngine.prototype.showAgeActions = function() {
    const panel = document.getElementById('action-panel');
    const log = document.getElementById('log-entries');

    // Check if dead
    if (this.state.isDead) {
        return;
    }

    let html = '';
    
    // If there's a pending choice, show it
    if (this.pendingChoice) {
        const choice = this.pendingChoice;
        this.pendingChoice = null;
        panel.innerHTML = typeof choice === 'string' ? choice : choice.html || choice;
        return;
    }

    // Show child status if under 10
    if (this.state.age < 10 && this.state.isChild) {
        const father = this.state.parents?.father;
        const mother = this.state.parents?.mother;
        html += `<div class="log-entry normal" style="margin-bottom: 10px;">
            <small>👶 You are a child being raised by your parents.</small><br>
            ${father && father.alive ? `<small>👨 ${father.firstName} ${father.lastName} (${father.relation}, Age ${father.age})</small><br>` : ''}
            ${mother && mother.alive ? `<small>👩 ${mother.firstName} ${mother.lastName} (${mother.relation}, Age ${mother.age})</small>` : ''}
        </div>`;
    }

    // Show mood icon in age button
    const moodIcon = this.getMoodIcon();
    html += `<button class="age-up-btn" onclick="game.ageUp()">${moodIcon} ⏩ Age Up (Current Age: ${this.state.age})</button>`;
    panel.innerHTML = html;
};

// ============ AGE UP SYSTEM (Structured Story Progression) ============
GameEngine.prototype.ageUp = function() {
    if (this.state.isDead) return;
    
    this.state.age++;
    this.state.worldYear++;

    // HP/MP regen
    this.state.hp = this.state.maxHp;
    this.state.mp = this.state.maxMp;

    // Update story phase
    this.state.storyPhase = this.getStoryPhase();

    // Update child status
    if (this.state.age >= 10) {
        this.state.isChild = false;
    }

    // Parent aging and events
    this.parentEvent();

    // Check for death
    if (this.checkForDeath()) {
        this.updateAllUI();
        return;
    }

    // Run events in sequence (structured story system)
    this.triggerMoodEvent();
    this.triggerMilestoneEvents();
    this.triggerPhaseEvents();
    this.naturalMoodDrift();
    this.checkMoodEffects();

    // Achievement check
    if (this.state.age >= 50) this.unlockAchievement('isekai_veteran');

    this.updateAllUI();
    this.showAgeActions();
};

// ============ NATURAL MOOD DRIFT ============
GameEngine.prototype.naturalMoodDrift = function() {
    // Mood naturally drifts toward 50 (neutral)
    if (this.state.mood > 55) {
        this.state.mood -= this.randomInt(1, 3);
    } else if (this.state.mood < 45) {
        this.state.mood += this.randomInt(1, 3);
    }
    
    // Living family helps stabilize mood
    const fatherAlive = this.state.parents?.father?.alive;
    const motherAlive = this.state.parents?.mother?.alive;
    if (fatherAlive || motherAlive) {
        if (this.state.mood < 40) this.state.mood += 2;
    }
    
    // Orphan children suffer
    if (!fatherAlive && !motherAlive && this.state.age < 18) {
        this.state.mood -= 2;
    }
    
    this.state.mood = Math.max(0, Math.min(100, this.state.mood));
    this.updateMoodState();
};

// ============ MOOD EFFECTS ============
GameEngine.prototype.checkMoodEffects = function() {
    const mood = this.state.moodState;
    
    // Depression/anger - special events
    if (mood === 'depressed' || mood === 'angry') {
        if (this.chance(40)) {
            const event = this.randomPick(DATA.depressionEvents);
            this.addLogEntry(`😔 ${event}`, 'negative');
            this.modifyStat('cha', -1);
        }
        // Chance for recovery
        if (this.chance(30)) {
            const recovery = this.randomPick(DATA.recoveryEvents);
            this.addLogEntry(`💪 ${recovery}`, 'positive');
            this.modifyMood(10, null);
        }
    }
    
    // High happiness gives bonuses
    if (mood === 'ecstatic' && this.chance(30)) {
        this.addLogEntry("✨ Your burning enthusiasm inspires those around you!", 'special');
        this.modifyStat('cha', 1);
        this.modifyFame(2);
    }
};

// ============ MOOD EVENTS ============
GameEngine.prototype.triggerMoodEvent = function() {
    const phase = this.state.storyPhase;
    const moodEvents = DATA.moodEvents[phase];
    if (!moodEvents || moodEvents.length === 0) return;
    
    // 50% chance for a mood event each year
    if (!this.chance(50)) return;
    
    const event = this.randomPick(moodEvents);
    this.modifyMood(event.mood, event.text);
};

// ============ MILESTONE EVENTS (one-time per life) ============
GameEngine.prototype.triggerMilestoneEvents = function() {
    const age = this.state.age;
    const s = this.state;
    const father = s.parents?.father;
    const mother = s.parents?.mother;
    const parentAlive = (father && father.alive) || (mother && mother.alive);
    const randomParent = parentAlive ? (father && father.alive ? (mother && mother.alive ? this.randomPick([father, mother]) : father) : mother) : null;
    const milestones = s.completedMilestones;

    // ============ Baby Phase (0-2) ============
    if (age === 1 && !milestones.includes('birth')) {
        milestones.push('birth');
        this.addLogEntry("👶 You are born into this new world. Everything is bright and magical. You can feel mana flowing through this world.", "special");
        if (parentAlive) {
            this.addLogEntry(`🏠 You are raised by ${father?.alive && mother?.alive ? `${father.firstName} and ${mother.firstName}` : randomParent?.firstName} in ${this.getLocationName(0)}.`, "normal");
        }
        this.modifyMood(10, null);
    }
    
    if (age === 2 && !milestones.includes('first_words')) {
        milestones.push('first_words');
        this.addLogEntry("🗣️ You said your first words. Your parents are amazed at how fast you're developing.", "normal");
        this.modifyMood(8, null);
        if (s.int > 15) {
            this.addLogEntry("🧒 Thanks to your past-life memories, you can already read! People call you a prodigy.", "special");
            this.modifyStat('int', 2);
            this.modifyFame(5);
            this.modifyMood(10, null);
        }
    }
    
    // ============ Toddler Phase (3-5) ============
    if (age === 3 && !milestones.includes('first_mana')) {
        milestones.push('first_mana');
        this.addLogEntry("✨ You tried channeling mana for the first time...", "normal");
        if (s.cheatSkill === 'magic' || s.int > 18) {
            this.addLogEntry("💥 A burst of magic exploded from your hands! The neighbors are shocked!", "special");
            this.modifyStat('int', 3);
            this.modifyMood(12, null);
        } else {
            this.addLogEntry("💫 A small spark flickered. It's a start!", "normal");
        }
    }
    
    if (age === 5 && !milestones.includes('learning')) {
        milestones.push('learning');
        this.addLogEntry("📚 You started learning to read and write properly.", "normal");
        this.modifyStat('int', 1);
        this.modifyMood(5, null);
    }
    
    // ============ Childhood Phase (6-9) ============
    if (age === 6 && !milestones.includes('school_start')) {
        milestones.push('school_start');
        this.addLogEntry("� You started attending the village school!", "special");
        s.inSchool = true;
        this.modifyStat('int', 2);
        this.modifyMood(8, "First day of school is exciting!");
    }
    
    // ============ Preteen Phase (10-12) ============
    if (age === 10 && !milestones.includes('no_longer_child')) {
        milestones.push('no_longer_child');
        this.addLogEntry("🎂 You turn 10! In this world, that means you can register as an adventurer!", "special");
        s.isChild = false;
        s.hasGuild = true;
        s.guildRank = 0;
        this.addLogEntry("🏛️ You registered at the Adventurer's Guild! You are now an F-Rank adventurer!", "quest");
        
        // Give starter items
        s.inventory.push({ itemId: 'rusty_sword', quantity: 1 });
        s.inventory.push({ itemId: 'health_potion', quantity: 3 });
        s.gold = 50;
        this.addLogEntry("🎁 The Guild gave you a starter kit: Rusty Sword, 3 Health Potions, and 50 Gold!", "positive");
        
        this.modifyStat('str', 2);
        this.modifyStat('int', 2);
        this.modifyFame(10);
        this.modifyMood(10, "Feeling the power of growth!");
        
        // Meet first party member
        this.meetRandomPartyMember();
    }
    
    if (age === 12 && !milestones.includes('combat_training')) {
        milestones.push('combat_training');
        this.addLogEntry("⚔️ Real combat training begins!", "special");
        this.triggerTrainingChoice();
    }
    
    // ============ Teen Phase (13-17) ============
    if (age === 13 && !milestones.includes('cheat_boost')) {
        milestones.push('cheat_boost');
        this.addLogEntry("⚡ Your cheat skill is awakening further!", "special");
        this.boostCheatSkill();
        this.gainExp(80);
    }
    
    if (age === 15 && !milestones.includes('guild_join')) {
        milestones.push('guild_join');
        this.addLogEntry("🏛️ You've been promoted to E-Rank adventurer!", "quest");
        s.guildRank = Math.max(s.guildRank, 1);
        this.modifyFame(20);
        this.modifyMood(15, "Guild promotion — a dream come true!");
    }
    
    // ============ Young Adult Phase (18-24) ============
    if (age === 18 && !milestones.includes('adult')) {
        milestones.push('adult');
        this.addLogEntry("� You've come of age! You are now a full-fledged adventurer.", "special");
        s.inSchool = false;
        this.modifyStat('str', 3);
        this.modifyStat('int', 3);
        this.addLogEntry("🏛️ Promoted to D-Rank!", "quest");
        s.guildRank = Math.max(s.guildRank, 2);
        this.modifyFame(30);
        this.modifyMood(15, null);
    }
    
    if (age === 20 && !milestones.includes('first_journey')) {
        milestones.push('first_journey');
        const newLoc = this.randomInt(1, this.worldLocations.length - 1);
        s.currentLocation = newLoc;
        s.locationYears = 0;
        this.addLogEntry("🌍 Time for the great adventure! You bid farewell to your family and set out on your journey.", "special");
        this.addLogEntry(`📍 After days of travel, you arrived at ${this.getLocationName(newLoc)}!`, "quest");
        this.modifyMood(12, null);
    }
    
    // ============ Adult Phase (25+) ============
    if (age === 25 && !milestones.includes('demon_war')) {
        milestones.push('demon_war');
        this.addLogEntry("⚔️ The Demon Lord's forces have launched a major attack on the southern kingdoms!", "battle");
        this.triggerBattle('strong');
        this.modifyMood(-8, "War is upon us...");
    }
    
    if (age === 30 && !milestones.includes('demon_lord')) {
        milestones.push('demon_lord');
        this.triggerDemonLordEvent();
    }
};

// ============ PHASE EVENTS (recurring per phase) ============
GameEngine.prototype.triggerPhaseEvents = function() {
    const phase = this.state.storyPhase;
    const age = this.state.age;
    const s = this.state;
    const father = s.parents?.father;
    const mother = s.parents?.mother;
    const parentAlive = (father && father.alive) || (mother && mother.alive);
    const randomParent = parentAlive ? (father && father.alive ? (mother && mother.alive ? this.randomPick([father, mother]) : father) : mother) : null;
    
    // Track location years
    s.locationYears++;
    
    // Location events for adults
    if (age >= 15) {
        this.triggerLocationEvent();
    }
    
    // Friend departure system
    if (age >= 18) {
        this.checkFriendDepartures();
    }
    
    // Spouse events
    if (s.married && s.marriedToData) {
        this.triggerSpouseEvent();
    }
    
    switch(phase) {
        case 'baby':
        case 'toddler':
            if (this.chance(60) && parentAlive) {
                this.triggerChildhoodEvent(randomParent);
                this.modifyMood(3, null);
            }
            if (this.chance(25)) this.triggerSiblingEvent();
            break;
            
        case 'child':
            if (this.chance(50) && parentAlive) this.triggerChildhoodEvent(randomParent);
            if (this.chance(30)) this.triggerSiblingEvent();
            if (this.chance(35)) this.triggerSchoolEvent();
            break;
            
        case 'preteen':
            if (this.chance(40) && parentAlive) this.triggerChildhoodEvent(randomParent);
            if (this.chance(30)) this.triggerSiblingEvent();
            if (this.chance(50)) this.triggerPreteenEvent();
            break;
            
        case 'teen':
            if (this.chance(50)) {
                const event = this.randomPick(DATA.teenEvents);
                this.addLogEntry(`✨ ${event.text}`, 'special');
                this.modifyStat(event.stat, event.amount);
            }
            if (this.chance(25)) this.meetRandomPartyMember();
            if (this.chance(25)) this.triggerSiblingEvent();
            if (this.chance(30)) this.triggerTrainingEvent();
            break;
            
        case 'young_adult':
            if (this.chance(40)) {
                const event = this.randomPick(DATA.adultEvents);
                this.addLogEntry(`✨ ${event.text}`, 'special');
                this.modifyStat(event.stat, event.amount);
            }
            if (this.chance(30)) this.triggerRandomEncounter();
            if (this.chance(20)) this.meetRandomPartyMember();
            if (this.chance(30)) this.triggerTrainingEvent();
            break;
            
        case 'adult':
            if (this.chance(35)) {
                const event = this.randomPick(DATA.adultEvents);
                this.addLogEntry(`✨ ${event.text}`, 'special');
                this.modifyStat(event.stat, event.amount);
            }
            if (this.chance(25)) this.triggerRandomEncounter();
            if (this.chance(15) && !s.married) this.triggerRomanceHint();
            if (age % 5 === 0 && this.chance(40)) this.meetRandomPartyMember();
            if (this.chance(25)) this.triggerTrainingEvent();
            break;
            
        case 'mature':
            if (this.chance(35)) this.triggerMatureEvent();
            if (this.chance(20)) this.triggerRandomEncounter();
            if (age % 5 === 0 && this.chance(30)) this.meetRandomPartyMember();
            break;
            
        case 'elder':
            if (this.chance(40)) this.triggerElderEvent();
            break;
    }
    
    // Random additional events (kept from English version)
    this.triggerRandomEvents();
    
    this.checkAchievements();
};

// ============ CHILDHOOD EVENT ============
GameEngine.prototype.triggerChildhoodEvent = function(parent) {
    if (!parent) return;
    
    const event = this.randomPick(DATA.childhoodEvents);
    const text = event.text.replace('{parent}', `your ${parent.relation.toLowerCase()} ${parent.firstName}`);
    
    this.addLogEntry(`👨‍👧 ${text}`, 'normal');
    this.modifyStat(event.stat, event.amount);
};

// ============ SIBLING EVENT ============
GameEngine.prototype.triggerSiblingEvent = function() {
    if (!this.state.siblings || this.state.siblings.length === 0) return;
    
    const aliveSiblings = this.state.siblings.filter(s => s.alive);
    if (aliveSiblings.length === 0) return;
    
    const sibling = this.randomPick(aliveSiblings);
    const event = this.randomPick(DATA.siblingEvents);
    const text = event.text.replace('{sibling}', `${sibling.relation.toLowerCase()} ${sibling.name}`);
    
    this.addLogEntry(`👫 ${text}`, 'normal');
    this.modifyStat(event.stat, event.amount);
    
    // Increase sibling affection
    sibling.affection = Math.min(100, sibling.affection + this.randomInt(1, 5));
};

// ============ TEEN EVENT ============
GameEngine.prototype.triggerTeenEvent = function() {
    const event = this.randomPick(DATA.teenEvents);
    this.addLogEntry(`🌟 ${event.text}`, 'special');
    this.modifyStat(event.stat, event.amount);
    this.gainExp(this.randomInt(20, 50));
};

// ============ ADULT EVENT ============
GameEngine.prototype.triggerAdultEvent = function() {
    const event = this.randomPick(DATA.adultEvents);
    this.addLogEntry(`⭐ ${event.text}`, 'special');
    this.modifyStat(event.stat, event.amount);
    this.gainExp(this.randomInt(40, 100));
    this.modifyFame(this.randomInt(5, 20));
};

// ============ SCHOOL EVENT ============
GameEngine.prototype.triggerSchoolEvent = function() {
    const schoolEvents = [
        { text: "You learned a new lesson about ancient history.", stat: "int", amount: 1, mood: 3 },
        { text: "You did well in the physical training class today.", stat: "agi", amount: 1, mood: 4 },
        { text: "You completed a difficult assignment and feel proud!", stat: "int", amount: 2, mood: 6 },
        { text: "You made new friends in class.", stat: "cha", amount: 1, mood: 5 },
        { text: "You got into an argument with a classmate but made up.", stat: "cha", amount: 1, mood: -3 },
        { text: "You participated in art class and created a beautiful painting.", stat: "cha", amount: 1, mood: 5 },
        { text: "The teacher praised your intelligence in front of the whole class!", stat: "int", amount: 2, mood: 8 },
        { text: "You didn't understand the lesson and felt frustrated.", stat: "int", amount: 0, mood: -5 },
    ];
    
    const event = this.randomPick(schoolEvents);
    this.addLogEntry(`🏫 ${event.text}`, 'normal');
    if (event.stat && event.amount > 0) this.modifyStat(event.stat, event.amount);
    if (event.mood) this.modifyMood(event.mood, null);
};

// ============ PRETEEN EVENT ============
GameEngine.prototype.triggerPreteenEvent = function() {
    const events = [
        { text: "You started learning basic combat techniques on your own.", stat: "str", amount: 2, mood: 5 },
        { text: "You discovered a hidden ability while playing.", stat: "int", amount: 2, mood: 8 },
        { text: "You snuck out to explore the edges of the nearby forest.", stat: "agi", amount: 2, mood: 6 },
        { text: "You helped a stranger who gave you wise advice.", stat: "cha", amount: 2, mood: 4 },
        { text: "You found an old broken sword and started practicing with it.", stat: "str", amount: 2, mood: 5 },
        { text: "You eagerly read a book about ancient magic.", stat: "int", amount: 3, mood: 6 },
    ];
    
    const event = this.randomPick(events);
    this.addLogEntry(`⭐ ${event.text}`, 'special');
    this.modifyStat(event.stat, event.amount);
    this.modifyMood(event.mood, null);
};

// ============ MATURE EVENT ============
GameEngine.prototype.triggerMatureEvent = function() {
    const events = [
        { text: "A young adventurer came seeking your wisdom and advice.", stat: "cha", amount: 3, mood: 8 },
        { text: "You were invited to mediate a dispute between two villages.", stat: "cha", amount: 4, mood: 5 },
        { text: "You wrote a chapter in your memoirs about your adventures.", stat: "int", amount: 2, mood: 6 },
        { text: "You trained in an advanced technique you had been putting off.", stat: "str", amount: 3, mood: 4 },
        { text: "You discovered that your reputation has reached even distant continents!", stat: "cha", amount: 3, mood: 10 },
        { text: "You returned to visit your original village after many years.", stat: "cha", amount: 2, mood: 8 },
    ];
    
    const event = this.randomPick(events);
    this.addLogEntry(`📖 ${event.text}`, 'normal');
    this.modifyStat(event.stat, event.amount);
    this.modifyMood(event.mood, null);
};

// ============ ELDER EVENT ============
GameEngine.prototype.triggerElderEvent = function() {
    const events = [
        { text: "You sat on a hill watching the sunset, reminiscing about your journey.", mood: 5 },
        { text: "A new generation of heroes asks for your blessing before their journey.", stat: "cha", amount: 2, mood: 8 },
        { text: "You felt more tired than usual today.", mood: -5 },
        { text: "You received a letter from an old friend remembering your adventures.", mood: 10 },
        { text: "Your stories about the past inspire the children of the village.", stat: "cha", amount: 1, mood: 6 },
        { text: "You visited an old companion's grave and placed flowers.", mood: -8 },
    ];
    
    const event = this.randomPick(events);
    this.addLogEntry(`🌅 ${event.text}`, 'normal');
    if (event.stat) this.modifyStat(event.stat, event.amount);
    this.modifyMood(event.mood, null);
};

// ============ ROMANCE HINTS ============
GameEngine.prototype.triggerRomanceHint = function() {
    const activeRels = this.state.relationships.filter(r => r.active !== false);
    if (activeRels.length === 0) return;
    const rel = this.randomPick(activeRels);
    
    const hints = [
        `You spent a wonderful time with ${rel.name}. Could there be something more than friendship?`,
        `You noticed ${rel.name} always smiles when they see you.`,
        `${rel.name} surprised you with a small gift.`,
        `Your heart beats faster whenever ${rel.name} is near...`,
    ];
    
    this.addLogEntry(`💕 ${this.randomPick(hints)}`, 'romance');
    rel.affection = Math.min(100, rel.affection + this.randomInt(3, 8));
    this.modifyMood(5, null);
};

// ============ TRAINING CHOICE (Age 12 Milestone) ============
GameEngine.prototype.triggerTrainingChoice = function() {
    this.pendingChoice = `
        <div class="section-header">⚔️ Choose Your Training Specialization</div>
        <button class="choice-btn" onclick="game.selectTraining('str')">💪 Strength Training</button>
        <button class="choice-btn" onclick="game.selectTraining('int')">🧠 Magic Studies</button>
        <button class="choice-btn" onclick="game.selectTraining('agi')">🏃 Speed Training</button>
        <button class="choice-btn" onclick="game.selectTraining('balanced')">⚖️ Balanced Training</button>
    `;
    this.showAgeActions();
};

GameEngine.prototype.selectTraining = function(type) {
    switch(type) {
        case 'str':
            this.modifyStat('str', 5);
            this.addLogEntry("💪 You focused on building your physical strength!", 'positive');
            break;
        case 'int':
            this.modifyStat('int', 5);
            this.addLogEntry("🧠 You dove deep into the study of magic!", 'positive');
            break;
        case 'agi':
            this.modifyStat('agi', 5);
            this.addLogEntry("🏃 You trained your speed and agility!", 'positive');
            break;
        case 'balanced':
            this.modifyStat('str', 2);
            this.modifyStat('int', 2);
            this.modifyStat('agi', 2);
            this.addLogEntry("⚖️ You developed all your abilities equally!", 'positive');
            break;
    }
    this.pendingChoice = null;
    this.showAgeActions();
};

// ============ LOCATION EVENTS ============
GameEngine.prototype.triggerLocationEvent = function() {
    const s = this.state;
    const locName = this.getLocationName(s.currentLocation);
    const years = s.locationYears;
    
    // Events tied to settling in a location
    if (years === 1) {
        this.addLogEntry(`📍 You started exploring ${locName} and getting to know its people.`, 'quest');
    } else if (years === 3 && this.chance(60)) {
        this.addLogEntry(`🏠 You've become well known in ${locName}. People greet you on the streets.`, 'normal');
        this.modifyStat('cha', 1);
        this.modifyMood(5, null);
    } else if (years === 5 && this.chance(50)) {
        this.addLogEntry(`⭐ You've become an important figure in ${locName}!`, 'special');
        this.modifyStat('cha', 2);
        this.modifyFame(10);
    } else if (years >= 3 && this.chance(15)) {
        const locEvents = [
            `🎪 An annual festival was held in ${locName}! You enjoyed the celebrations.`,
            `🏪 A new merchant set up shop in ${locName}. You discovered exciting goods.`,
            `🌧️ A powerful storm hit ${locName}. You helped with the rebuilding.`,
            `📯 Important news reached ${locName} from the capital.`,
            `🎭 A traveling theater troupe performed a story about ancient heroes in ${locName}.`,
        ];
        this.addLogEntry(this.randomPick(locEvents), 'normal');
        this.modifyMood(this.randomInt(2, 6), null);
    }
    
    // Travel — doesn't happen every year, every 3-8 years
    if (years >= this.randomInt(3, 8) && this.chance(25) && s.age >= 18) {
        const newLoc = this.randomInt(0, this.worldLocations.length - 1);
        if (newLoc !== s.currentLocation) {
            const oldName = locName;
            s.currentLocation = newLoc;
            s.locationYears = 0;
            s.locationEvents = 0;
            this.addLogEntry(`🗺️ After ${years} years in ${oldName}, you decided to move on.`, 'normal');
            this.addLogEntry(`📍 You arrived at ${this.getLocationName(newLoc)}! A new place and new adventures await.`, 'quest');
            this.modifyFame(5);
            this.modifyMood(8, null);
        }
    }
};

// ============ FRIEND DEPARTURE SYSTEM ============
GameEngine.prototype.checkFriendDepartures = function() {
    const s = this.state;
    const activeRels = s.relationships.filter(r => r.active !== false);
    
    if (activeRels.length <= 1) return;
    
    activeRels.forEach(rel => {
        // Spouse cannot depart
        if (s.married && rel.name === s.marriedTo) return;
        
        const yearsKnown = s.age - (rel.metAge || 0);
        
        // Friends with low affection for a long time may leave
        if (rel.affection < 30 && yearsKnown > 3 && this.chance(15)) {
            rel.active = false;
            rel.departReason = 'Drifted apart due to weak bonds';
            this.addLogEntry(`👋 ${rel.name} the ${rel.type} decided to go their own way. The bond wasn't strong enough.`, 'negative');
            this.modifyMood(-5, null);
            return;
        }
        
        // Some friends leave for story reasons after a while
        if (yearsKnown > 8 && this.chance(8)) {
            const reasons = [
                { reason: 'Returned to homeland', text: `🚶 ${rel.name} decided to return to their homeland. You said goodbye with tears.` },
                { reason: 'Set off on a solo journey', text: `🌍 ${rel.name} told you they want to explore the world alone. You wished them well.` },
                { reason: 'Settled in another city', text: `🏠 ${rel.name} found a place that suits them and settled down. You promised to stay in touch.` },
                { reason: 'Retired from adventuring', text: `⚔️ ${rel.name} decided to retire from the adventuring life. "I've had enough" they said with a smile.` },
            ];
            const departure = this.randomPick(reasons);
            rel.active = false;
            rel.departReason = departure.reason;
            this.addLogEntry(departure.text, 'normal');
            this.modifyMood(-8, `Will miss ${rel.name}...`);
            return;
        }
        
        // Affection naturally decreases if player doesn't interact
        if (this.chance(20) && rel.affection > 10) {
            rel.affection = Math.max(5, rel.affection - this.randomInt(1, 3));
        }
    });
};

// ============ SPOUSE EVENTS ============
GameEngine.prototype.triggerSpouseEvent = function() {
    if (!this.chance(40)) return;
    
    const spouse = this.state.marriedToData;
    const spouseName = spouse.name;
    
    const events = [
        { text: `💕 You spent a beautiful day with ${spouseName}. Love grows deeper.`, mood: 6 },
        { text: `🍳 ${spouseName} cooked you a delicious meal.`, mood: 4 },
        { text: `😤 You had a fight with ${spouseName}... but made up before bed.`, mood: -3 },
        { text: `🌙 You sat with ${spouseName} stargazing and talking about the future.`, mood: 8 },
        { text: `🎁 ${spouseName} surprised you with a lovely gift!`, mood: 7 },
        { text: `💪 You trained with ${spouseName}. They're stronger than you thought!`, mood: 5 },
        { text: `🏠 You and ${spouseName} are planning to expand the house.`, mood: 4 },
        { text: `❤️ ${spouseName} reminds you that you're the best thing that ever happened to them.`, mood: 10 },
    ];
    
    const event = this.randomPick(events);
    this.addLogEntry(event.text, 'romance');
    this.modifyMood(event.mood, null);
    
    // Update spouse affection
    if (event.mood > 0) {
        spouse.affection = Math.min(100, spouse.affection + 1);
    }
    
    // Chance to have a child
    this.triggerChildbirthEvent();
};

// ============ CHILDBIRTH SYSTEM ============
GameEngine.prototype.triggerChildbirthEvent = function() {
    const s = this.state;
    if (!s.married || !s.marriedToData) return;
    if (!s.children) s.children = [];
    
    // Max 5 children, must be at least age 20, cooldown of 2 years between children
    if (s.children.length >= 5) return;
    if (s.age < 20) return;
    if (s.age > 45) return;
    
    const lastChildAge = s.children.length > 0 ? s.children[s.children.length - 1].bornAtAge : 0;
    if (s.age - lastChildAge < 2 && s.children.length > 0) return;
    
    // 25% chance per eligible year
    if (!this.chance(25)) return;
    
    const childGender = this.chance(50) ? 'male' : 'female';
    const namePool = childGender === 'male' ? DATA.firstNamesMale : DATA.firstNamesFemale;
    
    // Avoid duplicate names
    const usedNames = s.children.map(c => c.name);
    let childName;
    let attempts = 0;
    do {
        childName = this.randomPick(namePool);
        attempts++;
    } while (usedNames.includes(childName) && attempts < 20);
    
    const child = {
        name: childName,
        gender: childGender,
        bornAtAge: s.age,
    };
    
    s.children.push(child);
    
    const spouseName = s.marriedToData.name;
    const childType = childGender === 'male' ? 'son' : 'daughter';
    const childIcon = childGender === 'male' ? '👦' : '👧';
    
    this.addLogEntry(`${childIcon} Amazing news! You and ${spouseName} had a baby ${childType}! You named them ${childName}.`, 'special');
    this.modifyMood(20, `A new member of the family!`);
    this.modifyStat('cha', 2);
};

// ============ RANDOM PARTY MEMBER MEETING ============
GameEngine.prototype.meetRandomPartyMember = function() {
    // 50% chance to use preset characters, 50% chance to generate random
    if (this.chance(50)) {
        // Use preset characters
        const available = DATA.partyMembers.filter(member => 
            !this.state.relationships.find(r => r.name === member.name)
        );
        
        if (available.length > 0) {
            const member = this.randomPick(available);
            this.meetPartyMemberByData(member);
            return;
        }
    }
    
    // Generate a completely random party member
    this.meetGeneratedPartyMember();
};

GameEngine.prototype.meetGeneratedPartyMember = function() {
    // Pick a random type
    const typeData = this.randomPick(DATA.partyMemberTypes);
    const race = this.randomPick(typeData.races);
    const personality = this.randomPick(DATA.partyMemberPersonalities);
    
    // Generate a random name (pick gender randomly)
    const gender = this.chance(50) ? 'male' : 'female';
    const genderIcon = gender === 'male' ? '♂' : '♀';
    const genderLabel = gender === 'male' ? 'Male' : 'Female';
    const nameData = this.generateRandomName(gender);
    
    // Make sure we don't have duplicate names
    const existingNames = this.state.relationships.map(r => r.name);
    let attempts = 0;
    while (existingNames.includes(nameData.firstName) && attempts < 10) {
        const newNameData = this.generateRandomName(gender);
        nameData.firstName = newNameData.firstName;
        nameData.lastName = newNameData.lastName;
        nameData.fullName = newNameData.fullName;
        attempts++;
    }
    
    if (existingNames.includes(nameData.firstName)) return; // Give up if we can't find unique name
    
    const member = {
        name: nameData.firstName,
        fullName: nameData.fullName,
        icon: typeData.icon,
        type: typeData.type,
        race: race,
        personality: personality,
        gender: gender,
        genderIcon: genderIcon,
        baseAffection: this.randomInt(5, 35),
        level: Math.max(1, this.state.level + this.randomInt(-3, 3)),
        active: true,
        metAge: this.state.age,
        generated: true
    };
    
    this.meetPartyMemberByData(member);
};

GameEngine.prototype.meetPartyMemberByData = function(member) {
    // Check if already recruited
    if (this.state.relationships.find(r => r.name === member.name)) return;

    // Generate random meeting text
    const genderIcon = member.genderIcon || (member.gender === 'male' ? '♂' : member.gender === 'female' ? '♀' : '');
    const meetTexts = [
        `${member.icon} You met a ${member.personality.toLowerCase()} ${(member.race || member.type).toLowerCase()} named ${member.name}${genderIcon ? ' ' + genderIcon : ''}. They seem interested in joining your adventures!`,
        `${member.icon} A ${member.type} named ${member.name}${genderIcon ? ' ' + genderIcon : ''} crossed your path. After a brief interaction, they decided to stick around.`,
        `${member.icon} ${member.name}${genderIcon ? ' ' + genderIcon : ''}, a ${member.personality.toLowerCase()} ${member.type}, challenged you to prove your worth. You impressed them!`,
        `${member.icon} You found ${member.name} in trouble and helped them out. They're grateful and want to join you.`,
        `${member.icon} During your travels, you encountered ${member.name}. Something about you caught their attention.`,
        `${member.icon} "${member.personality === 'Tsundere' ? "I-it's not like I want to travel with you or anything!" : "Let's go on adventures together!"}" said ${member.name} the ${member.type}.`,
    ];

    this.addLogEntry(this.randomPick(meetTexts), 'romance');
    
    this.state.relationships.push({
        ...member,
        affection: member.baseAffection ? member.baseAffection + this.randomInt(-5, 10) : (member.affection || this.randomInt(20, 50)),
        recruited: true,
        gender: member.gender || (this.chance(50) ? 'male' : 'female'),
        genderIcon: member.genderIcon || genderIcon || '',
        active: member.active !== undefined ? member.active : true,
        metAge: member.metAge || this.state.age,
        level: member.level || Math.max(1, this.state.level + this.randomInt(-3, 3)),
    });

    this.modifyStat('cha', 1);
    this.modifyMood(6, null);
};

// ============ RANDOM EVENTS ============
GameEngine.prototype.triggerRandomEvents = function() {
    const age = this.state.age;
    if (age < 4) return; // No random events for babies

    // Chance-based events
    const roll = Math.random() * 100;
    const lck = this.state.lck;

    // Children (4-9) have limited events
    if (age < 10) {
        if (this.chance(30)) {
            this.triggerTrainingEvent();
        }
        // Sibling events
        if (this.state.siblings && this.state.siblings.length > 0 && this.chance(40)) {
            this.triggerSiblingEvent();
        }
        // Small gold from parents/allowance
        if (this.chance(20)) {
            const amount = this.randomInt(1, 5);
            this.addLogEntry(`💰 Your parents gave you ${amount} gold as allowance!`, 'positive');
            this.modifyGold(amount);
        }
        return;
    }

    // Teen events (10-17)
    if (age >= 10 && age < 18) {
        if (this.chance(25)) {
            this.triggerTeenEvent();
        }
    }

    // Adult events (18+)
    if (age >= 18 && this.chance(20)) {
        this.triggerAdultEvent();
    }

    // Training events
    if (this.chance(40)) {
        this.triggerTrainingEvent();
    }

    // Sibling events (throughout life)
    if (this.state.siblings && this.state.siblings.length > 0 && this.chance(25)) {
        this.triggerSiblingEvent();
    }

    // Random encounter from pool
    if (age >= 10 && this.chance(35)) {
        this.triggerDynamicEncounter();
    }

    // Random battle encounter
    if (age >= 10 && this.chance(25)) {
        this.triggerRandomEncounter();
    }

    // Gold events
    if (this.chance(20)) {
        this.triggerGoldEvent();
    }

    // Relationship events
    if (this.state.relationships.length > 0 && this.chance(35)) {
        this.triggerRelationshipEvent();
    }

    // Item find
    if (this.chance(15 + lck)) {
        this.triggerItemFind();
    }

    // Skill learning
    if (age >= 8 && this.chance(20)) {
        this.triggerSkillEvent();
    }

    // Beach/Hot spring episode (anime classic!)
    if (age >= 14 && this.chance(8)) {
        this.triggerFanserviceEpisode();
    }

    // Festival event
    if (this.chance(12)) {
        this.triggerFestivalEvent();
    }

    // Random stat boost from daily life
    if (this.chance(25)) {
        const stats = ['str', 'int', 'agi', 'cha', 'lck'];
        const stat = this.randomPick(stats);
        const gain = this.randomInt(1, 2);
        this.modifyStat(stat, gain);
    }

    // Guild rank up check
    if (this.state.hasGuild && this.state.level > (this.state.guildRank + 1) * 5) {
        if (this.state.guildRank < DATA.guildRanks.length - 1) {
            this.state.guildRank++;
            this.addLogEntry(`🏛️ Guild Rank Up! You are now ${DATA.guildRanks[this.state.guildRank]}-Rank!`, 'quest');
            this.modifyFame(this.state.guildRank * 15);
            if (this.state.guildRank >= DATA.guildRanks.length - 1) {
                this.unlockAchievement('guild_master');
            }
        }
    }

    // Marriage proposal at high affection
    if (age >= 18 && !this.state.married && this.chance(10)) {
        this.triggerMarriageEvent();
    }
};

// ============ SPECIFIC EVENTS ============

// Dynamic random encounters
GameEngine.prototype.triggerDynamicEncounter = function() {
    const encounter = this.randomPick(DATA.randomEncounters);
    
    switch(encounter.type) {
        case 'shop':
            this.addLogEntry(`🏪 ${encounter.text}`, 'normal');
            if (this.state.gold >= 50 && this.chance(50)) {
                this.modifyGold(-this.randomInt(20, 50));
                this.triggerItemFind();
            }
            break;
        case 'treasure':
            this.addLogEntry(`💎 ${encounter.text}`, 'special');
            this.modifyGold(this.randomInt(20, 100 + this.state.lck * 2));
            if (this.chance(30)) this.triggerItemFind();
            break;
        case 'battle':
            this.addLogEntry(`⚔️ ${encounter.text}`, 'battle');
            this.triggerBattle(this.state.level < 15 ? 'weak' : 'medium');
            break;
        case 'rescue':
            this.addLogEntry(`🆘 ${encounter.text}`, 'quest');
            this.modifyStat('cha', this.randomInt(1, 3));
            this.modifyFame(this.randomInt(5, 15));
            this.gainExp(this.randomInt(20, 50));
            break;
        case 'explore':
            this.addLogEntry(`🏛️ ${encounter.text}`, 'quest');
            this.modifyStat('int', this.randomInt(1, 2));
            this.gainExp(this.randomInt(15, 40));
            break;
        case 'training':
            this.addLogEntry(`📖 ${encounter.text}`, 'normal');
            const stat = this.randomPick(['str', 'int', 'agi']);
            this.modifyStat(stat, this.randomInt(2, 4));
            this.gainExp(this.randomInt(25, 50));
            break;
        case 'special':
            this.addLogEntry(`✨ ${encounter.text}`, 'special');
            this.modifyStat('lck', this.randomInt(1, 3));
            this.modifyFame(this.randomInt(10, 25));
            break;
        case 'festival':
            this.addLogEntry(`🎆 ${encounter.text}`, 'special');
            this.modifyStat('cha', this.randomInt(1, 2));
            this.state.relationships.forEach(r => {
                r.affection = Math.min(100, r.affection + this.randomInt(1, 5));
            });
            break;
        case 'quest':
            this.addLogEntry(`📜 ${encounter.text}`, 'quest');
            this.doGuildQuest();
            break;
    }
};

GameEngine.prototype.meetPartyMember = function(index) {
    if (index >= DATA.partyMembers.length) return;
    const member = DATA.partyMembers[index];
    this.meetPartyMemberByData(member);
};

GameEngine.prototype.triggerTrainingEvent = function() {
    const events = [
        { text: "🏋️ You spent the day training with weights.", stats: { str: this.randomInt(1, 3) }, exp: 15 },
        { text: "📖 You studied ancient spellbooks late into the night.", stats: { int: this.randomInt(1, 3) }, exp: 15 },
        { text: "🏃 You practiced running through the forest at full speed.", stats: { agi: this.randomInt(1, 3) }, exp: 15 },
        { text: "🧘 You meditated under a waterfall to increase your mana control.", stats: { int: 1, agi: 1 }, exp: 20 },
        { text: "⚔️ You sparred with other adventurers at the training grounds.", stats: { str: 1, agi: 1 }, exp: 25 },
        { text: "🎭 You practiced your social skills at the tavern.", stats: { cha: this.randomInt(1, 3) }, exp: 10 },
    ];

    const event = this.randomPick(events);
    this.addLogEntry(event.text, 'normal', event.stats);
    Object.entries(event.stats).forEach(([stat, val]) => this.modifyStat(stat, val));
    this.gainExp(event.exp);
};

GameEngine.prototype.triggerRandomEncounter = function() {
    const locName = this.getLocationName(this.state.currentLocation);
    const events = [
        () => {
            this.addLogEntry(`⚔️ While exploring near ${locName}, you encountered a monster!`, 'battle');
            this.triggerBattle('weak');
        },
        () => {
            this.addLogEntry(`⚔️ A powerful monster roams the roads of ${locName}!`, 'battle');
            this.triggerBattle('medium');
        },
        () => {
            const gold = this.randomInt(50, 200);
            this.state.gold += gold;
            this.addLogEntry(`💰 You found a hidden treasure near ${locName}! +${gold} Gold`, 'positive');
        },
        () => {
            this.addLogEntry(`🔮 A mysterious merchant in ${locName}'s market sold you a strange potion...`, 'normal');
            if (this.chance(70)) {
                this.modifyStat(this.randomPick(['str', 'int', 'agi', 'cha', 'lck']), 3);
                this.addLogEntry("✨ You feel power flowing through your body!", 'positive');
            } else {
                this.addLogEntry("🤢 No effect... Maybe you got scammed.", 'negative');
            }
        },
        () => {
            this.addLogEntry(`🐾 You found an injured magical creature near ${locName} and nursed it back to health!`, 'positive');
            this.modifyStat('cha', 2);
            this.modifyStat('lck', 1);
        },
        () => {
            const tier = this.chance(30) ? 'medium' : 'weak';
            this.addLogEntry(`⚠️ You were ambushed on the roads of ${locName}!`, 'battle');
            this.triggerBattle(tier);
        },
        () => {
            this.addLogEntry(`🏛️ You discovered ancient ruins hidden near ${locName}!`, 'quest');
            this.gainExp(this.randomInt(30, 80));
            this.modifyStat('int', 1);
        },
    ];

    this.randomPick(events)();
};

GameEngine.prototype.triggerBattle = function(tier) {
    const monster = this.randomPick(DATA.monsters[tier]);
    const monsterPower = tier === 'weak' ? 10 : tier === 'medium' ? 30 : tier === 'strong' ? 60 : 100;
    const playerPower = this.state.str + this.state.agi + this.state.int + (this.state.lck / 2);
    
    const winChance = Math.min(90, Math.max(20, 50 + (playerPower - monsterPower)));
    const won = this.chance(winChance);

    if (won) {
        const goldReward = this.randomInt(monsterPower, monsterPower * 3);
        const expReward = this.randomInt(monsterPower, monsterPower * 2);
        
        this.addLogEntry(`⚔️ You encountered a ${monster}! After an intense battle, you emerged victorious!`, 'battle');
        this.modifyGold(goldReward);
        this.gainExp(expReward);
        this.modifyFame(Math.floor(monsterPower / 5));
        
        // First battle achievement
        if (!this.state.achievements.includes('first_blood')) {
            this.unlockAchievement('first_blood');
        }

        // Random stat gain from battle
        const stat = this.randomPick(['str', 'agi', 'int']);
        this.modifyStat(stat, this.randomInt(1, 2));
    } else {
        this.addLogEntry(`⚔️ You encountered a ${monster}! The battle was tough and you had to retreat...`, 'negative');
        this.state.hp = Math.floor(this.state.maxHp * 0.3);
        this.modifyStat('str', 1); // You learn from defeat
        this.gainExp(Math.floor(monsterPower / 2));
        
        // Chance of death from strong monsters if very unlucky
        if (tier === 'strong' || tier === 'boss') {
            if (this.chance(5 - this.state.lck * 0.1)) {
                this.triggerDeath({ 
                    text: `The ${monster} proved too powerful... Your adventure ends here.`, 
                    emoji: "💀" 
                });
            }
        }
    }
};

GameEngine.prototype.triggerGoldEvent = function() {
    if (this.chance(60)) {
        const amount = this.randomInt(10, 50 + this.state.lck * 2);
        const events = [
            `💰 You found ${amount} gold coins on the road!`,
            `💰 A quest reward of ${amount} gold was deposited!`,
            `💰 You sold some monster drops for ${amount} gold!`,
        ];
        this.addLogEntry(this.randomPick(events), 'positive');
        this.modifyGold(amount);
    } else {
        const amount = this.randomInt(5, 30);
        const events = [
            `💸 A pickpocket stole ${amount} gold from you!`,
            `💸 You had to pay ${amount} gold for inn repairs after a magic accident...`,
            `💸 You bought some questionable street food for ${amount} gold. It was terrible.`,
        ];
        this.addLogEntry(this.randomPick(events), 'negative');
        this.modifyGold(-amount);
    }
};

GameEngine.prototype.triggerRelationshipEvent = function() {
    if (this.state.relationships.length === 0) return;
    const rel = this.randomPick(this.state.relationships);
    
    const events = [
        { text: `${rel.icon} ${rel.name} cooked you a meal. It was ${this.chance(50) ? 'delicious!' : 'burnt... but you ate it anyway.'}`, affection: this.randomInt(2, 8) },
        { text: `${rel.icon} You and ${rel.name} trained together today.`, affection: this.randomInt(3, 6) },
        { text: `${rel.icon} ${rel.name} got into trouble and you helped them out!`, affection: this.randomInt(5, 10) },
        { text: `${rel.icon} You accidentally walked in on ${rel.name} changing... ${rel.personality === 'Tsundere' ? '"B-BAKA!"' : '*awkward silence*'}`, affection: this.chance(50) ? 5 : -5 },
        { text: `${rel.icon} ${rel.name} shared a story about their past with you.`, affection: this.randomInt(3, 8) },
        { text: `${rel.icon} You bought ${rel.name} a gift from the market.`, affection: this.randomInt(5, 12) },
        { text: `${rel.icon} ${rel.name} fell asleep on your shoulder. ${rel.personality === 'Devoted' ? 'They looked peaceful.' : 'How embarrassing!'}`, affection: this.randomInt(3, 7) },
    ];

    const event = this.randomPick(events);
    rel.affection = Math.max(0, Math.min(100, rel.affection + event.affection));
    this.addLogEntry(event.text, 'romance');

    // Check for max affection achievement
    if (rel.affection >= 100) {
        this.unlockAchievement('popular');
    }

    // Check harem achievement
    const highAffection = this.state.relationships.filter(r => r.affection >= 80).length;
    if (highAffection >= 5) {
        this.unlockAchievement('harem');
    }
};

GameEngine.prototype.triggerItemFind = function() {
    const lck = this.state.lck;
    let pool = [];
    
    // Higher luck = better items
    pool.push('health_potion', 'mana_potion');
    if (lck > 10) pool.push('leather_armor', 'luck_charm');
    if (lck > 20) pool.push('iron_sword', 'ring_charisma');
    if (lck > 30) pool.push('flame_blade', 'mithril_armor');
    if (lck > 40) pool.push('shadow_dagger', 'staff_wisdom', 'rare_candy');
    if (lck > 60) pool.push('holy_sword', 'dragon_armor');

    const itemId = this.randomPick(pool);
    const item = DATA.items[itemId];
    
    // Check if already in inventory
    const existing = this.state.inventory.find(i => i.itemId === itemId);
    if (existing) {
        existing.quantity++;
    } else {
        this.state.inventory.push({ itemId, quantity: 1 });
    }

    this.addLogEntry(`🎁 You found: ${item.icon} ${item.name}! (${item.rarity})`, 'positive');
};

GameEngine.prototype.triggerSkillEvent = function() {
    const available = Object.entries(DATA.skills).filter(([id, skill]) => {
        if (this.state.skills[id]) return false;
        return Object.entries(skill.requirement).every(([stat, val]) => this.state[stat] >= val);
    });

    if (available.length === 0) return;

    const [skillId, skill] = this.randomPick(available);
    this.state.skills[skillId] = 1;
    this.addLogEntry(`✨ You learned a new skill: ${skill.icon} ${skill.name}!`, 'special');
    this.gainExp(30);

    // Achievement
    if (Object.keys(this.state.skills).length >= 10) {
        this.unlockAchievement('all_skills');
    }
};

GameEngine.prototype.triggerFanserviceEpisode = function() {
    if (this.state.relationships.length === 0) return;
    
    const episodes = [
        "🏖️ Beach Episode! The whole party went to the seaside. Shenanigans ensued!",
        "♨️ Hot Spring Episode! You all visited a famous hot spring. The wall between the baths was suspiciously thin...",
        "👘 Festival Episode! Everyone dressed up in traditional clothes. There were fireworks!",
        "🏠 The party got stuck in a small inn room due to a storm. It was very... cozy.",
    ];

    this.addLogEntry(this.randomPick(episodes), 'romance');
    this.state.relationships.forEach(r => {
        r.affection = Math.min(100, r.affection + this.randomInt(2, 5));
    });
    this.modifyStat('cha', 1);
};

GameEngine.prototype.triggerFestivalEvent = function() {
    const events = [
        "🎆 A grand festival was held in town! You joined the celebrations.",
        "🎪 A traveling circus came to town with magical performances!",
        "🎵 A famous bard performed at the tavern. The whole town was singing!",
        "🍖 A grand feast was held to celebrate a successful monster hunt!",
        "🏆 The annual martial arts tournament is being held!",
    ];

    this.addLogEntry(this.randomPick(events), 'special');
    this.modifyStat('cha', 1);
    this.modifyFame(5);
    this.gainExp(15);
};

GameEngine.prototype.triggerSchoolArcEvent = function() {
    this.addLogEntry("🏫 The magical academy's annual exam is coming up!", "quest");
    
    if (this.state.int > 20) {
        this.addLogEntry("📝 You aced the exam! The teachers are impressed by your knowledge from your previous life.", "positive");
        this.modifyStat('int', 3);
        this.modifyFame(15);
    } else {
        this.addLogEntry("📝 The exam was tough, but you managed to pass thanks to your friends' help.", "normal");
        this.modifyStat('int', 1);
    }
    this.gainExp(40);
};

GameEngine.prototype.triggerTournamentEvent = function() {
    this.addLogEntry("🏟️ The Royal Tournament has begun! Adventurers from all over gather to compete!", "battle");
    
    const power = this.state.str + this.state.agi + (this.state.lck / 3);
    
    if (power > 40) {
        this.addLogEntry("🏆 You fought your way to the finals and WON the tournament! The crowd goes wild!", "special");
        this.modifyGold(500);
        this.modifyFame(50);
        this.gainExp(150);
        this.modifyStat('str', 3);
        this.modifyStat('cha', 3);
    } else if (power > 25) {
        this.addLogEntry("🥈 You made it to the semi-finals before being defeated. Still impressive!", "positive");
        this.modifyGold(200);
        this.modifyFame(20);
        this.gainExp(80);
        this.modifyStat('str', 2);
    } else {
        this.addLogEntry("😤 You were eliminated in the first round... but you learned a lot!", "negative");
        this.modifyStat('str', 2);
        this.modifyStat('agi', 1);
        this.gainExp(40);
    }
};

GameEngine.prototype.triggerDemonLordEvent = function() {
    if (this.state.demonLordDefeated) return;
    
    this.addLogEntry("👿 The Demon Lord has appeared! The final battle is upon you!", "battle");
    
    const totalPower = this.state.str + this.state.int + this.state.agi + this.state.lck + (this.state.level * 2);
    const partyBonus = this.state.relationships.filter(r => r.affection >= 50).length * 10;
    const finalPower = totalPower + partyBonus;

    if (finalPower > 150) {
        this.addLogEntry("⚔️ With your party by your side, you faced the Demon Lord in an epic battle!", "battle");
        this.addLogEntry("✨ Your bonds gave you strength! The Demon Lord has been defeated!", "special");
        this.addLogEntry("🎉 Peace has returned to Aetheria! You are hailed as the greatest hero!", "special");
        this.state.demonLordDefeated = true;
        this.unlockAchievement('demon_lord');
        this.modifyFame(200);
        this.modifyGold(5000);
        this.gainExp(500);
    } else {
        this.addLogEntry("💀 The Demon Lord was too powerful... You barely escaped with your life.", "negative");
        this.addLogEntry("💪 But you won't give up. You'll train harder and come back stronger!", "quest");
        this.state.hp = 1;
        this.modifyStat('str', 3);
        this.modifyStat('int', 3);
        this.gainExp(100);
    }
};

GameEngine.prototype.triggerMarriageEvent = function() {
    const eligible = this.state.relationships.filter(r => r.affection >= 80 && r.active !== false);
    if (eligible.length === 0) return;
    
    const partner = this.randomPick(eligible);
    const genderIcon = partner.gender === 'male' ? '♂' : partner.gender === 'female' ? '♀' : '';
    
    this.pendingChoice = `
        <div class="section-header">💒 A Special Moment</div>
        <div class="log-entry romance">
            ${partner.icon} ${genderIcon} ${partner.name} confesses their feelings for you!<br>
            <em>"I... I've always cared about you. Will you... be with me forever?"</em>
        </div>
        <button class="choice-btn" onclick="game.acceptMarriage('${partner.name}')">💒 "Yes! I love you too!"</button>
        <button class="choice-btn" onclick="game.rejectMarriage('${partner.name}')">💔 "I'm sorry... I can't."</button>
        <button class="choice-btn" onclick="game.showAgeActions()">😅 "Let me think about it..." (Skip)</button>
    `;
    this.showAgeActions();
};

GameEngine.prototype.acceptMarriage = function(name) {
    this.state.married = true;
    this.state.marriedTo = name;
    const partner = this.state.relationships.find(r => r.name === name);
    if (partner) {
        partner.affection = 100;
        this.state.marriedToData = {
            name: partner.name,
            fullName: partner.fullName || partner.name,
            gender: partner.gender || 'unknown',
            type: partner.type,
            personality: partner.personality,
            icon: partner.icon,
            affection: 100
        };
        // Remove spouse from party — they move to the Family tab
        const idx = this.state.relationships.indexOf(partner);
        if (idx !== -1) this.state.relationships.splice(idx, 1);
    }
    const spouseTitle = partner?.gender === 'male' ? 'husband' : partner?.gender === 'female' ? 'wife' : 'spouse';
    this.addLogEntry(`💒 You married ${name}! Your ${spouseTitle} is now part of your family. A beautiful ceremony was held in ${this.getLocationName(this.state.currentLocation)}.`, 'romance');
    this.modifyStat('cha', 5);
    this.modifyFame(30);
    this.modifyMood(25, "The happiest day of your life!");
    this.pendingChoice = null;
    this.showAgeActions();
};

GameEngine.prototype.rejectMarriage = function(name) {
    const partner = this.state.relationships.find(r => r.name === name);
    if (partner) partner.affection -= 20;
    this.addLogEntry(`💔 You turned down ${name}'s proposal... They looked heartbroken.`, 'negative');
    this.modifyMood(-8, "A painful choice...");
    this.pendingChoice = null;
    this.showAgeActions();
};

GameEngine.prototype.boostCheatSkill = function() {
    const skill = this.state.cheatSkill;
    const boosts = {
        sword: { str: 5, agi: 2 },
        magic: { int: 5, mp: 20 },
        healing: { int: 3, cha: 3 },
        stealth: { agi: 5, lck: 2 },
        charisma: { cha: 5, lck: 2 },
        luck: { lck: 7 },
    };
    const boost = boosts[skill] || {};
    Object.entries(boost).forEach(([stat, val]) => {
        if (stat === 'mp') {
            this.state.maxMp += val;
            this.state.mp = this.state.maxMp;
        } else {
            this.modifyStat(stat, val);
        }
    });
    this.addLogEntry(`🌟 Your ${DATA.cheatSkillNames[skill]} has grown stronger!`, 'special', boost);
};

// ============ MAIN ACTIONS TAB ============
GameEngine.prototype.showMainActions = function() {
    const panel = document.getElementById('action-panel');
    const s = this.state;
    
    let html = '<div class="section-header">⚡ Actions</div>';

    // Training actions
    html += `
        <button class="action-btn" onclick="game.doAction('train_str')">
            <span class="action-icon">🏋️</span>
            <span class="action-label">Strength Training<small>+STR, some EXP</small></span>
        </button>
        <button class="action-btn" onclick="game.doAction('train_int')">
            <span class="action-icon">📖</span>
            <span class="action-label">Study Magic<small>+INT, some EXP</small></span>
        </button>
        <button class="action-btn" onclick="game.doAction('train_agi')">
            <span class="action-icon">🏃</span>
            <span class="action-label">Agility Training<small>+AGI, some EXP</small></span>
        </button>
        <button class="action-btn" onclick="game.doAction('socialize')">
            <span class="action-icon">🗣️</span>
            <span class="action-label">Socialize<small>+CHA, party affection</small></span>
        </button>
    `;

    // Adventure actions (if in guild)
    if (s.hasGuild) {
        html += `
            <button class="action-btn" onclick="game.doAction('quest')">
                <span class="action-icon">📜</span>
                <span class="action-label">Take Guild Quest<small>Gold, EXP, Fame</small></span>
            </button>
            <button class="action-btn" onclick="game.doAction('dungeon')">
                <span class="action-icon">🏰</span>
                <span class="action-label">Explore Dungeon<small>Danger & Treasure!</small></span>
            </button>
            <button class="action-btn" onclick="game.doAction('hunt')">
                <span class="action-icon">⚔️</span>
                <span class="action-label">Hunt Monsters<small>Battle for EXP & loot</small></span>
            </button>
        `;
    }

    // Other actions
    html += `
        <button class="action-btn" onclick="game.doAction('rest')">
            <span class="action-icon">🏨</span>
            <span class="action-label">Rest at Inn<small>Restore HP/MP (-20G)</small></span>
        </button>
        <button class="action-btn" onclick="game.doAction('gamble')">
            <span class="action-icon">🎰</span>
            <span class="action-label">Visit Casino<small>Risk gold for more gold!</small></span>
        </button>
        <button class="action-btn" onclick="game.doAction('explore')">
            <span class="action-icon">🗺️</span>
            <span class="action-label">Explore Area<small>Discover new things</small></span>
        </button>
    `;

    panel.innerHTML = html;
};

GameEngine.prototype.doAction = function(action) {
    switch(action) {
        case 'train_str':
            this.modifyStat('str', this.randomInt(2, 4));
            this.gainExp(this.randomInt(10, 25));
            this.addLogEntry("🏋️ You trained your body hard today! You feel stronger.", 'normal', { str: 3 });
            break;
        case 'train_int':
            this.modifyStat('int', this.randomInt(2, 4));
            this.gainExp(this.randomInt(10, 25));
            this.addLogEntry("📖 You spent hours studying ancient tomes. Your mind is sharper.", 'normal', { int: 3 });
            break;
        case 'train_agi':
            this.modifyStat('agi', this.randomInt(2, 4));
            this.gainExp(this.randomInt(10, 25));
            this.addLogEntry("🏃 You practiced high-speed movement. You're faster now!", 'normal', { agi: 3 });
            break;
        case 'socialize':
            this.modifyStat('cha', this.randomInt(1, 3));
            this.state.relationships.forEach(r => {
                r.affection = Math.min(100, r.affection + this.randomInt(1, 5));
            });
            this.addLogEntry("🗣️ You spent quality time with your companions.", 'romance');
            break;
        case 'quest':
            this.doGuildQuest();
            break;
        case 'dungeon':
            this.doDungeon();
            break;
        case 'hunt':
            const tier = this.state.level < 10 ? 'weak' : this.state.level < 25 ? 'medium' : 'strong';
            this.triggerBattle(tier);
            break;
        case 'rest':
            if (this.state.gold >= 20) {
                this.modifyGold(-20);
                this.state.hp = this.state.maxHp;
                this.state.mp = this.state.maxMp;
                this.addLogEntry("🏨 You rested at the inn. Fully recovered!", 'positive');
            } else {
                this.addLogEntry("💸 You can't afford the inn! (Need 20G)", 'negative');
            }
            break;
        case 'gamble':
            this.doGamble();
            break;
        case 'explore':
            this.doExplore();
            break;
    }
    this.updateAllUI();
};

GameEngine.prototype.doGuildQuest = function() {
    const questType = this.randomPick(DATA.questTypes);
    const difficulty = Math.min(this.state.guildRank + 1, 5);
    const goldReward = this.randomInt(20, 50) * difficulty;
    const expReward = this.randomInt(30, 60) * difficulty;

    const success = this.chance(60 + this.state.lck);
    
    if (success) {
        this.addLogEntry(`📜 Quest Complete: ${questType}! Earned ${goldReward}G and ${expReward} EXP!`, 'quest');
        this.modifyGold(goldReward);
        this.gainExp(expReward);
        this.modifyFame(difficulty * 3);
        this.state.completedQuests++;
    } else {
        this.addLogEntry(`📜 Quest Failed: ${questType}... Better luck next time.`, 'negative');
        this.gainExp(Math.floor(expReward / 3));
    }
};

GameEngine.prototype.doDungeon = function() {
    const floors = this.randomInt(1, 5 + Math.floor(this.state.level / 5));
    let totalGold = 0;
    let totalExp = 0;

    this.addLogEntry(`🏰 You entered the Dark Labyrinth and explored ${floors} floors!`, 'quest');

    for (let i = 0; i < floors; i++) {
        if (this.chance(40)) {
            // Battle
            const tier = this.chance(30) ? 'medium' : 'weak';
            const monster = this.randomPick(DATA.monsters[tier]);
            const gold = this.randomInt(10, 40);
            const exp = this.randomInt(15, 40);
            totalGold += gold;
            totalExp += exp;
        }
        if (this.chance(30)) {
            totalGold += this.randomInt(20, 60);
        }
    }

    // Boss floor chance
    if (this.chance(20 + this.state.lck)) {
        this.addLogEntry("👹 You found the dungeon boss!", 'battle');
        if (this.state.str + this.state.int > 40) {
            totalGold += this.randomInt(100, 300);
            totalExp += this.randomInt(50, 150);
            this.addLogEntry("🎉 Boss defeated! Massive rewards!", 'special');
        } else {
            this.addLogEntry("💀 The boss was too strong! You fled!", 'negative');
            totalGold = Math.floor(totalGold / 2);
        }
    }

    this.modifyGold(totalGold);
    this.gainExp(totalExp);
    this.addLogEntry(`📊 Dungeon Results: +${totalGold}G, +${totalExp} EXP`, 'positive');
};

GameEngine.prototype.doGamble = function() {
    const bet = Math.min(this.state.gold, this.randomInt(20, 100));
    if (bet <= 0) {
        this.addLogEntry("💸 You're too broke to gamble!", 'negative');
        return;
    }

    const winChance = 35 + (this.state.lck / 2);
    if (this.chance(winChance)) {
        const winnings = bet * this.randomInt(2, 4);
        this.modifyGold(winnings);
        this.addLogEntry(`🎰 You bet ${bet}G and won ${winnings}G! Lucky!`, 'positive');
    } else {
        this.modifyGold(-bet);
        this.addLogEntry(`🎰 You bet ${bet}G and lost it all...`, 'negative');
    }
};

GameEngine.prototype.doExplore = function() {
    const events = [
        () => {
            this.addLogEntry("🗺️ You discovered a hidden cave! Inside was a treasure chest!", 'special');
            this.triggerItemFind();
        },
        () => {
            this.addLogEntry("🌸 You found a beautiful meadow with healing flowers. You feel refreshed.", 'positive');
            this.state.hp = this.state.maxHp;
            this.state.mp = this.state.maxMp;
        },
        () => {
            this.addLogEntry("👻 You stumbled upon ancient ruins with a mysterious inscription...", 'quest');
            this.modifyStat('int', 2);
            this.gainExp(25);
        },
        () => {
            this.addLogEntry("🐾 You found an injured magical creature and nursed it back to health!", 'positive');
            this.modifyStat('cha', 2);
            this.modifyStat('lck', 1);
        },
        () => {
            const tier = this.chance(30) ? 'medium' : 'weak';
            this.addLogEntry("⚠️ You were ambushed while exploring!", 'battle');
            this.triggerBattle(tier);
        },
        () => {
            const newLoc = this.randomInt(0, this.worldLocations.length - 1);
            this.state.currentLocation = newLoc;
            this.state.locationYears = 0;
            this.state.locationEvents = 0;
            this.addLogEntry(`📍 You traveled to ${this.getLocationName(newLoc)}!`, 'quest');
            this.modifyFame(5);
        },
    ];

    this.randomPick(events)();
};

// ============ RELATIONSHIPS TAB ============
GameEngine.prototype.showRelationships = function() {
    const panel = document.getElementById('action-panel');
    
    const activeRels = this.state.relationships.filter(r => r.active !== false && r.name !== this.state.marriedTo);
    const departedRels = this.state.relationships.filter(r => r.active === false && r.name !== this.state.marriedTo);
    
    if (activeRels.length === 0 && departedRels.length === 0) {
        panel.innerHTML = `
            <div class="section-header">💕 Party Members</div>
            <div class="empty-state">No companions yet. Keep exploring to meet people!</div>
        `;
        return;
    }

    let html = '<div class="section-header">💕 Party Members</div>';
    
    activeRels.forEach((rel, i) => {
        const realIndex = this.state.relationships.indexOf(rel);
        const genderIcon = rel.gender === 'male' ? '♂' : rel.gender === 'female' ? '♀' : '';
        const genderLabel = rel.gender === 'male' ? 'Male' : rel.gender === 'female' ? 'Female' : '';
        html += `
            <div class="relationship-card" onclick="game.interactWith(${realIndex})" style="cursor:pointer;">
                <div class="rel-avatar">${rel.icon}</div>
                <div class="rel-info">
                    <div class="rel-name">${genderIcon} ${rel.name} ${this.state.marriedTo === rel.name ? '💒' : ''}</div>
                    <div class="rel-type">${genderLabel ? genderLabel + ' • ' : ''}${rel.type} • ${rel.personality}${rel.level ? ' • Lv.' + rel.level : ''}</div>
                    <div class="rel-bar">
                        <div class="rel-fill" style="width: ${rel.affection}%"></div>
                    </div>
                    <div class="rel-type">Affection: ${rel.affection}/100 ${rel.affection >= 80 ? '❤️' : rel.affection >= 50 ? '💛' : '🤍'}</div>
                </div>
            </div>
        `;
    });
    
    if (departedRels.length > 0) {
        html += '<div class="section-header" style="margin-top:12px;font-size:0.9rem;opacity:0.6;">👋 Former Companions</div>';
        departedRels.forEach(rel => {
            const genderIcon = rel.gender === 'male' ? '♂' : rel.gender === 'female' ? '♀' : '';
            html += `
                <div class="relationship-card" style="opacity: 0.4; pointer-events: none;">
                    <div class="rel-avatar">${rel.icon}</div>
                    <div class="rel-info">
                        <div class="rel-name">${genderIcon} ${rel.name}</div>
                        <div class="rel-type">${rel.departReason || 'Left the party'}</div>
                    </div>
                </div>
            `;
        });
    }
    
    panel.innerHTML = html;
};

// ============ INTERACT WITH PARTY MEMBER ============
GameEngine.prototype.interactWith = function(index) {
    const rel = this.state.relationships[index];
    if (!rel || rel.active === false) return;
    
    const genderIcon = rel.gender === 'male' ? '♂' : rel.gender === 'female' ? '♀' : '';
    const genderLabel = rel.gender === 'male' ? 'Male' : rel.gender === 'female' ? 'Female' : '';
    
    const panel = document.getElementById('action-panel');
    panel.innerHTML = `
        <div class="section-header">${rel.icon} ${genderIcon} ${rel.name}</div>
        <div class="log-entry normal">
            <p><strong>${rel.fullName || rel.name}</strong></p>
            ${genderLabel ? `<p>Gender: ${genderLabel} ${genderIcon}</p>` : ''}
            <p>Class: ${rel.type} • ${rel.personality}</p>
            ${rel.level ? `<p>Level: ${rel.level}</p>` : ''}
            <p>Affection: ${rel.affection}%</p>
        </div>
        <button class="choice-btn" onclick="game.talkTo(${index})">💬 Talk</button>
        <button class="choice-btn" onclick="game.giftTo(${index})">🎁 Give Gift (-100G)</button>
        <button class="choice-btn" onclick="game.trainWith(${index})">⚔️ Train Together</button>
        ${rel.affection >= 80 && !this.state.married ? `<button class="choice-btn" onclick="game.proposeTo(${index})">💒 Propose Marriage</button>` : ''}
        <button class="choice-btn" onclick="game.showRelationships()">← Back</button>
    `;
};

GameEngine.prototype.talkTo = function(index) {
    const rel = this.state.relationships[index];
    rel.affection = Math.min(100, rel.affection + this.randomInt(1, 5));
    this.addLogEntry(`💬 You spent quality time talking with ${rel.name}.`, 'romance');
    this.modifyMood(3, null);
    this.interactWith(index);
};

GameEngine.prototype.giftTo = function(index) {
    if (this.state.gold < 100) {
        this.showNotification("Not enough gold! Need 100G.", 'danger');
        return;
    }
    const rel = this.state.relationships[index];
    this.state.gold -= 100;
    rel.affection = Math.min(100, rel.affection + this.randomInt(5, 15));
    this.addLogEntry(`🎁 You gave a gift to ${rel.name}. They looked very happy!`, 'romance');
    this.modifyMood(4, null);
    this.updateAllUI();
    this.interactWith(index);
};

GameEngine.prototype.trainWith = function(index) {
    const rel = this.state.relationships[index];
    rel.affection = Math.min(100, rel.affection + this.randomInt(2, 8));
    this.modifyStat('str', 1);
    this.addLogEntry(`⚔️ You trained with ${rel.name}. Both of you grew stronger!`, 'positive');
    this.modifyMood(3, null);
    this.interactWith(index);
};

GameEngine.prototype.proposeTo = function(index) {
    const rel = this.state.relationships[index];
    if (this.chance(rel.affection)) {
        this.state.married = true;
        this.state.marriedTo = rel.name;
        this.state.marriedToData = {
            name: rel.name,
            fullName: rel.fullName || rel.name,
            gender: rel.gender || 'unknown',
            type: rel.type,
            personality: rel.personality,
            icon: rel.icon,
            affection: 100
        };
        rel.affection = 100;
        const spouseTitle = rel.gender === 'male' ? 'husband' : rel.gender === 'female' ? 'wife' : 'spouse';
        this.addLogEntry(`💒 You married ${rel.name}! Your ${spouseTitle} is now part of your family. A beautiful ceremony was held in ${this.getLocationName(this.state.currentLocation)}.`, 'romance');
        this.modifyStat('cha', 5);
        this.modifyFame(30);
        this.modifyMood(25, "The happiest day of your life!");
        // Remove spouse from party — they move to the Family tab
        this.state.relationships.splice(index, 1);
        this.showRelationships();
        return;
    } else {
        rel.affection -= 10;
        this.addLogEntry(`💔 ${rel.name} wasn't ready yet...`, 'negative');
        this.modifyMood(-12, "Rejection hurts...");
    }
    this.interactWith(index);
};

// ============ INVENTORY TAB ============
GameEngine.prototype.showInventory = function() {
    const panel = document.getElementById('action-panel');
    
    // Children don't have inventory access
    if (this.state.age < 10) {
        panel.innerHTML = `
            <div class="section-header">🎒 Inventory</div>
            <div class="empty-state">
                <p>👶 You're still a child!</p>
                <p style="margin-top: 8px; font-size: 0.85rem;">You'll receive your adventurer's kit when you turn 10 and join the Guild.</p>
            </div>
        `;
        return;
    }
    
    if (this.state.inventory.length === 0) {
        panel.innerHTML = `
            <div class="section-header">🎒 Inventory</div>
            <div class="empty-state">Your bag is empty!</div>
        `;
        return;
    }

    let html = '<div class="section-header">🎒 Inventory</div>';
    this.state.inventory.forEach((inv, index) => {
        const item = DATA.items[inv.itemId];
        if (!item) return;
        html += `
            <div class="inventory-item item-rarity-${item.rarity}" onclick="game.useItem(${index})">
                <span class="item-icon">${item.icon}</span>
                <div class="item-info">
                    <div class="item-name">${item.name} ${inv.quantity > 1 ? 'x' + inv.quantity : ''}</div>
                    <div class="item-desc">${item.desc}</div>
                </div>
            </div>
        `;
    });
    panel.innerHTML = html;
};

GameEngine.prototype.useItem = function(index) {
    const inv = this.state.inventory[index];
    if (!inv) return;
    const item = DATA.items[inv.itemId];
    if (!item) return;

    if (item.type === 'consumable') {
        if (inv.itemId === 'health_potion') {
            this.state.hp = this.state.maxHp;
            this.showNotification("❤️ HP Restored!", "success");
        } else if (inv.itemId === 'mana_potion') {
            this.state.mp = this.state.maxMp;
            this.showNotification("💙 MP Restored!", "success");
        } else if (inv.itemId === 'rare_candy') {
            const stat = this.randomPick(['str', 'int', 'agi', 'cha', 'lck']);
            this.modifyStat(stat, 5);
            this.showNotification(`⭐ +5 ${stat.toUpperCase()}!`, "special");
        }
        
        inv.quantity--;
        if (inv.quantity <= 0) {
            this.state.inventory.splice(index, 1);
        }
        this.updateAllUI();
        this.showInventory();
    } else {
        // Equip - just show info for now
        let statText = Object.entries(item.stats).map(([k,v]) => `+${v} ${k.toUpperCase()}`).join(', ');
        this.showNotification(`${item.icon} ${item.name}: ${statText}`, "info");
    }
};

// ============ SKILLS TAB ============
GameEngine.prototype.showSkills = function() {
    const panel = document.getElementById('action-panel');
    const skills = this.state.skills;
    
    if (Object.keys(skills).length === 0) {
        panel.innerHTML = `
            <div class="section-header">✨ Skills</div>
            <div class="empty-state">No skills learned yet. Train harder!</div>
        `;
        return;
    }

    let html = '<div class="section-header">✨ Skills</div>';
    Object.entries(skills).forEach(([id, level]) => {
        const skill = DATA.skills[id];
        if (!skill) return;
        html += `
            <div class="skill-entry">
                <span class="skill-icon">${skill.icon}</span>
                <div class="skill-info">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-level">Level ${level}/${skill.maxLevel}</div>
                    <div class="skill-desc">${skill.desc}</div>
                </div>
            </div>
        `;
    });

    // Show learnable skills
    const learnable = Object.entries(DATA.skills).filter(([id, skill]) => {
        if (skills[id]) return false;
        return Object.entries(skill.requirement).every(([stat, val]) => this.state[stat] >= val);
    });

    if (learnable.length > 0) {
        html += '<div class="section-header" style="margin-top:16px">📚 Available to Learn</div>';
        learnable.forEach(([id, skill]) => {
            html += `
                <button class="action-btn" onclick="game.learnSkill('${id}')">
                    <span class="action-icon">${skill.icon}</span>
                    <span class="action-label">${skill.name}<small>${skill.desc}</small></span>
                </button>
            `;
        });
    }

    panel.innerHTML = html;
};

GameEngine.prototype.learnSkill = function(id) {
    if (this.state.skills[id]) return;
    this.state.skills[id] = 1;
    const skill = DATA.skills[id];
    this.addLogEntry(`✨ You learned: ${skill.icon} ${skill.name}!`, 'special');
    this.showNotification(`✨ New Skill: ${skill.name}!`, 'special');
    
    if (Object.keys(this.state.skills).length >= 10) {
        this.unlockAchievement('all_skills');
    }
    this.showSkills();
};

// ============ ACHIEVEMENT CHECK ============
GameEngine.prototype.checkAchievements = function() {
    if (this.state.level >= 10 && !this.state.achievements.includes('level_10')) {
        this.unlockAchievement('level_10');
    }
    if (this.state.level >= 25 && !this.state.achievements.includes('level_25')) {
        this.unlockAchievement('level_25');
    }
    if (this.state.level >= 50 && !this.state.achievements.includes('level_50')) {
        this.unlockAchievement('level_50');
    }
    if (this.state.gold >= 10000 && !this.state.achievements.includes('rich')) {
        this.unlockAchievement('rich');
    }
    if (this.state.age >= 50 && !this.state.achievements.includes('isekai_veteran')) {
        this.unlockAchievement('isekai_veteran');
    }
    if (this.state.guildRank >= DATA.guildRanks.length - 1 && !this.state.achievements.includes('guild_master')) {
        this.unlockAchievement('guild_master');
    }
    
    const maxedStat = ['str', 'int', 'agi', 'cha', 'lck'].some(s => this.state[s] >= 100);
    if (maxedStat && !this.state.achievements.includes('max_stat')) {
        this.unlockAchievement('max_stat');
    }
};
