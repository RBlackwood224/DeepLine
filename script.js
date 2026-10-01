'use strict';

/* ==========================================================================
   DEEP LINE — retro arcade horgászverseny (v19)
   HTML5 Canvas + vanilla JavaScript, külső függőségek és képfájlok nélkül.

   Újdonságok a v2-ben:
     - kontroller támogatás (Gamepad API)
     - 2 játékos versus mód (közös tó, közös halak)
     - ragadozó cápa, ami a horgon lévő halra vadászik
     - körök pontcéllal, szintenként nehezedő játék + új halfajok
     - minden kifogott hal saját nevet kap (fogásnapló a végén)
     - gombnyomkodós tekerés (REEL), mint a régi atlétikás játékokban
   v3:
     - nyelvválasztó: English (alap) / Magyar / Français, ékezetes pixelfonttal
     - szünet menü: folytatás, újrakezdés, főmenü, kilépés (asztali verzió)
     - rekordok és nyelv mentése, asztali (.exe) támogatás
   v4:
     - háttérzene: külön menü / nappali / éjszakai lejátszási lista, áttűnéssel
     - könnyebb nehézség, a damil "piros zónája" figyelmeztet szakadás előtt
     - rövidebb kör, de minden fogás bónuszidőt ad (nehezebb hal = több idő)
   v6:
     - zene globálisan 20%-kal halkabb (MUSIC_MASTER), nagyobb képernyő, FULLSCREEN opció
     - automatikus méretezés: a játék minden felbontáson teljesen befér
   v7:
     - "PRESS TO JOIN" csatlakozó képernyő: mindenki azzal az eszközzel játszik, amivel belépett
   v8:
     - akár 4 játékos egy gépen (billentyűzet-oldalak + kontrollerek), saját színnel
   v9:
     - játékosnevek: beírható, vagy vicces véletlen név; mentve eszközönként
   v10:
     - ONLINE MULTIPLAYER: a host meghívó linket küld, a barátok böngészőből csatlakoznak (max. 4 fő)
   v11:
     - belépés 6 jegyű szobakóddal, szavazásos kirúgás, ping, kisebb késés (saját horog azonnal)
     - széles képernyőn a játékos-panelek a két oldalra kerülnek (2x2), nagyobb játéktér
   v12:
     - vendég mód: a COPY LINK linkjével (?guest) csak JOIN ONLINE és OPTIONS érhető el
   v13:
     - telefonos irányítás: érintéses joystick + REEL / TUG gomb, rezgés (OPTIONS-ban kapcsolható)
   v14:
     - versus meccs 3 / 5 / 7 körből, győztes koronával (a szobában is látszik)
   v15:
     - kártyák a körök között: 24 kártya (átok / előny / mindenkire)
   v16:
     - a kártyát a LEGHÁTUL ÁLLÓ választja (felzárkózás), átkot csak az előtte állókra tehet
     - telefonon nem ugrál a kép, amikor a böngésző címsora eltűnik / megjelenik
   v17:
     - halak pontjai és bónuszideje újrahangolva (nehezebb / mélyebb = többet ér)
   v18:
     - HALPAKLI: 11 különleges faj (köztük 7 új, saját képességgel) érkezik véletlen sorrendben
   v19:
     - kötélhúzás (halrablás), halom a csónakban, sirály, mystery box, palack, Golden Hour,
       vihar, kraken, díjak a meccs végén
     - OPTIONS menü: külön zene- és effekt-hangerő (mentve)
     - nyelvek: English (alap) / Français

   Felépítés:
     1.  Konfiguráció
     2.  Segédfüggvények, geometria
     3.  Canvas és paletták
     4.  Bitmap pixel font
     5.  Sprite-ok
     6.  Halfajok, becenevek
     7.  Hang
     8.  Játékállapot, játékosok
     9.  Bemenet: billentyűzet + kontroller
     10. Menü és DOM UI
     11. Háttér generálása
     12. Halak: spawn, mozgás, kapás
     13. Horog, fárasztás, tekerés, kifogás
     14. Ragadozó (cápa)
     15. Random események
     16. Effektek
     17. Rajzolás
     18. HUD frissítés
     19. Körök, szintek, játékmenet-vezérlés
     20. Fő ciklus
   ========================================================================== */


/* ==========================================================================
   1. KONFIGURÁCIÓ
   ========================================================================== */
const CONFIG = {
  // --- Körök és szintek ---
  MUSIC_MASTER: 0.8,            // a zene teljes erejének szorzója (0.8 = 20%-kal halkabb); kisebb = halkabb

  // --- csatározás és események
  STEAL_COOLDOWN: 8,            // rablási kísérlet után ennyi mp-ig nem próbálkozhat újra
  TUG_TIME: 3,                  // a kötélhúzás hossza (mp)
  TUG_OWNER_BONUS: 1.2,         // a hal gazdájának gombnyomásai ennyivel többet érnek
  SEAGULL_CHANCE: 0.3,          // ennyi eséllyel jön sirály, amikor egy hal a felszínhez ér
  SEAGULL_TIME: 1.5,            // ennyi idő alatt ér oda a sirály
  SEAGULL_SHOO: 6,              // ennyi gombnyomással lehet elhessegetni
  PILE_SLOWDOWN: 0.08,          // minden hal a csónakban ennyivel lassítja a csónakot
  PILE_MIN: 0.35,               // ennél lassabb nem lesz
  ITEM_CHANCE: 0.01,            // mystery box / palack esélye spawn-próbánként
  GOLDEN_TIME: 15,              // Golden Hour hossza (mp) – dupla pont mindenkinek
  STORM_TIME: 15,               // vihar hossza (mp)
  KRAKEN_TIME: 7,               // ennyi ideje van mindenkinek elűzni a krakent
  KRAKEN_NEED_BASE: 10,         // ennyi + játékosonként KRAKEN_NEED_PER gombnyomás kell
  KRAKEN_NEED_PER: 6,

  MATCH_ROUND_OPTIONS: [3, 5, 7],   // választható meccshossz versusban (körök)
  VOTE_TIME: 20,                // ennyi mp-ig tart egy kirúgás-szavazás
  MAX_NAME_LEN: 10,             // játékosnév maximális hossza
  MAX_LOCAL_PLAYERS: 4,         // ennyien játszhatnak egy gépen (2 billentyűzet-oldal + kontrollerek)

  ROUND_DURATION: 60,           // a kör induló ideje (mp) – minden fogás bónuszidőt ad
  TIME_MAX: 99,                 // ennél több idő nem gyűlhet össze
  CATCH_TIME_MULTIPLIER: 1.0,   // globális szorzó a fogásonkénti bónuszidőre
  LEVEL_TIME_STEP: 0.06,        // körönként 6%-kal kevesebb bónuszidő...
  LEVEL_TIME_MIN: 0.6,          // ...de legalább 60%
  TARGET_BASE: 100,             // az 1. kör pontcélja
  TARGET_STEP: 80,              // ennyivel nő a cél körönként
  TIME_BONUS_PER_SEC: 2,        // megmaradt mp-enként ennyi bónusz a kör teljesítésekor
  NIGHT_SCORE_MULTIPLIER: 1.5,  // éjszakai pontszorzó
  POINTS_MULTIPLIER: 1.0,       // globális pontszorzó

  // --- Szintenkénti nehezedés (mint a Tetrisben) ---
  LEVEL_SPEED_STEP: 0.06,       // +6% halsebesség körönként
  LEVEL_STAMINA_STEP: 0.08,     // +8% hal-stamina körönként
  LEVEL_BITE_STEP: 0.04,        // -4% kapási esély körönként...
  LEVEL_BITE_MIN: 0.55,         // ...de legalább 55%
  LEVEL_DECAY_STEP: 0.03,       // lassabban enged a damil feszülése...
  LEVEL_DECAY_MIN: 0.65,        // ...de legalább 65%
  LEVEL_PREDATOR_STEP: 0.1,     // gyakoribb és gyorsabb cápa

  // --- Halak ---
  MAX_FISH_DAY: 14,
  MAX_FISH_NIGHT: 9,
  SPAWN_INTERVAL: 0.7,
  FISH_SPEED_MULTIPLIER: 1.0,
  STAMINA_MULTIPLIER: 1.0,

  // --- Kapás ---
  BITE_CHECK_INTERVAL: 0.4,
  BITE_CHANCE_MULTIPLIER: 1.15,
  BITE_COOLDOWN: 0.7,

  // --- Ritka halak ---
  RARE_CHANCE_MULTIPLIER: 1.0,
  OLD_ONE_SPAWN_CHANCE: 0.004,
  OLD_ONE_NIGHT_FACTOR: 3,

  // --- Horog mozgás (px/mp, logikai 320x240 felbontásban) ---
  HOOK_SPEED_X: 55,
  HOOK_SPEED_DOWN: 40,
  HOOK_SPEED_UP: 60,
  HOOK_MAX_DEPTH: 0.96,
  HOOKED_MOVE_X: 18,
  REEL_SPEED_FIGHT: 18,         // felfelé nyíl nyomva tartva, amíg van ereje a halnak
  REEL_SPEED_TIRED: 55,         // felfelé nyíl, kifáradt halnál
  REEL_DRAIN: 3,
  GIVE_LINE_SPEED: 25,
  GIVE_LINE_RELIEF: 20,
  RESET_SPEED: 120,

  // --- Gombnyomkodós tekerés (REEL gomb) ---
  MASH_IMPULSE: 24,             // egy gombnyomás ennyivel növeli a tekerési sebességet
  MASH_MAX: 95,                 // maximális tekerési sebesség
  MASH_DECAY: 2,                // milyen gyorsan "fogy el" a lendület
  MASH_FIGHT_FACTOR: 0.7,       // amíg a halnak van ereje, ennyire hatékony
  MASH_TENSION_REST: 2,         // feszülés / nyomás, ha a hal pihen
  MASH_TENSION_STRUGGLE: 3,     // feszülés / nyomás, ha a hal vergődik
  MASH_DRAIN: 1,                // stamina / nyomás

  // --- Fárasztás ---
  TUG_DAMAGE: 13,
  TUG_REST_BONUS: 1.6,
  TUG_TENSION_REST: 7,
  TUG_TENSION_STRUGGLE: 14,
  TUG_SPAM_WINDOW: 0.25,
  TUG_SPAM_PENALTY: 10,
  REEL_TENSION_REST: 6,
  REEL_TENSION_STRUGGLE: 32,
  STRUGGLE_TENSION: 6,
  TENSION_DECAY: 18,
  TENSION_MAX: 100,
  SNAP_ZONE: 90,                // e fölött a damil "piros zónában" van...
  SNAP_GRACE: 0.8,              // ...és ennyi mp után elszakad, ha nem engedsz rajta
  REGEN_DELAY: 1.4,
  STRUGGLE_PULL: 1.4,           // vergődés közben ennyiszeres erővel húz a hal
  REST_PULL: 0.3,               // pihenés közben ennyivel
  SIZE_PULL_DIVIDER: 45,        // nagyobb = a nagy halakat is könnyebb felhúzni

  // --- Ragadozó cápa ---
  PREDATOR_ENABLED: true,
  PREDATOR_START_LEVEL: 2,      // ettől a körtől jelenik meg a cápa
  PREDATOR_FIRST_MIN: 20,       // a kör elején legkorábban ennyi mp múlva jön
  PREDATOR_FIRST_MAX: 45,
  PREDATOR_RETURN_MIN: 10,      // elúszás után ennyi idő múlva jöhet vissza
  PREDATOR_RETURN_MAX: 25,
  PREDATOR_SPEED: 16,           // őrjárat sebessége
  PREDATOR_HUNT_SPEED: 34,      // vadászat sebessége
  PREDATOR_HUNT_MAX: 55,        // a vadászsebesség felső határa magas szinten
  PREDATOR_PATROL_MIN: 6,
  PREDATOR_PATROL_MAX: 12,
  PREDATOR_GIVEUP: 9,           // ennyi mp sikertelen vadászat után feladja

  // --- Random események ---
  EVENT_START_DELAY: 15,
  EVENT_CHECK_INTERVAL: 1,
  EVENT_CHANCE: 0.035,
  EVENT_COOLDOWN: 20,
  FRENZY_DURATION: 10,
  FRENZY_EXTRA_FISH: 12,
  CALM_DURATION: 8,
  CALM_SPEED_FACTOR: 0.45,

  // --- Képernyő ---
  WIDTH: 320,
  HEIGHT: 240,
  SURFACE_RATIO: 0.15,
  ZONE_SHALLOW_END: 0.30,
  ZONE_MID_END: 0.65,
  MAX_DEPTH_METERS: 100
};


/* ==========================================================================
   1/B. NYELVEK (English / Français) ÉS MENTÉS
   Új szöveg felvétele: ugyanazzal a kulccsal mindhárom nyelvhez.
   A {n}, {p}, {name}, {shift} helyére érték kerül.
   ========================================================================== */
const LANGS = ['en', 'fr'];
const GAP = '\u00a0\u00a0\u00a0';   // nem törhető szóközök a vezérlés-sorokban

const I18N = {
  en: {
    p: "P", tag_p1: "P1", tag_p2: "P2", tag_p3: "P3", tag_p4: "P4",
    hud_score: "SCORE", hud_round: "ROUND", hud_target: "TARGET", hud_time: "TIME",
    mode_day: "DAY", mode_night: "NIGHT",
    subtitle: "A RETRO FISHING CONTEST",
    menu_players: "PLAYERS", menu_shift: "SHIFT", menu_lang: "LANGUAGE",
    opt_1p: "1P", opt_2p: "2P VERSUS",
    desc_1: "SOLO: REACH THE TARGET BEFORE TIME RUNS OUT.",
    desc_2: "VERSUS: FIRST TO THE TARGET WINS THE ROUND.",
    desc_day: "DAY: LOTS OF SMALL AND MEDIUM FISH.",
    desc_night: "NIGHT: FEWER FISH, BIGGER PREY, X1.5 POINTS.",
    btn_start: "START", btn_exit: "EXIT", tag_keys: "KEYS",
    join_title: "PRESS TO JOIN", join_empty: "PRESS A BUTTON TO JOIN",
    join_solo: "SOLO GAME", join_versus: "{n} PLAYER VERSUS", btn_play: "PLAY",
    join_keys: `KEYBOARD: SPACE (ARROWS) OR F (WASD)${GAP}CONTROLLER: A`,
    join_start: `ENTER / START: PLAY${GAP}PAD B: LEAVE${GAP}ESC: BACK`,
    join_names: `SPACE / F AGAIN: TYPE YOUR NAME${GAP}PAD Y: RANDOM NAME`,
    card_slow_hook: "SLOW HOOK", cardd_slow_hook: "THEIR HOOK MOVES 35% SLOWER",
    card_rusty_reel: "RUSTY REEL", cardd_rusty_reel: "THEIR REELING IS MUCH WEAKER",
    card_frayed_line: "FRAYED LINE", cardd_frayed_line: "THEIR LINE TENSES 50% FASTER",
    card_butterfingers: "BUTTERFINGERS", cardd_butterfingers: "THEIR TUGS ARE 40% WEAKER",
    card_short_line: "SHORT LINE", cardd_short_line: "THEY CAN'T REACH THE DEEP WATER",
    card_stinky_bait: "STINKY BAIT", cardd_stinky_bait: "FISH BITE HALF AS OFTEN",
    card_shark_bait: "SHARK BAIT", cardd_shark_bait: "THE SHARK COMES SOONER AND HUNTS THEM FIRST",
    card_tangled: "TANGLED", cardd_tangled: "LEFT AND RIGHT ARE SWAPPED",
    card_heavy_boat: "HEAVY BOAT", cardd_heavy_boat: "THEIR BOAT DRAGS FAR BEHIND THE HOOK",
    card_tax_man: "TAX MAN", cardd_tax_man: "THEY LOSE 20% OF THE ROUND'S POINTS",
    card_steel_line: "STEEL LINE", cardd_steel_line: "YOUR LINE TENSES 40% SLOWER",
    card_turbo_reel: "TURBO REEL", cardd_turbo_reel: "YOU REEL 50% FASTER",
    card_sharp_hook: "SHARP HOOK", cardd_sharp_hook: "FISH BITE MORE OFTEN",
    card_fish_magnet: "FISH MAGNET", cardd_fish_magnet: "FISH COME TO YOUR HOOK FROM FAR AWAY",
    card_shark_repellent: "SHARK REPELLENT", cardd_shark_repellent: "THE SHARK IGNORES YOUR FISH",
    card_lucky_lure: "LUCKY LURE", cardd_lucky_lure: "MORE RARE FISH - DOUBLE POINTS FOR YOU",
    card_big_fish_bonus: "BIG FISH BONUS", cardd_big_fish_bonus: "BIG FISH ARE WORTH DOUBLE FOR YOU",
    card_speed_boat: "SPEED BOAT", cardd_speed_boat: "YOUR HOOK AND BOAT ARE FASTER",
    card_frenzy: "FISH FRENZY", cardd_frenzy: "THE LAKE IS FULL OF SMALL FISH",
    card_night_falls: "NIGHT FALLS", cardd_night_falls: "THE NEXT ROUND IS PLAYED AT NIGHT",
    card_shark_week: "SHARK WEEK", cardd_shark_week: "THE SHARK COMES MUCH MORE OFTEN",
    card_gold_rush: "GOLD RUSH", cardd_gold_rush: "LOTS OF RARE FISH",
    card_deep_trouble: "DEEP TROUBLE", cardd_deep_trouble: "FISH HOOKED IN THE SHALLOWS SCORE NOTHING",
    card_time_crunch: "TIME CRUNCH", cardd_time_crunch: "HALF THE BONUS TIME FOR CATCHES",
    card_curse: "CURSE", card_boon: "BOON", card_global: "EVERYONE",
    card_pick_title: "{p}, PICK A CARD!", card_waiting: "{p} IS CHOOSING A CARD...",
    card_target_title: "WHO GETS THE CURSE?", 
    card_note_last: "LAST PLACE GETS THE CARD - CATCH UP!", card_time: "AUTO PICK IN {n}",
    card_keys: `←→ CHOOSE${GAP}ENTER / F / A: PICK${GAP}BACKSPACE / G / B: BACK`,
    card_applied_curse: "{p} CURSED {t}", card_applied_boon: "{p} TOOK", card_applied_global: "{p} PLAYED",
    rounds_label: "MATCH ROUNDS ←→", ban_round_of: "ROUND {n}/{m}", ban_final: "FINAL ROUND!",
    ban_round_draw: "ROUND DRAW!", ban_timeup: "TIME UP!", go_match_win: "{p} WINS THE MATCH!",
    go_sub_match: "{n} ROUND MATCH - {shift}",
    opt_vibration: "VIBRATION", opt_na: "N/A", btn_yes: "YES", btn_no: "NO", dev_touch: "TOUCH SCREEN",
    join_touch: "PHONE / TABLET: TAP AN EMPTY SLOT TO JOIN",
    btn_host: "OPEN ONLINE ROOM", btn_copy_link: "COPY LINK", btn_copy_code: "COPY CODE",
    copied: "LINK COPIED!", copied_code: "CODE COPIED!", online_code_label: "ROOM CODE",
    btn_online: "JOIN ONLINE", btn_join: "JOIN", guest_desc: "GUEST MODE - ASK THE HOST FOR THE ROOM CODE", code_title: "JOIN ONLINE", code_prompt: "ENTER THE ROOM CODE",
    code_hint: `TYPE OR PASTE THE CODE${GAP}PAD: ←→ ↑↓ A`,
    btn_vote_kick: "VOTE KICK", kick_hint: `↑↓ CHOOSE${GAP}ENTER / A: START VOTE${GAP}ESC / B: BACK`,
    vote_title: "KICK {name}?", vote_count: "YES {y}   NO {n}   NEEDED {need}   {t}S",
    vote_keys: `YES: A / ENTER / F${GAP}NO: B / BACKSPACE / G`, vote_wait: "VOTING IN PROGRESS...",
    vote_kicked: "{name} WAS KICKED", vote_failed: "KICK VOTE FAILED", net_kicked: "YOU WERE REMOVED FROM THE ROOM",
    online_code: "ROOM {code}", online_starting: "CREATING ROOM...",
    online_wait: "SEND THE LINK AND THE CODE - ONLINE: {n}",
    online_nolib: "ONLINE IS UNAVAILABLE (NO INTERNET?)",
    online_file: "ONLINE ONLY WORKS IN THE WEB VERSION (GITHUB PAGES)",
    online_err: "ONLINE ERROR: {e}", dev_net: "ONLINE PLAYER", net_you: "YOU - ONLINE", net_empty: "FREE SLOT",
    net_connecting: "CONNECTING TO THE HOST...", net_waiting: "WAITING FOR THE HOST TO START",
    net_full: "THE ROOM IS FULL", net_busy: "THE GAME HAS ALREADY STARTED", net_notfound: "ROOM NOT FOUND",
    net_hostleft: "THE HOST LEFT THE GAME", net_joined: "{name} JOINED", net_left: "{name} LEFT",
    host_paused: "HOST PAUSED", menu_title: "MENU",
    go_client_hint: `WAITING FOR THE HOST...${GAP}ESC / PAD B: LEAVE`,
    join_online: `I / PAD X: OPEN ONLINE ROOM`,
    dev_kbR: "KEYBOARD - ARROWS", dev_kbL: "KEYBOARD - WASD", dev_pad: "CONTROLLER {n}",
    ctrl_p1: `ARROWS${GAP}SPACE TUG${GAP}ENTER REEL`,
    ctrl_p2: `WASD${GAP}F TUG${GAP}G REEL`,
    ctrl_pad: `STICK${GAP}B/X TUG${GAP}A REEL${GAP}START PAUSE`,
    ctrl_mash: "MASH REEL FAST TO PULL THE FISH UP!",
    pad_none: "NO CONTROLLER FOUND - PRESS A PAD BUTTON",
    pad_one: "1 CONTROLLER CONNECTED (PAD 1 = P1)",
    pad_many: "{n} CONTROLLERS CONNECTED (PAD 1 = P1, PAD 2 = P2)",
    menu_hint: `↑↓ ←→ CHOOSE${GAP}ENTER CONFIRM`,
    help: `P / ESC PAUSE${GAP}M SOUND${GAP}STAY SHALLOW WHEN THE SHARK HUNTS!`,
    pause_title: "PAUSED", btn_resume: "RESUME", btn_restart: "RESTART", btn_menu: "MAIN MENU",
    pause_hint: "ESC / PAD START: RESUME",
    go_timeup: "TIME UP!", go_wins: "{p} WINS!", go_draw: "DRAW!",
    go_sub: "REACHED ROUND {n} - {shift}",
    stat_total: "TOTAL SCORE", stat_rounds: "ROUNDS WON", stat_caught: "FISH CAUGHT",
    stat_biggest: "BIGGEST FISH", stat_rarest: "RAREST FISH", stat_eaten: "EATEN BY SHARK",
    record_new: "NEW HIGH SCORE!", record_best: "BEST {n}",
    log_title: "CATCH LOG", log_title_p: "{p} CATCH LOG", log_empty: "NO FISH CAUGHT",
    btn_again: "PLAY AGAIN",
    go_hint: `ENTER / PAD A: PLAY AGAIN${GAP}ESC / PAD BACK: MENU`,
    panel_depth: "DEPTH", panel_fish: "FISH", panel_rpts: "ROUND PTS",
    m_stamina: "STAMINA", m_tension: "LINE TENSION", m_reel: "REEL POWER",
    no_fish: "NO FISH ON LINE", line_lost: "LINE LOST",
    st_break: "LINE BREAKING! EASE OFF!", st_shark: "SHARK! GO SHALLOW!", st_tired: "EXHAUSTED! REEL IN",
    st_struggle: "STRUGGLING!", st_rest: "RESTING - TUG NOW",
    zone_shallow: "SHALLOW", zone_mid: "MID", zone_deep: "DEEP",
    ban_old: "SOMETHING MOVES BELOW...", ban_legend: "LEGENDARY CATCH!", ban_rare: "RARE CATCH!",
    ban_snap: "LINE SNAPPED!", ban_snap_p: "{p} LINE SNAPPED!", ban_shark: "SHARK INCOMING!",
    ban_frenzy: "FISH FRENZY!", ban_calm: "CALM WATER",
    ban_round: "ROUND {n}", ban_target: "TARGET {n}", ban_newfish: "NEW FISH: {name}",
    ban_tougher: "FISH GET TOUGHER!", ban_clear: "ROUND {n} CLEAR!",
    ban_winround: "{p} WINS ROUND {n}!", ban_bonus: "TIME BONUS +{n}",
    pop_time: "+{n} SEC", pop_tired: "TIRED!", pop_legend: "LEGENDARY!", pop_eaten: "EATEN!",
    pop_sound_on: "SOUND ON", pop_sound_off: "SOUND OFF",
    ev_frenzy: "FRENZY", ev_calm: "CALM", shark: "SHARK",
    btn_options: "OPTIONS", opt_title: "OPTIONS", opt_music: "MUSIC", opt_sfx: "SOUND EFFECTS",
    opt_fullscreen: "FULLSCREEN", opt_on: "ON", opt_off: "OFF",
    btn_back: "BACK", opt_hint: `↑↓ SELECT${GAP}←→ ADJUST${GAP}ESC BACK`,
    fish_minnow: "MINNOW", fish_perch: "PERCH", fish_puffer: "PUFFER", fish_bass: "BASS",
    fish_needle: "NEEDLEFISH", fish_eel: "EEL", fish_squid: "GLOW SQUID", fish_angler: "ANGLER",
    fish_goldfin: "GOLDFIN", fish_koi: "CRYSTAL KOI", fish_oldone: "THE OLD ONE",
    fish_piranha: "PIRANHA", fish_flying: "FLYING FISH", fish_zapper: "ELECTRIC EEL", fish_octopus: "OCTOPUS",
    fish_ghost: "GHOST FISH", fish_swordfish: "SWORDFISH", fish_stonefish: "STONEFISH",
    pop_bait_stolen: "BAIT STOLEN!", pop_rebait: "NEW BAIT", pop_zap: "ZAP!", pop_line_cut: "LINE CUT!",
    fish_crate: "MYSTERY BOX", fish_bottle: "BOTTLE",
    ban_tug: "TUG OF WAR!", pop_stolen: "STOLEN!", pop_defended: "DEFENDED!", pop_mash: "MASH REEL!",
    pop_seagull: "SEAGULL!", pop_shoo: "SHOO!", pop_gull_stole: "THE SEAGULL STOLE IT!",
    item_crate: "MYSTERY BOX!", item_jackpot: "JACKPOT +{n}", item_time: "BONUS TIME +{n}S",
    item_boot: "JUST AN OLD BOOT...", item_bottle: "MESSAGE IN A BOTTLE:",
    ban_golden: "GOLDEN HOUR! DOUBLE POINTS", ev_golden: "GOLDEN HOUR", ban_storm: "STORM!", ev_storm: "STORM",
    ban_kraken: "KRAKEN!", ban_kraken_mash: "EVERYONE MASH REEL!", ban_kraken_win: "KRAKEN DEFEATED!",
    ban_kraken_lose: "THE KRAKEN TOOK IT!",
    aw_title: "AWARDS", aw_hint: "ENTER / A: SKIP",
    aw_big: "BIG CATCH", aw_shark: "SHARK'S FAVOURITE SNACK", aw_butter: "BUTTERFINGERS",
    aw_gull: "SEAGULL'S BEST FRIEND", aw_thief: "MASTER THIEF", aw_treasure: "TREASURE HUNTER",
    aw_patient: "THE PATIENT ONE", aw_v_times: "{n}X", aw_v_secs: "{n} SEC", aw_v_kg: "{n} KG",
    no_bait: "NO BAIT - REEL UP TO THE SURFACE"
  },

  fr: {
    p: "J", tag_p1: "J1", tag_p2: "J2", tag_p3: "J3", tag_p4: "J4",
    hud_score: "SCORE", hud_round: "MANCHE", hud_target: "OBJECTIF", hud_time: "TEMPS",
    mode_day: "JOUR", mode_night: "NUIT",
    subtitle: "UN CONCOURS DE PÊCHE RÉTRO",
    menu_players: "JOUEURS", menu_shift: "MOMENT", menu_lang: "LANGUE",
    opt_1p: "1J", opt_2p: "2J DUEL",
    desc_1: "SOLO : ATTEINS L'OBJECTIF AVANT LA FIN DU TEMPS.",
    desc_2: "DUEL : LE PREMIER À L'OBJECTIF GAGNE LA MANCHE.",
    desc_day: "JOUR : BEAUCOUP DE PETITS ET MOYENS POISSONS.",
    desc_night: "NUIT : MOINS DE POISSONS, PLUS GROSSES PRISES, POINTS X1,5.",
    btn_start: "JOUER", btn_exit: "QUITTER", tag_keys: "CLAVIER",
    join_title: "APPUIE POUR REJOINDRE", join_empty: "APPUIE SUR UN BOUTON",
    join_solo: "PARTIE SOLO", join_versus: "VERSUS À {n} JOUEURS", btn_play: "JOUER",
    join_keys: `CLAVIER : ESPACE (FLÈCHES) OU F (ZQSD)${GAP}MANETTE : A`,
    join_start: `ENTRÉE / START : JOUER${GAP}MANETTE B : QUITTER${GAP}ÉCHAP : RETOUR`,
    join_names: `ESPACE / F ENCORE : TON NOM${GAP}MANETTE Y : NOM AU HASARD`,
    card_slow_hook: "HAMEÇON LENT", cardd_slow_hook: "SON HAMEÇON BOUGE 35% PLUS LENTEMENT",
    card_rusty_reel: "MOULINET ROUILLÉ", cardd_rusty_reel: "IL MOULINE BEAUCOUP MOINS BIEN",
    card_frayed_line: "FIL USÉ", cardd_frayed_line: "SON FIL SE TEND 50% PLUS VITE",
    card_butterfingers: "MAINS DE BEURRE", cardd_butterfingers: "SES FERRAGES SONT 40% PLUS FAIBLES",
    card_short_line: "FIL COURT", cardd_short_line: "IL N'ATTEINT PAS LE FOND",
    card_stinky_bait: "APPÂT PUANT", cardd_stinky_bait: "LES POISSONS MORDENT DEUX FOIS MOINS",
    card_shark_bait: "APPÂT À REQUIN", cardd_shark_bait: "LE REQUIN ARRIVE PLUS TÔT ET LE CHASSE EN PREMIER",
    card_tangled: "EMMÊLÉ", cardd_tangled: "GAUCHE ET DROITE SONT INVERSÉES",
    card_heavy_boat: "BATEAU LOURD", cardd_heavy_boat: "SON BATEAU TRAÎNE LOIN DERRIÈRE",
    card_tax_man: "PERCEPTEUR", cardd_tax_man: "IL PERD 20% DES POINTS DE LA MANCHE",
    card_steel_line: "FIL D'ACIER", cardd_steel_line: "TON FIL SE TEND 40% MOINS VITE",
    card_turbo_reel: "TURBO MOULINET", cardd_turbo_reel: "TU MOULINES 50% PLUS VITE",
    card_sharp_hook: "HAMEÇON AFFÛTÉ", cardd_sharp_hook: "LES POISSONS MORDENT PLUS SOUVENT",
    card_fish_magnet: "AIMANT À POISSONS", cardd_fish_magnet: "LES POISSONS VIENNENT DE LOIN",
    card_shark_repellent: "ANTI-REQUIN", cardd_shark_repellent: "LE REQUIN IGNORE TES POISSONS",
    card_lucky_lure: "LEURRE CHANCEUX", cardd_lucky_lure: "PLUS DE POISSONS RARES - POINTS X2 POUR TOI",
    card_big_fish_bonus: "BONUS GROS POISSON", cardd_big_fish_bonus: "LES GROS POISSONS VALENT DOUBLE POUR TOI",
    card_speed_boat: "HORS-BORD", cardd_speed_boat: "TON HAMEÇON ET TON BATEAU SONT PLUS RAPIDES",
    card_frenzy: "FRÉNÉSIE", cardd_frenzy: "LE LAC EST PLEIN DE PETITS POISSONS",
    card_night_falls: "LA NUIT TOMBE", cardd_night_falls: "LA PROCHAINE MANCHE SE JOUE LA NUIT",
    card_shark_week: "SEMAINE DU REQUIN", cardd_shark_week: "LE REQUIN VIENT BIEN PLUS SOUVENT",
    card_gold_rush: "RUÉE VERS L'OR", cardd_gold_rush: "BEAUCOUP DE POISSONS RARES",
    card_deep_trouble: "GROS PROBLÈME", cardd_deep_trouble: "LES POISSONS PRIS EN SURFACE NE RAPPORTENT RIEN",
    card_time_crunch: "COURSE CONTRE LA MONTRE", cardd_time_crunch: "MOITIÉ MOINS DE TEMPS BONUS",
    card_curse: "MALÉDICTION", card_boon: "BONUS", card_global: "POUR TOUS",
    card_pick_title: "{p}, CHOISIS UNE CARTE !", card_waiting: "{p} CHOISIT UNE CARTE...",
    card_target_title: "QUI SUBIT LA MALÉDICTION ?", 
    card_note_last: "LE DERNIER CHOISIT UNE CARTE - RATTRAPE-LES !", card_time: "CHOIX AUTO DANS {n}",
    card_keys: `←→ CHOISIR${GAP}ENTRÉE / F / A : PRENDRE${GAP}RETOUR / G / B : ANNULER`,
    card_applied_curse: "{p} MAUDIT {t}", card_applied_boon: "{p} PREND", card_applied_global: "{p} JOUE",
    rounds_label: "MANCHES DU MATCH ←→", ban_round_of: "MANCHE {n}/{m}", ban_final: "DERNIÈRE MANCHE !",
    ban_round_draw: "MANCHE NULLE !", ban_timeup: "TEMPS ÉCOULÉ !", go_match_win: "{p} GAGNE LE MATCH !",
    go_sub_match: "MATCH EN {n} MANCHES - {shift}",
    opt_vibration: "VIBRATION", opt_na: "N/D", btn_yes: "OUI", btn_no: "NON", dev_touch: "ÉCRAN TACTILE",
    join_touch: "TÉLÉPHONE / TABLETTE : TOUCHE UNE PLACE LIBRE",
    btn_host: "OUVRIR UN SALON EN LIGNE", btn_copy_link: "COPIER LE LIEN", btn_copy_code: "COPIER LE CODE",
    copied: "LIEN COPIÉ !", copied_code: "CODE COPIÉ !", online_code_label: "CODE DU SALON",
    btn_online: "JOUER EN LIGNE", btn_join: "REJOINDRE", guest_desc: "MODE INVITÉ - DEMANDE LE CODE DU SALON À L'HÔTE", code_title: "JOUER EN LIGNE", code_prompt: "ENTRE LE CODE DU SALON",
    code_hint: `TAPE OU COLLE LE CODE${GAP}MANETTE : ←→ ↑↓ A`,
    btn_vote_kick: "VOTE D'EXCLUSION", kick_hint: `↑↓ CHOISIR${GAP}ENTRÉE / A : VOTER${GAP}ÉCHAP / B : RETOUR`,
    vote_title: "EXCLURE {name} ?", vote_count: "OUI {y}   NON {n}   REQUIS {need}   {t}S",
    vote_keys: `OUI : A / ENTRÉE / F${GAP}NON : B / RETOUR ARRIÈRE / G`, vote_wait: "VOTE EN COURS...",
    vote_kicked: "{name} A ÉTÉ EXCLU", vote_failed: "VOTE D'EXCLUSION ÉCHOUÉ", net_kicked: "TU AS ÉTÉ EXCLU DU SALON",
    online_code: "SALON {code}", online_starting: "CRÉATION DU SALON...",
    online_wait: "ENVOIE LE LIEN ET LE CODE - EN LIGNE : {n}",
    online_nolib: "EN LIGNE INDISPONIBLE (PAS D'INTERNET ?)",
    online_file: "LE JEU EN LIGNE MARCHE SUR LA VERSION WEB (GITHUB PAGES)",
    online_err: "ERREUR EN LIGNE : {e}", dev_net: "JOUEUR EN LIGNE", net_you: "TOI - EN LIGNE", net_empty: "PLACE LIBRE",
    net_connecting: "CONNEXION À L'HÔTE...", net_waiting: "EN ATTENTE DE L'HÔTE",
    net_full: "LE SALON EST COMPLET", net_busy: "LA PARTIE A DÉJÀ COMMENCÉ", net_notfound: "SALON INTROUVABLE",
    net_hostleft: "L'HÔTE A QUITTÉ LA PARTIE", net_joined: "{name} EST LÀ", net_left: "{name} EST PARTI",
    host_paused: "PAUSE DE L'HÔTE", menu_title: "MENU",
    go_client_hint: `EN ATTENTE DE L'HÔTE...${GAP}ÉCHAP / MANETTE B : QUITTER`,
    join_online: `I / MANETTE X : OUVRIR UN SALON`,
    dev_kbR: "CLAVIER - FLÈCHES", dev_kbL: "CLAVIER - ZQSD", dev_pad: "MANETTE {n}",
    ctrl_p1: `FLÈCHES${GAP}ESPACE FERRER${GAP}ENTRÉE MOULINER`,
    ctrl_p2: `ZQSD${GAP}F FERRER${GAP}G MOULINER`,
    ctrl_pad: `STICK${GAP}B/X FERRER${GAP}A MOULINER${GAP}START PAUSE`,
    ctrl_mash: "MARTÈLE MOULINER POUR REMONTER LE POISSON !",
    pad_none: "AUCUNE MANETTE - APPUIE SUR UN BOUTON",
    pad_one: "1 MANETTE CONNECTÉE (MANETTE 1 = J1)",
    pad_many: "{n} MANETTES CONNECTÉES (MANETTE 1 = J1, MANETTE 2 = J2)",
    menu_hint: `↑↓ ←→ CHOISIR${GAP}ENTRÉE VALIDER`,
    help: `P / ÉCHAP PAUSE${GAP}M SON${GAP}RESTE EN SURFACE QUAND LE REQUIN CHASSE !`,
    pause_title: "PAUSE", btn_resume: "REPRENDRE", btn_restart: "RECOMMENCER", btn_menu: "MENU PRINCIPAL",
    pause_hint: "ÉCHAP / START : REPRENDRE",
    go_timeup: "TEMPS ÉCOULÉ !", go_wins: "{p} GAGNE !", go_draw: "ÉGALITÉ !",
    go_sub: "MANCHE ATTEINTE : {n} - {shift}",
    stat_total: "SCORE TOTAL", stat_rounds: "MANCHES GAGNÉES", stat_caught: "POISSONS PÊCHÉS",
    stat_biggest: "PLUS GROS POISSON", stat_rarest: "POISSON LE PLUS RARE", stat_eaten: "MANGÉS PAR LE REQUIN",
    record_new: "NOUVEAU RECORD !", record_best: "RECORD {n}",
    log_title: "CARNET DE PÊCHE", log_title_p: "CARNET DE {p}", log_empty: "AUCUNE PRISE",
    btn_again: "REJOUER",
    go_hint: `ENTRÉE / MANETTE A : REJOUER${GAP}ÉCHAP / BACK : MENU`,
    panel_depth: "PROF.", panel_fish: "POISSONS", panel_rpts: "PTS MANCHE",
    m_stamina: "ENDURANCE", m_tension: "TENSION DU FIL", m_reel: "FORCE MOULINET",
    no_fish: "AUCUN POISSON", line_lost: "FIL PERDU",
    st_break: "LE FIL VA CASSER ! LÂCHE !", st_shark: "REQUIN ! REMONTE !", st_tired: "ÉPUISÉ ! MOULINE !",
    st_struggle: "IL SE DÉBAT !", st_rest: "AU REPOS - FERRE !",
    zone_shallow: "SURFACE", zone_mid: "MILIEU", zone_deep: "FOND",
    ban_old: "QUELQUE CHOSE BOUGE EN BAS...", ban_legend: "PRISE LÉGENDAIRE !", ban_rare: "PRISE RARE !",
    ban_snap: "FIL CASSÉ !", ban_snap_p: "{p} : FIL CASSÉ !", ban_shark: "ALERTE REQUIN !",
    ban_frenzy: "FRÉNÉSIE !", ban_calm: "EAU CALME",
    ban_round: "MANCHE {n}", ban_target: "OBJECTIF {n}", ban_newfish: "NOUVEAU : {name}",
    ban_tougher: "LES POISSONS RÉSISTENT !", ban_clear: "MANCHE {n} RÉUSSIE !",
    ban_winround: "{p} GAGNE LA MANCHE {n} !", ban_bonus: "BONUS TEMPS +{n}",
    pop_time: "+{n} S", pop_tired: "ÉPUISÉ !", pop_legend: "LÉGENDAIRE !", pop_eaten: "DÉVORÉ !",
    pop_sound_on: "SON ACTIVÉ", pop_sound_off: "SON COUPÉ",
    ev_frenzy: "FRÉNÉSIE", ev_calm: "CALME", shark: "REQUIN",
    btn_options: "OPTIONS", opt_title: "OPTIONS", opt_music: "MUSIQUE", opt_sfx: "EFFETS SONORES",
    opt_fullscreen: "PLEIN ÉCRAN", opt_on: "OUI", opt_off: "NON",
    btn_back: "RETOUR", opt_hint: `↑↓ CHOISIR${GAP}←→ RÉGLER${GAP}ÉCHAP RETOUR`,
    fish_minnow: "VAIRON", fish_perch: "PERCHE", fish_puffer: "POISSON-GLOBE", fish_bass: "BAR",
    fish_needle: "ORPHIE", fish_eel: "ANGUILLE", fish_squid: "CALMAR LUMINEUX", fish_angler: "BAUDROIE",
    fish_goldfin: "POISSON D'OR", fish_koi: "KOÏ DE CRISTAL", fish_oldone: "L'ANCIEN",
    fish_piranha: "PIRANHA", fish_flying: "POISSON VOLANT", fish_zapper: "ANGUILLE ÉLECTRIQUE", fish_octopus: "POULPE",
    fish_ghost: "POISSON FANTÔME", fish_swordfish: "ESPADON", fish_stonefish: "POISSON-PIERRE",
    pop_bait_stolen: "APPÂT VOLÉ !", pop_rebait: "NOUVEL APPÂT", pop_zap: "ZAP !", pop_line_cut: "FIL COUPÉ !",
    fish_crate: "CAISSE MYSTÈRE", fish_bottle: "BOUTEILLE",
    ban_tug: "TIR À LA CORDE !", pop_stolen: "VOLÉ !", pop_defended: "DÉFENDU !", pop_mash: "MARTÈLE !",
    pop_seagull: "MOUETTE !", pop_shoo: "OUSTE !", pop_gull_stole: "LA MOUETTE L'A VOLÉ !",
    item_crate: "CAISSE MYSTÈRE !", item_jackpot: "JACKPOT +{n}", item_time: "TEMPS BONUS +{n}S",
    item_boot: "JUSTE UNE VIEILLE BOTTE...", item_bottle: "MESSAGE DANS UNE BOUTEILLE :",
    ban_golden: "HEURE DORÉE ! POINTS X2", ev_golden: "HEURE DORÉE", ban_storm: "TEMPÊTE !", ev_storm: "TEMPÊTE",
    ban_kraken: "KRAKEN !", ban_kraken_mash: "TOUT LE MONDE MARTÈLE !", ban_kraken_win: "KRAKEN VAINCU !",
    ban_kraken_lose: "LE KRAKEN L'A PRIS !",
    aw_title: "RÉCOMPENSES", aw_hint: "ENTRÉE / A : PASSER",
    aw_big: "LA GROSSE PRISE", aw_shark: "LE CASSE-CROÛTE DU REQUIN", aw_butter: "MAINS DE BEURRE",
    aw_gull: "LE COPAIN DE LA MOUETTE", aw_thief: "MAÎTRE VOLEUR", aw_treasure: "CHASSEUR DE TRÉSORS",
    aw_patient: "LE PLUS PATIENT", aw_v_times: "{n}X", aw_v_secs: "{n} S", aw_v_kg: "{n} KG",
    no_bait: "PLUS D'APPÂT - REMONTE À LA SURFACE"
  }
};

