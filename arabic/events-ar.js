/* ============================================
   IsekaiLife - نظام الأحداث
   جميع الأحداث المبنية على العمر والأحداث العشوائية والإجراءات
   ============================================ */

GameEngine.prototype.showAgeActions = function() {
    const panel = document.getElementById('action-panel');
    const log = document.getElementById('log-entries');

    // تحقق من الموت
    if (this.state.isDead) {
        return;
    }

    let html = '';
    
    // إذا كان هناك خيار معلق
    if (this.pendingChoice) {
        const choice = this.pendingChoice;
        this.pendingChoice = null;
        panel.innerHTML = typeof choice === 'string' ? choice : choice.html || choice;
        return;
    }

    // عرض حالة الطفل إذا كان أقل من 10
    if (this.state.age < 10 && this.state.isChild) {
        const father = this.state.parents?.father;
        const mother = this.state.parents?.mother;
        html += `<div class="log-entry normal" style="margin-bottom: 10px;">
            <small>👶 أنت طفل يربيه والداك.</small><br>
            ${father && father.alive ? `<small>👨 ${father.firstName} ${father.lastName} (${father.relation}، عمره ${father.age})</small><br>` : ''}
            ${mother && mother.alive ? `<small>👩 ${mother.firstName} ${mother.lastName} (${mother.relation}، عمرها ${mother.age})</small>` : ''}
        </div>`;
    }

    // عرض أيقونة المزاج في زر التقدم بالعمر
    const moodIcon = this.getMoodIcon();
    html += `<button class="age-up-btn" onclick="game.ageUp()">${moodIcon} ⏩ تقدم بالعمر (العمر الحالي: ${this.state.age})</button>`;
    panel.innerHTML = html;
};

// ============ نظام التقدم بالعمر (تقدم قصة منظم) ============
GameEngine.prototype.ageUp = function() {
    if (this.state.isDead) return;
    
    this.state.age++;
    this.state.worldYear++;

    // تجديد ص.ح/ط.س
    this.state.hp = this.state.maxHp;
    this.state.mp = this.state.maxMp;

    // تحديث مرحلة القصة
    this.state.storyPhase = this.getStoryPhase();

    // تحديث حالة الطفل
    if (this.state.age >= 10) {
        this.state.isChild = false;
    }

    // تقدم عمر الوالدين وأحداثهم
    this.parentEvent();

    // التحقق من الموت
    if (this.checkForDeath()) {
        this.updateAllUI();
        return;
    }

    // تشغيل الأحداث بالتسلسل
    this.triggerMoodEvent();
    this.triggerMilestoneEvents();
    this.triggerPhaseEvents();
    this.naturalMoodDrift();
    this.checkMoodEffects();

    // فحص الإنجازات
    if (this.state.age >= 50) this.unlockAchievement('isekai_veteran');

    this.updateAllUI();
    this.showAgeActions();
};

// ============ الانجراف الطبيعي للمزاج ============
GameEngine.prototype.naturalMoodDrift = function() {
    // المزاج ينجرف طبيعياً نحو 50 (محايد)
    if (this.state.mood > 55) {
        this.state.mood -= this.randomInt(1, 3);
    } else if (this.state.mood < 45) {
        this.state.mood += this.randomInt(1, 3);
    }
    
    // العائلة الحية تساعد في استقرار المزاج
    const fatherAlive = this.state.parents?.father?.alive;
    const motherAlive = this.state.parents?.mother?.alive;
    if (fatherAlive || motherAlive) {
        if (this.state.mood < 40) this.state.mood += 2;
    }
    
    // الأطفال اليتامى يعانون
    if (!fatherAlive && !motherAlive && this.state.age < 18) {
        this.state.mood -= 2;
    }
    
    this.state.mood = Math.max(0, Math.min(100, this.state.mood));
    this.updateMoodState();
};

// ============ تأثيرات المزاج ============
GameEngine.prototype.checkMoodEffects = function() {
    const mood = this.state.moodState;
    
    // اكتئاب/غضب - أحداث خاصة
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
        this.addLogEntry("✨ حماسك المتقد يلهم من حولك!", 'special');
        this.modifyStat('cha', 1);
        this.modifyFame(2);
    }
};

// ============ أحداث المزاج ============
GameEngine.prototype.triggerMoodEvent = function() {
    const phase = this.state.storyPhase;
    const moodEvents = DATA.moodEvents[phase];
    if (!moodEvents || moodEvents.length === 0) return;
    
    // 50% فرصة لحدث مزاج كل سنة
    if (!this.chance(50)) return;
    
    const event = this.randomPick(moodEvents);
    this.modifyMood(event.mood, event.text);
};

// ============ أحداث المعالم (مرة واحدة لكل حياة) ============
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
        this.addLogEntry("👶 وُلدت في هذا العالم الجديد. كل شيء مشرق وسحري. تشعر بالمانا تتدفق في هذا العالم.", "special");
        if (parentAlive) {
            this.addLogEntry(`🏠 يربيك ${father?.alive && mother?.alive ? `${father.firstName} و ${mother.firstName}` : randomParent?.firstName} في ${this.getLocationName(0)}.`, "normal");
        }
        this.modifyMood(10, null);
    }
    
    if (age === 2 && !milestones.includes('first_words')) {
        milestones.push('first_words');
        this.addLogEntry("🗣️ نطقت بأولى كلماتك. والداك مذهولان بسرعة نموك.", "normal");
        this.modifyMood(8, null);
        if (s.int > 15) {
            this.addLogEntry("🧒 بفضل ذكريات حياتك السابقة، تستطيع القراءة بالفعل! الناس يسمونك عبقرياً.", "special");
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
            this.addLogEntry("💥 انفجار من السحر خرج من يديك! الجيران مذهولون!", "special");
            this.modifyStat('int', 3);
            this.modifyMood(12, null);
        } else {
            this.addLogEntry("💫 شرارة صغيرة ومضت. إنها البداية!", "normal");
        }
    }
    
    if (age === 5 && !milestones.includes('learning')) {
        milestones.push('learning');
        this.addLogEntry("📚 بدأت تتعلم القراءة والكتابة بشكل صحيح.", "normal");
        this.modifyStat('int', 1);
        this.modifyMood(5, null);
    }
    
    // ============ مرحلة الطفولة (6-9) ============
    if (age === 6 && !milestones.includes('school_start')) {
        milestones.push('school_start');
        this.addLogEntry("🏫 بدأت الدراسة في مدرسة القرية!", "special");
        s.inSchool = true;
        this.modifyStat('int', 2);
        this.modifyMood(8, "أول يوم في المدرسة مثير!");
    }
    
    // ============ مرحلة ما قبل المراهقة (10-12) ============
    if (age === 10 && !milestones.includes('no_longer_child')) {
        milestones.push('no_longer_child');
        this.addLogEntry("🎂 بلغت العاشرة! في هذا العالم، هذا يعني أنك تستطيع التسجيل كمغامر!", "special");
        s.isChild = false;
        s.hasGuild = true;
        s.guildRank = 0;
        this.addLogEntry("🏛️ سجلت في نقابة المغامرين! أنت الآن مغامر رتبة F!", "quest");
        
        // منح عناصر البداية
        s.inventory.push({ itemId: 'rusty_sword', quantity: 1 });
        s.inventory.push({ itemId: 'health_potion', quantity: 3 });
        s.gold = 50;
        this.addLogEntry("🎁 أعطتك النقابة مجموعة بداية: سيف صدئ، 3 جرعات صحة، و 50 ذهب!", "positive");
        
        this.modifyStat('str', 2);
        this.modifyStat('int', 2);
        this.modifyFame(10);
        this.modifyMood(10, "تشعر بقوة النمو!");
        
        // لقاء أول عضو فريق
        this.meetRandomPartyMember();
    }
    
    if (age === 12 && !milestones.includes('combat_training')) {
        milestones.push('combat_training');
        this.addLogEntry("⚔️ تدريب القتال الحقيقي يبدأ!", "special");
        this.triggerTrainingChoice();
    }
    
    // ============ مرحلة المراهقة (13-17) ============
    if (age === 13 && !milestones.includes('cheat_boost')) {
        milestones.push('cheat_boost');
        this.addLogEntry("⚡ مهارتك الخارقة تستيقظ أكثر!", "special");
        this.boostCheatSkill();
        this.gainExp(80);
    }
    
    if (age === 15 && !milestones.includes('guild_join')) {
        milestones.push('guild_join');
        this.addLogEntry("🏛️ تمت ترقيتك إلى مغامر رتبة E!", "quest");
        s.guildRank = Math.max(s.guildRank, 1);
        this.modifyFame(20);
        this.modifyMood(15, "ترقية في النقابة — حلم أصبح حقيقة!");
    }
    
    // ============ مرحلة الشباب (18-24) ============
    if (age === 18 && !milestones.includes('adult')) {
        milestones.push('adult');
        this.addLogEntry("🎓 بلغت سن الرشد! أنت الآن مغامر كامل.", "special");
        s.inSchool = false;
        this.modifyStat('str', 3);
        this.modifyStat('int', 3);
        this.addLogEntry("🏛️ ترقية إلى رتبة D!", "quest");
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
        this.addLogEntry("⚔️ قوات ملك الشياطين شنت هجوماً كبيراً على الممالك الجنوبية!", "battle");
        this.triggerBattle('strong');
        this.modifyMood(-8, "الحرب على الأبواب...");
    }
    
    if (age === 30 && !milestones.includes('demon_lord')) {
        milestones.push('demon_lord');
        this.triggerDemonLordEvent();
    }
};

