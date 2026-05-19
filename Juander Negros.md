# Juander Negros — Mobile Tourism Application

## What Is This Application?

Juander Negros is a mobile application designed to help people discover places worth visiting based on who they are and what they enjoy. It works for two kinds of users — locals who want to explore their own area, and tourists who are visiting and need more practical support on top of destination recommendations.

The application is installed directly on an Android phone. It does not require a website or a browser. Everything happens inside the app.

---

## The Problem It Solves

Most tourism apps show you everything at once — hundreds of pins on a map with no regard for what you actually care about. A solo backpacker and a family with children do not need the same recommendations. A local does not need to see ATMs and hotels. A tourist does not know where the non-chain restaurants are.

TourRoute filters all of that from the start, based on answers you give when you first open the app. The result is a map that shows you only what is relevant to you, not everything that exists.

---

## Who Uses It

**Locals** — residents who want to rediscover or explore attractions in their own city or region. The app focuses purely on destinations for them.

**Tourists** — visitors who need destinations plus practical support like finding an ATM, a place to stay, or a local restaurant that is not a fast food chain.

---

## How It Works — Start to Finish

### Signing In

You open the app and sign in one of two ways — through your existing Google account with a single tap, or by creating an account with an email address and password. No lengthy registration forms. If you use Google, your name and photo are pulled in automatically.

Your account is secure and personal. Nobody else sees your data.

---

### First-Time Setup

The first time you sign in, the app walks you through three quick questions before you see anything else.

**Question 1 — Who are you?**
You pick either Local or Tourist. This determines what layers appear on your map.

**Question 2 — How are you traveling?**
You pick one: Solo, Family, or Group. This helps the app weigh which destinations are most suitable for your situation.

**Question 3 — What are you into?**
You pick as many as you like from a list that includes:

- Nature
- Adventure
- Cultural Sites
- Festivals
- Food
- Shopping
- Relaxation

You pick at least one and tap Done. The whole setup takes under a minute.

Your answers are saved to your account. You can change any of them later from your profile at any time.

---

### The Map — Your Main Screen

After setup, you land on a map centered on your current location. This is the core of the application.

On the map you see pins — each pin is a destination that matches your preferences. Someone who selected Nature and Adventure sees completely different pins from someone who selected Food and Shopping. The map is personal to you from the moment it loads.

When many destinations are close together on the map, they group into a single bubble showing how many are in that cluster. As you zoom in, they separate into individual pins. This keeps the map clean and readable regardless of how many places exist in the area.

At the bottom of the screen is a horizontal strip of cards you can swipe through. Each card shows a destination's photo, name, and distance from you. Swiping to a card moves the map camera to that location automatically.

---

### Destination Details

Tap any pin on the map or any card at the bottom and a panel slides up from the bottom of the screen. This panel shows you:

- A scrollable photo gallery of the destination
- The name and distance from your current position
- Category tags showing what type of place it is
- A written description
- A bookmark button to save it for later
- A Get Directions button that opens the location in Google Maps for navigation

---

### The Tourist Layer

If you signed up as a Tourist, your map has an additional control — a toggle button that switches extra layers on and off.

These layers are:

**ATMs** — nearby cash machines, shown as a separate set of pins with a distinct color so they are never confused with destinations.

**Hotels** — accommodation options in the area.

**Local Restaurants** — dining options that are locally owned, not major chains. You can filter this if you prefer to see all restaurants instead.

You control which of these are visible at any time. If you only need to find an ATM right now, you turn the other layers off. The destination pins from your preferences remain on the map regardless.

---

### The Local Experience

If you signed up as a Local, none of the tourist layers appear. Your map shows only destinations. The experience is cleaner and focused entirely on attractions worth visiting, not practical tourist necessities you already know about.

---

### Updating Your Preferences

Go to your profile screen and tap Edit Preferences. You can change your class, travel type, or interest categories. The moment you save, the map on your main screen updates immediately — the pins change to reflect your new preferences without needing to restart the app or refresh anything manually.

---

### Saved Places

Any destination you bookmark is saved to your account. Tap the Bookmarks tab to see everything you have saved. These are stored under your account, so they are available on any device you sign into.

---

### List View

Not everyone navigates easily by map. A toggle at the top of the main screen switches between the map and a flat list of nearby destinations sorted by distance from you. All the same filters apply. Tap any item in the list to open its detail panel. Switch back to the map at any time.

---

### No Signal

If you lose internet connection, the app still shows the last set of destinations it loaded. Your saved bookmarks remain accessible. The app does not crash or go blank when offline.

---

## What the App Looks Like

The application is designed to feel premium. The map uses a dark theme with custom-colored pins rather than standard red markers. Cards and panels use a frosted glass appearance over the map background. Screen transitions are smooth and animated — nothing cuts abruptly. Buttons respond visibly to taps. The onboarding steps slide between each other fluidly.

The goal is that picking up the phone and using this app feels noticeably different from a generic application.

---

## What the App Does Not Do

To set accurate expectations:

- It does not book hotels, restaurants, or tours
- It does not provide its own navigation — directions hand off to Google Maps
- It does not allow users to add or review destinations — all destination content is managed by the administrators of the app
- It does not track your location in the background when the app is closed

---

## What Powers It Behind the Scenes

The application is built on Google's Firebase platform. This handles:

- **Authentication** — your sign-in is managed securely by Google
- **Database** — your preferences, account details, and bookmarks are stored in a real cloud database that updates in real-time
- **Destinations** — all destination and amenity records are stored and retrieved from the same database

All of this is live and verifiable. When you edit your preferences, the change is written to the cloud database immediately and reflected on the map within seconds.
