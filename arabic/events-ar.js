/* ============================================
   IsekaiLife Arabic - Events System
   نظام أحداث متسلسل مع حالة مزاجية
   ============================================ */

// ============ إظهار أحداث العمر ============
GameEngine.prototype.showAgeActions = function() {
    const panel = document.getElementById('action-panel');
    let html = '';

    if (this.pendingChoice) {
        const choice = this.pendingChoice;
        this.pendingChoice = null;
        panel.innerHTML = choice.html;
        return;
    }

    if (this.state.age < 10 && this.state.isChild) {
        const father = this.state.parents?.father;
        const mother = this.state.parents?.mother;
        html += `<div class="log-entry normal" style="margin-bottom: 10px;">
            <small>👶 أنت طفل يُربى من قبل والديك.</small><br>
            ${father && father.alive ? `<small>👨 ${father.firstName} ${father.lastName} (${father.relation}، عمر ${father.age})</small><br>` : ''}
            ${mother && mother.alive ? `<small>👩 ${mother.firstName} ${mother.lastName} (${mother.relation}، عمر ${mother.age})</small>` : ''}
        </div>`;
    }
    
    // عرض حالة المزاج في زر التقدم
    const moodIcon = this.getMoodIcon();
    html += `<button class="age-up-btn" onclick="game.ageUp()">${moodIcon} ⏩ تقدم بالعمر (العمر الحالي: ${this.state.age})</button>`;
    panel.innerHTML = html;
};

// ============ نظام تقدم العمر ============
GameEngine.prototype.ageUp = function() {
    if (this.state.isDead) return;
    
    this.state.age++;
    this.state.worldYear++;
    
    // تحديث مرحلة القصة
    this.state.storyPhase = this.getStoryPhase();
    
    this.updateFamily();
    
    this.checkDeath();
    if (this.state.isDead) return;
    
    // تشغيل الأحداث بالتسلسل
    this.triggerMoodEvent();
    this.triggerMilestoneEvents();
    this.triggerPhaseEvents();
    this.naturalMoodDrift();
    this.checkMoodEffects();
    
    this.updateAllUI();
    this.showAgeActions();
};

// ============ انحراف المزاج الطبيعي ============
GameEngine.prototype.naturalMoodDrift = function() {
    // المزاج يميل للعودة تدريجياً نحو 50 (عادي)
    if (this.state.mood > 55) {
        this.state.mood -= this.randomInt(1, 3);
    } else if (this.state.mood < 45) {
        this.state.mood += this.randomInt(1, 3);
    }
    
    // العائلة الحية تساعد في الاستقرار
    const fatherAlive = this.state.parents?.father?.alive;
    const motherAlive = this.state.parents?.mother?.alive;
    if (fatherAlive || motherAlive) {
        if (this.state.mood < 40) this.state.mood += 2;
    }
    
    // فقدان العائلة يؤثر
    if (!fatherAlive && !motherAlive && this.state.age < 18) {
        this.state.mood -= 2;
    }
    
    this.state.mood = Math.max(0, Math.min(100, this.state.mood));
    this.updateMoodState();
};

// ============ تأثيرات المزاج ============
GameEngine.prototype.checkMoodEffects = function() {
    const mood = this.state.moodState;
    
    // حالة الاكتئاب - أحداث خاصة
    if (mood === 'depressed' || mood === 'angry') {
        if (this.chance(40)) {
            const event = this.randomPick(DATA.depressionEvents);
            this.addLogEntry(`😔 ${event}`, 'negative');
            this.modifyStat('cha', -1);
        }
        // فرصة للتعافي
        if (this.chance(30)) {
            const recovery = this.randomPick(DATA.recoveryEvents);
            this.addLogEntry(`💪 ${recovery}`, 'positive');
            this.modifyMood(10, null);
        }
    }
    
    // السعادة العالية تعطي مكافآت
    if (mood === 'ecstatic' && this.chance(30)) {
        this.addLogEntry("✨ حماسك المشتعل يلهم من حولك!", 'special');
        this.modifyStat('cha', 1);
        this.modifyFame(2);
    }
};

// ============ أحداث المزاج ============
GameEngine.prototype.triggerMoodEvent = function() {
    const phase = this.state.storyPhase;
    const moodEvents = DATA.moodEvents[phase];
    if (!moodEvents || moodEvents.length === 0) return;
    
    // 50% فرصة لحدث مزاجي كل سنة
    if (!this.chance(50)) return;
    
    const event = this.randomPick(moodEvents);
    this.modifyMood(event.mood, event.text);
};