// ============ أحداث المرحلة (متكررة لكل مرحلة) ============
GameEngine.prototype.triggerPhaseEvents = function() {
    const phase = this.state.storyPhase;
    const age = this.state.age;
    const s = this.state;
    const father = s.parents?.father;
    const mother = s.parents?.mother;
    const parentAlive = (father && father.alive) || (mother && mother.alive);
    const randomParent = parentAlive ? (father && father.alive ? (mother && mother.alive ? this.randomPick([father, mother]) : father) : mother) : null;
    
    // تتبع سنوات الموقع
    s.locationYears++;
    
    // أحداث الموقع للبالغين
    if (age >= 15) {
        this.triggerLocationEvent();
    }
    
    // نظام مغادرة الأصدقاء
    if (age >= 18) {
        this.checkFriendDepartures();
    }
    
    // أحداث الزوج/الزوجة
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
    
    // أحداث عشوائية إضافية
    this.triggerRandomEvents();
    
    this.checkAchievements();
};

// ============ حدث الطفولة ============
GameEngine.prototype.triggerChildhoodEvent = function(parent) {
    if (!parent) return;
    
    const event = this.randomPick(DATA.childhoodEvents);
    const text = event.text.replace('{parent}', `${parent.relation} ${parent.firstName}`);
    
    this.addLogEntry(`👨‍👧 ${text}`, 'normal');
    this.modifyStat(event.stat, event.amount);
};

// ============ حدث الأشقاء ============
GameEngine.prototype.triggerSiblingEvent = function() {
    if (!this.state.siblings || this.state.siblings.length === 0) return;
    
    const aliveSiblings = this.state.siblings.filter(s => s.alive);
    if (aliveSiblings.length === 0) return;
    
    const sibling = this.randomPick(aliveSiblings);
    const event = this.randomPick(DATA.siblingEvents);
    const text = event.text.replace('{sibling}', `${sibling.relation} ${sibling.name}`);
    
    this.addLogEntry(`👫 ${text}`, 'normal');
    this.modifyStat(event.stat, event.amount);
    
    // زيادة مودة الأخ/الأخت
    sibling.affection = Math.min(100, sibling.affection + this.randomInt(1, 5));
};

// ============ حدث المراهقة ============
GameEngine.prototype.triggerTeenEvent = function() {
    const event = this.randomPick(DATA.teenEvents);
    this.addLogEntry(`🌟 ${event.text}`, 'special');
    this.modifyStat(event.stat, event.amount);
    this.gainExp(this.randomInt(20, 50));
};

// ============ حدث البالغين ============
GameEngine.prototype.triggerAdultEvent = function() {
    const event = this.randomPick(DATA.adultEvents);
    this.addLogEntry(`⭐ ${event.text}`, 'special');
    this.modifyStat(event.stat, event.amount);
    this.gainExp(this.randomInt(40, 100));
    this.modifyFame(this.randomInt(5, 20));
};

// ============ حدث المدرسة ============
GameEngine.prototype.triggerSchoolEvent = function() {
    const schoolEvents = [
        { text: "تعلمت درساً جديداً عن التاريخ القديم.", stat: "int", amount: 1, mood: 3 },
        { text: "أبليت حسناً في حصة التدريب البدني اليوم.", stat: "agi", amount: 1, mood: 4 },
        { text: "أكملت واجباً صعباً وتشعر بالفخر!", stat: "int", amount: 2, mood: 6 },
        { text: "كسبت أصدقاء جدد في الفصل.", stat: "cha", amount: 1, mood: 5 },
        { text: "تشاجرت مع زميل لكنكما تصالحتما.", stat: "cha", amount: 1, mood: -3 },
        { text: "شاركت في حصة الفنون وصنعت لوحة جميلة.", stat: "cha", amount: 1, mood: 5 },
        { text: "المعلم مدح ذكاءك أمام كل الفصل!", stat: "int", amount: 2, mood: 8 },
        { text: "لم تفهم الدرس وشعرت بالإحباط.", stat: "int", amount: 0, mood: -5 },
    ];
    
    const event = this.randomPick(schoolEvents);
    this.addLogEntry(`🏫 ${event.text}`, 'normal');
    if (event.stat && event.amount > 0) this.modifyStat(event.stat, event.amount);
    if (event.mood) this.modifyMood(event.mood, null);
};

// ============ حدث ما قبل المراهقة ============
GameEngine.prototype.triggerPreteenEvent = function() {
    const events = [
        { text: "بدأت تتعلم تقنيات القتال الأساسية بمفردك.", stat: "str", amount: 2, mood: 5 },
        { text: "اكتشفت قدرة خفية أثناء اللعب.", stat: "int", amount: 2, mood: 8 },
        { text: "تسللت لاستكشاف أطراف الغابة القريبة.", stat: "agi", amount: 2, mood: 6 },
        { text: "ساعدت غريباً أعطاك نصيحة حكيمة.", stat: "cha", amount: 2, mood: 4 },
        { text: "وجدت سيفاً مكسوراً قديماً وبدأت تتدرب به.", stat: "str", amount: 2, mood: 5 },
        { text: "قرأت بشغف كتاباً عن السحر القديم.", stat: "int", amount: 3, mood: 6 },
    ];
    
    const event = this.randomPick(events);
    this.addLogEntry(`⭐ ${event.text}`, 'special');
    this.modifyStat(event.stat, event.amount);
    this.modifyMood(event.mood, null);
};

// ============ حدث النضج ============
GameEngine.prototype.triggerMatureEvent = function() {
    const events = [
        { text: "مغامر شاب جاء يطلب حكمتك ونصيحتك.", stat: "cha", amount: 3, mood: 8 },
        { text: "دُعيت للتوسط في نزاع بين قريتين.", stat: "cha", amount: 4, mood: 5 },
        { text: "كتبت فصلاً في مذكراتك عن مغامراتك.", stat: "int", amount: 2, mood: 6 },
        { text: "تدربت على تقنية متقدمة كنت تؤجلها.", stat: "str", amount: 3, mood: 4 },
        { text: "اكتشفت أن سمعتك وصلت حتى القارات البعيدة!", stat: "cha", amount: 3, mood: 10 },
        { text: "عدت لزيارة قريتك الأصلية بعد سنوات طويلة.", stat: "cha", amount: 2, mood: 8 },
    ];
    
    const event = this.randomPick(events);
    this.addLogEntry(`📖 ${event.text}`, 'normal');
    this.modifyStat(event.stat, event.amount);
    this.modifyMood(event.mood, null);
};

// ============ حدث الشيخوخة ============
GameEngine.prototype.triggerElderEvent = function() {
    const events = [
        { text: "جلست على تل تشاهد الغروب، تتذكر رحلتك.", mood: 5 },
        { text: "جيل جديد من الأبطال يطلب بركتك قبل رحلتهم.", stat: "cha", amount: 2, mood: 8 },
        { text: "شعرت بتعب أكثر من المعتاد اليوم.", mood: -5 },
        { text: "وصلتك رسالة من صديق قديم يتذكر مغامراتكم.", mood: 10 },
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
    const playerGender = this.state.gender;
    const activeRels = this.state.relationships.filter(r => 
        r.active !== false &&
        ((playerGender === 'male' && r.gender === 'female') || (playerGender === 'female' && r.gender === 'male'))
    );
    if (activeRels.length === 0) return;
    const rel = this.randomPick(activeRels);
    
    const hints = [
        `قضيت وقتاً رائعاً مع ${rel.name}. هل يمكن أن يكون هناك أكثر من صداقة؟`,
        `لاحظت أن ${rel.name} يبتسم دائماً عندما يراك.`,
        `${rel.name} فاجأك بهدية صغيرة.`,
        `قلبك ينبض أسرع كلما كان ${rel.name} قريباً...`,
    ];
    
    this.addLogEntry(`💕 ${this.randomPick(hints)}`, 'romance');
    rel.affection = Math.min(100, rel.affection + this.randomInt(3, 8));
    this.modifyMood(5, null);
};

// ============ خيار التدريب (معلم عمر 12) ============
GameEngine.prototype.triggerTrainingChoice = function() {
    this.pendingChoice = `
        <div class="section-header">⚔️ اختر تخصص تدريبك</div>
        <button class="choice-btn" onclick="game.selectTraining('str')">💪 تدريب القوة</button>
        <button class="choice-btn" onclick="game.selectTraining('int')">🧠 دراسة السحر</button>
        <button class="choice-btn" onclick="game.selectTraining('agi')">🏃 تدريب السرعة</button>
        <button class="choice-btn" onclick="game.selectTraining('balanced')">⚖️ تدريب متوازن</button>
    `;
    this.showAgeActions();
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
            this.addLogEntry("🏃 دربت سرعتك ورشاقتك!", 'positive');
            break;
        case 'balanced':
            this.modifyStat('str', 2);
            this.modifyStat('int', 2);
            this.modifyStat('agi', 2);
            this.addLogEntry("⚖️ طورت كل قدراتك بالتساوي!", 'positive');
            break;
    }
    this.pendingChoice = null;
    this.showAgeActions();
};