// Tartós mentés (böngészőben és az .exe-ben is megmarad)
const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('deepline.' + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem('deepline.' + key, JSON.stringify(value));
    } catch (e) {
      // ha a mentés nem elérhető, a játék attól még fut
    }
  }
};

let lang = LANGS.includes(Store.get('lang', 'en')) ? Store.get('lang', 'en') : 'en';

// Hangerő-beállítások (0..1), mentve
const settings = Object.assign({ music: 0.6, sfx: 0.8, vibrate: true }, Store.get('volume', {}));

// Egyszeri visszaállítás: a zene új hangerő-skálájánál mindenki 60%-ról indul
if (Store.get('volumeVersion', 1) < 2) {
  settings.music = 0.6;
  Store.set('volume', settings);
  Store.set('volumeVersion', 2);
}

function t(key, vars) {
  let s = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  if (vars) {
    for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(vars[k]);
  }
  return s;
}

const fishName = (key) => t('fish_' + key);
const pLabel = (index) => t('p') + (index + 1);
// A játékos neve (ha nincs, akkor P1, P2 ...)
// Az előző meccs győztese (korona) – csak versusban
const hasCrown = (p) => !!(p && p.device && game.crownDev && p.device === game.crownDev && game.numPlayers > 1);
const playerName = (index) => (game.players[index] && game.players[index].name) || pLabel(index);


/* ==========================================================================
   2. SEGÉDFÜGGVÉNYEK, GEOMETRIA
   ========================================================================== */
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = (n, len) => String(Math.max(0, Math.floor(n))).padStart(len, '0');
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

function pickWeighted(entries) {
  let total = 0;
  for (const [, w] of entries) total += w;
  if (total <= 0) return entries[0][0];
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

const W = CONFIG.WIDTH;
const H = CONFIG.HEIGHT;
const SURFACE_Y = Math.round(H * CONFIG.SURFACE_RATIO);
const WATER_H = H - SURFACE_Y;
const ZONE_Y1 = SURFACE_Y + WATER_H * CONFIG.ZONE_SHALLOW_END;
const ZONE_Y2 = SURFACE_Y + WATER_H * CONFIG.ZONE_MID_END;
const HOOK_MIN_Y = SURFACE_Y + 3;
const HOOK_MAX_Y = SURFACE_Y + WATER_H * CONFIG.HOOK_MAX_DEPTH;

const depthToY = (frac) => SURFACE_Y + WATER_H * frac;
const yToDepthFrac = (y) => clamp((y - SURFACE_Y) / WATER_H, 0, 1);

function seabedHeight(x) {
  return 4 + Math.round(1.5 * Math.sin(x * 0.19) + 1.5 * Math.sin(x * 0.061 + 2));
}


/* ==========================================================================
   3. CANVAS ÉS PALETTÁK
   ========================================================================== */
const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const bgCanvas = document.createElement('canvas');
bgCanvas.width = W;
bgCanvas.height = H;
const bgCtx = bgCanvas.getContext('2d');

const darkCanvas = document.createElement('canvas');
darkCanvas.width = W;
darkCanvas.height = H;
const darkCtx = darkCanvas.getContext('2d');

const PALETTES = {
  day: {
    sky: ['#5ab4ec', '#72c2f2', '#8dd0f6', '#a9defa'],
    hills: '#2d6a4e',
    water: ['#35a2d6', '#2b90c4', '#227eb1', '#1b6c9d', '#145a88', '#0f4971',
            '#0b395b', '#082a46', '#051d32', '#031221'],
    zoneLine: 'rgba(255,255,255,0.22)',
    label: '#a8dcff',
    sand: '#86703f', sandTop: '#b39656', rock: '#4f5563',
    weed: ['#2b873b', '#3fa24c'],
    surface: '#dff6ff', foam: '#ffffff'
  },
  night: {
    sky: ['#03030b', '#060919', '#0a0f26', '#0f1736'],
    hills: '#08111d',
    water: ['#1a385a', '#16304e', '#122842', '#0e2136', '#0b1a2c', '#081422',
            '#060f19', '#040a11', '#03060b', '#010306'],
    zoneLine: 'rgba(140,170,255,0.14)',
    label: '#44628a',
    sand: '#272116', sandTop: '#372f1f', rock: '#1a1c24',
    weed: ['#0f3528', '#164637'],
    surface: '#6e92c0', foam: '#a9c4e8'
  }
};


/* ==========================================================================
   4. BITMAP PIXEL FONT (3x5)
   ========================================================================== */
const FONT = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
  I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100110101010', 7: '111001010010010',
  8: '010101010101010', 9: '010101011001110',
  ' ': '000000000000000', '+': '000010111010000', '-': '000000111000000',
  '!': '010010010000010', '.': '000000000000010', ':': '000010000010000',
  '?': '110001010000010', "'": '010010000000000', '/': '001001010100100',
  ',': '000000000010100', '%': '101001010100101',
  '<': '001010100010001', '>': '100010001010100'
};

const textWidth = (text, scale = 1) => String(text).length * 4 * scale - scale;

// Ékezetek: alapbetű + néhány pixel a betű fölött (-2/-1. sor) vagy alatta (5. sor)
const ACCENT_PIXELS = {
  acute:  [[2, -2], [1, -1]],
  grave:  [[0, -2], [1, -1]],
  circ:   [[1, -2], [0, -1], [2, -1]],
  umlaut: [[0, -1], [2, -1]],
  dacute: [[0, -2], [0, -1], [2, -2], [2, -1]],
  cedil:  [[1, 5]]
};
const ACCENTED = {
  'Á': ['A', 'acute'], 'É': ['E', 'acute'], 'Í': ['I', 'acute'], 'Ó': ['O', 'acute'], 'Ú': ['U', 'acute'],
  'Ö': ['O', 'umlaut'], 'Ü': ['U', 'umlaut'], 'Ő': ['O', 'dacute'], 'Ű': ['U', 'dacute'],
  'À': ['A', 'grave'], 'È': ['E', 'grave'], 'Ù': ['U', 'grave'],
  'Â': ['A', 'circ'], 'Ê': ['E', 'circ'], 'Î': ['I', 'circ'], 'Ô': ['O', 'circ'], 'Û': ['U', 'circ'],
  'Ë': ['E', 'umlaut'], 'Ï': ['I', 'umlaut'], 'Ÿ': ['Y', 'umlaut'], 'Ç': ['C', 'cedil']
};

function drawTextRaw(g, str, x, y, scale, color) {
  g.fillStyle = color;
  for (let i = 0; i < str.length; i++) {
    let ch = str[i];
    let accent = null;
    if (ACCENTED[ch]) {
      accent = ACCENT_PIXELS[ACCENTED[ch][1]];
      ch = ACCENTED[ch][0];
    }
    const glyph = FONT[ch] || FONT['?'];
    const ox = x + i * 4 * scale;
    for (let p = 0; p < 15; p++) {
      if (glyph[p] === '1') g.fillRect(ox + (p % 3) * scale, y + Math.floor(p / 3) * scale, scale, scale);
    }
    if (accent) {
      for (const [ax, ay] of accent) g.fillRect(ox + ax * scale, y + ay * scale, scale, scale);
    }
  }
}

function drawText(g, text, x, y, scale = 1, color = '#fff', align = 'left', shadow = true) {
  const str = String(text).toUpperCase().replace(/Œ/g, 'OE');
  const width = textWidth(str, scale);
  let sx = x;
  if (align === 'center') sx = x - width / 2;
  else if (align === 'right') sx = x - width;
  sx = Math.round(sx);
  const sy = Math.round(y);
  if (shadow) drawTextRaw(g, str, sx + scale, sy + scale, scale, '#000');
  drawTextRaw(g, str, sx, sy, scale, color);
}


/* ==========================================================================
   5. SPRITE-OK
   ========================================================================== */
function buildSprite(rows, colors) {
  const h = rows.length;
  const w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch !== '.' && colors[ch]) {
        g.fillStyle = colors[ch];
        g.fillRect(x, y, 1, 1);
      }
    }
  }
  return c;
}

// THE OLD ONE – programból generált nagy sprite
function buildOldOneRows() {
  const SW = 44, SH = 18;
  const rows = [];
  for (let y = 0; y < SH; y++) {
    let row = '';
    for (let x = 0; x < SW; x++) {
      let ch = '.';
      const dx = (x - 26) / 17;
      const dy = (y - 9) / 7.5;
      const inBody = dx * dx + dy * dy <= 1;
      if (inBody) ch = y >= 12 ? 's' : 'a';
      if (x <= 10) {
        const half = 1.5 + (10 - x) * 0.55;
        const dist = Math.abs(y - 9);
        if (dist <= half && dist >= (10 - x) * 0.2) ch = 'c';
      }
      if ((y === 1 || y === 2) && x >= 18 && x <= 30) ch = 'b';
      if (y === 0 && x >= 22 && x <= 27) ch = 'b';
      if ((y === 12 || y === 13) && x >= 24 && x <= 27) ch = 'b';
      if (ch === 'a' && (x * 7 + y * 13) % 23 === 0) ch = 'b';
      if (y === 11 && x >= 33 && x <= 42 && inBody) ch = 'b';
      if (y === 12 && x >= 34 && x <= 41 && x % 2 === 0 && inBody) ch = 'w';
      if ((x === 36 || x === 37) && y === 6) ch = 'e';
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

// A ragadozó cápa sprite-ja (32x12), szintén generálva
function buildSharkRows() {
  const SW = 32, SH = 12;
  const rows = [];
  for (let y = 0; y < SH; y++) {
    let row = '';
    for (let x = 0; x < SW; x++) {
      let ch = '.';
      const dx = (x - 18) / 13;
      const dy = (y - 6) / 4.2;
      const inBody = dx * dx + dy * dy <= 1;
      if (inBody) ch = y >= 7 ? 's' : 'a';
      if (x <= 6) {
        const half = (6 - x) * 0.9 + 0.5;
        const dist = Math.abs(y - 6);
        if (dist <= half && dist >= (6 - x) * 0.35) ch = 'c';
      }
      if (y === 0 && x === 18) ch = 'b';
      if (y === 1 && x >= 17 && x <= 18) ch = 'b';
      if (y === 2 && x >= 16 && x <= 19) ch = 'b';
      if (ch === 'a' && (x === 21 || x === 23) && y >= 4 && y <= 6) ch = 'b';
      if (y === 8 && x >= 23 && x <= 29 && inBody) ch = 'b';
      if (y === 9 && x >= 24 && x <= 28 && x % 2 === 0 && inBody) ch = 'w';
      if (x === 27 && y === 4) ch = 'e';
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

const PERSON_ROWS = [
  '..hhh...',
  '.hhhhh..',
  '..sss...',
  '..sse...',
  '.jjjj...',
  '.jjjjs..',
  '.jjjj...',
  '.jjjj...'
];

const BOAT_ROWS = [
  'b' + '.'.repeat(24) + 'b',
  'b'.repeat(26),
  '.b' + 'w'.repeat(22) + 'b.',
  '..' + 'b'.repeat(22) + '..',
  '...' + 'b'.repeat(20) + '...'
];

const HOOK_ROWS = ['..g', '..g', 'g.g', '.g.'];


/* ==========================================================================
   6. HALFAJOK
   special: különleges faj – a halpakliból érkezik a meccs során (lásd startRound)
   timeBonus: ennyi mp-et ad a kifogása (minél nehezebb, annál többet)
   ========================================================================== */
const SPECIES = {
  minnow: {
    name: 'MINNOW', points: 10, timeBonus: 1, rarity: 1,
    depth: [0.03, 0.32], speed: 34, stamina: 15, regen: 2, pull: 6, aggression: 0.3,
    bite: 0.75, weight: [0.05, 0.2],
    motion: { amp: 1, freq: 6, drift: 6, wander: [2, 4], burstMul: 2.2, burstEvery: [1, 2.5], burstLen: 0.3 },
    spawnDay: 40, spawnNight: 12,
    rows: ['....aa..', 'c.aaaaa.', 'ccaaaaea', 'c.aaaa..'],
    colors: { a: '#c3ccd6', c: '#7f8e9e', e: '#0a0a14' }
  },

  perch: {
    name: 'PERCH', points: 25, timeBonus: 2, rarity: 2,
    depth: [0.12, 0.6], speed: 24, stamina: 35, regen: 4, pull: 10, aggression: 0.5,
    bite: 0.6, weight: [0.3, 1.2],
    motion: { amp: 3, freq: 2, drift: 4, wander: [3, 5], burstMul: 1.6, burstEvery: [3, 6], burstLen: 0.4 },
    spawnDay: 26, spawnNight: 12,
    rows: ['....d.d....', '...ddddd...', 'c.aababaa..', 'ccabababaea', 'c.aababaa..', '...aaaa....'],
    colors: { a: '#a6c24a', b: '#3d5a1c', d: '#e0662a', c: '#e0662a', e: '#0a0a14' }
  },

  puffer: {
    name: 'PUFFER', points: 30, timeBonus: 3, rarity: 3, special: true,
    depth: [0.1, 0.55], speed: 14, stamina: 50, regen: 5, pull: 9, aggression: 0.6,
    bite: 0.55, weight: [0.5, 2.0],
    motion: { amp: 2, freq: 1.5, drift: 5, wander: [3, 6] },
    spawnDay: 12, spawnNight: 8,
    rows: ['...s.s.s..', '..aaaaaa..', 'c.aaaaaea.', 'ccaaaaaaaa', 'c.abbbbba.', '..aaaaaa..', '...s.s.s..'],
    colors: { a: '#e8c860', b: '#fff4c0', s: '#8a6a20', c: '#8a6a20', e: '#101010' }
  },

  bass: {
    name: 'BASS', points: 45, timeBonus: 4, rarity: 4,
    depth: [0.33, 0.68], speed: 20, stamina: 55, regen: 4, pull: 11, aggression: 0.8,
    bite: 0.55, weight: [1.5, 4.0],
    motion: { amp: 1.5, freq: 1.2, drift: 8, wander: [2, 4], burstMul: 2.8, burstEvery: [2.5, 5], burstLen: 0.5 },
    spawnDay: 14, spawnNight: 16,
    rows: [
      '......dddd......',
      '....dddddddd....',
      'c..aaaaaaaaaaa..',
      'cc.aaaaaaaaaaea.',
      'cccaaaaaaaaaaaaa',
      'cc.aabbbbbbbaa..',
      'c...aaaaaaaa....'
    ],
    colors: { a: '#5e8c3a', b: '#cfe0a4', d: '#3b6122', c: '#3b6122', e: '#f2e46a' }
  },

  needle: {
    name: 'NEEDLEFISH', points: 55, timeBonus: 5, rarity: 5, special: true,
    depth: [0.25, 0.7], speed: 40, stamina: 60, regen: 4, pull: 10, aggression: 1.0,
    bite: 0.5, weight: [0.8, 2.5],
    motion: { amp: 1, freq: 3, drift: 12, wander: [1, 2.5], burstMul: 3, burstEvery: [1.2, 2.5], burstLen: 0.35 },
    spawnDay: 8, spawnNight: 7,
    rows: ['..dddd............', 'ccaaaaaaaaaaaeaaaa', '..aaaaaaaaaa......'],
    colors: { a: '#7fd6c8', d: '#3a8a80', c: '#3a8a80', e: '#101010' }
  },

  eel: {
    name: 'EEL', points: 70, timeBonus: 6, rarity: 6,
    depth: [0.48, 0.95], speed: 22, stamina: 65, regen: 4, pull: 11, aggression: 0.9,
    bite: 0.5, weight: [1.0, 3.5],
    motion: { amp: 6, freq: 3, drift: 10, wander: [1.5, 3], turnEvery: [1.5, 3.5], turnChance: 0.45 },
    wiggle: 1,
    spawnDay: 10, spawnNight: 14,
    rows: ['...dddddddddddddd...', 'caaaaaaaaaaaaaaaaaea', '..aaaaaaaaaaaaaaaa..'],
    colors: { a: '#6e5c3a', d: '#4a3d26', c: '#4a3d26', e: '#eae060' }
  },

  squid: {
    name: 'GLOW SQUID', points: 90, timeBonus: 7, rarity: 7, special: true,
    depth: [0.6, 0.96], speed: 16, stamina: 80, regen: 5, pull: 12, aggression: 1.0,
    bite: 0.45, weight: [2, 6],
    motion: { amp: 3, freq: 2, drift: 8, wander: [1.5, 3], burstMul: 3.5, burstEvery: [1, 2], burstLen: 0.25,
              turnEvery: [2, 4], turnChance: 0.3 },
    glow: 10,
    spawnDay: 6, spawnNight: 10,
    rows: ['.......aaaaa..', 't.t..aaaaaaaa.', 'ttttaaaaaaaeaa', 'ttttaaaaaaaaaa', 't.t..aaaaaaaa.', '.......aaaaa..'],
    colors: { a: '#c05a9a', t: '#8a3a70', e: '#fff0a0' }
  },

  angler: {
    name: 'ANGLER', points: 110, timeBonus: 9, rarity: 8,
    depth: [0.68, 0.97], speed: 12, stamina: 90, regen: 5, pull: 13, aggression: 1.0,
    bite: 0.5, weight: [5, 14],
    motion: { amp: 2, freq: 1, drift: 3, wander: [4, 7], burstMul: 3.2, burstEvery: [4, 8], burstLen: 0.4 },
    lure: { x: 15, y: 2 },
    spawnDay: 8, spawnNight: 12,
    rows: [
      '........ddddddd...',
      '.......aaaaaaa.d..',
      'c...aaaaaaaaaa.l..',
      'cc.aaaaaaaaaaae...',
      'ccaaaaaaaaaaaaaww.',
      'cc.aaaaaaaaaaaww..',
      'c...aaaaaaaaaaaa..',
      '.....aaaaaaaa.....'
    ],
    colors: { a: '#5b4a70', d: '#3a2e4c', c: '#3a2e4c', e: '#eaf6f6', w: '#f4f4f4', l: '#9ff6ff' }
  },

  goldfin: {
    name: 'GOLDFIN', points: 150, timeBonus: 8, rarity: 9, rare: true,
    depth: [0.05, 0.95], speed: 48, stamina: 50, regen: 4, pull: 11, aggression: 0.9,
    bite: 0.3, weight: [0.4, 0.9],
    motion: { amp: 2, freq: 5, drift: 22, wander: [0.6, 1.2], burstMul: 1.8, burstEvery: [1, 2], burstLen: 0.3 },
    sparkle: true, glow: 9,
    spawnDay: 1.2, spawnNight: 2.5,
    rows: ['...ddd...', 'c.aaaaa..', 'ccaaaaaea', 'c.aaaaa..', '...dd....'],
    colors: { a: '#ffc62a', d: '#ff8a1c', c: '#ff8a1c', e: '#2a0e00' }
  },

  koi: {
    name: 'CRYSTAL KOI', points: 200, timeBonus: 10, rarity: 10, special: true, rare: true,
    depth: [0.1, 0.8], speed: 30, stamina: 70, regen: 5, pull: 11, aggression: 0.9,
    bite: 0.3, weight: [1, 3],
    motion: { amp: 2, freq: 2, drift: 10, wander: [1, 2] },
    sparkle: true, glow: 9,
    spawnDay: 0.8, spawnNight: 1.5,
    rows: ['....dddd....', 'c..aaaaaaa..', 'cc.aabbaaaea', 'cc.aaaabbaaa', 'c..aaaaaaa..', '....dd......'],
    colors: { a: '#f4f4ff', b: '#ff5a3a', d: '#b8c8ff', c: '#b8c8ff', e: '#101010' }
  },

  // ---------- ÚJ, KÜLÖNLEGES HALAK (a halpakliból érkeznek a meccs során) ----------
  piranha: {
    name: 'PIRANHA', points: 15, timeBonus: 1, rarity: 2, special: true,
    depth: [0.08, 0.45], speed: 36, stamina: 20, regen: 3, pull: 7, aggression: 0.9,
    bite: 0.75, weight: [0.2, 0.8],
    motion: { amp: 1.5, freq: 5, drift: 10, wander: [1, 2], burstMul: 2.5, burstEvery: [0.8, 1.6], burstLen: 0.25 },
    school: 3,          // rajban jön (3 együtt)
    baitThief: 0.5,     // kapáskor 50% eséllyel csak lecsipkedi a csalit
    spawnDay: 8, spawnNight: 8,
    rows: ['...ddd..', 'c.aaaaa.', 'ccaaaaew', 'c.abbbb.', '...aa...'],
    colors: { a: '#5a6b7a', b: '#e0302a', d: '#3a4652', c: '#3a4652', e: '#ffeb3b', w: '#ffffff' }
  },

  flying: {
    name: 'FLYING FISH', points: 25, timeBonus: 2, rarity: 3, special: true,
    depth: [0.03, 0.12], speed: 40, stamina: 30, regen: 3, pull: 8, aggression: 0.8,
    bite: 0.6, weight: [0.3, 1.0],
    motion: { amp: 1, freq: 4, drift: 8, wander: [1, 2], leapEvery: [2, 4] },   // ki-kiugrik a vízből
    leaper: true,
    spawnDay: 8, spawnNight: 5,
    rows: ['...ff......', '..fff......', 'c.aaaaaaaea', 'ccaaaaaaaa.', '..fff......'],
    colors: { a: '#4fa3e0', f: '#bfe8ff', c: '#2f6f9f', e: '#101010' }
  },

  zapper: {
    name: 'ELECTRIC EEL', points: 90, timeBonus: 7, rarity: 6, special: true,
    depth: [0.5, 0.9], speed: 22, stamina: 70, regen: 4, pull: 12, aggression: 1.0,
    bite: 0.5, weight: [2, 5],
    motion: { amp: 5, freq: 3, drift: 9, wander: [1.5, 3], turnEvery: [2, 4], turnChance: 0.4 },
    wiggle: 1,
    zapper: true,       // horgon néha áramot ad: hirtelen nő a feszülés
    spawnDay: 6, spawnNight: 9,
    rows: ['...yyyyyyyyyyyyyy...', 'caaaaaaaaaaaaaaaaaea', '..aaaaaaaaaaaaaaaa..'],
    colors: { a: '#2d4a6e', y: '#ffe14a', c: '#ffe14a', e: '#ffffff' }
  },

  octopus: {
    name: 'OCTOPUS', points: 140, timeBonus: 10, rarity: 8, special: true,
    depth: [0.72, 0.96], speed: 12, stamina: 95, regen: 5, pull: 14, aggression: 1.0,
    bite: 0.5, weight: [3, 9],
    motion: { amp: 3, freq: 1.2, drift: 5, wander: [2, 4], burstMul: 2.5, burstEvery: [3, 5], burstLen: 0.5 },
    inker: true,        // horgon tintát fúj és kapaszkodik
    spawnDay: 5, spawnNight: 8,
    rows: [
      '......aaaa..',
      '.....aaaaaa.',
      '....aaaaaaaa',
      '....aaeaaeaa',
      '....aaaaaaaa',
      '.tttttaaaaa.',
      't.t.t.ttttt.',
      't..t..t.t.t.',
      '.t..t..t..t.'
    ],
    colors: { a: '#d0603a', t: '#a8442a', e: '#ffffff' }
  },

  ghost: {
    name: 'GHOST FISH', points: 65, timeBonus: 6, rarity: 5, special: true,
    depth: [0.35, 0.8], speed: 18, stamina: 55, regen: 4, pull: 11, aggression: 0.9,
    bite: 0.55, weight: [1, 3],
    motion: { amp: 2.5, freq: 1.5, drift: 6, wander: [2, 4] },
    ghost: true,        // időnként láthatatlan – csak látható állapotban kap
    glow: 8,
    spawnDay: 6, spawnNight: 9,
    rows: ['...aaaa...', 'c.aaaaaaa.', 'ccaaaaaaea', 'c.aaaaaaa.', '...aaaa...'],
    colors: { a: '#dfe9ff', c: '#a9b8d6', e: '#5fd0ff' }
  },

  swordfish: {
    name: 'SWORDFISH', points: 85, timeBonus: 7, rarity: 7, special: true,
    depth: [0.3, 0.7], speed: 55, stamina: 75, regen: 5, pull: 13, aggression: 1.1,
    bite: 0.45, weight: [10, 30],
    motion: { amp: 1, freq: 2, drift: 8, wander: [2, 3], burstMul: 1.8, burstEvery: [2, 4], burstLen: 0.6 },
    cutter: true,       // ha átúszik valaki damilján, elvágja
    spawnDay: 5, spawnNight: 6,
    rows: [
      '......dddd..............',
      'c...aaaaaaaaaa..........',
      'cc' + 'a'.repeat(12) + 'ea' + 's'.repeat(7) + '.',
      'c...aaaaaaaaaa..........',
      '......dd................'
    ],
    colors: { a: '#3a5f9a', d: '#24406e', c: '#24406e', e: '#ffffff', s: '#c8d0e0' }
  },

  stonefish: {
    name: 'STONEFISH', points: 120, timeBonus: 9, rarity: 8, special: true,
    depth: [0.92, 0.95], speed: 2, stamina: 85, regen: 4, pull: 14, aggression: 0.9,
    bite: 0.8, weight: [1, 3],
    motion: { amp: 0, freq: 0, drift: 1, wander: [8, 12] },
    stationary: true,   // a fenéken lapul, kőnek látszik; közelről leleplezhető
    spawnDay: 4, spawnNight: 4,
    rows: ['...rrr.rr...', '.rrarrarrr..', 'rrarrrrrrer.', 'rarrarrarrr.', '.rrrrrrrrrr.', '..rr..rr....'],
    colors: { r: '#4f5563', a: '#646a77', e: '#4f5563' }
  },

  // ---------- TÁRGYAK (nem halak – ritkán sodródnak be, lásd maybeSpawnItem) ----------
  crate: {
    name: 'MYSTERY BOX', points: 0, timeBonus: 0, rarity: 0, item: true,
    depth: [0.04, 0.08], speed: 6, stamina: 4, regen: 0, pull: 2, aggression: 0.1,
    bite: 1, weight: [5, 10],
    motion: { amp: 1, freq: 1.5, drift: 2, wander: [4, 6] },
    spawnDay: 0, spawnNight: 0,
    rows: ['bbbbbbbb', 'bymyymyb', 'bbbbbbbb', 'bymyymyb', 'bbbbbbbb'],
    colors: { b: '#6b4220', y: '#a8743a', m: '#ffd23f' }
  },

  bottle: {
    name: 'BOTTLE', points: 0, timeBonus: 0, rarity: 0, item: true,
    depth: [0.02, 0.05], speed: 8, stamina: 3, regen: 0, pull: 1, aggression: 0.1,
    bite: 1, weight: [0.5, 1],
    motion: { amp: 1, freq: 2, drift: 2, wander: [4, 6] },
    spawnDay: 0, spawnNight: 0,
    rows: ['.gggg..', 'gpppggn', '.gggg..'],
    colors: { g: '#5fbf7a', p: '#f0e6c0', n: '#8a5226' }
  },

  oldone: {
    name: 'THE OLD ONE', points: 400, timeBonus: 25, rarity: 11, rare: true,
    depth: [0.74, 0.95], speed: 7, stamina: 220, regen: 6, pull: 16, aggression: 1.2,
    bite: 0.35, weight: [80, 140],
    motion: { amp: 5, freq: 0.6, drift: 2, wander: [5, 9] },
    mouthOffset: 2,
    eye: { x: 36, y: 6 },
    spawnDay: 0, spawnNight: 0,
    rows: buildOldOneRows(),
    colors: { a: '#3d4c48', s: '#55665f', b: '#26302d', c: '#26302d', e: '#d8ff9a', w: '#d8d0b0' }
  }
};

// Becenevek a kifogott halaknak nyelvenként (szabadon bővíthető)
const NICKS = {
  en: {
    names: ['BOB', 'GUS', 'DOUG', 'WANDA', 'BERTHA', 'CHUCK', 'LOLA', 'OTTO', 'ROSIE', 'WALLY', 'MAVIS',
      'TEDDY', 'BISCUIT', 'NORMAN', 'PICKLES', 'ZIGGY', 'MUFFIN', 'BARNABY', 'GERALD', 'PEGGY'],
    big: ['BIG', 'CHUNKY', 'MIGHTY', 'HEFTY', 'LARGE'],
    small: ['LIL', 'TINY', 'WEE', 'SHRIMPY', 'MINI'],
    mid: ['SNEAKY', 'GRUMPY', 'LAZY', 'HAPPY', 'SLY', 'SLEEPY', 'CHEEKY', 'FUNKY', 'SLIPPERY']
  },
  fr: {
    names: ['GASTON', 'MARCEL', 'JOJO', 'LULU', 'FIFI', 'DÉDÉ', 'BÉBERT', 'GIGI', 'MIMILE', 'NINON',
      'ROGER', 'PIERROT', 'COCO', 'LOULOU', 'JULOT', 'FANFAN', 'TITOU', 'NÉNETTE'],
    big: ['GROS', 'COSTAUD', 'ÉNORME', 'MASSIF'],
    small: ["P'TIT", 'MINI', 'MINUS', 'PETIT'],
    mid: ['RUSÉ', 'GROGNON', 'PARESSEUX', 'JOYEUX', 'FILOU', 'ENDORMI', 'COQUIN', 'TÊTU', 'MALIN']
  }
};

function makeNickname(f) {
  if (f.key === 'oldone') return fishName('oldone');
  const pool = NICKS[lang] || NICKS.en;
  const sp = f.sp;
  const r = (f.weight - sp.weight[0]) / (sp.weight[1] - sp.weight[0]);
  const adj = r > 0.75 ? pool.big : r < 0.25 ? pool.small : pool.mid;
  return `${choice(adj)} ${choice(pool.names)}`;
}

// Sprite-ok előrenderelése
const SPRITES = {};
for (const key of Object.keys(SPECIES)) SPRITES[key] = buildSprite(SPECIES[key].rows, SPECIES[key].colors);
SPRITES.shark = buildSprite(buildSharkRows(), {
  a: '#6f7f8f', s: '#c8d0d8', b: '#3a4450', c: '#4f5d6b', e: '#ff3030', w: '#ffffff'
});
SPRITES.hook = buildSprite(HOOK_ROWS, { g: '#d4d6de' });
SPRITES.crown = buildSprite([
  'y..y..y',
  'yy.y.yy',
  'yyyyyyy',
  'yryyyry',
  'yyyyyyy'
], { y: '#ffd23f', r: '#ff3355' });

// Játékosonkénti megjelenés
const PLAYER_STYLE = [
  {
    tag: '#ffc933', line: '#ececec',
    person: buildSprite(PERSON_ROWS, { h: '#d8452a', s: '#f2c08a', e: '#101010', j: '#f0b020' }),
    boat: buildSprite(BOAT_ROWS, { b: '#8a5226', w: '#efe6cc' })
  },
  {
    tag: '#5fd0ff', line: '#ffe9a8',
    person: buildSprite(PERSON_ROWS, { h: '#2a6ad8', s: '#e8b27c', e: '#101010', j: '#3fbf6a' }),
    boat: buildSprite(BOAT_ROWS, { b: '#3b5f7a', w: '#e6f0ff' })
  },
  {
    tag: '#ff6fb0', line: '#ffc4e2',
    person: buildSprite(PERSON_ROWS, { h: '#c8307a', s: '#f2c08a', e: '#101010', j: '#ff8fc4' }),
    boat: buildSprite(BOAT_ROWS, { b: '#6e2f5c', w: '#ffe4f2' })
  },
  {
    tag: '#6cf06c', line: '#d2ffc8',
    person: buildSprite(PERSON_ROWS, { h: '#2f8f3a', s: '#d9a06a', e: '#101010', j: '#9be35a' }),
    boat: buildSprite(BOAT_ROWS, { b: '#3d5a24', w: '#eaffdc' })
  }
];

// Kezdő pozíció: a csónakok egyenletesen elosztva a víz felett
const startXFor = (index, count) => (W * (index + 1)) / (count + 1);

// A body osztálya mutatja, hány játékos van (ettől függ a HUD és a panelek)
function setPlayerCount(n) {
  for (let i = 1; i <= 4; i++) document.body.classList.toggle('np-' + i, i === n);
  document.body.style.setProperty('--np', n);
}

function drawSprite(g, img, x, y, flipX = false, flipY = false, wiggle = 0, t = 0) {
  const w = img.width;
  const h = img.height;
  g.save();
  g.translate(Math.round(x) + (flipX ? w : 0), Math.round(y) + (flipY ? h : 0));
  g.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  if (wiggle) {
    for (let c = 0; c < w; c++) {
      const off = Math.round(Math.sin(t * 8 + c * 0.55) * wiggle);
      g.drawImage(img, c, 0, 1, h, c, off, 1, h);
    }
  } else {
    g.drawImage(img, 0, 0);
  }
  g.restore();
}

function pixelLine(g, x0, y0, x1, y1, color) {
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);
  g.fillStyle = color;
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let guard = 0; guard < 2000; guard++) {
    g.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

function drawPixelCircle(g, cx, cy, r, color) {
  g.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r + r * 0.8) g.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}


/* ==========================================================================
   7. HANG
   ========================================================================== */
const Sound = {
  ac: null,
  muted: false,

  init() {
    if (this.ac) {
      if (this.ac.state === 'suspended') this.ac.resume();
      Music.unlock();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) this.ac = new AC();
    Music.unlock();   // az első gombnyomásnál a zene is elindulhat
  },

  tone(freq, dur, opts = {}) {
    if (Net.role === 'host') Net.event(['tn', freq, dur, opts, Net.owner || '']);   // online vendégek is hallják
    if (!this.ac || this.muted) return;
    const { type = 'square', slide = null, delay = 0 } = opts;
    const vol = (opts.vol || 0.04) * settings.sfx;
    if (vol <= 0.0001) return;
    const t0 = this.ac.currentTime + delay;
    const osc = this.ac.createOscillator();
    const gain = this.ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  bite()      { this.tone(440, 0.12, { slide: 880 }); },
  tug()       { this.tone(170, 0.06, { type: 'triangle', vol: 0.07 }); },
  mash()      { this.tone(900, 0.02, { vol: 0.015 }); },
  // sirály: vicces, rikácsoló hang
  squawk(angry) {
    const base = angry ? 1500 : 1250;
    [0, 0.16, 0.34].forEach((d, i) => {
      this.tone(base - i * 120, 0.13, { type: 'sawtooth', slide: base - 600 - i * 80, vol: 0.05, delay: d });
      this.tone(base * 0.5, 0.08, { type: 'square', slide: base * 0.35, vol: 0.025, delay: d + 0.03 });
    });
  },
  thunder() {
    this.tone(70, 0.9, { type: 'sawtooth', slide: 30, vol: 0.09, delay: 0.1 });
    this.tone(110, 0.5, { type: 'square', slide: 40, vol: 0.05, delay: 0.15 });
  },
  zap()       { this.tone(1600, 0.12, { type: 'sawtooth', slide: 300, vol: 0.06 }); this.tone(900, 0.1, { type: 'square', delay: 0.06, vol: 0.04 }); },
  nom()       { this.tone(320, 0.05, { vol: 0.05 }); this.tone(260, 0.06, { vol: 0.05, delay: 0.07 }); },
  warn()      { this.tone(1400, 0.08, { vol: 0.05 }); this.tone(1400, 0.08, { vol: 0.05, delay: 0.12 }); },
  struggle()  { this.tone(110, 0.1, { type: 'sawtooth', vol: 0.025 }); },
  snap()      { this.tone(900, 0.3, { type: 'sawtooth', slide: 60, vol: 0.05 }); },
  rumble()    { this.tone(58, 1.4, { type: 'triangle', vol: 0.14, slide: 38 }); },
  event()     { this.tone(660, 0.08); this.tone(990, 0.12, { delay: 0.08 }); },
  tick()      { this.tone(1200, 0.03, { vol: 0.03 }); },
  select()    { this.tone(740, 0.05, { vol: 0.03 }); },

  // Cápa: riasztó szirénahang érkezéskor
  predatorAlarm() {
    for (let i = 0; i < 6; i++) {
      this.tone(i % 2 ? 247 : 330, 0.13, { delay: i * 0.16, vol: 0.06 });
    }
  },
  // Cápa: vadászat kezdete
  predatorSting() { this.tone(200, 0.3, { type: 'sawtooth', slide: 520, vol: 0.05 }); },
  // Cápa: szívverés, amíg a képernyőn van
  heartbeat() {
    this.tone(55, 0.12, { type: 'sine', vol: 0.2 });
    this.tone(50, 0.1, { type: 'sine', vol: 0.14, delay: 0.14 });
  },
  chomp() {
    this.tone(160, 0.2, { slide: 40, vol: 0.08 });
    this.tone(90, 0.25, { type: 'sawtooth', delay: 0.05, vol: 0.05 });
  },

  catchFish(rare) {
    const notes = rare ? [523, 659, 784, 1047, 1319] : [523, 659, 784];
    notes.forEach((n, i) => this.tone(n, 0.1, { delay: i * 0.07 }));
  },
  roundClear() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((n, i) => this.tone(n, 0.11, { delay: i * 0.1 }));
  },
  gameOver() {
    [523, 392, 330, 262].forEach((n, i) => this.tone(n, 0.2, { delay: i * 0.16, type: 'triangle', vol: 0.07 }));
  }
};

/* --------------------------------------------------------------------------
   HÁTTÉRZENE – három lejátszási lista, mindegyik végtelenítve, a számok felváltva.
     menu  : főmenü és Game Over
     day   : nappali játék
     night : éjszakai játék
   Váltáskor a régi zene kihalkul, az új felhangosodik (áttűnés).
   Új szám: tedd a fájlt a játék mellé, és írd be a nevét a megfelelő listába.
   -------------------------------------------------------------------------- */
const Music = {
  PLAYLISTS: {
    menu: ['menu.mp3'],
    day: ['day1.mp3', 'day2.mp3', 'day3.mp3'],
    night: ['night1.mp3', 'night2.mp3', 'night3.mp3']
  },
  FADE_TIME: 1.5,     // áttűnés hossza (mp)

  cur: null,          // ami most szól: { audio, list, index, fade, errors, dead }
  out: null,          // ami éppen kihalkul
  wanted: 'menu',     // melyik listának kellene szólnia
  unlocked: false,    // böngészőben csak felhasználói művelet után szólhat
  duck: 1,            // szünetben halkabb

  init() {
    this.applyVolume();
  },

  makeTrack(list) {
    const tr = { audio: new Audio(), list, index: 0, fade: 0, errors: 0, dead: false };
    tr.audio.preload = 'auto';
    tr.audio.addEventListener('ended', () => { if (!tr.dead) this.nextTrack(tr); });
    tr.audio.addEventListener('playing', () => { tr.errors = 0; });
    tr.audio.addEventListener('error', () => {
      // hiányzó / hibás fájl: továbblép a következőre, de nem pörög végtelenül
      if (tr.dead) return;
      tr.errors++;
      if (tr.errors < this.PLAYLISTS[list].length) this.nextTrack(tr);
    });
    tr.audio.src = this.PLAYLISTS[list][0];
    return tr;
  },

  nextTrack(tr) {
    const list = this.PLAYLISTS[tr.list];
    tr.index = (tr.index + 1) % list.length;
    tr.audio.src = list[tr.index];
    if (tr === this.cur) this.tryPlay(tr);
  },

  tryPlay(tr) {
    const p = tr.audio.play();
    if (p && p.catch) p.catch(() => { this.unlocked = false; });
  },

  // Átváltás egy másik lejátszási listára (ha már az szól, nem történik semmi)
  play(list) {
    this.wanted = list;
    if (!this.unlocked) return;
    if (this.cur && this.cur.list === list) return;
    if (this.out) {
      this.out.dead = true;
      this.out.audio.pause();
    }
    this.out = this.cur;
    this.cur = this.makeTrack(list);
    this.applyVolume();
    this.tryPlay(this.cur);
  },

  // Az első gombnyomásnál / kattintásnál hívódik (az .exe-ben azonnal)
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.cur && this.cur.list === this.wanted) this.tryPlay(this.cur);
    else this.play(this.wanted);
  },

  // Minden képkockában: áttűnés
  update(dt) {
    const step = dt / this.FADE_TIME;
    if (this.cur && this.cur.fade < 1) this.cur.fade = Math.min(1, this.cur.fade + step);
    if (this.out) {
      this.out.fade -= step;
      if (this.out.fade <= 0) {
        this.out.dead = true;
        this.out.audio.pause();
        this.out = null;
      }
    }
    this.applyVolume();
  },

  setDuck(v) {
    this.duck = v;
    this.applyVolume();
  },

  applyVolume() {
    const base = Sound.muted ? 0 : settings.music * CONFIG.MUSIC_MASTER * this.duck;
    for (const tr of [this.cur, this.out]) {
      if (tr) tr.audio.volume = clamp(base * tr.fade, 0, 1);
    }
  }
};


/* ==========================================================================
   8. JÁTÉKÁLLAPOT, JÁTÉKOSOK
   ========================================================================== */
const game = {
  state: 'start',        // 'start' | 'playing' | 'paused' | 'roundclear' | 'gameover'
  stateTime: 0,
  numPlayers: 1,
  mode: 'day',
  time: 0,
  level: 1,
  target: CONFIG.TARGET_BASE,
  timeLeft: CONFIG.ROUND_DURATION,
  clearTimer: 0,
  diff: null,            // aktuális nehézségi szorzók
  players: [],
  fish: [],
  predator: null,
  predatorTimer: 999,
  spawnTimer: 0,
  event: null,
  eventTimer: 0,
  eventCooldown: CONFIG.EVENT_START_DELAY,
  oldOneActive: false,
  shake: 0,
  lastTick: -1,
  timeFlash: 0,          // a HUD idő zölden villan bónusznál
  fishSeq: 0,            // halak egyedi azonosítója (az online módhoz)
  matchRounds: 0,        // versus meccs hossza körökben (0 = végtelen, egyjátékos)
  baseMode: 'day',       // a meccs napszaka (a NIGHT FALLS kártya egy körre felülírja)
  cards: [],             // a most futó körre érvényes kártyák
  pendingCards: [],      // a következő körre választott kártyák
  cardPick: null,        // folyamatban lévő kártyaválasztás
  mods: null,            // mindenkire ható kártya-módosítók
  roundWinners: [],      // a körök győztesei sorban (zsinórban nyerés figyeléséhez)
  lastRoundWinner: null,
  fishDeck: [],          // a különleges halfajok még ki nem húzott pakli
  tug: null, gull: null, kraken: null,   // kötélhúzás / sirály / kraken
  golden: 0, flash: 0, flashTimer: 0, wind: 1,   // Golden Hour, villám, szél
  unlocked: new Set(),   // a tóba már bekerült különleges fajok
  crownDev: null         // az előző meccs győztesének eszköze (korona)
};

const effects = { particles: [], bubbles: [], popups: [], banners: [] };
const world = { weeds: [], clouds: [], stars: [] };
const bestScores = Object.assign({ day: 0, night: 0 }, Store.get('best', {}));

function makePlayer(index, count, device = null) {
  const startX = startXFor(index, count);
  return {
    index,
    device,              // 'kbR' (nyilak) | 'kbL' (WASD) | 'pad0'..'pad3' (kontroller)
    style: PLAYER_STYLE[index],
    hook: { x: startX, y: HOOK_MIN_Y + 30, state: 'free', fish: null, tension: 0, overload: 0, baited: true },
    boat: { x: startX },
    score: 0,
    roundScore: 0,
    caught: 0,
    roundWins: 0,
    eaten: 0,
    biggest: null,
    rarest: null,
    log: [],
    reelVel: 0,          // gombnyomkodásból származó tekerési lendület
    snaps: 0, gullLost: 0, treasures: 0, steals: 0, longest: 0,   // a díjakhoz
    pile: [],            // a körben kifogott halak a csónakban
    stealCd: 0,          // rablási várakozás
    sinceAction: 99,     // utolsó rántás/tekerés óta eltelt idő
    in: { left: false, right: false, up: false, down: false, tug: false, reel: false }
  };
}

function computeDifficulty(level) {
  const L = level - 1;
  return {
    speed: 1 + CONFIG.LEVEL_SPEED_STEP * L,
    stamina: 1 + CONFIG.LEVEL_STAMINA_STEP * L,
    bite: Math.max(CONFIG.LEVEL_BITE_MIN, 1 - CONFIG.LEVEL_BITE_STEP * L),
    decay: Math.max(CONFIG.LEVEL_DECAY_MIN, 1 - CONFIG.LEVEL_DECAY_STEP * L),
    predator: 1 + CONFIG.LEVEL_PREDATOR_STEP * L,
    time: Math.max(CONFIG.LEVEL_TIME_MIN, 1 - CONFIG.LEVEL_TIME_STEP * L)
  };
}
game.diff = computeDifficulty(1);


/* ==========================================================================
   9. BEMENET: BILLENTYŰZET + KONTROLLER
   ========================================================================== */
// Billentyűkiosztás játékosonként. 1 játékos módban mindkét kiosztás P1-et irányítja.
const KEYMAP = [
  {
    left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'],
    tug: ['Space', 'Slash'], reel: ['Enter', 'NumpadEnter', 'Period']
  },
  {
    left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'],
    tug: ['KeyF'], reel: ['KeyG']
  }
];

const keys = Object.create(null);
// Billentyűzet-"eszközök": kbR = nyilas oldal, kbL = WASD oldal
const kbEdge = { kbR: { tug: false, reel: false }, kbL: { tug: false, reel: false } };
const KB_DEVICES = ['kbR', 'kbL'];
const BLOCK_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'Slash'];

window.addEventListener('keydown', (e) => {
  Sound.init();
  // névbeírás közben a billentyűk a szövegmezőé (ENTER / ESC befejezi)
  if (e.target && e.target.id === 'code-input') {   // kódbeírás a (telefonos) szövegmezőben
    if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); codeSubmit(); }
    else if (e.code === 'Escape') { e.preventDefault(); e.target.blur(); closeCodeScreen(); }
    return;
  }
  if (e.target && e.target.tagName === 'INPUT') {
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Escape') {
      e.preventDefault();
      e.target.blur();
    }
    return;
  }
  if (BLOCK_KEYS.includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.repeat) return;
  onKeyPress(e.code, e.key);
});

