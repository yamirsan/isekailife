/* ============================================
   IsekaiLife - Core Game Engine
   ============================================ */

class GameEngine {
    constructor() {
        this.state = null;
        this.currentTab = 'story';
        this.creationChoices = {};
        this.eventQueue = [];
        this.pendingChoice = null;
        this.worldLocations = []; // Generated locations for this playthrough
    }

    // ============ NAME GENERATION ============
    generateRandomName(gender) {
        const firstNames = gender === 'male' ? DATA.firstNamesMale : DATA.firstNamesFemale;
        const firstName = this.randomPick(firstNames);
        const lastName = this.randomPick(DATA.lastNames);
        return { firstName, lastName, fullName: `${firstName} ${lastName}` };
    }

    // ============ LOCATION GENERATION ============
    generateLocationName(type) {
        const prefix = this.randomPick(DATA.locationPrefixes[type]);
        const name = this.randomPick(DATA.locationNames[type]);
        const suffix = this.randomPick(DATA.locationSuffixes[type]);
        const typeLabel = this.randomPick(DATA.locationTypeLabels[type]);
        
        // Different formats for variety
        const formats = [
            `${prefix} ${name} ${typeLabel}${suffix ? ' ' + suffix : ''}`,
            `The ${prefix} ${typeLabel} of ${name}`,
            `${name}${suffix ? ' ' + suffix : ''} - ${prefix} ${typeLabel}`,
            `${prefix} ${name}${suffix ? ' ' + suffix : ''}`
        ];
        
        return {
            name: this.randomPick(formats).trim(),
            type: type,
            typeLabel: typeLabel
        };
    }
    