// ============ أحداث الموقع ============
GameEngine.prototype.triggerLocationEvent = function() {
    const s = this.state;
    const locName = this.getLocationName(s.currentLocation);
    const years = s.locationYears;
    
    // أحداث مرتبطة بالاستقرار في موقع
    if (years === 1) {
        this.addLogEntry(`📍 بدأت استكشاف ${locName} والتعرف على أهلها.`, 'quest');
    } else if (years === 3 && this.chance(60)) {
        this.addLogEntry(`🏠 أصبحت معروفاً في ${locName}. الناس يحيونك في الشوارع.`, 'normal');
        this.modifyStat('cha', 1);
        this.modifyMood(5, null);
    } else if (years === 5 && this.chance(50)) {
        this.addLogEntry(`⭐ أصبحت شخصية مهمة في ${locName}!`, 'special');
        this.modifyStat('cha', 2);
        this.modifyFame(10);
    } else if (years >= 3 && this.chance(15)) {
        const locEvents = [
            `🎪 مهرجان سنوي أُقيم في ${locName}! استمتعت بالاحتفالات.`,
            `🏪 تاجر جديد افتتح محلاً في ${locName}. اكتشفت بضائع مثيرة.`,
            `🌧️ عاصفة قوية ضربت ${locName}. ساعدت في إعادة البناء.`,
            `📯 أخبار مهمة وصلت ${locName} من العاصمة.`,
            `🎭 فرقة مسرح متجولة عرضت قصة عن أبطال قدامى في ${locName}.`,
        ];
        this.addLogEntry(this.randomPick(locEvents), 'normal');
        this.modifyMood(this.randomInt(2, 6), null);
    }
    
    // السفر
    if (years >= this.randomInt(3, 8) && this.chance(25) && s.age >= 18) {
        const newLoc = this.randomInt(0, this.worldLocations.length - 1);
        if (newLoc !== s.currentLocation) {
            const oldName = locName;
            s.currentLocation = newLoc;
            s.locationYears = 0;
            s.locationEvents = 0;
            this.addLogEntry(`🗺️ بعد ${years} سنوات في ${oldName}، قررت المضي قدماً.`, 'normal');
            this.addLogEntry(`📍 وصلت إلى ${this.getLocationName(newLoc)}! مكان جديد ومغامرات جديدة تنتظر.`, 'quest');
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
        // الزوج/الزوجة لا يغادر
        if (s.married && rel.name === s.marriedTo) return;
        
        const yearsKnown = s.age - (rel.metAge || 0);
        
        // الأصدقاء ذوو المودة المنخفضة لفترة طويلة قد يغادرون
        if (rel.affection < 30 && yearsKnown > 3 && this.chance(15)) {
            rel.active = false;
            rel.departReason = 'تباعدتما بسبب ضعف الروابط';
            this.addLogEntry(`👋 ${rel.name} ال${rel.type} قرر الذهاب في طريقه الخاص. الرابطة لم تكن قوية بما يكفي.`, 'negative');
            this.modifyMood(-5, null);
            return;
        }
        
        // بعض الأصدقاء يغادرون لأسباب قصصية
        if (yearsKnown > 8 && this.chance(8)) {
            const reasons = [
                { reason: 'عاد إلى وطنه', text: `🚶 ${rel.name} قرر العودة إلى وطنه. ودعتهم بالدموع.` },
                { reason: 'انطلق في رحلة منفردة', text: `🌍 ${rel.name} أخبرك أنه يريد استكشاف العالم وحده. تمنيت له التوفيق.` },
                { reason: 'استقر في مدينة أخرى', text: `🏠 ${rel.name} وجد مكاناً يناسبه واستقر فيه. وعدتما بالبقاء على تواصل.` },
                { reason: 'تقاعد من المغامرة', text: `⚔️ ${rel.name} قرر التقاعد من حياة المغامرة. "لقد اكتفيت" قالها بابتسامة.` },
            ];
            const departure = this.randomPick(reasons);
            rel.active = false;
            rel.departReason = departure.reason;
            this.addLogEntry(departure.text, 'normal');
            this.modifyMood(-8, `سأفتقد ${rel.name}...`);
            return;
        }
        
        // المودة تتناقص طبيعياً إذا لم يتفاعل اللاعب
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
    
    const events = [
        { text: `💕 قضيت يوماً جميلاً مع ${spouseName}. الحب يكبر أكثر.`, mood: 6 },
        { text: `🍳 ${spouseName} طبخ لك وجبة لذيذة.`, mood: 4 },
        { text: `😤 تشاجرت مع ${spouseName}... لكنكما تصالحتما قبل النوم.`, mood: -3 },
        { text: `🌙 جلست مع ${spouseName} تتأملان النجوم وتتحدثان عن المستقبل.`, mood: 8 },
        { text: `🎁 ${spouseName} فاجأك بهدية جميلة!`, mood: 7 },
        { text: `💪 تدربت مع ${spouseName}. إنهم أقوى مما ظننت!`, mood: 5 },
        { text: `🏠 أنت و${spouseName} تخططان لتوسيع المنزل.`, mood: 4 },
        { text: `❤️ ${spouseName} يذكرك أنك أفضل شيء حدث لهم.`, mood: 10 },
    ];
    
    const event = this.randomPick(events);
    this.addLogEntry(event.text, 'romance');
    this.modifyMood(event.mood, null);
    
    // تحديث مودة الزوج/الزوجة
    if (event.mood > 0) {
        spouse.affection = Math.min(100, spouse.affection + 1);
    }
    
    // فرصة لإنجاب طفل
    this.triggerChildbirthEvent();
};

// ============ نظام الإنجاب ============
GameEngine.prototype.triggerChildbirthEvent = function() {
    const s = this.state;
    if (!s.married || !s.marriedToData) return;
    if (!s.children) s.children = [];
    
    // حد أقصى 5 أطفال، يجب أن يكون العمر 20 على الأقل، فترة انتظار سنتين بين الأطفال
    if (s.children.length >= 5) return;
    if (s.age < 20) return;
    if (s.age > 45) return;
    
    const lastChildAge = s.children.length > 0 ? s.children[s.children.length - 1].bornAtAge : 0;
    if (s.age - lastChildAge < 2 && s.children.length > 0) return;
    
    // 25% فرصة كل سنة مؤهلة
    if (!this.chance(25)) return;
    
    const childGender = this.chance(50) ? 'male' : 'female';
    const namePool = childGender === 'male' ? DATA.firstNamesMale : DATA.firstNamesFemale;
    
    // تجنب تكرار الأسماء
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
    const childType = childGender === 'male' ? 'ابن' : 'ابنة';
    const childIcon = childGender === 'male' ? '👦' : '👧';
    
    this.addLogEntry(`${childIcon} خبر رائع! أنت و${spouseName} رُزقتما بـ${childType}! سميتموه ${childName}.`, 'special');
    this.modifyMood(20, `فرد جديد في العائلة!`);
    this.modifyStat('cha', 2);
};

// ============ لقاء عضو فريق عشوائي ============
GameEngine.prototype.meetRandomPartyMember = function() {
    // 50% فرصة لاستخدام شخصيات مسبقة، 50% فرصة لتوليد عشوائي
    if (this.chance(50)) {
        const available = DATA.partyMembers.filter(member => 
            !this.state.relationships.find(r => r.name === member.name)
        );
        
        if (available.length > 0) {
            const member = this.randomPick(available);
            this.meetPartyMemberByData(member);
            return;
        }
    }
    
    // توليد عضو فريق عشوائي بالكامل
    this.meetGeneratedPartyMember();
};

GameEngine.prototype.meetGeneratedPartyMember = function() {
    // اختيار نوع عشوائي
    const typeData = this.randomPick(DATA.partyMemberTypes);
    const race = this.randomPick(typeData.races);
    const personality = this.randomPick(DATA.partyMemberPersonalities);
    
    // توليد اسم عشوائي
    const gender = this.chance(50) ? 'male' : 'female';
    const genderIcon = gender === 'male' ? '♂' : '♀';
    const genderLabel = gender === 'male' ? 'ذكر' : 'أنثى';
    const nameData = this.generateRandomName(gender);
    
    // التأكد من عدم تكرار الأسماء
    const existingNames = this.state.relationships.map(r => r.name);
    let attempts = 0;
    while (existingNames.includes(nameData.firstName) && attempts < 10) {
        const newNameData = this.generateRandomName(gender);
        nameData.firstName = newNameData.firstName;
        nameData.lastName = newNameData.lastName;
        nameData.fullName = newNameData.fullName;
        attempts++;
    }
    
    if (existingNames.includes(nameData.firstName)) return;
    
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
    // التحقق من التجنيد المسبق
    if (this.state.relationships.find(r => r.name === member.name)) return;

    const genderIcon = member.genderIcon || (member.gender === 'male' ? '♂' : member.gender === 'female' ? '♀' : '');
    const meetTexts = [
        `${member.icon} قابلت ${member.personality.toLowerCase()} ${(member.race || member.type).toLowerCase()} اسمه ${member.name}${genderIcon ? ' ' + genderIcon : ''}. يبدو مهتماً بالانضمام لمغامراتك!`,
        `${member.icon} ${member.type} اسمه ${member.name}${genderIcon ? ' ' + genderIcon : ''} عبر طريقك. بعد تفاعل قصير، قرر البقاء.`,
        `${member.icon} ${member.name}${genderIcon ? ' ' + genderIcon : ''}، ${member.personality.toLowerCase()} ${member.type}، تحداك لإثبات جدارتك. أبهرته!`,
        `${member.icon} وجدت ${member.name} في مأزق وساعدته. إنه ممتن ويريد الانضمام إليك.`,
        `${member.icon} أثناء ترحالك، صادفت ${member.name}. شيء فيك لفت انتباهه.`,
        `${member.icon} "${member.personality === 'تسونديري' ? "ل-ليس أنني أريد السفر معك أو شيء!" : "لنذهب في مغامرات معاً!"}" قال ${member.name} ال${member.type}.`,
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
        memberAge: member.memberAge || (this.state.age + this.randomInt(-5, 5)),
        level: member.level || Math.max(1, this.state.level + this.randomInt(-3, 3)),
        inLove: false,
        dating: false,
    });

    this.modifyStat('cha', 1);
    this.modifyMood(6, null);
};

// ============ الأحداث العشوائية ============
GameEngine.prototype.triggerRandomEvents = function() {
    const age = this.state.age;
    if (age < 4) return;

    const roll = Math.random() * 100;
    const lck = this.state.lck;

    // الأطفال (4-9) لديهم أحداث محدودة
    if (age < 10) {
        if (this.chance(30)) {
            this.triggerTrainingEvent();
        }
        if (this.state.siblings && this.state.siblings.length > 0 && this.chance(40)) {
            this.triggerSiblingEvent();
        }
        if (this.chance(20)) {
            const amount = this.randomInt(1, 5);
            this.addLogEntry(`💰 أعطاك والداك ${amount} ذهب كمصروف!`, 'positive');
            this.modifyGold(amount);
        }
        return;
    }

    // أحداث المراهقة (10-17)
    if (age >= 10 && age < 18) {
        if (this.chance(25)) {
            this.triggerTeenEvent();
        }
    }

    // أحداث البالغين (18+)
    if (age >= 18 && this.chance(20)) {
        this.triggerAdultEvent();
    }

    // أحداث تدريب
    if (this.chance(40)) {
        this.triggerTrainingEvent();
    }

    // أحداث الأشقاء
    if (this.state.siblings && this.state.siblings.length > 0 && this.chance(25)) {
        this.triggerSiblingEvent();
    }

    // مواجهة عشوائية من المجموعة
    if (age >= 10 && this.chance(35)) {
        this.triggerDynamicEncounter();
    }

    // مواجهة معركة عشوائية
    if (age >= 10 && this.chance(25)) {
        this.triggerRandomEncounter();
    }

    // أحداث الذهب
    if (this.chance(20)) {
        this.triggerGoldEvent();
    }

    // أحداث العلاقات
    if (this.state.relationships.length > 0 && this.chance(35)) {
        this.triggerRelationshipEvent();
    }

    // إيجاد عنصر
    if (this.chance(15 + lck)) {
        this.triggerItemFind();
    }

    // تعلم مهارة
    if (age >= 8 && this.chance(20)) {
        this.triggerSkillEvent();
    }

    // حلقة الشاطئ/الينابيع الساخنة (كلاسيك أنمي!)
    if (age >= 14 && this.chance(8)) {
        this.triggerFanserviceEpisode();
    }

    // حدث مهرجان
    if (this.chance(12)) {
        this.triggerFestivalEvent();
    }

    // تعزيز إحصائية عشوائي من الحياة اليومية
    if (this.chance(25)) {
        const stats = ['str', 'int', 'agi', 'cha', 'lck'];
        const stat = this.randomPick(stats);
        const gain = this.randomInt(1, 2);
        this.modifyStat(stat, gain);
    }

    // فحص ترقية رتبة النقابة
    if (this.state.hasGuild && this.state.level > (this.state.guildRank + 1) * 5) {
        if (this.state.guildRank < DATA.guildRanks.length - 1) {
            this.state.guildRank++;
            this.addLogEntry(`🏛️ ترقية رتبة النقابة! أنت الآن رتبة ${DATA.guildRanks[this.state.guildRank]}!`, 'quest');
            this.modifyFame(this.state.guildRank * 15);
            if (this.state.guildRank >= DATA.guildRanks.length - 1) {
                this.unlockAchievement('guild_master');
            }
        }
    }

    // عرض زواج عند مودة عالية
    if (age >= 18 && !this.state.married && this.chance(10)) {
        this.triggerMarriageEvent();
    }
    
    // عضو الفريق يطلب موعداً
    if (age >= 16 && !this.state.married && this.chance(12)) {
        this.triggerPartyMemberDateRequest();
    }
    
    // عضو الفريق يعترف بحبه
    if (age >= 16 && !this.state.married && this.chance(10)) {
        this.triggerPartyMemberLoveConfession();
    }
};

// ============ أحداث محددة ============

// مواجهات عشوائية ديناميكية
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
        { text: "🏋️ قضيت اليوم تتدرب بالأثقال.", stats: { str: this.randomInt(1, 3) }, exp: 15 },
        { text: "📖 درست كتب التعاويذ القديمة حتى وقت متأخر من الليل.", stats: { int: this.randomInt(1, 3) }, exp: 15 },
        { text: "🏃 تدربت على الركض في الغابة بأقصى سرعة.", stats: { agi: this.randomInt(1, 3) }, exp: 15 },
        { text: "🧘 تأملت تحت شلال لزيادة تحكمك بالمانا.", stats: { int: 1, agi: 1 }, exp: 20 },
        { text: "⚔️ تبارزت مع مغامرين آخرين في ساحة التدريب.", stats: { str: 1, agi: 1 }, exp: 25 },
        { text: "🎭 تدربت على مهاراتك الاجتماعية في الحانة.", stats: { cha: this.randomInt(1, 3) }, exp: 10 },
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
            this.addLogEntry(`⚔️ أثناء الاستكشاف بالقرب من ${locName}، صادفت وحشاً!`, 'battle');
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
                this.addLogEntry("✨ تشعر بقوة تتدفق في جسدك!", 'positive');
            } else {
                this.addLogEntry("🤢 لا أثر... ربما تم خداعك.", 'negative');
            }
        },
        () => {
            this.addLogEntry(`🐾 وجدت مخلوقاً سحرياً مصاباً بالقرب من ${locName} واعتنيت به!`, 'positive');
            this.modifyStat('cha', 2);
            this.modifyStat('lck', 1);
        },
        () => {
            const tier = this.chance(30) ? 'medium' : 'weak';
            this.addLogEntry(`⚠️ نُصب لك كمين على طرق ${locName}!`, 'battle');
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

GameEngine.prototype.triggerBattle = function(tier) {
    const monster = this.randomPick(DATA.monsters[tier]);
    const monsterPower = tier === 'weak' ? 10 : tier === 'medium' ? 30 : tier === 'strong' ? 60 : 100;
    const playerPower = this.state.str + this.state.agi + this.state.int + (this.state.lck / 2);
    
    const winChance = Math.min(90, Math.max(20, 50 + (playerPower - monsterPower)));
    const won = this.chance(winChance);

    if (won) {
        const goldReward = this.randomInt(monsterPower, monsterPower * 3);
        const expReward = this.randomInt(monsterPower, monsterPower * 2);
        
        this.addLogEntry(`⚔️ واجهت ${monster}! بعد معركة شرسة، انتصرت!`, 'battle');
        this.modifyGold(goldReward);
        this.gainExp(expReward);
        this.modifyFame(Math.floor(monsterPower / 5));
        
        // إنجاز أول معركة
        if (!this.state.achievements.includes('first_blood')) {
            this.unlockAchievement('first_blood');
        }

        // مكسب إحصائية عشوائي من المعركة
        const stat = this.randomPick(['str', 'agi', 'int']);
        this.modifyStat(stat, this.randomInt(1, 2));
    } else {
        this.addLogEntry(`⚔️ واجهت ${monster}! المعركة كانت صعبة واضطررت للتراجع...`, 'negative');
        this.state.hp = Math.floor(this.state.maxHp * 0.3);
        this.modifyStat('str', 1); // تتعلم من الهزيمة
        this.gainExp(Math.floor(monsterPower / 2));
        
        // فرصة موت من الوحوش القوية
        if (tier === 'strong' || tier === 'boss') {
            if (this.chance(5 - this.state.lck * 0.1)) {
                this.triggerDeath({ 
                    text: `ال${monster} كان أقوى بكثير... مغامرتك تنتهي هنا.`, 
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
            `💰 وجدت ${amount} قطعة ذهبية على الطريق!`,
            `💰 مكافأة مهمة بقيمة ${amount} ذهب تم إيداعها!`,
            `💰 بعت بعض غنائم الوحوش مقابل ${amount} ذهب!`,
        ];
        this.addLogEntry(this.randomPick(events), 'positive');
        this.modifyGold(amount);
    } else {
        const amount = this.randomInt(5, 30);
        const events = [
            `💸 نشال سرق منك ${amount} ذهب!`,
            `💸 اضطررت لدفع ${amount} ذهب لإصلاح النزل بعد حادثة سحرية...`,
            `💸 اشتريت طعاماً مشكوكاً فيه من الشارع بـ ${amount} ذهب. كان فظيعاً.`,
        ];
        this.addLogEntry(this.randomPick(events), 'negative');
        this.modifyGold(-amount);
    }
};

GameEngine.prototype.triggerRelationshipEvent = function() {
    if (this.state.relationships.length === 0) return;
    const rel = this.randomPick(this.state.relationships);
    
    const events = [
        { text: `${rel.icon} ${rel.name} طبخ لك وجبة. كانت ${this.chance(50) ? 'لذيذة!' : 'محروقة... لكنك أكلتها على أي حال.'}`, affection: this.randomInt(2, 8) },
        { text: `${rel.icon} تدربت أنت و${rel.name} معاً اليوم.`, affection: this.randomInt(3, 6) },
        { text: `${rel.icon} ${rel.name} وقع في مشكلة وساعدته!`, affection: this.randomInt(5, 10) },
        { text: `${rel.icon} دخلت بالخطأ على ${rel.name} وهو يغير ملابسه... ${rel.personality === 'تسونديري' ? '"با-باكا!"' : '*صمت محرج*'}`, affection: this.chance(50) ? 5 : -5 },
        { text: `${rel.icon} ${rel.name} شاركك قصة عن ماضيه.`, affection: this.randomInt(3, 8) },
        { text: `${rel.icon} اشتريت هدية لـ ${rel.name} من السوق.`, affection: this.randomInt(5, 12) },
        { text: `${rel.icon} ${rel.name} نام على كتفك. ${rel.personality === 'مخلص' ? 'بدا مسالماً.' : 'يا للإحراج!'}`, affection: this.randomInt(3, 7) },
    ];

    const event = this.randomPick(events);
    rel.affection = Math.max(0, Math.min(100, rel.affection + event.affection));
    this.addLogEntry(event.text, 'romance');

    // فحص إنجاز أقصى مودة
    if (rel.affection >= 100) {
        this.unlockAchievement('popular');
    }

    // فحص إنجاز الهاريم
    const highAffection = this.state.relationships.filter(r => r.affection >= 80).length;
    if (highAffection >= 5) {
        this.unlockAchievement('harem');
    }
};

GameEngine.prototype.triggerItemFind = function() {
    const lck = this.state.lck;
    let pool = [];
    
    pool.push('health_potion', 'mana_potion');
    if (lck > 10) pool.push('leather_armor', 'luck_charm');
    if (lck > 20) pool.push('iron_sword', 'ring_charisma');
    if (lck > 30) pool.push('flame_blade', 'mithril_armor');
    if (lck > 40) pool.push('shadow_dagger', 'staff_wisdom', 'rare_candy');
    if (lck > 60) pool.push('holy_sword', 'dragon_armor');

    const itemId = this.randomPick(pool);
    const item = DATA.items[itemId];
    
    const existing = this.state.inventory.find(i => i.itemId === itemId);
    if (existing) {
        existing.quantity++;
    } else {
        this.state.inventory.push({ itemId, quantity: 1 });
    }

    this.addLogEntry(`🎁 وجدت: ${item.icon} ${item.name}! (${item.rarity})`, 'positive');
};

GameEngine.prototype.triggerSkillEvent = function() {
    const available = Object.entries(DATA.skills).filter(([id, skill]) => {
        if (this.state.skills[id]) return false;
        return Object.entries(skill.requirement).every(([stat, val]) => this.state[stat] >= val);
    });

    if (available.length === 0) return;

    const [skillId, skill] = this.randomPick(available);
    this.state.skills[skillId] = 1;
    this.addLogEntry(`✨ تعلمت مهارة جديدة: ${skill.icon} ${skill.name}!`, 'special');
    this.gainExp(30);

    if (Object.keys(this.state.skills).length >= 10) {
        this.unlockAchievement('all_skills');
    }
};

GameEngine.prototype.triggerFanserviceEpisode = function() {
    if (this.state.relationships.length === 0) return;
    
    const episodes = [
        "🏖️ حلقة الشاطئ! كل الفريق ذهب إلى البحر. حدثت مواقف مضحكة!",
        "♨️ حلقة الينابيع الساخنة! زرتم ينبوعاً ساخناً مشهوراً. الجدار بين الحمامات كان رقيقاً بشكل مريب...",
        "👘 حلقة المهرجان! الجميع ارتدى ملابس تقليدية. كانت هناك ألعاب نارية!",
        "🏠 الفريق علق في غرفة نزل صغيرة بسبب عاصفة. كان الأمر... مريحاً جداً.",
    ];

    this.addLogEntry(this.randomPick(episodes), 'romance');
    this.state.relationships.forEach(r => {
        r.affection = Math.min(100, r.affection + this.randomInt(2, 5));
    });
    this.modifyStat('cha', 1);
};

GameEngine.prototype.triggerFestivalEvent = function() {
    const events = [
        "🎆 مهرجان كبير أُقيم في المدينة! انضممت للاحتفالات.",
        "🎪 سيرك متجول جاء إلى المدينة بعروض سحرية!",
        "🎵 شاعر مشهور أدى في الحانة. المدينة كلها كانت تغني!",
        "🍖 وليمة كبيرة أُقيمت احتفالاً بصيد وحوش ناجح!",
        "🏆 بطولة الفنون القتالية السنوية تُقام!",
    ];

    this.addLogEntry(this.randomPick(events), 'special');
    this.modifyStat('cha', 1);
    this.modifyFame(5);
    this.gainExp(15);
};

GameEngine.prototype.triggerSchoolArcEvent = function() {
    this.addLogEntry("🏫 امتحان الأكاديمية السحرية السنوي قادم!", "quest");
    
    if (this.state.int > 20) {
        this.addLogEntry("📝 تفوقت في الامتحان! المعلمون أُعجبوا بمعرفتك من حياتك السابقة.", "positive");
        this.modifyStat('int', 3);
        this.modifyFame(15);
    } else {
        this.addLogEntry("📝 الامتحان كان صعباً، لكنك نجحت بفضل مساعدة أصدقائك.", "normal");
        this.modifyStat('int', 1);
    }
    this.gainExp(40);
};

GameEngine.prototype.triggerTournamentEvent = function() {
    this.addLogEntry("🏟️ البطولة الملكية بدأت! مغامرون من كل مكان يتجمعون للتنافس!", "battle");
    
    const power = this.state.str + this.state.agi + (this.state.lck / 3);
    
    if (power > 40) {
        this.addLogEntry("🏆 قاتلت طريقك إلى النهائي وفزت بالبطولة! الجمهور يهتف بجنون!", "special");
        this.modifyGold(500);
        this.modifyFame(50);
        this.gainExp(150);
        this.modifyStat('str', 3);
        this.modifyStat('cha', 3);
    } else if (power > 25) {
        this.addLogEntry("🥈 وصلت لنصف النهائي قبل أن تُهزم. لا يزال مثيراً للإعجاب!", "positive");
        this.modifyGold(200);
        this.modifyFame(20);
        this.gainExp(80);
        this.modifyStat('str', 2);
    } else {
        this.addLogEntry("😤 أُقصيت في الجولة الأولى... لكنك تعلمت الكثير!", "negative");
        this.modifyStat('str', 2);
        this.modifyStat('agi', 1);
        this.gainExp(40);
    }
};

GameEngine.prototype.triggerDemonLordEvent = function() {
    if (this.state.demonLordDefeated) return;
    
    this.addLogEntry("👿 ملك الشياطين ظهر! المعركة الأخيرة حلّت!", "battle");
    
    const totalPower = this.state.str + this.state.int + this.state.agi + this.state.lck + (this.state.level * 2);
    const partyBonus = this.state.relationships.filter(r => r.affection >= 50).length * 10;
    const finalPower = totalPower + partyBonus;

    if (finalPower > 150) {
        this.addLogEntry("⚔️ مع فريقك بجانبك، واجهت ملك الشياطين في معركة ملحمية!", "battle");
        this.addLogEntry("✨ روابطك أعطتك القوة! ملك الشياطين هُزم!", "special");
        this.addLogEntry("🎉 السلام عاد إلى إيثيريا! أنت تُمجّد كأعظم بطل!", "special");
        this.state.demonLordDefeated = true;
        this.unlockAchievement('demon_lord');
        this.modifyFame(200);
        this.modifyGold(5000);
        this.gainExp(500);
    } else {
        this.addLogEntry("💀 ملك الشياطين كان أقوى بكثير... بالكاد نجوت بحياتك.", "negative");
        this.addLogEntry("💪 لكنك لن تستسلم. ستتدرب أكثر وتعود أقوى!", "quest");
        this.state.hp = 1;
        this.modifyStat('str', 3);
        this.modifyStat('int', 3);
        this.gainExp(100);
    }
};

GameEngine.prototype.triggerMarriageEvent = function() {
    const playerGender = this.state.gender;
    const eligible = this.state.relationships.filter(r => 
        r.affection >= 80 && r.active !== false && r.inLove &&
        ((playerGender === 'male' && r.gender === 'female') || (playerGender === 'female' && r.gender === 'male'))
    );
    if (eligible.length === 0) return;
    
    const partner = this.randomPick(eligible);
    const genderIcon = partner.gender === 'male' ? '♂' : partner.gender === 'female' ? '♀' : '';
    
    this.pendingChoice = `
        <div class="section-header">💒 لحظة خاصة</div>
        <div class="log-entry romance">
            ${partner.icon} ${genderIcon} ${partner.name} يعترف بمشاعره تجاهك!<br>
            <em>"أنا... لطالما اهتممت بك. هل... ستكون معي للأبد؟"</em>
        </div>
        <button class="choice-btn" onclick="game.acceptMarriage('${partner.name}')">💒 "نعم! أنا أحبك أيضاً!"</button>
        <button class="choice-btn" onclick="game.rejectMarriage('${partner.name}')">💔 "أنا آسف... لا أستطيع."</button>
        <button class="choice-btn" onclick="game.showAgeActions()">😅 "دعني أفكر..." (تخطي)</button>
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
            affection: 100,
            spouseAge: partner.memberAge || this.state.age
        };
        // إزالة الزوج/الزوجة من الفريق — ينتقل لتبويب العائلة
        const idx = this.state.relationships.indexOf(partner);
        if (idx !== -1) this.state.relationships.splice(idx, 1);
    }
    const spouseTitle = partner?.gender === 'male' ? 'زوجك' : partner?.gender === 'female' ? 'زوجتك' : 'شريك حياتك';
    this.addLogEntry(`💒 تزوجت ${name}! ${spouseTitle} الآن جزء من عائلتك. أُقيم حفل زفاف جميل في ${this.getLocationName(this.state.currentLocation)}.`, 'romance');
    this.modifyStat('cha', 5);
    this.modifyFame(30);
    this.modifyMood(25, "أسعد يوم في حياتك!");
    this.pendingChoice = null;
    this.showAgeActions();
};

GameEngine.prototype.rejectMarriage = function(name) {
    const partner = this.state.relationships.find(r => r.name === name);
    if (partner) partner.affection -= 20;
    this.addLogEntry(`💔 رفضت عرض ${name}... بدا مكسور القلب.`, 'negative');
    this.modifyMood(-8, "خيار مؤلم...");
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
    this.addLogEntry(`🌟 ${DATA.cheatSkillNames[skill]} أصبحت أقوى!`, 'special', boost);
};

// ============ تبويب الإجراءات الرئيسية ============
GameEngine.prototype.showMainActions = function() {
    const panel = document.getElementById('action-panel');
    const s = this.state;
    
    let html = '<div class="section-header">⚡ الإجراءات</div>';

    // إجراءات التدريب
    html += `
        <button class="action-btn" onclick="game.doAction('train_str')">
            <span class="action-icon">🏋️</span>
            <span class="action-label">تدريب القوة<small>+قوة، بعض الخبرة</small></span>
        </button>
        <button class="action-btn" onclick="game.doAction('train_int')">
            <span class="action-icon">📖</span>
            <span class="action-label">دراسة السحر<small>+ذكاء، بعض الخبرة</small></span>
        </button>
        <button class="action-btn" onclick="game.doAction('train_agi')">
            <span class="action-icon">🏃</span>
            <span class="action-label">تدريب الرشاقة<small>+رشاقة، بعض الخبرة</small></span>
        </button>
        <button class="action-btn" onclick="game.doAction('socialize')">
            <span class="action-icon">🗣️</span>
            <span class="action-label">التواصل الاجتماعي<small>+كاريزما، مودة الفريق</small></span>
        </button>
    `;

    // إجراءات المغامرة (إذا في النقابة)
    if (s.hasGuild) {
        html += `
            <button class="action-btn" onclick="game.doAction('quest')">
                <span class="action-icon">📜</span>
                <span class="action-label">خذ مهمة نقابة<small>ذهب، خبرة، شهرة</small></span>
            </button>
            <button class="action-btn" onclick="game.doAction('dungeon')">
                <span class="action-icon">🏰</span>
                <span class="action-label">استكشف زنزانة<small>خطر وكنز!</small></span>
            </button>
            <button class="action-btn" onclick="game.doAction('hunt')">
                <span class="action-icon">⚔️</span>
                <span class="action-label">اصطياد الوحوش<small>قتال للخبرة والغنائم</small></span>
            </button>
        `;
    }

    // إجراءات أخرى
    html += `
        <button class="action-btn" onclick="game.doAction('rest')">
            <span class="action-icon">🏨</span>
            <span class="action-label">استرح في النزل<small>استعادة ص.ح/ط.س (-20ذ)</small></span>
        </button>
        <button class="action-btn" onclick="game.doAction('gamble')">
            <span class="action-icon">🎰</span>
            <span class="action-label">زيارة الكازينو<small>خاطر بالذهب لمزيد من الذهب!</small></span>
        </button>
        <button class="action-btn" onclick="game.doAction('explore')">
            <span class="action-icon">🗺️</span>
            <span class="action-label">استكشف المنطقة<small>اكتشف أشياء جديدة</small></span>
        </button>
    `;

    panel.innerHTML = html;
};

GameEngine.prototype.doAction = function(action) {
    switch(action) {
        case 'train_str':
            this.modifyStat('str', this.randomInt(2, 4));
            this.gainExp(this.randomInt(10, 25));
            this.addLogEntry("🏋️ تدربت بجد اليوم! تشعر بأنك أقوى.", 'normal', { str: 3 });
            break;
        case 'train_int':
            this.modifyStat('int', this.randomInt(2, 4));
            this.gainExp(this.randomInt(10, 25));
            this.addLogEntry("📖 قضيت ساعات في دراسة المجلدات القديمة. عقلك أكثر حدة.", 'normal', { int: 3 });
            break;
        case 'train_agi':
            this.modifyStat('agi', this.randomInt(2, 4));
            this.gainExp(this.randomInt(10, 25));
            this.addLogEntry("🏃 تدربت على الحركة عالية السرعة. أنت أسرع الآن!", 'normal', { agi: 3 });
            break;
        case 'socialize':
            this.modifyStat('cha', this.randomInt(1, 3));
            this.state.relationships.forEach(r => {
                r.affection = Math.min(100, r.affection + this.randomInt(1, 5));
            });
            this.addLogEntry("🗣️ قضيت وقتاً ممتعاً مع رفاقك.", 'romance');
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
                this.addLogEntry("🏨 استرحت في النزل. تعافيت بالكامل!", 'positive');
            } else {
                this.addLogEntry("💸 لا تستطيع تحمل تكلفة النزل! (تحتاج 20ذ)", 'negative');
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
        this.addLogEntry(`📜 المهمة مكتملة: ${questType}! كسبت ${goldReward}ذ و ${expReward} خبرة!`, 'quest');
        this.modifyGold(goldReward);
        this.gainExp(expReward);
        this.modifyFame(difficulty * 3);
        this.state.completedQuests++;
    } else {
        this.addLogEntry(`📜 المهمة فشلت: ${questType}... حظاً أوفر في المرة القادمة.`, 'negative');
        this.gainExp(Math.floor(expReward / 3));
    }
};

GameEngine.prototype.doDungeon = function() {
    const floors = this.randomInt(1, 5 + Math.floor(this.state.level / 5));
    let totalGold = 0;
    let totalExp = 0;

    this.addLogEntry(`🏰 دخلت المتاهة المظلمة واستكشفت ${floors} طوابق!`, 'quest');

    for (let i = 0; i < floors; i++) {
        if (this.chance(40)) {
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

    // فرصة طابق الزعيم
    if (this.chance(20 + this.state.lck)) {
        this.addLogEntry("👹 وجدت زعيم الزنزانة!", 'battle');
        if (this.state.str + this.state.int > 40) {
            totalGold += this.randomInt(100, 300);
            totalExp += this.randomInt(50, 150);
            this.addLogEntry("🎉 الزعيم هُزم! مكافآت ضخمة!", 'special');
        } else {
            this.addLogEntry("💀 الزعيم كان أقوى من اللازم! هربت!", 'negative');
            totalGold = Math.floor(totalGold / 2);
        }
    }

    this.modifyGold(totalGold);
    this.gainExp(totalExp);
    this.addLogEntry(`📊 نتائج الزنزانة: +${totalGold}ذ، +${totalExp} خبرة`, 'positive');
};

GameEngine.prototype.doGamble = function() {
    const bet = Math.min(this.state.gold, this.randomInt(20, 100));
    if (bet <= 0) {
        this.addLogEntry("💸 أنت مفلس جداً للمقامرة!", 'negative');
        return;
    }

    const winChance = 35 + (this.state.lck / 2);
    if (this.chance(winChance)) {
        const winnings = bet * this.randomInt(2, 4);
        this.modifyGold(winnings);
        this.addLogEntry(`🎰 راهنت بـ ${bet}ذ وفزت بـ ${winnings}ذ! محظوظ!`, 'positive');
    } else {
        this.modifyGold(-bet);
        this.addLogEntry(`🎰 راهنت بـ ${bet}ذ وخسرتها كلها...`, 'negative');
    }
};

GameEngine.prototype.doExplore = function() {
    const events = [
        () => {
            this.addLogEntry("🗺️ اكتشفت كهفاً مخفياً! بداخله صندوق كنز!", 'special');
            this.triggerItemFind();
        },
        () => {
            this.addLogEntry("🌸 وجدت مرجاً جميلاً بأزهار شافية. تشعر بالانتعاش.", 'positive');
            this.state.hp = this.state.maxHp;
            this.state.mp = this.state.maxMp;
        },
        () => {
            this.addLogEntry("👻 عثرت على أطلال قديمة بنقش غامض...", 'quest');
            this.modifyStat('int', 2);
            this.gainExp(25);
        },
        () => {
            this.addLogEntry("🐾 وجدت مخلوقاً سحرياً مصاباً واعتنيت به!", 'positive');
            this.modifyStat('cha', 2);
            this.modifyStat('lck', 1);
        },
        () => {
            const tier = this.chance(30) ? 'medium' : 'weak';
            this.addLogEntry("⚠️ نُصب لك كمين أثناء الاستكشاف!", 'battle');
            this.triggerBattle(tier);
        },
        () => {
            const newLoc = this.randomInt(0, this.worldLocations.length - 1);
            this.state.currentLocation = newLoc;
            this.state.locationYears = 0;
            this.state.locationEvents = 0;
            this.addLogEntry(`📍 سافرت إلى ${this.getLocationName(newLoc)}!`, 'quest');
            this.modifyFame(5);
        },
    ];

    this.randomPick(events)();
};

// ============ تبويب العلاقات ============
GameEngine.prototype.showRelationships = function() {
    const panel = document.getElementById('action-panel');
    
    const activeRels = this.state.relationships.filter(r => r.active !== false && r.name !== this.state.marriedTo);
    const departedRels = this.state.relationships.filter(r => r.active === false && r.name !== this.state.marriedTo);
    
    if (activeRels.length === 0 && departedRels.length === 0) {
        panel.innerHTML = `
            <div class="section-header">💕 أعضاء الفريق</div>
            <div class="empty-state">لا رفاق بعد. استمر في الاستكشاف لمقابلة أشخاص!</div>
        `;
        return;
    }

    let html = '<div class="section-header">💕 أعضاء الفريق</div>';
    
    activeRels.forEach((rel, i) => {
        const realIndex = this.state.relationships.indexOf(rel);
        const genderIcon = rel.gender === 'male' ? '♂' : rel.gender === 'female' ? '♀' : '';
        const genderLabel = rel.gender === 'male' ? 'ذكر' : rel.gender === 'female' ? 'أنثى' : '';
        const ageDisplay = rel.memberAge ? `العمر ${rel.memberAge}` : '';
        const loveIcon = rel.inLove ? ' 💘' : (rel.dating ? ' 💑' : '');
        html += `
            <div class="relationship-card" onclick="game.interactWith(${realIndex})" style="cursor:pointer;">
                <div class="rel-avatar">${rel.icon}</div>
                <div class="rel-info">
                    <div class="rel-name">${genderIcon} ${rel.name}${loveIcon}</div>
                    <div class="rel-type">${genderLabel ? genderLabel + ' • ' : ''}${ageDisplay ? ageDisplay + ' • ' : ''}${rel.type} • ${rel.personality}${rel.level ? ' • مس.' + rel.level : ''}</div>
                    <div class="rel-bar">
                        <div class="rel-fill" style="width: ${rel.affection}%"></div>
                    </div>
                    <div class="rel-type">المودة: ${rel.affection}/100 ${rel.affection >= 80 ? '❤️' : rel.affection >= 50 ? '💛' : '🤍'}</div>
                </div>
            </div>
        `;
    });
    
    if (departedRels.length > 0) {
        html += '<div class="section-header" style="margin-top:12px;font-size:0.9rem;opacity:0.6;">👋 الرفاق السابقون</div>';
        departedRels.forEach(rel => {
            const genderIcon = rel.gender === 'male' ? '♂' : rel.gender === 'female' ? '♀' : '';
            html += `
                <div class="relationship-card" style="opacity: 0.4; pointer-events: none;">
                    <div class="rel-avatar">${rel.icon}</div>
                    <div class="rel-info">
                        <div class="rel-name">${genderIcon} ${rel.name}</div>
                        <div class="rel-type">${rel.departReason || 'غادر الفريق'}</div>
                    </div>
                </div>
            `;
        });
    }
    
    panel.innerHTML = html;
};

// ============ التفاعل مع عضو الفريق ============
GameEngine.prototype.interactWith = function(index) {
    const rel = this.state.relationships[index];
    if (!rel || rel.active === false) return;
    
    const genderIcon = rel.gender === 'male' ? '♂' : rel.gender === 'female' ? '♀' : '';
    const genderLabel = rel.gender === 'male' ? 'ذكر' : rel.gender === 'female' ? 'أنثى' : '';
    const ageDisplay = rel.memberAge ? `العمر: ${rel.memberAge}` : '';
    const relationStatus = rel.inLove ? '💘 عاشق' : (rel.dating ? '💑 مواعدة' : '');
    
    // الزواج فقط للجنس المقابل، عمر 18+، في حالة حب
    const playerGender = this.state.gender;
    const isOppositeGender = (playerGender === 'male' && rel.gender === 'female') || (playerGender === 'female' && rel.gender === 'male');
    const canPropose = rel.affection >= 80 && !this.state.married && this.state.age >= 18 && isOppositeGender && rel.inLove;
    const canDate = !this.state.married && this.state.age >= 16 && isOppositeGender && rel.affection >= 40 && !rel.dating && !rel.inLove;
    const canConfessLove = rel.dating && rel.affection >= 65 && !rel.inLove && isOppositeGender;
    
    const panel = document.getElementById('action-panel');
    panel.innerHTML = `
        <div class="section-header">${rel.icon} ${genderIcon} ${rel.name}</div>
        <div class="log-entry normal">
            <p><strong>${rel.fullName || rel.name}</strong></p>
            ${genderLabel ? `<p>الجنس: ${genderLabel} ${genderIcon}</p>` : ''}
            ${ageDisplay ? `<p>${ageDisplay}</p>` : ''}
            <p>الفئة: ${rel.type} • ${rel.personality}</p>
            ${rel.level ? `<p>المستوى: ${rel.level}</p>` : ''}
            <p>المودة: ${rel.affection}%</p>
            ${relationStatus ? `<p>الحالة: ${relationStatus}</p>` : ''}
        </div>
        <button class="choice-btn" onclick="game.talkTo(${index})">💬 تحدث</button>
        <button class="choice-btn" onclick="game.giftTo(${index})">🎁 أعطِ هدية (-100ذ)</button>
        <button class="choice-btn" onclick="game.trainWith(${index})">⚔️ تدرب معاً</button>
        ${canDate ? `<button class="choice-btn" onclick="game.askOnDate(${index})">💕 اطلب موعد</button>` : ''}
        ${canConfessLove ? `<button class="choice-btn" onclick="game.confessLove(${index})">💘 اعترف بحبك</button>` : ''}
        ${canPropose ? `<button class="choice-btn" onclick="game.proposeTo(${index})">💒 اطلب الزواج</button>` : ''}
        <button class="choice-btn" onclick="game.showRelationships()">→ العودة</button>
    `;
};

GameEngine.prototype.talkTo = function(index) {
    const rel = this.state.relationships[index];
    rel.affection = Math.min(100, rel.affection + this.randomInt(1, 5));
    this.addLogEntry(`💬 قضيت وقتاً ممتعاً في الحديث مع ${rel.name}.`, 'romance');
    this.modifyMood(3, null);
    this.interactWith(index);
};

GameEngine.prototype.giftTo = function(index) {
    if (this.state.gold < 100) {
        this.showNotification("ذهب غير كافٍ! تحتاج 100ذ.", 'danger');
        return;
    }
    const rel = this.state.relationships[index];
    this.state.gold -= 100;
    rel.affection = Math.min(100, rel.affection + this.randomInt(5, 15));
    this.addLogEntry(`🎁 أعطيت هدية لـ ${rel.name}. بدا سعيداً جداً!`, 'romance');
    this.modifyMood(4, null);
    this.updateAllUI();
    this.interactWith(index);
};

GameEngine.prototype.trainWith = function(index) {
    const rel = this.state.relationships[index];
    rel.affection = Math.min(100, rel.affection + this.randomInt(2, 8));
    this.modifyStat('str', 1);
    this.addLogEntry(`⚔️ تدربت مع ${rel.name}. كلاكما أصبح أقوى!`, 'positive');
    this.modifyMood(3, null);
    this.interactWith(index);
};

GameEngine.prototype.proposeTo = function(index) {
    const rel = this.state.relationships[index];
    
    // حماية: عمر 18+، جنس مقابل، في حالة حب
    const playerGender = this.state.gender;
    const isOppositeGender = (playerGender === 'male' && rel.gender === 'female') || (playerGender === 'female' && rel.gender === 'male');
    if (this.state.age < 18 || !isOppositeGender || !rel.inLove) {
        this.showNotification("الزواج يتطلب عمر 18+ وحب متبادل ومن الجنس المقابل.", 'danger');
        return;
    }
    
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
            affection: 100,
            spouseAge: rel.memberAge || this.state.age
        };
        rel.affection = 100;
        const spouseTitle = rel.gender === 'male' ? 'زوجك' : rel.gender === 'female' ? 'زوجتك' : 'شريك حياتك';
        this.addLogEntry(`💒 تزوجت ${rel.name}! ${spouseTitle} الآن جزء من عائلتك. أُقيم حفل زفاف جميل في ${this.getLocationName(this.state.currentLocation)}.`, 'romance');
        this.modifyStat('cha', 5);
        this.modifyFame(30);
        this.modifyMood(25, "أسعد يوم في حياتك!");
        // إزالة الزوج/الزوجة من الفريق — ينتقل لتبويب العائلة
        this.state.relationships.splice(index, 1);
        this.showRelationships();
        return;
    } else {
        rel.affection -= 10;
        this.addLogEntry(`💔 ${rel.name} لم يكن مستعداً بعد...`, 'negative');
        this.modifyMood(-12, "الرفض مؤلم...");
    }
    this.interactWith(index);
};

// ============ نظام المواعدة ============
GameEngine.prototype.askOnDate = function(index) {
    const rel = this.state.relationships[index];
    if (!rel) return;
    
    const successChance = Math.min(90, rel.affection + 10);
    if (this.chance(successChance)) {
        rel.dating = true;
        rel.affection = Math.min(100, rel.affection + this.randomInt(5, 12));
        const dateEvents = [
            `💕 طلبت من ${rel.name} موعداً ووافق! قضيتما وقتاً رائعاً في التجول في ${this.getLocationName(this.state.currentLocation)}.`,
            `💕 ${rel.name} قبل دعوتك بسعادة! تشاركتما وجبة وضحكتما طوال المساء.`,
            `💕 أنت و${rel.name} خرجتما في موعد جميل! شاهدتما الغروب معاً.`,
        ];
        this.addLogEntry(this.randomPick(dateEvents), 'romance');
        this.modifyMood(10, `موعد رائع مع ${rel.name}!`);
    } else {
        rel.affection -= 5;
        this.addLogEntry(`😔 ${rel.name} رفض دعوتك للموعد... "ربما في وقت آخر."`, 'negative');
        this.modifyMood(-5, null);
    }
    this.updateAllUI();
    this.interactWith(index);
};

GameEngine.prototype.confessLove = function(index) {
    const rel = this.state.relationships[index];
    if (!rel) return;
    
    const successChance = Math.min(95, rel.affection);
    if (this.chance(successChance)) {
        rel.inLove = true;
        rel.affection = Math.min(100, rel.affection + this.randomInt(10, 20));
        this.addLogEntry(`💘 اعترفت بحبك لـ ${rel.name}! "أنا... أشعر بنفس الشيء!" قال بدموع الفرح.`, 'romance');
        this.modifyMood(15, `${rel.name} يبادلك الحب!`);
    } else {
        rel.affection -= 10;
        rel.dating = false;
        this.addLogEntry(`💔 ${rel.name} لا يشعر بنفس الشيء... "أنا آسف، أراك كصديق فقط."`, 'negative');
        this.modifyMood(-10, "حسرة القلب...");
    }
    this.updateAllUI();
    this.interactWith(index);
};

// ============ عضو الفريق يطلب موعداً ============
GameEngine.prototype.triggerPartyMemberDateRequest = function() {
    if (this.state.married || this.state.age < 16) return;
    
    const playerGender = this.state.gender;
    const eligible = this.state.relationships.filter(r => 
        r.active !== false && 
        r.affection >= 45 && 
        !r.dating && !r.inLove &&
        ((playerGender === 'male' && r.gender === 'female') || (playerGender === 'female' && r.gender === 'male'))
    );
    if (eligible.length === 0) return;
    
    const rel = this.randomPick(eligible);
    const relIndex = this.state.relationships.indexOf(rel);
    const genderIcon = rel.gender === 'male' ? '♂' : '♀';
    
    this.pendingChoice = `
        <div class="section-header">💕 طلب خاص</div>
        <div class="log-entry romance">
            ${rel.icon} ${genderIcon} ${rel.name} يقترب منك بتوتر...<br>
            <em>"مرحباً... كنت أتساءل إذا... ربما تود الخروج في موعد معي؟"</em>
        </div>
        <button class="choice-btn" onclick="game.acceptDate(${relIndex})">💕 "بكل سرور!"</button>
        <button class="choice-btn" onclick="game.rejectDate(${relIndex})">😅 "آسف، لست مهتماً."</button>
        <button class="choice-btn" onclick="game.showAgeActions()">🤔 "دعني أفكر..." (تخطي)</button>
    `;
    this.showAgeActions();
};

GameEngine.prototype.acceptDate = function(index) {
    const rel = this.state.relationships[index];
    if (!rel) { this.pendingChoice = null; this.showAgeActions(); return; }
    
    rel.dating = true;
    rel.affection = Math.min(100, rel.affection + this.randomInt(8, 15));
    this.addLogEntry(`💕 قبلت دعوة ${rel.name} للموعد! كان مساءً ساحراً.`, 'romance');
    this.modifyMood(10, `موعد رائع!`);
    this.pendingChoice = null;
    this.updateAllUI();
    this.showAgeActions();
};

GameEngine.prototype.rejectDate = function(index) {
    const rel = this.state.relationships[index];
    if (!rel) { this.pendingChoice = null; this.showAgeActions(); return; }
    
    rel.affection -= 8;
    this.addLogEntry(`😔 رفضت طلب ${rel.name} للموعد. بدا محبطاً.`, 'negative');
    this.modifyMood(-3, null);
    this.pendingChoice = null;
    this.updateAllUI();
    this.showAgeActions();
};

// ============ عضو الفريق يعترف بحبه ============
GameEngine.prototype.triggerPartyMemberLoveConfession = function() {
    if (this.state.married) return;
    
    const playerGender = this.state.gender;
    const eligible = this.state.relationships.filter(r => 
        r.active !== false && 
        r.dating && !r.inLove &&
        r.affection >= 70 &&
        ((playerGender === 'male' && r.gender === 'female') || (playerGender === 'female' && r.gender === 'male'))
    );
    if (eligible.length === 0) return;
    
    const rel = this.randomPick(eligible);
    const relIndex = this.state.relationships.indexOf(rel);
    const genderIcon = rel.gender === 'male' ? '♂' : '♀';
    
    this.pendingChoice = `
        <div class="section-header">💘 اعتراف بالحب!</div>
        <div class="log-entry romance">
            ${rel.icon} ${genderIcon} ${rel.name} يمسك يدك بنظرة جادة...<br>
            <em>"أنا... وقعت في حبك. لا أستطيع إخفاء ذلك بعد الآن. هل تشعر بنفس الشيء؟"</em>
        </div>
        <button class="choice-btn" onclick="game.acceptLoveConfession(${relIndex})">💘 "أنا أحبك أيضاً!"</button>
        <button class="choice-btn" onclick="game.rejectLoveConfession(${relIndex})">💔 "أنا آسف... لا أشعر بذلك."</button>
        <button class="choice-btn" onclick="game.showAgeActions()">😅 "أحتاج وقتاً..." (تخطي)</button>
    `;
    this.showAgeActions();
};

GameEngine.prototype.acceptLoveConfession = function(index) {
    const rel = this.state.relationships[index];
    if (!rel) { this.pendingChoice = null; this.showAgeActions(); return; }
    
    rel.inLove = true;
    rel.affection = Math.min(100, rel.affection + this.randomInt(10, 20));
    this.addLogEntry(`💘 أنت و${rel.name} الآن في حالة حب! قلوبكما تنبض كواحد.`, 'romance');
    this.modifyMood(15, `في حالة حب مع ${rel.name}!`);
    this.pendingChoice = null;
    this.updateAllUI();
    this.showAgeActions();
};

GameEngine.prototype.rejectLoveConfession = function(index) {
    const rel = this.state.relationships[index];
    if (!rel) { this.pendingChoice = null; this.showAgeActions(); return; }
    
    rel.affection -= 15;
    rel.dating = false;
    this.addLogEntry(`💔 رفضت اعتراف ${rel.name} بالحب. قلبه منكسر.`, 'negative');
    this.modifyMood(-8, "خيار مؤلم...");
    this.pendingChoice = null;
    this.updateAllUI();
    this.showAgeActions();
};

// ============ تبويب المخزون ============
GameEngine.prototype.showInventory = function() {
    const panel = document.getElementById('action-panel');
    
    // الأطفال ليس لديهم مخزون
    if (this.state.age < 10) {
        panel.innerHTML = `
            <div class="section-header">🎒 المخزون</div>
            <div class="empty-state">
                <p>👶 أنت لا تزال طفلاً!</p>
                <p style="margin-top: 8px; font-size: 0.85rem;">ستحصل على مجموعة المغامر عندما تبلغ 10 وتنضم للنقابة.</p>
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
            this.showNotification("❤️ تم استعادة ص.ح!", "success");
        } else if (inv.itemId === 'mana_potion') {
            this.state.mp = this.state.maxMp;
            this.showNotification("💙 تم استعادة ط.س!", "success");
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
        let statText = Object.entries(item.stats).map(([k,v]) => `+${v} ${k.toUpperCase()}`).join(', ');
        this.showNotification(`${item.icon} ${item.name}: ${statText}`, "info");
    }
};

// ============ تبويب المهارات ============
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
                    <div class="skill-level">المستوى ${level}/${skill.maxLevel}</div>
                    <div class="skill-desc">${skill.desc}</div>
                </div>
            </div>
        `;
    });

    // عرض المهارات القابلة للتعلم
    const learnable = Object.entries(DATA.skills).filter(([id, skill]) => {
        if (skills[id]) return false;
        return Object.entries(skill.requirement).every(([stat, val]) => this.state[stat] >= val);
    });

    if (learnable.length > 0) {
        html += '<div class="section-header" style="margin-top:16px">📚 متاحة للتعلم</div>';
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
    if (this.state.guildRank >= DATA.guildRanks.length - 1 && !this.state.achievements.includes('guild_master')) {
        this.unlockAchievement('guild_master');
    }
    
    const maxedStat = ['str', 'int', 'agi', 'cha', 'lck'].some(s => this.state[s] >= 100);
    if (maxedStat && !this.state.achievements.includes('max_stat')) {
        this.unlockAchievement('max_stat');
    }
};