window.addEventListener('keyup', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (BLOCK_KEYS.includes(e.code)) e.preventDefault();
  keys[e.code] = false;
});

window.addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  if (game.state === 'playing' && !(Net.role === 'host' && Net.remoteCount())) pauseGame();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing' && !(Net.role === 'host' && Net.remoteCount())) pauseGame();
});

// Melyik billentyűzet-oldalhoz tartozik egy akció-gomb?
function keyDevice(code, action) {
  for (let i = 0; i < KEYMAP.length; i++) {
    if (KEYMAP[i][action].includes(code)) return KB_DEVICES[i];
  }
  return null;
}

// Csatlakozó képernyőn: melyik billentyű melyik oldalt "lépteti be"
function joinKeyDevice(code) {
  if (['Space', 'Slash', 'Period'].includes(code)) return 'kbR';
  if (['KeyF', 'KeyG'].includes(code)) return 'kbL';
  return null;
}

function onKeyPress(code, key = '') {
  if (optionsOpen) {
    handleOptionsKey(code);
    return;
  }
  if (kickOpen) {
    handleKickKey(code);
    return;
  }
  if (voteKey(code)) return;
  if (game.state === 'code') {
    handleCodeKey(code, key);
    return;
  }
  if (game.state === 'cards') {
    handleCardKey(code);
    return;
  }
  if (Net.role === 'client') {
    clientKey(code);
    return;
  }
  switch (game.state) {
    case 'start':
      if (code === 'ArrowUp' || code === 'KeyW') menuMove(-1);
      else if (code === 'ArrowDown' || code === 'KeyS') menuMove(1);
      else if (code === 'ArrowLeft' || code === 'KeyA') menuChange(-1);
      else if (code === 'ArrowRight' || code === 'KeyD') menuChange(1);
      else if (code === 'Enter' || code === 'Space') menuConfirm('kbR');
      else if (code === 'KeyF' || code === 'KeyG') menuConfirm('kbL');
      else if (code === 'Escape' && game.stateTime > 0.6) exitGame();
      break;
    case 'playing': {
      const td = keyDevice(code, 'tug');
      const rd = keyDevice(code, 'reel');
      if (td) kbEdge[td].tug = true;
      if (rd) kbEdge[rd].reel = true;
      if (code === 'KeyP' || code === 'Escape') pauseGame();
      else if (code === 'KeyM') toggleMute();
      break;
    }
    case 'paused':
      if (code === 'ArrowUp' || code === 'KeyW') pauseMove(-1);
      else if (code === 'ArrowDown' || code === 'KeyS') pauseMove(1);
      else if (code === 'Enter' || code === 'Space') pauseSelect();
      else if (code === 'KeyP' || code === 'Escape') resumeGame();
      else if (code === 'KeyM') toggleMute();
      break;
    case 'join':
      if (code === 'Enter' || code === 'NumpadEnter') {
        if (joined.length) startGame();
        else joinDevice('kbR');
      } else if (code === 'Escape' || code === 'Backspace') {
        joinEscape();
      } else if (code === 'KeyI') {
        Net.host();
      } else if (code === 'ArrowLeft' || code === 'ArrowRight') {
        changeRounds(code === 'ArrowLeft' ? -1 : 1);   // meccs hossza
      } else {
        const dev = joinKeyDevice(code);
        if (dev && joined.includes(dev)) editName(dev);   // újra megnyomva: név beírása
        else if (dev) joinDevice(dev);
      }
      break;
    case 'gameover':
      if (awardsRun) { if (['Enter', 'Space', 'Escape'].includes(code)) finishAwards(); return; }   // díjátadó átugrása
      if (game.stateTime < 1.2) return;   // véletlen gombnyomkodás ne indítson rögtön újat
      if (code === 'Enter' || code === 'Space') startGame();
      else if (code === 'Escape') openJoin();
      break;
  }
}

// --- Kontroller (standard mapping: A=0, B=1, X=2, Y=3, RB=5, RT=7, Back=8, Start=9, D-pad=12..15)
const padPrev = {};

function readPads() {
  if (!navigator.getGamepads) return [];
  return Array.from(navigator.getGamepads()).filter((p) => p && p.connected);
}

function padSnapshot(pad) {
  const b = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
  const ax = pad.axes[0] || 0;
  const ay = pad.axes[1] || 0;
  const dz = 0.4;
  const held = {
    left: b(14) || ax < -dz,
    right: b(15) || ax > dz,
    up: b(12) || ay < -dz,
    down: b(13) || ay > dz,
    reel: b(0) || b(7),          // A vagy RT: tekerés (nyomkodni kell!)
    tug: b(1) || b(2) || b(5),   // B, X vagy RB: rántás
    cancel: b(1),                // B: kilépés a csatlakozó képernyőn
    reroll: b(3),                // Y: új véletlen név a csatlakozó képernyőn
    x: b(2),                     // X: online szoba nyitása a csatlakozó képernyőn
    start: b(9),
    back: b(8)
  };
  const prev = padPrev[pad.index] || {};
  const edge = {};
  for (const k of Object.keys(held)) edge[k] = held[k] && !prev[k];
  padPrev[pad.index] = held;
  return { index: pad.index, device: 'pad' + pad.index, held, edge };
}

// Minden képkockában: kontrollerek + billentyűzet -> játékos-bemenetek
function pollInput() {
  const snaps = readPads().map(padSnapshot);

  // Menü és globális vezérlés kontrollerről
  for (const s of snaps) {
    const e = s.edge;
    if (optionsOpen) {
      if (e.up) optionsMove(-1);
      if (e.down) optionsMove(1);
      if (e.left) optionsAdjust(-1);
      if (e.right) optionsAdjust(1);
      if (e.reel) optionsConfirm();
      else if (e.tug || e.start || e.back) closeOptions();
      continue;
    }
    if (kickOpen) {
      if (e.up) kickMove(-1);
      if (e.down) kickMove(1);
      if (e.reel) kickSelect();
      else if (e.cancel || e.start || e.back) closeKickScreen();
      continue;
    }
    if (Net.role === 'host' && Net.vote) {            // szavazás: A = igen, B = nem
      if (e.reel) castVote(s.device, true);
      else if (e.cancel) castVote(s.device, false);
      continue;
    }
    if (Net.role === 'client' && canClientVote()) {
      if (e.reel) Net.sendVote(true);
      else if (e.cancel) Net.sendVote(false);
      continue;
    }
    if (game.state === 'code') {
      codePad(e);
      continue;
    }
    if (game.state === 'cards') {
      cardPad(s);
      continue;
    }
    if (Net.role === 'client') {
      clientPad(s);
      continue;
    }
    if (game.state === 'start') {
      if (e.up) menuMove(-1);
      if (e.down) menuMove(1);
      if (e.left) menuChange(-1);
      if (e.right) menuChange(1);
      if (e.start || e.reel) { Sound.init(); menuConfirm(s.device); }
      else if (e.back && game.stateTime > 0.6) exitGame();
    } else if (game.state === 'playing') {
      if (e.start) pauseGame();
    } else if (game.state === 'paused') {
      if (e.up) pauseMove(-1);
      if (e.down) pauseMove(1);
      if (e.reel) pauseSelect();
      else if (e.start || e.tug) resumeGame();
    } else if (game.state === 'join') {
      const isIn = joined.includes(s.device);
      if (!isIn && (e.reel || e.start)) joinDevice(s.device);
      else if (isIn && e.start) startGame();
      else if (isIn && e.reroll) rerollName(s.device);
      else if (e.x && !Net.role) Net.host();
      else if (e.left || e.right) changeRounds(e.left ? -1 : 1);
      else if (isIn && (e.cancel || e.back)) leaveDevice(s.device);
      else if (!isIn && (e.cancel || e.back) && joined.length === 0) showMenu();
    } else if (game.state === 'gameover' && awardsRun) {
      if (e.start || e.reel || e.cancel) finishAwards();
    } else if (game.state === 'gameover' && game.stateTime > 1.2) {
      if (e.start || e.reel) startGame();
      else if (e.back || e.tug) openJoin();
    }
  }

  // Online vendég: minden helyi eszköz együtt irányít, és a hostnak küldjük
  if (Net.role === 'client') {
    const held = (a) => KEYMAP.some((m) => m[a].some((c) => keys[c])) || snaps.some((s) => s.held[a]);
    const inp = {
      left: held('left'), right: held('right'), up: held('up'), down: held('down'),
      tug: KB_DEVICES.some((d) => kbEdge[d].tug) || snaps.some((s) => s.edge.tug),
      reel: KB_DEVICES.some((d) => kbEdge[d].reel) || snaps.some((s) => s.edge.reel)
    };
    mergeTouch(inp);
    clearTouchEdges();
    for (const d of KB_DEVICES) { kbEdge[d].tug = false; kbEdge[d].reel = false; }
    const active = Net.mirror && !Net.menuOpen && !Net.voteInfo && game.state === 'playing';
    Net.localIn = active ? inp : { left: false, right: false, up: false, down: false, tug: false, reel: false };
    if (active) {
      // saját hangok azonnal (a host ezeket nem küldi vissza)
      const me = game.players[Net.ownIdx];
      if (inp.reel) Sound.mash();
      if (inp.tug && me && me.hook.state === 'fight') Sound.tug();
      Net.sendInput(inp);
    }
    updatePadStatus(snaps.length);
    return;
  }

  // Játékosok bemenete: mindenki a saját eszközéről (egyedül bármelyikről)
  const n = game.players.length;
  const solo = n === 1;
  for (let i = 0; i < n; i++) {
    const p = game.players[i];
    const dev = p.device || 'kbR';
    // online játékos: a hálózaton érkezett bemenet
    if (dev.startsWith('net:')) {
      const r = Net.inputs[dev] || {};
      p.in = { left: !!r.l, right: !!r.r, up: !!r.u, down: !!r.d, tug: r.tg > 0, reel: r.rl > 0 };
      if (pmods(p).tangled) [p.in.left, p.in.right] = [p.in.right, p.in.left];   // TANGLED
      if (r.tg > 0) r.tg--;
      if (r.rl > 0) r.rl--;
      continue;
    }
    const kbs = solo ? KB_DEVICES : KB_DEVICES.filter((d) => d === dev);
    const maps = kbs.map((d) => KEYMAP[KB_DEVICES.indexOf(d)]);
    const held = (action) => maps.some((m) => m[action].some((c) => keys[c]));
    const inp = {
      left: held('left'), right: held('right'), up: held('up'), down: held('down'),
      tug: kbs.some((d) => kbEdge[d].tug), reel: kbs.some((d) => kbEdge[d].reel)
    };
    const mine = solo ? snaps : snaps.filter((s) => s.device === dev);
    for (const s of mine) {
      inp.left = inp.left || s.held.left;
      inp.right = inp.right || s.held.right;
      inp.up = inp.up || s.held.up;
      inp.down = inp.down || s.held.down;
      inp.tug = inp.tug || s.edge.tug;
      inp.reel = inp.reel || s.edge.reel;
    }
    if (solo || dev === 'touch') mergeTouch(inp);   // telefonos (érintéses) irányítás
    if (pmods(p).tangled) [inp.left, inp.right] = [inp.right, inp.left];   // TANGLED kártya
    p.in = inp;
  }
  for (const d of KB_DEVICES) { kbEdge[d].tug = false; kbEdge[d].reel = false; }
  clearTouchEdges();

  updatePadStatus(snaps.length);
}

window.addEventListener('gamepadconnected', () => Sound.init());


/* ==========================================================================
   10. MENÜ ÉS DOM UI
   ========================================================================== */
const $ = (sel) => document.querySelector(sel);

function panelRefs(root) {
  return {
    root,
    tag: root.querySelector('.tag'),
    fishName: root.querySelector('.fish-name'),
    status: root.querySelector('.fight-status'),
    depth: root.querySelector('.depth'),
    fish: root.querySelector('.fish'),
    rpts: root.querySelector('.rpts'),
    stFill: root.querySelector('.stamina-fill'),
    stVal: root.querySelector('.stamina-val'),
    tFill: root.querySelector('.tension-fill'),
    tVal: root.querySelector('.tension-val'),
    rFill: root.querySelector('.reel-fill'),
    rVal: root.querySelector('.reel-val'),
    cards: root.querySelector('.panel-cards')
  };
}

const ui = {
  p1Label: $('#p1-label'),
  hudLabels: [1, 2, 3, 4].map((n) => $('#p' + n + '-label')),
  scores: [$('#p1-score'), $('#p2-score'), $('#p3-score'), $('#p4-score')],
  round: $('#round'), target: $('#target'), time: $('#time'), mode: $('#mode'),
  panels: [1, 2, 3, 4].map((n) => panelRefs($('#panel-' + n))),
  startScreen: $('#start-screen'), gameoverScreen: $('#gameover-screen'),
  menuRows: document.querySelectorAll('.menu-row'),
  opts: document.querySelectorAll('.opt'),
  menuDesc: $('#menu-desc'), padStatus: $('#pad-status'), btnStart: $('#btn-start'),
  goTitle: $('#go-title'), goSub: $('#go-sub'), goStats: $('#go-stats'),
  goRecord: $('#go-record'), goLog: $('#go-log'),
  btnAgain: $('#btn-again'), btnMenu: $('#btn-menu'), btnExit: $('#btn-exit'),
  pauseScreen: $('#pause-screen'), pauseOpts: Array.from(document.querySelectorAll('.pause-opt')),
  btnOptions: $('#btn-options'), actBtns: document.querySelectorAll('.act-btn'),
  optionsScreen: $('#options-screen'), volRows: Array.from(document.querySelectorAll('.vol-row')),
  volBtns: document.querySelectorAll('.vol-btn'), btnOptBack: $('#btn-options-back'),
  fsRow: $('#fs-row'), btnFullscreen: $('#btn-fullscreen'),
  vibRow: $('#vib-row'), btnVibration: $('#btn-vibration'), codeInput: $('#code-input'),
  joinScreen: $('#join-screen'), joinSlots: Array.from(document.querySelectorAll('.join-slot')),
  joinMode: $('#join-mode'), btnJoinPlay: $('#btn-join-play'), btnJoinBack: $('#btn-join-back'),
  pauseTitle: $('#pause-screen .pause-title'), goHint: $('#go-hint'), toast: $('#toast'),
  btnHost: $('#btn-host'), onlineInfo: $('#online-info'), onlineCode: $('#online-code'),
  btnCopyLink: $('#btn-copy-link'), btnCopyCode: $('#btn-copy-code'), onlineStatus: $('#online-status'),
  btnOnline: $('#btn-online'), codeScreen: $('#code-screen'),
  codeBoxes: Array.from(document.querySelectorAll('.code-box')),
  btnCodeJoin: $('#btn-code-join'), btnCodeBack: $('#btn-code-back'),
  voteBox: $('#vote-box'), voteTitle: $('#vote-title'), voteCount: $('#vote-count'), voteKeys: $('#vote-keys'),
  kickScreen: $('#kick-screen'), kickList: $('#kick-list'), voteBtns: $('#vote-btns'),
  roundsRow: $('#rounds-row'), roundOpts: Array.from(document.querySelectorAll('.round-opt')),
  cardScreen: $('#card-screen'), cardTitle: $('#card-title'), cardNote: $('#card-note'), cardRow: $('#card-row'),
  cardTargets: $('#card-targets'), cardTimer: $('#card-timer'), cardKeys: $('#card-keys'),
  awardsScreen: $('#awards-screen'), awardsList: $('#awards-list')
};

function setText(el, txt) {
  if (el._last !== txt) {
    el.textContent = txt;
    el._last = txt;
  }
}
function setWidth(el, pct) {
  const v = Math.round(clamp(pct, 0, 100));
  if (el._w !== v) {
    el.style.width = v + '%';
    el._w = v;
  }
}
function setClass(el, cls) {
  if (el._cls !== cls) {
    el.className = cls;
    el._cls = cls;
  }
}

const MENU_ROWS = [
  { key: 'mode', values: ['day', 'night'] },
  { key: 'lang', values: LANGS },
  { key: 'action', get values() {
    const v = GUEST ? ['online', 'options'] : ['start', 'online', 'options'];
    return isDesktop ? v.concat('exit') : v;
  } }
];
// Vendég mód: aki a host COPY LINK linkjével (…?guest) jön, csak csatlakozni tud, szobát nyitni nem
const GUEST = new URLSearchParams(location.search).has('guest');
document.body.classList.toggle('guest', GUEST);
const DEFAULT_ACTION = GUEST ? 'online' : 'start';

const menu = { row: 0, mode: 'day', lang, action: DEFAULT_ACTION };
const ACTION_ROW = 2;   // az alsó gombsor (START / OPTIONS / EXIT) sorszáma

function refreshMenu() {
  ui.menuRows.forEach((r, i) => r.classList.toggle('active', i === menu.row));
  ui.opts.forEach((b) => b.classList.toggle('selected', menu[b.dataset.row] === b.dataset.value));
  ui.actBtns.forEach((b) => b.classList.toggle('selected', menu.row === ACTION_ROW && b.dataset.act === menu.action));
  ui.menuDesc.textContent = GUEST ? t('guest_desc') : t('desc_' + menu.mode);
}

function menuMove(d) {
  menu.row = (menu.row + d + MENU_ROWS.length) % MENU_ROWS.length;
  if (menu.row !== ACTION_ROW) menu.action = DEFAULT_ACTION;
  refreshMenu();
  Sound.select();
}

function menuSet(key, value) {
  menu[key] = value;
  if (key === 'mode' && game.mode !== value) {
    game.mode = value;
    buildBackground(value);
    populate();
  }
  if (key === 'lang' && lang !== value) setLanguage(value);
  refreshMenu();
  Sound.select();
}

// ENTER / A gomb a főmenüben: az alsó gombsoron a kijelölt gomb, máshol START.
// A START a csatlakozó képernyőre visz, és aki megnyomta, rögtön P1 lesz.
function menuConfirm(device = null) {
  if (menu.row === ACTION_ROW && menu.action === 'options') openOptions('start');
  else if (menu.row === ACTION_ROW && menu.action === 'online') openCodeScreen();
  else if (menu.row === ACTION_ROW && menu.action === 'exit') exitGame();
  else if (GUEST) openCodeScreen();          // vendég: START helyett mindig a kódbeírás
  else {
    joined = [];
    openJoin(device);
  }
}

// Balra/jobbra lépteti az aktív menüsor értékét
function menuChange(dir = 1) {
  const row = MENU_ROWS[menu.row];
  const i = row.values.indexOf(menu[row.key]);
  menuSet(row.key, row.values[(i + dir + row.values.length) % row.values.length]);
}

ui.opts.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.currentTarget.blur();
    if (game.state !== 'start') return;
    Sound.init();
    const key = btn.dataset.row;
    menu.row = MENU_ROWS.findIndex((r) => r.key === key);
    menuSet(key, btn.dataset.value);
  });
});

// --- Nyelv váltása: minden data-i18n elem szövege frissül
function setLanguage(code) {
  lang = code;
  menu.lang = code;
  Store.set('lang', code);
  applyI18n();
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  lastPadCount = -1;
  if (game.state === 'start') buildBackground(game.mode);   // a mélységzóna-feliratok miatt
  refreshMenu();
}

// --- Asztali (.exe) verzió: a preload.js adja a window.desktop objektumot
const isDesktop = !!(window.desktop && window.desktop.quit);
document.body.classList.toggle('desktop', isDesktop);

function exitGame() {
  if (isDesktop) window.desktop.quit();
}

ui.btnExit.addEventListener('click', (e) => {
  e.currentTarget.blur();
  exitGame();
});

// --- Szünet menü
let pauseSel = 0;

function pauseOptions() {
  return ui.pauseOpts.filter((b) => (isDesktop || !b.classList.contains('desktop-only'))
    && !(Net.role === 'client' && b.classList.contains('host-only'))
    && !(!Net.role && b.classList.contains('net-only')));
}

function refreshPause() {
  pauseOptions().forEach((b, i) => b.classList.toggle('selected', i === pauseSel));
}

function pauseMove(d) {
  const n = pauseOptions().length;
  pauseSel = (pauseSel + d + n) % n;
  refreshPause();
  Sound.select();
}

function pauseSelect() {
  const b = pauseOptions()[pauseSel];
  if (b) doPauseAction(b.dataset.action);
}

function doPauseAction(action) {
  if (action === 'kick') {
    openKickScreen();
    return;
  }
  if (Net.role === 'client') {
    if (action === 'resume') closeClientMenu();
    else if (action === 'options') openOptions('pause');
    else if (action === 'menu') Net.leave();
    else if (action === 'exit') exitGame();
    return;
  }
  if (action === 'resume') resumeGame();
  else if (action === 'restart') startGame();
  else if (action === 'options') openOptions('pause');
  else if (action === 'menu') showMenu();
  else if (action === 'exit') exitGame();
}

ui.pauseOpts.forEach((b) => {
  b.addEventListener('click', (e) => {
    e.currentTarget.blur();
    if ((game.state === 'paused' || Net.menuOpen) && !optionsOpen) doPauseAction(b.dataset.action);
  });
});

// --- OPTIONS: zene és effektek hangereje
let optionsOpen = false;
let optionsReturn = 'start';
let optSel = 0;                    // 0 = zene, 1 = effektek, 2 = teljes képernyő, 3 = rezgés, 4 = vissza
const OPT_COUNT = 5;
const VOL_KEYS = ['music', 'sfx'];

function openOptions(from) {
  optionsOpen = true;
  optionsReturn = from;
  optSel = 0;
  ui.startScreen.classList.add('hidden');
  ui.pauseScreen.classList.add('hidden');
  ui.optionsScreen.classList.remove('hidden');
  refreshOptions();
  Sound.select();
}

function closeOptions() {
  optionsOpen = false;
  Store.set('volume', settings);
  ui.optionsScreen.classList.add('hidden');
  if (optionsReturn === 'start' && game.state === 'start') ui.startScreen.classList.remove('hidden');
  else if (game.state === 'paused' || Net.menuOpen) ui.pauseScreen.classList.remove('hidden');
  Sound.select();
}

function refreshOptions() {
  ui.volRows.forEach((row, i) => {
    const key = row.dataset.vol;
    const pct = Math.round(settings[key] * 100);
    row.classList.toggle('active', i === optSel);
    row.querySelector('.vol-fill').style.width = pct + '%';
    row.querySelector('.vol-val').textContent = pad(pct, 3) + '%';
  });
  ui.fsRow.classList.toggle('active', optSel === 2);
  ui.btnFullscreen.textContent = isFullscreen() ? t('opt_on') : t('opt_off');
  ui.btnFullscreen.classList.toggle('selected', isFullscreen());
  ui.vibRow.classList.toggle('active', optSel === 3);
  const vibOk = !!navigator.vibrate;
  ui.btnVibration.textContent = !vibOk ? t('opt_na') : (settings.vibrate ? t('opt_on') : t('opt_off'));
  ui.btnVibration.classList.toggle('selected', vibOk && settings.vibrate);
  ui.btnOptBack.classList.toggle('selected', optSel === 4);
}

function toggleVibration() {
  settings.vibrate = !settings.vibrate;
  Store.set('volume', settings);
  if (settings.vibrate) buzz(60);   // érezd, hogy bekapcsolt
  refreshOptions();
  Sound.select();
}

// --- Teljes képernyő (a böngésző Fullscreen API-jával; F11 is működik)
function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function toggleFullscreen() {
  const root = document.documentElement;
  try {
    if (isFullscreen()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      const req = root.requestFullscreen || root.webkitRequestFullscreen;
      if (req) {
        const p = req.call(root);
        if (p && p.catch) p.catch(() => {});
      }
    }
  } catch (e) {
    // ha a böngésző nem engedi, marad ablakban
  }
  Sound.select();
}

document.addEventListener('fullscreenchange', () => { if (optionsOpen) refreshOptions(); });
document.addEventListener('webkitfullscreenchange', () => { if (optionsOpen) refreshOptions(); });

function optionsMove(d) {
  optSel = (optSel + d + OPT_COUNT) % OPT_COUNT;
  refreshOptions();
  Sound.select();
}

function changeVolume(key, dir) {
  settings[key] = clamp(Math.round((settings[key] + dir * 0.1) * 10) / 10, 0, 1);
  Music.applyVolume();
  refreshOptions();
  Store.set('volume', settings);
  if (key === 'sfx') Sound.select();   // hallod az új effekt-hangerőt
}

function optionsAdjust(dir) {
  if (optSel < 2) changeVolume(VOL_KEYS[optSel], dir);
  else if (optSel === 2) toggleFullscreen();
  else if (optSel === 3) toggleVibration();
}

// ENTER / A gomb az OPTIONS menüben
function optionsConfirm() {
  if (optSel === 2) toggleFullscreen();
  else if (optSel === 3) toggleVibration();
  else if (optSel === 4) closeOptions();
}