// ============ أحداث المعالم الأساسية (تحدث مرة واحدة) ============
GameEngine.prototype.triggerMilestoneEvents = function() {
    const age = this.state.age;
    const s = this.state;
    const father = s.parents?.father;
    const mother = s.parents?.mother;
    const parentAlive = (father && father.alive) || (mother && mother.alive);
    const randomParent = parentAlive ? (father && father.alive ? (mother && mother.alive ? this.randomPick([father, mother]) : father) : mother) : null;
    const milestones = s.completedMilestones;
    
    // ============ مرحلة الرضيع (0-2) ============
    if (age === 1 && !milestones.includes('birth')) {
        milestones.push('birth');
        this.addLogEntry("👶 ولدت في هذا العالم الجديد. كل شيء مشرق وسحري. تشعر بالمانا تتدفق في هذا العالم.", "special");
        if (parentAlive) {
            this.addLogEntry(`🏠 أنت تُربى من قبل ${father?.alive && mother?.alive ? `${father.firstName} و ${mother.firstName}` : randomParent?.firstName} في ${this.getLocationName(0)}.`, "normal");
        }
        this.modifyMood(10, null);
    }
    
    if (age === 2 && !milestones.includes('first_words')) {
        milestones.push('first_words');
        this.addLogEntry("🗣️ قلت كلماتك الأولى. والداك مندهشان من سرعة تطورك.", "normal");
        this.modifyMood(8, null);
        if (s.int > 15) {
            this.addLogEntry("🧒 بفضل ذكرياتك من حياتك السابقة، تستطيع القراءة بالفعل! الناس ينادونك بالعبقري.", "special");
            this.modifyStat('int', 2);
            this.modifyFame(5);
            this.modifyMood(10, null);
        }
    }
    
    // ============ مرحلة الطفل الصغير (3-5) ============
    if (age === 3 && !milestones.includes('first_mana')) {
        milestones.push('first_mana');
        this.addLogEntry("✨ حاولت توجيه المانا لأول مرة...", "normal");
        if (s.cheatSkill === 'magic' || s.int > 18) {
            this.addLogEntry("💥 انفجرت موجة سحرية من يديك! الجيران مصدومون!", "special");
            this.modifyStat('int', 3);
            this.modifyMood(12, null);
        } else {
            this.addLogEntry("لا شيء حدث... لكنك تشعر بشيء بداخلك.", "normal");
        }
    }
    
    if (age === 5 && !milestones.includes('learning')) {
        milestones.push('learning');
        this.addLogEntry("📚 بدأت تعلم القراءة والكتابة بشكل صحيح.", "normal");
        this.modifyStat('int', 1);
        this.modifyMood(5, null);
    }
    
    // ============ مرحلة الطفولة (6-9) ============
    if (age === 6 && !milestones.includes('school_start')) {
        milestones.push('school_start');
        this.addLogEntry("🏫 بدأت الذهاب إلى المدرسة!", "special");
        s.inSchool = true;
        this.modifyStat('int', 2);
        this.modifyMood(8, "يوم المدرسة الأول مثير!");
    }
    
    // ============ مرحلة ما قبل المراهقة (10-12) ============
    if (age === 10 && !milestones.includes('no_longer_child')) {
        milestones.push('no_longer_child');
        this.addLogEntry("🎂 أصبحت 10 سنوات! لم تعد طفلاً بعد الآن.", "special");
        s.isChild = false;
        this.modifyStat('str', 2);
        this.modifyStat('int', 2);
        this.modifyMood(10, "شعور بالنمو والقوة!");
    }
    
    if (age === 12 && !milestones.includes('combat_training')) {
        milestones.push('combat_training');
        this.addLogEntry("⚔️ بدأت تدريب القتال الحقيقي!", "special");
        this.triggerTrainingChoice();
    }
    
    // ============ مرحلة المراهقة (13-17) ============
    if (age === 15 && !milestones.includes('guild_join')) {
        milestones.push('guild_join');
        this.addLogEntry("🏛️ سجلت في نقابة المغامرين كرتبة F!", "quest");
        s.guildRank = 0;
        this.modifyFame(10);
        this.modifyMood(15, "الانضمام للنقابة حلم تحقق!");
    }
    
    // ============ مرحلة الشباب (18-24) ============
    if (age === 18 && !milestones.includes('adult')) {
        milestones.push('adult');
        this.addLogEntry("🎓 أصبحت بالغاً! أنت الآن مغامر كامل.", "special");
        s.inSchool = false;
        this.modifyStat('str', 3);
        this.modifyStat('int', 3);
        this.addLogEntry("🏛️ ترقيت إلى رتبة D!", "quest");
        s.guildRank = Math.max(s.guildRank, 2);
        this.modifyFame(30);
        this.modifyMood(15, null);
    }
    
    if (age === 20 && !milestones.includes('first_journey')) {
        milestones.push('first_journey');
        const newLoc = this.randomInt(1, this.worldLocations.length - 1);
        s.currentLocation = newLoc;
        s.locationYears = 0;
        this.addLogEntry("🌍 حان وقت المغامرة الكبرى! ودعت عائلتك وانطلقت في رحلتك.", "special");
        this.addLogEntry(`📍 بعد أيام من السفر، وصلت إلى ${this.getLocationName(newLoc)}!`, "quest");
        this.modifyMood(12, null);
    }
    
    // ============ مرحلة البلوغ (25+) ============
    if (age === 25 && !milestones.includes('demon_war')) {
        milestones.push('demon_war');
        this.addLogEntry("⚔️ قوات سيد الشياطين شنت هجوماً كبيراً على الممالك الجنوبية!", "battle");
        this.triggerBattle('strong');
        this.modifyMood(-8, "الحرب تدق أبوابنا...");
    }
    
    if (age === 30 && !milestones.includes('demon_lord')) {
        milestones.push('demon_lord');
        this.triggerDemonLordEvent();
    }
};

// ============ أحداث المراحل (تتكرر حسب المرحلة) ============
GameEngine.prototype.triggerPhaseEvents = function() {
    const phase = this.state.storyPhase;
    const age = this.state.age;
    const s = this.state;
    const father = s.parents?.father;
    const mother = s.parents?.mother;
    const parentAlive = (father && father.alive) || (mother && mother.alive);
    const randomParent = parentAlive ? (father && father.alive ? (mother && mother.alive ? this.randomPick([father, mother]) : father) : mother) : null;
    
    // تتبع سنوات الموقع — أحداث متعلقة بالموقع الحالي
    s.locationYears++;
    
    // أحداث الموقع الحالي
    if (age >= 15) {
        this.triggerLocationEvent();
    }
    
    // نظام مغادرة الأصدقاء
    if (age >= 18) {
        this.checkFriendDepartures();
    }
    
    // أحداث الزواج
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
            break;
            
        case 'young_adult':
            if (this.chance(40)) {
                const event = this.randomPick(DATA.adultEvents);
                this.addLogEntry(`✨ ${event.text}`, 'special');
                this.modifyStat(event.stat, event.amount);
            }
            if (this.chance(30)) this.triggerRandomEncounter();
            if (this.chance(20)) this.meetRandomPartyMember();
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
    
    this.checkAchievements();
};