    generateWorldLocations() {
        this.worldLocations = [];
        
        // Generate starter village (always first) - fully random, no fixed "Beginnings"
        const starterVillage = this.generateLocationName('village');
        this.worldLocations.push(starterVillage);
        
        // Generate various locations
        const locationCounts = {
            village: 3,  // 3 more villages
            town: 4,     // 4 towns
            city: 2,     // 2 cities
            forest: 3,   // 3 forests
            mountain: 2, // 2 mountain areas
            dungeon: 4,  // 4 dungeons
            special: 2   // 2 special locations
        };
        
        for (const [type, count] of Object.entries(locationCounts)) {
            for (let i = 0; i < count; i++) {
                this.worldLocations.push(this.generateLocationName(type));
            }
        }
        
        // Shuffle locations (except starter village)
        const starterLoc = this.worldLocations.shift();
        this.shuffleArray(this.worldLocations);
        this.worldLocations.unshift(starterLoc);
        
        return this.worldLocations;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    getLocationName(index) {
        if (this.worldLocations[index]) {
            return this.worldLocations[index].name;
        }
        return "Unknown Location";
    }
    
    getLocationType(index) {
        if (this.worldLocations[index]) {
            return this.worldLocations[index].type;
        }
        return "unknown";
    }

    generateParents() {
        const fatherName = this.generateRandomName('male');
        const motherName = this.generateRandomName('female');
        // Mother takes father's last name
        motherName.lastName = fatherName.lastName;
        motherName.fullName = `${motherName.firstName} ${fatherName.lastName}`;
        
        return {
            father: {
                ...fatherName,
                relation: "Father",
                alive: true,
                age: this.randomInt(25, 40)
            },
            mother: {
                ...motherName,
                relation: "Mother",
                alive: true,
                age: this.randomInt(22, 38)
            }
        };
    }

    // ============ SCREEN MANAGEMENT ============
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    // ============ TITLE SCREEN ============
    startNewGame() {
        this.showScreen('death-screen');
        this.playDeathSequence();
    }

    playDeathSequence() {
        const scenario = this.randomPick(DATA.deathScenarios);
        const narrative = document.getElementById('death-narrative');
        narrative.innerHTML = '';

        const lines = [
            "It was an ordinary day...",
            scenario.text,
            scenario.emoji,
            "Everything went dark.",
            "...",
            "....",
            ".....",
            ...DATA.goddessLines
        ];

        let delay = 0;
        lines.forEach((line, i) => {
            delay += (i < 3) ? 1200 : (i < 7) ? 800 : 1000;
            setTimeout(() => {
                const p = document.createElement('p');
                p.className = 'typing-line';
                p.style.animationDelay = '0s';
                p.innerHTML = line;
                narrative.appendChild(p);
                narrative.scrollTop = narrative.scrollHeight;

                if (i === lines.length - 1) {
                    setTimeout(() => {
                        document.getElementById('death-continue-btn').style.display = 'inline-block';
                    }, 800);
                }
            }, delay);
        });
    }

    showReincarnation() {
        this.showScreen('creation-screen');
        // Reset to gender selection
        document.getElementById('gender-selection').style.display = 'block';
        document.getElementById('character-selection').style.display = 'none';
        this.selectedGender = null;
    }

    // ============ GENDER SELECTION ============
    selectGenderAndGenerate(gender) {
        this.selectedGender = gender;
        document.getElementById('gender-selection').style.display = 'none';
        document.getElementById('character-selection').style.display = 'block';
        document.getElementById('selected-gender-text').textContent = `Selected: ${gender === 'male' ? '♂️ Male' : '♀️ Female'}`;
        this.generateNewChoices();
    }

    backToGenderSelect() {
        document.getElementById('gender-selection').style.display = 'block';
        document.getElementById('character-selection').style.display = 'none';
        this.selectedGender = null;
    }

    // ============ RANDOM CHARACTER GENERATION ============
    generateNewChoices() {
        this.characterChoices = [];
        
        // Generate 3 random characters with the selected gender
        for (let i = 0; i < 3; i++) {
            this.characterChoices.push(this.generateRandomCharacter(this.selectedGender));
        }
        
        this.renderCharacterChoices();
    }

    generateRandomCharacter(gender) {
        // Use provided gender or random
        const charGender = gender || (this.chance(50) ? 'male' : 'female');
        const nameData = this.generateRandomName(charGender);
        const race = this.randomPick(['human', 'elf', 'beastkin', 'demon', 'dragonborn', 'angel']);
        const cheatSkill = this.randomPick(['sword', 'magic', 'healing', 'stealth', 'charisma', 'luck']);
        
        const raceBonus = DATA.raceBonuses[race];
        const skillBonus = DATA.cheatSkillBonuses[cheatSkill];
        
        // Generate random base stats
        const baseStr = this.randomInt(8, 14);
        const baseInt = this.randomInt(8, 14);
        const baseAgi = this.randomInt(8, 14);
        const baseCha = this.randomInt(8, 14);
        const baseLck = this.randomInt(8, 14);
        
        // Generate parents
        const parents = this.generateParents();
        
        // Generate siblings
        const siblings = this.generateSiblings(charGender, parents);
        
        return {
            name: nameData.firstName,
            lastName: parents.father.lastName,
            fullName: `${nameData.firstName} ${parents.father.lastName}`,
            gender: charGender,
            race,
            cheatSkill,
            parents,
            siblings,
            stats: {
                str: Math.max(1, baseStr + (raceBonus.str || 0) + (skillBonus.str || 0)),
                int: Math.max(1, baseInt + (raceBonus.int || 0) + (skillBonus.int || 0)),
                agi: Math.max(1, baseAgi + (raceBonus.agi || 0) + (skillBonus.agi || 0)),
                cha: Math.max(1, baseCha + (raceBonus.cha || 0) + (skillBonus.cha || 0)),
                lck: Math.max(1, baseLck + (raceBonus.lck || 0) + (skillBonus.lck || 0)),
            }
        };
    }

    generateSiblings(playerGender, parents) {
        const siblings = [];
        const numSiblings = this.randomInt(0, 3);
        
        for (let i = 0; i < numSiblings; i++) {
            const sibGender = this.chance(50) ? 'male' : 'female';
            const sibName = this.generateRandomName(sibGender);
            const isOlder = this.chance(50);
            
            siblings.push({
                name: sibName.firstName,
                fullName: `${sibName.firstName} ${parents.father.lastName}`,
                gender: sibGender,
                relation: isOlder ? (sibGender === 'male' ? 'Older Brother' : 'Older Sister') : (sibGender === 'male' ? 'Younger Brother' : 'Younger Sister'),
                age: isOlder ? this.randomInt(1, 5) : -this.randomInt(1, 3), // Relative to player, negative = younger
                alive: true,
                affection: this.randomInt(40, 80)
            });
        }
        
        return siblings;
    }

    renderCharacterChoices() {
        const container = document.getElementById('character-choices');
        let html = '';
        
        const raceIcons = {
            human: '🧑', elf: '🧝', beastkin: '🐾', demon: '😈', dragonborn: '🐲', angel: '😇'
        };
        
        const skillIcons = {
            sword: '⚔️', magic: '🔮', healing: '💚', stealth: '🌑', charisma: '💖', luck: '🍀'
        };
        
        this.characterChoices.forEach((char, index) => {
            html += `
                <div class="char-choice-card" onclick="game.selectCharacter(${index})">
                    <div class="char-card-header">
                        <div class="char-card-avatar">${raceIcons[char.race]}</div>
                        <div class="char-card-name">
                            <h3>${char.fullName}</h3>
                            <span>${char.gender === 'male' ? '♂' : '♀'} ${char.race.charAt(0).toUpperCase() + char.race.slice(1)}</span>
                        </div>
                    </div>
                    <div class="char-card-stats">
                        <div class="mini-stat">
                            <span class="mini-stat-label">STR</span>
                            <span class="mini-stat-value" style="color: var(--str-color)">${char.stats.str}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-label">INT</span>
                            <span class="mini-stat-value" style="color: var(--int-color)">${char.stats.int}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-label">AGI</span>
                            <span class="mini-stat-value" style="color: var(--agi-color)">${char.stats.agi}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-label">CHA</span>
                            <span class="mini-stat-value" style="color: var(--cha-color)">${char.stats.cha}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-label">LCK</span>
                            <span class="mini-stat-value" style="color: var(--lck-color)">${char.stats.lck}</span>
                        </div>
                    </div>
                    <div class="char-card-skill">
                        <span class="char-card-skill-icon">${skillIcons[char.cheatSkill]}</span>
                        <span class="char-card-skill-name">${DATA.cheatSkillNames[char.cheatSkill]}</span>
                    </div>
                    <div class="char-card-family">
                        👨‍👩‍👧 Family: ${char.parents.father.firstName} & ${char.parents.mother.firstName}
                        ${char.siblings.length > 0 ? ` • ${char.siblings.length} sibling${char.siblings.length > 1 ? 's' : ''}` : ''}
                    </div>
                    <button class="char-card-select-btn">✦ Choose This Life ✦</button>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    selectCharacter(index) {
        const char = this.characterChoices[index];
        if (!char) return;
        
        // Generate world locations for this playthrough
        this.generateWorldLocations();
        
        this.initializeFromChoice(char);
        this.showScreen('game-screen');
        this.updateAllUI();
        this.addLogEntry(`✨ You have been reincarnated in the world of Aetheria as ${char.fullName} the ${char.race}!`, 'special');
        this.addLogEntry(`🌟 The Goddess gifted you: ${DATA.cheatSkillNames[char.cheatSkill]}!`, 'special');
        this.addLogEntry(`👨‍👩‍👧 Your parents are ${this.state.parents.father.firstName} and ${this.state.parents.mother.firstName} ${this.state.parents.father.lastName}.`, 'normal');
        if (this.state.siblings.length > 0) {
            const siblingNames = this.state.siblings.map(s => `${s.name} (${s.relation})`).join(', ');
            this.addLogEntry(`👫 Your siblings: ${siblingNames}`, 'normal');
        }
        this.addLogEntry(`📍 You find yourself in the ${this.getLocationName(0)}.`, 'quest');
        this.showAgeActions();
    }

    initializeFromChoice(char) {
        // Track initial stats for comparison
        const initialStats = { ...char.stats };
        
        this.state = {
            name: char.name,
            lastName: char.lastName,
            fullName: char.fullName,
            gender: char.gender,
            race: char.race,
            cheatSkill: char.cheatSkill,
            age: 0,
            worldYear: 1,
            level: 1,
            exp: 0,
            expToNext: 100,
            
            // Parents
            parents: char.parents,
            
            // Siblings
            siblings: char.siblings,
            
            // Stats
            hp: 100, maxHp: 100,
            mp: 50, maxMp: 50,
            str: char.stats.str,
            int: char.stats.int,
            agi: char.stats.agi,
            cha: char.stats.cha,
            lck: char.stats.lck,
            
            // Initial stats for tracking growth
            initialStats: initialStats,

            // Resources (children start with no gold)
            gold: 0,
            fame: 0,

            // Guild
            guildRank: 0,
            guildExp: 0,

            // Location
            currentLocation: 0,

            // Inventory (empty for children, items given at age 10)
            inventory: [],

            // Skills learned
            skills: {},

            // Relationships
            relationships: [],

            // Quest log
            activeQuests: [],
            completedQuests: 0,

            // Achievements unlocked
            achievements: [],

            // Flags
            demonLordDefeated: false,
            inSchool: false,
            hasGuild: false,
            married: false,
            marriedTo: null,
            marriedToData: null,
            children: [],
            isDead: false,
            deathCause: null,
            isChild: true,

            // Mood system
            mood: 70,
            moodState: 'happy',
            
            // Story progression tracking
            storyPhase: 'baby',
            completedMilestones: [],
            lastEventTypes: [],
            
            // Location persistence
            locationYears: 0,
            locationEvents: 0,

            // Log history
            logHistory: [],
        };

        // Add initial cheat skill
        const cheatSkillMap = {
            sword: 'power_strike',
            magic: 'fireball',
            healing: 'holy_light',
            stealth: 'shadow_step',
            charisma: 'charm_aura',
            luck: 'danger_sense',
        };
        const initialSkill = cheatSkillMap[char.cheatSkill];
        if (initialSkill) {
            this.state.skills[initialSkill] = 1;
        }
    }

    // ============ CHARACTER CREATION (Legacy - kept for compatibility) ============
    selectOption(btn, category) {
        const parent = btn.parentElement;
        parent.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.creationChoices[category] = btn.dataset.value;
        
        // Auto-generate name if gender is selected
        if (category === 'gender') {
            const generatedName = this.generateRandomName(btn.dataset.value);
            document.getElementById('char-name').value = generatedName.firstName;
            document.getElementById('char-name').placeholder = `Suggested: ${generatedName.firstName}`;
        }
    }

    confirmCreation() {
        let name = document.getElementById('char-name').value.trim();
        
        // Auto-generate name if empty
        if (!name && this.creationChoices.gender) {
            name = this.generateRandomName(this.creationChoices.gender).firstName;
            document.getElementById('char-name').value = name;
        }
        
        if (!name) { this.showNotification("Please enter a name!", "danger"); return; }
        if (!this.creationChoices.gender) { this.showNotification("Please select a gender!", "danger"); return; }
        if (!this.creationChoices.race) { this.showNotification("Please select a race!", "danger"); return; }
        if (!this.creationChoices.cheatSkill) { this.showNotification("Please select a cheat skill!", "danger"); return; }

        // Generate world locations
        this.generateWorldLocations();

        this.initializeCharacter(name);
        this.showScreen('game-screen');
        this.updateAllUI();
        this.addLogEntry(`✨ You have been reincarnated in the world of Aetheria as ${name} the ${this.creationChoices.race}!`, 'special');
        this.addLogEntry(`🌟 The Goddess gifted you: ${DATA.cheatSkillNames[this.creationChoices.cheatSkill]}!`, 'special');
        this.addLogEntry(`👨‍👩‍👧 Your parents are ${this.state.parents.father.firstName} and ${this.state.parents.mother.firstName} ${this.state.parents.father.lastName}.`, 'normal');
        this.addLogEntry(`📍 You find yourself in the ${this.getLocationName(0)}.`, 'quest');
        this.showAgeActions();
    }

    initializeCharacter(name) {
        const raceBonus = DATA.raceBonuses[this.creationChoices.race];
        const skillBonus = DATA.cheatSkillBonuses[this.creationChoices.cheatSkill];
        
        // Generate parents
        const parents = this.generateParents();
        
        // Auto-generate base stats with some randomness
        const baseStr = this.randomInt(8, 12);
        const baseInt = this.randomInt(8, 12);
        const baseAgi = this.randomInt(8, 12);
        const baseCha = this.randomInt(8, 12);
        const baseLck = this.randomInt(8, 12);

        this.state = {
            name: name,
            lastName: parents.father.lastName,
            fullName: `${name} ${parents.father.lastName}`,
            gender: this.creationChoices.gender,
            race: this.creationChoices.race,
            cheatSkill: this.creationChoices.cheatSkill,
            age: 0,
            worldYear: 1,
            level: 1,
            exp: 0,
            expToNext: 100,
            
            // Parents
            parents: parents,
            
            // Stats (auto-generated with bonuses)
            hp: 100, maxHp: 100,
            mp: 50, maxMp: 50,
            str: baseStr + (raceBonus.str || 0) + (skillBonus.str || 0),
            int: baseInt + (raceBonus.int || 0) + (skillBonus.int || 0),
            agi: baseAgi + (raceBonus.agi || 0) + (skillBonus.agi || 0),
            cha: baseCha + (raceBonus.cha || 0) + (skillBonus.cha || 0),
            lck: baseLck + (raceBonus.lck || 0) + (skillBonus.lck || 0),

            // Resources
            gold: 50,
            fame: 0,

            // Guild
            guildRank: 0, // Index into guildRanks
            guildExp: 0,

            // Location
            currentLocation: 0, // Index

            // Inventory (array of {itemId, quantity})
            inventory: [
                { itemId: 'rusty_sword', quantity: 1 },
                { itemId: 'health_potion', quantity: 3 },
            ],

            // Skills learned: { skillId: level }
            skills: {},

            // Relationships: array of { ...memberData, affection, recruited }
            relationships: [],

            // Quest log
            activeQuests: [],
            completedQuests: 0,

            // Achievements unlocked
            achievements: [],

            // Flags
            demonLordDefeated: false,
            inSchool: false,
            hasGuild: false,
            married: false,
            marriedTo: null,
            marriedToData: null,
            children: [],
            isDead: false,
            deathCause: null,
            isChild: true,

            // Mood system
            mood: 70,
            moodState: 'happy',
            
            // Story progression tracking
            storyPhase: 'baby',
            completedMilestones: [],
            lastEventTypes: [],
            
            // Location persistence
            locationYears: 0,
            locationEvents: 0,

            // Log history
            logHistory: [],
        };

        // Ensure stats don't go below 1
        ['str','int','agi','cha','lck'].forEach(s => {
            if (this.state[s] < 1) this.state[s] = 1;
        });

        // Add initial cheat skill
        const cheatSkillMap = {
            sword: 'power_strike',
            magic: 'fireball',
            healing: 'holy_light',
            stealth: 'shadow_step',
            charisma: 'charm_aura',
            luck: 'danger_sense',
        };
        const initialSkill = cheatSkillMap[this.creationChoices.cheatSkill];
        if (initialSkill) {
            this.state.skills[initialSkill] = 1;
        }
    }

    // ============ UI UPDATES ============
    updateAllUI() {
        if (!this.state) return;
        const s = this.state;

        // Top bar
        document.getElementById('char-display-name').textContent = s.fullName || s.name;
        document.getElementById('char-title').textContent = `Lv.${s.level} ${this.getTitle()}`;
        document.getElementById('char-age').textContent = s.age;
        document.getElementById('world-year').textContent = s.worldYear;

        // Mood bar
        this.updateMoodState();
        document.getElementById('mood-icon').textContent = this.getMoodIcon();
        document.getElementById('mood-text').textContent = this.getMoodName();
        document.getElementById('mood-value').textContent = s.mood;
        const moodFill = document.getElementById('mood-fill');
        moodFill.style.width = `${s.mood}%`;
        moodFill.className = `mood-fill mood-${s.moodState}`;

        // Stats
        this.updateStatBar('hp', s.hp, s.maxHp);
        this.updateStatBar('mp', s.mp, s.maxMp);
        document.getElementById('hp-value').textContent = `${s.hp}/${s.maxHp}`;
        document.getElementById('mp-value').textContent = `${s.mp}/${s.maxMp}`;

        const maxStat = 100;
        ['str','int','agi','cha','lck'].forEach(stat => {
            const bar = document.getElementById(`${stat}-bar`);
            bar.style.width = `${Math.min(s[stat] / maxStat * 100, 100)}%`;
            document.getElementById(`${stat}-value`).textContent = s[stat];
        });

        document.getElementById('gold-value').textContent = `${s.gold} G`;
        document.getElementById('fame-value').textContent = s.fame;

        // Compact stats row
        const hpC = document.getElementById('hp-compact');
        const mpC = document.getElementById('mp-compact');
        const strC = document.getElementById('str-compact');
        const intC = document.getElementById('int-compact');
        const agiC = document.getElementById('agi-compact');
        const goldC = document.getElementById('gold-compact');
        if (hpC) hpC.textContent = s.hp;
        if (mpC) mpC.textContent = s.mp;
        if (strC) strC.textContent = s.str;
        if (intC) intC.textContent = s.int;
        if (agiC) agiC.textContent = s.agi;
        if (goldC) goldC.textContent = s.gold;
    }

    updateStatBar(stat, current, max) {
        const bar = document.getElementById(`${stat}-bar`);
        bar.style.width = `${(current / max) * 100}%`;
    }

    getTitle() {
        let title = "Novice";
        for (const t of DATA.titles) {
            if (this.state.level >= t.level) title = t.title;
        }
        return title;
    }

    // ============ LOG SYSTEM ============
    addLogEntry(text, type = 'normal', statChanges = null) {
        // Push to queue — entries are revealed one by one
        if (!this._logQueue) this._logQueue = [];
        if (!this._logBusy) this._logBusy = false;

        this._logQueue.push({ text, type, statChanges, age: this.state.age, year: this.state.worldYear });
        this.state.logHistory.push({ text, type, age: this.state.age });

        if (!this._logBusy) {
            this._processLogQueue();
        }
    }

    _processLogQueue() {
        if (!this._logQueue || this._logQueue.length === 0) {
            this._logBusy = false;
            return;
        }
        this._logBusy = true;

        const { text, type, statChanges, age, year } = this._logQueue.shift();
        const logEntries = document.getElementById('log-entries');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.style.opacity = '0';

        let html = `<span class="entry-age">Age ${age} — Year ${year}</span>`;
        html += `<span class="entry-text"></span>`;

        if (statChanges) {
            html += '<div class="stat-change" style="opacity:0">';
            for (const [key, val] of Object.entries(statChanges)) {
                if (val > 0) html += `<span class="positive-change">+${val} ${key.toUpperCase()} </span>`;
                else if (val < 0) html += `<span class="negative-change">${val} ${key.toUpperCase()} </span>`;
            }
            html += '</div>';
        }

        entry.innerHTML = html;
        logEntries.appendChild(entry);

        // Fade in the entry card
        requestAnimationFrame(() => {
            entry.style.transition = 'opacity 0.2s ease';
            entry.style.opacity = '1';
        });

        // Typewriter effect on the text
        const textEl = entry.querySelector('.entry-text');
        const statEl = entry.querySelector('.stat-change');
        this._typewriterEffect(textEl, text, 18, () => {
            // After text finishes, show stat changes
            if (statEl) {
                statEl.style.transition = 'opacity 0.3s ease';
                statEl.style.opacity = '1';
            }
            // Scroll to bottom
            const eventLog = document.getElementById('event-log');
            eventLog.scrollTop = eventLog.scrollHeight;
            // Process next entry after a short pause
            setTimeout(() => this._processLogQueue(), 150);
        });

        // Scroll to show this entry
        const eventLog = document.getElementById('event-log');
        const scrollToBottom = () => { eventLog.scrollTop = eventLog.scrollHeight; };
        requestAnimationFrame(scrollToBottom);
    }

    _typewriterEffect(element, text, speed, callback) {
        let i = 0;
        const chars = [...text]; // handle emojis correctly
        element.classList.add('typing');
        const type = () => {
            if (i < chars.length) {
                // Add multiple chars per tick for speed (2-3 at a time)
                const chunk = chars.slice(i, i + 2).join('');
                element.textContent += chunk;
                i += 2;
                // Scroll as we type
                const eventLog = document.getElementById('event-log');
                eventLog.scrollTop = eventLog.scrollHeight;
                setTimeout(type, speed);
            } else {
                element.classList.remove('typing');
                if (callback) callback();
            }
        };
        type();
    }

    // ============ NOTIFICATION SYSTEM ============
    showNotification(text, type = 'info') {
        const notif = document.getElementById('notification');
        notif.textContent = text;
        notif.className = `notification ${type} show`;
        setTimeout(() => notif.classList.remove('show'), 2500);
    }

    // ============ TAB SYSTEM ============
    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.nav-btn[data-tab="${tab}"]`).classList.add('active');

        switch(tab) {
            case 'story': this.showAgeActions(); break;
            case 'actions': this.showMainActions(); break;
            case 'family': this.showFamily(); break;
            case 'relationships': this.showRelationships(); break;
            case 'stats': this.showStatsDevelopment(); break;
            case 'inventory': this.showInventory(); break;
            case 'skills': this.showSkills(); break;
        }
    }

    // ============ FAMILY TAB ============
    showFamily() {
        const panel = document.getElementById('action-panel');
        const s = this.state;
        let html = '';

        html += '<div class="section-header">👨‍👩‍👧 Family</div>';

        // Spouse Section (with full data)
        if (s.married && s.marriedToData) {
            html += '<div class="family-section">';
            html += '<div class="family-section-title">💒 Spouse</div>';
            const spouse = s.marriedToData;
            const spouseAgeDisplay = spouse.spouseAge ? ` • Age ${spouse.spouseAge}` : '';
            html += `
                <div class="family-member-card">
                    <div class="family-avatar">${spouse.gender === 'male' ? '🤵' : '👰'}</div>
                    <div class="family-info">
                        <div class="family-name">${spouse.fullName || spouse.name}</div>
                        <div class="family-details">${spouse.gender === 'male' ? 'Husband' : 'Wife'}${spouseAgeDisplay} • ${spouse.typeName || spouse.type} ${spouse.personality}</div>
                    </div>
                    <span class="family-status alive">💕 ${spouse.affection}% • ❤️ Alive</span>
                </div>
            `;
            html += '</div>';
        } else if (s.married) {
            html += '<div class="family-section">';
            html += '<div class="family-section-title">💒 Spouse</div>';
            html += `
                <div class="family-member-card">
                    <div class="family-avatar">💕</div>
                    <div class="family-info">
                        <div class="family-name">${s.marriedTo}</div>
                        <div class="family-details">Spouse</div>
                    </div>
                    <span class="family-status alive">❤️ Married</span>
                </div>
            `;
            html += '</div>';
        }

        // Parents Section
        html += '<div class="family-section">';
        html += '<div class="family-section-title">👨‍👩‍👧 Parents</div>';
        
        if (s.parents) {
            const father = s.parents.father;
            const mother = s.parents.mother;
            
            if (father) {
                html += `
                    <div class="family-member-card ${father.alive ? '' : 'deceased'}">
                        <div class="family-avatar">👨</div>
                        <div class="family-info">
                            <div class="family-name">${father.firstName} ${father.lastName}</div>
                            <div class="family-details">${father.relation} • Age ${father.age}</div>
                        </div>
                        <span class="family-status ${father.alive ? 'alive' : 'deceased'}">${father.alive ? '❤️ Alive' : '💀 Deceased'}</span>
                    </div>
                `;
            }
            
            if (mother) {
                html += `
                    <div class="family-member-card ${mother.alive ? '' : 'deceased'}">
                        <div class="family-avatar">👩</div>
                        <div class="family-info">
                            <div class="family-name">${mother.firstName} ${mother.lastName}</div>
                            <div class="family-details">${mother.relation} • Age ${mother.age}</div>
                        </div>
                        <span class="family-status ${mother.alive ? 'alive' : 'deceased'}">${mother.alive ? '❤️ Alive' : '💀 Deceased'}</span>
                    </div>
                `;
            }
        }
        html += '</div>';

        // Siblings Section
        html += '<div class="family-section">';
        html += '<div class="family-section-title">👫 Siblings</div>';
        
        if (s.siblings && s.siblings.length > 0) {
            s.siblings.forEach(sib => {
                const sibAge = s.age + sib.age;
                html += `
                    <div class="family-member-card ${sib.alive ? '' : 'deceased'}">
                        <div class="family-avatar">${sib.gender === 'male' ? '👦' : '👧'}</div>
                        <div class="family-info">
                            <div class="family-name">${sib.name} ${s.lastName}</div>
                            <div class="family-details">${sib.relation} • Age ${Math.max(0, sibAge)}</div>
                        </div>
                        <span class="family-status ${sib.alive ? 'alive' : 'deceased'}">${sib.alive ? '❤️ Alive' : '💀 Deceased'}</span>
                    </div>
                `;
            });
        } else {
            html += '<div class="empty-state">You are an only child.</div>';
        }
        html += '</div>';

        // Children Section
        if (s.children && s.children.length > 0) {
            html += '<div class="family-section">';
            html += '<div class="family-section-title">👶 Children</div>';
            s.children.forEach(child => {
                const childAge = s.age - child.bornAtAge;
                html += `
                    <div class="family-member-card">
                        <div class="family-avatar">${child.gender === 'male' ? '👦' : '👧'}</div>
                        <div class="family-info">
                            <div class="family-name">${child.name} ${s.lastName}</div>
                            <div class="family-details">${child.gender === 'male' ? 'Son' : 'Daughter'} • Age ${Math.max(0, childAge)}</div>
                        </div>
                        <span class="family-status alive">❤️ Alive</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        panel.innerHTML = html;
    }

    // ============ STATS DEVELOPMENT TAB ============
    showStatsDevelopment() {
        const panel = document.getElementById('action-panel');
        const s = this.state;
        const initial = s.initialStats || { str: 10, int: 10, agi: 10, cha: 10, lck: 10 };
        
        const stats = [
            { key: 'str', name: 'Strength', icon: '⚔️', color: 'var(--str-color)' },
            { key: 'int', name: 'Intelligence', icon: '🧠', color: 'var(--int-color)' },
            { key: 'agi', name: 'Agility', icon: '💨', color: 'var(--agi-color)' },
            { key: 'cha', name: 'Charisma', icon: '💖', color: 'var(--cha-color)' },
            { key: 'lck', name: 'Luck', icon: '🍀', color: 'var(--lck-color)' },
        ];
        
        let html = '<div class="section-header">📊 Stats Development</div>';
        
        stats.forEach(stat => {
            const current = s[stat.key];
            const start = initial[stat.key] || 10;
            const change = current - start;
            const percentage = Math.min((current / 100) * 100, 100);
            
            html += `
                <div class="stat-history-card">
                    <div class="stat-history-title">
                        <span>${stat.icon}</span>
                        <span>${stat.name}</span>
                    </div>
                    <div class="stat-progress-bar">
                        <div class="stat-progress-fill" style="width: ${percentage}%; background: ${stat.color}">
                            ${current}
                        </div>
                    </div>
                    <div class="stat-comparison">
                        <span>Started: ${start}</span>
                        <span class="${change >= 0 ? 'stat-change-positive' : 'stat-change-negative'}">
                            ${change >= 0 ? '+' : ''}${change} growth
                        </span>
                    </div>
                </div>
            `;
        });
        
        // Overall stats summary
        const totalGrowth = stats.reduce((sum, stat) => {
            return sum + (s[stat.key] - (initial[stat.key] || 10));
        }, 0);
        
        html += `
            <div class="log-entry special" style="margin-top: 16px; text-align: center;">
                <strong>📈 Total Growth: +${totalGrowth} stat points</strong><br>
                <small>Level ${s.level} • Age ${s.age}</small>
            </div>
        `;
        
        panel.innerHTML = html;
    }

    // ============ STAT MODIFICATIONS ============
    modifyStat(stat, amount) {
        if (!this.state) return;
        // Apply mood modifier to positive gains
        const moodMod = this.getMoodStatModifier();
        const adjusted = amount > 0 ? Math.max(1, Math.round(amount * moodMod)) : amount;
        this.state[stat] = Math.max(0, Math.min(100, (this.state[stat] || 0) + adjusted));
        
        // Check max stat achievement
        if (this.state[stat] >= 100) {
            this.unlockAchievement('max_stat');
        }
        this.updateAllUI();
    }

    modifyGold(amount) {
        this.state.gold = Math.max(0, this.state.gold + amount);
        if (this.state.gold >= 10000) this.unlockAchievement('rich');
        this.updateAllUI();
    }

    modifyFame(amount) {
        this.state.fame = Math.max(0, this.state.fame + amount);
        this.updateAllUI();
    }

    // ============ MOOD SYSTEM ============
    modifyMood(amount, reason) {
        const old = this.state.mood;
        this.state.mood = Math.max(0, Math.min(100, this.state.mood + amount));
        this.updateMoodState();
        
        if (reason && Math.abs(amount) >= 5) {
            const dir = amount > 0 ? '↑' : '↓';
            const icon = amount > 0 ? '😊' : '😔';
            this.addLogEntry(`${icon} ${reason} (Mood ${dir}${Math.abs(amount)})`, amount > 0 ? 'positive' : 'negative');
        }
    }

    updateMoodState() {
        const m = this.state.mood;
        if (m >= 85) this.state.moodState = 'ecstatic';
        else if (m >= 65) this.state.moodState = 'happy';
        else if (m >= 50) this.state.moodState = 'content';
        else if (m >= 35) this.state.moodState = 'neutral';
        else if (m >= 20) this.state.moodState = 'sad';
        else if (m >= 10) this.state.moodState = 'depressed';
        else this.state.moodState = 'angry';
    }

    getMoodIcon() {
        const icons = {
            ecstatic: '🤩', happy: '😊', content: '🙂', neutral: '😐',
            sad: '😢', depressed: '😞', angry: '😡'
        };
        return icons[this.state.moodState] || '😐';
    }

    getMoodName() {
        const names = {
            ecstatic: 'Ecstatic', happy: 'Happy', content: 'Content', neutral: 'Neutral',
            sad: 'Sad', depressed: 'Depressed', angry: 'Angry'
        };
        return names[this.state.moodState] || 'Neutral';
    }

    getMoodStatModifier() {
        const m = this.state.moodState;
        if (m === 'ecstatic') return 1.5;
        if (m === 'happy') return 1.2;
        if (m === 'content') return 1.0;
        if (m === 'neutral') return 0.9;
        if (m === 'sad') return 0.7;
        if (m === 'depressed') return 0.5;
        if (m === 'angry') return 0.8;
        return 1.0;
    }

    getStoryPhase() {
        const age = this.state.age;
        if (age <= 2) return 'baby';
        if (age <= 5) return 'toddler';
        if (age <= 9) return 'child';
        if (age <= 12) return 'preteen';
        if (age <= 17) return 'teen';
        if (age <= 24) return 'young_adult';
        if (age <= 39) return 'adult';
        if (age <= 59) return 'mature';
        return 'elder';
    }

    gainExp(amount) {
        this.state.exp += amount;
        while (this.state.exp >= this.state.expToNext) {
            this.state.exp -= this.state.expToNext;
            this.levelUp();
        }
        this.updateAllUI();
    }

    levelUp() {
        this.state.level++;
        this.state.expToNext = Math.floor(this.state.expToNext * 1.2);
        
        // Stat increases on level up
        const gains = {
            str: Math.floor(Math.random() * 3) + 1,
            int: Math.floor(Math.random() * 3) + 1,
            agi: Math.floor(Math.random() * 3) + 1,
            cha: Math.floor(Math.random() * 2),
            lck: Math.floor(Math.random() * 2),
        };

        // Bonus based on cheat skill
        const bonus = this.state.cheatSkill;
        if (bonus === 'sword') gains.str += 2;
        if (bonus === 'magic') gains.int += 2;
        if (bonus === 'healing') { gains.int += 1; gains.cha += 1; }
        if (bonus === 'stealth') gains.agi += 2;
        if (bonus === 'charisma') gains.cha += 2;
        if (bonus === 'luck') gains.lck += 2;

        Object.entries(gains).forEach(([stat, val]) => this.modifyStat(stat, val));
        
        this.state.maxHp += 10 + Math.floor(this.state.str / 5);
        this.state.hp = this.state.maxHp;
        this.state.maxMp += 5 + Math.floor(this.state.int / 5);
        this.state.mp = this.state.maxMp;

        this.addLogEntry(`🎉 LEVEL UP! You are now Level ${this.state.level}! — ${this.getTitle()}`, 'level-up', gains);
        this.showNotification(`⬆️ Level ${this.state.level}!`, 'special');

        // Achievement checks
        if (this.state.level >= 10) this.unlockAchievement('level_10');
        if (this.state.level >= 25) this.unlockAchievement('level_25');
        if (this.state.level >= 50) this.unlockAchievement('level_50');
    }

    // ============ ACHIEVEMENTS ============
    unlockAchievement(id) {
        if (this.state.achievements.includes(id)) return;
        this.state.achievements.push(id);
        const ach = DATA.achievements[id];
        this.showNotification(`🏆 Achievement: ${ach.name}!`, 'special');
        this.addLogEntry(`🏆 Achievement Unlocked: ${ach.icon} ${ach.name} — ${ach.desc}`, 'special');
    }

    // ============ MENU ============
    toggleMenu() {
        document.getElementById('side-menu').classList.toggle('open');
    }

    toggleStats() {
        document.getElementById('stats-panel').classList.toggle('expanded');
    }

    showCharacterSheet() {
        this.toggleMenu();
        const s = this.state;
        const father = s.parents?.father;
        const mother = s.parents?.mother;
        
        const panel = document.getElementById('action-panel');
        panel.innerHTML = `
            <div class="section-header">📋 Character Sheet</div>
            <div class="log-entry special">
                <p><strong>${s.fullName || s.name}</strong></p>
                <p>${s.gender === 'male' ? '♂' : '♀'} ${s.race.charAt(0).toUpperCase() + s.race.slice(1)} | Age ${s.age}</p>
                <p>Mood: ${this.getMoodIcon()} ${this.getMoodName()} (${s.mood}%)</p>
                <p>Level ${s.level} ${this.getTitle()}</p>
                <p>EXP: ${s.exp}/${s.expToNext}</p>
                <p>Guild Rank: ${DATA.guildRanks[s.guildRank]}</p>
                <p>Cheat Skill: ${DATA.cheatSkillNames[s.cheatSkill]}</p>
                <p>Location: ${this.getLocationName(s.currentLocation)} (${s.locationYears || 0} years)</p>
                <p>Quests Completed: ${s.completedQuests}</p>
                <p>Married: ${s.married ? '💒 ' + s.marriedTo : 'No'}</p>
                <hr style="border-color: rgba(255,255,255,0.2); margin: 10px 0;">
                <p><strong>👨‍👩‍👧 Family</strong></p>
                ${father ? `<p>👨 ${father.firstName} ${father.lastName}: ${father.alive ? `Age ${father.age}` : '💀 Deceased'}</p>` : ''}
                ${mother ? `<p>👩 ${mother.firstName} ${mother.lastName}: ${mother.alive ? `Age ${mother.age}` : '💀 Deceased'}</p>` : ''}
            </div>
            <button class="choice-btn" onclick="game.switchTab('story')">← Back</button>
        `;
    }

    showQuestLog() {
        this.toggleMenu();
        const panel = document.getElementById('action-panel');
        if (this.state.activeQuests.length === 0) {
            panel.innerHTML = `
                <div class="section-header">📜 Quest Log</div>
                <div class="empty-state">No active quests. Visit the Adventurer's Guild!</div>
                <button class="choice-btn" onclick="game.switchTab('story')">← Back</button>
            `;
        } else {
            let html = '<div class="section-header">📜 Quest Log</div>';
            this.state.activeQuests.forEach((q, i) => {
                html += `<div class="log-entry quest">
                    <strong>${q.name}</strong><br>
                    <small>${q.desc}</small><br>
                    <small>Reward: ${q.goldReward}G, ${q.expReward} EXP</small>
                </div>`;
            });
            html += '<button class="choice-btn" onclick="game.switchTab(\'story\')">← Back</button>';
            panel.innerHTML = html;
        }
    }

    showAchievements() {
        this.toggleMenu();
        const panel = document.getElementById('action-panel');
        let html = '<div class="section-header">🏆 Achievements</div>';
        
        Object.entries(DATA.achievements).forEach(([id, ach]) => {
            const unlocked = this.state.achievements.includes(id);
            html += `<div class="inventory-item ${unlocked ? 'item-rarity-legendary' : ''}" style="opacity: ${unlocked ? 1 : 0.4}">
                <span class="item-icon">${unlocked ? ach.icon : '🔒'}</span>
                <div class="item-info">
                    <div class="item-name">${unlocked ? ach.name : '???'}</div>
                    <div class="item-desc">${ach.desc}</div>
                </div>
            </div>`;
        });
        html += '<button class="choice-btn" onclick="game.switchTab(\'story\')">← Back</button>';
        panel.innerHTML = html;
    }

    // ============ SAVE/LOAD ============
    saveGame() {
        localStorage.setItem('isekailife_save', JSON.stringify(this.state));
        localStorage.setItem('isekailife_locations', JSON.stringify(this.worldLocations));
        this.showNotification("💾 Game Saved!", "success");
    }

    loadGame() {
        const save = localStorage.getItem('isekailife_save');
        const locations = localStorage.getItem('isekailife_locations');
        if (save) {
            this.state = JSON.parse(save);
            // Backward compatibility for new state fields
            if (this.state.mood === undefined) this.state.mood = 60;
            if (!this.state.moodState) this.state.moodState = 'content';
            if (!this.state.storyPhase) this.state.storyPhase = this.getStoryPhase();
            if (!this.state.completedMilestones) this.state.completedMilestones = [];
            if (!this.state.lastEventTypes) this.state.lastEventTypes = [];
            if (this.state.locationYears === undefined) this.state.locationYears = 0;
            if (this.state.locationEvents === undefined) this.state.locationEvents = 0;
            if (this.state.marriedToData === undefined) this.state.marriedToData = null;
            if (!this.state.children) this.state.children = [];
            // Add gender to old relationships
            if (this.state.relationships) {
                this.state.relationships.forEach(r => {
                    if (!r.gender) r.gender = this.randomPick(['male', 'female']);
                    if (r.active === undefined) r.active = true;
                });
            }
            
            if (locations) {
                this.worldLocations = JSON.parse(locations);
            }
            this.showScreen('game-screen');
            this.updateAllUI();
            this.showAgeActions();
            this.showNotification("📂 Game Loaded!", "success");
        }
    }

    checkForSave() {
        if (localStorage.getItem('isekailife_save')) {
            document.getElementById('load-btn').style.display = 'inline-block';
        }
    }

    // ============ HELPER FUNCTIONS ============
    randomPick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    chance(percent) {
        return Math.random() * 100 < percent;
    }

    // ============ DEATH SYSTEM ============
    checkForDeath() {
        if (this.state.isDead) return true;
        
        const age = this.state.age;
        let deathChance = 0;
        
        // Base death chances by age
        if (age < 10) {
            // Children have low but possible death chance
            deathChance = 0.5 + (this.state.hp <= 10 ? 5 : 0);
        } else if (age < 30) {
            // Young adults - mainly from adventures
            deathChance = 1 + (this.state.hp <= 10 ? 10 : 0);
        } else if (age < 50) {
            // Adults - moderate risk
            deathChance = 2 + (age - 30) * 0.2;
        } else if (age < 70) {
            // Middle-aged
            deathChance = 5 + (age - 50) * 0.5;
        } else {
            // Old age - increasing risk
            deathChance = 15 + (age - 70) * 2;
        }
        
        // Luck reduces death chance
        deathChance = Math.max(0.1, deathChance - (this.state.lck * 0.1));
        
        // Check for death
        if (this.chance(deathChance)) {
            this.triggerDeath();
            return true;
        }
        return false;
    }

    triggerDeath(forcedCause = null) {
        this.state.isDead = true;
        
        // Determine death cause based on age
        let deathCategory;
        if (this.state.age < 10) {
            deathCategory = 'child';
        } else if (this.state.age < 25) {
            deathCategory = 'young';
        } else if (this.state.age < 60) {
            deathCategory = 'adult';
        } else {
            deathCategory = 'old';
        }
        
        const deathCause = forcedCause || this.randomPick(DATA.deathCauses[deathCategory]);
        this.state.deathCause = deathCause;
        
        this.showDeathScreen(deathCause);
    }

    showDeathScreen(deathCause) {
        const s = this.state;
        
        document.getElementById('death-cause').innerHTML = `
            <p>${deathCause.emoji}</p>
            <p>${deathCause.text}</p>
        `;
        
        const finalMood = this.getMoodName();
        const finalMoodIcon = this.getMoodIcon();
        
        document.getElementById('life-summary').innerHTML = `
            <p><strong>Life Summary</strong></p>
            <p>👤 ${s.fullName || s.name}</p>
            <p>📅 Lived to age ${s.age}</p>
            <p>${finalMoodIcon} Final Mood: ${finalMood}</p>
            <p>⭐ Reached Level ${s.level}</p>
            <p>🏆 Guild Rank: ${DATA.guildRanks[s.guildRank]}</p>
            <p>⚔️ Quests Completed: ${s.completedQuests}</p>
            <p>� Total Gold: ${s.gold}</p>
            <p>💕 Relationships: ${s.relationships.length}</p>
            <p>💒 Married: ${s.married ? 'Yes' : 'No'}</p>
            <p>🏅 Achievements: ${s.achievements.length}/${Object.keys(DATA.achievements).length}</p>
        `;
        
        this.showScreen('gameover-screen');
    }

    // ============ PARENT EVENTS ============
    parentEvent() {
        if (!this.state.parents) return;
        
        const father = this.state.parents.father;
        const mother = this.state.parents.mother;
        
        // Age parents
        if (father.alive) father.age++;
        if (mother.alive) mother.age++;
        
        // Check for parent death
        if (father.alive && father.age > 60 && this.chance(father.age - 55)) {
            father.alive = false;
            this.addLogEntry(`😢 Your father ${father.firstName} has passed away...`, 'negative');
            this.modifyStat('cha', -1);
            this.modifyMood(-20, "Losing your father tears your heart apart...");
        }
        
        if (mother.alive && mother.age > 60 && this.chance(mother.age - 55)) {
            mother.alive = false;
            this.addLogEntry(`😢 Your mother ${mother.firstName} has passed away...`, 'negative');
            this.modifyStat('cha', -1);
            this.modifyMood(-20, "Losing your mother tears your heart apart...");
        }
        
        // Update siblings
        if (this.state.siblings) {
            this.state.siblings.forEach(sib => {
                const siblingActualAge = this.state.age + sib.age;
                if (sib.alive && siblingActualAge > 50 && this.chance((siblingActualAge - 50) * 0.5)) {
                    sib.alive = false;
                    this.addLogEntry(`😢 Your ${sib.relation.toLowerCase()} ${sib.name} has passed away...`, 'negative');
                    this.modifyStat('cha', -1);
                    this.modifyMood(-15, `Losing ${sib.name} makes you very sad...`);
                }
            });
        }

        // Age up party members
        if (this.state.relationships) {
            this.state.relationships.forEach(rel => {
                if (rel.active !== false) {
                    if (!rel.memberAge) rel.memberAge = this.state.age + this.randomInt(-5, 5);
                    rel.memberAge++;
                }
            });
        }

        // Age up children
        // (Children age is calculated from bornAtAge, no explicit increment needed)

        // Age up spouse
        if (this.state.marriedToData) {
            if (!this.state.marriedToData.spouseAge) {
                this.state.marriedToData.spouseAge = this.state.age + this.randomInt(-3, 3);
            }
            this.state.marriedToData.spouseAge++;
        }
    }
}