function handleOptionsKey(code) {
  if (code === 'ArrowUp' || code === 'KeyW') optionsMove(-1);
  else if (code === 'ArrowDown' || code === 'KeyS') optionsMove(1);
  else if (code === 'ArrowLeft' || code === 'KeyA') optionsAdjust(-1);
  else if (code === 'ArrowRight' || code === 'KeyD') optionsAdjust(1);
  else if (code === 'Enter' || code === 'Space') optionsConfirm();
  else if (code === 'Escape' || code === 'KeyP' || code === 'Backspace') closeOptions();
  else if (code === 'KeyM') toggleMute();
}

ui.volBtns.forEach((b) => {
  b.addEventListener('click', (e) => {
    e.currentTarget.blur();
    Sound.init();
    const key = b.closest('.vol-row').dataset.vol;
    optSel = VOL_KEYS.indexOf(key);
    changeVolume(key, Number(b.dataset.dir));
  });
});

ui.btnOptions.addEventListener('click', (e) => {
  e.currentTarget.blur();
  Sound.init();
  if (game.state === 'start' && !optionsOpen) openOptions('start');
});

ui.btnFullscreen.addEventListener('click', (e) => {
  e.currentTarget.blur();
  optSel = 2;
  toggleFullscreen();
  refreshOptions();
});

ui.btnVibration.addEventListener('click', (e) => {
  e.currentTarget.blur();
  optSel = 3;
  toggleVibration();
});

ui.btnOptBack.addEventListener('click', (e) => {
  e.currentTarget.blur();
  if (optionsOpen) closeOptions();
});

ui.btnStart.addEventListener('click', (e) => {
  e.currentTarget.blur();
  Sound.init();
  if (game.state === 'start' && !optionsOpen && !GUEST) menuConfirm(touchActive ? 'touch' : null);
});

ui.btnAgain.addEventListener('click', (e) => {
  e.currentTarget.blur();
  Sound.init();
  if (game.state === 'gameover') startGame();
});

ui.btnMenu.addEventListener('click', (e) => {
  e.currentTarget.blur();
  if (game.state === 'gameover') openJoin();
});

let lastPadCount = -1;
function updatePadStatus(count) {
  if (count === lastPadCount) return;
  lastPadCount = count;
  if (count === 0) {
    ui.padStatus.textContent = t('pad_none');
    ui.padStatus.classList.remove('on');
  } else {
    ui.padStatus.textContent = count === 1 ? t('pad_one') : t('pad_many', { n: count });
    ui.padStatus.classList.add('on');
  }
}


/* ==========================================================================
   11. HÁTTÉR GENERÁLÁSA
   ========================================================================== */
function buildBackground(mode) {
  const g = bgCtx;
  const pal = PALETTES[mode];
  g.clearRect(0, 0, W, H);

  const skyN = pal.sky.length;
  for (let i = 0; i < skyN; i++) {
    const y0 = Math.floor(i * SURFACE_Y / skyN);
    const y1 = Math.floor((i + 1) * SURFACE_Y / skyN);
    g.fillStyle = pal.sky[i];
    g.fillRect(0, y0, W, y1 - y0);
  }

  world.stars = [];
  world.clouds = [];
  if (mode === 'night') {
    for (let i = 0; i < 45; i++) {
      g.fillStyle = choice(['#ffffff', '#9fb4ff', '#ffe9b0', '#6f7fa8']);
      g.fillRect(randInt(0, W - 1), randInt(0, SURFACE_Y - 10), 1, 1);
    }
    for (let i = 0; i < 12; i++) {
      world.stars.push({ x: randInt(0, W - 1), y: randInt(0, SURFACE_Y - 10), phase: rand(0, 6) });
    }
    drawPixelCircle(g, 262, 12, 6, '#e8e6cc');
    g.fillStyle = '#c9c6a8';
    g.fillRect(259, 10, 2, 2);
    g.fillRect(264, 14, 2, 1);
    g.fillRect(263, 8, 1, 1);
  } else {
    drawPixelCircle(g, 262, 13, 8, '#fff1a8');
    drawPixelCircle(g, 262, 13, 6, '#ffd84a');
    for (let i = 0; i < 4; i++) {
      world.clouds.push({ x: rand(0, W), y: randInt(5, 15), w: randInt(14, 28), speed: rand(2, 5) });
    }
  }

  g.fillStyle = pal.hills;
  for (let x = 0; x < W; x++) {
    const h = 5 + Math.round(2 * Math.sin(x * 0.045) + 2 * Math.sin(x * 0.11 + 1));
    g.fillRect(x, SURFACE_Y - h, 1, h);
  }

  const n = pal.water.length;
  for (let i = 0; i < n; i++) {
    const y0 = SURFACE_Y + Math.floor(i * WATER_H / n);
    const y1 = SURFACE_Y + Math.floor((i + 1) * WATER_H / n);
    g.fillStyle = pal.water[i];
    g.fillRect(0, y0, W, y1 - y0);
  }
  for (let i = 0; i < n - 1; i++) {
    const yb = SURFACE_Y + Math.floor((i + 1) * WATER_H / n);
    g.fillStyle = pal.water[i + 1];
    for (let x = 0; x < W; x += 2) g.fillRect(x, yb - 1, 1, 1);
    g.fillStyle = pal.water[i];
    for (let x = 1; x < W; x += 2) g.fillRect(x, yb, 1, 1);
  }

  g.fillStyle = pal.zoneLine;
  for (let x = 0; x < W; x += 6) {
    g.fillRect(x, Math.round(ZONE_Y1), 3, 1);
    g.fillRect(x, Math.round(ZONE_Y2), 3, 1);
  }
  drawText(g, t('zone_shallow'), W - 3, SURFACE_Y + 4, 1, pal.label, 'right', false);
  drawText(g, t('zone_mid'), W - 3, Math.round(ZONE_Y1) + 3, 1, pal.label, 'right', false);
  drawText(g, t('zone_deep'), W - 3, Math.round(ZONE_Y2) + 3, 1, pal.label, 'right', false);

  g.fillStyle = pal.label;
  for (let m = 10; m < CONFIG.MAX_DEPTH_METERS; m += 10) {
    const y = Math.round(depthToY(m / CONFIG.MAX_DEPTH_METERS));
    g.fillRect(0, y, m % 50 === 0 ? 4 : 2, 1);
  }

  for (let x = 0; x < W; x++) {
    const h = seabedHeight(x);
    g.fillStyle = pal.sand;
    g.fillRect(x, H - h, 1, h);
    g.fillStyle = pal.sandTop;
    g.fillRect(x, H - h, 1, 1);
  }
  g.fillStyle = pal.rock;
  for (let i = 0; i < 7; i++) {
    const x = randInt(6, W - 12);
    const w = randInt(4, 9);
    const h = randInt(2, 4);
    g.fillRect(x, H - seabedHeight(x) - h + 1, w, h);
    g.fillRect(x + 1, H - seabedHeight(x) - h, w - 2, 1);
  }

  world.weeds = [];
  for (let i = 0; i < 14; i++) {
    const x = randInt(4, W - 6);
    world.weeds.push({ x, base: H - seabedHeight(x), h: randInt(8, 26), phase: rand(0, 6) });
  }
}


/* ==========================================================================
   12. HALAK: SPAWN, MOZGÁS, KAPÁS
   ========================================================================== */
function speedFactor() {
  return game.event && game.event.type === 'calm' ? CONFIG.CALM_SPEED_FACTOR : 1;
}

function maxFish() {
  let base = game.mode === 'night' ? CONFIG.MAX_FISH_NIGHT : CONFIG.MAX_FISH_DAY;
  if (game.state !== 'start') base += 3 * (game.numPlayers - 1);   // több horog, több hal
  if (game.event && game.event.type === 'frenzy') base += CONFIG.FRENZY_EXTRA_FISH;
  if (gmods().frenzy && game.state !== 'start') base += 10;
  return base;
}

function pickSpecies() {
  if (game.event && game.event.type === 'frenzy' && Math.random() < 0.8) return 'minnow';
  if (gmods().frenzy && Math.random() < 0.6) return 'minnow';   // FISH FRENZY kártya
  const night = game.mode === 'night';
  const entries = [];
  for (const [key, sp] of Object.entries(SPECIES)) {
    if (sp.special && !(game.unlocked && game.unlocked.has(key))) continue;   // még nincs a tóban
    let w = night ? sp.spawnNight : sp.spawnDay;
    if (sp.rare) w *= CONFIG.RARE_CHANCE_MULTIPLIER * gmods().rare;   // GOLD RUSH / LUCKY LURE
    if (w > 0) entries.push([key, w]);
  }
  return pickWeighted(entries);
}

function spawnFish(onScreen = false, forcedKey = null) {
  const key = forcedKey || pickSpecies();
  const sp = SPECIES[key];
  const spr = SPRITES[key];
  const dir = Math.random() < 0.5 ? 1 : -1;
  const y = depthToY(rand(sp.depth[0], sp.depth[1]));
  const x = (onScreen || sp.stationary) ? rand(20, W - 20) : (dir > 0 ? -spr.width / 2 - 2 : W + spr.width / 2 + 2);
  const stamina = sp.stamina * CONFIG.STAMINA_MULTIPLIER * game.diff.stamina;
  const m = sp.motion;

  const f = {
    id: ++game.fishSeq,
    key, sp,
    w: spr.width, h: spr.height,
    x, y, baseY: y, targetY: y, dir,
    speed: sp.speed * rand(0.8, 1.2),
    t: rand(0, 10), phase: rand(0, Math.PI * 2),
    burst: 0,
    burstTimer: m.burstEvery ? rand(m.burstEvery[0], m.burstEvery[1]) : 0,
    turnTimer: m.turnEvery ? rand(m.turnEvery[0], m.turnEvery[1]) : 0,
    targetTimer: rand(m.wander[0], m.wander[1]),
    biteTimer: 0, cooldown: 0, fleeTimer: 0,
    hooked: false, dead: false,
    stamina, maxStamina: stamina,
    struggle: false, phaseTimer: 0,
    weight: Number(rand(sp.weight[0], sp.weight[1]).toFixed(2))
  };
  game.fish.push(f);
  return f;
}

function populate() {
  game.fish = [];
  game.oldOneActive = false;
  const n = Math.round(maxFish() * 0.7);
  for (let i = 0; i < n; i++) spawnFish(true);
}

function spawnOldOne() {
  spawnFish(false, 'oldone');
  game.oldOneActive = true;
  game.shake = 1.4;
  addBanner(t('ban_old'), 3.5, '#d8ff9a', true);
  Sound.rumble();
}

function updateSpawning(dt) {
  game.spawnTimer -= dt;
  if (game.spawnTimer > 0) return;
  const frenzy = game.event && game.event.type === 'frenzy';
  game.spawnTimer = frenzy ? 0.2 : CONFIG.SPAWN_INTERVAL;

  const count = game.fish.filter((f) => f.key !== 'oldone').length;
  if (count < maxFish()) {
    const nf = spawnFish(false);
    // PIRANHA: rajban érkezik
    for (let k = 1; k < (nf.sp.school || 0); k++) {
      const g = spawnFish(false, nf.key);
      g.dir = nf.dir;
      g.x = nf.x - nf.dir * k * 11;
      g.y = g.baseY = g.targetY = clamp(nf.y + rand(-6, 6), depthToY(nf.sp.depth[0]), depthToY(nf.sp.depth[1]));
    }
  }

  maybeSpawnItem();
  if (game.state === 'playing' && !game.oldOneActive) {
    const chance = CONFIG.OLD_ONE_SPAWN_CHANCE * CONFIG.RARE_CHANCE_MULTIPLIER *
      (game.mode === 'night' ? CONFIG.OLD_ONE_NIGHT_FACTOR : 1);
    if (Math.random() < chance) spawnOldOne();
  }
}

function mouthPos(f) {
  return { x: f.x + f.dir * (f.w / 2 - 1), y: f.y + (f.sp.mouthOffset || 0) };
}

function isNearHook(f, hk) {
  if (hk.state !== 'free' || hk.baited === false) return false;   // csali nélkül nem kap semmi
  if (f.invisible || f.leap > 0) return false;                     // láthatatlan / épp a levegőben
  const m = mouthPos(f);
  const tol = 5 + f.h * 0.25;
  return Math.abs(m.x - (hk.x - 1)) < tol && Math.abs(m.y - (hk.y + 3)) < tol;
}

function updateFish(f, dt) {
  f.t += dt;
  if (f.hooked) return;

  const sp = f.sp;
  const m = sp.motion;
  const minY = depthToY(sp.depth[0]);
  const maxY = depthToY(sp.depth[1]);
  if (f.cooldown > 0) f.cooldown -= dt;

  // --- különleges képességek (szabadon úszó hal)
  if (sp.ghost) {                       // GHOST FISH: időnként láthatatlan
    f.visTimer = (f.visTimer || rand(1.5, 3)) - dt;
    if (f.visTimer <= 0) {
      f.invisible = !f.invisible;
      f.visTimer = f.invisible ? rand(1.5, 2.5) : rand(2, 3.5);
    }
  }
  if (sp.stationary) {                  // STONEFISH: egy darabig a fenéken lapul, aztán eltűnik
    f.life = (f.life === undefined ? rand(30, 45) : f.life) - dt;
    if (f.life <= 0) { f.dead = true; return; }
  }
  if (f.cutCooldown > 0) f.cutCooldown -= dt;

  let burstMul = 1;
  if (m.burstMul) {
    f.burstTimer -= dt;
    if (f.burstTimer <= 0) {
      f.burst = m.burstLen || 0.35;
      f.burstTimer = rand(m.burstEvery[0], m.burstEvery[1]);
    }
    if (f.burst > 0) {
      f.burst -= dt;
      burstMul = m.burstMul;
    }
  }
  if (f.fleeTimer > 0) {
    f.fleeTimer -= dt;
    burstMul = Math.max(burstMul, 2.5);
  }

  f.targetTimer -= dt;
  if (f.targetTimer <= 0) {
    f.targetTimer = rand(m.wander[0], m.wander[1]);
    f.targetY = rand(minY, maxY);
  }

  // Érdeklődés a legközelebbi, előtte lévő szabad horog iránt
  const playing = game.state === 'playing';
  if (playing && f.cooldown <= 0 && f.fleeTimer <= 0) {
    for (const p of game.players) {
      const hk = p.hook;
      if (hk.state !== 'free' || hk.baited === false || f.invisible) continue;
      const dx = hk.x - f.x;
      const mg = pmods(p).magnet;   // FISH MAGNET
      if (Math.sign(dx) === f.dir && Math.abs(dx) < 50 * mg && Math.abs(hk.y - f.y) < 28 * mg) {
        f.targetY = clamp(hk.y + 3, minY, maxY);
        break;
      }
    }
  }
  f.baseY += clamp(f.targetY - f.baseY, -m.drift * dt, m.drift * dt);

  if (m.turnEvery) {
    f.turnTimer -= dt;
    if (f.turnTimer <= 0) {
      f.turnTimer = rand(m.turnEvery[0], m.turnEvery[1]);
      if (Math.random() < m.turnChance) f.dir *= -1;
    }
  }

  // Melyik horog mellett szaglászik?
  let nearPlayer = null;
  if (playing) {
    for (const p of game.players) {
      if (isNearHook(f, p.hook)) { nearPlayer = p; break; }
    }
  }
  const nibble = nearPlayer && f.cooldown <= 0 ? 0.35 : 1;
  const speed = f.speed * CONFIG.FISH_SPEED_MULTIPLIER * game.diff.speed * speedFactor() * burstMul * nibble;
  f.x += f.dir * speed * dt;
  f.y = f.baseY + Math.sin(f.t * m.freq + f.phase) * m.amp;

  // FLYING FISH: időnként kiugrik a vízből (közben nem kap rá a horogra)
  if (m.leapEvery) {
    if (f.leap > 0) {
      f.leap -= dt;
      const k = 1 - Math.max(0, f.leap) / LEAP_TIME;
      f.y = f.baseY - Math.sin(k * Math.PI) * (f.baseY - SURFACE_Y + 14);
      if (f.leap <= 0) splash(f.x, SURFACE_Y, 4, PALETTES[game.mode].foam);
    } else {
      f.leapTimer = (f.leapTimer === undefined ? rand(m.leapEvery[0], m.leapEvery[1]) : f.leapTimer) - dt;
      if (f.leapTimer <= 0) {
        f.leap = LEAP_TIME;
        f.leapTimer = rand(m.leapEvery[0], m.leapEvery[1]);
        splash(f.x, SURFACE_Y, 4, PALETTES[game.mode].foam);
      }
    }
  }

  // SWORDFISH: ha átúszik valaki damilján, elvágja
  if (sp.cutter && playing && !(f.cutCooldown > 0) && f.y > SURFACE_Y + 3) {
    const nose = mouthPos(f);
    for (const p of game.players) {
      if (p.hook.state === 'reset') continue;
      const tip = getRodGeometry(p).tip;
      if (distToSegment(nose.x, nose.y, tip.x, tip.y, p.hook.x, p.hook.y) < 2.5) {
        if (Math.random() < 0.5) cutLine(p, f);   // minden második keresztezésnél vág
        else f.cutCooldown = 2;
        break;
      }
    }
  }

  if (nearPlayer && f.cooldown <= 0 && f.fleeTimer <= 0) {
    f.biteTimer -= dt;
    if (f.biteTimer <= 0) {
      f.biteTimer = CONFIG.BITE_CHECK_INTERVAL;
      if (Math.random() < sp.bite * CONFIG.BITE_CHANCE_MULTIPLIER * game.diff.bite * pmods(nearPlayer).bite) {
        if (sp.baitThief && Math.random() < sp.baitThief) {   // PIRANHA: csak a csalit viszi el
          stealBait(nearPlayer, f);
          return;
        }
        hookFish(f, nearPlayer);
        return;
      }
      f.cooldown = CONFIG.BITE_COOLDOWN;
      effects.bubbles.push(makeBubble(nearPlayer.hook.x, nearPlayer.hook.y + 2));
    }
  } else {
    f.biteTimer = 0;
  }

  const margin = f.w / 2 + 14;
  if (f.x < -margin || f.x > W + margin) f.dead = true;
}

const LEAP_TIME = 0.75;   // a repülőhal ugrásának ideje (mp)

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const k = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
  return Math.hypot(px - (ax + dx * k), py - (ay + dy * k));
}

// PIRANHA: a csali eltűnik, amíg fel nem húzod a horgot a felszínre
function stealBait(p, f) {
  p.hook.baited = false;
  f.cooldown = 3;
  f.fleeTimer = 1;
  addPopup(t('pop_bait_stolen'), p.hook.x, p.hook.y - 8, '#ff6f9a', 1, 1.4);
  Sound.nom();
}

// SWORDFISH: elvágott damil
function cutLine(p, f) {
  f.cutCooldown = 4;
  const hk = p.hook;
  addPopup(t('pop_line_cut'), hk.x, Math.max(SURFACE_Y + 8, hk.y - 10), '#ff4a4a', 1, 1.4);
  if (hk.state === 'fight') {
    snapLine(p);
  } else {
    hk.state = 'reset';
    hk.tension = 0;
    Sound.snap();
  }
}

function cleanupFish() {
  game.fish = game.fish.filter((f) => {
    if (f.dead) {
      if (f.key === 'oldone') game.oldOneActive = false;
      return false;
    }
    return true;
  });
}


/* ==========================================================================
   13. HOROG, FÁRASZTÁS, TEKERÉS, KIFOGÁS
   ========================================================================== */
function updateHook(p, dt) {
  const hk = p.hook;
  const inp = p.in;
  p.sinceAction += dt;
  if (p.stealCd > 0) p.stealCd -= dt;
  if (inp.reel || inp.tug) countMash(p);            // kötélhúzás / kraken / sirály
  if (hookFrozen(p)) {                               // a horog most nem mozog
    if (inp.reel) { Net.owner = p.device; Sound.mash(); Net.owner = null; }
    return;
  }

  // Gombnyomkodás: minden REEL nyomás lendületet ad, ami magától lecseng
  const m = pmods(p);
  if (inp.reel) {
    p.reelVel = Math.min(CONFIG.MASH_MAX * Math.max(1, m.reel), p.reelVel + CONFIG.MASH_IMPULSE * m.reel);
    Net.owner = p.device;          // ezt a hangot a vendég maga játssza le
    Sound.mash();
    Net.owner = null;
  }
  p.reelVel *= Math.exp(-CONFIG.MASH_DECAY * dt);
  if (p.reelVel < 0.5) p.reelVel = 0;

  if (hk.state === 'free') {
    const sp = m.hookSpeed;
    if (inp.left) hk.x -= CONFIG.HOOK_SPEED_X * sp * dt;
    if (inp.right) hk.x += CONFIG.HOOK_SPEED_X * sp * dt;
    if (inp.down) hk.y += CONFIG.HOOK_SPEED_DOWN * sp * dt;
    if (inp.up) hk.y -= CONFIG.HOOK_SPEED_UP * sp * dt;
    hk.y -= p.reelVel * dt;
    hk.x = clamp(hk.x, 6, W - 6);
    hk.y = clamp(hk.y, HOOK_MIN_Y, playerMaxY(p));
    hk.tension = Math.max(0, hk.tension - CONFIG.TENSION_DECAY * 3 * dt);
    if (hk.baited === false && hk.y <= HOOK_MIN_Y + 1) {   // a felszínen új csali kerül a horogra
      hk.baited = true;
      addPopup(t('pop_rebait'), hk.x, SURFACE_Y - 10, '#ff6f9a', 1, 1);
      Sound.select();
    }
  } else if (hk.state === 'fight') {
    updateFight(p, dt);
  } else {
    idleHook(p, dt);
  }
}

// Menükben / szakadás után a horog visszatekeredik
function idleHook(p, dt) {
  const hk = p.hook;
  p.reelVel *= Math.exp(-CONFIG.MASH_DECAY * dt);
  if (hk.state === 'reset') {
    hk.y -= CONFIG.RESET_SPEED * dt;
    if (hk.y <= HOOK_MIN_Y) {
      hk.y = HOOK_MIN_Y;
      hk.state = 'free';
      hk.baited = true;
    }
  }
}

function attachFishToHook(f, hk) {
  f.x = hk.x - 1 - f.dir * (f.w / 2 - 1);
  f.y = hk.y + 3 - (f.sp.mouthOffset || 0);
}

function hookFish(f, p) {
  const hk = p.hook;
  f.hookY = hk.y;   // hol kapott (DEEP TROUBLE kártyához)
  f.hookedAt = game.time;
  f.gullChecked = false;
  f.invisible = false;
  f.leap = 0;
  f.ink = undefined;
  f.zapTimer = undefined;
  f.zap = 0;
  f.hooked = true;
  f.owner = p;
  f.stamina = f.maxStamina;
  f.struggle = true;
  f.phaseTimer = rand(0.8, 1.3);
  hk.state = 'fight';
  hk.fish = f;
  hk.tension = 0;
  hk.overload = 0;
  p.sinceAction = 99;
  if (f.sp.item) { f.stamina = 0; f.struggle = false; }   // a tárgyak nem küzdenek
  attachFishToHook(f, hk);
  for (let i = 0; i < 6; i++) effects.bubbles.push(makeBubble(hk.x + rand(-3, 3), hk.y + rand(0, 4)));
  addPopup('!', hk.x, hk.y - 8, p.style.tag, 2, 0.6);
  Sound.bite();
}

function updateFight(p, dt) {
  const hk = p.hook;
  const inp = p.in;
  const m = pmods(p);
  const tension0 = hk.tension;   // a kártyák a feszülés NÖVEKEDÉSÉT szorozzák
  const f = hk.fish;
  const sp = f.sp;
  const calm = speedFactor();
  const holding = inp.up;
  const sizeFactor = 1 / (1 + sp.pull / CONFIG.SIZE_PULL_DIVIDER);

  // --- különleges képességek horgon
  let lift = 1;                         // OCTOPUS: kapaszkodás közben nem jön fel
  if (sp.inker) {
    if (f.ink === undefined) { f.ink = 3.5; f.cling = 2; f.inkTimer = rand(5, 8); Sound.nom(); }
    if (f.ink > 0) f.ink -= dt;
    f.inkTimer -= dt;
    if (f.inkTimer <= 0 && f.stamina > 0) { f.ink = 3; f.cling = 1.2; f.inkTimer = rand(5, 8); }
    if (f.cling > 0 && f.stamina > 0) { f.cling -= dt; lift = 0; }
  }
  if (sp.zapper && f.stamina > 0) {     // ELECTRIC EEL: időnként áramot ad
    f.zapTimer = (f.zapTimer === undefined ? rand(2, 3.5) : f.zapTimer) - dt;
    if (f.zap > 0) f.zap -= dt;
    if (f.zapTimer <= 0) {
      f.zapTimer = rand(2.5, 4);
      f.zap = 0.6;
      hk.tension += 22;
      addPopup(t('pop_zap'), hk.x, hk.y - 10, '#ffe14a', 1, 0.8);
      Sound.zap();
    }
  }
  if (sp.leaper && f.struggle && f.stamina > 0 && Math.random() < dt * 0.7) {   // FLYING FISH: rángatózva ugrál
    hk.tension += 12;
    if (hk.y < SURFACE_Y + 30) splash(hk.x, SURFACE_Y, 5, PALETTES[game.mode].foam);
  }

  if (f.stamina > 0) {
    // Vergődés / pihenés váltakozik – ez adja az időzítést
    f.phaseTimer -= dt;
    if (f.phaseTimer <= 0) {
      f.struggle = !f.struggle;
      if (f.struggle) {
        f.phaseTimer = rand(0.7, 1.5) * (0.7 + sp.aggression * 0.4);
        f.dir = Math.random() < 0.5 ? -1 : 1;
        Sound.struggle();
      } else {
        f.phaseTimer = rand(0.6, 1.4) / (0.6 + sp.aggression * 0.4);
      }
    }

    const ratio = f.stamina / f.maxStamina;
    const pull = sp.pull * (f.struggle ? CONFIG.STRUGGLE_PULL : CONFIG.REST_PULL) * (0.4 + 0.6 * ratio) * calm;
    hk.y += pull * dt;
    if (f.struggle) {
      hk.x += f.dir * sp.pull * 0.9 * calm * dt;
      hk.tension += CONFIG.STRUGGLE_TENSION * sp.aggression * dt;
      if (Math.random() < dt * 10) effects.bubbles.push(makeBubble(f.x, f.y));
    }

    // Felfelé nyíl nyomva tartva: lassú, egyenletes tekerés
    if (holding) {
      hk.y -= CONFIG.REEL_SPEED_FIGHT * lift * dt;
      hk.tension += (f.struggle ? CONFIG.REEL_TENSION_STRUGGLE : CONFIG.REEL_TENSION_REST) * dt;
      f.stamina -= CONFIG.REEL_DRAIN * dt;
      p.sinceAction = 0;
    }
    // REEL gombnyomkodás: gyorsabb, de vergődés közben feszíti a damilt
    if (inp.reel) {
      hk.tension += f.struggle ? CONFIG.MASH_TENSION_STRUGGLE : CONFIG.MASH_TENSION_REST;
      f.stamina -= CONFIG.MASH_DRAIN;
      p.sinceAction = 0;
    }
    hk.y -= p.reelVel * CONFIG.MASH_FIGHT_FACTOR * sizeFactor * lift * dt;
  } else {
    // Kifáradt hal: tekerés és nyomkodás is könnyen húzza
    f.stamina = 0;
    f.struggle = false;
    if (holding) hk.y -= CONFIG.REEL_SPEED_TIRED * m.reel * sizeFactor * dt;
    hk.y -= p.reelVel * sizeFactor * dt;
    if (holding || inp.reel) p.sinceAction = 0;
  }

  if (inp.down) {
    hk.y += CONFIG.GIVE_LINE_SPEED * dt;
    hk.tension -= CONFIG.GIVE_LINE_RELIEF * dt;
  }
  if (inp.left) hk.x -= CONFIG.HOOKED_MOVE_X * dt;
  if (inp.right) hk.x += CONFIG.HOOKED_MOVE_X * dt;

  // TUG: erős rántás
  if (inp.tug) {
    if (f.stamina > 0) {
      f.stamina -= CONFIG.TUG_DAMAGE * m.tug * (f.struggle ? 1 : CONFIG.TUG_REST_BONUS);
      let tug = f.struggle ? CONFIG.TUG_TENSION_STRUGGLE : CONFIG.TUG_TENSION_REST;
      if (p.sinceAction < CONFIG.TUG_SPAM_WINDOW) tug += CONFIG.TUG_SPAM_PENALTY;
      if (f.zap > 0) tug *= 2;          // áramütés közben rántani veszélyes!
      hk.tension += tug;
      hk.y -= 4 * lift;
      if (f.stamina <= 0) {
        f.stamina = 0;
        addPopup(t('pop_tired'), hk.x, hk.y - 10, '#5fd0ff', 1, 1);
      }
    } else {
      hk.y -= 6;
      hk.tension += 3;
    }
    p.sinceAction = 0;
    effects.bubbles.push(makeBubble(hk.x, hk.y));
    Net.owner = p.device;
    Sound.tug();
    Net.owner = null;
  }

  if (hk.tension > tension0) hk.tension = tension0 + (hk.tension - tension0) * m.tension;   // STEEL / FRAYED LINE
  hk.tension = clamp(hk.tension - CONFIG.TENSION_DECAY * game.diff.decay * dt, 0, CONFIG.TENSION_MAX);
  if (f.stamina > 0 && p.sinceAction > CONFIG.REGEN_DELAY && p.reelVel < 5 && f.stamina < f.maxStamina) {
    f.stamina = Math.min(f.maxStamina, f.stamina + sp.regen * dt);
  }

  hk.x = clamp(hk.x, 6, W - 6);
  hk.y = clamp(hk.y, SURFACE_Y, playerMaxY(p));
  if (hk.x <= 8) f.dir = 1;
  else if (hk.x >= W - 8) f.dir = -1;
  attachFishToHook(f, hk);

  // Túlterhelés: a damil csak akkor szakad el, ha túl sokáig marad a piros zónában
  if (hk.tension >= CONFIG.SNAP_ZONE) {
    if (hk.overload === 0) Sound.warn();
    hk.overload += dt;
    if (hk.overload >= CONFIG.SNAP_GRACE) {
      hk.overload = 0;
      snapLine(p);
      return;
    }
  } else {
    hk.overload = Math.max(0, hk.overload - dt * 2);
  }
  if (hk.y < SURFACE_Y + 20) maybeSeagull(p);       // a felszín közelében jöhet a sirály
  if (hk.y <= SURFACE_Y + 1) {
    // amíg a sirály közeledik, a hal nem jön ki a vízből – előbb el kell hessegetni
    if (game.gull && game.gull.pIdx === p.index && game.gull.phase === 'swoop') hk.y = SURFACE_Y + 1;
    else catchFish(p);
  }
}

function catchFish(p) {
  const hk = p.hook;
  const f = hk.fish;
  if (f.sp.item) { collectItem(p, f); return; }     // mystery box / palack
  const m = pmods(p);
  let mult = (game.mode === 'night' ? CONFIG.NIGHT_SCORE_MULTIPLIER : 1) * CONFIG.POINTS_MULTIPLIER;
  if (game.golden > 0) mult *= 2;                  // GOLDEN HOUR
  p.pile.push(f.key);                              // a hal a csónakba kerül
  p.longest = Math.max(p.longest, game.time - (f.hookedAt || game.time));
  if (f.sp.rare) mult *= m.rarePts;                    // LUCKY LURE
  if (f.sp.points >= 50) mult *= m.bigPts;             // BIG FISH BONUS
  if (gmods().deepOnly && (f.hookY || 0) < ZONE_Y1) mult = 0;   // DEEP TROUBLE: a sekélyben fogott nem ér pontot
  const pts = Math.round(f.sp.points * mult);
  const nick = makeNickname(f);
  const species = fishName(f.key);

  p.score += pts;
  p.roundScore += pts;
  p.caught++;

  // Bónuszidő a fogás nehézsége szerint
  const bonusSec = Math.max(1, Math.round(f.sp.timeBonus * CONFIG.CATCH_TIME_MULTIPLIER * game.diff.time * gmods().timeBonus));
  game.timeLeft = Math.min(CONFIG.TIME_MAX, game.timeLeft + bonusSec);
  game.timeFlash = 0.8;
  addPopup(t('pop_time', { n: bonusSec }), hk.x, SURFACE_Y - 30, '#6cf06c', 1, 1.8);
  p.log.push({ nick, species, weight: f.weight, pts, round: game.level });
  if (!p.biggest || f.weight > p.biggest.weight) p.biggest = { nick, name: species, weight: f.weight };
  if (!p.rarest || f.sp.rarity > p.rarest.rarity) p.rarest = { nick, name: species, rarity: f.sp.rarity };

  const rare = !!f.sp.rare;
  const label = f.key === 'oldone' ? t('pop_legend') : nick;
  addPopup(label, hk.x, SURFACE_Y - 22, p.style.tag, 1, 1.8);
  addPopup(`${species} +${pts}`, hk.x, SURFACE_Y - 15, rare ? '#ffc933' : '#ffffff', 2, 1.8);
  splash(hk.x, SURFACE_Y, rare ? 22 : 12, PALETTES[game.mode].foam);
  if (f.key === 'oldone') {
    addBanner(t('ban_legend'), 2.5, '#d8ff9a', true);
    game.shake = 0.6;
  } else if (rare) {
    addBanner(t('ban_rare'), 1.8, '#ffc933', true);
  }
  Sound.catchFish(rare);

  f.dead = true;
  f.hooked = false;
  hk.fish = null;
  hk.state = 'free';
  hk.tension = 0;
  hk.y = HOOK_MIN_Y;

  if (game.state === 'playing' && p.roundScore >= game.target) roundClear(p);
}

function snapLine(p) {
  const hk = p.hook;
  p.snaps++;
  releaseFish(p);
  hk.state = 'reset';
  addBanner(game.numPlayers > 1 ? t('ban_snap_p', { p: playerName(p.index) }) : t('ban_snap'), 1.4, '#ff4a4a', true);
  for (let i = 0; i < 8; i++) {
    addParticle(hk.x, hk.y, rand(-40, 40), rand(-40, 20), rand(0.3, 0.6), '#d4d6de', 60);
  }
  Sound.snap();
}

// A hal lekerül a horogról és elmenekül
function releaseFish(p) {
  const hk = p.hook;
  const f = hk.fish;
  if (f) {
    f.hooked = false;
    f.owner = null;
    f.struggle = false;
    f.ink = 0;
    f.zap = 0;
    f.cling = 0;
    f.fleeTimer = 2.5;
    f.cooldown = 4;
    f.stamina = f.maxStamina;
    f.baseY = f.y;
    f.targetY = f.y;
  }
  hk.fish = null;
  hk.tension = 0;
}


/* ==========================================================================
   14. RAGADOZÓ (CÁPA)
   Bármikor megjelenhet, őrjáratozik, néha elúszik és később visszajön.
   Ha valakinek hal van a horgán, levadássza – kivéve a sekély vízben!
   ========================================================================== */
function resetPredatorTimer(first) {
  const min = first ? CONFIG.PREDATOR_FIRST_MIN : CONFIG.PREDATOR_RETURN_MIN;
  const max = first ? CONFIG.PREDATOR_FIRST_MAX : CONFIG.PREDATOR_RETURN_MAX;
  const cardF = (gmods().sharkWeek ? 2.8 : 1) * (game.players.some((p) => pmods(p).sharkBait) ? 1.6 : 1);   // SHARK WEEK / BAIT
  game.predatorTimer = rand(min, max) / (game.diff.predator * cardF);
}

function spawnPredator() {
  const dir = Math.random() < 0.5 ? 1 : -1;
  const spr = SPRITES.shark;
  game.predator = {
    x: dir > 0 ? -spr.width : W + spr.width,
    y: depthToY(rand(0.45, 0.85)),
    targetY: depthToY(rand(0.45, 0.85)),
    dir,
    w: spr.width,
    h: spr.height,
    state: 'enter',        // 'enter' | 'patrol' | 'hunt' | 'leave'
    timer: rand(CONFIG.PREDATOR_PATROL_MIN, CONFIG.PREDATOR_PATROL_MAX),
    huntTimer: 0,
    wanderTimer: 2,
    heart: 0,
    t: 0
  };
  addBanner(t('ban_shark'), 2.2, '#ff4a4a', true);
  Sound.predatorAlarm();
}

// Vadászható hal: horgon van, nem a vén óriás, és nincs a sekély zónában
function findPrey(pr) {
  let best = null;
  let bestDist = Infinity;
  for (const p of game.players) {
    const f = p.hook.fish;
    if (!f || f.key === 'oldone' || f.y < ZONE_Y1 - 2) continue;
    if (pmods(p).sharkImmune || f.sp.item) continue;                                          // SHARK REPELLENT
    const d = Math.hypot(f.x - pr.x, f.y - pr.y) * (pmods(p).sharkBait ? 0.1 : 1);   // SHARK BAIT
    if (d < bestDist) { best = f; bestDist = d; }
  }
  return best;
}

function predatorLeave(pr) {
  pr.state = 'leave';
  pr.dir = pr.x < W / 2 ? -1 : 1;
}