// ============ أحداث الموقع — البقاء في مكان لفترة ============
GameEngine.prototype.triggerLocationEvent = function() {
    const s = this.state;
    const locName = this.getLocationName(s.currentLocation);
    const years = s.locationYears;
    
    // أحداث مرتبطة بالاستقرار في الموقع
    if (years === 1) {
        this.addLogEntry(`📍 بدأت تستكشف ${locName} وتتعرف على سكانها.`, 'quest');
    } else if (years === 3 && this.chance(60)) {
        this.addLogEntry(`🏠 أصبحت معروفاً في ${locName}. الناس يحيونك في الشوارع.`, 'normal');
        this.modifyStat('cha', 1);
        this.modifyMood(5, null);
    } else if (years === 5 && this.chance(50)) {
        this.addLogEntry(`⭐ أصبحت شخصية مهمة في ${locName}!`, 'special');
        this.modifyStat('cha', 2);
        this.modifyFame(10);
    } else if (years >= 3 && this.chance(15)) {
        // أحداث عشوائية مرتبطة بالموقع
        const locEvents = [
            `🎪 مهرجان سنوي أقيم في ${locName}! استمتعت بالاحتفالات.`,
            `🏪 تاجر جديد فتح متجراً في ${locName}. اكتشفت بضائع مثيرة.`,
            `🌧️ عاصفة قوية ضربت ${locName}. ساعدت في إعادة البناء.`,
            `📯 أخبار مهمة وصلت إلى ${locName} من العاصمة.`,
            `🎭 فرقة مسرحية زائرة عرضت قصة عن أبطال قدامى في ${locName}.`,
        ];
        this.addLogEntry(this.randomPick(locEvents), 'normal');
        this.modifyMood(this.randomInt(2, 6), null);
    }
    
    // السفر — لا يحدث كل سنة، بل كل 3-8 سنوات
    if (years >= this.randomInt(3, 8) && this.chance(25) && s.age >= 18) {
        const newLoc = this.randomInt(0, this.worldLocations.length - 1);
        if (newLoc !== s.currentLocation) {
            const oldName = locName;
            s.currentLocation = newLoc;
            s.locationYears = 0;
            s.locationEvents = 0;
            this.addLogEntry(`🗺️ بعد ${years} سنوات في ${oldName}، قررت الانتقال.`, 'normal');
            this.addLogEntry(`📍 وصلت إلى ${this.getLocationName(newLoc)}! مكان جديد ومغامرات جديدة.`, 'quest');
            this.modifyFame(5);
            this.modifyMood(8, null);
        }
    }
};

// ============ نظام مغادرة الأصدقاء ============
GameEngine.prototype.checkFriendDepartures = function() {
    const s = this.state;
    const activeRels = s.relationships.filter(r => r.active !== false);
    
    if (activeRels.length <= 1) return;
    
    activeRels.forEach(rel => {
        // لا يمكن للزوج/الزوجة المغادرة
        if (s.married && rel.name === s.marriedTo) return;
        
        const yearsKnown = s.age - (rel.metAge || 0);
        
        // أصدقاء بمودة منخفضة لفترة طويلة قد يغادرون
        if (rel.affection < 30 && yearsKnown > 3 && this.chance(15)) {
            rel.active = false;
            rel.departReason = 'ابتعد بسبب ضعف العلاقة';
            this.addLogEntry(`👋 ${rel.name} الـ${rel.typeName} قرر المضي في طريقه. لم تكن العلاقة قوية بما يكفي.`, 'negative');
            this.modifyMood(-5, null);
            return;
        }
        
        // بعض الأصدقاء يغادرون لأسباب قصصية بعد فترة
        if (yearsKnown > 8 && this.chance(8)) {
            const reasons = [
                { reason: 'عاد لوطنه', text: `🚶 ${rel.name} قرر العودة إلى وطنه. ودعتماه بدموع.` },
                { reason: 'انطلق في رحلة منفردة', text: `🌍 ${rel.name} أخبرك أنه يريد استكشاف العالم وحده. تمنيت له التوفيق.` },
                { reason: 'استقر في مدينة أخرى', text: `🏠 ${rel.name} وجد مكاناً يناسبه واستقر فيه. وعدكما أن تبقيا على تواصل.` },
                { reason: 'تقاعد من المغامرة', text: `⚔️ ${rel.name} قرر التقاعد من حياة المغامرة. "لقد كفاني ما مررت به" قال بابتسامة.` },
            ];
            const departure = this.randomPick(reasons);
            rel.active = false;
            rel.departReason = departure.reason;
            this.addLogEntry(departure.text, 'normal');
            this.modifyMood(-8, `سيفتقد ${rel.name}...`);
            return;
        }
        
        // المودة تنخفض طبيعياً إذا لم يتفاعل اللاعب
        if (this.chance(20) && rel.affection > 10) {
            rel.affection = Math.max(5, rel.affection - this.randomInt(1, 3));
        }
    });
};

// ============ أحداث الزوج/الزوجة ============
GameEngine.prototype.triggerSpouseEvent = function() {
    if (!this.chance(40)) return;
    
    const spouse = this.state.marriedToData;
    const spouseName = spouse.name;
    const pronoun = spouse.gender === 'male' ? 'هو' : 'هي';
    
    const events = [
        { text: `💕 قضيت يوماً جميلاً مع ${spouseName}. الحب يزداد عمقاً.`, mood: 6 },
        { text: `🍳 ${spouseName} حضر لك وجبة لذيذة.`, mood: 4 },
        { text: `😤 تشاجرت مع ${spouseName}... لكنكما تصالحتما قبل النوم.`, mood: -3 },
        { text: `🌙 جلست مع ${spouseName} تتأملان النجوم وتتحدثان عن المستقبل.`, mood: 8 },
        { text: `🎁 فاجأك ${spouseName} بهدية جميلة!`, mood: 7 },
        { text: `💪 تدربت مع ${spouseName}. ${pronoun} أقوى مما تظن!`, mood: 5 },
        { text: `🏠 أنت و${spouseName} تخططان لتوسعة المنزل.`, mood: 4 },
        { text: `❤️ ${spouseName} يذكرك بأنك أفضل شيء حصل ${spouse.gender === 'male' ? 'له' : 'لها'}.`, mood: 10 },
    ];
    
    const event = this.randomPick(events);
    this.addLogEntry(event.text, 'romance');
    this.modifyMood(event.mood, null);
    
    // تحديث مودة الزوج
    if (event.mood > 0) {
        spouse.affection = Math.min(100, spouse.affection + 1);
    }
};

