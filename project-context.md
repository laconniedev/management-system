# Project Name: management-system

## Executive Summary And Core Goal
- **Overview** This web application is used mainly by the manager and staff of an afterschool program. It shows an editable monthly calendar where staff add, edit, and delete lesson plans (STEM, Education, Art, Sports) and events on specific days.
- **Core Problem Solved** Gives afterschool managers a clear, visible structure for the program's workflow, so they can keep track of lessons planned and materials needed by their staff.
- **Target User** Afterschool Program Manager, Afterschool Teacher

## Tech Stack And Engineering Rules
- **Framework and Language** Next.js (TypeScript), Tailwind CSS, Supabase
- **Key Constraints:**
    - Responsive on both desktop and mobile
    - Build ready for Vercel deployment and hosting
    - Uses the user's existing Supabase project
    - Code lives in a local folder on the user's computer first
    - Multiple people logged into the same program can use the calendar at the same time

## Accounts And Access Rules
- One shared login per program. Every staff member of a program uses the same program name and password.
- Program names must be unique (case-insensitive). If a name is taken, show an error and ask the user to choose another.
- Password is chosen by the user at setup (not the director's name). Passwords are never sent to the browser.
- No lockout after wrong passwords.
- Sessions last 2 days, then the user must log in again.
- No password recovery flow (there is no email). A logged-in user can change the password from the header.

## Core Features And App Flows

### Flow 1: Login And New Program Setup (`/login`)
1. User arrives at `/login` and sees two fields: program name and password.
2. To the right of the program name field is a button with a sheep icon. Clicking it opens a dropdown listing existing program names. Selecting one fills in only the program name field; the user still types the password.
3. On correct credentials, the user is redirected to `/dashboard` for their program.
4. New programs: user chooses "Create program", then enters a program name and a password (single step, no second screen). On success they go straight to their dashboard.

### Flow 2: Calendar View (`/dashboard`)
1. User sees a monthly calendar with "Previous" and "Next" buttons to move between months.
2. Weeks start on **Sunday**.
3. Desktop: hovering over a day shows a "plus" icon in its upper-right corner. Mobile: tapping a day opens its pop-up directly.
4. Each day cell lists its items with **events always first**, then lesson plans. If there are more than fit, show the first few followed by "+N more".
5. Past dates can still be added to, edited, and deleted.
6. Changes made by anyone in the same program appear live for everyone else, but only after the item is submitted successfully.
7. If two people edit the same item, the last save wins and everyone's view updates.

### Flow 3: Pop Up Window ("Edit [Date]'s Events")
1. Opening the pop-up dims the background so the user can focus on it.
2. The pop-up lists that day's existing items (events first), each with Edit and Delete buttons. Delete asks "Are you sure?" before removing.
3. The user can choose "Add Lesson Plan" or "Add Event".
4. **Add Lesson Plan:** the pop-up refreshes to show:
    - Lesson type: exactly one of STEM, Art, Education, Sports
    - Title
    - Description text box. Lines starting with "-" display as bullet points. Materials needed go here.
    - Submit button. The calendar only updates after Submit.
5. **Add Event:** the pop-up refreshes to show:
    - Title
    - Description
    - Submit button. The calendar only updates after Submit.
6. Items are date only (no times).

### Flow 4: Header, Change Password, And Exit
1. Header shows the program name on the left and the "Change password" and "Logout" buttons on the right.
2. Change password: enter the current password, then the new password twice. Other people already logged in stay logged in.
3. Logout returns the user to `/login`.

## Keywords
- Lesson Plan
    - STEM -> blue badge
    - Education -> purple badge
    - Art -> yellow badge
    - Sports -> green badge
- Event
    - Title and description only (no event types)

## Visual And UI Guidelines
- **Design Aesthetic:** clean and cute
- **Color Palette:**
    - Primary: #99C3E4
    - Accent1: #FFF9E6
    - Accent2: #C1E4F3
    - Background: #E3F1FB
- **Calendar look:** rebuilt in code (not used as an image) to match the reference template: scalloped cloud header in light blue with grey shadow, white day-name bar with teal text and a light blue offset shadow, white cells with light blue grid lines.
- **Sheep motif:** an original sheep drawn for this project (white fluffy scalloped head, navy outline, pale peach face, pink cheeks, small ears). Used as:
    - A seamless repeating background tile on #E3F1FB, closely spaced, each sheep slightly tilted, faded enough that calendar text stays readable
    - The icon on the login page's program dropdown button
- **Reference images:** calendar template screenshot and sheep wallpaper screenshot (reference only; the sheep wallpaper is someone else's artwork and is not used in the app).