function updatePredator(dt) {
  if (!CONFIG.PREDATOR_ENABLED) return;
  const pr = game.predator;
  if (!pr) {
    if (game.state === 'playing' && game.level >= CONFIG.PREDATOR_START_LEVEL) {
      game.predatorTimer -= dt;
      if (game.predatorTimer <= 0) spawnPredator();
    }
    return;
  }

  pr.t += dt;
  const scale = game.diff.predator;
  const patrol = CONFIG.PREDATOR_SPEED * scale * speedFactor();
  const hunt = Math.min(CONFIG.PREDATOR_HUNT_MAX, CONFIG.PREDATOR_HUNT_SPEED * scale) * speedFactor();
  const minY = ZONE_Y1 + 8;
  const maxY = HOOK_MAX_Y - 4;

  // A THE OLD ONE-tól a cápa is fél
  const oldOneHooked = game.players.some((p) => p.hook.fish && p.hook.fish.key === 'oldone');
  if (oldOneHooked && pr.state !== 'leave') predatorLeave(pr);

  const prey = pr.state === 'leave' || game.state !== 'playing' ? null : findPrey(pr);
  if (prey && pr.state !== 'hunt') {
    pr.state = 'hunt';
    pr.huntTimer = 0;
    addPopup('!!', pr.x, pr.y - 12, '#ff4a4a', 2, 0.8);
    Sound.predatorSting();
  } else if (!prey && pr.state === 'hunt') {
    pr.state = 'patrol';
    pr.timer = rand(3, 6);
  }

  // Függőleges kóborlás
  pr.wanderTimer -= dt;
  if (pr.wanderTimer <= 0) {
    pr.wanderTimer = rand(2, 4);
    pr.targetY = rand(minY, maxY);
  }

  switch (pr.state) {
    case 'enter':
      pr.x += pr.dir * patrol * 1.3 * dt;
      pr.y += clamp(pr.targetY - pr.y, -10 * dt, 10 * dt);
      if (pr.x > 24 && pr.x < W - 24) pr.state = 'patrol';
      break;

    case 'patrol':
      pr.timer -= dt;
      pr.x += pr.dir * patrol * dt;
      pr.y += clamp(pr.targetY - pr.y, -10 * dt, 10 * dt);
      if ((pr.x < 20 && pr.dir < 0) || (pr.x > W - 20 && pr.dir > 0)) pr.dir *= -1;
      if (pr.timer <= 0) {
        if (Math.random() < 0.35) pr.timer = rand(3, 6);   // marad még egy kicsit
        else predatorLeave(pr);                            // elúszik (később visszajöhet)
      }
      break;

    case 'hunt': {
      pr.huntTimer += dt;
      const dx = prey.x - pr.x;
      const dy = prey.y - pr.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      if (Math.abs(dx) > 4) pr.dir = dx > 0 ? 1 : -1;
      pr.x += (dx / dist) * hunt * dt;
      pr.y += (dy / dist) * hunt * 0.8 * dt;
      const mouthX = pr.x + pr.dir * (pr.w / 2 - 3);
      const mouthY = pr.y + 2;
      if (Math.abs(mouthX - prey.x) < 6 + prey.w * 0.25 && Math.abs(mouthY - prey.y) < 5 + prey.h * 0.4) {
        eatHookedFish(prey);
        predatorLeave(pr);
      } else if (pr.huntTimer > CONFIG.PREDATOR_GIVEUP) {
        predatorLeave(pr);
      }
      break;
    }

    case 'leave':
      pr.x += pr.dir * patrol * 1.7 * dt;
      if (pr.x < -pr.w - 4 || pr.x > W + pr.w + 4) {
        game.predator = null;
        resetPredatorTimer(false);
        return;
      }
      break;
  }

  if (pr.state !== 'enter' && pr.state !== 'leave') pr.y = clamp(pr.y, minY, maxY);

  // A többi hal menekül a cápa elől
  for (const f of game.fish) {
    if (f.hooked || f.key === 'oldone') continue;
    if (Math.abs(f.x - pr.x) < 30 && Math.abs(f.y - pr.y) < 18 && f.fleeTimer <= 0) {
      f.fleeTimer = 1.2;
      f.dir = f.x < pr.x ? -1 : 1;
    }
  }

  // Szívverés-hang, vadászatnál gyorsabban
  if (pr.state !== 'leave' && game.state === 'playing') {
    pr.heart -= dt;
    if (pr.heart <= 0) {
      pr.heart = pr.state === 'hunt' ? 0.4 : 0.9;
      Sound.heartbeat();
    }
  }
}

function eatHookedFish(f) {
  const p = f.owner;
  if (!p) return;
  const hk = p.hook;
  f.dead = true;
  f.hooked = false;
  hk.fish = null;
  hk.state = 'reset';
  hk.tension = 0;
  p.eaten++;
  addPopup(t('pop_eaten'), f.x, f.y - 10, '#ff4a4a', 2, 1.2);
  for (let i = 0; i < 14; i++) {
    addParticle(f.x, f.y, rand(-30, 30), rand(-30, 30), rand(0.3, 0.8), choice(['#c02030', '#ff4a4a', '#ffffff']), 0);
  }
  game.shake = 0.4;
  Sound.chomp();
}


/* ==========================================================================
   15. RANDOM ESEMÉNYEK
   ========================================================================== */
function updateEvents(dt) {
  if (game.event) {
    game.event.time -= dt;
    if (game.event.time <= 0) {
      game.event = null;
      game.eventCooldown = CONFIG.EVENT_COOLDOWN;
    }
    return;
  }
  game.eventCooldown -= dt;
  if (game.eventCooldown > 0) return;
  game.eventTimer += dt;
  if (game.eventTimer >= CONFIG.EVENT_CHECK_INTERVAL) {
    game.eventTimer = 0;
    if (Math.random() < CONFIG.EVENT_CHANCE) {
      const options = [['frenzy', 3], ['calm', 2], ['storm', 2], ['golden', 1]];
      if (!game.oldOneActive) options.push(['shadow', 1]);
      if (game.level >= 3 && !game.kraken) options.push(['kraken', 1.2]);   // a kraken a 3. körtől jöhet
      startEvent(pickWeighted(options));
    }
  }
}

function startEvent(type) {
  if (type === 'storm') {
    game.event = { type, time: CONFIG.STORM_TIME };
    game.wind = Math.random() < 0.5 ? -1 : 1;
    game.flashTimer = rand(1, 2.5);
    addBanner(t('ban_storm'), 2, '#9fe8ff', true);
    Sound.thunder();
    return;
  }
  if (type === 'golden') {
    game.event = { type, time: CONFIG.GOLDEN_TIME };
    game.golden = CONFIG.GOLDEN_TIME;
    addBanner(t('ban_golden'), 2, '#ffd23f', true);
    Sound.roundClear();
    return;
  }
  if (type === 'kraken') {
    game.event = { type, time: 30 };
    startKraken();
    return;
  }
  if (type === 'frenzy') {
    game.event = { type, time: CONFIG.FRENZY_DURATION };
    addBanner(t('ban_frenzy'), 2, '#ffc933', true);
    for (let i = 0; i < 6; i++) spawnFish(false, 'minnow');
    Sound.event();
  } else if (type === 'calm') {
    game.event = { type, time: CONFIG.CALM_DURATION };
    addBanner(t('ban_calm'), 2, '#9fe8ff', false);
    Sound.event();
  } else if (type === 'shadow') {
    game.event = { type, time: 3 };
    spawnOldOne();
  }
}


/* ==========================================================================
   16. EFFEKTEK
   ========================================================================== */
function addParticle(x, y, vx, vy, life, color, gravity = 0) {
  effects.particles.push({ x, y, vx, vy, life, color, gravity });
}

function splash(x, y, n, color) {
  if (Net.role === 'host') Net.event(['sp', Math.round(x), Math.round(y), n, color]);
  for (let i = 0; i < n; i++) {
    addParticle(x + rand(-3, 3), y, rand(-35, 35), rand(-80, -30), rand(0.4, 0.9), color, 170);
  }
}

function makeBubble(x, y) {
  return { x, y, vy: rand(12, 24), phase: rand(0, 6), size: Math.random() < 0.2 ? 2 : 1 };
}

function addPopup(text, x, y, color, scale = 1, life = 1.4) {
  if (Net.role === 'host') Net.event(['pp', text, Math.round(x), Math.round(y), color, scale, life]);
  effects.popups.push({ text, x, y, color, scale, life });
}

function addBanner(text, life, color, flash) {
  if (Net.role === 'host') Net.event(['bn', text, life, color, flash]);
  effects.banners.push({ text, life, color, flash });
  if (effects.banners.length > 4) effects.banners.shift();
}

function updateEffects(dt) {
  for (const p of effects.particles) {
    p.life -= dt;
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  effects.particles = effects.particles.filter(
    (p) => p.life > 0 && !(p.gravity > 100 && p.vy > 0 && p.y > SURFACE_Y + 1)
  );

  if (Math.random() < dt * 2.5) {
    const x = randInt(4, W - 4);
    effects.bubbles.push(makeBubble(x, H - seabedHeight(x) - 1));
  }
  for (const b of effects.bubbles) {
    b.y -= b.vy * dt;
    b.x += Math.sin(game.time * 3 + b.phase) * 4 * dt;
  }
  effects.bubbles = effects.bubbles.filter((b) => b.y > SURFACE_Y + 1);

  for (const p of effects.popups) {
    p.life -= dt;
    p.y -= 10 * dt;
  }
  effects.popups = effects.popups.filter((p) => p.life > 0);

  if (effects.banners.length) {
    effects.banners[0].life -= dt;
    if (effects.banners[0].life <= 0) effects.banners.shift();
  }
}

function updateBoat(p, dt) {
  const diff = p.hook.x - p.boat.x;
  const bm = pmods(p).boat * pileFactor(p);   // HEAVY / SPEED BOAT kártya és a halom a csónakban
  const maxStep = 45 * bm * dt;
  p.boat.x += clamp(diff * 2.5 * bm * dt, -maxStep, maxStep);
  p.boat.x = clamp(p.boat.x, 16, W - 16);
}


/* ==========================================================================
   17. RAJZOLÁS
   ========================================================================== */
function drawSkyDynamic() {
  ctx.fillStyle = '#ffffff';
  if (game.mode === 'day') {
    for (const c of world.clouds) {
      const x = Math.round(((c.x + game.time * c.speed) % (W + 40)) - 20);
      ctx.fillRect(x, c.y, c.w, 3);
      ctx.fillRect(x + 3, c.y - 2, c.w - 8, 2);
    }
  } else {
    for (const s of world.stars) {
      if (Math.floor(game.time * 2 + s.phase) % 3 === 0) ctx.fillRect(s.x, s.y, 1, 1);
    }
  }
}

function drawLightRays() {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) {
    const x0 = 30 + i * 80 + Math.sin(game.time * 0.4 + i) * 14;
    ctx.beginPath();
    ctx.moveTo(x0, SURFACE_Y);
    ctx.lineTo(x0 + 14, SURFACE_Y);
    ctx.lineTo(x0 + 46, ZONE_Y2);
    ctx.lineTo(x0 + 26, ZONE_Y2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawWeeds() {
  const [c1, c2] = PALETTES[game.mode].weed;
  for (const w of world.weeds) {
    for (let i = 0; i < w.h; i++) {
      const sx = w.x + Math.round(Math.sin(game.time * 1.6 + w.phase + i * 0.25) * (i / w.h) * 3);
      ctx.fillStyle = i % 3 === 0 ? c2 : c1;
      ctx.fillRect(sx, w.base - i, 2, 1);
    }
  }
}

function drawBubbles() {
  ctx.fillStyle = game.mode === 'day' ? 'rgba(220,245,255,0.75)' : 'rgba(150,190,240,0.6)';
  for (const b of effects.bubbles) ctx.fillRect(Math.round(b.x), Math.round(b.y), b.size, b.size);
}

function lurePos(f) {
  const lx = f.dir > 0 ? f.sp.lure.x : f.w - 1 - f.sp.lure.x;
  return { x: Math.round(f.x - f.w / 2) + lx, y: Math.round(f.y - f.h / 2) + f.sp.lure.y };
}

function eyePos(f) {
  const ex = f.dir > 0 ? f.sp.eye.x : f.w - 1 - f.sp.eye.x;
  return { x: Math.round(f.x - f.w / 2) + ex, y: Math.round(f.y - f.h / 2) + f.sp.eye.y };
}

function drawFish(f) {
  const img = SPRITES[f.key];
  let x = f.x - f.w / 2;
  const y = f.y - f.h / 2;
  const exhausted = f.hooked && f.stamina <= 0;
  if (f.hooked && f.struggle) x += Math.round(rand(-1, 1));

  // GHOST FISH: áttetsző, láthatatlan állapotban szinte eltűnik
  if (f.sp.ghost) ctx.globalAlpha = f.invisible && !f.hooked ? 0.1 : 0.75;
  drawSprite(ctx, img, x, y, f.dir < 0, exhausted, f.sp.wiggle || 0, f.t);
  ctx.globalAlpha = 1;

  // ELECTRIC EEL: szikrák áramütéskor
  if (f.zap > 0) {
    ctx.fillStyle = Math.random() < 0.5 ? '#ffe14a' : '#ffffff';
    for (let i = 0; i < 7; i++) ctx.fillRect(Math.round(x + rand(-3, f.w + 3)), Math.round(y + rand(-4, f.h + 4)), 1, 1);
  }
  // STONEFISH: közelről világít a szeme (lelepleződik)
  if (f.sp.stationary && game.players.some((p) => Math.abs(p.hook.x - f.x) < 35 && Math.abs(p.hook.y - f.y) < 35)) {
    const ex = f.dir > 0 ? 9 : f.w - 1 - 9;
    ctx.fillStyle = Math.sin(game.time * 8) > 0 ? '#ffdd55' : '#ff6a3a';
    ctx.fillRect(Math.round(x) + ex, Math.round(y) + 2, 1, 1);
  }

  if (f.sp.sparkle && Math.random() < 0.2) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(x + rand(0, f.w)), Math.round(y + rand(-2, f.h + 2)), 1, 1);
  }
  if (f.sp.lure && !exhausted) {
    const p = lurePos(f);
    ctx.fillStyle = Math.sin(game.time * 6 + f.phase) > 0 ? '#e0ffff' : '#6fd8ff';
    ctx.fillRect(p.x, p.y, 1, 1);
  }
  if (f.hooked && f.struggle && Math.floor(game.time * 8) % 2 === 0) {
    drawText(ctx, '!', f.x, y - 8, 1, '#ff5050', 'center');
  }
}

function drawAllFish() {
  for (const f of game.fish) if (!f.hooked) drawFish(f);
  for (const p of game.players) if (p.hook.fish) drawFish(p.hook.fish);
  drawInk();
}

// OCTOPUS: tintafelhő a hal körül (eltakarja a környéket)
function drawInk() {
  for (const f of game.fish) {
    if (!(f.ink > 0)) continue;
    const a = Math.min(1, f.ink) * 0.85;
    ctx.fillStyle = `rgba(12,6,22,${a.toFixed(2)})`;
    for (let i = 0; i < 6; i++) {
      const ox = Math.sin(f.t * 1.3 + i * 1.7) * 9;
      const oy = Math.cos(f.t * 1.1 + i * 2.1) * 6;
      ctx.beginPath();
      ctx.arc(f.x + ox, f.y + oy, 10 + (i % 3) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPredator() {
  const pr = game.predator;
  if (!pr) return;
  const onScreen = pr.x > -pr.w / 2 && pr.x < W + pr.w / 2;
  if (onScreen) {
    const wobble = Math.round(Math.sin(pr.t * 4));
    drawSprite(ctx, SPRITES.shark, pr.x - pr.w / 2, pr.y - pr.h / 2 + wobble, pr.dir < 0);
  }
  // Érkezés-jelző a képernyő szélén
  if (pr.state === 'enter' && Math.floor(game.time * 6) % 2 === 0) {
    const fromLeft = pr.dir > 0;
    const label = fromLeft ? `> ${t('shark')}` : `${t('shark')} <`;
    drawText(ctx, label, fromLeft ? 3 : W - 3, pr.y - 5, 2, '#ff4a4a', fromLeft ? 'left' : 'right');
  }
}

function getRodGeometry(p) {
  const hk = p.hook;
  const storm = game.event && game.event.type === 'storm' ? 3 : 1;   // viharban erősebben ring
  const bob = Math.round(Math.sin(game.time * 2.2 + p.index * 1.7) * storm) + Math.min(2, Math.floor(pileCount(p) / 4));
  const facing = hk.x >= p.boat.x ? 1 : -1;
  const bx = Math.round(p.boat.x - 13);
  const by = SURFACE_Y - 3 + bob;
  const px = Math.round(p.boat.x - 4);
  const py = by - 6;
  const hand = { x: facing > 0 ? px + 5 : px + 2, y: py + 5 };
  const bend = hk.state === 'fight' ? 5 : 0;
  const tip = { x: hand.x + facing * 12, y: hand.y - 9 + bend };
  return { facing, bx, by, px, py, hand, tip };
}

function drawLineAndHook(p, tip) {
  const hk = p.hook;
  const danger = hk.tension > 70 && Math.floor(game.time * 12) % 2 === 0;
  const lineColor = danger ? '#ff4a4a' : p.style.line;
  const hx = Math.round(hk.x);
  const hy = Math.round(hk.y);
  pixelLine(ctx, tip.x, tip.y, hx, hy, lineColor);
  drawSprite(ctx, SPRITES.hook, hx - 2, hy);
  if (hk.state === 'free' && hk.baited !== false) {
    const wig = Math.floor(game.time * 5 + p.index) % 2;
    ctx.fillStyle = '#ff6f9a';
    ctx.fillRect(hx - 2, hy + 2 + wig, 1, 2);
  }
}

function drawSurface() {
  const pal = PALETTES[game.mode];
  ctx.fillStyle = pal.surface;
  for (let x = 0; x < W; x++) {
    const off = Math.round(Math.sin(x * 0.18 + game.time * 3) * 0.8 + Math.sin(x * 0.05 - game.time * 1.3) * 0.6);
    ctx.fillRect(x, SURFACE_Y + off, 1, 1);
  }
  ctx.fillStyle = pal.foam;
  for (let i = 0; i < 8; i++) {
    const raw = i * 47 + game.time * 12 * (i % 2 ? 1 : -1);
    const x = Math.floor(((raw % W) + W) % W);
    ctx.fillRect(x, SURFACE_Y - 1, 2, 1);
  }
}

function drawBoat(p, r) {
  drawSprite(ctx, p.style.person, r.px, r.py, r.facing < 0);
  ctx.drawImage(p.style.boat, r.bx, r.by);
  drawPile(p, r);
  pixelLine(ctx, r.hand.x, r.hand.y, r.tip.x, r.tip.y, '#6b4220');
  if (game.mode === 'night') {
    const lx = r.facing > 0 ? r.bx + 2 : r.bx + 23;
    ctx.fillStyle = '#555a66';
    ctx.fillRect(lx, r.by - 4, 1, 4);
    ctx.fillStyle = Math.sin(game.time * 9 + p.index) > -0.8 ? '#ffe27a' : '#c9a040';
    ctx.fillRect(lx - 1, r.by - 6, 3, 2);
  }
  if (game.numPlayers > 1 || p.name) {
    const label = p.name || pLabel(p.index);
    const half = textWidth(label, 1) / 2;
    const lx = clamp(r.px + 4, half + 1, W - half - 1);
    drawText(ctx, label, lx, r.py - 9, 1, p.style.tag, 'center');
    // aktív kártyák: kis színes pöttyök a név mellett (piros = átok, zöld = előny)
    (p.cards || []).forEach((id, k) => {
      ctx.fillStyle = CARD_COLORS[CARDS[id].type];
      ctx.fillRect(Math.round(lx + half + 2 + k * 3), r.py - 8, 2, 2);
    });
    if (hasCrown(p)) {
      const bob = Math.round(Math.sin(game.time * 3) * 0.6);
      ctx.drawImage(SPRITES.crown, Math.round(lx) - 3, r.py - 16 + bob);
    }
  }
}

function cutGlow(g, x, y, r) {
  g.fillStyle = 'rgba(0,0,0,0.3)';
  for (const s of [1, 0.75, 0.5, 0.3]) {
    g.beginPath();
    g.arc(x, y, r * s, 0, Math.PI * 2);
    g.fill();
  }
}

function drawDarkness() {
  const g = darkCtx;
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, W, H);
  const bands = 8;
  for (let i = 0; i < bands; i++) {
    const y0 = SURFACE_Y + Math.floor(i * WATER_H / bands);
    const y1 = SURFACE_Y + Math.floor((i + 1) * WATER_H / bands);
    g.fillStyle = `rgba(0,0,8,${0.15 + 0.62 * (i / (bands - 1))})`;
    g.fillRect(0, y0, W, y1 - y0);
  }
  g.globalCompositeOperation = 'destination-out';
  for (const p of game.players) {
    cutGlow(g, p.hook.x, p.hook.y + 2, 30);
    cutGlow(g, p.boat.x, SURFACE_Y + 2, 16);
  }
  for (const f of game.fish) {
    if (f.sp.lure) { const lp = lurePos(f); cutGlow(g, lp.x, lp.y, 12); }
    if (f.sp.glow) cutGlow(g, f.x, f.y, f.sp.glow);
    if (f.sp.eye) { const ep = eyePos(f); cutGlow(g, ep.x, ep.y, 8); }
  }
  const pr = game.predator;
  if (pr) {
    const ex = pr.x + pr.dir * (pr.w / 2 - 5);
    cutGlow(g, ex, pr.y - 2, 7);
  }
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkCanvas, 0, 0);
}

function drawParticles() {
  for (const p of effects.particles) {
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
  }
}

function drawPopups() {
  for (const p of effects.popups) {
    if (p.life < 0.3 && Math.floor(p.life * 20) % 2 === 0) continue;
    const half = textWidth(p.text, p.scale) / 2;
    const x = clamp(p.x, half + 2, W - half - 2);
    drawText(ctx, p.text, x, p.y, p.scale, p.color, 'center');
  }
}

function drawBanner() {
  const b = effects.banners[0];
  if (!b) return;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 46, W, 18);
  if (b.flash && Math.floor(b.life * 6) % 2 === 1) return;
  drawText(ctx, b.text, W / 2, 50, 2, b.color, 'center');
}

// A mindenkire ható kártyák a bal felső sarokban
function drawGlobalCards() {
  if (!game.cards || !game.cards.length || !(game.state === 'playing' || game.state === 'roundclear' || game.state === 'paused')) return;
  let y = game.event && game.event.type !== 'shadow' ? 11 : 4;
  for (const c of game.cards) {
    if (CARDS[c.id].type !== 'global') continue;
    drawText(ctx, cardName(c.id), 4, y, 1, CARD_COLORS.global);
    y += 7;
  }
}

function drawEventIndicator() {
  if (game.state !== 'playing') return;
  if (game.golden > 0) {                        // Golden Hour (eseményből vagy ládából)
    drawText(ctx, `${t('ev_golden')} ${pad(Math.ceil(game.golden), 2)}`, W / 2, 4, 1, '#ffd23f', 'center');
  }
  const ev = game.event;
  if (!ev || ev.type === 'shadow' || ev.type === 'golden' || ev.type === 'kraken') return;
  const LABELS = { frenzy: ['ev_frenzy', '#ffc933'], calm: ['ev_calm', '#9fe8ff'], storm: ['ev_storm', '#9fe8ff'] };
  const [key, color] = LABELS[ev.type] || ['ev_calm', '#9fe8ff'];
  drawText(ctx, `${t(key)} ${pad(Math.ceil(ev.time), 2)}`, 4, 4, 1, color);
}


function render() {
  ctx.save();
  if (game.shake > 0) ctx.translate(Math.round(rand(-1.5, 1.5)), Math.round(rand(-1, 1)));

  ctx.drawImage(bgCanvas, 0, 0);
  drawSkyDynamic();
  if (game.mode === 'day') drawLightRays();
  drawWeeds();
  drawBubbles();
  drawAllFish();
  drawKraken();
  drawPredator();

  const rods = game.players.map((p) => getRodGeometry(p));
  game.players.forEach((p, i) => drawLineAndHook(p, rods[i].tip));
  drawTug();
  drawSurface();
  game.players.forEach((p, i) => drawBoat(p, rods[i]));
  drawGull();

  if (game.mode === 'night') drawDarkness();
  drawStorm();
  drawGolden();

  drawParticles();
  drawPopups();
  drawBanner();
  drawEventIndicator();
  drawGlobalCards();
  ctx.restore();

  if (Net.role === 'client' && Net.rtt) {
    const col = Net.rtt < 80 ? '#6cf06c' : Net.rtt < 160 ? '#ffc933' : '#ff4a4a';
    drawText(ctx, `PING ${Net.rtt}`, W - 3, 3, 1, col, 'right');
  }
  if (Net.role === 'client' && Net.mirror && game.state === 'paused') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    drawText(ctx, t('host_paused'), W / 2, H / 2 - 6, 2, '#ffc933', 'center');
  }

}


/* ==========================================================================
   18. HUD FRISSÍTÉS
   ========================================================================== */
function updateHUD() {
  setText(ui.p1Label, game.numPlayers > 1 ? playerName(0) : t('hud_score'));
  for (let i = 1; i < 4; i++) if (game.players[i]) setText(ui.hudLabels[i], playerName(i));
  ui.scores.forEach((el, i) => {
    const p = game.players[i];
    if (p || i === 0) setText(el, pad(p ? p.score : 0, 5));
  });
  setText(ui.round, game.matchRounds ? `${pad(game.level, 2)}/${pad(game.matchRounds, 2)}` : pad(game.level, 2));
  setText(ui.target, pad(game.target, 4));
  const reached = game.players.some((p) => p.roundScore >= game.target);
  ui.target.classList.toggle('reached', reached);

  const secs = Math.ceil(game.timeLeft);
  setText(ui.time, `${pad(Math.floor(secs / 60), 2)}:${pad(secs % 60, 2)}`);
  ui.time.classList.toggle('low', game.state === 'playing' && secs <= 10 && game.timeFlash <= 0);
  ui.time.classList.toggle('bonus', game.timeFlash > 0);

  setText(ui.mode, t('mode_' + game.mode));
  ui.mode.classList.toggle('night', game.mode === 'night');

  game.players.forEach((p, i) => updatePanel(ui.panels[i], p));
  updateVoteBox();
  updateTouchUI();
  const cv = game.state === 'cards' ? cardView() : null;
  if (cv) setText(ui.cardTimer, t('card_time', { n: Math.ceil(cv.time) }));
}

function updatePanel(pn, p) {
  const hk = p.hook;
  const f = hk.fish;
  setText(pn.tag, (hasCrown(p) ? '♛ ' : '') + (p.name || pLabel(p.index)));
  const ch = panelCardsHtml(p);
  if (pn.cards && pn.cards._html !== ch) { pn.cards.innerHTML = ch; pn.cards._html = ch; }

  setText(pn.depth, pad(Math.round(yToDepthFrac(hk.y) * CONFIG.MAX_DEPTH_METERS), 2));
  setText(pn.fish, pad(p.caught, 2));
  setText(pn.rpts, `${pad(p.roundScore, 4)}/${pad(game.target, 4)}`);

  const hunted = f && game.predator && game.predator.state === 'hunt' && findPrey(game.predator) === f;

  if (f) {
    pn.root.classList.remove('idle');
    setText(pn.fishName, fishName(f.key));
    setWidth(pn.stFill, (f.stamina / f.maxStamina) * 100);
    setText(pn.stVal, pad(Math.ceil(f.stamina), 3));
    pn.stFill.classList.toggle('empty', f.stamina <= 0);
    let status, cls;
    if (hk.overload > 0) { status = t('st_break'); cls = 'status-danger'; }
    else if (hunted) { status = t('st_shark'); cls = 'status-danger'; }
    else if (f.stamina <= 0) { status = t('st_tired'); cls = 'status-tired'; }
    else if (f.struggle) { status = t('st_struggle'); cls = 'status-struggle'; }
    else { status = t('st_rest'); cls = 'status-rest'; }
    setText(pn.status, status);
    setClass(pn.status, 'fight-status ' + cls);
  } else {
    pn.root.classList.add('idle');
    setText(pn.fishName, hk.state === 'reset' ? t('line_lost') : (hk.baited === false ? t('no_bait') : t('no_fish')));
    setText(pn.status, '');
    setWidth(pn.stFill, 0);
    setText(pn.stVal, '---');
  }
  setWidth(pn.tFill, (hk.tension / CONFIG.TENSION_MAX) * 100);
  setText(pn.tVal, pad(Math.min(hk.tension, CONFIG.TENSION_MAX), 3));
  pn.tFill.classList.toggle('danger', hk.tension > 70);
  setWidth(pn.rFill, (p.reelVel / CONFIG.MASH_MAX) * 100);
  setText(pn.rVal, pad(p.reelVel / CONFIG.MASH_MAX * 100, 3));
}


/* ==========================================================================
   19. KÖRÖK, SZINTEK, JÁTÉKMENET-VEZÉRLÉS
   ========================================================================== */
function setState(s) {
  game.state = s;
  game.stateTime = 0;
  document.body.classList.toggle('in-game', s === 'playing' || s === 'paused' || s === 'roundclear');
  scheduleFit();
}

function resetPlayerHook(p) {
  const x = startXFor(p.index, game.numPlayers);
  releaseFish(p);
  p.hook.x = x;
  p.hook.y = HOOK_MIN_Y + 30;
  p.hook.state = 'free';
  p.hook.baited = true;
  p.boat.x = x;
  p.reelVel = 0;
  p.sinceAction = 99;
}

function startGame() {
  if (Net.role === 'host' && Net.vote) return;   // szavazás közben nem indul meccs
  if (awardsRun) finishAwards();
  ui.awardsScreen.classList.add('hidden');
  if (!joined.length) joined = ['kbR'];
  game.numPlayers = joined.length;
  game.matchRounds = game.numPlayers > 1 ? lobbyRounds : 0;   // egyjátékos: végtelen
  game.baseMode = menu.mode;
  game.cards = [];
  game.pendingCards = [];
  game.cardPick = null;
  game.roundWinners = [];
  game.lastRoundWinner = null;
  game.fishDeck = Object.keys(SPECIES).filter((k) => SPECIES[k].special).sort(() => Math.random() - 0.5);
  game.unlocked = new Set();
  game.mode = menu.mode;
  setPlayerCount(game.numPlayers);
  game.players = joined.map((dev, i) => {
    const p = makePlayer(i, game.numPlayers, dev);
    p.name = nameOf(dev);
    return p;
  });
  effects.particles = [];
  effects.bubbles = [];
  effects.popups = [];
  effects.banners = [];
  buildBackground(game.mode);

  ui.startScreen.classList.add('hidden');
  ui.gameoverScreen.classList.add('hidden');
  ui.pauseScreen.classList.add('hidden');
  ui.joinScreen.classList.add('hidden');
  Music.setDuck(1);
  Music.play(game.mode);         // nappali vagy éjszakai zenék
  setState('playing');
  startRound(1);
}

function startRound(level) {
  // kártyák: a most induló körre az előző kör végén választottak érvényesek
  game.cards = level > 1 ? (game.pendingCards || []) : [];
  game.pendingCards = [];
  applyCardMods();
  // HALPAKLI: körönként új különleges fajok kerülnek a tóba (az első kör alap halakkal indul)
  game.newFish = [];
  if (level === 1) game.unlocked = new Set();
  else {
    const n = game.matchRounds ? (game.matchRounds <= 3 ? 3 : 2) : 1;
    for (let i = 0; i < n && game.fishDeck.length; i++) {
      const k = game.fishDeck.shift();
      game.unlocked.add(k);
      game.newFish.push(k);
    }
  }
  const wantMode = gmods().night ? 'night' : game.baseMode;   // NIGHT FALLS
  if (game.mode !== wantMode) {
    game.mode = wantMode;
    buildBackground(wantMode);
    Music.play(wantMode);
  }
  game.level = level;
  game.diff = computeDifficulty(level);
  game.target = CONFIG.TARGET_BASE + (level - 1) * CONFIG.TARGET_STEP;
  game.timeLeft = CONFIG.ROUND_DURATION;
  game.lastTick = -1;
  game.event = null;
  game.eventTimer = 0;
  game.eventCooldown = CONFIG.EVENT_START_DELAY;
  game.spawnTimer = 0;
  game.predator = null;
  resetPredatorTimer(true);
  for (const p of game.players) {
    p.roundScore = 0;
    p.pile = [];            // üres csónakkal indul a kör
    p.stealCd = 0;
    resetPlayerHook(p);
  }
  game.tug = null;
  game.gull = null;
  game.kraken = null;
  game.golden = 0;
  game.flash = 0;
  populate();

  if (game.matchRounds) {
    addBanner(t('ban_round_of', { n: level, m: game.matchRounds }), 1.4, '#ffc933', false);
    if (level === game.matchRounds) addBanner(t('ban_final'), 1.4, '#ff4a4a', true);
  } else {
    addBanner(t('ban_round', { n: level }), 1.4, '#ffc933', false);
  }
  addBanner(t('ban_target', { n: game.target }), 1.4, '#dfe8f5', false);
  for (const key of game.newFish || []) addBanner(t('ban_newfish', { name: fishName(key) }), 1.8, '#6cf06c', true);
  if (level > 1) addBanner(t('ban_tougher'), 1.4, '#ff9a4a', false);
  Sound.event();
}

// Valaki elérte a célt
function roundClear(winner) {
  finishRound(winner, true);
}

// A kör lezárása. byTarget: elérte a célt (időbónusz jár), különben lejárt az idő.
function finishRound(winner, byTarget) {
  const bonus = byTarget ? Math.ceil(game.timeLeft) * CONFIG.TIME_BONUS_PER_SEC : 0;
  if (winner) {
    winner.score += bonus;
    winner.roundWins++;
  }
  game.lastRoundWinner = winner ? winner.device : null;
  game.roundWinners.push(game.lastRoundWinner);
  // TAX MAN: a kör pontjainak 20%-a elvész
  for (const p of game.players) {
    const tax = pmods(p).tax;
    if (tax && p.roundScore > 0) {
      const loss = Math.floor(p.roundScore * tax);
      p.score = Math.max(0, p.score - loss);
      addPopup(`-${loss}`, p.hook.x, SURFACE_Y - 22, '#ff4a4a', 2, 2);
    }
  }
  for (const p of game.players) {
    if (p.hook.fish) {
      releaseFish(p);
      p.hook.state = 'reset';
    }
  }
  if (game.predator) predatorLeave(game.predator);
  game.event = null;
  for (const p of game.players) if (p.hook.state === 'tug') p.hook.state = 'reset';
  game.tug = null;
  game.gull = null;
  game.kraken = null;
  game.golden = 0;
  effects.banners = [];
  if (!byTarget) addBanner(t('ban_timeup'), 1.2, '#ff4a4a', false);
  if (winner) {
    addBanner(game.numPlayers > 1
      ? t('ban_winround', { p: playerName(winner.index), n: game.level })
      : t('ban_clear', { n: game.level }), 1.8, winner.style.tag, true);
  } else {
    addBanner(t('ban_round_draw'), 1.8, '#dfe8f5', true);
  }
  if (bonus) addBanner(t('ban_bonus', { n: bonus }), 1.4, '#6cf06c', false);
  game.clearTimer = byTarget ? 3.4 : 4.2;
  setState('roundclear');
  Sound.roundClear();
}

function pauseGame() {
  if (game.state !== 'playing' || Net.role === 'client') return;
  setState('paused');
  pauseSel = 0;
  ui.pauseTitle.textContent = t('pause_title');
  refreshPause();
  ui.pauseScreen.classList.remove('hidden');
  Music.setDuck(0.4);
}

function resumeGame() {
  if (game.state !== 'paused' || Net.role === 'client') return;
  ui.pauseScreen.classList.add('hidden');
  setState('playing');
  Music.setDuck(1);
}

function toggleMute() {
  Sound.muted = !Sound.muted;
  Music.applyVolume();
  effects.popups.push({ text: Sound.muted ? t('pop_sound_off') : t('pop_sound_on'), x: W / 2, y: 70, color: '#dfe8f5', scale: 1, life: 1 });
}

function updateTimer(dt) {
  game.timeLeft -= dt;
  const sec = Math.ceil(game.timeLeft);
  if (sec <= 10 && sec > 0 && sec !== game.lastTick) {
    game.lastTick = sec;
    Sound.tick();
  }
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    if (game.matchRounds) roundTimeUp();   // versus: a kör véget ér, a meccs megy tovább
    else endGame();                        // egyjátékos: lejárt az idő = vége
  }
}

// Versus: lejárt az idő – a körben legtöbb pontot szerző nyeri a kört
function roundTimeUp() {
  const ranked = game.players.slice().sort((a, b) => b.roundScore - a.roundScore);
  const best = ranked[0];
  const draw = !best || best.roundScore === 0 || (ranked[1] && ranked[1].roundScore === best.roundScore);
  finishRound(draw ? null : best, false);
}