// ============ أحداث المدرسة ============
GameEngine.prototype.triggerSchoolEvent = function() {
    const schoolEvents = [
        { text: "📖 تعلمت درساً جديداً في التاريخ القديم.", stat: "int", amount: 1, mood: 3 },
        { text: "🏃 أبليت حسناً في حصة الرياضة اليوم.", stat: "agi", amount: 1, mood: 4 },
        { text: "✍️ أتممت واجباً صعباً وأنت فخور بنفسك.", stat: "int", amount: 2, mood: 6 },
        { text: "👫 كوّنت صداقات جديدة في الفصل.", stat: "cha", amount: 1, mood: 5 },
        { text: "😤 تشاجرت مع زميل لكنكما تصالحتما.", stat: "cha", amount: 1, mood: -3 },
        { text: "🎨 شاركت في حصة الفنون وأبدعت لوحة جميلة.", stat: "cha", amount: 1, mood: 5 },
        { text: "📚 المعلم أشاد بذكائك أمام الفصل!", stat: "int", amount: 2, mood: 8 },
        { text: "😔 لم تفهم الدرس وشعرت بالإحباط.", stat: "int", amount: 0, mood: -5 },
    ];
    
    const event = this.randomPick(schoolEvents);
    this.addLogEntry(`🏫 ${event.text}`, 'normal');
    if (event.stat && event.amount > 0) this.modifyStat(event.stat, event.amount);
    if (event.mood) this.modifyMood(event.mood, null);
};

// ============ أحداث ما قبل المراهقة ============
GameEngine.prototype.triggerPreteenEvent = function() {
    const events = [
        { text: "بدأت تتعلم تقنيات قتال أساسية بنفسك.", stat: "str", amount: 2, mood: 5 },
        { text: "اكتشفت قدرة خفية أثناء اللعب.", stat: "int", amount: 2, mood: 8 },
        { text: "تسللت لاستكشاف أطراف الغابة القريبة.", stat: "agi", amount: 2, mood: 6 },
        { text: "ساعدت شخصاً غريباً وقدم لك نصيحة حكيمة.", stat: "cha", amount: 2, mood: 4 },
        { text: "وجدت سيفاً قديماً مكسوراً وبدأت تتدرب به.", stat: "str", amount: 2, mood: 5 },
        { text: "قرأت كتاباً عن السحر القديم بشغف.", stat: "int", amount: 3, mood: 6 },
    ];
    
    const event = this.randomPick(events);
    this.addLogEntry(`⭐ ${event.text}`, 'special');
    this.modifyStat(event.stat, event.amount);
    this.modifyMood(event.mood, null);
};

// ============ أحداث الناضج ============
GameEngine.prototype.triggerMatureEvent = function() {
    const events = [
        { text: "مغامر شاب جاء يطلب حكمتك ونصائحك.", stat: "cha", amount: 3, mood: 8 },
        { text: "دُعيت لتحكيم نزاع بين قريتين.", stat: "cha", amount: 4, mood: 5 },
        { text: "كتبت فصلاً في مذكراتك عن مغامراتك.", stat: "int", amount: 2, mood: 6 },
        { text: "تدربت على تقنية متقدمة كنت تؤجلها.", stat: "str", amount: 3, mood: 4 },
        { text: "اكتشفت أن سمعتك وصلت حتى القارات البعيدة!", stat: "cha", amount: 3, mood: 10 },
        { text: "عدت لزيارة قريتك الأصلية بعد سنوات.", stat: "cha", amount: 2, mood: 8 },
    ];
    
    const event = this.randomPick(events);
    this.addLogEntry(`📖 ${event.text}`, 'normal');
    this.modifyStat(event.stat, event.amount);
    this.modifyMood(event.mood, null);
};

// ============ أحداث الشيخوخة ============
GameEngine.prototype.triggerElderEvent = function() {
    const events = [
        { text: "جلست على التلة تتأمل غروب الشمس وتتذكر رحلتك.", mood: 5 },
        { text: "جيل جديد من الأبطال يطلب بركتك قبل رحلتهم.", stat: "cha", amount: 2, mood: 8 },
        { text: "شعرت بالتعب أكثر من المعتاد اليوم.", mood: -5 },
        { text: "تلقيت رسالة من صديق قديم يتذكر مغامراتكم.", mood: 10 },
        { text: "قصصك عن الماضي تلهم أطفال القرية.", stat: "cha", amount: 1, mood: 6 },
        { text: "زرت قبر رفيق قديم ووضعت زهوراً.", mood: -8 },
    ];
    
    const event = this.randomPick(events);
    this.addLogEntry(`🌅 ${event.text}`, 'normal');
    if (event.stat) this.modifyStat(event.stat, event.amount);
    this.modifyMood(event.mood, null);
};

// ============ تلميحات رومانسية ============
GameEngine.prototype.triggerRomanceHint = function() {
    if (this.state.relationships.length === 0) return;
    const rel = this.randomPick(this.state.relationships);
    
    const hints = [
        `قضيت وقتاً ممتعاً مع ${rel.name}. هل هناك شيء أكثر من الصداقة؟`,
        `لاحظت أن ${rel.name} يبتسم كلما رآك.`,
        `${rel.name} أحضر لك هدية صغيرة بشكل مفاجئ.`,
        `قلبك ينبض بسرعة عندما تقترب من ${rel.name}...`,
    ];
    
    this.addLogEntry(`💕 ${this.randomPick(hints)}`, 'romance');
    rel.affection = Math.min(100, rel.affection + this.randomInt(3, 8));
    this.modifyMood(5, null);
};

