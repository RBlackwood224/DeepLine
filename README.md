# Deep Line 🎣

A little retro fishing game that runs in your browser. You drop your line, hook something, tire it out and reel it in before the clock runs out. Sounds simple. Then the shark shows up.

**▶ Play it here:** https://rblackwood224.github.io/DeepLine/

---

## What is this?

I wanted to make something in the spirit of the old Atari / C64 / NES games I grew up with: big pixels, a handful of colors, easy to pick up, annoyingly hard to put down. It started as a simple "catch fish, get points" thing and slowly turned into a couch party game, because every time my family played it someone had a new idea.

It's built for playing together, either on the same screen with controllers or online with friends. But it works fine on your own too.

## Features

- Up to **4 players on one screen** (keyboard, controllers, or any mix)
- **Online matches** with friends: open a room, send them the link and the room code, done
- **18 kinds of fish**, plus a legendary one you probably won't catch the first time
- Special fish show up in a **random order every match**: piranhas that steal your bait, an electric eel that zaps your line, an octopus that inks the water, a swordfish that cuts lines...
- A **shark** that goes after whatever you've got on the hook (hint: it doesn't like shallow water)
- **Curse & boon cards** between rounds. The player in last place picks, so whoever's winning should be a bit worried
- **Steal fish** from each other with a button-mashing tug of war
- A **seagull** that tries to grab your fish right at the surface
- Random stuff: mystery boxes, messages in a bottle, storms, golden hour, and a **kraken**
- Silly **awards** at the end of every match
- Day and night mode, English and French, phone controls with vibration

## Controls

| | Arrows side | WASD side | Controller | Phone |
|---|---|---|---|---|
| Move hook | Arrow keys | W A S D | Stick / D-pad | Joystick (left side) |
| Tug | Space | F | B / X | TUG button |
| Reel | Enter | G | A | REEL button |
| Pause | P / Esc | P / Esc | Start | ❚❚ |

## How to play

1. Lower your hook and wait for a bite.
2. The fish alternates between **struggling** (red) and **resting** (green). Tug while it's resting, that's when it hurts the most.
3. Watch the **line tension**. If it goes red, back off or the line snaps.
4. Once the fish is out of stamina, **mash REEL** to pull it up.
5. Every fish gives you points and a bit of extra time. Bigger, deeper, nastier fish give more of both.

Deeper water = better fish, but also longer trips, tougher fights and a shark that's waiting for you down there. Your call.

## Playing together

**Same screen:** press Start, then everyone presses a button on their own keyboard side / controller / phone to join. Pick 3, 5 or 7 rounds. Whoever wins the most rounds gets the crown 👑 (and probably gets cursed a lot in the next match).

**Online:** press Start → **Open online room**, then send your friends the link and the 6-letter code. They open the link, hit **Join online** and type in the code. That's it. No accounts, no installs. The host's browser runs the game, so keep the window open and visible while you play.

## Running it yourself

It's just three files and some music, no build step:

```
index.html
style.css
script.js
menu.mp3
day1.mp3  day2.mp3  day3.mp3
night1.mp3  night2.mp3  night3.mp3
```

Put them in one folder and open `index.html`. Music starts after your first keypress (browsers don't let pages autoplay sound).

Online play needs the game to be hosted somewhere over HTTPS. GitHub Pages works perfectly for that.

## Under the hood

Plain HTML, CSS and JavaScript, no game engine and no framework. Everything you see is drawn on a canvas by code, including the pixel font. Sound effects are generated with the Web Audio API. The only outside library is [PeerJS](https://peerjs.com/), which handles the online connection between browsers.

The music is mine, made in a C64-ish style.

## Known quirks

- On iPhone, Safari won't do real fullscreen. Use "Add to Home Screen" and launch it from there.
- Vibration only works on Android (Safari doesn't support it).
- If the host minimizes the browser during an online match, the game freezes for everyone. Sorry, that's how browsers work.

## Feedback

Found a bug, have an idea for a new fish, or just want to complain about the octopus? Open an issue or message me. Most of the features in here came from people saying "you know what would be funny..."

Have fun, and watch out for the seagull.