// Szöveg biztonságos beillesztése HTML-be (online játékosok neveihez is)
function escapeHtml(v) {
  return String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function logHtml(p) {
  const cls = 'p' + (p.index + 1) + 'c';
  const title = game.numPlayers > 1 ? t('log_title_p', { p: playerName(p.index) }) : t('log_title');
  const items = p.log.slice().reverse().map((c) =>
    `<li><span class="${cls}">${escapeHtml(c.nick)}</span> - ${escapeHtml(c.species)} ${Number(c.weight).toFixed(2)}KG +${Number(c.pts) || 0}</li>`
  ).join('');
  return `<div><h3>${escapeHtml(title)}</h3><ul>${items || `<li>${escapeHtml(t('log_empty'))}</li>`}</ul></div>`;
}

function endGame() {
  for (const p of game.players) {
    if (p.hook.fish) {
      releaseFish(p);
      p.hook.state = 'reset';
    }
  }
  if (game.predator) predatorLeave(game.predator);
  game.event = null;
  setState('gameover');
  for (const p of game.players) if (p.hook.state === 'tug') p.hook.state = 'reset';
  game.tug = null;
  game.gull = null;
  game.kraken = null;
  game.awards = game.matchRounds ? computeAwards() : [];
  if (Net.role === 'host') Net.sendGameOver();
  showGameOverScreen();
}

// A Game Over képernyő kitöltése (a hostnál és az online vendégnél is)
function showGameOverScreen() {
  const ps = game.players;
  const two = game.numPlayers > 1;   // több játékos (versus)

  // Cím és győztes: több megnyert kör, egyenlőségnél több pont
  ui.goTitle.className = 'go-title';
  ui.goTitle.style.color = '';
  if (two) {
    const ranked = ps.slice().sort((a, b) => (b.roundWins - a.roundWins) || (b.score - a.score));
    const best = ranked[0];
    const tie = ranked[1] && ranked[1].roundWins === best.roundWins && ranked[1].score === best.score;
    ui.goTitle.textContent = tie ? t('go_draw')
      : t(game.matchRounds ? 'go_match_win' : 'go_wins', { p: playerName(best.index) });
    if (!tie && Net.role !== 'client' && best.device) game.crownDev = best.device;   // a győztes koronát kap
    if (!tie) {
      ui.goTitle.classList.add('winner');
      ui.goTitle.style.color = best.style.tag;
    }
  } else {
    ui.goTitle.textContent = t('go_timeup');
  }
  ui.goSub.textContent = game.matchRounds
    ? t('go_sub_match', { n: game.matchRounds, shift: t('mode_' + game.mode) })
    : t('go_sub', { n: game.level, shift: t('mode_' + game.mode) });

  // Statisztika tábla
  const fmtBig = (p) => (p.biggest ? `${p.biggest.name} ${p.biggest.weight.toFixed(2)}KG` : '---');
  const fmtRare = (p) => (p.rarest ? p.rarest.name : '---');
  const rows = [
    [t('stat_total'), (p) => pad(p.score, 5)],
    [t('stat_caught'), (p) => pad(p.caught, 2)],
    [t('stat_biggest'), fmtBig],
    [t('stat_rarest'), fmtRare],
    [t('stat_eaten'), (p) => pad(p.eaten, 2)]
  ];
  if (two) rows.splice(1, 0, [t('stat_rounds'), (p) => pad(p.roundWins, 2)]);

  let html = two ? `<tr><th></th>${ps.map((p, i) => `<th class="c${i + 1}">${escapeHtml(playerName(i))}</th>`).join('')}</tr>` : '';
  for (const [label, fn] of rows) {
    html += `<tr><td>${escapeHtml(label)}</td>${ps.map((p, i) => `<td class="c${i + 1}">${escapeHtml(fn(p))}</td>`).join('')}</tr>`;
  }
  ui.goStats.innerHTML = html;

  ui.goHint.textContent = Net.role === 'client' ? t('go_client_hint') : t('go_hint');

  // Rekord (csak 1 játékosnál), elmentve
  if (!two && Net.role !== 'client') {
    const p = ps[0];
    if (p.score > bestScores[game.mode]) {
      bestScores[game.mode] = p.score;
      Store.set('best', bestScores);
      ui.goRecord.textContent = t('record_new');
      ui.goRecord.classList.add('new');
    } else {
      ui.goRecord.textContent = t('record_best', { n: pad(bestScores[game.mode], 5) });
      ui.goRecord.classList.remove('new');
    }
  } else {
    ui.goRecord.textContent = '';
  }

  ui.goLog.innerHTML = ps.map(logHtml).join('');
  Music.play('menu');
  Sound.gameOver();
  // versus: előbb a díjátadó, utána az eredménytábla
  if (game.awards && game.awards.length) startAwards(game.awards);
  else ui.gameoverScreen.classList.remove('hidden');
}

function showMenu() {
  if (Net.role === 'client') { Net.leave(); return; }   // a leave() maga hívja újra a showMenu-t
  if (Net.role === 'host') Net.stop();
  setState('start');
  joined = [];
  game.crownDev = null;     // a főmenüben a korona is lekerül
  game.matchRounds = 0;
  ui.codeScreen.classList.add('hidden');
  closeKickScreen();
  ui.gameoverScreen.classList.add('hidden');
  ui.pauseScreen.classList.add('hidden');
  ui.joinScreen.classList.add('hidden');
  ui.startScreen.classList.remove('hidden');
  setPlayerCount(1);
  Music.setDuck(1);
  Music.play('menu');
  menu.row = GUEST ? ACTION_ROW : 0;   // vendégnél rögtön a JOIN ONLINE van kijelölve
  menu.action = DEFAULT_ACTION;
  setupAttract();
}

// Kezdőképernyő: élő háttér egy "üres" horgásszal
function setupAttract() {
  game.numPlayers = 1;
  game.mode = menu.mode;
  game.level = 1;
  game.diff = computeDifficulty(1);
  game.target = CONFIG.TARGET_BASE;
  game.timeLeft = CONFIG.ROUND_DURATION;
  game.event = null;
  game.predator = null;
  game.players = [makePlayer(0, 1)];
  effects.banners = [];
  buildBackground(game.mode);
  populate();
  refreshMenu();
}


/* ==========================================================================
   19/A. CSATLAKOZÓ KÉPERNYŐ ("PRESS TO JOIN")
   Aki először nyom gombot, az P1 lesz, a következő (másik eszközön) P2.
   Belépés: nyilas oldal SPACE / ENTER, WASD oldal F / G, kontroller A / START.
   ========================================================================== */
let joined = [];          // a belépett eszközök sorrendben (0 = P1, 1 = P2)

// Versus meccs hossza (a host / helyi játék választja a szobában, a gép megjegyzi)
let lobbyRounds = CONFIG.MATCH_ROUND_OPTIONS.includes(Store.get('rounds', 5)) ? Store.get('rounds', 5) : 5;
let clientLobbyRounds = 5;   // online vendégnél: amit a host beállított

function roundsVisible() {
  return Net.role === 'client' ? Net.lobby.length > 1 : (joined.length > 1 || Net.role === 'host');
}

function changeRounds(dir) {
  if (Net.role === 'client' || !roundsVisible()) return;
  const opts = CONFIG.MATCH_ROUND_OPTIONS;
  const i = opts.indexOf(lobbyRounds);
  lobbyRounds = opts[(i + dir + opts.length) % opts.length];
  Store.set('rounds', lobbyRounds);
  Sound.select();
  refreshJoin();
}

function refreshRoundsRow() {
  const show = roundsVisible();
  ui.roundsRow.classList.toggle('hidden', !show);
  const val = Net.role === 'client' ? clientLobbyRounds : lobbyRounds;
  ui.roundOpts.forEach((b) => {
    b.classList.toggle('selected', Number(b.dataset.rounds) === val);
    b.disabled = Net.role === 'client';
  });
}

// --- Játékosnevek: eszközönként megjegyezve (legközelebb is ugyanaz a név jön fel)
const playerNames = Store.get('names', {});

const NAME_PARTS = {
  en: {
    a: ['SALTY', 'SOGGY', 'LUCKY', 'SIR', 'CAPTAIN', 'MIGHTY', 'SLEEPY', 'FUNKY', 'GRUMPY', 'TINY', 'BIG', 'WET',
      'SNEAKY', 'DIZZY', 'FISHY', 'OLD', 'LORD', 'SLIMY'],
    b: ['WORM', 'BAIT', 'HOOK', 'PIKE', 'CARP', 'TUNA', 'GUPPY', 'BUBBLE', 'NOODLE', 'PICKLE', 'SQUID', 'BOOT',
      'SPLASH', 'REEL', 'WADERS', 'FLOAT', 'KRILL', 'COD']
  },
  fr: {
    a: ['PAPY', 'TONTON', 'SIRE', 'ROI', 'MAÎTRE', "P'TIT", 'GROS', 'VIEUX', 'SUPER', 'DOC', 'CHEF', 'BARON'],
    b: ['VER', 'THON', 'CARPE', 'BULLE', 'GOUJON', 'ASTICOT', 'BROCHET', 'CALMAR', 'HAMEÇON', 'BOTTE', 'MORUE', 'SPRAT']
  }
};

// Vicces véletlen név (belefér a maximális hosszba)
function randomName() {
  const parts = NAME_PARTS[lang] || NAME_PARTS.en;
  for (let i = 0; i < 40; i++) {
    const name = `${choice(parts.a)} ${choice(parts.b)}`;
    if (name.length <= CONFIG.MAX_NAME_LEN) return name;
  }
  return choice(parts.b);
}

// Csak a pixelfontban meglévő karakterek maradnak, nagybetűvel
function cleanName(str) {
  return String(str).toUpperCase()
    .split('').filter((ch) => ch === ' ' || FONT[ch] || ACCENTED[ch]).join('')
    .replace(/\s+/g, ' ')
    .slice(0, CONFIG.MAX_NAME_LEN);
}

function nameOf(dev) {
  if (dev.startsWith('net:')) return Net.names[dev] || '?';
  if (!playerNames[dev]) {
    playerNames[dev] = randomName();
    Store.set('names', playerNames);
  }
  return playerNames[dev];
}

function setName(dev, name) {
  playerNames[dev] = name;
  Store.set('names', playerNames);
  refreshJoin();
}

function rerollName(dev) {
  if (dev.startsWith('net:')) return;
  setName(dev, randomName());
  Sound.select();
}

// A játékos névmezőjének kijelölése (billentyűzeten gépelhető)
function editName(dev) {
  if (dev.startsWith('net:')) return;
  const i = joined.indexOf(dev);
  const input = ui.joinSlots[i] && ui.joinSlots[i].querySelector('.slot-name');
  if (!input) return;
  input.focus();
  if (input.select) input.select();
}

function deviceLabel(dev) {
  if (dev.startsWith('net:')) return t('dev_net');
  if (dev === 'touch') return t('dev_touch');
  if (dev === 'kbR') return t('dev_kbR');
  if (dev === 'kbL') return t('dev_kbL');
  return t('dev_pad', { n: Number(dev.slice(3)) + 1 });
}

function openJoin(device = null) {
  if (game.state === 'gameover' || game.state === 'paused') {
    // új meccs előtti "attract" háttér
    game.predator = null;
    game.event = null;
    effects.banners = [];
    for (const p of game.players) releaseFish(p);
  }
  ui.startScreen.classList.add('hidden');
  ui.gameoverScreen.classList.add('hidden');
  ui.pauseScreen.classList.add('hidden');
  ui.joinScreen.classList.remove('hidden');
  setState('join');
  Music.setDuck(1);
  Music.play('menu');
  joined = joined.filter((d) => !d.startsWith('net:') || Net.conns[d]);   // a kilépett online játékosok helye felszabadul
  if (device) joinDevice(device, true);
  refreshJoin();
}

function joinDevice(dev, silent = false) {
  if (!dev || joined.includes(dev) || joined.length >= CONFIG.MAX_LOCAL_PLAYERS) return;
  joined.push(dev);
  if (!silent) Sound.bite();
  refreshJoin();
}

function leaveDevice(dev) {
  const i = joined.indexOf(dev);
  if (i < 0) return;
  joined.splice(i, 1);
  Sound.select();
  refreshJoin();
}

// ESC a csatlakozó képernyőn: előbb a billentyűzetes játékosok lépnek ki, aztán vissza a menübe
function joinEscape() {
  const kb = joined.filter((d) => KB_DEVICES.includes(d));
  if (kb.length) {
    joined = joined.filter((d) => !KB_DEVICES.includes(d));
    Sound.select();
    refreshJoin();
  } else {
    showMenu();
  }
}

// A csatlakozó helyen kirajzolja a játékos saját színű horgászát és csónakját
function drawSlotPreview(cv, index, active) {
  if (!cv || !cv.getContext) return;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, cv.width, cv.height);
  const st = PLAYER_STYLE[index];
  g.globalAlpha = active ? 1 : 0.25;
  g.fillStyle = '#1b6c9d';
  g.fillRect(0, 13, cv.width, 3);                       // víz
  g.drawImage(st.person, 11, 2);                        // horgász
  g.drawImage(st.boat, 2, 10);                          // csónak
  g.fillStyle = '#6b4220';
  g.fillRect(17, 2, 1, 5);                              // bot
  g.fillRect(18, 1, 1, 2);
  g.fillRect(19, 0, 1, 2);
  g.globalAlpha = 1;
}

function refreshJoin() {
  ui.joinSlots.forEach((slot, i) => {
    const dev = joined[i];
    slot.classList.toggle('filled', !!dev);
    slot.querySelector('.slot-text').textContent = dev ? deviceLabel(dev) : t('join_empty');
    const input = slot.querySelector('.slot-name');
    const isNet = !!dev && dev.startsWith('net:');
    if (input) {
      input.readOnly = isNet;   // az online játékos nevét ő maga írja
      if (document.activeElement !== input) input.value = dev ? nameOf(dev) : '';
    }
    const dice = slot.querySelector('.slot-dice');
    if (dice) dice.style.visibility = dev && !isNet ? 'visible' : 'hidden';
    const kick = slot.querySelector('.slot-kick');
    if (kick) kick.classList.toggle('hidden', !isNet || !!Net.vote);
    const ping = slot.querySelector('.slot-ping');
    if (ping) ping.textContent = isNet && Net.pings[dev] ? `PING ${Net.pings[dev]} MS` : '';
    drawSlotPreview(slot.querySelector('.slot-preview'), i, !!dev);
  });
  ui.joinMode.textContent = joined.length === 0 ? '' : (joined.length === 1 ? t('join_solo') : t('join_versus', { n: joined.length }));
  ui.joinSlots.forEach((slot, i) => slot.classList.toggle('crowned', !!joined[i] && joined[i] === game.crownDev && joined.length > 1));
  refreshRoundsRow();
  ui.btnJoinPlay.disabled = joined.length === 0;

  // előnézet: a belépett játékosok csónakjai már látszanak
  const n = Math.max(1, joined.length);
  game.numPlayers = n;
  setPlayerCount(n);
  const same = game.players.length === n && game.players.every((p, i) => p.device === (joined[i] || null));
  if (!same) game.players = joined.length ? joined.map((d, i) => makePlayer(i, n, d)) : [makePlayer(0, 1)];
  game.players.forEach((p, i) => { p.name = joined[i] ? nameOf(joined[i]) : ''; });
  scheduleFit();
  if (Net.role === 'host') Net.sendLobby();
  refreshOnlineBox();
}

// Névmezők és kocka-gombok a csatlakozó helyeken
ui.joinSlots.forEach((slot, i) => {
  const input = slot.querySelector('.slot-name');
  const dice = slot.querySelector('.slot-dice');
  if (input) {
    input.maxLength = CONFIG.MAX_NAME_LEN;
    input.addEventListener('input', () => {
      const clean = cleanName(input.value);
      if (input.value !== clean) input.value = clean;
      if (Net.role === 'client') return;
      const dev = joined[i];
      if (!dev || dev.startsWith('net:')) return;
      playerNames[dev] = clean;
      game.players.forEach((p, k) => { if (joined[k]) p.name = nameOf(joined[k]); });
    });
    input.addEventListener('blur', () => {
      if (Net.role === 'client') {
        if (!input.readOnly) setOwnName(cleanName(input.value).trim() || randomName());
        return;
      }
      const dev = joined[i];
      if (!dev || dev.startsWith('net:')) return;
      const clean = cleanName(input.value).trim();
      setName(dev, clean || randomName());   // üresen hagyva véletlen nevet kap
    });
  }
  if (dice) {
    dice.addEventListener('click', (e) => {
      e.currentTarget.blur();
      if (Net.role === 'client') rerollOwnName();
      else if (joined[i]) rerollName(joined[i]);
    });
  }
});

ui.roundOpts.forEach((b) => {
  b.addEventListener('click', (e) => {
    e.currentTarget.blur();
    if (Net.role === 'client' || game.state !== 'join') return;
    lobbyRounds = Number(b.dataset.rounds);
    Store.set('rounds', lobbyRounds);
    Sound.select();
    refreshJoin();
  });
});

ui.btnJoinPlay.addEventListener('click', (e) => {
  e.currentTarget.blur();
  Sound.init();
  if (game.state === 'join' && joined.length) startGame();
});

ui.btnJoinBack.addEventListener('click', (e) => {
  e.currentTarget.blur();
  if (game.state === 'join') showMenu();
});


/* ==========================================================================
   19/C. ONLINE MULTIPLAYER (PeerJS / WebRTC)
   A host böngészője futtatja a játékot. A vendégek csak a gombnyomásaikat
   küldik, és a hosttól kapott állapotot rajzolják ki (másodpercenként 20x).
   A kapcsolat közvetlenül a gépek között megy; a PeerJS ingyenes szervere
   csak az első összekötésben segít.
   ========================================================================== */
const NET = {
  SNAPSHOT_INTERVAL: 1 / 30,        // a host másodpercenként 30 állapotot küld
  PING_INTERVAL: 2,                 // a vendég ennyi mp-enként méri a késést
  PEER_PREFIX: 'deepline-rtfish-',  // a szobák azonosítójának előtagja
  CODE_CHARS: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
  CODE_LEN: 6
};
const SPECIES_KEYS = Object.keys(SPECIES);
const HOOK_STATES = ['free', 'fight', 'reset', 'tug'];

const Net = {
  role: null,           // null | 'host' | 'client'
  peer: null,
  code: '',
  // host
  conns: {},            // dev -> kapcsolat
  names: {},            // dev -> online játékos neve
  inputs: {},           // dev -> { l, r, u, d, tg, rl }
  events: [],           // a következő állapotcsomaggal küldendő események
  sendTimer: 0,
  vote: null,           // folyamatban lévő kirúgás-szavazás
  banned: new Set(),    // ebből a szobából kirúgott vendégek
  pings: {},            // dev -> késés (ms)
  owner: null,          // melyik vendég saját hangja szól éppen
  // vendég
  conn: null,
  youDev: null,
  lobby: [],
  mirror: false,        // a host állapotát tükrözzük
  fishMap: new Map(),
  menuOpen: false,
  pendingIn: { tg: 0, rl: 0 },
  lastIn: '',
  inTimer: 0,
  pingTimer: 0,
  rtt: 0,
  ownIdx: -1,           // a saját játékos sorszáma
  voteInfo: null,       // a hosttól kapott szavazás-állapot
  localIn: null,
  predReel: 0,

  available() {
    return typeof window.Peer === 'function';
  },

  remoteCount() {
    return Object.keys(this.conns).length;
  },

  /* ---------------- HOST ---------------- */
  host() {
    if (this.role || GUEST) return;
    if (location.protocol === 'file:') { toast(t('online_file')); return; }
    if (!this.available()) { toast(t('online_nolib')); return; }
    this.role = 'host';
    this.code = makeRoomCode();
    this.banned = new Set();
    document.body.classList.add('net-on');
    this.peer = new window.Peer(NET.PEER_PREFIX + this.code);
    this.peer.on('open', () => refreshOnlineBox());
    this.peer.on('connection', (conn) => this.onHostConnection(conn));
    this.peer.on('disconnected', () => {
      if (this.peer && !this.peer.destroyed) {
        try { this.peer.reconnect(); } catch (e) { /* a meglévő kapcsolatok ettől még élnek */ }
      }
    });
    this.peer.on('error', (err) => {
      if (err && err.type === 'unavailable-id') {   // foglalt kód: új kóddal próbáljuk
        this.stop(true);
        this.host();
        return;
      }
      setOnlineStatus(t('online_err', { e: String((err && err.type) || err).toUpperCase() }));
    });
    refreshOnlineBox();
    Sound.select();
  },

  onHostConnection(conn) {
    const dev = 'net:' + conn.peer;
    conn.on('data', (msg) => this.onHostData(dev, conn, msg));
    conn.on('close', () => this.onHostClose(dev));
    conn.on('error', () => this.onHostClose(dev));
  },

  onHostData(dev, conn, msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'hello') {
      if (this.banned.has(dev)) { conn.send({ t: 'kicked' }); setTimeout(() => conn.close(), 400); return; }
      if (game.state !== 'join') { conn.send({ t: 'busy' }); setTimeout(() => conn.close(), 400); return; }
      if (joined.length >= CONFIG.MAX_LOCAL_PLAYERS) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 400); return; }
      this.conns[dev] = conn;
      this.names[dev] = cleanName(msg.name || '').trim() || randomName();
      this.inputs[dev] = { l: 0, r: 0, u: 0, d: 0, tg: 0, rl: 0 };
      joinDevice(dev);
      addBanner(t('net_joined', { name: this.names[dev] }), 1.6, '#6cf06c', false);
    } else if (msg.t === 'name') {
      if (!this.conns[dev]) return;
      this.names[dev] = cleanName(msg.name || '').trim() || this.names[dev];
      if (game.state === 'join') refreshJoin();
    } else if (msg.t === 'in') {
      const r = this.inputs[dev];
      if (!r) return;
      r.l = msg.l; r.r = msg.r; r.u = msg.u; r.d = msg.d;
      r.tg = Math.min(6, r.tg + (msg.tg || 0));
      r.rl = Math.min(12, r.rl + (msg.rl || 0));
    } else if (msg.t === 'ping') {
      conn.send({ t: 'pong', ts: msg.ts });
      if (msg.rtt) this.pings[dev] = Math.round(Number(msg.rtt)) || 0;
      if (game.state === 'join') refreshJoin();
    } else if (msg.t === 'cardpick') {
      if (game.cardPick && game.cardPick.picker === dev) applyCardChoice(String(msg.id || ''), String(msg.target || ''));
    } else if (msg.t === 'vote') {
      castVote(dev, !!msg.yes);
    } else if (msg.t === 'votekick') {
      startVote(String(msg.target || ''), dev);
    }
  },

  onHostClose(dev) {
    if (!this.conns[dev]) return;
    delete this.conns[dev];
    if (this.inputs[dev]) this.inputs[dev] = { l: 0, r: 0, u: 0, d: 0, tg: 0, rl: 0 };
    addBanner(t('net_left', { name: this.names[dev] || '?' }), 1.8, '#ff9a4a', false);
    if (game.state === 'join') leaveDevice(dev);
    refreshOnlineBox();
  },

  broadcast(msg) {
    for (const c of Object.values(this.conns)) {
      try { if (c.open) c.send(msg); } catch (e) { /* bontott kapcsolat */ }
    }
  },

  sendLobby() {
    if (this.role !== 'host') return;
    const slots = joined.map((d) => ({ name: nameOf(d), label: deviceLabel(d), dev: d, ping: this.pings[d] || 0 }));
    this.broadcast({ t: 'lobby', slots, vote: voteInfo(), rounds: lobbyRounds, crown: game.crownDev });
    refreshOnlineBox();
  },

  // A host eseményei (hang, felirat, csobbanás) – a vendégeknél is lejátszódnak
  event(ev) {
    if (this.role === 'host' && this.remoteCount()) this.events.push(ev);
  },

  sendGameOver() {
    this.broadcast({
      t: 'go', level: game.level, mode: game.mode, rounds: game.matchRounds, crown: game.crownDev,
      awards: game.awards || [],
      players: game.players.map((p) => ({
        name: p.name, score: p.score, caught: p.caught, biggest: p.biggest, rarest: p.rarest,
        eaten: p.eaten, roundWins: p.roundWins, log: p.log
      }))
    });
  },

  tick(dt) {
    if (this.role === 'host') {
      if (this.vote) {
        this.vote.time -= dt;
        if (this.vote.time <= 0) checkVote();
        else if (game.state === 'join' && Math.ceil(this.vote.time) !== Math.ceil(this.vote.time + dt)) this.sendLobby();
      }
      if (!this.remoteCount()) { this.events.length = 0; return; }
      this.sendTimer -= dt;
      if (this.sendTimer > 0) return;
      this.sendTimer = NET.SNAPSHOT_INTERVAL;
      const st = game.state;
      if (st === 'playing' || st === 'paused' || st === 'roundclear' || st === 'gameover' || st === 'cards') {
        this.broadcast(makeSnapshot(this.events));
      }
      this.events = [];
    } else if (this.role === 'client') {
      this.inTimer -= dt;
      this.pingTimer -= dt;
      if (this.pingTimer <= 0 && this.conn && this.conn.open) {
        this.pingTimer = NET.PING_INTERVAL;
        this.conn.send({ t: 'ping', ts: performance.now(), rtt: this.rtt });
      }
    }
  },

  // A szoba bezárása (a vendégek értesítést kapnak)
  stop(silent = false) {
    if (this.role !== 'host') return;
    this.broadcast({ t: 'bye' });
    const peer = this.peer;
    const conns = Object.values(this.conns);
    setTimeout(() => {
      for (const c of conns) { try { c.close(); } catch (e) { /* mindegy */ } }
      try { if (peer) peer.destroy(); } catch (e) { /* mindegy */ }
    }, 250);
    this.role = null;
    this.peer = null;
    this.conns = {};
    this.inputs = {};
    this.events = [];
    this.vote = null;
    this.pings = {};
    document.body.classList.remove('net-on');
    joined = joined.filter((d) => !d.startsWith('net:'));
    if (!silent) refreshOnlineBox();
  },

  /* ---------------- VENDÉG ---------------- */
  join(code) {
    if (!this.available()) { toast(t('online_nolib')); clearJoinParam(); return; }
    this.role = 'client';
    this.code = String(code).toUpperCase();
    this.rtt = 0;
    this.pingTimer = 0.5;
    this.voteInfo = null;
    document.body.classList.add('net-client', 'net-on');
    enterClientLobby([]);
    ui.joinMode.textContent = t('net_connecting');
    this.peer = new window.Peer();
    this.peer.on('open', (id) => {
      this.youDev = 'net:' + id;
      const conn = this.peer.connect(NET.PEER_PREFIX + this.code, { reliable: true });
      this.conn = conn;
      conn.on('open', () => {
        conn.send({ t: 'hello', name: nameOf('online') });
        ui.joinMode.textContent = t('net_waiting');
      });
      conn.on('data', (m) => this.onClientData(m));
      conn.on('close', () => this.onClientClosed(t('net_hostleft')));
      conn.on('error', () => this.onClientClosed(t('net_hostleft')));
    });
    this.peer.on('error', (err) => {
      const type = err && err.type;
      this.onClientClosed(type === 'peer-unavailable' ? t('net_notfound')
        : t('online_err', { e: String(type || err).toUpperCase() }));
    });
  },

  onClientData(m) {
    if (!m || typeof m !== 'object' || this.role !== 'client') return;
    if (m.t === 'lobby') {
      this.voteInfo = m.vote || null;
      clientLobbyRounds = Number(m.rounds) || 5;
      game.crownDev = m.crown || null;
      enterClientLobby(m.slots || []);
    } else if (m.t === 'pong') {
      this.rtt = Math.max(1, Math.round(performance.now() - m.ts));
    } else if (m.t === 'kicked') {
      this.onClientClosed(t('net_kicked'));
    } else if (m.t === 'cards') {
      const info = m.info || null;
      if (info && Array.isArray(info.offer)) {
        info.offer = info.offer.filter((id) => CARDS[id]);
        info.targets = (info.targets || []).map(String);
      }
      this.cardInfo = info;
      cardUI.sel = 0;
      cardUI.stage = 'pick';
      cardUI.targetSel = 0;
      if (game.state === 'cards') showCardScreen();
    }
    else if (m.t === 's') {
      this.voteInfo = m.vt || null;
      applySnapshot(m);
    }
    else if (m.t === 'go') clientGameOver(m);
    else if (m.t === 'full') this.onClientClosed(t('net_full'));
    else if (m.t === 'busy') this.onClientClosed(t('net_busy'));
    else if (m.t === 'bye') this.onClientClosed(t('net_hostleft'));
  },

  onClientClosed(msg) {
    if (this.role !== 'client') return;
    this.leave();
    toast(msg);
  },

  // Host: a kártyaválasztás adatai a vendégeknek
  sendCards() {
    if (this.role !== 'host') return;
    const v = cardView();
    if (v) this.broadcast({ t: 'cards', info: v });
  },

  sendVote(yes) {
    if (this.role === 'client' && this.conn && this.conn.open) this.conn.send({ t: 'vote', yes: !!yes });
  },

  sendName(name) {
    if (this.role === 'client' && this.conn && this.conn.open) this.conn.send({ t: 'name', name });
  },

  // A gombnyomások azonnal mennek; változatlan állapotnál fél mp-enként egy életjel
  sendInput(inp) {
    if (this.role !== 'client' || !this.conn || !this.conn.open) return;
    const key = `${+inp.left}${+inp.right}${+inp.up}${+inp.down}`;
    const edge = inp.tug || inp.reel;
    if (key === this.lastIn && !edge && this.inTimer > 0) return;
    this.conn.send({
      t: 'in', l: +inp.left, r: +inp.right, u: +inp.up, d: +inp.down,
      tg: inp.tug ? 1 : 0, rl: inp.reel ? 1 : 0
    });
    this.lastIn = key;
    this.inTimer = 0.5;
  },

  // Kilépés (vendég), vagy a szoba bezárása (host) – vissza a főmenübe
  leave() {
    if (this.role === 'host') { this.stop(); return; }
    if (this.role !== 'client') return;
    const peer = this.peer;
    const conn = this.conn;
    this.role = null;
    this.peer = null;
    this.conn = null;
    this.mirror = false;
    this.menuOpen = false;
    this.lobby = [];
    this.fishMap.clear();
    this.voteInfo = null;
    this.ownIdx = -1;
    this.rtt = 0;
    closeKickScreen();
    document.body.classList.remove('net-client', 'net-on');
    setTimeout(() => {
      try { if (conn) conn.close(); } catch (e) { /* mindegy */ }
      try { if (peer) peer.destroy(); } catch (e) { /* mindegy */ }
    }, 100);
    clearJoinParam();
    showMenu();
  }
};

function makeRoomCode() {
  let s = '';
  for (let i = 0; i < NET.CODE_LEN; i++) s += NET.CODE_CHARS[Math.floor(Math.random() * NET.CODE_CHARS.length)];
  return s;
}

// A játék címe (a kódot külön kell megadni!)
function gameLink() {
  return `${location.origin}${location.pathname}?guest`;
}

function clearJoinParam() {
  // a ?guest jelzés megmarad, minden más paraméter törlődik
  try { history.replaceState(null, '', location.pathname + (GUEST ? '?guest' : '')); } catch (e) { /* mindegy */ }
}

// --- Rövid üzenet a játéktér alján
let toastTimer = 0;
function toast(msg) {
  ui.toast.textContent = msg;
  ui.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.add('hidden'), 3500);
}

function setOnlineStatus(text) {
  ui.onlineStatus.textContent = text;
}

// Az online doboz a csatlakozó képernyőn (host)
function refreshOnlineBox() {
  const hosting = Net.role === 'host';
  ui.btnHost.classList.toggle('hidden', !!Net.role);
  const ready = hosting && Net.peer && Net.peer.open;
  ui.onlineInfo.classList.toggle('hidden', !ready);
  if (hosting) {
    ui.onlineCode.textContent = Net.code;
    setOnlineStatus(ready ? t('online_wait', { n: Net.remoteCount() }) : t('online_starting'));
  } else if (Net.role !== 'client') {
    setOnlineStatus('');
  }
}

ui.btnHost.addEventListener('click', (e) => {
  e.currentTarget.blur();
  Sound.init();
  if (game.state === 'join') Net.host();
});

function copyText(text, msg) {
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (err) { /* nem sikerült */ }
    ta.remove();
    toast(msg);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(msg), fallback);
  else fallback();
}

ui.btnCopyLink.addEventListener('click', (e) => {
  e.currentTarget.blur();
  copyText(gameLink(), t('copied'));
});

ui.btnCopyCode.addEventListener('click', (e) => {
  e.currentTarget.blur();
  copyText(Net.code, t('copied_code'));
});

/* ---------------- Állapot küldése / tükrözése ---------------- */
function makeSnapshot(events) {
  const r1 = (v) => Math.round(v * 10) / 10;
  const pr = game.predator;
  return {
    t: 's', st: game.state, md: game.mode, lv: game.level, tg: game.target, tl: r1(game.timeLeft),
    ev: game.event && game.event.type !== 'shadow' ? game.event.type : '',
    evt: game.event ? r1(game.event.time) : 0,
    sh: game.shake > 0 ? r1(game.shake) : 0,
    tf: game.timeFlash > 0 ? r1(game.timeFlash) : 0,
    f: game.fish.map((f) => [
      f.id, SPECIES_KEYS.indexOf(f.key), r1(f.x), r1(f.y), f.dir,
      (f.hooked ? 1 : 0) | (f.struggle ? 2 : 0) | (f.zap > 0 ? 4 : 0) | (f.ink > 0 ? 8 : 0) | (f.invisible ? 16 : 0),
      Math.round((Math.max(0, f.stamina) / f.maxStamina) * 100)
    ]),
    p: game.players.map((p) => {
      const h = p.hook;
      return [r1(h.x), r1(h.y), HOOK_STATES.indexOf(h.state), h.fish ? h.fish.id : -1,
        Math.round(h.tension), h.overload > 0 ? 1 : 0, Math.round(p.reelVel), r1(p.boat.x),
        p.score, p.roundScore, p.caught, p.roundWins, p.name, p.eaten, p.device || '', h.baited === false ? 0 : 1, p.pile.length];
    }),
    pr: pr ? [r1(pr.x), r1(pr.y), pr.dir, pr.state] : 0,
    vt: voteInfo(),
    mr: game.matchRounds,
    tg: game.tug ? [game.tug.thief, game.tug.owner, game.tug.a, game.tug.b] : 0,
    gl: game.gull ? [r1(game.gull.x), r1(game.gull.y), game.gull.dir, game.gull.carry ? 1 : 0, game.gull.phase === 'swoop' ? 1 : 0, game.gull.pIdx] : 0,
    kr: game.kraken ? [game.kraken.target, ['rise', 'hold', 'retreat'].indexOf(game.kraken.phase), game.kraken.progress,
      game.kraken.need, r1(game.kraken.t), r1(game.kraken.x0), game.kraken.time] : 0,
    gh: game.golden > 0 ? r1(game.golden) : 0,
    fx: game.flash > 0 ? r1(game.flash) : 0,
    cd: game.cards.map((c) => [c.id, c.by || '', c.target || '']),
    e: events
  };
}

function makeMirrorFish(id, key, x, y) {
  const sp = SPECIES[key];
  const spr = SPRITES[key];
  return {
    id, key, sp, w: spr.width, h: spr.height, x, y, tx: x, ty: y, dir: 1,
    t: rand(0, 10), phase: rand(0, Math.PI * 2),
    hooked: false, struggle: false, stamina: 100, maxStamina: 100, owner: null
  };
}

// Vendég: a host állapotának átvétele
function applySnapshot(s) {
  if (!Net.mirror) {
    Net.mirror = true;
    Net.fishMap.clear();
    game.fish = [];
    game.predator = null;
    effects.popups = [];
    effects.banners = [];
    ui.joinScreen.classList.add('hidden');
  }
  if (s.md !== game.mode) {
    game.mode = s.md;
    buildBackground(s.md);
  }
  if (s.st !== game.state) {
    setState(s.st);
    if (s.st === 'cards') showCardScreen();
    else ui.cardScreen.classList.add('hidden');
    if (s.st === 'playing' || s.st === 'roundclear') {
      ui.gameoverScreen.classList.add('hidden');
      ui.joinScreen.classList.add('hidden');
      Music.setDuck(1);
      Music.play(game.mode);
    } else if (s.st === 'paused') {
      Music.setDuck(0.4);
    }
  }
  game.level = s.lv;
  game.matchRounds = s.mr || 0;
  game.tug = s.tg ? { thief: s.tg[0], owner: s.tg[1], a: s.tg[2], b: s.tg[3] } : null;
  game.gull = s.gl ? { x: s.gl[0], y: s.gl[1], dir: s.gl[2], carry: !!s.gl[3], phase: s.gl[4] ? 'swoop' : 'flee', pIdx: s.gl[5] } : null;
  game.kraken = s.kr ? { target: s.kr[0], phase: ['rise', 'hold', 'retreat'][s.kr[1]], progress: s.kr[2], need: s.kr[3],
    t: s.kr[4], x0: s.kr[5], time: s.kr[6] } : null;
  game.golden = s.gh || 0;
  if (s.fx) game.flash = s.fx;
  const cardsKey = JSON.stringify(s.cd || []);
  if (cardsKey !== Net.cardsKey) {   // aktív kártyák (kijelzéshez és a saját horog előrejelzéséhez)
    Net.cardsKey = cardsKey;
    game.cards = (s.cd || []).filter((c) => CARDS[c[0]]).map((c) => ({ id: c[0], by: c[1] || null, target: c[2] || null }));
    Net.cardsDirty = true;
  }
  game.target = s.tg;
  game.timeLeft = s.tl;
  game.event = s.ev ? { type: s.ev, time: s.evt } : null;
  if (s.sh) game.shake = s.sh;
  if (s.tf) game.timeFlash = s.tf;

  // játékosok
  const n = s.p.length;
  let fresh = false;
  if (game.players.length !== n || !game.players.every((p) => p.mirror)) {
    game.numPlayers = n;
    setPlayerCount(n);
    game.players = s.p.map((_, i) => {
      const p = makePlayer(i, n);
      p.mirror = true;
      return p;
    });
    fresh = true;
    scheduleFit();
  }

  // halak
  const seen = new Set();
  for (const [id, ki, x, y, dir, fl, st] of s.f) {
    let f = Net.fishMap.get(id);
    if (!f) {
      f = makeMirrorFish(id, SPECIES_KEYS[ki], x, y);
      Net.fishMap.set(id, f);
      game.fish.push(f);
    }
    f.tx = x;
    f.ty = y;
    f.dir = dir;
    f.hooked = !!(fl & 1);
    f.struggle = !!(fl & 2);
    f.zap = fl & 4 ? 0.1 : 0;
    f.ink = fl & 8 ? 0.6 : 0;
    f.invisible = !!(fl & 16);
    f.stamina = st;
    seen.add(id);
  }
  if (seen.size !== game.fish.length) {
    game.fish = game.fish.filter((f) => seen.has(f.id));
    for (const id of [...Net.fishMap.keys()]) if (!seen.has(id)) Net.fishMap.delete(id);
  }

  s.p.forEach((a, i) => {
    const p = game.players[i];
    const h = p.hook;
    h.tx = a[0];
    h.ty = a[1];
    if (fresh) { h.x = a[0]; h.y = a[1]; p.boat.x = a[7]; }
    h.state = HOOK_STATES[a[2]] || 'free';
    h.fish = a[3] >= 0 ? (Net.fishMap.get(a[3]) || null) : null;
    if (h.fish) h.fish.owner = p;
    h.tension = a[4];
    h.overload = a[5];
    p.reelVel = a[6];
    p.boat.tx = a[7];
    p.score = a[8];
    p.roundScore = a[9];
    p.caught = a[10];
    p.roundWins = a[11];
    p.name = cleanName(a[12] || '');
    p.eaten = a[13];
    p.device = a[14] || '';
    h.baited = a[15] !== 0;
    p.pileCount = a[16] || 0;
    p.pile = null;
  });
  Net.ownIdx = game.players.findIndex((p) => p.device && p.device === Net.youDev);
  if (Net.cardsDirty || fresh) { applyCardMods(); Net.cardsDirty = false; }

  // cápa
  if (s.pr) {
    if (!game.predator) {
      game.predator = { x: s.pr[0], y: s.pr[1], w: SPRITES.shark.width, h: SPRITES.shark.height, t: 0, heart: 0 };
    }
    const pr = game.predator;
    pr.tx = s.pr[0];
    pr.ty = s.pr[1];
    pr.dir = s.pr[2];
    pr.state = s.pr[3];
  } else {
    game.predator = null;
  }

  for (const ev of s.e || []) playNetEvent(ev);
}