// ============ حدث الطفولة ============
GameEngine.prototype.triggerChildhoodEvent = function(parent) {
    if (!parent) return;
    
    const event = this.randomPick(DATA.childhoodEvents);
    const text = event.text.replace('{parent}', `${parent.relation.toLowerCase()} ${parent.firstName}`);
    
    this.addLogEntry(`👨‍👧 ${text}`, 'normal');
    this.modifyStat(event.stat, event.amount);
    this.modifyMood(3, null);
};

// ============ حدث الإخوة ============
GameEngine.prototype.triggerSiblingEvent = function() {
    if (!this.state.siblings || this.state.siblings.length === 0) return;
    
    const sibling = this.randomPick(this.state.siblings);
    if (!sibling.alive) return;
    
    const event = this.randomPick(DATA.siblingEvents);
    const text = event.text.replace('{sibling}', `${sibling.relation} ${sibling.name}`);
    
    this.addLogEntry(`👫 ${text}`, 'normal');
    this.modifyStat(event.stat, event.amount);
    this.modifyMood(this.randomInt(-2, 5), null);
};

// ============ اختيار التدريب ============
GameEngine.prototype.triggerTrainingChoice = function() {
    const panel = document.getElementById('action-panel');
    panel.innerHTML = `
        <div class="section-header">⚔️ اختر تخصص تدريبك</div>
        <button class="choice-btn" onclick="game.selectTraining('str')">💪 تدريب القوة</button>
        <button class="choice-btn" onclick="game.selectTraining('int')">🧠 دراسة السحر</button>
        <button class="choice-btn" onclick="game.selectTraining('agi')">🏃 تدريب السرعة</button>
        <button class="choice-btn" onclick="game.selectTraining('balanced')">⚖️ تدريب متوازن</button>
    `;
};

GameEngine.prototype.selectTraining = function(type) {
    switch(type) {
        case 'str':
            this.modifyStat('str', 5);
            this.addLogEntry("💪 ركزت على بناء قوتك البدنية!", 'positive');
            break;
        case 'int':
            this.modifyStat('int', 5);
            this.addLogEntry("🧠 غصت عميقاً في دراسة السحر!", 'positive');
            break;
        case 'agi':
            this.modifyStat('agi', 5);
            this.addLogEntry("🏃 تدربت على السرعة والرشاقة!", 'positive');
            break;
        case 'balanced':
            this.modifyStat('str', 2);
            this.modifyStat('int', 2);
            this.modifyStat('agi', 2);
            this.addLogEntry("⚖️ طورت كل قدراتك بالتساوي!", 'positive');
            break;
    }
    this.showAgeActions();
};

// ============ لقاء أعضاء الفريق ============
GameEngine.prototype.meetRandomPartyMember = function() {
    const memberType = this.randomPick(DATA.partyMemberTypes);
    const gender = this.randomPick(['male', 'female']);
    const nameData = this.generateRandomName(gender);
    const personality = this.randomPick(DATA.partyMemberPersonalities);
    const genderIcon = gender === 'male' ? '♂' : '♀';
    const genderLabel = gender === 'male' ? 'رجل' : 'امرأة';
    
    const member = {
        name: nameData.firstName,
        fullName: nameData.fullName,
        type: memberType.type,
        icon: memberType.icon,
        typeName: memberType.nameAr,
        gender: gender,
        genderIcon: genderIcon,
        personality: personality,
        affection: 20 + this.randomInt(0, 30),
        level: Math.max(1, this.state.level + this.randomInt(-3, 3)),
        active: true,
        metAge: this.state.age
    };
    
    this.state.relationships.push(member);
    this.addLogEntry(`💫 قابلت ${member.icon} ${member.name} (${genderLabel}) الـ${member.typeName} ${member.personality}!`, 'romance');
    this.modifyMood(6, null);
    
    if (this.state.relationships.length >= 5 && !this.state.achievements.includes('harem')) {
        const highAffection = this.state.relationships.filter(r => r.affection >= 80 && r.active !== false).length;
        if (highAffection >= 5) {
            this.unlockAchievement('harem');
        }
    }
};

// ============ نظام المعارك ============
GameEngine.prototype.triggerBattle = function(tier) {
    const monster = this.randomPick(DATA.monsters[tier]);
    const playerPower = this.state.str + this.state.agi + Math.floor(this.state.lck / 2);
    const monsterPower = tier === 'weak' ? this.randomInt(10, 30) : 
                         tier === 'medium' ? this.randomInt(30, 60) :
                         tier === 'strong' ? this.randomInt(60, 100) : this.randomInt(100, 150);
    
    const winChance = Math.min(90, Math.max(10, 50 + (playerPower - monsterPower)));
    
    if (this.chance(winChance)) {
        const goldReward = this.randomInt(10, 50) * (tier === 'weak' ? 1 : tier === 'medium' ? 3 : tier === 'strong' ? 10 : 50);
        const expReward = this.randomInt(20, 50) * (tier === 'weak' ? 1 : tier === 'medium' ? 2 : tier === 'strong' ? 5 : 20);
        
        this.state.gold += goldReward;
        this.gainExp(expReward);
        
        this.addLogEntry(`⚔️ هزمت ${monster}! +${goldReward} ذهب`, 'positive');
        this.modifyMood(8, null);
        
        if (!this.state.achievements.includes('first_blood')) {
            this.unlockAchievement('first_blood');
        }
        
        if (this.chance(30)) {
            this.giveRandomItem(tier);
        }
    } else {
        const damage = this.randomInt(10, 30);
        this.state.hp = Math.max(1, this.state.hp - damage);
        this.addLogEntry(`💥 ${monster} ضربك بـ${damage} ضرر!`, 'negative');
        this.modifyMood(-8, null);
        
        if (this.state.hp <= 10 && this.chance(20)) {
            this.addLogEntry("💀 إصاباتك شديدة جداً...", 'negative');
            this.triggerDeath('young');
        }
    }
    this.updateAllUI();
};

