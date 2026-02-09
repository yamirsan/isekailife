/* ============================================
   IsekaiLife Arabic - Core Game Engine
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
            `${typeLabel} ${prefix} ${name}`,
            `${name} ${prefix}${suffix ? ' ' + suffix : ''}`
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

    generateSiblings(playerGender, parents) {
        const siblings = [];
        const numSiblings = this.randomInt(0, 3);
        
        for (let i = 0; i < numSiblings; i++) {
            const sibGender = this.randomPick(['male', 'female']);
            const sibName = this.generateRandomName(sibGender);
            sibName.lastName = parents.father.lastName;
            
            const ageOffset = this.randomInt(-5, 5);
            let relation;
            if (sibGender === 'male') {
                relation = ageOffset > 0 ? 'أخ أصغر' : 'أخ أكبر';
            } else {
                relation = ageOffset > 0 ? 'أخت أصغر' : 'أخت أكبر';
            }
            
            siblings.push({
                name: sibName.firstName,
                lastName: sibName.lastName,
                fullName: sibName.fullName,
                gender: sibGender,
                relation: relation,
                age: ageOffset,
                alive: true
            });
        }
        
        return siblings;
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
                        document.getElementById('continue-btn').classList.remove('hidden');
                    }, 800);
                }
            }, delay);
        });
    }

    showCharacterCreation() {
        this.showScreen('creation-screen');
        document.getElementById('gender-selection').style.display = 'block';
        document.getElementById('character-selection').classList.add('hidden');
        this.selectedGender = null;
    }

    // ============ اختيار الجنس ============
    selectGenderAndGenerate(gender) {
        this.selectedGender = gender;
        document.getElementById('gender-selection').style.display = 'none';
        document.getElementById('character-selection').classList.remove('hidden');
        document.getElementById('selected-gender-text').textContent = `الجنس: ${gender === 'male' ? '♂️ ذكر' : '♀️ أنثى'}`;
        this.generateNewChoices();
    }

    backToGenderSelect() {
        document.getElementById('gender-selection').style.display = 'block';
        document.getElementById('character-selection').classList.add('hidden');
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

    generateRandomCharacter(charGender) {
        const name = this.generateRandomName(charGender);
        const race = this.randomPick(Object.keys(DATA.raceBonuses));
        const cheatSkill = this.randomPick(Object.keys(DATA.cheatSkillBonuses));
        
        const raceBonus = DATA.raceBonuses[race];
        const skillBonus = DATA.cheatSkillBonuses[cheatSkill];
        
        const stats = {
            str: 10 + (raceBonus.str || 0) + (skillBonus.str || 0) + this.randomInt(-2, 2),
            int: 10 + (raceBonus.int || 0) + (skillBonus.int || 0) + this.randomInt(-2, 2),
            agi: 10 + (raceBonus.agi || 0) + (skillBonus.agi || 0) + this.randomInt(-2, 2),
            cha: 10 + (raceBonus.cha || 0) + (skillBonus.cha || 0) + this.randomInt(-2, 2),
            lck: 10 + (raceBonus.lck || 0) + (skillBonus.lck || 0) + this.randomInt(-2, 2)
        };
        
        return {
            name: name.firstName,
            lastName: name.lastName,
            fullName: name.fullName,
            gender: charGender,
            race: race,
            cheatSkill: cheatSkill,
            stats: stats
        };
    }

    renderCharacterChoices() {
        const container = document.getElementById('character-choices');
        container.innerHTML = '';
        
        this.characterChoices.forEach((char, index) => {
            const card = document.createElement('div');
            card.className = 'char-choice-card';
            card.onclick = () => this.selectCharacter(index);
            
            // استخدام أيقونة الأنمي حسب الجنس والعرق
            const animeIcon = DATA.animeIcons[char.race] ? 
                DATA.animeIcons[char.race][char.gender] || DATA.raceIcons[char.race] : 
                DATA.raceIcons[char.race];
            
            card.innerHTML = `
                <div class="char-choice-header">
                    <span class="char-choice-name">${animeIcon} ${char.fullName}</span>
                    <span class="char-choice-race">${DATA.raceNames[char.race]}</span>
                </div>
                <div class="char-choice-skill">${DATA.cheatSkillNames[char.cheatSkill]}</div>
                <div class="char-choice-stats">
                    <span class="char-stat">💪 ${char.stats.str}</span>
                    <span class="char-stat">🧠 ${char.stats.int}</span>
                    <span class="char-stat">🏃 ${char.stats.agi}</span>
                    <span class="char-stat">💬 ${char.stats.cha}</span>
                    <span class="char-stat">🍀 ${char.stats.lck}</span>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    selectCharacter(index) {
        const char = this.characterChoices[index];
        if (!char) return;
        
        this.generateWorldLocations();
        
        this.initializeFromChoice(char);
        this.showScreen('game-screen');
        this.updateAllUI();
        this.addLogEntry(`✨ لقد تناسخت في عالم أيثيريا باسم ${char.fullName} الـ${DATA.raceNames[char.race]}!`, 'special');
        this.addLogEntry(`🌟 الإلهة منحتك: ${DATA.cheatSkillNames[char.cheatSkill]}!`, 'special');
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
        const parents = this.generateParents();
        const siblings = this.generateSiblings(char.gender, parents);
        
        this.state = {
            name: char.name,
            lastName: char.lastName,
            fullName: char.fullName,
            gender: char.gender,
            race: char.race,
            cheatSkill: char.cheatSkill,
            age: 0,
            worldYear: 1,
            
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            
            str: char.stats.str,
            int: char.stats.int,
            agi: char.stats.agi,
            cha: char.stats.cha,
            lck: char.stats.lck,
            
            initialStats: initialStats,
            
            level: 1,
            exp: 0,
            expToNext: 100,
            gold: 0,
            fame: 0,
            
            guildRank: 0,
            completedQuests: 0,
            
            inventory: [],
            skills: {},
            relationships: [],
            
            parents: parents,
            siblings: siblings,
            
            activeQuests: [],
            achievements: [],
            eventLog: [],
            
            currentLocation: 0,
            
            married: false,
            marriedTo: null,
            marriedToData: null,
            
            isChild: true,
            inSchool: false,
            isDead: false,
            
            // Mood system
            mood: 70,
            moodState: 'happy',
            
            // Story progression tracking
            storyPhase: 'baby',
            completedMilestones: [],
            lastEventTypes: [],
            
            // Location persistence
            locationYears: 0,
            locationEvents: 0
        };
    }

    // ============ الأدوات المساعدة ============
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomPick(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    chance(percent) {
        return Math.random() * 100 < percent;
    }

    // ============ واجهة المستخدم ============
    updateAllUI() {
        const s = this.state;
        
        // الحصول على أيقونة الأنمي للشخصية
        const animeIcon = DATA.animeIcons[s.race] ? 
            DATA.animeIcons[s.race][s.gender] || DATA.raceIcons[s.race] : 
            (DATA.raceIcons[s.race] || '👤');
        
        document.getElementById('player-name').textContent = `${animeIcon} ${s.fullName || s.name}`;
        document.getElementById('player-level').textContent = `مستوى ${s.level} ${this.getTitle()}`;
        document.getElementById('header-gold').textContent = `💰 ${s.gold}`;
        document.getElementById('header-hp').textContent = `❤️ ${s.hp}/${s.maxHp}`;
        
        // تحديث المزاج
        this.updateMoodState();
        document.getElementById('mood-icon').textContent = this.getMoodIcon();
        document.getElementById('mood-text').textContent = this.getMoodName();
        document.getElementById('mood-value').textContent = s.mood;
        const moodFill = document.getElementById('mood-fill');
        moodFill.style.width = `${s.mood}%`;
        moodFill.className = `mood-fill mood-${s.moodState}`;
        
        const stats = ['str', 'int', 'agi', 'cha', 'lck'];
        stats.forEach(stat => {
            const value = Math.min(s[stat], 100);
            document.getElementById(`${stat}-bar`).style.width = `${value}%`;
            document.getElementById(`${stat}-value`).textContent = s[stat];
        });
    }

    getTitle() {
        let title = "مبتدئ";
        for (const t of DATA.titles) {
            if (this.state.level >= t.level) title = t.title;
        }
        return title;
    }

    addLogEntry(text, type = 'normal') {
        const log = document.getElementById('story-log');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = text;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
        
        this.state.eventLog.push({ text, type, age: this.state.age });
        
        if (log.children.length > 50) {
            log.removeChild(log.children[0]);
        }
    }

    showNotification(message, type = 'info') {
        const notif = document.getElementById('notification');
        notif.textContent = message;
        notif.className = `notification ${type}`;
        notif.classList.remove('hidden');
        
        setTimeout(() => {
            notif.classList.add('hidden');
        }, 3000);
    }

    // ============ التبويبات ============
    switchTab(tab) {
        this.currentTab = tab;
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        switch(tab) {
            case 'story': this.showAgeActions(); break;
            case 'inventory': this.showInventory(); break;
            case 'relationships': this.showRelationships(); break;
            case 'family': this.showFamily(); break;
            case 'stats': this.showStatsDevelopment(); break;
        }
    }

    toggleMenu() {
        const menu = document.getElementById('game-menu');
        menu.classList.toggle('hidden');
    }

    // ============ الإحصائيات ============
    modifyStat(stat, amount) {
        const moodMod = this.getMoodStatModifier();
        const adjusted = amount > 0 ? Math.max(1, Math.round(amount * moodMod)) : amount;
        this.state[stat] = Math.max(0, Math.min(100, this.state[stat] + adjusted));
        this.updateAllUI();
        
        if (adjusted > 0) {
            const statNames = { str: 'قوة', int: 'ذكاء', agi: 'رشاقة', cha: 'كاريزما', lck: 'حظ' };
            this.showNotification(`${statNames[stat]} +${adjusted}!`, 'success');
        }
    }

    modifyFame(amount) {
        this.state.fame += amount;
        if (amount > 0) {
            this.showNotification(`شهرة +${amount}!`, 'success');
        }
    }

    // ============ نظام المزاج ============
    modifyMood(amount, reason) {
        const old = this.state.mood;
        this.state.mood = Math.max(0, Math.min(100, this.state.mood + amount));
        this.updateMoodState();
        
        if (reason && Math.abs(amount) >= 5) {
            const dir = amount > 0 ? '↑' : '↓';
            const icon = amount > 0 ? '😊' : '😔';
            this.addLogEntry(`${icon} ${reason} (مزاج ${dir}${Math.abs(amount)})`, amount > 0 ? 'positive' : 'negative');
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
            ecstatic: 'منتشي', happy: 'سعيد', content: 'راضٍ', neutral: 'عادي',
            sad: 'حزين', depressed: 'مكتئب', angry: 'غاضب'
        };
        return names[this.state.moodState] || 'عادي';
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
        this.showNotification(`خبرة +${amount}!`, 'success');
        
        while (this.state.exp >= this.state.expToNext) {
            this.levelUp();
        }
        this.updateAllUI();
    }

    levelUp() {
        this.state.exp -= this.state.expToNext;
        this.state.level++;
        this.state.expToNext = Math.floor(this.state.expToNext * 1.5);
        
        const statGain = this.randomInt(1, 3);
        const stats = ['str', 'int', 'agi', 'cha', 'lck'];
        const randomStat = this.randomPick(stats);
        this.state[randomStat] += statGain;
        
        this.state.maxHp += 10;
        this.state.hp = this.state.maxHp;
        this.state.maxMp += 5;
        this.state.mp = this.state.maxMp;
        
        this.addLogEntry(`🎉 ارتقيت! المستوى ${this.state.level}!`, 'special');
    }

    // ============ العائلة ============
    showFamily() {
        const panel = document.getElementById('action-panel');
        const s = this.state;
        
        let html = '<div class="section-header">👨‍👩‍👧 العائلة</div>';
        
        // الزوج/الزوجة
        if (s.married && s.marriedToData) {
            html += '<div class="family-section">';
            html += '<div class="family-section-title">💒 الزوج/الزوجة</div>';
            const spouse = s.marriedToData;
            html += `
                <div class="family-member-card">
                    <div class="family-avatar">${spouse.gender === 'male' ? '🤵' : '👰'}</div>
                    <div class="family-info">
                        <div class="family-name">${spouse.fullName || spouse.name}</div>
                        <div class="family-details">${spouse.gender === 'male' ? 'زوج' : 'زوجة'} • ${spouse.typeName} ${spouse.personality}</div>
                    </div>
                    <span class="family-status alive">💕 ${spouse.affection}%</span>
                </div>
            `;
            html += '</div>';
        }
        
        // الوالدان
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
                            <div class="family-details">${father.relation} • عمر ${father.age}</div>
                        </div>
                        <span class="family-status ${father.alive ? 'alive' : 'deceased'}">${father.alive ? '❤️ حي' : '💀 متوفى'}</span>
                    </div>
                `;
            }
            
            if (mother) {
                html += `
                    <div class="family-member-card ${mother.alive ? '' : 'deceased'}">
                        <div class="family-avatar">👩</div>
                        <div class="family-info">
                            <div class="family-name">${mother.firstName} ${mother.lastName}</div>
                            <div class="family-details">${mother.relation} • عمر ${mother.age}</div>
                        </div>
                        <span class="family-status ${mother.alive ? 'alive' : 'deceased'}">${mother.alive ? '❤️ حية' : '💀 متوفاة'}</span>
                    </div>
                `;
            }
        }
        html += '</div>';

        html += '<div class="family-section">';
        html += '<div class="family-section-title">👫 الإخوة</div>';
        
        if (s.siblings && s.siblings.length > 0) {
            s.siblings.forEach(sib => {
                const sibAge = s.age + sib.age;
                html += `
                    <div class="family-member-card ${sib.alive ? '' : 'deceased'}">
                        <div class="family-avatar">${sib.gender === 'male' ? '👦' : '👧'}</div>
                        <div class="family-info">
                            <div class="family-name">${sib.name} ${sib.lastName}</div>
                            <div class="family-details">${sib.relation} • عمر ${Math.max(0, sibAge)}</div>
                        </div>
                        <span class="family-status ${sib.alive ? 'alive' : 'deceased'}">${sib.alive ? '❤️ حي' : '💀 متوفى'}</span>
                    </div>
                `;
            });
        } else {
            html += '<div class="empty-state">ليس لديك إخوة</div>';
        }
        html += '</div>';

        panel.innerHTML = html;
    }

    // ============ تطور الإحصائيات ============
    showStatsDevelopment() {
        const panel = document.getElementById('action-panel');
        const s = this.state;
        const initial = s.initialStats || { str: 10, int: 10, agi: 10, cha: 10, lck: 10 };
        
        const statInfo = [
            { key: 'str', name: '💪 قوة', current: s.str, initial: initial.str },
            { key: 'int', name: '🧠 ذكاء', current: s.int, initial: initial.int },
            { key: 'agi', name: '🏃 رشاقة', current: s.agi, initial: initial.agi },
            { key: 'cha', name: '💬 كاريزما', current: s.cha, initial: initial.cha },
            { key: 'lck', name: '🍀 حظ', current: s.lck, initial: initial.lck },
        ];
        
        let html = '<div class="section-header">📊 تطور الإحصائيات</div>';
        
        statInfo.forEach(stat => {
            const change = stat.current - stat.initial;
            const changeClass = change > 0 ? 'stat-change-positive' : (change < 0 ? 'stat-change-negative' : '');
            const changeSymbol = change > 0 ? '+' : '';
            
            html += `
                <div class="stat-history-card">
                    <div class="stat-history-header">
                        <span class="stat-history-name">${stat.name}</span>
                        <span class="stat-history-value">${stat.current}</span>
                    </div>
                    <div class="stat-history-change ${changeClass}">
                        البداية: ${stat.initial} → الحالي: ${stat.current}
                        ${change !== 0 ? `<span>(${changeSymbol}${change})</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        panel.innerHTML = html;
    }

    // ============ حالة الشخصية ============
    showStatus() {
        this.toggleMenu();
        const s = this.state;
        const father = s.parents?.father;
        const mother = s.parents?.mother;
        
        const panel = document.getElementById('action-panel');
        panel.innerHTML = `
            <div class="section-header">📋 صحيفة الشخصية</div>
            <div class="log-entry special">
                <p><strong>${s.fullName || s.name}</strong></p>
                <p>${s.gender === 'male' ? '♂' : '♀'} ${DATA.raceNames[s.race]} | عمر ${s.age}</p>
                <p>المزاج: ${this.getMoodIcon()} ${this.getMoodName()} (${s.mood}%)</p>
                <p>مستوى ${s.level} ${this.getTitle()}</p>
                <p>خبرة: ${s.exp}/${s.expToNext}</p>
                <p>رتبة النقابة: ${DATA.guildRanks[s.guildRank]}</p>
                <p>مهارة الغش: ${DATA.cheatSkillNames[s.cheatSkill]}</p>
                <p>الموقع: ${this.getLocationName(s.currentLocation)} (${s.locationYears || 0} سنوات)</p>
                <p>المهام المكتملة: ${s.completedQuests}</p>
                <p>متزوج: ${s.married ? '💒 ' + s.marriedTo : 'لا'}</p>
                <hr style="border-color: rgba(255,255,255,0.2); margin: 10px 0;">
                <p><strong>👨‍👩‍👧 العائلة</strong></p>
                ${father ? `<p>👨 ${father.firstName} ${father.lastName}: ${father.alive ? `عمر ${father.age}` : '💀 متوفى'}</p>` : ''}
                ${mother ? `<p>👩 ${mother.firstName} ${mother.lastName}: ${mother.alive ? `عمر ${mother.age}` : '💀 متوفاة'}</p>` : ''}
            </div>
            <button class="choice-btn" onclick="game.switchTab('story')">← رجوع</button>
        `;
    }

    showQuestLog() {
        this.toggleMenu();
        const panel = document.getElementById('action-panel');
        if (this.state.activeQuests.length === 0) {
            panel.innerHTML = `
                <div class="section-header">📜 سجل المهام</div>
                <div class="empty-state">لا توجد مهام نشطة. زر نقابة المغامرين!</div>
                <button class="choice-btn" onclick="game.switchTab('story')">← رجوع</button>
            `;
            return;
        }
        
        let html = '<div class="section-header">📜 سجل المهام</div>';
        this.state.activeQuests.forEach((quest, i) => {
            html += `<div class="log-entry quest">${quest.type}: ${quest.description}</div>`;
        });
        html += '<button class="choice-btn" onclick="game.switchTab(\'story\')">← رجوع</button>';
        panel.innerHTML = html;
    }

    showAchievements() {
        this.toggleMenu();
        const panel = document.getElementById('action-panel');
        
        let html = '<div class="section-header">🏆 الإنجازات</div>';
        
        for (const [id, ach] of Object.entries(DATA.achievements)) {
            const unlocked = this.state.achievements.includes(id);
            html += `<div class="inventory-item ${unlocked ? 'item-rarity-legendary' : ''}" style="opacity: ${unlocked ? 1 : 0.4}">
                <span class="item-icon">${ach.icon}</span>
                <div class="item-info">
                    <div class="item-name">${ach.name}</div>
                    <div class="item-desc">${ach.desc}</div>
                </div>
            </div>`;
        }
        html += '<button class="choice-btn" onclick="game.switchTab(\'story\')">← رجوع</button>';
        panel.innerHTML = html;
    }

    saveGame() {
        localStorage.setItem('isekailife_save_ar', JSON.stringify(this.state));
        localStorage.setItem('isekailife_locations_ar', JSON.stringify(this.worldLocations));
        this.showNotification('تم حفظ اللعبة!', 'success');
        this.toggleMenu();
    }

    loadGame() {
        const save = localStorage.getItem('isekailife_save_ar');
        const locations = localStorage.getItem('isekailife_locations_ar');
        if (save) {
            this.state = JSON.parse(save);
            // توافق مع الحفظ القديم
            if (this.state.mood === undefined) this.state.mood = 60;
            if (!this.state.moodState) this.state.moodState = 'content';
            if (!this.state.storyPhase) this.state.storyPhase = this.getStoryPhase();
            if (!this.state.completedMilestones) this.state.completedMilestones = [];
            if (!this.state.lastEventTypes) this.state.lastEventTypes = [];
            if (this.state.locationYears === undefined) this.state.locationYears = 0;
            if (this.state.locationEvents === undefined) this.state.locationEvents = 0;
            if (this.state.marriedToData === undefined) this.state.marriedToData = null;
            // إضافة جنس للعلاقات القديمة
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
            this.showNotification('تم تحميل اللعبة!', 'success');
        }
    }

    showCredits() {
        alert('حياة إيسيكاي\n\nمحاكي تناسخ بأسلوب الأنمي\n\nمستوحى من روايات إيسيكاي وألعاب BitLife\n\nالنسخة العربية');
    }

    // ============ شاشة الموت ============
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
            <p>⚔️ مهام مكتملة: ${s.completedQuests}</p>
            <p>💰 ذهب مجموع: ${s.gold}</p>
            <p>💕 علاقات: ${s.relationships.length}</p>
            <p>💒 متزوج: ${s.married ? 'نعم' : 'لا'}</p>
            <p>🏅 إنجازات: ${s.achievements.length}/${Object.keys(DATA.achievements).length}</p>
        `;
        
        this.showScreen('gameover-screen');
    }
}