function playNetEvent(ev) {
  const [type, ...a] = ev;
  if (type === 'tn') {
    if (a[3] && a[3] === Net.youDev) return;   // a saját hangunkat már lejátszottuk
    Sound.tone(a[0], a[1], a[2] || {});
  }
  else if (type === 'bn') addBanner(a[0], a[1], a[2], a[3]);
  else if (type === 'pp') addPopup(a[0], a[1], a[2], a[3], a[4], a[5]);
  else if (type === 'sp') splash(a[0], a[1], a[2], a[3]);
}

// Vendég: képkockánként csak simítás és effektek (a számolás a hostnál fut)
function clientUpdate(dt) {
  game.time += dt;
  if (game.shake > 0) game.shake -= dt;
  if (game.timeFlash > 0) game.timeFlash -= dt;
  if (game.state === 'playing') game.timeLeft = Math.max(0, game.timeLeft - dt);
  const k = Math.min(1, dt * 12);
  const ease = (o) => {
    if (o.tx === undefined) return;
    if (Math.abs(o.tx - o.x) > 40 || Math.abs(o.ty - o.y) > 40) {
      o.x = o.tx;
      o.y = o.ty;
    } else {
      o.x += (o.tx - o.x) * k;
      o.y += (o.ty - o.y) * k;
    }
  };
  for (const f of game.fish) {
    f.t += dt;
    ease(f);
  }
  game.players.forEach((p, i) => {
    if (i === Net.ownIdx) predictOwnHook(p, dt);
    else {
      ease(p.hook);
      if (p.boat.tx !== undefined) p.boat.x += (p.boat.tx - p.boat.x) * k;
    }
    if (p.hook.fish) attachFishToHook(p.hook.fish, p.hook);
  });
  if (game.predator) {
    game.predator.t += dt;
    ease(game.predator);
  }
  if (game.state === 'cards' && Net.cardInfo) Net.cardInfo.time = Math.max(0, Net.cardInfo.time - dt);
  updateEffects(dt);
}

// Vendég: a saját horog azonnal mozog a gombnyomásra (előrejelzés), és csak
// finoman igazodik a host által küldött helyzethez. Fárasztás közben a host dönt.
function predictOwnHook(p, dt) {
  const h = p.hook;
  const inp = Net.localIn || {};
  if (h.tx === undefined) return;
  if (h.state === 'free' && game.state === 'playing') {
    if (inp.reel) Net.predReel = Math.min(CONFIG.MASH_MAX, Net.predReel + CONFIG.MASH_IMPULSE);
    Net.predReel *= Math.exp(-CONFIG.MASH_DECAY * dt);
    const m = pmods(p);
    const lr = ((inp.right ? 1 : 0) - (inp.left ? 1 : 0)) * (m.tangled ? -1 : 1);
    const dx = lr * CONFIG.HOOK_SPEED_X * m.hookSpeed * dt;
    const dy = ((inp.down ? CONFIG.HOOK_SPEED_DOWN : 0) - (inp.up ? CONFIG.HOOK_SPEED_UP : 0)) * m.hookSpeed * dt - Net.predReel * dt;
    h.x = clamp(h.x + dx, 6, W - 6);
    h.y = clamp(h.y + dy, HOOK_MIN_Y, playerMaxY(p));
    const ex = h.tx - h.x;
    const ey = h.ty - h.y;
    if (Math.abs(ex) > 30 || Math.abs(ey) > 30) {
      h.x = h.tx;
      h.y = h.ty;
    } else {
      // mozgás közben alig húzzuk vissza, álló helyzetben gyorsan a host helyére csúszik
      h.x += ex * Math.min(1, dt * (dx === 0 ? 6 : 1));
      h.y += ey * Math.min(1, dt * (Math.abs(dy) < 0.01 ? 6 : 1));
    }
  } else {
    Net.predReel = 0;
    const k = Math.min(1, dt * 20);
    h.x += (h.tx - h.x) * k;
    h.y += (h.ty - h.y) * k;
  }
  updateBoat(p, dt);   // a saját csónak is azonnal követi a horgot
}

// Vendég: a szoba (csatlakozó képernyő) megjelenítése
function enterClientLobby(slots) {
  const wasMirror = Net.mirror;
  Net.mirror = false;
  Net.menuOpen = false;
  if (game.state !== 'join' || wasMirror) {
    ui.startScreen.classList.add('hidden');
    ui.gameoverScreen.classList.add('hidden');
    ui.pauseScreen.classList.add('hidden');
    ui.joinScreen.classList.remove('hidden');
    setState('join');
    Music.setDuck(1);
    Music.play('menu');
    game.predator = null;
    game.event = null;
    effects.banners = [];
    game.level = 1;
    game.diff = computeDifficulty(1);
    populate();
  }
  Net.lobby = slots.slice(0, CONFIG.MAX_LOCAL_PLAYERS).map((sl) => ({
    name: cleanName(sl.name || ''), label: String(sl.label || '').slice(0, 30), dev: String(sl.dev || ''),
    ping: Number(sl.ping) || 0
  }));
  refreshJoinClient();
  if (Net.conn && Net.conn.open) ui.joinMode.textContent = t('net_waiting');
}

function refreshJoinClient() {
  const slots = Net.lobby;
  const myIdx = slots.findIndex((s) => s.dev === Net.youDev);
  ui.joinSlots.forEach((slot, i) => {
    const s = slots[i];
    slot.classList.toggle('filled', !!s);
    slot.querySelector('.slot-text').textContent = s ? (i === myIdx ? t('net_you') : s.label) : t('net_empty');
    const input = slot.querySelector('.slot-name');
    if (input) {
      input.readOnly = i !== myIdx;
      if (document.activeElement !== input) input.value = s ? s.name : '';
    }
    const dice = slot.querySelector('.slot-dice');
    if (dice) dice.style.visibility = i === myIdx ? 'visible' : 'hidden';
    const kick = slot.querySelector('.slot-kick');
    if (kick) kick.classList.toggle('hidden', !s || i === myIdx || !s.dev.startsWith('net:') || !!Net.voteInfo);
    const ping = slot.querySelector('.slot-ping');
    if (ping) ping.textContent = s && s.ping ? `PING ${s.ping} MS` : '';
    drawSlotPreview(slot.querySelector('.slot-preview'), i, !!s);
    slot.classList.toggle('crowned', !!s && s.dev === game.crownDev && slots.length > 1);
  });
  refreshRoundsRow();
  const n = Math.max(1, slots.length);
  game.numPlayers = n;
  setPlayerCount(n);
  game.players = slots.length
    ? slots.map((s, i) => { const p = makePlayer(i, n, s.dev); p.name = s.name; return p; })
    : [makePlayer(0, 1)];
  scheduleFit();
}

function ownSlotInput() {
  const myIdx = Net.lobby.findIndex((s) => s.dev === Net.youDev);
  return myIdx >= 0 ? ui.joinSlots[myIdx].querySelector('.slot-name') : null;
}

function focusOwnName() {
  const input = ownSlotInput();
  if (!input) return;
  input.focus();
  if (input.select) input.select();
}

function setOwnName(name) {
  playerNames.online = name;
  Store.set('names', playerNames);
  Net.sendName(name);
  const input = ownSlotInput();
  if (input && document.activeElement !== input) input.value = name;
}

function rerollOwnName() {
  setOwnName(randomName());
  Sound.select();
}

// Vendég: a meccs vége
function clientGameOver(m) {
  game.level = m.level;
  game.mode = m.mode;
  game.matchRounds = m.rounds || 0;
  game.crownDev = m.crown || null;
  game.awards = Array.isArray(m.awards) ? m.awards.filter((a) => a && AWARDS.some((x) => x.id === a.id)) : [];
  m.players.forEach((d, i) => {
    const p = game.players[i];
    if (!p || !d) return;
    p.name = cleanName(d.name || '');
    for (const k of ['score', 'caught', 'eaten', 'roundWins']) p[k] = Number(d[k]) || 0;
    p.biggest = d.biggest || null;
    p.rarest = d.rarest || null;
    p.log = Array.isArray(d.log) ? d.log.slice(-60) : [];
  });
  Net.menuOpen = false;
  ui.pauseScreen.classList.add('hidden');
  setState('gameover');
  showGameOverScreen();
}

// Vendég: saját menü (a játék közben tovább fut)
function openClientMenu() {
  Net.menuOpen = true;
  pauseSel = 0;
  ui.pauseTitle.textContent = t('menu_title');
  refreshPause();
  ui.pauseScreen.classList.remove('hidden');
}

function closeClientMenu() {
  Net.menuOpen = false;
  ui.pauseScreen.classList.add('hidden');
}

// Vendég billentyűzet
function clientKey(code) {
  if (Net.menuOpen) {
    if (code === 'ArrowUp' || code === 'KeyW') pauseMove(-1);
    else if (code === 'ArrowDown' || code === 'KeyS') pauseMove(1);
    else if (code === 'Enter' || code === 'Space') pauseSelect();
    else if (code === 'Escape' || code === 'KeyP') closeClientMenu();
    return;
  }
  const st = game.state;
  if (st === 'join') {
    if (code === 'Escape' || code === 'Backspace') Net.leave();
    else if (['Space', 'Enter', 'KeyF', 'KeyG', 'Slash', 'Period'].includes(code)) focusOwnName();
    return;
  }
  if (st === 'gameover') {
    if (awardsRun) { if (['Enter', 'Space', 'Escape'].includes(code)) finishAwards(); return; }
    if (code === 'Escape' && game.stateTime > 1.2) Net.leave();
    return;
  }
  const td = keyDevice(code, 'tug');
  const rd = keyDevice(code, 'reel');
  if (td) kbEdge[td].tug = true;
  if (rd) kbEdge[rd].reel = true;
  if (code === 'Escape' || code === 'KeyP') openClientMenu();
  else if (code === 'KeyM') toggleMute();
}

// Vendég kontroller (menük)
function clientPad(s) {
  const e = s.edge;
  if (Net.menuOpen) {
    if (e.up) pauseMove(-1);
    if (e.down) pauseMove(1);
    if (e.reel) pauseSelect();
    else if (e.start || e.cancel) closeClientMenu();
    return;
  }
  if (game.state === 'join') {
    if (e.reroll) rerollOwnName();
    else if (e.cancel || e.back) Net.leave();
    return;
  }
  if (game.state === 'gameover') {
    if (awardsRun) { if (e.start || e.reel || e.cancel) finishAwards(); return; }
    if ((e.back || e.cancel) && game.stateTime > 1.2) Net.leave();
    return;
  }
  if (e.start) openClientMenu();
}



/* ==========================================================================
   19/D. BELÉPÉS KÓDDAL (JOIN ONLINE)
   Billentyűzeten gépelhető / beilleszthető, kontrolleren arcade-stílusban:
   ←→ karakter választása, ↑↓ betű váltása, A csatlakozás, B vissza.
   ========================================================================== */
const codeEntry = { chars: [], cursor: 0 };

function openCodeScreen() {
  codeEntry.chars = Array(NET.CODE_LEN).fill('');
  codeEntry.cursor = 0;
  ui.codeInput.value = '';
  ui.startScreen.classList.add('hidden');
  ui.codeScreen.classList.remove('hidden');
  setState('code');
  refreshCode();
  Sound.select();
  if (touchActive) ui.codeInput.focus();   // telefonon rögtön feljön a billentyűzet
}

// telefonos billentyűzet / beillesztés a láthatatlan mezőbe
ui.codeInput.addEventListener('input', () => {
  const clean = ui.codeInput.value.toUpperCase().split('')
    .filter((c) => NET.CODE_CHARS.includes(c)).slice(0, NET.CODE_LEN).join('');
  if (ui.codeInput.value !== clean) ui.codeInput.value = clean;
  codeEntry.chars = Array.from({ length: NET.CODE_LEN }, (_, i) => clean[i] || '');
  codeEntry.cursor = Math.min(clean.length, NET.CODE_LEN - 1);
  refreshCode();
});

function closeCodeScreen() {
  ui.codeScreen.classList.add('hidden');
  showMenu();
}

function codeComplete() {
  return codeEntry.chars.every((c) => c);
}

function refreshCode() {
  ui.codeBoxes.forEach((b, i) => {
    b.textContent = codeEntry.chars[i] || '';
    b.classList.toggle('cursor', i === codeEntry.cursor);
  });
  ui.btnCodeJoin.disabled = !codeComplete();
  if (document.activeElement !== ui.codeInput) ui.codeInput.value = codeEntry.chars.join('');
}

function codeType(ch) {
  ch = String(ch).toUpperCase();
  if (ch.length !== 1 || !NET.CODE_CHARS.includes(ch)) return;
  codeEntry.chars[codeEntry.cursor] = ch;
  if (codeEntry.cursor < NET.CODE_LEN - 1) codeEntry.cursor++;
  refreshCode();
  Sound.select();
}

function codeBackspace() {
  if (!codeEntry.chars[codeEntry.cursor] && codeEntry.cursor > 0) codeEntry.cursor--;
  codeEntry.chars[codeEntry.cursor] = '';
  refreshCode();
}

function codeCycle(d) {
  const cs = NET.CODE_CHARS;
  const cur = codeEntry.chars[codeEntry.cursor];
  let i = cur ? cs.indexOf(cur) : (d > 0 ? -1 : 0);
  i = (i + d + cs.length) % cs.length;
  codeEntry.chars[codeEntry.cursor] = cs[i];
  refreshCode();
  Sound.select();
}

function codeMove(d) {
  codeEntry.cursor = clamp(codeEntry.cursor + d, 0, NET.CODE_LEN - 1);
  refreshCode();
}

function codePaste(text) {
  const clean = String(text).toUpperCase().split('').filter((c) => NET.CODE_CHARS.includes(c)).slice(0, NET.CODE_LEN);
  if (!clean.length) return;
  codeEntry.chars = Array.from({ length: NET.CODE_LEN }, (_, i) => clean[i] || '');
  codeEntry.cursor = Math.min(clean.length, NET.CODE_LEN - 1);
  refreshCode();
  Sound.select();
}

function codeSubmit() {
  if (!codeComplete()) return;
  ui.codeInput.blur();
  ui.codeScreen.classList.add('hidden');
  Net.join(codeEntry.chars.join(''));
}

function handleCodeKey(code, key) {
  if (code === 'Enter' || code === 'NumpadEnter') codeSubmit();
  else if (code === 'Escape') closeCodeScreen();
  else if (code === 'Backspace') codeBackspace();
  else if (code === 'ArrowLeft') codeMove(-1);
  else if (code === 'ArrowRight') codeMove(1);
  else if (code === 'ArrowUp') codeCycle(1);
  else if (code === 'ArrowDown') codeCycle(-1);
  else if (key && key.length === 1) codeType(key);
}

function codePad(e) {
  if (e.left) codeMove(-1);
  if (e.right) codeMove(1);
  if (e.up) codeCycle(1);
  if (e.down) codeCycle(-1);
  if (e.reel || e.start) {
    if (codeComplete()) codeSubmit();
    else codeMove(1);
  } else if (e.cancel || e.back) {
    closeCodeScreen();
  }
}

document.addEventListener('paste', (e) => {
  if (game.state !== 'code') return;
  const text = e.clipboardData ? e.clipboardData.getData('text') : '';
  codePaste(text);
  e.preventDefault();
});

ui.btnOnline.addEventListener('click', (e) => {
  e.currentTarget.blur();
  Sound.init();
  if (game.state === 'start' && !optionsOpen) openCodeScreen();
});
ui.btnCodeJoin.addEventListener('click', (e) => {
  e.currentTarget.blur();
  if (game.state === 'code') codeSubmit();
});
ui.btnCodeBack.addEventListener('click', (e) => {
  e.currentTarget.blur();
  if (game.state === 'code') closeCodeScreen();
});


/* ==========================================================================
   19/E. KIRÚGÁS SZAVAZÁSSAL
   Bárki indíthat szavazást egy ONLINE játékos ellen. Mindenki szavaz (a célpont
   kivételével), a helyi játékosok külön-külön. Többség kell; 20 mp után a be
   nem adott szavazat "nem". Meccs közben a szavazás idejére áll a játék.
   ========================================================================== */
const VOTE_YES = { Enter: 'kbR', NumpadEnter: 'kbR', KeyF: 'kbL' };
const VOTE_NO = { Backspace: 'kbR', KeyG: 'kbL' };

function voteNeed(v) {
  return Math.floor(v.voters.length / 2) + 1;
}

// A szavazás állapota a kijelzéshez / küldéshez
function voteInfo() {
  const v = Net.vote;
  if (!v) return null;
  return {
    name: v.name, yes: v.yes.length, no: v.no.length, need: voteNeed(v),
    time: Math.max(0, Math.ceil(v.time)), voters: v.voters.slice()
  };
}

// Host: szavazás indítása
function startVote(target, initiator) {
  if (Net.role !== 'host' || Net.vote) return;
  if (!target.startsWith('net:') || !joined.includes(target) || !Net.conns[target]) return;
  const voters = joined.filter((d) => d !== target && (!d.startsWith('net:') || Net.conns[d]));
  if (!voters.length) return;
  Net.vote = { target, name: nameOf(target), voters, yes: [], no: [], time: CONFIG.VOTE_TIME };
  if (initiator && voters.includes(initiator)) Net.vote.yes.push(initiator);
  closeKickScreen();
  Sound.event();
  if (!checkVote()) syncVote();
}

// Host: egy szavazat (mindenki csak egyszer szavazhat)
function castVote(dev, yes) {
  const v = Net.vote;
  if (!v || !v.voters.includes(dev) || v.yes.includes(dev) || v.no.includes(dev)) return;
  (yes ? v.yes : v.no).push(dev);
  Sound.select();
  if (!checkVote()) syncVote();
}

// Host: eldőlt-e már? (true = véget ért)
function checkVote() {
  const v = Net.vote;
  if (!v) return true;
  const need = voteNeed(v);
  if (v.yes.length >= need) { endVote(true); return true; }
  if (v.no.length > v.voters.length - need || v.time <= 0) { endVote(false); return true; }
  return false;
}

function endVote(kick) {
  const v = Net.vote;
  Net.vote = null;
  if (kick) kickPlayer(v.target);
  addBanner(kick ? t('vote_kicked', { name: v.name }) : t('vote_failed'), 2, kick ? '#ff4a4a' : '#dfe8f5', false);
  syncVote();
}

// A szavazás állapotának kiküldése (a szobában a lobby-üzenettel, játékban az állapotcsomaggal)
function syncVote() {
  if (game.state === 'join') refreshJoin();
}

// Host: a játékos eltávolítása
function kickPlayer(dev) {
  const conn = Net.conns[dev];
  if (conn) {
    try { conn.send({ t: 'kicked' }); } catch (e) { /* mindegy */ }
    setTimeout(() => { try { conn.close(); } catch (e) { /* mindegy */ } }, 300);
  }
  delete Net.conns[dev];
  Net.banned.add(dev);
  Net.inputs[dev] = { l: 0, r: 0, u: 0, d: 0, tg: 0, rl: 0 };
  const p = game.players.find((pl) => pl.device === dev);
  if (p && p.hook.fish) {
    releaseFish(p);
    p.hook.state = 'reset';
  }
  if (game.state === 'join') leaveDevice(dev);
  refreshOnlineBox();
}

function canClientVote() {
  return !!(Net.voteInfo && Net.voteInfo.voters && Net.voteInfo.voters.includes(Net.youDev));
}

// Billentyűzetes szavazat (true = a billentyűt a szavazás "elnyelte")
function voteKey(code) {
  const yes = VOTE_YES[code];
  const no = VOTE_NO[code];
  if (!yes && !no) return false;
  if (Net.role === 'host' && Net.vote) {
    const dev = yes || no;
    const other = dev === 'kbR' ? 'kbL' : 'kbR';
    const voter = Net.vote.voters.includes(dev) ? dev : (Net.vote.voters.includes(other) ? other : null);
    if (voter) castVote(voter, !!yes);
    return true;
  }
  if (Net.role === 'client' && canClientVote()) {
    Net.sendVote(!!yes);
    return true;
  }
  return false;
}

// A szavazódoboz frissítése (minden képkockában)
function updateVoteBox() {
  const info = Net.role === 'host' ? voteInfo() : (Net.role === 'client' ? Net.voteInfo : null);
  ui.voteBox.classList.toggle('hidden', !info);
  if (!info) return;
  setText(ui.voteTitle, t('vote_title', { name: info.name }));
  setText(ui.voteCount, t('vote_count', { y: info.yes, n: info.no, need: info.need, t: info.time }));
  const iVote = Net.role === 'host' ? true : canClientVote();
  setText(ui.voteKeys, iVote ? t('vote_keys') : t('vote_wait'));
  ui.voteBtns.classList.toggle('hidden', !iVote);
}

// Kirúgás-gombok a szoba helyein
ui.joinSlots.forEach((slot, i) => {
  const btn = slot.querySelector('.slot-kick');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.currentTarget.blur();
    if (Net.role === 'host') {
      const dev = joined[i];
      const me = joined.find((d) => !d.startsWith('net:')) || null;
      if (dev) startVote(dev, me);
    } else if (Net.role === 'client') {
      const s = Net.lobby[i];
      if (s && Net.conn && Net.conn.open) Net.conn.send({ t: 'votekick', target: s.dev });
    }
  });
});

// --- "Kit rúgjunk ki?" lista (a szünet menüből)
let kickOpen = false;
let kickSel = 0;
let kickTargets = [];

function openKickScreen() {
  if (Net.role === 'host') {
    kickTargets = joined.filter((d) => d.startsWith('net:') && Net.conns[d]).map((d) => ({ dev: d, name: nameOf(d) }));
  } else if (Net.role === 'client') {
    kickTargets = Net.lobby.length
      ? Net.lobby.filter((s) => s.dev.startsWith('net:') && s.dev !== Net.youDev).map((s) => ({ dev: s.dev, name: s.name }))
      : game.players.filter((p) => p.device && p.device.startsWith('net:') && p.device !== Net.youDev)
        .map((p) => ({ dev: p.device, name: p.name }));
  }
  if (!kickTargets.length || (Net.role === 'host' ? Net.vote : Net.voteInfo)) {
    toast(t('vote_failed'));
    return;
  }
  ui.kickList.innerHTML = '';
  kickTargets.forEach((k, i) => {
    const b = document.createElement('button');
    b.textContent = k.name;
    b.addEventListener('click', (e) => {
      e.currentTarget.blur();
      kickSel = i;
      kickSelect();
    });
    ui.kickList.appendChild(b);
  });
  const back = document.createElement('button');
  back.textContent = t('btn_back');
  back.addEventListener('click', (e) => {
    e.currentTarget.blur();
    closeKickScreen();
  });
  ui.kickList.appendChild(back);
  kickSel = 0;
  kickOpen = true;
  ui.pauseScreen.classList.add('hidden');
  ui.kickScreen.classList.remove('hidden');
  refreshKick();
  Sound.select();
}

function refreshKick() {
  Array.from(ui.kickList.children).forEach((b, i) => b.classList.toggle('selected', i === kickSel));
}

function kickMove(d) {
  const n = kickTargets.length + 1;
  kickSel = (kickSel + d + n) % n;
  refreshKick();
  Sound.select();
}

function kickSelect() {
  if (kickSel >= kickTargets.length) { closeKickScreen(); return; }
  const target = kickTargets[kickSel].dev;
  closeKickScreen();
  if (Net.role === 'host') {
    const me = joined.find((d) => !d.startsWith('net:')) || null;
    startVote(target, me);
  } else if (Net.role === 'client' && Net.conn && Net.conn.open) {
    Net.conn.send({ t: 'votekick', target });
    closeClientMenu();
  }
}

function closeKickScreen() {
  if (!kickOpen) return;
  kickOpen = false;
  ui.kickScreen.classList.add('hidden');
  if (game.state === 'paused' || Net.menuOpen) ui.pauseScreen.classList.remove('hidden');
}

function handleKickKey(code) {
  if (code === 'ArrowUp' || code === 'KeyW') kickMove(-1);
  else if (code === 'ArrowDown' || code === 'KeyS') kickMove(1);
  else if (code === 'Enter' || code === 'Space') kickSelect();
  else if (code === 'Escape' || code === 'Backspace') closeKickScreen();
}


/* ==========================================================================
   19/F. ÉRINTÉSES IRÁNYÍTÁS (telefon / tablet) ÉS REZGÉS
   Bal oldalt "lebegő" joystick (ahol leteszed az ujjad, ott jelenik meg),
   jobb oldalt REEL (nyomkodni!) és TUG gomb, sarokban szünet gomb.
   A telefon egy "touch" nevű eszközként lép be, mint egy kontroller.
   ========================================================================== */
const TouchCtl = {
  left: false, right: false, up: false, down: false,
  tug: false, reel: false,        // lenyomás "élek" (egy képkockára)
  stickId: null, ox: 0, oy: 0,
  RADIUS: 50,                     // a joystick kitérése (px)
  DEADZONE: 0.35
};

// Érintőképernyős-e a készülék? (egy valódi érintés után mindenképp az lesz)
let touchActive = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
  (navigator.maxTouchPoints > 0 && !(window.matchMedia && window.matchMedia('(pointer: fine)').matches));

function setTouchActive(on, refit = true) {
  touchActive = on;
  document.body.classList.toggle('touch', on);
  if (refit) scheduleFit();
}
setTouchActive(touchActive, false);
window.addEventListener('touchstart', () => { if (!touchActive) setTouchActive(true); }, { passive: true });

const stickZone = $('#touch-stick-zone');
const stickBase = $('#stick-base');
const stickKnob = $('#stick-knob');

// alaphelyzet: halvány joystick a bal alsó részen (hogy lássa, hova kell nyúlni)
function idleStick() {
  stickBase.classList.add('idle');
  stickBase.style.left = '26%';
  stickBase.style.top = '68%';
  stickKnob.style.transform = 'translate(0px, 0px)';
}
idleStick();

function stickPoint(e) {
  const r = stickZone.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

stickZone.addEventListener('pointerdown', (e) => {
  if (TouchCtl.stickId !== null) return;
  TouchCtl.stickId = e.pointerId;
  try { stickZone.setPointerCapture(e.pointerId); } catch (err) { /* régi böngésző */ }
  const p = stickPoint(e);
  TouchCtl.ox = p.x;
  TouchCtl.oy = p.y;
  stickBase.classList.remove('idle');
  stickBase.style.left = p.x + 'px';
  stickBase.style.top = p.y + 'px';
  Sound.init();
  e.preventDefault();
});

stickZone.addEventListener('pointermove', (e) => {
  if (e.pointerId !== TouchCtl.stickId) return;
  const p = stickPoint(e);
  let dx = p.x - TouchCtl.ox;
  let dy = p.y - TouchCtl.oy;
  const len = Math.hypot(dx, dy);
  const R = TouchCtl.RADIUS;
  if (len > R) { dx *= R / len; dy *= R / len; }
  stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  const dz = TouchCtl.DEADZONE * R;
  TouchCtl.left = dx < -dz;
  TouchCtl.right = dx > dz;
  TouchCtl.up = dy < -dz;
  TouchCtl.down = dy > dz;
  e.preventDefault();
});

function releaseStick(e) {
  if (e.pointerId !== TouchCtl.stickId) return;
  TouchCtl.stickId = null;
  TouchCtl.left = TouchCtl.right = TouchCtl.up = TouchCtl.down = false;
  idleStick();
}
stickZone.addEventListener('pointerup', releaseStick);
stickZone.addEventListener('pointercancel', releaseStick);

function bindTouchButton(el, onPress) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    Sound.init();
    el.classList.add('pressed');
    onPress();
  });
  const up = () => el.classList.remove('pressed');
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

bindTouchButton($('#touch-reel'), () => { TouchCtl.reel = true; });
bindTouchButton($('#touch-tug'), () => { TouchCtl.tug = true; });
bindTouchButton($('#touch-pause'), () => {
  if (Net.role === 'client') openClientMenu();
  else if (game.state === 'playing') pauseGame();
});

// Az érintés-bemenet hozzáadása egy játékos bemenetéhez
function mergeTouch(inp) {
  inp.left = inp.left || TouchCtl.left;
  inp.right = inp.right || TouchCtl.right;
  inp.up = inp.up || TouchCtl.up;
  inp.down = inp.down || TouchCtl.down;
  inp.tug = inp.tug || TouchCtl.tug;
  inp.reel = inp.reel || TouchCtl.reel;
}

function clearTouchEdges() {
  TouchCtl.tug = false;
  TouchCtl.reel = false;
}

// Mikor látszanak a vezérlők? Csak érintőképernyőn, játék közben, ha van érintéses játékos.
let touchPlayShown = false;
function updateTouchUI() {
  const st = game.state;
  const touchPlayer = Net.role === 'client' ? true
    : game.players.some((p) => p.device === 'touch') || (game.players.length === 1 && game.players[0].device !== null);
  const show = touchActive && touchPlayer && (st === 'playing' || st === 'roundclear') &&
    !optionsOpen && !kickOpen && !Net.menuOpen &&
    !(Net.role === 'host' && Net.vote) && !(Net.role === 'client' && Net.voteInfo);
  if (show !== touchPlayShown) {
    touchPlayShown = show;
    document.body.classList.toggle('touch-play', show);
    if (!show) releaseStick({ pointerId: TouchCtl.stickId });
    scheduleFit();
  }
}

// --- Rezgés: a telefonos játékos saját eseményeinél
const hap = { state: null, over: false };