// ============ حدث سيد الشياطين ============
GameEngine.prototype.triggerDemonLordEvent = function() {
    const panel = document.getElementById('action-panel');
    this.pendingChoice = {
        html: `
            <div class="section-header">😈 مواجهة سيد الشياطين!</div>
            <div class="log-entry battle">
                سيد الشياطين قد ظهر!<br>
                قوتك: ${this.state.str + this.state.int}<br>
                هذه هي اللحظة التي وُلدت من أجلها!
            </div>
            <button class="choice-btn" onclick="game.fightDemonLord()">⚔️ قاتل سيد الشياطين!</button>
            <button class="choice-btn" onclick="game.retreatFromDemonLord()">🏃 تراجع وتدرب أكثر</button>
        `
    };
    this.showAgeActions();
};

GameEngine.prototype.fightDemonLord = function() {
    const power = this.state.str + this.state.int + this.state.agi + this.state.lck;
    const required = 150;
    
    if (power >= required || this.chance(power / 3)) {
        this.addLogEntry("👑 هزمت سيد الشياطين! أنت بطل العالم!", 'special');
        this.state.guildRank = 8;
        this.modifyFame(1000);
        this.gainExp(10000);
        this.state.gold += 100000;
        this.unlockAchievement('demon_lord');
        this.modifyMood(30, "أنت بطل العالم!");
    } else {
        this.addLogEntry("💀 سيد الشياطين كان قوياً جداً...", 'negative');
        if (this.chance(50)) {
            this.addLogEntry("✨ لكن رفاقك أنقذوك في اللحظة الأخيرة!", 'positive');
            this.state.hp = 1;
        } else {
            this.triggerDeath('adult');
        }
    }
    this.pendingChoice = null;
    this.showAgeActions();
};

GameEngine.prototype.retreatFromDemonLord = function() {
    this.addLogEntry("🏃 قررت التراجع لتصبح أقوى.", 'normal');
    this.modifyStat('str', 5);
    this.modifyStat('int', 5);
    this.pendingChoice = null;
    this.showAgeActions();
};

// ============ فحص الموت ============
GameEngine.prototype.checkDeath = function() {
    const age = this.state.age;
    let deathChance = 0;
    
    if (age < 5) deathChance = 2;
    else if (age < 18) deathChance = 1;
    else if (age < 40) deathChance = 2;
    else if (age < 60) deathChance = 5;
    else if (age < 80) deathChance = 15;
    else deathChance = 30;
    
    deathChance = Math.max(0, deathChance - Math.floor(this.state.lck / 10));
    
    if (this.chance(deathChance)) {
        const ageCategory = age < 5 ? 'child' : age < 25 ? 'young' : age < 50 ? 'adult' : 'old';
        this.triggerDeath(ageCategory);
    }
};

GameEngine.prototype.triggerDeath = function(ageCategory) {
    this.state.isDead = true;
    const deathCause = this.randomPick(DATA.deathCauses[ageCategory]);
    this.addLogEntry(`💀 ${deathCause.text}`, 'negative');
    
    setTimeout(() => {
        this.showDeathScreen(deathCause);
    }, 2000);
};

// ============ نظام الإنجازات ============
GameEngine.prototype.unlockAchievement = function(id) {
    if (this.state.achievements.includes(id)) return;
    
    this.state.achievements.push(id);
    const ach = DATA.achievements[id];
    this.showNotification(`🏆 إنجاز: ${ach.name}!`, 'success');
    this.addLogEntry(`🏆 فتحت إنجاز: ${ach.icon} ${ach.name}!`, 'special');
};

// ============ نظام المخزون ============
GameEngine.prototype.giveRandomItem = function(tier) {
    const itemPool = tier === 'weak' ? ['health_potion', 'rusty_sword', 'leather_armor'] :
                     tier === 'medium' ? ['health_potion', 'mana_potion', 'iron_sword', 'lucky_coin'] :
                     ['strength_elixir', 'magic_staff', 'speed_boots', 'holy_sword'];
    
    const itemId = this.randomPick(itemPool);
    const item = DATA.items[itemId];
    
    // Check if we already have this item
    const existing = this.state.inventory.find(inv => inv.itemId === itemId);
    if (existing) {
        existing.quantity++;
    } else {
        this.state.inventory.push({ itemId: itemId, quantity: 1 });
    }
    this.addLogEntry(`📦 حصلت على ${item.icon} ${item.name}!`, 'positive');
};

GameEngine.prototype.showInventory = function() {
    const panel = document.getElementById('action-panel');
    
    // الأطفال لا يملكون مخزون
    if (this.state.age < 10) {
        panel.innerHTML = `
            <div class="section-header">🎒 المخزون</div>
            <div class="empty-state">
                <p>👶 أنت لا تزال طفلاً!</p>
                <p style="margin-top: 8px; font-size: 0.85rem;">ستحصل على حقيبة المغامر عندما تبلغ 10 سنوات وتنضم للنقابة.</p>
            </div>
        `;
        return;
    }
    
    if (this.state.inventory.length === 0) {
        panel.innerHTML = `
            <div class="section-header">🎒 المخزون</div>
            <div class="empty-state">حقيبتك فارغة!</div>
        `;
        return;
    }
    
    let html = '<div class="section-header">🎒 المخزون</div>';
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
            this.showNotification("❤️ تم استعادة الصحة!", "success");
        } else if (inv.itemId === 'mana_potion') {
            this.state.mp = this.state.maxMp;
            this.showNotification("💙 تم استعادة المانا!", "success");
        } else if (item.effect) {
            if (item.effect.str) this.modifyStat('str', item.effect.str);
            if (item.effect.int) this.modifyStat('int', item.effect.int);
            if (item.effect.agi) this.modifyStat('agi', item.effect.agi);
            if (item.effect.cha) this.modifyStat('cha', item.effect.cha);
            if (item.effect.lck) this.modifyStat('lck', item.effect.lck);
        }
        
        inv.quantity--;
        if (inv.quantity <= 0) {
            this.state.inventory.splice(index, 1);
        }
        this.updateAllUI();
        this.showInventory();
    } else {
        // عرض معلومات المعدات
        let statText = Object.entries(item.effect).map(([k,v]) => `+${v} ${k.toUpperCase()}`).join('، ');
        this.showNotification(`${item.icon} ${item.name}: ${statText}`, "info");
    }
};

