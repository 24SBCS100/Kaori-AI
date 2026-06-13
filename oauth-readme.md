# Understanding OAuth in Kaori AI

This document explains how OAuth works, why we need it, and the difference between developer credentials and user tokens.

## What is OAuth and Why Do We Need It?

**OAuth (Open Authorization)** is a secure standard that lets an app (like Kaori AI) use services on a user's behalf (like Spotify or Google) **without ever seeing their passwords**.

If you want Kaori to actually *do* things for you in the real world—like playing a song on your Spotify, adding an event to your Google Calendar, or reading an email—she needs permission to talk to those services.

## How Does It Work?

Instead of giving Kaori a Spotify username and password (which would be very unsafe!), the flow goes like this:
1. **The Request:** The user clicks "Connect Spotify" in Kaori's settings.
2. **The Handshake:** Kaori redirects the user to Spotify's official, secure login page.
3. **The Approval:** The user logs into Spotify and a prompt asks: *"Do you want to allow Kaori AI to control your music playback?"* The user clicks "Agree".
4. **The Key (Token):** Spotify sends Kaori a special digital "Access Token". 

That Access Token is like a hotel key card. It only opens specific doors (e.g., music playback) and Kaori uses it whenever she needs to talk to Spotify. 
- **Security:** If Kaori gets hacked, the hacker only gets the temporary "key card," not the actual Spotify password.
- **Control:** The user can go to their Spotify account settings at any time and revoke Kaori's access, and her key card will instantly stop working. 

Without OAuth, Kaori would just be a standard chatbot that talks to you. *With* OAuth, she becomes an **Agent** that can safely take actions across all your apps!

## Does the user have to activate it manually?

**Yes.** The user **must** manually initiate the connection (e.g., by clicking the "Connect Spotify" button). 

The app cannot automatically connect to their external accounts behind the scenes. This is the entire point of OAuth's security model: it forces a human user to explicitly grant permission to the app on the provider's website (Google/Spotify) before the app is allowed to do anything.

Once they manually connect it *once*, the server saves that "Access Token" in the database. From that point forward, it stays connected in the background, and Kaori can control their music without them having to log in again every time!

## Developer Keys vs. User Tokens

A common point of confusion is: *"If I (the developer) put my own Google or Spotify API keys/secrets into the `.env.local` file, how does that connect to another user's personal account?"*

In OAuth, there are actually **two completely different sets of keys**:

### 1. The Developer Keys (Your `.env.local` file)
When you create an app on the Google Developer Console or Spotify Dashboard, they give you a **Client ID** and a **Client Secret**. 
- You put these in your `.env.local` file. 
- These keys DO NOT belong to any specific user account. They belong to **Kaori AI**. 
- Think of them like Kaori AI's "business license" or "ID badge." They just tell Google/Spotify: *"Hi, I am the Kaori AI app, and I am officially registered."*

### 2. The User Tokens (Saved in the Database)
When someone visits your website and clicks "Connect Spotify":
1. Kaori AI knocks on Spotify's door and shows her "ID badge" (your Client ID from the `.env.local` file).
2. Spotify says, *"Ah, I recognize you, Kaori AI."*
3. Spotify then looks at the human user sitting at the computer and says, *"Kaori AI wants to control your music. Please log in to your own Spotify account to allow this."*
4. The user types in **their own** email and password directly on Spotify's website.
5. Spotify gives Kaori an **Access Token** specifically for that user's account. Kaori saves this in her database (`db.ts`).

The credentials you put in `.env.local` only identify your app to the provider. They don't give the app access to anyone's account. Every individual user who uses Kaori AI still has to log in with their own email and password on Spotify/Google to generate a unique Access Token for their specific account.
