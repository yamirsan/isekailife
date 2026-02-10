/* ============================================
   إسيكاي لايف - محرك اللعبة الأساسي
   ============================================ */

class GameEngine {
    constructor() {
        this.state = null;
        this.currentTab = 'story';
        this.creationChoices = {};
        this.eventQueue = [];
        this.pendingChoice = null;
        this.worldLocations = [];
    }

    // ============ توليد الأسماء ============
    generateRandomName(gender) {
        const firstNames = gender === 'male' ? DATA.firstNamesMale : DATA.firstNamesFemale;
        const firstName = this.randomPick(firstNames);
        const lastName = this.randomPick(DATA.lastNames);
        return { firstName, lastName, fullName: `${firstName} ${lastName}` };
    }

    // ============ توليد المواقع ============
    generateLocationName(type) {
        const prefix = this.randomPick(DATA.locationPrefixes[type]);
        const name = this.randomPick(DATA.locationNames[type]);
        const suffix = this.randomPick(DATA.locationSuffixes[type]);
        const typeLabel = this.randomPick(DATA.locationTypeLabels[type]);
        
        const formats = [
            `${typeLabel} ${name} ${prefix}${suffix ? ' ' + suffix : ''}`,
            `${typeLabel} ${prefix} في ${name}`,
            `${name}${suffix ? ' ' + suffix : ''} - ${typeLabel} ${prefix}`,
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
        
        const starterVillage = this.generateLocationName('village');
        this.worldLocations.push(starterVillage);
        
        const locationCounts = {
            village: 3,
            town: 4,
            city: 2,
            forest: 3,
            mountain: 2,
            dungeon: 4,
            special: 2
        };
        
        for (const [type, count] of Object.entries(locationCounts)) {
            for (let i = 0; i < count; i++) {
                this.worldLocations.push(this.generateLocationName(type));
            }
        }
        
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
        return "موقع مجهول";
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
        motherName.lastName = fatherName.lastName;
        motherName.fullName = `${motherName.firstName} ${fatherName.lastName}`;
        
        return {
            father: {
                ...fatherName,
                relation: "الأب",
                alive: true,
                age: this.randomInt(25, 40)
            },
            mother: {
                ...motherName,
                relation: "الأم",
                alive: true,
                age: this.randomInt(22, 38)
            }
        };
    }

    // ============ إدارة الشاشات ============
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    // ============ شاشة العنوان ============
    startNewGame() {
        this.showScreen('death-screen');
        this.playDeathSequence();
    }

    playDeathSequence() {
        const scenario = this.randomPick(DATA.deathScenarios);
        const narrative = document.getElementById('death-narrative');
        narrative.innerHTML = '';

        const lines = [
            "كان يوماً عادياً...",
            scenario.text,
            scenario.emoji,
            "أصبح كل شيء مظلماً.",
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
        document.getElementById('gender-selection').style.display = 'block';
        document.getElementById('character-selection').style.display = 'none';
        this.selectedGender = null;
    }

    // ============ اختيار الجنس ============
    selectGenderAndGenerate(gender) {
        this.selectedGender = gender;
        document.getElementById('gender-selection').style.display = 'none';
        document.getElementById('character-selection').style.display = 'block';
        document.getElementById('selected-gender-text').textContent = `الاختيار: ${gender === 'male' ? '♂️ ذكر' : '♀️ أنثى'}`;
        this.generateNewChoices();
    }

    backToGenderSelect() {
        document.getElementById('gender-selection').style.display = 'block';
        document.getElementById('character-selection').style.display = 'none';
        this.selectedGender = null;
    }

    // ============ توليد الشخصيات العشوائية ============
    generateNewChoices() {
        this.characterChoices = [];
        
        for (let i = 0; i < 3; i++) {
            this.characterChoices.push(this.generateRandomCharacter(this.selectedGender));
        }
        
        this.renderCharacterChoices();
    }

    generateRandomCharacter(gender) {
        const charGender = gender || (this.chance(50) ? 'male' : 'female');
        const nameData = this.generateRandomName(charGender);
        const race = this.randomPick(['human', 'elf', 'beastkin', 'demon', 'dragonborn', 'angel']);
        const cheatSkill = this.randomPick(['sword', 'magic', 'healing', 'stealth', 'charisma', 'luck']);
        
        const raceBonus = DATA.raceBonuses[race];
        const skillBonus = DATA.cheatSkillBonuses[cheatSkill];
        
        const baseStr = this.randomInt(8, 14);
        const baseInt = this.randomInt(8, 14);
        const baseAgi = this.randomInt(8, 14);
        const baseCha = this.randomInt(8, 14);
        const baseLck = this.randomInt(8, 14);
        
        const parents = this.generateParents();
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
                relation: isOlder ? (sibGender === 'male' ? 'أخ أكبر' : 'أخت أكبر') : (sibGender === 'male' ? 'أخ أصغر' : 'أخت أصغر'),
                age: isOlder ? this.randomInt(1, 5) : -this.randomInt(1, 3),
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
                            <span>${char.gender === 'male' ? '♂' : '♀'} ${DATA.raceNames[char.race]}</span>
                        </div>
                    </div>
                    <div class="char-card-stats">
                        <div class="mini-stat">
                            <span class="mini-stat-label">قوة</span>
                            <span class="mini-stat-value" style="color: var(--str-color)">${char.stats.str}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-label">ذكاء</span>
                            <span class="mini-stat-value" style="color: var(--int-color)">${char.stats.int}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-label">رشاقة</span>
                            <span class="mini-stat-value" style="color: var(--agi-color)">${char.stats.agi}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-label">كاريزما</span>
                            <span class="mini-stat-value" style="color: var(--cha-color)">${char.stats.cha}</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-label">حظ</span>
                            <span class="mini-stat-value" style="color: var(--lck-color)">${char.stats.lck}</span>
                        </div>
                    </div>
                    <div class="char-card-skill">
                        <span class="char-card-skill-icon">${skillIcons[char.cheatSkill]}</span>
                        <span class="char-card-skill-name">${DATA.cheatSkillNames[char.cheatSkill]}</span>
                    </div>
                    <div class="char-card-family">
                        👨‍👩‍👧 العائلة: ${char.parents.father.firstName} و ${char.parents.mother.firstName}
                        ${char.siblings.length > 0 ? ` • ${char.siblings.length} ${char.siblings.length > 1 ? 'إخوة' : 'أخ/أخت'}` : ''}
                    </div>
                    <button class="char-card-select-btn">✦ اختر هذه الحياة ✦</button>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    selectCharacter(index) {
        const char = this.characterChoices[index];
        if (!char) return;
        
        this.generateWorldLocations();
        
        this.initializeFromChoice(char);
        this.showScreen('game-screen');
        this.updateAllUI();
        this.addLogEntry(`✨ لقد تناسخت في عالم إيثيريا باسم ${char.fullName} من عرق ${DATA.raceNames[char.race]}!`, 'special');
        this.addLogEntry(`🌟 منحتك الإلهة: ${DATA.cheatSkillNames[char.cheatSkill]}!`, 'special');
        this.addLogEntry(`👨‍👩‍👧 والداك هما ${this.state.parents.father.firstName} و ${this.state.parents.mother.firstName} ${this.state.parents.father.lastName}.`, 'normal');
        if (this.state.siblings.length > 0) {
            const siblingNames = this.state.siblings.map(s => `${s.name} (${s.relation})`).join('، ');
            this.addLogEntry(`👫 إخوتك: ${siblingNames}`, 'normal');
        }
        this.addLogEntry(`📍 تجد نفسك في ${this.getLocationName(0)}.`, 'quest');
        this.showAgeActions();
    }

    initializeFromChoice(char) {
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
            
            parents: char.parents,
            siblings: char.siblings,
            
            hp: 100, maxHp: 100,
            mp: 50, maxMp: 50,
            str: char.stats.str,
            int: char.stats.int,
            agi: char.stats.agi,
            cha: char.stats.cha,
            lck: char.stats.lck,
            
            initialStats: initialStats,

            gold: 0,
            fame: 0,

            guildRank: 0,
            guildExp: 0,

            currentLocation: 0,

            inventory: [],

            skills: {},

            relationships: [],

            activeQuests: [],
            completedQuests: 0,

            achievements: [],

            demonLordDefeated: false,
            inSchool: false,
            hasGuild: false,
            married: false,
            marriedTo: null,
            marriedToData: null,
            isDead: false,
            deathCause: null,
            isChild: true,

            mood: 70,
            moodState: 'happy',
            
            storyPhase: 'baby',
            completedMilestones: [],
            lastEventTypes: [],
            
            locationYears: 0,
            locationEvents: 0,

            logHistory: [],
        };

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

    // ============ إنشاء الشخصية (القديم - للتوافق) ============
    selectOption(btn, category) {
        const parent = btn.parentElement;
        parent.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.creationChoices[category] = btn.dataset.value;
        
        if (category === 'gender') {
            const generatedName = this.generateRandomName(btn.dataset.value);
            document.getElementById('char-name').value = generatedName.firstName;
            document.getElementById('char-name').placeholder = `مقترح: ${generatedName.firstName}`;
        }
    }

    confirmCreation() {
        let name = document.getElementById('char-name').value.trim();
        
        if (!name && this.creationChoices.gender) {
            name = this.generateRandomName(this.creationChoices.gender).firstName;
            document.getElementById('char-name').value = name;
        }
        
        if (!name) { this.showNotification("الرجاء إدخال اسم!", "danger"); return; }
        if (!this.creationChoices.gender) { this.showNotification("الرجاء اختيار الجنس!", "danger"); return; }
        if (!this.creationChoices.race) { this.showNotification("الرجاء اختيار العرق!", "danger"); return; }
        if (!this.creationChoices.cheatSkill) { this.showNotification("الرجاء اختيار مهارة خارقة!", "danger"); return; }

        this.generateWorldLocations();

        this.initializeCharacter(name);
        this.showScreen('game-screen');
        this.updateAllUI();
        this.addLogEntry(`✨ لقد تناسخت في عالم إيثيريا باسم ${name} من عرق ${DATA.raceNames[this.creationChoices.race]}!`, 'special');
        this.addLogEntry(`🌟 منحتك الإلهة: ${DATA.cheatSkillNames[this.creationChoices.cheatSkill]}!`, 'special');
        this.addLogEntry(`👨‍👩‍👧 والداك هما ${this.state.parents.father.firstName} و ${this.state.parents.mother.firstName} ${this.state.parents.father.lastName}.`, 'normal');
        this.addLogEntry(`📍 تجد نفسك في ${this.getLocationName(0)}.`, 'quest');
        this.showAgeActions();
    }

    initializeCharacter(name) {
        const raceBonus = DATA.raceBonuses[this.creationChoices.race];
        const skillBonus = DATA.cheatSkillBonuses[this.creationChoices.cheatSkill];
        
        const parents = this.generateParents();
        
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
            
            parents: parents,
            
            hp: 100, maxHp: 100,
            mp: 50, maxMp: 50,
            str: baseStr + (raceBonus.str || 0) + (skillBonus.str || 0),
            int: baseInt + (raceBonus.int || 0) + (skillBonus.int || 0),
            agi: baseAgi + (raceBonus.agi || 0) + (skillBonus.agi || 0),
            cha: baseCha + (raceBonus.cha || 0) + (skillBonus.cha || 0),
            lck: baseLck + (raceBonus.lck || 0) + (skillBonus.lck || 0),

            gold: 50,
            fame: 0,

            guildRank: 0,
            guildExp: 0,

            currentLocation: 0,

            inventory: [
                { itemId: 'rusty_sword', quantity: 1 },
                { itemId: 'health_potion', quantity: 3 },
            ],

            skills: {},

            relationships: [],

            activeQuests: [],
            completedQuests: 0,

            achievements: [],

            demonLordDefeated: false,
            inSchool: false,
            hasGuild: false,
            married: false,
            marriedTo: null,
            marriedToData: null,
            isDead: false,
            deathCause: null,
            isChild: true,

            mood: 70,
            moodState: 'happy',
            
            storyPhase: 'baby',
            completedMilestones: [],
            lastEventTypes: [],
            
            locationYears: 0,
            locationEvents: 0,

            logHistory: [],
        };

        ['str','int','agi','cha','lck'].forEach(s => {
            if (this.state[s] < 1) this.state[s] = 1;
        });

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

    // ============ تحديث الواجهة ============
    updateAllUI() {
        if (!this.state) return;
        const s = this.state;

        document.getElementById('char-display-name').textContent = s.fullName || s.name;
        document.getElementById('char-title').textContent = `مس.${s.level} ${this.getTitle()}`;
        document.getElementById('char-age').textContent = s.age;
        document.getElementById('world-year').textContent = s.worldYear;

        this.updateMoodState();
        document.getElementById('mood-icon').textContent = this.getMoodIcon();
        document.getElementById('mood-text').textContent = this.getMoodName();
        document.getElementById('mood-value').textContent = s.mood;
        const moodFill = document.getElementById('mood-fill');
        moodFill.style.width = `${s.mood}%`;
        moodFill.className = `mood-fill mood-${s.moodState}`;

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

        document.getElementById('gold-value').textContent = `${s.gold} ذ`;
        document.getElementById('fame-value').textContent = s.fame;

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
        let title = "مبتدئ";
        for (const t of DATA.titles) {
            if (this.state.level >= t.level) title = t.title;
        }
        return title;
    }

    // ============ نظام السجل ============
    addLogEntry(text, type = 'normal', statChanges = null) {
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

        const statLabels = { str: 'قوة', int: 'ذكاء', agi: 'رشاقة', cha: 'كاريزما', lck: 'حظ', hp: 'ص.ح', mp: 'ط.س' };

        let html = `<span class="entry-age">العمر ${age} — السنة ${year}</span>`;
        html += `<span class="entry-text"></span>`;

        if (statChanges) {
            html += '<div class="stat-change" style="opacity:0">';
            for (const [key, val] of Object.entries(statChanges)) {
                const label = statLabels[key] || key.toUpperCase();
                if (val > 0) html += `<span class="positive-change">+${val} ${label} </span>`;
                else if (val < 0) html += `<span class="negative-change">${val} ${label} </span>`;
            }
            html += '</div>';
        }

        entry.innerHTML = html;
        logEntries.appendChild(entry);

        requestAnimationFrame(() => {
            entry.style.transition = 'opacity 0.2s ease';
            entry.style.opacity = '1';
        });

        const textEl = entry.querySelector('.entry-text');
        const statEl = entry.querySelector('.stat-change');
        this._typewriterEffect(textEl, text, 18, () => {
            if (statEl) {
                statEl.style.transition = 'opacity 0.3s ease';
                statEl.style.opacity = '1';
            }
            const eventLog = document.getElementById('event-log');
            eventLog.scrollTop = eventLog.scrollHeight;
            setTimeout(() => this._processLogQueue(), 150);
        });

        const eventLog = document.getElementById('event-log');
        const scrollToBottom = () => { eventLog.scrollTop = eventLog.scrollHeight; };
        requestAnimationFrame(scrollToBottom);
    }

    _typewriterEffect(element, text, speed, callback) {
        let i = 0;
        const chars = [...text];
        element.classList.add('typing');
        const type = () => {
            if (i < chars.length) {
                const chunk = chars.slice(i, i + 2).join('');
                element.textContent += chunk;
                i += 2;
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

    // ============ نظام الإشعارات ============
    showNotification(text, type = 'info') {
        const notif = document.getElementById('notification');
        notif.textContent = text;
        notif.className = `notification ${type} show`;
        setTimeout(() => notif.classList.remove('show'), 2500);
    }

    // ============ نظام التبويبات ============
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

    // ============ تبويب العائلة ============
    showFamily() {
        const panel = document.getElementById('action-panel');
        const s = this.state;
        let html = '';

        html += '<div class="section-header">👨‍👩‍👧 العائلة</div>';

        // قسم الزوج/الزوجة
        if (s.married && s.marriedToData) {
            html += '<div class="family-section">';
            html += '<div class="family-section-title">💒 الزوج/الزوجة</div>';
            const spouse = s.marriedToData;
            html += `
                <div class="family-member-card">
                    <div class="family-avatar">${spouse.gender === 'male' ? '🤵' : '👰'}</div>
                    <div class="family-info">
                        <div class="family-name">${spouse.fullName || spouse.name}</div>
                        <div class="family-details">${spouse.gender === 'male' ? 'زوج' : 'زوجة'} • ${spouse.typeName || spouse.type} ${spouse.personality}</div>
                    </div>
                    <span class="family-status alive">💕 ${spouse.affection}%</span>
                </div>
            `;
            html += '</div>';
        } else if (s.married) {
            html += '<div class="family-section">';
            html += '<div class="family-section-title">💒 الزوج/الزوجة</div>';
            html += `
                <div class="family-member-card">
                    <div class="family-avatar">💕</div>
                    <div class="family-info">
                        <div class="family-name">${s.marriedTo}</div>
                        <div class="family-details">شريك الحياة</div>
                    </div>
                    <span class="family-status alive">❤️ متزوج</span>
                </div>
            `;
            html += '</div>';
        }

        // قسم الوالدين
        html += '<div class="family-section">';
        html += '<div class="family-section-title">👨‍👩‍👧 الوالدان</div>';
        
        if (s.parents) {
            const father = s.parents.father;
            const mother = s.parents.mother;
            
            if (father) {
                html += `
                    <div class="family-member-card ${father.alive ? '' : 'deceased'}">
                        <div class="family-avatar">👨</div>
                        <div class="family-info">
                            <div class="family-name">${father.firstName} ${father.lastName}</div>
                            <div class="family-details">${father.relation} • العمر ${father.age}</div>
                        </div>
                        <span class="family-status ${father.alive ? 'alive' : 'deceased'}">${father.alive ? '❤️ حي' : '💀 متوفي'}</span>
                    </div>
                `;
            }
            
            if (mother) {
                html += `
                    <div class="family-member-card ${mother.alive ? '' : 'deceased'}">
                        <div class="family-avatar">👩</div>
                        <div class="family-info">
                            <div class="family-name">${mother.firstName} ${mother.lastName}</div>
                            <div class="family-details">${mother.relation} • العمر ${mother.age}</div>
                        </div>
                        <span class="family-status ${mother.alive ? 'alive' : 'deceased'}">${mother.alive ? '❤️ حية' : '💀 متوفية'}</span>
                    </div>
                `;
            }
        }
        html += '</div>';

        // قسم الإخوة
        html += '<div class="family-section">';
        html += '<div class="family-section-title">👫 الإخوة</div>';
        
        if (s.siblings && s.siblings.length > 0) {
            s.siblings.forEach(sib => {
                const sibAge = s.age + sib.age;
                html += `
                    <div class="family-member-card ${sib.alive ? '' : 'deceased'}">
                        <div class="family-avatar">${sib.gender === 'male' ? '👦' : '👧'}</div>
                        <div class="family-info">
                            <div class="family-name">${sib.name} ${s.lastName}</div>
                            <div class="family-details">${sib.relation} • العمر ${Math.max(0, sibAge)}</div>
                        </div>
                        <span class="family-status ${sib.alive ? 'alive' : 'deceased'}">${sib.alive ? '❤️ حي' : '💀 متوفي'}</span>
                    </div>
                `;
            });
        } else {
            html += '<div class="empty-state">أنت طفل وحيد.</div>';
        }
        html += '</div>';

        panel.innerHTML = html;
    }

    // ============ تبويب تطور الإحصائيات ============
    showStatsDevelopment() {
        const panel = document.getElementById('action-panel');
        const s = this.state;
        const initial = s.initialStats || { str: 10, int: 10, agi: 10, cha: 10, lck: 10 };
        
        const stats = [
            { key: 'str', name: 'القوة', icon: '⚔️', color: 'var(--str-color)' },
            { key: 'int', name: 'الذكاء', icon: '🧠', color: 'var(--int-color)' },
            { key: 'agi', name: 'الرشاقة', icon: '💨', color: 'var(--agi-color)' },
            { key: 'cha', name: 'الكاريزما', icon: '💖', color: 'var(--cha-color)' },
            { key: 'lck', name: 'الحظ', icon: '🍀', color: 'var(--lck-color)' },
        ];
        
        let html = '<div class="section-header">📊 تطور الإحصائيات</div>';
        
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
                        <span>البداية: ${start}</span>
                        <span class="${change >= 0 ? 'stat-change-positive' : 'stat-change-negative'}">
                            ${change >= 0 ? '+' : ''}${change} نمو
                        </span>
                    </div>
                </div>
            `;
        });
        
        const totalGrowth = stats.reduce((sum, stat) => {
            return sum + (s[stat.key] - (initial[stat.key] || 10));
        }, 0);
        
        html += `
            <div class="log-entry special" style="margin-top: 16px; text-align: center;">
                <strong>📈 إجمالي النمو: +${totalGrowth} نقطة إحصائيات</strong><br>
                <small>المستوى ${s.level} • العمر ${s.age}</small>
            </div>
        `;
        
        panel.innerHTML = html;
    }

    // ============ تعديل الإحصائيات ============
    modifyStat(stat, amount) {
        if (!this.state) return;
        const moodMod = this.getMoodStatModifier();
        const adjusted = amount > 0 ? Math.max(1, Math.round(amount * moodMod)) : amount;
        this.state[stat] = Math.max(0, Math.min(100, (this.state[stat] || 0) + adjusted));
        
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

    // ============ نظام المزاج ============
    modifyMood(amount, reason) {
        const old = this.state.mood;
        this.state.mood = Math.max(0, Math.min(100, this.state.mood + amount));
        this.updateMoodState();
        
        if (reason && Math.abs(amount) >= 5) {
            const dir = amount > 0 ? '↑' : '↓';
            const icon = amount > 0 ? '😊' : '😔';
            this.addLogEntry(`${icon} ${reason} (المزاج ${dir}${Math.abs(amount)})`, amount > 0 ? 'positive' : 'negative');
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
            ecstatic: 'مبتهج', happy: 'سعيد', content: 'راضٍ', neutral: 'محايد',
            sad: 'حزين', depressed: 'مكتئب', angry: 'غاضب'
        };
        return names[this.state.moodState] || 'محايد';
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
        
        const gains = {
            str: Math.floor(Math.random() * 3) + 1,
            int: Math.floor(Math.random() * 3) + 1,
            agi: Math.floor(Math.random() * 3) + 1,
            cha: Math.floor(Math.random() * 2),
            lck: Math.floor(Math.random() * 2),
        };

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

        this.addLogEntry(`🎉 ارتقاء المستوى! أنت الآن المستوى ${this.state.level}! — ${this.getTitle()}`, 'level-up', gains);
        this.showNotification(`⬆️ المستوى ${this.state.level}!`, 'special');

        if (this.state.level >= 10) this.unlockAchievement('level_10');
        if (this.state.level >= 25) this.unlockAchievement('level_25');
        if (this.state.level >= 50) this.unlockAchievement('level_50');
    }

    // ============ الإنجازات ============
    unlockAchievement(id) {
        if (this.state.achievements.includes(id)) return;
        this.state.achievements.push(id);
        const ach = DATA.achievements[id];
        this.showNotification(`🏆 إنجاز: ${ach.name}!`, 'special');
        this.addLogEntry(`🏆 تم فتح إنجاز: ${ach.icon} ${ach.name} — ${ach.desc}`, 'special');
    }

    // ============ القائمة ============
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
            <div class="section-header">📋 صحيفة الشخصية</div>
            <div class="log-entry special">
                <p><strong>${s.fullName || s.name}</strong></p>
                <p>${s.gender === 'male' ? '♂' : '♀'} ${DATA.raceNames[s.race]} | العمر ${s.age}</p>
                <p>المزاج: ${this.getMoodIcon()} ${this.getMoodName()} (${s.mood}%)</p>
                <p>المستوى ${s.level} ${this.getTitle()}</p>
                <p>الخبرة: ${s.exp}/${s.expToNext}</p>
                <p>رتبة النقابة: ${DATA.guildRanks[s.guildRank]}</p>
                <p>المهارة الخارقة: ${DATA.cheatSkillNames[s.cheatSkill]}</p>
                <p>الموقع: ${this.getLocationName(s.currentLocation)} (${s.locationYears || 0} سنوات)</p>
                <p>المهام المكتملة: ${s.completedQuests}</p>
                <p>الزواج: ${s.married ? '💒 ' + s.marriedTo : 'لا'}</p>
                <hr style="border-color: rgba(255,255,255,0.2); margin: 10px 0;">
                <p><strong>👨‍👩‍👧 العائلة</strong></p>
                ${father ? `<p>👨 ${father.firstName} ${father.lastName}: ${father.alive ? `العمر ${father.age}` : '💀 متوفي'}</p>` : ''}
                ${mother ? `<p>👩 ${mother.firstName} ${mother.lastName}: ${mother.alive ? `العمر ${mother.age}` : '💀 متوفية'}</p>` : ''}
            </div>
            <button class="choice-btn" onclick="game.switchTab('story')">العودة →</button>
        `;
    }

    showQuestLog() {
        this.toggleMenu();
        const panel = document.getElementById('action-panel');
        if (this.state.activeQuests.length === 0) {
            panel.innerHTML = `
                <div class="section-header">📜 سجل المهام</div>
                <div class="empty-state">لا توجد مهام نشطة. قم بزيارة نقابة المغامرين!</div>
                <button class="choice-btn" onclick="game.switchTab('story')">العودة →</button>
            `;
        } else {
            let html = '<div class="section-header">📜 سجل المهام</div>';
            this.state.activeQuests.forEach((q, i) => {
                html += `<div class="log-entry quest">
                    <strong>${q.name}</strong><br>
                    <small>${q.desc}</small><br>
                    <small>المكافأة: ${q.goldReward} ذهب، ${q.expReward} خبرة</small>
                </div>`;
            });
            html += '<button class="choice-btn" onclick="game.switchTab(\'story\')">العودة →</button>';
            panel.innerHTML = html;
        }
    }

    showAchievements() {
        this.toggleMenu();
        const panel = document.getElementById('action-panel');
        let html = '<div class="section-header">🏆 الإنجازات</div>';
        
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
        html += '<button class="choice-btn" onclick="game.switchTab(\'story\')">العودة →</button>';
        panel.innerHTML = html;
    }

    // ============ الحفظ/التحميل ============
    saveGame() {
        localStorage.setItem('isekailife_save_ar', JSON.stringify(this.state));
        localStorage.setItem('isekailife_locations_ar', JSON.stringify(this.worldLocations));
        this.showNotification("💾 تم حفظ اللعبة!", "success");
    }

    loadGame() {
        const save = localStorage.getItem('isekailife_save_ar');
        const locations = localStorage.getItem('isekailife_locations_ar');
        if (save) {
            this.state = JSON.parse(save);
            if (this.state.mood === undefined) this.state.mood = 60;
            if (!this.state.moodState) this.state.moodState = 'content';
            if (!this.state.storyPhase) this.state.storyPhase = this.getStoryPhase();
            if (!this.state.completedMilestones) this.state.completedMilestones = [];
            if (!this.state.lastEventTypes) this.state.lastEventTypes = [];
            if (this.state.locationYears === undefined) this.state.locationYears = 0;
            if (this.state.locationEvents === undefined) this.state.locationEvents = 0;
            if (this.state.marriedToData === undefined) this.state.marriedToData = null;
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
            this.showNotification("📂 تم تحميل اللعبة!", "success");
        }
    }

    checkForSave() {
        if (localStorage.getItem('isekailife_save_ar')) {
            document.getElementById('load-btn').style.display = 'inline-block';
        }
    }

    // ============ دوال مساعدة ============
    randomPick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    chance(percent) {
        return Math.random() * 100 < percent;
    }

    // ============ نظام الموت ============
    checkForDeath() {
        if (this.state.isDead) return true;
        
        const age = this.state.age;
        let deathChance = 0;
        
        if (age < 10) {
            deathChance = 0.5 + (this.state.hp <= 10 ? 5 : 0);
        } else if (age < 30) {
            deathChance = 1 + (this.state.hp <= 10 ? 10 : 0);
        } else if (age < 50) {
            deathChance = 2 + (age - 30) * 0.2;
        } else if (age < 70) {
            deathChance = 5 + (age - 50) * 0.5;
        } else {
            deathChance = 15 + (age - 70) * 2;
        }
        
        deathChance = Math.max(0.1, deathChance - (this.state.lck * 0.1));
        
        if (this.chance(deathChance)) {
            this.triggerDeath();
            return true;
        }
        return false;
    }

    triggerDeath(forcedCause = null) {
        this.state.isDead = true;
        
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
            <p><strong>ملخص الحياة</strong></p>
            <p>👤 ${s.fullName || s.name}</p>
            <p>📅 عاش حتى عمر ${s.age}</p>
            <p>${finalMoodIcon} المزاج الأخير: ${finalMood}</p>
            <p>⭐ وصل للمستوى ${s.level}</p>
            <p>🏆 رتبة النقابة: ${DATA.guildRanks[s.guildRank]}</p>
            <p>⚔️ المهام المكتملة: ${s.completedQuests}</p>
            <p>💰 إجمالي الذهب: ${s.gold}</p>
            <p>💕 العلاقات: ${s.relationships.length}</p>
            <p>💒 الزواج: ${s.married ? 'نعم' : 'لا'}</p>
            <p>🏅 الإنجازات: ${s.achievements.length}/${Object.keys(DATA.achievements).length}</p>
        `;
        
        this.showScreen('gameover-screen');
    }

    // ============ أحداث الوالدين ============
    parentEvent() {
        if (!this.state.parents) return;
        
        const father = this.state.parents.father;
        const mother = this.state.parents.mother;
        
        if (father.alive) father.age++;
        if (mother.alive) mother.age++;
        
        if (father.alive && father.age > 60 && this.chance(father.age - 55)) {
            father.alive = false;
            this.addLogEntry(`😢 والدك ${father.firstName} قد رحل عن هذا العالم...`, 'negative');
            this.modifyStat('cha', -1);
            this.modifyMood(-20, "فقدان والدك يمزق قلبك...");
        }
        
        if (mother.alive && mother.age > 60 && this.chance(mother.age - 55)) {
            mother.alive = false;
            this.addLogEntry(`😢 والدتك ${mother.firstName} قد رحلت عن هذا العالم...`, 'negative');
            this.modifyStat('cha', -1);
            this.modifyMood(-20, "فقدان والدتك يمزق قلبك...");
        }
        
        if (this.state.siblings) {
            this.state.siblings.forEach(sib => {
                const siblingActualAge = this.state.age + sib.age;
                if (sib.alive && siblingActualAge > 50 && this.chance((siblingActualAge - 50) * 0.5)) {
                    sib.alive = false;
                    this.addLogEntry(`😢 ${sib.relation} ${sib.name} قد رحل/ت عن هذا العالم...`, 'negative');
                    this.modifyStat('cha', -1);
                    this.modifyMood(-15, `فقدان ${sib.name} يجعلك حزيناً جداً...`);
                }
            });
        }
    }
}