// ============ نظام المهارات ============
GameEngine.prototype.showSkills = function() {
    const panel = document.getElementById('action-panel');
    const skills = this.state.skills;
    
    if (Object.keys(skills).length === 0) {
        panel.innerHTML = `
            <div class="section-header">✨ المهارات</div>
            <div class="empty-state">لم تتعلم أي مهارات بعد. تدرب أكثر!</div>
        `;
        return;
    }

    let html = '<div class="section-header">✨ المهارات</div>';
    Object.entries(skills).forEach(([id, level]) => {
        const skill = DATA.skills[id];
        if (!skill) return;
        html += `
            <div class="skill-entry">
                <span class="skill-icon">${skill.icon}</span>
                <div class="skill-info">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-level">مستوى ${level}/${skill.maxLevel}</div>
                    <div class="skill-desc">${skill.desc}</div>
                </div>
            </div>
        `;
    });

    // عرض المهارات المتاحة للتعلم
    const learnable = Object.entries(DATA.skills).filter(([id, skill]) => {
        if (skills[id]) return false;
        return Object.entries(skill.requirement).every(([stat, val]) => this.state[stat] >= val);
    });

    if (learnable.length > 0) {
        html += '<div class="section-header" style="margin-top:16px">📚 متاح للتعلم</div>';
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
    this.addLogEntry(`✨ تعلمت: ${skill.icon} ${skill.name}!`, 'special');
    this.showNotification(`✨ مهارة جديدة: ${skill.name}!`, 'special');
    
    if (Object.keys(this.state.skills).length >= 10) {
        this.unlockAchievement('all_skills');
    }
    this.showSkills();
};

// ============ العلاقات ============
GameEngine.prototype.showRelationships = function() {
    const panel = document.getElementById('action-panel');
    
    const activeRels = this.state.relationships.filter(r => r.active !== false);
    const departedRels = this.state.relationships.filter(r => r.active === false);
    
    if (activeRels.length === 0 && departedRels.length === 0) {
        panel.innerHTML = `
            <div class="section-header">💕 أعضاء الفريق</div>
            <div class="empty-state">ليس لديك رفاق بعد. استمر في الاستكشاف للقاء أشخاص!</div>
        `;
        return;
    }
    
    let html = '<div class="section-header">💕 أعضاء الفريق</div>';
    
    activeRels.forEach((rel, i) => {
        const realIndex = this.state.relationships.indexOf(rel);
        const genderIcon = rel.gender === 'male' ? '♂' : '♀';
        html += `
            <div class="relationship-card" onclick="game.interactWith(${realIndex})">
                <span class="rel-avatar">${rel.icon}</span>
                <div class="rel-info">
                    <div class="rel-name">${genderIcon} ${rel.name} الـ${rel.typeName}</div>
                    <div class="rel-type">${rel.gender === 'male' ? 'رجل' : 'امرأة'} • ${rel.personality} • مستوى ${rel.level}</div>
                </div>
                <div class="affection-bar">
                    <div class="affection-fill" style="width: ${rel.affection}%"></div>
                </div>
            </div>
        `;
    });
    
    if (departedRels.length > 0) {
        html += '<div class="section-header" style="margin-top:12px;font-size:0.9rem;opacity:0.6;">👋 رفاق سابقون</div>';
        departedRels.forEach(rel => {
            const genderIcon = rel.gender === 'male' ? '♂' : '♀';
            html += `
                <div class="relationship-card" style="opacity: 0.4; pointer-events: none;">
                    <span class="rel-avatar">${rel.icon}</span>
                    <div class="rel-info">
                        <div class="rel-name">${genderIcon} ${rel.name} الـ${rel.typeName}</div>
                        <div class="rel-type">${rel.departReason || 'غادر الفريق'}</div>
                    </div>
                </div>
            `;
        });
    }
    
    panel.innerHTML = html;
};

GameEngine.prototype.interactWith = function(index) {
    const rel = this.state.relationships[index];
    if (!rel || rel.active === false) return;
    
    const genderIcon = rel.gender === 'male' ? '♂' : '♀';
    const genderLabel = rel.gender === 'male' ? 'رجل' : 'امرأة';
    
    const panel = document.getElementById('action-panel');
    panel.innerHTML = `
        <div class="section-header">${rel.icon} ${genderIcon} ${rel.name}</div>
        <div class="log-entry normal">
            <p><strong>${rel.fullName}</strong></p>
            <p>الجنس: ${genderLabel} ${genderIcon}</p>
            <p>فئة: ${rel.typeName} ${rel.personality}</p>
            <p>المستوى: ${rel.level}</p>
            <p>المودة: ${rel.affection}%</p>
        </div>
        <button class="choice-btn" onclick="game.talkTo(${index})">💬 تحدث</button>
        <button class="choice-btn" onclick="game.giftTo(${index})">🎁 أعطِ هدية</button>
        <button class="choice-btn" onclick="game.trainWith(${index})">⚔️ تدرب معاً</button>
        ${rel.affection >= 80 && !this.state.married ? `<button class="choice-btn" onclick="game.proposeTo(${index})">💒 اقترح الزواج</button>` : ''}
        <button class="choice-btn" onclick="game.showRelationships()">← رجوع</button>
    `;
};

GameEngine.prototype.talkTo = function(index) {
    const rel = this.state.relationships[index];
    rel.affection = Math.min(100, rel.affection + this.randomInt(1, 5));
    this.addLogEntry(`💬 قضيت وقتاً جيداً تتحدث مع ${rel.name}.`, 'romance');
    this.interactWith(index);
};

GameEngine.prototype.giftTo = function(index) {
    if (this.state.gold < 100) {
        this.showNotification('ليس لديك ذهب كافٍ!', 'danger');
        return;
    }
    const rel = this.state.relationships[index];
    this.state.gold -= 100;
    rel.affection = Math.min(100, rel.affection + this.randomInt(5, 15));
    this.addLogEntry(`🎁 أعطيت هدية لـ${rel.name}. بدا سعيداً جداً!`, 'romance');
    this.updateAllUI();
    this.interactWith(index);
};

GameEngine.prototype.trainWith = function(index) {
    const rel = this.state.relationships[index];
    rel.affection = Math.min(100, rel.affection + this.randomInt(2, 8));
    this.modifyStat('str', 1);
    this.addLogEntry(`⚔️ تدربت مع ${rel.name}. كلاكما أصبح أقوى!`, 'positive');
    this.interactWith(index);
};

GameEngine.prototype.proposeTo = function(index) {
    const rel = this.state.relationships[index];
    if (this.chance(rel.affection)) {
        this.state.married = true;
        this.state.marriedTo = rel.name;
        this.state.marriedToData = {
            name: rel.name,
            fullName: rel.fullName,
            gender: rel.gender,
            typeName: rel.typeName,
            personality: rel.personality,
            icon: rel.icon,
            affection: 100
        };
        rel.affection = 100;
        const spouseTitle = rel.gender === 'male' ? 'زوجك' : 'زوجتك';
        this.addLogEntry(`💒 تزوجت ${rel.name}! ${spouseTitle} الآن جزء من عائلتك. أقيم حفل جميل في ${this.getLocationName(this.state.currentLocation)}.`, 'romance');
        this.modifyStat('cha', 5);
        this.modifyFame(30);
        this.modifyMood(25, "أسعد يوم في حياتك!");
    } else {
        rel.affection -= 10;
        this.addLogEntry(`💔 ${rel.name} لم يكن مستعداً بعد...`, 'negative');
        this.modifyMood(-12, "الرفض يؤلم...");
    }
    this.interactWith(index);
};

// ============ أحداث عشوائية (تُستدعى من أحداث المراحل) ============
GameEngine.prototype.triggerRandomEvents = function() {
    if (this.chance(40)) {
        const event = this.randomPick(DATA.adultEvents);
        this.addLogEntry(`✨ ${event.text}`, 'special');
        this.modifyStat(event.stat, event.amount);
    }
    
    if (this.state.age >= 15 && this.chance(30)) {
        this.triggerRandomEncounter();
    }
};

GameEngine.prototype.triggerRandomEncounter = function() {
    const locName = this.getLocationName(this.state.currentLocation);
    const events = [
        () => {
            this.addLogEntry(`⚔️ أثناء استكشاف محيط ${locName}، صادفت وحشاً!`, 'battle');
            this.triggerBattle('weak');
        },
        () => {
            this.addLogEntry(`⚔️ وحش قوي يجوب طرق ${locName}!`, 'battle');
            this.triggerBattle('medium');
        },
        () => {
            const gold = this.randomInt(50, 200);
            this.state.gold += gold;
            this.addLogEntry(`💰 وجدت كنزاً مخفياً بالقرب من ${locName}! +${gold} ذهب`, 'positive');
        },
        () => {
            this.addLogEntry(`🔮 تاجر غامض في سوق ${locName} باعك جرعة غريبة...`, 'normal');
            if (this.chance(70)) {
                this.modifyStat(this.randomPick(['str', 'int', 'agi', 'cha', 'lck']), 3);
                this.addLogEntry("✨ شعرت بقوة تتدفق في جسدك!", 'positive');
            } else {
                this.addLogEntry("🤢 ليس لها أي تأثير... ربما خُدعت.", 'negative');
            }
        },
        () => {
            this.addLogEntry(`🐾 وجدت مخلوقاً سحرياً مصاباً بالقرب من ${locName} ورعيته حتى شفي!`, 'positive');
            this.modifyStat('cha', 2);
            this.modifyStat('lck', 1);
        },
        () => {
            const tier = this.chance(30) ? 'medium' : 'weak';
            this.addLogEntry(`⚠️ تعرضت لكمين على طرق ${locName}!`, 'battle');
            this.triggerBattle(tier);
        },
        () => {
            this.addLogEntry(`🏛️ اكتشفت أطلالاً قديمة مخفية بالقرب من ${locName}!`, 'quest');
            this.gainExp(this.randomInt(30, 80));
            this.modifyStat('int', 1);
        },
    ];

    this.randomPick(events)();
};

// ============ فحص الإنجازات ============
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
    if (this.state.guildRank >= 8 && !this.state.achievements.includes('guild_master')) {
        this.unlockAchievement('guild_master');
    }
    
    const maxedStat = ['str', 'int', 'agi', 'cha', 'lck'].some(s => this.state[s] >= 100);
    if (maxedStat && !this.state.achievements.includes('max_stat')) {
        this.unlockAchievement('max_stat');
    }
};