function buzz(pattern) {
  if (!settings.vibrate || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch (e) { /* nem támogatott */ }
}

function hapticPlayer() {
  if (!touchActive) return null;
  if (Net.role === 'client') return game.players[Net.ownIdx] || null;
  return game.players.find((p) => p.device === 'touch') || (game.players.length === 1 ? game.players[0] : null);
}

// Képkockánként: a horog állapotának változásaiból rezgés
function checkHaptics() {
  const active = game.state === 'playing' || game.state === 'roundclear';
  const p = active ? hapticPlayer() : null;
  if (!p) { hap.state = null; hap.over = false; return; }
  const st = p.hook.state;
  const over = p.hook.overload > 0;
  if (hap.state && st !== hap.state) {
    if (hap.state === 'free' && st === 'fight') buzz(45);                 // kapás
    else if (hap.state === 'fight' && st === 'free') buzz([35, 50, 35]);  // kifogva
    else if (hap.state === 'fight' && st === 'reset') buzz(220);          // elszakadt / megette a cápa
    else if (st === 'tug') buzz([30, 30, 30, 30, 30]);                    // kötélhúzás
  }
  if (over && !hap.over) buzz(25);                                        // piros zóna
  hap.state = st;
  hap.over = over;
}

// Szavazás gombokkal (telefonon és egérrel is)
function voteButton(yes) {
  if (Net.role === 'client') {
    if (canClientVote()) Net.sendVote(yes);
    return;
  }
  const v = Net.vote;
  if (Net.role !== 'host' || !v) return;
  const free = (d) => !v.yes.includes(d) && !v.no.includes(d);
  const pick = v.voters.find((d) => d === 'touch' && free(d)) ||
    v.voters.find((d) => !d.startsWith('net:') && free(d));
  if (pick) castVote(pick, yes);
}
$('#vote-yes').addEventListener('click', (e) => { e.currentTarget.blur(); voteButton(true); });
$('#vote-no').addEventListener('click', (e) => { e.currentTarget.blur(); voteButton(false); });

// Csatlakozó képernyő: telefonon egy üres helyre bökve belép a "touch" játékos
ui.joinSlots.forEach((slot, i) => {
  slot.addEventListener('click', (e) => {
    if (game.state !== 'join' || Net.role === 'client' || !touchActive) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON')) return;
    if (!joined[i] && !joined.includes('touch')) joinDevice('touch');
  });
});


/* ==========================================================================
   19/G. KÁRTYÁK A KÖRÖK KÖZÖTT (versus)
   Minden kör után a LEGHÁTUL ÁLLÓ játékos (legkevesebb megnyert kör, egyenlőségnél
   a kevesebb összpont, ha az is egyenlő: véletlen) választ 3 kártyából egyet.
   A hatás CSAK a következő körre szól.
     🟥 átok   – egy előtte álló játékosra (a lista elején a vezető / koronás)
     🟩 áldás  – magára
     🟦 mindenkire – az egész tóra
   Így a kártya mindig a lemaradónak segít, a győztes jutalma maga a megnyert kör.
   ========================================================================== */
const CARD_PICK_TIME = 15;        // ennyi mp-e van a győztesnek választani
const CARDS = {
  // --- átkok (célpont: valaki más)
  slow_hook:       { type: 'curse', icon: '🐢', mod: (m) => { m.hookSpeed *= 0.65; } },
  rusty_reel:      { type: 'curse', icon: '🔩', mod: (m) => { m.reel *= 0.6; } },
  frayed_line:     { type: 'curse', icon: '🧵', mod: (m) => { m.tension *= 1.5; } },
  butterfingers:   { type: 'curse', icon: '🧈', mod: (m) => { m.tug *= 0.6; } },
  short_line:      { type: 'curse', icon: '📏', mod: (m) => { m.maxDepth = Math.min(m.maxDepth, 0.55); } },
  stinky_bait:     { type: 'curse', icon: '🦨', mod: (m) => { m.bite *= 0.5; } },
  shark_bait:      { type: 'curse', icon: '🦈', mod: (m) => { m.sharkBait = true; } },
  tangled:         { type: 'curse', icon: '🌀', mod: (m) => { m.tangled = true; } },
  heavy_boat:      { type: 'curse', icon: '⚓', mod: (m) => { m.boat *= 0.3; } },
  tax_man:         { type: 'curse', icon: '💰', mod: (m) => { m.tax = 0.2; } },
  // --- előnyök (a győztesre)
  steel_line:      { type: 'boon', icon: '⛓', mod: (m) => { m.tension *= 0.6; } },
  turbo_reel:      { type: 'boon', icon: '⚡', mod: (m) => { m.reel *= 1.5; } },
  sharp_hook:      { type: 'boon', icon: '📌', mod: (m) => { m.bite *= 1.6; } },
  fish_magnet:     { type: 'boon', icon: '🧲', mod: (m) => { m.magnet *= 2; } },
  shark_repellent: { type: 'boon', icon: '🛡', mod: (m) => { m.sharkImmune = true; } },
  lucky_lure:      { type: 'boon', icon: '🍀', mod: (m) => { m.rarePts *= 2; }, global: (g) => { g.rare *= 2; } },
  big_fish_bonus:  { type: 'boon', icon: '🐋', mod: (m) => { m.bigPts *= 2; } },
  speed_boat:      { type: 'boon', icon: '🚤', mod: (m) => { m.hookSpeed *= 1.35; m.boat *= 1.6; } },
  // --- mindenkire
  frenzy:          { type: 'global', icon: '🐟', global: (g) => { g.frenzy = true; } },
  night_falls:     { type: 'global', icon: '🌙', global: (g) => { g.night = true; } },
  shark_week:      { type: 'global', icon: '🌊', global: (g) => { g.sharkWeek = true; } },
  gold_rush:       { type: 'global', icon: '✨', global: (g) => { g.rare *= 5; } },
  deep_trouble:    { type: 'global', icon: '🕳', global: (g) => { g.deepOnly = true; } },
  time_crunch:     { type: 'global', icon: '⏳', global: (g) => { g.timeBonus *= 0.5; } }
};
const CARD_IDS = Object.keys(CARDS);
const CARD_COLORS = { curse: '#ff4a4a', boon: '#6cf06c', global: '#5fd0ff' };

const cardName = (id) => t('card_' + id);
const cardDesc = (id) => t('cardd_' + id);

function defaultMods() {
  return {
    hookSpeed: 1, reel: 1, tension: 1, tug: 1, maxDepth: 1, bite: 1, sharkBait: false,
    tangled: false, boat: 1, tax: 0, magnet: 1, sharkImmune: false, rarePts: 1, bigPts: 1
  };
}
function defaultGlobalMods() {
  return { frenzy: false, night: false, sharkWeek: false, rare: 1, deepOnly: false, timeBonus: 1 };
}

// Kiknek szól egy kártya? (átok: célpont, előny: aki kapta, mindenkire: mindenki)
function cardAffects(c, p) {
  const type = CARDS[c.id].type;
  if (type === 'global') return true;
  if (type === 'curse') return p.device === c.target;
  return p.device === (c.target || c.by);
}

// A kör elején: a módosítók kiszámítása az aktív kártyákból
function applyCardMods() {
  game.mods = defaultGlobalMods();
  for (const p of game.players) {
    p.mods = defaultMods();
    p.cards = game.cards.filter((c) => cardAffects(c, p) && CARDS[c.id].type !== 'global').map((c) => c.id);
  }
  for (const c of game.cards) {
    const def = CARDS[c.id];
    if (def.global) def.global(game.mods);
    if (def.mod) for (const p of game.players) if (cardAffects(c, p)) def.mod(p.mods);
  }
}
const pmods = (p) => p.mods || (p.mods = defaultMods());
const gmods = () => game.mods || (game.mods = defaultGlobalMods());

// A kártyákat is érintő pályamagasság-korlát (SHORT LINE)
function playerMaxY(p) {
  return Math.min(HOOK_MAX_Y, depthToY(Math.min(CONFIG.HOOK_MAX_DEPTH, pmods(p).maxDepth)));
}

function buildOffer(types) {
  const pool = CARD_IDS.filter((id) => types.includes(CARDS[id].type));
  const offer = [];
  // minden megengedett típusból legalább egy, ha lehet
  for (const ty of types) {
    const opts = pool.filter((id) => CARDS[id].type === ty && !offer.includes(id));
    if (opts.length && offer.length < 3) offer.push(choice(opts));
  }
  while (offer.length < 3) {
    const opts = pool.filter((id) => !offer.includes(id));
    if (!opts.length) break;
    offer.push(choice(opts));
  }
  return offer.sort(() => Math.random() - 0.5);
}

// Átok célpontjai: az előtte állók (a választó a leghátsó), a vezető / koronás elöl
function curseTargets(pickerDev) {
  return game.players
    .filter((p) => p.device !== pickerDev)
    .sort((a, b) => (hasCrown(b) - hasCrown(a)) || (b.roundWins - a.roundWins) || (b.score - a.score))
    .map((p) => p.device);
}

// A meccsben leghátul álló játékos
function lastPlacePlayer() {
  const ps = game.players.slice().sort((a, b) => (a.roundWins - b.roundWins) || (a.score - b.score));
  const worst = ps[0];
  if (!worst) return null;
  const tied = ps.filter((p) => p.roundWins === worst.roundWins && p.score === worst.score);
  return tied.length > 1 ? choice(tied) : worst;   // teljes holtverseny: véletlen
}

function openCardPhase() {
  game.pendingCards = [];
  const picker = lastPlacePlayer();
  if (!picker) { beginNextRound(); return; }
  game.cardPick = {
    picker: picker.device, pickerIdx: picker.index,
    offer: buildOffer(['curse', 'boon', 'global']),   // mindig 1 átok, 1 áldás, 1 mindenkire
    note: 'card_note_last',
    targets: curseTargets(picker.device), time: CARD_PICK_TIME
  };
  cardUI.sel = 0;
  cardUI.stage = 'pick';
  cardUI.targetSel = 0;
  setState('cards');
  showCardScreen();
  Net.sendCards();
  Sound.event();
}

function beginNextRound() {
  game.cardPick = null;
  ui.cardScreen.classList.add('hidden');
  setState('playing');
  startRound(game.level + 1);
}

// A választás érvényesítése (host). targetDev csak átoknál kell.
function applyCardChoice(id, targetDev) {
  const cp = game.cardPick;
  if (!cp || !cp.offer.includes(id)) return;
  const def = CARDS[id];
  const pickerName = playerName(cp.pickerIdx);
  if (def.type === 'curse') {
    if (!cp.targets.includes(targetDev)) targetDev = cp.targets[0];
    const tp = game.players.find((p) => p.device === targetDev);
    game.pendingCards.push({ id, by: cp.picker, target: targetDev });
    addBanner(t('card_applied_curse', { p: pickerName, t: tp ? (tp.name || pLabel(tp.index)) : '?' }), 1.6, CARD_COLORS.curse, false);
  } else {
    game.pendingCards.push({ id, by: cp.picker, target: def.type === 'boon' ? cp.picker : null });
    addBanner(t(def.type === 'boon' ? 'card_applied_boon' : 'card_applied_global', { p: pickerName }), 1.4, CARD_COLORS[def.type], false);
  }
  addBanner(cardName(id), 1.6, CARD_COLORS[def.type], true);
  Sound.catchFish(true);
  beginNextRound();
}

// Idő lejárt: a játék választ helyette
function autoPickCard() {
  const cp = game.cardPick;
  if (!cp) return;
  const id = choice(cp.offer);
  applyCardChoice(id, cp.targets[0]);
}

/* --- Választó képernyő (host és vendég is) --- */
const cardUI = { sel: 0, stage: 'pick', targetSel: 0 };

// A mostani választás adatai: hostnál game.cardPick, vendégnél a hosttól kapott Net.cardInfo
function cardView() {
  if (Net.role === 'client') return Net.cardInfo;
  const cp = game.cardPick;
  if (!cp) return null;
  return { picker: cp.picker, pickerIdx: cp.pickerIdx, offer: cp.offer, note: cp.note, targets: cp.targets, time: cp.time };
}

// Ezen a gépen választ-e a győztes?
function cardInteractive() {
  const v = cardView();
  if (!v) return false;
  if (Net.role === 'client') return v.picker === Net.youDev && cardUI.stage !== 'sent';
  return !v.picker.startsWith('net:');
}

function playerByDev(dev) {
  return game.players.find((p) => p.device === dev) || null;
}

function showCardScreen() {
  ui.cardScreen.classList.remove('hidden');
  renderCardScreen();
}

function renderCardScreen() {
  const v = cardView();
  if (!v) return;
  const picker = playerByDev(v.picker) || game.players[v.pickerIdx];
  const pickerName = picker ? (picker.name || pLabel(picker.index)) : '?';
  const interactive = cardInteractive();
  ui.cardTitle.textContent = interactive
    ? (cardUI.stage === 'target' ? t('card_target_title') : t('card_pick_title', { p: pickerName }))
    : t('card_waiting', { p: pickerName });
  ui.cardTitle.style.color = picker ? picker.style.tag : '';
  ui.cardNote.textContent = v.note ? t(v.note) : '';

  ui.cardRow.innerHTML = '';
  v.offer.forEach((id, i) => {
    const def = CARDS[id];
    const b = document.createElement('button');
    b.className = `card ${def.type}` + (i === cardUI.sel ? ' selected' : '');
    b.disabled = !interactive || cardUI.stage !== 'pick';
    b.innerHTML = `<span class="card-type">${escapeHtml(t('card_' + def.type))}</span>` +
      `<span class="card-icon">${def.icon}</span>` +
      `<span class="card-name">${escapeHtml(cardName(id))}</span>` +
      `<span class="card-desc">${escapeHtml(cardDesc(id))}</span>`;
    b.addEventListener('click', (e) => {
      e.currentTarget.blur();
      if (!cardInteractive() || cardUI.stage !== 'pick') return;
      cardUI.sel = i;
      cardConfirm();
    });
    ui.cardRow.appendChild(b);
  });

  const showTargets = interactive && cardUI.stage === 'target';
  ui.cardTargets.classList.toggle('hidden', !showTargets);
  ui.cardTargets.innerHTML = '';
  if (showTargets) {
    v.targets.forEach((dev, i) => {
      const p = playerByDev(dev);
      const b = document.createElement('button');
      b.className = 'card-target' + (i === cardUI.targetSel ? ' selected' : '');
      b.textContent = (p && hasCrown(p) ? '♛ ' : '') + (p ? (p.name || pLabel(p.index)) : '?');
      if (p) b.style.borderColor = p.style.tag;
      b.addEventListener('click', (e) => {
        e.currentTarget.blur();
        cardUI.targetSel = i;
        cardConfirm();
      });
      ui.cardTargets.appendChild(b);
    });
  }
  ui.cardKeys.textContent = interactive ? t('card_keys') : '';
}

function cardMove(d) {
  if (!cardInteractive()) return;
  const v = cardView();
  if (cardUI.stage === 'pick') cardUI.sel = (cardUI.sel + d + v.offer.length) % v.offer.length;
  else cardUI.targetSel = (cardUI.targetSel + d + v.targets.length) % v.targets.length;
  Sound.select();
  renderCardScreen();
}

function cardConfirm() {
  if (!cardInteractive()) return;
  const v = cardView();
  const id = v.offer[cardUI.sel];
  if (cardUI.stage === 'pick' && CARDS[id].type === 'curse' && v.targets.length > 1) {
    cardUI.stage = 'target';            // átok: kire?
    cardUI.targetSel = 0;
    Sound.select();
    renderCardScreen();
    return;
  }
  const target = CARDS[id].type === 'curse' ? v.targets[cardUI.targetSel] || v.targets[0] : null;
  if (Net.role === 'client') {
    if (Net.conn && Net.conn.open) Net.conn.send({ t: 'cardpick', id, target });
    cardUI.stage = 'sent';
    renderCardScreen();
  } else {
    applyCardChoice(id, target);
  }
}

function cardBack() {
  if (!cardInteractive() || cardUI.stage !== 'target') return;
  cardUI.stage = 'pick';
  Sound.select();
  renderCardScreen();
}

// Billentyűzet: csak a győztes eszköze választhat (vendégnél bármelyik helyi eszköz)
const CARD_KEYS = {
  ArrowLeft: ['kbR', -1], ArrowRight: ['kbR', 1], Enter: ['kbR', 'ok'], Space: ['kbR', 'ok'], Backspace: ['kbR', 'back'],
  KeyA: ['kbL', -1], KeyD: ['kbL', 1], KeyF: ['kbL', 'ok'], KeyG: ['kbL', 'back']
};
function handleCardKey(code) {
  const k = CARD_KEYS[code];
  const v = cardView();
  if (!k || !v) return;
  if (Net.role !== 'client' && k[0] !== v.picker) return;
  if (k[1] === 'ok') cardConfirm();
  else if (k[1] === 'back') cardBack();
  else cardMove(k[1]);
}

function cardPad(s) {
  const v = cardView();
  if (!v) return;
  if (Net.role !== 'client' && s.device !== v.picker) return;
  const e = s.edge;
  if (e.left) cardMove(-1);
  if (e.right) cardMove(1);
  if (e.reel || e.start) cardConfirm();
  else if (e.cancel) cardBack();
}

// Az aktív kártyák kijelzése a panelen
function panelCardsHtml(p) {
  const ids = (p.cards || []);
  const globals = (game.cards || []).filter((c) => CARDS[c.id].type === 'global').map((c) => c.id);
  return ids.concat(globals).map((id) =>
    `<span style="color:${CARD_COLORS[CARDS[id].type]}">${CARDS[id].icon} ${escapeHtml(cardName(id))}</span>`
  ).join(' ');
}


/* ==========================================================================
   19/H. CSATÁROZÁS ÉS VÉLETLEN ESEMÉNYEK
     - kötélhúzás (halrablás), halom a csónakban, sirály
     - mystery box, palack üzenettel, Golden Hour, vihar, kraken
     - díjak a meccs végén
   ========================================================================== */

/* ---------- közös: gombnyomkodás számolása (kötélhúzás, kraken, sirály) ---------- */
function countMash(p) {
  const inp = p.in;
  const tg = game.tug;
  if (tg && inp.reel) {
    if (tg.thief === p.index) tg.a++;
    else if (tg.owner === p.index) tg.b++;
  }
  const kr = game.kraken;
  if (kr && kr.phase === 'hold' && (inp.reel || inp.tug)) kr.progress++;
  const g = game.gull;
  if (g && g.phase === 'swoop' && g.pIdx === p.index && (inp.reel || inp.tug)) {
    g.presses++;
    if (g.presses >= g.need) {
      g.phase = 'flee';
      addPopup(t('pop_shoo'), g.x, g.y + 8, '#ffffff', 1, 1);
      Sound.squawk(true);
    }
  }
}

// Le van-e fagyasztva a játékos horga (kötélhúzás / kraken)?
function hookFrozen(p) {
  const tg = game.tug;
  if (tg && (tg.thief === p.index || tg.owner === p.index)) return true;
  const kr = game.kraken;
  return !!(kr && kr.target === p.index && (kr.phase === 'rise' || kr.phase === 'hold'));
}

/* ---------- KÖTÉLHÚZÁS: a szabad horoggal hozzáérsz más horgon lévő halához ---------- */
function checkSteal() {
  if (game.tug || game.numPlayers < 2 || game.state !== 'playing') return;
  for (const p of game.players) {
    const hk = p.hook;
    if (hk.state !== 'free' || p.stealCd > 0 || hookFrozen(p)) continue;
    for (const q of game.players) {
      if (q === p || q.hook.state !== 'fight' || !q.hook.fish || hookFrozen(q)) continue;
      const f = q.hook.fish;
      if (f.sp.item || f.y < ZONE_Y1) continue;              // a sekély zóna védett
      if (Math.abs(hk.x - f.x) < f.w / 2 + 4 && Math.abs(hk.y + 3 - f.y) < f.h / 2 + 4) {
        startTug(p, q);
        return;
      }
    }
  }
}

function startTug(thief, owner) {
  game.tug = { thief: thief.index, owner: owner.index, time: CONFIG.TUG_TIME, a: 0, b: 0 };
  thief.hook.state = 'tug';
  thief.stealCd = CONFIG.STEAL_COOLDOWN;
  owner.stealCd = CONFIG.STEAL_COOLDOWN;   // azonnal ne lehessen visszalopni
  addBanner(t('ban_tug'), 1.4, '#ffc933', true);
  Sound.event();
}

function updateTug(dt) {
  const tg = game.tug;
  if (!tg) return;
  const thief = game.players[tg.thief];
  const owner = game.players[tg.owner];
  if (!thief || !owner || !owner.hook.fish) {             // közben elvitte a cápa / sirály
    if (thief && thief.hook.state === 'tug') thief.hook.state = 'free';
    game.tug = null;
    return;
  }
  tg.time -= dt;
  if (tg.time > 0) return;
  const f = owner.hook.fish;
  const thiefWins = tg.a > tg.b * CONFIG.TUG_OWNER_BONUS && tg.a > 0;
  if (thiefWins) {
    owner.hook.fish = null;
    owner.hook.state = 'free';
    owner.hook.baited = false;
    owner.hook.tension = 0;
    thief.hook.state = 'fight';
    thief.hook.fish = f;
    thief.hook.tension = 0;
    thief.hook.overload = 0;
    f.owner = thief;
    attachFishToHook(f, thief.hook);
    thief.steals++;
    addPopup(t('pop_stolen'), f.x, f.y - 12, thief.style.tag, 2, 1.4);
    Sound.catchFish(false);
  } else {
    thief.hook.state = 'reset';
    addPopup(t('pop_defended'), f.x, f.y - 12, owner.style.tag, 2, 1.4);
    Sound.tug();
  }
  game.tug = null;
}

function drawTug() {
  const tg = game.tug;
  if (!tg) return;
  const thief = game.players[tg.thief];
  const owner = game.players[tg.owner];
  if (!thief || !owner) return;
  const f = owner.hook.fish;
  const cx = f ? f.x : owner.hook.x;
  const cy = (f ? f.y : owner.hook.y) - 16;
  const total = tg.a + tg.b * CONFIG.TUG_OWNER_BONUS || 1;
  const share = tg.a / total;
  const w = 44;
  const x0 = Math.round(clamp(cx - w / 2, 2, W - w - 2));
  ctx.fillStyle = '#000';
  ctx.fillRect(x0 - 1, Math.round(cy) - 1, w + 2, 6);
  ctx.fillStyle = owner.style.tag;
  ctx.fillRect(x0, Math.round(cy), w, 4);
  ctx.fillStyle = thief.style.tag;
  ctx.fillRect(x0, Math.round(cy), Math.round(w * share), 4);
  if (Math.floor(game.time * 6) % 2 === 0) drawText(ctx, t('pop_mash'), cx, cy - 8, 1, '#ffffff', 'center');
}

/* ---------- HALOM A CSÓNAKBAN: minél több hal, annál lassabb a csónak ---------- */
function pileCount(p) {
  return p.pile ? p.pile.length : (p.pileCount || 0);
}

function pileFactor(p) {
  return Math.max(CONFIG.PILE_MIN, 1 - CONFIG.PILE_SLOWDOWN * pileCount(p));
}

const PILE_COLORS = ['#c3ccd6', '#a6c24a', '#5e8c3a', '#e8c860', '#d0603a', '#6e5c3a'];
function drawPile(p, r) {
  const n = Math.min(12, pileCount(p));
  for (let k = 0; k < n; k++) {
    const key = p.pile && p.pile[k];
    ctx.fillStyle = key && SPECIES[key] ? (SPECIES[key].colors.a || PILE_COLORS[k % 6]) : PILE_COLORS[k % 6];
    const flop = Math.floor(game.time * 4 + k * 1.7) % 7 === 0 ? -1 : 0;   // néha megrándul
    const x = r.bx + 5 + (k % 6) * 3 + (Math.floor(k / 6) % 2);
    const y = r.by - 1 - Math.floor(k / 6) * 2 + flop;
    ctx.fillRect(x, y, 3, 2);
  }
}

/* ---------- SIRÁLY: a felszínen ellopná a halat – nyomkodással elhessegethető ---------- */
function maybeSeagull(p) {
  const f = p.hook.fish;
  if (!f || f.gullChecked || f.sp.item || game.gull || game.state !== 'playing') return;
  f.gullChecked = true;
  if (Math.random() >= CONFIG.SEAGULL_CHANCE) return;
  const dir = p.hook.x < W / 2 ? -1 : 1;     // a távolabbi oldalról érkezik
  const sx = dir > 0 ? -12 : W + 12;
  game.gull = { pIdx: p.index, x: sx, y: 3, sx, sy: 3, dir: dir > 0 ? 1 : -1, t: 0, presses: 0, need: CONFIG.SEAGULL_SHOO, phase: 'swoop', carry: false };
  addPopup(t('pop_seagull'), p.hook.x, SURFACE_Y - 14, '#ffffff', 2, 1.2);
  Sound.squawk(false);
}

function updateGull(dt) {
  const g = game.gull;
  if (!g) return;
  g.t += dt;
  const p = game.players[g.pIdx];
  if (g.phase === 'swoop') {
    if (!p || !p.hook.fish) { g.phase = 'flee'; return; }
    const k = Math.min(1, g.t / CONFIG.SEAGULL_TIME);
    const tx = p.hook.x;
    const ty = SURFACE_Y - 5;
    g.x = g.sx + (tx - g.sx) * k;
    g.y = g.sy + (ty - g.sy) * k - Math.sin(k * Math.PI) * 4;
    g.dir = tx >= g.sx ? 1 : -1;
    if (k >= 1) {                              // odaért: elviszi a halat
      const f = p.hook.fish;
      f.dead = true;
      f.hooked = false;
      p.hook.fish = null;
      p.hook.state = 'free';
      p.hook.baited = false;
      p.hook.tension = 0;
      p.gullLost++;
      g.phase = 'steal';
      g.carry = true;
      addPopup(t('pop_gull_stole'), p.hook.x, SURFACE_Y - 16, '#ff4a4a', 1, 1.6);
      Sound.squawk(true);
    }
  } else {
    g.x += g.dir * 90 * dt;
    g.y -= 25 * dt;
    if (g.x < -20 || g.x > W + 20 || g.y < -10) game.gull = null;
  }
}

function drawGull() {
  const g = game.gull;
  if (!g) return;
  const x = Math.round(g.x);
  const y = Math.round(g.y);
  const d = g.dir;
  const up = Math.floor(game.time * 10) % 2 === 0;
  ctx.fillStyle = '#f4f4f4';
  ctx.fillRect(x - 3, y, 6, 2);                               // test
  ctx.fillRect(d > 0 ? x + 3 : x - 5, y - 1, 2, 2);           // fej
  ctx.fillStyle = '#ffb020';
  ctx.fillRect(d > 0 ? x + 5 : x - 7, y, 2, 1);               // csőr
  ctx.fillStyle = '#101010';
  ctx.fillRect(d > 0 ? x + 4 : x - 5, y - 1, 1, 1);           // szem
  ctx.fillStyle = '#b8c0c8';                                   // szárnyak
  if (up) {
    ctx.fillRect(x - 5, y - 3, 3, 1);
    ctx.fillRect(x - 3, y - 2, 2, 1);
    ctx.fillRect(x + 1, y - 2, 2, 1);
    ctx.fillRect(x + 2, y - 3, 3, 1);
  } else {
    ctx.fillRect(x - 6, y + 1, 4, 1);
    ctx.fillRect(x + 2, y + 1, 4, 1);
  }
  if (g.carry) {
    ctx.fillStyle = '#c3ccd6';
    ctx.fillRect(x - 1, y + 2, 3, 2);
  }
  if (g.phase === 'swoop' && Math.floor(game.time * 6) % 2 === 0) {
    const p = game.players[g.pIdx];
    if (p) drawText(ctx, t('pop_mash'), p.hook.x, SURFACE_Y - 22, 1, '#ffffff', 'center');
  }
}

/* ---------- MYSTERY BOX és PALACK (ritkán sodródnak be) ---------- */
function maybeSpawnItem() {
  if (game.state !== 'playing' || Math.random() >= CONFIG.ITEM_CHANCE) return;
  if (game.fish.some((f) => f.sp.item)) return;
  spawnFish(false, Math.random() < 0.55 ? 'crate' : 'bottle');
}

function collectItem(p, f) {
  const hk = p.hook;
  f.dead = true;
  f.hooked = false;
  hk.fish = null;
  hk.state = 'free';
  hk.tension = 0;
  hk.y = HOOK_MIN_Y;
  p.treasures++;
  splash(hk.x, SURFACE_Y, 10, PALETTES[game.mode].foam);
  if (f.key === 'bottle') openBottle(p);
  else openCrate(p);
  if (game.state === 'playing' && p.roundScore >= game.target) roundClear(p);
}

function openCrate(p) {
  const r = Math.random();
  addBanner(t('item_crate'), 1.2, '#ffc933', false);
  let outcome;
  let pts = 0;
  if (r < 0.3) {                                 // pontjutalom
    pts = Math.round(100 * (game.mode === 'night' ? CONFIG.NIGHT_SCORE_MULTIPLIER : 1) * (game.golden > 0 ? 2 : 1));
    p.score += pts;
    p.roundScore += pts;
    outcome = t('item_jackpot', { n: pts });
    Sound.catchFish(true);
  } else if (r < 0.55) {                          // plusz idő
    game.timeLeft = Math.min(CONFIG.TIME_MAX, game.timeLeft + 15);
    game.timeFlash = 1;
    outcome = t('item_time', { n: 15 });
    Sound.catchFish(false);
  } else if (r < 0.8) {                           // GOLDEN HOUR mindenkinek
    game.golden = CONFIG.GOLDEN_TIME;
    outcome = t('ban_golden');
    Sound.roundClear();
  } else {                                        // csak egy régi bakancs...
    outcome = t('item_boot');
    Sound.tone(300, 0.25, { type: 'triangle', slide: 120, vol: 0.06 });
  }
  addBanner(outcome, 1.8, '#ffc933', true);
  p.log.push({ nick: fishName('crate'), species: outcome, weight: 0, pts, round: game.level });
}

function openBottle(p) {
  const type = Math.random() < 0.5 ? 'boon' : 'curse';
  const id = choice(CARD_IDS.filter((k) => CARDS[k].type === type));
  game.cards.push({ id, by: p.device, target: p.device, bottle: true });
  applyCardMods();
  addBanner(t('item_bottle'), 1.2, '#5fd0ff', false);
  addBanner(cardName(id), 1.8, CARD_COLORS[type], true);
  if (type === 'boon') Sound.catchFish(true);
  else Sound.tone(400, 0.3, { type: 'sawtooth', slide: 150, vol: 0.05 });
  p.log.push({ nick: fishName('bottle'), species: cardName(id), weight: 0, pts: 0, round: game.level });
}

/* ---------- VIHAR: szél sodorja a horgokat, villámlik ---------- */
function updateStorm(dt) {
  if (game.flash > 0) game.flash -= dt;
  if (!game.event || game.event.type !== 'storm') return;
  game.flashTimer -= dt;
  if (game.flashTimer <= 0) {
    game.flashTimer = rand(2, 4);
    game.flash = 0.15;
    Sound.thunder();
  }
  for (const p of game.players) {
    if (hookFrozen(p)) continue;
    const hk = p.hook;
    if (hk.state === 'free') hk.x = clamp(hk.x + game.wind * 12 * dt, 6, W - 6);
    else if (hk.state === 'fight') hk.x = clamp(hk.x + game.wind * 5 * dt, 6, W - 6);
  }
}

function drawStorm() {
  if (game.event && game.event.type === 'storm') {
    ctx.fillStyle = 'rgba(190,220,255,0.55)';
    for (let i = 0; i < 70; i++) {
      const x = (i * 53 + game.time * 140) % (W + 40) - 20;
      const y = (i * 37 + game.time * 260) % H;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 3);
    }
  }
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.7, game.flash * 5).toFixed(2)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ---------- GOLDEN HOUR: dupla pont mindenkinek ---------- */
function drawGolden() {
  if (!(game.golden > 0)) return;
  ctx.fillStyle = 'rgba(255,200,40,0.08)';
  ctx.fillRect(0, 0, W, H);
}

/* ---------- KRAKEN: elkapja valaki damilját, mindenki együtt nyomkodja ---------- */
function startKraken() {
  const cand = game.players.filter((p) => p.hook.state === 'free' || p.hook.state === 'fight');
  if (!cand.length) { game.event = null; return; }
  const target = choice(cand);
  game.kraken = {
    target: target.index, phase: 'rise', t: 0, progress: 0,
    need: CONFIG.KRAKEN_NEED_BASE + CONFIG.KRAKEN_NEED_PER * game.players.length,
    x0: clamp(target.hook.x + rand(-25, 25), 10, W - 10), time: CONFIG.KRAKEN_TIME
  };
  addBanner(t('ban_kraken'), 1.6, '#c77dff', true);
  addBanner(t('ban_kraken_mash'), 1.8, '#ffffff', false);
  game.shake = 0.8;
  Sound.rumble();
}

function updateKraken(dt) {
  const kr = game.kraken;
  if (!kr) return;
  kr.t += dt;
  const target = game.players[kr.target];
  if (kr.phase === 'rise' && kr.t >= 1.2) { kr.phase = 'hold'; kr.t = 0; }
  else if (kr.phase === 'hold') {
    if (kr.progress >= kr.need) {                          // sikerült elűzni
      kr.phase = 'retreat';
      kr.t = 0;
      for (const p of game.players) { p.score += 15; p.roundScore += 15; }
      addBanner(t('ban_kraken_win'), 1.8, '#6cf06c', true);
      Sound.roundClear();
    } else if (kr.t >= kr.time) {                          // elvitte
      kr.phase = 'retreat';
      kr.t = 0;
      if (target) {
        if (target.hook.fish) {
          const f = target.hook.fish;
          releaseFish(target);
          f.dead = true;
        }
        target.hook.state = 'reset';
        target.hook.tension = 0;
      }
      addBanner(t('ban_kraken_lose'), 1.8, '#ff4a4a', true);
      Sound.chomp();
    }
  } else if (kr.phase === 'retreat' && kr.t >= 1.2) {
    game.kraken = null;
    if (game.event && game.event.type === 'kraken') game.event = null;
  }
}

function drawKraken() {
  const kr = game.kraken;
  if (!kr) return;
  const target = game.players[kr.target];
  if (!target) return;
  const tipX = target.hook.x;
  const tipY = target.hook.y + 3;
  let reach = 1;
  if (kr.phase === 'rise') reach = Math.min(1, kr.t / 1.2);
  else if (kr.phase === 'retreat') reach = Math.max(0, 1 - kr.t / 1.2);
  const baseY = H - 2;
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const k = (i / N) * reach;
    const x = kr.x0 + (tipX - kr.x0) * k + Math.sin(game.time * 3 + i * 0.6) * 4 * (1 - k);
    const y = baseY + (tipY - baseY) * k;
    const thick = Math.max(1, Math.round(5 * (1 - i / N)) + 1);
    ctx.fillStyle = '#7a2f8a';
    ctx.fillRect(Math.round(x - thick / 2), Math.round(y), thick, 4);
    if (i % 3 === 0 && thick > 2) {
      ctx.fillStyle = '#e6a6f0';
      ctx.fillRect(Math.round(x), Math.round(y) + 1, 1, 1);
    }
  }
  if (kr.phase === 'hold') {
    const w = 120;
    const x0 = Math.round(W / 2 - w / 2);
    const y0 = 66;
    ctx.fillStyle = '#000';
    ctx.fillRect(x0 - 1, y0 - 1, w + 2, 6);
    ctx.fillStyle = '#3a1540';
    ctx.fillRect(x0, y0, w, 4);
    ctx.fillStyle = '#c77dff';
    ctx.fillRect(x0, y0, Math.round(w * Math.min(1, kr.progress / kr.need)), 4);
    drawText(ctx, `${t('ban_kraken_mash')} ${Math.max(0, Math.ceil(kr.time - kr.t))}`, W / 2, y0 + 7, 1, '#ffffff', 'center');
  }
}

/* ---------- DÍJAK A MECCS VÉGÉN ---------- */
const AWARDS = [
  { id: 'big', icon: '🐋', stat: (p) => (p.biggest ? p.biggest.weight : 0), min: 0.01, fmt: (v) => t('aw_v_kg', { n: v.toFixed(2) }) },
  { id: 'shark', icon: '🦈', stat: (p) => p.eaten, min: 1, fmt: (v) => t('aw_v_times', { n: v }) },
  { id: 'butter', icon: '🧈', stat: (p) => p.snaps, min: 1, fmt: (v) => t('aw_v_times', { n: v }) },
  { id: 'gull', icon: '🐦', stat: (p) => p.gullLost, min: 1, fmt: (v) => t('aw_v_times', { n: v }) },
  { id: 'thief', icon: '🦝', stat: (p) => p.steals, min: 1, fmt: (v) => t('aw_v_times', { n: v }) },
  { id: 'treasure', icon: '🧰', stat: (p) => p.treasures, min: 1, fmt: (v) => t('aw_v_times', { n: v }) },
  { id: 'patient', icon: '⏱', stat: (p) => Math.round(p.longest || 0), min: 5, fmt: (v) => t('aw_v_secs', { n: v }) }
];

function computeAwards() {
  if (game.players.length < 2) return [];
  const list = [];
  for (const a of AWARDS) {
    const vals = game.players.map((p) => a.stat(p) || 0);
    const best = Math.max(...vals);
    if (best < a.min) continue;
    const winners = game.players.filter((p, i) => vals[i] === best).map((p) => p.index);
    list.push({ id: a.id, who: winners, value: best });
  }
  return list;
}

let awardsRun = null;

function startAwards(list) {
  awardsRun = { list, t: 0, shown: 0 };
  ui.awardsList.innerHTML = '';
  ui.awardsScreen.classList.remove('hidden');
  ui.gameoverScreen.classList.add('hidden');
}

function tickAwards(dt) {
  if (!awardsRun) return;
  awardsRun.t += dt;
  const STEP = 1.5;
  while (awardsRun.shown < awardsRun.list.length && awardsRun.t >= (awardsRun.shown + 0.6) * STEP) {
    revealAward(awardsRun.list[awardsRun.shown]);
    awardsRun.shown++;
  }
  if (awardsRun.shown >= awardsRun.list.length && awardsRun.t >= awardsRun.list.length * STEP + 2.5) finishAwards();
}

function revealAward(a) {
  const def = AWARDS.find((x) => x.id === a.id);
  if (!def) return;
  const names = a.who.map((i) => {
    const p = game.players[i];
    return p ? `<span style="color:${p.style.tag}">${escapeHtml(p.name || pLabel(i))}</span>` : '?';
  }).join(' &amp; ');
  const div = document.createElement('div');
  div.className = 'award';
  div.innerHTML = `<span class="award-icon">${def.icon}</span><span class="award-text">` +
    `<span class="award-name">${escapeHtml(t('aw_' + a.id))}</span>` +
    `<span class="award-who">${names} - ${escapeHtml(def.fmt(a.value))}</span></span>`;
  ui.awardsList.appendChild(div);
  Sound.catchFish(true);
}

function finishAwards() {
  if (!awardsRun) return;
  awardsRun = null;
  ui.awardsScreen.classList.add('hidden');
  ui.gameoverScreen.classList.remove('hidden');
  game.stateTime = 0;          // ne induljon rögtön új meccs egy véletlen gombnyomástól
}


/* ==========================================================================
   19/B. ELRENDEZÉS – a játék mindig teljesen beférjen az ablakba
   A pontsáv, a panelek és a súgósor tényleges magasságát lemérjük, és a
   játékteret (4:3, torzítás nélkül) akkorára méretezzük, amekkora még kifér.
   ========================================================================== */
const LAYOUT = {
  MAX_WIDTH: 1600,      // a játéktér legnagyobb szélessége ablakban (teljes képernyőn nincs határ)
  MARGIN: 20,           // a lap szélein hagyott hely (px)
  SIDE_MIN: 170,        // az oldalsó panelek szélessége (min / max)
  SIDE_MAX: 270,
  SIDE_MIN_HEIGHT: 400, // ennél alacsonyabb játéktérnél a panelek alulra kerülnek
  TOUCH_SIDE_MIN: 110,  // telefonon keskenyebb oldalsó panelek is elegek
  TOUCH_SIDE_MIN_HEIGHT: 200
};

let fitPending = false;

// Telefonon a böngésző címsora görgetéskor ki-be ugrik, ettől változik az ablak magassága.
// Ilyenkor nem méretezünk újra: tájolásonként a legkisebb látott magasságot használjuk,
// így a játék akkor is kifér, amikor a címsor látszik, és nem ugrál.
const stableH = { p: 0, l: 0, w: 0 };
function layoutHeight() {
  const iw = window.innerWidth;
  const ih = window.innerHeight;
  if (!touchActive || isFullscreen()) return ih;
  const key = iw > ih ? 'l' : 'p';
  if (stableH.w !== iw) { stableH.p = 0; stableH.l = 0; stableH.w = iw; }   // új szélesség = elforgatták
  if (!stableH[key] || ih < stableH[key]) stableH[key] = ih;
  return stableH[key];
}

function fitLayout() {
  fitPending = false;
  const wrap = document.getElementById('game-wrapper');
  const stage = document.getElementById('stage');
  const scr = document.getElementById('screen');
  const hud = document.getElementById('hud');
  const help = document.querySelector('.help');
  const iw = window.innerWidth;
  const ih = layoutHeight();
  const GAP = 8;
  const borderW = scr.offsetWidth - canvas.offsetWidth;          // a játéktér kerete
  const borderH = scr.offsetHeight - canvas.offsetHeight;
  const helpH = help && help.offsetParent ? help.offsetHeight + 6 : 0;
  // telefonon: fekve a vezérlők a játéktér felett vannak, állva alatta egy külön sávban
  document.body.classList.toggle('touch-landscape', iw > ih);
  const touchBar = document.getElementById('touch-ui');
  const touchH = touchBar && touchBar.offsetParent && iw <= ih ? touchBar.offsetHeight + 6 : 0;
  const availH = ih - LAYOUT.MARGIN - hud.offsetHeight - 6 - helpH - touchH;
  const sideMin = touchActive ? LAYOUT.TOUCH_SIDE_MIN : LAYOUT.SIDE_MIN;
  const sideMinH = touchActive ? LAYOUT.TOUCH_SIDE_MIN_HEIGHT : LAYOUT.SIDE_MIN_HEIGHT;
  const cap = isFullscreen() ? Infinity : LAYOUT.MAX_WIDTH;

  // 1) panelek OLDALT: a játéktér magasságát csak az ablak magassága korlátozza
  const sideW = Math.round(clamp(iw * 0.14, sideMin, LAYOUT.SIDE_MAX));
  const sideCanvasW = Math.min(cap, (availH - borderH) * 4 / 3, iw * 0.98 - 2 * (sideW + GAP) - borderW);

  // 2) panelek ALUL: lemérjük, mennyi helyet foglal a panelsor
  document.body.classList.remove('side-panels');
  let bottomCanvasW = Math.min(cap, iw * 0.96 - borderW, (availH - borderH) * 4 / 3);
  for (let i = 0; i < 2; i++) {
    stage.style.width = Math.floor(bottomCanvasW + borderW) + 'px';
    const panelsH = stage.offsetHeight - scr.offsetHeight;
    bottomCanvasW = Math.min(cap, iw * 0.96 - borderW, (availH - panelsH - borderH) * 4 / 3);
  }

  // amelyik nagyobb játékteret ad, az nyer (a 4:3 arány mindig marad)
  const useSide = sideCanvasW >= bottomCanvasW && sideCanvasW * 0.75 >= sideMinH;
  if (useSide) {
    const w = Math.floor(Math.max(300, sideCanvasW));
    document.body.classList.add('side-panels');
    stage.style.setProperty('--screen-w', (w + borderW) + 'px');
    stage.style.setProperty('--side-w', sideW + 'px');
    stage.style.width = '';
    wrap.style.width = (w + borderW + 2 * (sideW + GAP)) + 'px';
  } else {
    const w = Math.floor(Math.max(300, bottomCanvasW));
    stage.style.width = (w + borderW) + 'px';
    wrap.style.width = (w + borderW) + 'px';
  }
}

function scheduleFit() {
  if (fitPending) return;
  fitPending = true;
  requestAnimationFrame(fitLayout);
}

function initLayout() {
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    // telefonon: ha csak a magasság változott kicsit (címsor), nem méretezünk újra
    if (touchActive && !isFullscreen() && window.innerWidth === lastW &&
        window.innerHeight >= (stableH[window.innerWidth > window.innerHeight ? 'l' : 'p'] || 0)) return;
    lastW = window.innerWidth;
    scheduleFit();
  });
  const fsChange = () => { stableH.p = 0; stableH.l = 0; scheduleFit(); };
  document.addEventListener('fullscreenchange', fsChange);
  document.addEventListener('webkitfullscreenchange', fsChange);
  window.addEventListener('orientationchange', fsChange);
  // ha a pontsáv vagy a panelek magassága változik (pl. 2 játékos, hosszabb szöveg)
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(scheduleFit);
    ro.observe(document.getElementById('hud'));
    for (let n = 1; n <= 4; n++) ro.observe(document.getElementById('panel-' + n));
  }
  fitLayout();
}


/* ==========================================================================
   20. FŐ CIKLUS
   ========================================================================== */
function update(dt) {
  game.stateTime += dt;
  if (Net.role === 'client' && Net.mirror) {
    clientUpdate(dt);
    return;
  }
  if (Net.role === 'host' && Net.vote && game.state !== 'join') return;   // szavazás alatt áll a játék
  if (game.state === 'paused') return;

  game.time += dt;
  if (game.shake > 0) game.shake -= dt;
  if (game.timeFlash > 0) game.timeFlash -= dt;

  if (game.state === 'playing') updateTimer(dt);
  if (game.state === 'playing') {
    updateEvents(dt);
    for (const p of game.players) updateHook(p, dt);
    if (game.state === 'playing') {
      updateTug(dt);
      updateGull(dt);
      updateKraken(dt);
      updateStorm(dt);
      if (game.golden > 0) game.golden -= dt;
      checkSteal();
    }
  } else {
    for (const p of game.players) idleHook(p, dt);
  }

  if (game.state === 'roundclear') {
    game.clearTimer -= dt;
    if (game.clearTimer <= 0) {
      if (game.matchRounds && game.level >= game.matchRounds) endGame();   // vége a meccsnek
      else if (game.matchRounds && game.numPlayers > 1) openCardPhase();    // kártyák a körök között
      else {
        setState('playing');
        startRound(game.level + 1);
      }
    }
  }

  if (game.state === 'cards' && game.cardPick) {
    game.cardPick.time -= dt;
    if (game.cardPick.time <= 0) autoPickCard();
  }

  updatePredator(dt);
  updateSpawning(dt);
  for (const f of game.fish) updateFish(f, dt);
  cleanupFish();
  for (const p of game.players) updateBoat(p, dt);
  updateEffects(dt);
}

let lastTime = performance.now();

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  Music.update(dt);
  pollInput();
  update(dt);
  Net.tick(dt);
  checkHaptics();
  tickAwards(dt);
  render();
  updateHUD();
  requestAnimationFrame(frame);
}

Music.init();
if (GUEST) menu.row = ACTION_ROW;   // vendég: a JOIN ONLINE gomb van kijelölve
setupAttract();
applyI18n();
initLayout();
Music.unlock();                // az .exe-ben azonnal szól; böngészőben az első gombnyomásra
if (isDesktop) Sound.init();   // az .exe-ben a hang gombnyomás nélkül is indulhat
requestAnimationFrame(frame);
