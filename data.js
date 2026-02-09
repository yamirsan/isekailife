/* ============================================
   IsekaiLife - Game Data & Constants
   ============================================ */

const DATA = {
    // Random name pools - Male
    firstNamesMale: [
        // Japanese-style
        "Akira", "Haruto", "Ryu", "Kazuki", "Yuki", "Ren", "Takeshi", "Shinji", 
        "Kaito", "Sora", "Hiro", "Kenji", "Daichi", "Naoki", "Tetsu", "Shin",
        "Yuto", "Sosuke", "Kenta", "Riku", "Makoto", "Hayate", "Subaru", "Tsubasa",
        "Shota", "Yuji", "Ryota", "Masato", "Koji", "Tatsuya", "Ichiro", "Jiro",
        // Fantasy-style
        "Aiden", "Leon", "Zack", "Cloud", "Cross", "Blade", "Storm", "Rex",
        "Cain", "Abel", "Dante", "Nero", "Siegfried", "Roland", "Arthur", "Lancelot",
        "Gideon", "Marcus", "Felix", "Cedric", "Aldric", "Gareth", "Edmund", "Tristan",
        "Orion", "Cassius", "Lucius", "Maximus", "Viktor", "Alaric", "Ragnar", "Theron",
        "Zephyr", "Phoenix", "Griffin", "Drake", "Hawk", "Wolf", "Ash", "Frost"
    ],
    // Random name pools - Female
    firstNamesFemale: [
        // Japanese-style
        "Sakura", "Yui", "Hana", "Miku", "Rei", "Aoi", "Rin", "Saki",
        "Hinata", "Misaki", "Ayumi", "Natsuki", "Mio", "Yuna", "Kira", "Luna",
        "Akane", "Chihiro", "Emiko", "Fumiko", "Haruka", "Izumi", "Kaori", "Mayumi",
        "Nanami", "Reiko", "Sayuri", "Tomoko", "Yoko", "Asuka", "Hikari", "Midori",
        // Fantasy-style
        "Rose", "Lily", "Aria", "Stella", "Nova", "Crystal", "Aurora", "Seraphina",
        "Elara", "Lyra", "Celeste", "Diana", "Helena", "Iris", "Jade", "Keira",
        "Morgana", "Nadia", "Ophelia", "Petra", "Quinn", "Raven", "Selene", "Thalia",
        "Valentina", "Willow", "Xena", "Ysolde", "Zara", "Ember", "Faye", "Gwendolyn",
        "Ivy", "Jasmine", "Lavender", "Melody", "Opal", "Pearl", "Ruby", "Sapphire"
    ],
    // Last names
    lastNames: [
        // Japanese-style
        "Yamamoto", "Takahashi", "Suzuki", "Tanaka", "Watanabe", "Nakamura", 
        "Kobayashi", "Kato", "Ito", "Shimizu", "Hayashi", "Mori", "Inoue",
        "Fujita", "Okada", "Hasegawa", "Murakami", "Kondo", "Ishikawa", "Maeda",
        "Ogawa", "Yoshida", "Yamaguchi", "Matsumoto", "Kimura", "Saito", "Sasaki",
        // Fantasy-style
        "Dragonheart", "Starfall", "Nightblade", "Silvermoon", "Ironforge",
        "Flamecrest", "Stormwind", "Shadowveil", "Dawnbreak", "Frostborn",
        "Blackwood", "Goldleaf", "Whitestone", "Redmane", "Greywolf",
        "Brightblade", "Darkhollow", "Thornwood", "Riverdale", "Mountaincrest",
        "Sunfire", "Moonvale", "Winterhold", "Summerfield", "Springbrook",
        "Lionheart", "Hawkeye", "Swiftfoot", "Strongarm", "Wiseheart"
    ],

    // Death causes (in the new world)
    deathCauses: {
        child: [
            { text: "A mysterious illness claimed your young life...", emoji: "🤒" },
            { text: "A monster attack on the village... you didn't make it...", emoji: "👹" },
            { text: "A tragic accident during play...", emoji: "😢" },
            { text: "Your weak constitution couldn't handle the harsh winter...", emoji: "❄️" },
        ],
        young: [
            { text: "A dungeon exploration went horribly wrong...", emoji: "🏰" },
            { text: "You fell in battle against a powerful monster...", emoji: "⚔️" },
            { text: "A cursed artifact drained your life force...", emoji: "💀" },
            { text: "Assassins caught you off guard...", emoji: "🗡️" },
            { text: "A magical experiment backfired fatally...", emoji: "💥" },
        ],
        adult: [
            { text: "Years of adventuring finally caught up with you...", emoji: "⚰️" },
            { text: "You sacrificed yourself to save your companions...", emoji: "😇" },
            { text: "The Demon Lord's curse finally took its toll...", emoji: "😈" },
            { text: "Old wounds reopened during a fierce battle...", emoji: "🩸" },
            { text: "A dragon's breath was too much to survive...", emoji: "🐉" },
        ],
        old: [
            { text: "You passed peacefully in your sleep, surrounded by loved ones...", emoji: "😴" },
            { text: "Your legendary life came to a natural end...", emoji: "🌅" },
            { text: "You transcended to a higher plane of existence...", emoji: "✨" },
            { text: "The Goddess called you back after a life well lived...", emoji: "👼" },
        ]
    },

    // Random childhood events
    childhoodEvents: [
        { text: "Your {parent} taught you how to read today.", stat: "int", amount: 1 },
        { text: "You played with other children in the village.", stat: "cha", amount: 1 },
        { text: "Your {parent} took you to the market for the first time.", stat: "cha", amount: 1 },
        { text: "You helped with chores around the house.", stat: "str", amount: 1 },
        { text: "You caught your first fish with {parent}!", stat: "agi", amount: 1 },
        { text: "A traveling merchant gave you a lucky coin.", stat: "lck", amount: 1 },
        { text: "You learned a simple magic trick from a street performer.", stat: "int", amount: 1 },
        { text: "You got lost in the woods but found your way home.", stat: "agi", amount: 1 },
        { text: "Your {parent} told you stories about heroes of old.", stat: "int", amount: 1 },
        { text: "You made a new friend in the village.", stat: "cha", amount: 1 },
        { text: "A kind stranger healed a scrape you got while playing.", stat: "lck", amount: 1 },
        { text: "You found a shiny rock and kept it as a treasure.", stat: "lck", amount: 1 },
        { text: "You helped an elderly neighbor carry groceries.", stat: "str", amount: 1 },
        { text: "Your {parent} bought you your first wooden sword.", stat: "str", amount: 1 },
        { text: "You stayed up late reading a picture book about magic.", stat: "int", amount: 1 },
        { text: "You climbed the tallest tree in the village!", stat: "agi", amount: 2 },
        { text: "You won a children's footrace at the festival.", stat: "agi", amount: 2 },
        { text: "Your {parent} taught you basic self-defense.", stat: "str", amount: 2 },
        { text: "You befriended a stray magical creature.", stat: "lck", amount: 2 },
        { text: "An old mage noticed your potential and gave you a small blessing.", stat: "int", amount: 2 },
        // New childhood events
        { text: "You found a baby bird and nursed it back to health.", stat: "cha", amount: 1 },
        { text: "Your {parent} took you stargazing and taught you the constellations.", stat: "int", amount: 1 },
        { text: "You bravely stood up to a bully picking on younger kids.", stat: "str", amount: 2 },
        { text: "A wandering bard taught you a simple song.", stat: "cha", amount: 1 },
        { text: "You discovered you can see mana flowing in the air.", stat: "int", amount: 2 },
        { text: "Your {parent} let you help in the kitchen. You made a mess but had fun!", stat: "cha", amount: 1 },
        { text: "You found a secret hiding spot that nobody else knows about.", stat: "agi", amount: 1 },
        { text: "A fairy appeared to you in a dream and granted a tiny wish.", stat: "lck", amount: 2 },
        { text: "You practiced swinging a stick like a sword all day.", stat: "str", amount: 1 },
        { text: "Your {parent} taught you how to swim in the river.", stat: "agi", amount: 1 },
        { text: "You accidentally broke a vase but confessed honestly.", stat: "cha", amount: 1 },
        { text: "A traveling puppet show inspired you to dream big.", stat: "int", amount: 1 },
        { text: "You helped your {parent} tend to the garden.", stat: "str", amount: 1 },
        { text: "You snuck a peek at your {parent}'s old adventure journal.", stat: "int", amount: 2 },
        { text: "A rainbow appeared after the rain and you chased it!", stat: "lck", amount: 1 },
        { text: "You learned to whistle from the village elder.", stat: "cha", amount: 1 },
        { text: "Your {parent} crafted you a toy sword from wood.", stat: "str", amount: 1 },
        { text: "You found a mysterious glowing mushroom in the forest.", stat: "lck", amount: 1 },
        { text: "A kind neighbor taught you how to count coins.", stat: "int", amount: 1 },
        { text: "You won a game of hide-and-seek by hiding for three hours.", stat: "agi", amount: 2 },
    ],

    // Sibling events
    siblingEvents: [
        { text: "You trained together with your {sibling}.", stat: "str", amount: 1 },
        { text: "You and your {sibling} played hide and seek all day.", stat: "agi", amount: 1 },
        { text: "Your {sibling} helped you study.", stat: "int", amount: 1 },
        { text: "You had a fight with your {sibling}... then made up.", stat: "cha", amount: 1 },
        { text: "You and your {sibling} discovered a secret spot in the forest.", stat: "lck", amount: 1 },
        { text: "Your {sibling} gave you a lucky charm they found.", stat: "lck", amount: 2 },
        { text: "You protected your {sibling} from bullies!", stat: "str", amount: 2 },
        { text: "Your {sibling} taught you a cool magic trick.", stat: "int", amount: 2 },
        // New sibling events
        { text: "You and your {sibling} built a secret treehouse together.", stat: "str", amount: 1 },
        { text: "Your {sibling} dared you to eat a weird mushroom. Nothing bad happened!", stat: "lck", amount: 1 },
        { text: "You competed with your {sibling} to see who's faster.", stat: "agi", amount: 2 },
        { text: "Your {sibling} told you scary stories at night.", stat: "int", amount: 1 },
        { text: "You shared your dessert with your {sibling} when they were sad.", stat: "cha", amount: 2 },
        { text: "You and your {sibling} pranked the village elder together.", stat: "agi", amount: 1 },
        { text: "Your {sibling} stood up for you when you were in trouble.", stat: "cha", amount: 1 },
        { text: "You and your {sibling} found ancient coins while digging.", stat: "lck", amount: 2 },
        { text: "Your {sibling} taught you their secret technique.", stat: "str", amount: 2 },
        { text: "You helped your {sibling} with their homework.", stat: "int", amount: 1 },
        { text: "You and your {sibling} got lost but worked together to find home.", stat: "int", amount: 2 },
        { text: "Your {sibling} introduced you to their friends.", stat: "cha", amount: 1 },
    ],

    // Teen events
    teenEvents: [
        { text: "You started developing feelings for someone at school...", stat: "cha", amount: 1 },
        { text: "You won the school's sparring tournament!", stat: "str", amount: 3 },
        { text: "You pulled an all-nighter studying forbidden magic.", stat: "int", amount: 3 },
        { text: "You snuck out at night and explored the forest.", stat: "agi", amount: 2 },
        { text: "You made a bold speech that inspired your classmates.", stat: "cha", amount: 3 },
        { text: "You found a four-leaf clover while training.", stat: "lck", amount: 2 },
        { text: "A traveling knight taught you a secret technique.", stat: "str", amount: 4 },
        { text: "You discovered a talent for negotiation at the market.", stat: "cha", amount: 2 },
        { text: "You meditated under a waterfall for three days.", stat: "int", amount: 3 },
        { text: "You outran a monster and lived to tell the tale!", stat: "agi", amount: 3 },
        // New teen events
        { text: "You defended a classmate from unfair accusations.", stat: "cha", amount: 2 },
        { text: "You completed your first solo dungeon exploration!", stat: "str", amount: 3 },
        { text: "You discovered a hidden library with ancient texts.", stat: "int", amount: 4 },
        { text: "You trained so hard you collapsed, but got much stronger!", stat: "str", amount: 4 },
        { text: "A mysterious fortune teller predicted great things for you.", stat: "lck", amount: 3 },
        { text: "You learned to pick locks from a reformed thief.", stat: "agi", amount: 3 },
        { text: "Your first heartbreak taught you about life.", stat: "cha", amount: 2 },
        { text: "You stumbled upon a powerful mana crystal.", stat: "int", amount: 3 },
        { text: "You survived a week alone in the wilderness.", stat: "str", amount: 3 },
        { text: "A rival challenged you to a duel. You won!", stat: "str", amount: 4 },
        { text: "You became popular after helping organize the school festival.", stat: "cha", amount: 3 },
        { text: "You accidentally discovered a new spell!", stat: "int", amount: 4 },
        { text: "You won the archery competition at the annual festival.", stat: "agi", amount: 3 },
        { text: "A dragon flew overhead and you didn't flinch.", stat: "str", amount: 2 },
        { text: "You found a treasure map but decided to save it for later.", stat: "lck", amount: 2 },
        { text: "You mastered the art of cooking campfire meals.", stat: "int", amount: 2 },
        { text: "Your quick reflexes saved a friend from falling.", stat: "agi", amount: 3 },
        { text: "You negotiated a peace between two rival student groups.", stat: "cha", amount: 4 },
        { text: "A spirit appeared and tested your willpower. You passed!", stat: "int", amount: 3 },
        { text: "You found a rare herb that sells for a fortune.", stat: "lck", amount: 4 },
    ],

    // Adult events
    adultEvents: [
        { text: "You mentored a young adventurer.", stat: "cha", amount: 2 },
        { text: "You defeated a notorious bounty target!", stat: "str", amount: 3 },
        { text: "You deciphered an ancient magical text.", stat: "int", amount: 3 },
        { text: "You escaped an ambush through quick thinking.", stat: "agi", amount: 2 },
        { text: "Your reputation as a hero grows!", stat: "cha", amount: 3 },
        { text: "You survived a near-death experience through sheer luck.", stat: "lck", amount: 3 },
        { text: "You received a noble title for your deeds.", stat: "cha", amount: 4 },
        { text: "You mastered a legendary combat technique.", stat: "str", amount: 4 },
        { text: "You unlocked a new level of magical understanding.", stat: "int", amount: 4 },
        { text: "You trained in the mountains for a year.", stat: "str", amount: 5 },
        // New adult events
        { text: "You saved a village from a monster horde single-handedly!", stat: "str", amount: 5 },
        { text: "You were invited to teach at the Royal Academy.", stat: "int", amount: 4 },
        { text: "A legendary blacksmith crafted you a custom weapon.", stat: "str", amount: 3 },
        { text: "You negotiated a treaty between warring factions.", stat: "cha", amount: 5 },
        { text: "You found the tomb of an ancient hero and inherited their will.", stat: "lck", amount: 4 },
        { text: "You infiltrated an enemy fortress using disguise.", stat: "agi", amount: 4 },
        { text: "A king requested your presence at court.", stat: "cha", amount: 4 },
        { text: "You discovered a rare magical bloodline ability awakening!", stat: "int", amount: 5 },
        { text: "You survived a dragon's breath attack!", stat: "lck", amount: 5 },
        { text: "You broke a world record in a combat tournament.", stat: "str", amount: 5 },
        { text: "You wrote a book about your adventures that became famous.", stat: "int", amount: 3 },
        { text: "A mysterious benefactor funded your next expedition.", stat: "lck", amount: 3 },
        { text: "You trained an elite squad of warriors.", stat: "str", amount: 4 },
        { text: "You discovered the weakness of a legendary monster.", stat: "int", amount: 4 },
        { text: "Your charm convinced a dragon to become your ally!", stat: "cha", amount: 5 },
        { text: "You won the Continental Championship!", stat: "str", amount: 5 },
        { text: "You solved an ancient puzzle that stumped scholars for centuries.", stat: "int", amount: 5 },
        { text: "You dodged a surprise attack from an S-rank assassin.", stat: "agi", amount: 5 },
        { text: "Your good deed years ago came back to help you.", stat: "lck", amount: 4 },
        { text: "You established your own adventurer training school.", stat: "cha", amount: 4 },
    ],

    // Random encounter templates
    randomEncounters: [
        { text: "A traveling merchant offered you rare goods.", type: "shop" },
        { text: "You stumbled upon a hidden treasure chest!", type: "treasure" },
        { text: "A mysterious stranger challenged you to a duel!", type: "battle" },
        { text: "You found an injured adventurer on the road.", type: "rescue" },
        { text: "A group of bandits ambushed you!", type: "battle" },
        { text: "You discovered ancient ruins nearby.", type: "explore" },
        { text: "A wandering sage offered to teach you.", type: "training" },
        { text: "You encountered a rare magical creature!", type: "special" },
        { text: "A festival is being held in the nearby town!", type: "festival" },
        { text: "You heard rumors of a dungeon with great treasure.", type: "quest" },
        // New random encounters
        { text: "A lost princess asked for your help!", type: "quest" },
        { text: "You found a wishing well. Do you toss a coin?", type: "special" },
        { text: "A friendly giant offered to carry you across the mountain.", type: "special" },
        { text: "You witnessed a meteor shower with magical properties!", type: "special" },
        { text: "A retired hero recognized your potential.", type: "training" },
        { text: "You accidentally wandered into a fairy circle!", type: "special" },
        { text: "A merchant's cart broke down. He rewards you for helping.", type: "treasure" },
        { text: "You found a map leading to a pirate's treasure!", type: "quest" },
        { text: "A ghost asked you to deliver a message to their loved ones.", type: "quest" },
        { text: "You discovered a hot spring with healing properties.", type: "special" },
        { text: "A talking cat offered to guide you through a shortcut.", type: "special" },
        { text: "You stumbled upon a secret black market.", type: "shop" },
        { text: "An angel descended and blessed your weapon!", type: "special" },
        { text: "You found a stranded mermaid far from water.", type: "rescue" },
        { text: "A rival adventurer party challenged you to a competition!", type: "battle" },
        { text: "You discovered a village hidden by illusion magic.", type: "explore" },
        { text: "A storm forced you to shelter in a mysterious cave.", type: "explore" },
        { text: "You helped a lost child find their parents.", type: "rescue" },
        { text: "A legendary beast appeared but didn't attack. Strange...", type: "special" },
        { text: "You found a dungeon that resets every day!", type: "quest" },
    ],

    // Death scenarios for the opening
    deathScenarios: [
        { text: "You were walking home from work when a truck came out of nowhere...", emoji: "🚚" },
        { text: "You stayed up for 72 hours gaming and your heart gave out...", emoji: "🎮" },
        { text: "You pushed someone out of the way of a speeding car...", emoji: "🚗" },
        { text: "You slipped on a banana peel near a cliff... it was not your day.", emoji: "🍌" },
        { text: "You choked on convenience store bread while running late...", emoji: "🍞" },
        { text: "Lightning struck you while you were holding a metal umbrella...", emoji: "⚡" },
    ],

    goddessLines: [
        "A warm light envelops you...",
        "\"Welcome, lost soul. I am the Goddess Aria.\"",
        "\"Your previous life has ended, but fear not...\"",
        "\"I shall grant you a new life in the world of Aetheria!\"",
        "\"As compensation, I'll give you a special gift...\"",
        "\"Now, choose the form of your reincarnation!\""
    ],

    // Race bonuses
    raceBonuses: {
        human:     { str: 2, int: 2, agi: 2, cha: 2, lck: 2, desc: "Balanced in all things" },
        elf:       { str: 0, int: 5, agi: 3, cha: 3, lck: -1, desc: "Gifted in magic and grace" },
        beastkin:  { str: 4, int: -1, agi: 5, cha: 1, lck: 1, desc: "Wild strength and speed" },
        demon:     { str: 3, int: 3, agi: 1, cha: -2, lck: 5, desc: "Dark power flows within" },
        dragonborn:{ str: 6, int: 1, agi: -1, cha: 1, lck: 3, desc: "Ancient draconic blood" },
        angel:     { str: -1, int: 3, agi: 2, cha: 5, lck: 1, desc: "Heavenly radiance" },
    },

    // Cheat skill bonuses
    cheatSkillBonuses: {
        sword:    { str: 8, int: 0, agi: 3, cha: 0, lck: 0 },
        magic:    { str: 0, int: 10, agi: 0, cha: 0, lck: 1 },
        healing:  { str: 0, int: 4, agi: 0, cha: 4, lck: 3 },
        stealth:  { str: 2, int: 2, agi: 8, cha: -1, lck: 0 },
        charisma: { str: 0, int: 0, agi: 0, cha: 10, lck: 2 },
        luck:     { str: 0, int: 0, agi: 0, cha: 0, lck: 12 },
    },

    cheatSkillNames: {
        sword: "Divine Swordsmanship",
        magic: "Unlimited Magic",
        healing: "Saint's Blessing",
        stealth: "Shadow Arts",
        charisma: "Harem Protagonist EX",
        luck: "God's Luck",
    },

    cheatSkillDescriptions: {
        sword: "Your blade cuts through anything. +8 STR, +3 AGI",
        magic: "Infinite mana potential. +10 INT, +1 LCK",
        healing: "Heal any wound, cure any curse. +4 INT, +4 CHA, +3 LCK",
        stealth: "Move unseen, strike unheard. +2 STR, +2 INT, +8 AGI",
        charisma: "Everyone is drawn to you. +10 CHA, +2 LCK",
        luck: "The universe bends in your favor. +12 LCK",
    },

    // Titles based on level
    titles: [
        { level: 1, title: "Novice Adventurer" },
        { level: 5, title: "Apprentice Hero" },
        { level: 10, title: "Rising Star" },
        { level: 15, title: "Veteran Adventurer" },
        { level: 20, title: "Elite Fighter" },
        { level: 25, title: "Champion" },
        { level: 30, title: "Legendary Hero" },
        { level: 40, title: "Mythical Being" },
        { level: 50, title: "World's Strongest" },
        { level: 60, title: "Demigod" },
        { level: 75, title: "God Slayer" },
        { level: 99, title: "The One Above All" },
    ],

    // Party member types for random generation
    partyMemberTypes: [
        { type: "Childhood Friend", icon: "👩‍🦰", races: ["Human"] },
        { type: "Mage", icon: "🧝‍♀️", races: ["Elf", "Human"] },
        { type: "Thief", icon: "🐱", races: ["Beastkin", "Human"] },
        { type: "Maid", icon: "👧", races: ["Demon", "Human"] },
        { type: "Knight", icon: "⚔️", races: ["Human", "Dragonborn"] },
        { type: "Healer", icon: "😇", races: ["Angel", "Human", "Elf"] },
        { type: "Warrior", icon: "🧑", races: ["Human", "Beastkin"] },
        { type: "Dragon Knight", icon: "🐉", races: ["Dragonborn"] },
        { type: "Assassin", icon: "🖤", races: ["Demon", "Human"] },
        { type: "Shrine Maiden", icon: "🌸", races: ["Human", "Elf"] },
        { type: "Merchant", icon: "💰", races: ["Human"] },
        { type: "Alchemist", icon: "⚗️", races: ["Human", "Elf"] },
        { type: "Bard", icon: "🎵", races: ["Human", "Elf", "Beastkin"] },
        { type: "Summoner", icon: "✨", races: ["Demon", "Angel"] },
        { type: "Berserker", icon: "🔥", races: ["Beastkin", "Demon"] },
    ],
    
    partyMemberPersonalities: [
        "Tsundere", "Kuudere", "Genki", "Devoted", "Strict", 
        "Airhead", "Hot-blooded", "Stoic", "Mysterious", "Gentle",
        "Shy", "Bold", "Cheerful", "Serious", "Lazy", "Energetic"
    ],

    // Party member templates (fallback/preset characters)
    partyMembers: [
        { name: "Sakura", icon: "👩‍🦰", type: "Childhood Friend", race: "Human", personality: "Tsundere", baseAffection: 30 },
        { name: "Iris", icon: "🧝‍♀️", type: "Elf Mage", race: "Elf", personality: "Kuudere", baseAffection: 10 },
        { name: "Luna", icon: "🐱", type: "Cat Beastkin Thief", race: "Beastkin", personality: "Genki", baseAffection: 25 },
        { name: "Rem", icon: "👧", type: "Demon Maid", race: "Demon", personality: "Devoted", baseAffection: 40 },
        { name: "Azura", icon: "⚔️", type: "Knight Captain", race: "Human", personality: "Strict", baseAffection: 5 },
        { name: "Mira", icon: "😇", type: "Fallen Angel Healer", race: "Angel", personality: "Airhead", baseAffection: 20 },
        { name: "Kazuki", icon: "🧑", type: "Rival Hero", race: "Human", personality: "Hot-blooded", baseAffection: 15 },
        { name: "Ryuu", icon: "🐉", type: "Dragon Knight", race: "Dragonborn", personality: "Stoic", baseAffection: 10 },
        { name: "Noir", icon: "🖤", type: "Dark Assassin", race: "Demon", personality: "Mysterious", baseAffection: 5 },
        { name: "Hana", icon: "🌸", type: "Shrine Maiden", race: "Human", personality: "Gentle", baseAffection: 35 },
    ],

    // Item database
    items: {
        // Weapons
        rusty_sword: { name: "Rusty Sword", icon: "🗡️", type: "weapon", rarity: "common", desc: "A beat-up sword. Better than nothing.", stats: { str: 2 } },
        iron_sword: { name: "Iron Sword", icon: "⚔️", type: "weapon", rarity: "uncommon", desc: "A reliable iron sword.", stats: { str: 5 } },
        flame_blade: { name: "Flame Blade", icon: "🔥", type: "weapon", rarity: "rare", desc: "A sword wreathed in eternal flame.", stats: { str: 10, int: 3 } },
        holy_sword: { name: "Excalibur", icon: "✨", type: "weapon", rarity: "legendary", desc: "The legendary holy sword.", stats: { str: 25, cha: 10 } },
        shadow_dagger: { name: "Shadow Dagger", icon: "🌑", type: "weapon", rarity: "epic", desc: "Strikes from the darkness.", stats: { str: 8, agi: 12 } },
        staff_wisdom: { name: "Staff of Wisdom", icon: "🪄", type: "weapon", rarity: "epic", desc: "Amplifies magical power.", stats: { int: 15, lck: 5 } },
        
        // Armor
        leather_armor: { name: "Leather Armor", icon: "🦺", type: "armor", rarity: "common", desc: "Basic protection.", stats: { str: 1 } },
        mithril_armor: { name: "Mithril Mail", icon: "🛡️", type: "armor", rarity: "rare", desc: "Light but incredibly strong.", stats: { str: 5, agi: 3 } },
        dragon_armor: { name: "Dragon Scale Armor", icon: "🐉", type: "armor", rarity: "legendary", desc: "Forged from dragon scales.", stats: { str: 15, agi: -2, lck: 5 } },
        
        // Accessories
        luck_charm: { name: "Lucky Charm", icon: "🍀", type: "accessory", rarity: "uncommon", desc: "A four-leaf clover pendant.", stats: { lck: 5 } },
        ring_charisma: { name: "Ring of Allure", icon: "💍", type: "accessory", rarity: "rare", desc: "Makes you irresistible.", stats: { cha: 8 } },
        
        // Consumables
        health_potion: { name: "Health Potion", icon: "🧪", type: "consumable", rarity: "common", desc: "Restores HP.", stats: {} },
        mana_potion: { name: "Mana Potion", icon: "💙", type: "consumable", rarity: "common", desc: "Restores MP.", stats: {} },
        rare_candy: { name: "Stat Fruit", icon: "🍎", type: "consumable", rarity: "rare", desc: "Permanently boosts a random stat.", stats: {} },
    },

    // Skills that can be learned
    skills: {
        // Combat
        power_strike: { name: "Power Strike", icon: "⚔️", type: "combat", desc: "A powerful physical attack", maxLevel: 10, requirement: { str: 10 } },
        fireball: { name: "Fireball", icon: "🔥", type: "magic", desc: "Launches a ball of fire", maxLevel: 10, requirement: { int: 12 } },
        ice_lance: { name: "Ice Lance", icon: "❄️", type: "magic", desc: "A piercing lance of ice", maxLevel: 10, requirement: { int: 15 } },
        shadow_step: { name: "Shadow Step", icon: "🌑", type: "combat", desc: "Teleport behind your enemy", maxLevel: 5, requirement: { agi: 15 } },
        holy_light: { name: "Holy Light", icon: "✨", type: "magic", desc: "Healing and purification magic", maxLevel: 10, requirement: { int: 10, cha: 8 } },
        battle_cry: { name: "Battle Cry", icon: "📢", type: "combat", desc: "Boosts party morale", maxLevel: 5, requirement: { str: 8, cha: 10 } },
        dual_wield: { name: "Dual Wield", icon: "⚔️", type: "combat", desc: "Wield two weapons at once", maxLevel: 3, requirement: { str: 20, agi: 15 } },
        meteor_storm: { name: "Meteor Storm", icon: "☄️", type: "magic", desc: "Rain destruction from the sky", maxLevel: 5, requirement: { int: 30 } },
        divine_shield: { name: "Divine Shield", icon: "🛡️", type: "magic", desc: "An impenetrable barrier", maxLevel: 5, requirement: { int: 20, cha: 15 } },
        
        // Passive
        magic_sense: { name: "Magic Sense", icon: "👁️", type: "passive", desc: "Detect magic around you", maxLevel: 5, requirement: { int: 8 } },
        danger_sense: { name: "Danger Sense", icon: "⚠️", type: "passive", desc: "Feel incoming threats", maxLevel: 5, requirement: { agi: 10, lck: 5 } },
        charm_aura: { name: "Charm Aura", icon: "💖", type: "passive", desc: "People naturally like you", maxLevel: 5, requirement: { cha: 15 } },
    },

    // Adventurer Guild Ranks
    guildRanks: ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"],

    // ============ MOOD EVENTS - Psychological state effects ============
    moodEvents: {
        baby: [
            { text: "Your mother's warm smile fills your heart with joy.", mood: 8 },
            { text: "A scary nightmare woke you up crying.", mood: -5 },
            { text: "You played with a new toy your father gave you.", mood: 6 },
            { text: "You felt lonely when your parents were away.", mood: -4 },
        ],
        toddler: [
            { text: "You made your first friend in the village! You had a wonderful day.", mood: 10 },
            { text: "You fell and scraped your knee. You cried a lot.", mood: -6 },
            { text: "Your mother baked you delicious treats.", mood: 7 },
            { text: "Older kids bullied you.", mood: -8 },
            { text: "You saw a beautiful butterfly and chased it in the garden.", mood: 5 },
        ],
        child: [
            { text: "You won a school competition and the teacher praised you in front of everyone!", mood: 12 },
            { text: "Your best friend moved to another village.", mood: -10 },
            { text: "You discovered a secret magical place in the forest.", mood: 8 },
            { text: "You failed a test and felt disappointed.", mood: -7 },
            { text: "Your parents threw you an amazing birthday party!", mood: 15 },
            { text: "You got sick for several days and couldn't play.", mood: -6 },
        ],
        preteen: [
            { text: "You discovered a hidden talent you never knew you had!", mood: 12 },
            { text: "You felt like you don't belong to this world...", mood: -8 },
            { text: "You formed a close group of friends!", mood: 10 },
            { text: "You were treated unfairly and nobody believed you.", mood: -10 },
        ],
        teen: [
            { text: "First crush! Your heart races whenever you see them.", mood: 15 },
            { text: "Heartbreak... the person you liked doesn't feel the same.", mood: -15 },
            { text: "You achieved something in training that amazed everyone!", mood: 12 },
            { text: "You felt pressured by expectations from teachers and family.", mood: -8 },
            { text: "You spent an amazing night with friends under the stars.", mood: 10 },
            { text: "You failed an important mission and felt frustrated.", mood: -12 },
        ],
        young_adult: [
            { text: "You completed your first major quest successfully! A sense of achievement.", mood: 15 },
            { text: "You lost a tough battle and questioned your abilities.", mood: -10 },
            { text: "People are starting to know and respect you!", mood: 12 },
            { text: "Betrayal by someone you trusted.", mood: -15 },
        ],
        adult: [
            { text: "You found true meaning in your life in this world.", mood: 15 },
            { text: "Losing someone dear leaves a wound in your heart.", mood: -20 },
            { text: "You built a legendary reputation as a hero!", mood: 18 },
            { text: "War and destruction make you question the point of everything.", mood: -12 },
        ],
        mature: [
            { text: "Your accumulated wisdom grants you inner peace.", mood: 10 },
            { text: "You feel the weight of years on your body.", mood: -8 },
            { text: "A new generation of adventurers looks up to you as a role model!", mood: 12 },
        ],
        elder: [
            { text: "You sit and recall your amazing life memories with a smile.", mood: 10 },
            { text: "Friends from the past leave one after another...", mood: -15 },
            { text: "Your grandchildren fill your life with joy.", mood: 15 },
        ]
    },

    // Events triggered when mood is low
    depressionEvents: [
        "You walked alone at night, thinking about everything...",
        "You couldn't sleep from overthinking.",
        "You sat silently while others laughed around you.",
        "You lost your appetite and didn't eat anything today.",
        "You cried without a clear reason in your room.",
    ],
    
    recoveryEvents: [
        "A friend noticed your state and spent time with you. You felt better.",
        "A beautiful sunrise brought back some hope.",
        "You remembered why you started this journey and your enthusiasm returned.",
        "You helped someone in need and felt happy.",
        "You found a new hobby that reignited your passion.",
    ],

    // Location name generation parts
    locationPrefixes: {
        village: ["Little", "Peaceful", "Quiet", "Old", "New", "Hidden", "Sunny", "Misty", "Green", "Riverside", "Hillside", "Forest", "Mountain", "Eastern", "Western", "Northern", "Southern", "Cozy", "Sleepy", "Rustic", "Humble", "Tranquil", "Serene", "Quaint", "Charming", "Verdant", "Pastoral", "Lakeside", "Meadow", "Willow", "Cherry"],
        town: ["Trading", "Merchant", "Prosperous", "Bustling", "Ancient", "Frontier", "Border", "Mining", "Fishing", "Port", "Market", "Crossroad", "Free", "Holy", "Silver", "Golden", "Copper", "Bronze", "Iron", "Steel", "Crystal", "Amber", "Jade", "Pearl", "Ruby", "Sapphire", "Emerald", "Diamond"],
        city: ["Royal", "Imperial", "Grand", "Magnificent", "Eternal", "Sacred", "Blessed", "Divine", "Majestic", "Glorious", "Ancient", "Noble", "High", "Great", "Celestial", "Radiant", "Shining", "Golden", "Silver", "Crimson", "Azure", "Verdant", "Ivory", "Obsidian", "Crystal", "Mythril"],
        dungeon: ["Dark", "Cursed", "Forgotten", "Ancient", "Haunted", "Shadowy", "Twisted", "Corrupted", "Forbidden", "Endless", "Abyssal", "Infernal", "Frozen", "Burning", "Crystal", "Bone", "Blood", "Nightmare", "Chaos", "Void", "Doom", "Terror", "Wailing", "Screaming", "Silent", "Crimson"],
        forest: ["Enchanted", "Mystical", "Whispering", "Ancient", "Sacred", "Dark", "Twilight", "Moonlit", "Starlit", "Emerald", "Silver", "Golden", "Misty", "Fairy", "Spirit", "Elder", "Eternal", "Verdant", "Crystal", "Phantom", "Dreaming", "Sleeping", "Wandering", "Dancing", "Singing"],
        mountain: ["Towering", "Frozen", "Volcanic", "Sacred", "Dragon's", "Giant's", "Thunder", "Storm", "Cloud", "Heaven's", "Iron", "Crystal", "Shadow", "Sunrise", "Sunset", "Eternal", "Titan's", "Ancient", "Mystic", "Savage", "Brutal", "Majestic", "Soaring", "Windswept", "Snowcapped"],
        special: ["Floating", "Underwater", "Sky", "Spirit", "Demon", "Divine", "Void", "Chaos", "Dream", "Nightmare", "Parallel", "Lost", "Hidden", "Legendary", "Mythical", "Astral", "Celestial", "Ethereal", "Phantom", "Temporal", "Spatial", "Dimensional", "Infinite", "Eternal", "Sacred"]
    },
    
    locationNames: {
        village: ["Haven", "Glen", "Dale", "Hollow", "Meadow", "Brook", "Spring", "Crossing", "Ridge", "Hill", "Wood", "Field", "Creek", "Falls", "Grove", "Rest", "View", "Landing", "Pond", "Garden", "Orchard", "Mill", "Bridge", "Farm", "Hearth", "Homestead", "Cottage", "Thicket", "Glade", "Clearing"],
        town: ["Borough", "Burg", "Port", "Ford", "Bridge", "Gate", "Hall", "Market", "Square", "Center", "Junction", "Point", "Landing", "Harbor", "Bay", "Haven", "Watch", "Hold", "Keep", "Post", "Station", "Depot", "Exchange", "Plaza", "Quarter", "District", "Ward", "Commons", "Fairground"],
        city: ["Citadel", "Palace", "Crown", "Throne", "Spire", "Tower", "Bastion", "Fortress", "Sanctum", "Capitol", "Dominion", "Empire", "Kingdom", "Realm", "Haven", "Glory", "Radiance", "Majesty", "Splendor", "Pinnacle", "Apex", "Zenith", "Acropolis", "Metropolis", "Sovereignty"],
        dungeon: ["Labyrinth", "Catacombs", "Depths", "Abyss", "Tomb", "Crypt", "Caverns", "Ruins", "Maze", "Pit", "Lair", "Den", "Hollow", "Void", "Prison", "Sanctum", "Chasm", "Grotto", "Vault", "Chamber", "Keep", "Dungeon", "Oubliette", "Necropolis", "Mausoleum"],
        forest: ["Woods", "Grove", "Thicket", "Wilds", "Canopy", "Glade", "Sanctuary", "Heart", "Depths", "Realm", "Domain", "Expanse", "Reaches", "Shade", "Haven", "Bower", "Dell", "Copse", "Weald", "Timberland", "Woodland", "Greenwood", "Shadowwood", "Darkwood", "Deepwood"],
        mountain: ["Peak", "Summit", "Heights", "Crest", "Ridge", "Spire", "Pinnacle", "Crown", "Throne", "Pass", "Range", "Cliffs", "Highlands", "Overlook", "Ascent", "Precipice", "Bluff", "Mesa", "Plateau", "Escarpment", "Gorge", "Canyon", "Ravine", "Aerie", "Eyrie"],
        special: ["Realm", "Domain", "Dimension", "Plane", "World", "Paradise", "Sanctuary", "Nexus", "Gate", "Threshold", "Expanse", "Void", "Eternity", "Infinity", "Rift", "Portal", "Vortex", "Singularity", "Anomaly", "Breach", "Continuum", "Confluence", "Epicenter", "Wellspring"]
    },
    
    locationSuffixes: {
        village: ["of the Valley", "by the River", "in the Woods", "on the Hill", "of Serenity", "of Peace", "of Hope", "of Harmony", "of Dreams", "of the Blessed", "of the Pure", "of Tranquility", "of Joy", "of Plenty", "by the Lake", "under the Stars", "of the Morning", "of Dusk", ""],
        town: ["of Commerce", "of Travelers", "of the Crossroads", "by the Sea", "of Plenty", "of Fortune", "of the Guild", "of Merchants", "of Craftsmen", "of Adventurers", "of the Free", "of Unity", "of Prosperity", "of the People", "of Trade", "of the Realm", ""],
        city: ["of Light", "of the Sun", "of the Moon", "of Stars", "of Kings", "of Heroes", "of Legends", "of the Ancients", "of Eternity", "of Glory", "of the Divine", "of the Immortals", "of the Chosen", "of Destiny", "of Power", "of Wisdom", "of the Phoenix", ""],
        dungeon: ["of Despair", "of the Damned", "of Shadows", "of Souls", "of the Forgotten", "of Nightmares", "of Chaos", "of Death", "of Torment", "of the Lost", "of Agony", "of Madness", "of Dread", "of Horror", "of the Cursed", "of Doom", ""],
        forest: ["of Whispers", "of Dreams", "of Spirits", "of Wonder", "of Mystery", "of the Fae", "of Ancients", "of Legends", "of Shadows", "of Secrets", "of the Lost", "of Enchantment", "of the Wild", "of Life", "of the Beasts", "of Nature", ""],
        mountain: ["of the Gods", "of Thunder", "of Ice", "of Fire", "of the Dragon", "of Storms", "of the Heavens", "of Titans", "of Giants", "of Eagles", "of the Winds", "of Frost", "of Flame", "of the Ancients", "of Power", "of Solitude", ""],
        special: ["Between Worlds", "Beyond Time", "of the Void", "of Chaos", "of Order", "of the Divine", "of Eternity", "of Infinity", "of the Forgotten", "of Dreams", "of Nightmares", "of the Gods", "of Creation", "of Destruction", "of Balance", ""]
    },
    
    locationTypes: ["village", "town", "city", "dungeon", "forest", "mountain", "special"],
    
    locationTypeLabels: {
        village: ["Village", "Settlement", "Hamlet", "Community", "Township", "Homestead", "Colony", "Outpost"],
        town: ["Town", "Township", "Borough", "Trading Post", "Market Town", "Free Town", "Harbor Town", "Frontier Town"],
        city: ["City", "Capital", "Metropolis", "Kingdom", "Empire", "Dominion", "Republic", "Sovereign State"],
        dungeon: ["Dungeon", "Labyrinth", "Ruins", "Catacombs", "Underground", "Depths", "Caverns", "Tomb"],
        forest: ["Forest", "Woods", "Woodland", "Wilds", "Timberland", "Jungle", "Rainforest", "Grove"],
        mountain: ["Mountains", "Peaks", "Highlands", "Range", "Alps", "Summit", "Crags", "Ridges"],
        special: ["Realm", "Dimension", "Domain", "Land", "World", "Plane", "Territory", "Expanse"]
    },

    // Quest types
    questTypes: [
        "Slay Monsters", "Escort Mission", "Dungeon Exploration",
        "Herb Gathering", "Rescue Mission", "Boss Fight",
        "Tournament", "Investigation", "Delivery Quest",
    ],

    // Monster names by tier
    monsters: {
        weak: ["Slime", "Goblin", "Kobold", "Giant Rat", "Wild Boar", "Skeleton"],
        medium: ["Orc", "Dire Wolf", "Troll", "Harpy", "Minotaur", "Dark Mage"],
        strong: ["Dragon", "Lich", "Demon General", "Ancient Golem", "Hydra", "Phoenix"],
        boss: ["Demon Lord", "Dragon King", "World Serpent", "Chaos Entity", "Void Emperor"],
    },

    // Achievements
    achievements: {
        first_blood: { name: "First Blood", icon: "🩸", desc: "Defeat your first monster" },
        level_10: { name: "Getting Stronger", icon: "💪", desc: "Reach level 10" },
        level_25: { name: "True Hero", icon: "⚔️", desc: "Reach level 25" },
        level_50: { name: "Legendary", icon: "👑", desc: "Reach level 50" },
        rich: { name: "Dragon's Hoard", icon: "💰", desc: "Accumulate 10,000 gold" },
        popular: { name: "Beloved Hero", icon: "💕", desc: "Max out a relationship" },
        demon_lord: { name: "Demon Lord Slayer", icon: "😈", desc: "Defeat the Demon Lord" },
        harem: { name: "Harem King/Queen", icon: "👑", desc: "Have 5+ party members with 80+ affection" },
        isekai_veteran: { name: "Isekai Veteran", icon: "🌟", desc: "Reach age 50" },
        guild_master: { name: "Guild Master", icon: "🏛️", desc: "Reach SSS rank" },
        all_skills: { name: "Jack of All Trades", icon: "📚", desc: "Learn 10 skills" },
        max_stat: { name: "Beyond Limits", icon: "⭐", desc: "Max out any stat (100)" },
    },
};