// ============ تحديث العائلة ============
GameEngine.prototype.updateFamily = function() {
    const father = this.state.parents.father;
    const mother = this.state.parents.mother;
    
    if (father.alive) father.age++;
    if (mother.alive) mother.age++;
    
    if (father.alive && father.age > 60 && this.chance(father.age - 55)) {
        father.alive = false;
        this.addLogEntry(`😢 والدك ${father.firstName} توفى...`, 'negative');
        this.modifyStat('cha', -1);
        this.modifyMood(-20, "فقدان والدك يمزق قلبك...");
    }
    
    if (mother.alive && mother.age > 60 && this.chance(mother.age - 55)) {
        mother.alive = false;
        this.addLogEntry(`😢 والدتك ${mother.firstName} توفت...`, 'negative');
        this.modifyStat('cha', -1);
        this.modifyMood(-20, "فقدان والدتك يمزق قلبك...");
    }
    
    if (this.state.siblings) {
        this.state.siblings.forEach(sib => {
            const siblingActualAge = this.state.age + sib.age;
            if (sib.alive && siblingActualAge > 50 && this.chance((siblingActualAge - 50) * 0.5)) {
                sib.alive = false;
                this.addLogEntry(`😢 ${sib.relation} ${sib.name} توفى/ت...`, 'negative');
                this.modifyStat('cha', -1);
                this.modifyMood(-15, `فقدان ${sib.name} أحزنك كثيراً...`);
            }
        });
    }
};
